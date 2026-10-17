import { expect } from "chai"
import "reflect-metadata"
import sinon from "sinon"
import {
    DataSource,
    EventSubscriber,
    QueryFailedError,
    TypeORMError,
} from "../../../../src"
import type { EntitySubscriberInterface, QueryRunner } from "../../../../src"
import type { AfterQueryEvent } from "../../../../src/subscriber/event/QueryEvent"
import type { TransactionStartEvent } from "../../../../src/subscriber/event/TransactionStartEvent"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"

describe("transaction > nested transaction start failure", () => {
    const failBeforeStart = new WeakSet<QueryRunner>()
    const failAfterStart = new WeakSet<QueryRunner>()
    const failSavepointAfterQuery = new WeakSet<QueryRunner>()

    @EventSubscriber()
    class StartSubscriber implements EntitySubscriberInterface {
        beforeTransactionStart(event: TransactionStartEvent): void {
            if (failBeforeStart.has(event.queryRunner)) {
                failBeforeStart.delete(event.queryRunner)
                throw new Error("beforeTransactionStart failed")
            }
        }

        async afterTransactionStart(
            event: TransactionStartEvent,
        ): Promise<void> {
            if (!failAfterStart.has(event.queryRunner)) return
            failAfterStart.delete(event.queryRunner)
            await event.manager
                .createQueryBuilder()
                .insert()
                .into(Post)
                .values({ title: "written-by-subscriber" })
                .execute()
            throw new Error("afterTransactionStart failed")
        }

        afterQuery(event: AfterQueryEvent): Promise<void> | void {
            if (
                failSavepointAfterQuery.has(event.queryRunner) &&
                /^SAVEPOINT typeorm_\d+$/.test(event.query) &&
                event.success
            ) {
                failSavepointAfterQuery.delete(event.queryRunner)
                return Promise.reject(
                    new Error("afterQuery rejected the SAVEPOINT"),
                )
            }
        }
    }

    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            subscribers: [StartSubscriber],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: [
                "better-sqlite3",
                "cockroachdb",
                "mariadb",
                "mysql",
                "postgres",
                "sqljs",
            ],
            driverSpecific: { poolSize: 1 },
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterEach(() => sinon.restore())
    after(() => closeTestingConnections(dataSources))

    async function committed(dataSource: DataSource): Promise<string[]> {
        const read = async (source: DataSource) => {
            const posts = await source.manager.find(Post, {
                order: { id: "ASC" },
            })
            return posts.map((post) => post.title)
        }
        // sql.js keeps one in-memory database, so a second pool would not see it.
        // An open transaction there makes the following BEGIN fail.
        if (dataSource.options.type === "sqljs") return read(dataSource)

        const reader = new DataSource({
            ...dataSource.options,
            synchronize: false,
            migrationsRun: false,
            dropSchema: false,
            subscribers: [],
        })
        await reader.initialize()
        try {
            return await read(reader)
        } finally {
            await reader.destroy()
        }
    }

    function nextUnitOfWork(dataSource: DataSource) {
        return dataSource.transaction((manager) =>
            manager.save(Post, { title: "next-request" }),
        )
    }

    function failSavepointBeforeSend(queryRunner: QueryRunner) {
        const query = queryRunner.query.bind(queryRunner)
        const sent: string[] = []
        sinon.stub(queryRunner, "query").callsFake((sql: string, ...rest) => {
            if (/^SAVEPOINT typeorm_\d+$/.test(sql)) {
                sent.push(`${sql} (not sent)`)
                return Promise.reject(new Error(`injected failure: ${sql}`))
            }
            sent.push(sql)
            return query(sql, ...rest)
        })
        return sent
    }

    it("should keep the caller's transaction when a nested start fails validation", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.transaction(async (manager) => {
                    await manager.save(Post, { title: "outer" })
                    const error = await manager
                        .transaction("SNAPSHOT", (nested) =>
                            nested.save(Post, { title: "nested" }),
                        )
                        .catch((caught: unknown) => caught)
                    expect(error).to.be.instanceOf(TypeORMError)
                    expect(manager.queryRunner!.isTransactionActive).to.be.true
                    await manager.save(Post, { title: "after" })
                })

                expect(await committed(dataSource)).to.deep.equal([
                    "outer",
                    "after",
                ])
                await nextUnitOfWork(dataSource)
                expect(await committed(dataSource)).to.deep.equal([
                    "outer",
                    "after",
                    "next-request",
                ])
            }),
        ))

    it("should keep the caller's transaction when beforeTransactionStart fails", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.transaction(async (manager) => {
                    await manager.save(Post, { title: "outer" })
                    failBeforeStart.add(manager.queryRunner!)
                    const error = await manager
                        .transaction((nested) =>
                            nested.save(Post, { title: "nested" }),
                        )
                        .catch((caught: unknown) => caught)
                    expect(error).to.be.instanceOf(Error)
                    expect((error as Error).message).to.equal(
                        "beforeTransactionStart failed",
                    )
                    expect(manager.queryRunner!.isTransactionActive).to.be.true
                    await manager.save(Post, { title: "after" })
                })

                expect(await committed(dataSource)).to.deep.equal([
                    "outer",
                    "after",
                ])
                await nextUnitOfWork(dataSource)
                expect(await committed(dataSource)).to.deep.equal([
                    "outer",
                    "after",
                    "next-request",
                ])
            }),
        ))

    it("should keep the caller's transaction when a nested savepoint is never sent", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                let sent: string[] = []
                await dataSource.transaction(async (manager) => {
                    await manager.save(Post, { title: "outer" })
                    sent = failSavepointBeforeSend(manager.queryRunner!)
                    const error = await manager
                        .transaction((nested) =>
                            nested.save(Post, { title: "nested" }),
                        )
                        .catch((caught: unknown) => caught)
                    expect(error).to.be.instanceOf(Error)
                    expect(manager.queryRunner!.isTransactionActive).to.be.true
                    await manager.save(Post, { title: "after" })
                })

                expect(sent.some((sql) => sql === "ROLLBACK")).to.be.false
                expect(await committed(dataSource)).to.deep.equal([
                    "outer",
                    "after",
                ])
                await nextUnitOfWork(dataSource)
                expect(await committed(dataSource)).to.deep.equal([
                    "outer",
                    "after",
                    "next-request",
                ])
            }),
        ))

    it("should undo a savepoint whose statement ran and then afterQuery failed", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.transaction(async (manager) => {
                    await manager.save(Post, { title: "outer" })
                    failSavepointAfterQuery.add(manager.queryRunner!)
                    const error = await manager
                        .transaction((nested) =>
                            nested.save(Post, { title: "nested" }),
                        )
                        .catch((caught: unknown) => caught)
                    expect(error).to.be.instanceOf(Error)
                    expect((error as Error).message).to.equal(
                        "afterQuery rejected the SAVEPOINT",
                    )
                    expect(manager.queryRunner!.isTransactionActive).to.be.true
                    await manager.save(Post, { title: "after" })
                })

                expect(await committed(dataSource)).to.deep.equal([
                    "outer",
                    "after",
                ])
                await nextUnitOfWork(dataSource)
                expect(await committed(dataSource)).to.deep.equal([
                    "outer",
                    "after",
                    "next-request",
                ])
            }),
        ))

    it("should not commit later writes when a nested start fails inside an aborted transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const type = dataSource.options.type
                if (type !== "postgres" && type !== "cockroachdb") return

                const error = await dataSource
                    .transaction(async (manager) => {
                        await manager.save(Post, { title: "outer" })
                        await manager.query("SELECT 1/0").catch(() => undefined)
                        await manager
                            .transaction((nested) =>
                                nested.save(Post, { title: "nested" }),
                            )
                            .catch(() => undefined)
                        await manager.save(Post, { title: "after" })
                    })
                    .catch((caught: unknown) => caught)

                expect(error).to.be.instanceOf(QueryFailedError)
                expect(await committed(dataSource)).to.be.empty
                await nextUnitOfWork(dataSource)
                expect(await committed(dataSource)).to.deep.equal([
                    "next-request",
                ])
            }),
        ))

    it("should roll back only the new level when afterTransactionStart fails", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.transaction(async (manager) => {
                    await manager.save(Post, { title: "outer" })
                    failAfterStart.add(manager.queryRunner!)
                    const error = await manager
                        .transaction((nested) =>
                            nested.save(Post, { title: "nested" }),
                        )
                        .catch((caught: unknown) => caught)
                    expect(error).to.be.instanceOf(Error)
                    expect((error as Error).message).to.equal(
                        "afterTransactionStart failed",
                    )
                    expect(manager.queryRunner!.isTransactionActive).to.be.true
                    await manager.save(Post, { title: "after" })
                })

                expect(await committed(dataSource)).to.deep.equal([
                    "outer",
                    "after",
                ])
                await nextUnitOfWork(dataSource)
                expect(await committed(dataSource)).to.deep.equal([
                    "outer",
                    "after",
                    "next-request",
                ])
            }),
        ))

    it("should still roll back a nested transaction whose callback fails", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.transaction(async (manager) => {
                    await manager.save(Post, { title: "outer" })
                    await manager
                        .transaction(async (nested) => {
                            await nested.save(Post, { title: "inner" })
                            throw new Error("inner unit failed")
                        })
                        .catch(() => undefined)
                })

                expect(await committed(dataSource)).to.deep.equal(["outer"])
            }),
        ))

    it("should not open a transaction when a top-level beforeTransactionStart fails", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                failBeforeStart.add(queryRunner)
                const error = await queryRunner
                    .startTransaction()
                    .catch((caught: unknown) => caught)
                expect(error).to.be.instanceOf(Error)
                expect(queryRunner.isTransactionActive).to.be.false
                await queryRunner.release()

                await nextUnitOfWork(dataSource)
                expect(await committed(dataSource)).to.deep.equal([
                    "next-request",
                ])
            }),
        ))
})
