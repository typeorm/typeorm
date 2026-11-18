import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { EntitySchema } from "../../../../src/entity-schema/EntitySchema"
import { TransactionAlreadyStartedError } from "../../../../src/error/TransactionAlreadyStartedError"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"

const Account = new EntitySchema<any>({
    name: "Account",
    tableName: "pgtx_account",
    columns: {
        id: { type: "varchar", length: 36, primary: true, generated: "uuid" },
        name: { type: "varchar", length: 10 },
    },
    relations: {
        movements: {
            type: "one-to-many",
            target: "Movement",
            inverseSide: "account",
            cascade: true,
        },
    },
})

const Movement = new EntitySchema<any>({
    name: "Movement",
    tableName: "pgtx_movement",
    columns: {
        id: { type: "varchar", length: 36, primary: true, generated: "uuid" },
        // short on purpose, so a long value makes the insert fail
        note: { type: "varchar", length: 10 },
    },
    relations: {
        account: {
            type: "many-to-one",
            target: "Account",
            joinColumn: { name: "accountId" },
            inverseSide: "movements",
        },
    },
})

describe("driver > spanner-postgres > transactions", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["spanner-postgres"],
            entities: [Account, Movement],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    const forEachDataSource = (fn: (dataSource: DataSource) => Promise<any>) =>
        Promise.all(dataSources.map(fn))

    it("should commit a transaction", () =>
        forEachDataSource(async (dataSource) => {
            await dataSource.transaction(async (manager) => {
                await manager.getRepository("Account").insert({ name: "a" })
                await manager.getRepository("Account").insert({ name: "b" })
            })

            expect(await dataSource.getRepository("Account").count()).to.equal(
                2,
            )
        }))

    it("should roll back a transaction that throws", () =>
        forEachDataSource(async (dataSource) => {
            await expect(
                dataSource.transaction(async (manager) => {
                    await manager.getRepository("Account").insert({ name: "a" })
                    throw new Error("boom")
                }),
            ).to.be.rejectedWith("boom")

            expect(await dataSource.getRepository("Account").count()).to.equal(
                0,
            )
        }))

    it("should read its own writes, hidden from others until commit", () =>
        forEachDataSource(async (dataSource) => {
            const queryRunner = dataSource.createQueryRunner()
            await queryRunner.startTransaction()
            await queryRunner.manager
                .getRepository("Account")
                .insert({ name: "a" })

            expect(
                await queryRunner.manager.getRepository("Account").count(),
            ).to.equal(1)
            expect(await dataSource.getRepository("Account").count()).to.equal(
                0,
            )

            await queryRunner.commitTransaction()
            expect(await dataSource.getRepository("Account").count()).to.equal(
                1,
            )
            await queryRunner.release()
        }))

    it("should roll back with a query runner", () =>
        forEachDataSource(async (dataSource) => {
            const queryRunner = dataSource.createQueryRunner()
            await queryRunner.startTransaction()
            await queryRunner.manager
                .getRepository("Account")
                .insert({ name: "a" })
            await queryRunner.rollbackTransaction()
            await queryRunner.release()

            expect(await dataSource.getRepository("Account").count()).to.equal(
                0,
            )
        }))

    it("should throw on a nested transaction, keeping the outer one active", () =>
        forEachDataSource(async (dataSource) => {
            const queryRunner = dataSource.createQueryRunner()
            await queryRunner.startTransaction()
            await queryRunner.manager
                .getRepository("Account")
                .insert({ name: "a" })

            await expect(queryRunner.startTransaction()).to.be.rejectedWith(
                TransactionAlreadyStartedError,
            )
            expect(queryRunner.isTransactionActive).to.equal(true)

            await queryRunner.commitTransaction()
            await queryRunner.release()
            expect(await dataSource.getRepository("Account").count()).to.equal(
                1,
            )
        }))

    it("should throw on a transaction started while another one starts", () =>
        forEachDataSource(async (dataSource) => {
            const queryRunner = dataSource.createQueryRunner()

            const results = await Promise.allSettled([
                queryRunner.startTransaction(),
                queryRunner.startTransaction(),
            ])

            expect(results.map((result) => result.status)).to.have.members([
                "fulfilled",
                "rejected",
            ])
            const rejected = results.find(
                (result) => result.status === "rejected",
            ) as PromiseRejectedResult
            expect(rejected.reason).to.be.instanceOf(
                TransactionAlreadyStartedError,
            )

            await queryRunner.rollbackTransaction()
            await queryRunner.release()
        }))

    it("should throw on an EntityManager transaction nested in the same query runner", () =>
        forEachDataSource(async (dataSource) => {
            const queryRunner = dataSource.createQueryRunner()
            await queryRunner.startTransaction()
            await queryRunner.manager
                .getRepository("Account")
                .insert({ name: "a" })

            await expect(
                queryRunner.manager.transaction(async () => {}),
            ).to.be.rejectedWith(TransactionAlreadyStartedError)
            await queryRunner.release()
        }))

    it("should support SERIALIZABLE and REPEATABLE READ, not READ COMMITTED", () =>
        forEachDataSource(async (dataSource) => {
            for (const level of ["SERIALIZABLE", "REPEATABLE READ"] as const) {
                await dataSource.transaction(level, async (manager) => {
                    await manager
                        .getRepository("Account")
                        .insert({ name: level.slice(0, 8) })
                })
            }
            expect(await dataSource.getRepository("Account").count()).to.equal(
                2,
            )

            await expect(
                dataSource.transaction("READ COMMITTED", async () => {}),
            ).to.be.rejectedWith(/isolation/i)
        }))

    it("should make save() with a cascade atomic", () =>
        forEachDataSource(async (dataSource) => {
            const repository = dataSource.getRepository("Account")

            // the second movement is too long for its column
            await expect(
                repository.save(
                    repository.create({
                        name: "failing",
                        movements: [
                            { note: "ok" },
                            { note: "this note is too long for varchar(10)" },
                        ],
                    }),
                ),
            ).to.be.rejected
            expect(await repository.count()).to.equal(0)

            const saved = await repository.save(
                repository.create({
                    name: "good",
                    movements: [{ note: "n1" }, { note: "n2" }],
                }),
            )
            expect(await repository.count()).to.equal(1)
            expect(await dataSource.getRepository("Movement").count()).to.equal(
                2,
            )
            expect(saved.movements.every((m: any) => m.id.length === 36)).to.be
                .true
        }))

    it("should leave the query runner usable after a failing implicit write", () =>
        forEachDataSource(async (dataSource) => {
            const queryRunner = dataSource.createQueryRunner()
            await queryRunner.query(
                `INSERT INTO "pgtx_account" ("id", "name") VALUES ('dup', 'a')`,
            )
            await expect(
                queryRunner.query(
                    `INSERT INTO "pgtx_account" ("id", "name") VALUES ('dup', 'b')`,
                ),
            ).to.be.rejected

            await queryRunner.query(
                `UPDATE "pgtx_account" SET "name" = 'c' WHERE "id" = 'dup'`,
            )
            expect(
                await queryRunner.query(`SELECT "name" FROM "pgtx_account"`),
            ).to.deep.equal([{ name: "c" }])
            await queryRunner.release()
        }))

    it("should apply the default isolation level to implicit writes", async () => {
        const isolated = await createTestingConnections({
            enabledDrivers: ["spanner-postgres"],
            entities: [Account, Movement],
            driverSpecific: { isolationLevel: "REPEATABLE READ" },
        })
        try {
            await Promise.all(
                isolated.map(async (dataSource) => {
                    await dataSource
                        .getRepository("Account")
                        .insert({ name: "iso" })
                    expect(
                        await dataSource.getRepository("Account").count(),
                    ).to.equal(1)
                }),
            )
        } finally {
            await closeTestingConnections(isolated)
        }
    })
})
