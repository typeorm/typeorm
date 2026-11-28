import "reflect-metadata"
import { expect } from "chai"
import sinon from "sinon"
import { finished } from "stream/promises"
import { DataSource } from "../../../../src"
import type { BeforeQueryEvent, QueryRunner } from "../../../../src"
import {
    closeTestingConnections,
    setupTestingConnections,
} from "../../../utils/test-utils"

describe("query builder > PostgreSQL transactional streams", () => {
    let dataSources: DataSource[]
    const backendPid = (dataSource: DataSource) =>
        dataSource.query("SELECT pg_backend_pid() AS pid")

    before(async () => {
        dataSources = setupTestingConnections({
            enabledDrivers: ["postgres", "cockroachdb"],
        }).map(
            (options) =>
                new DataSource({
                    ...options,
                    extra: {
                        ...options.extra,
                        max: 1,
                        connectionTimeoutMillis: 2000,
                    },
                }),
        )
        for (const dataSource of dataSources) await dataSource.initialize()
    })
    after(() => closeTestingConnections(dataSources))

    it("should stream inside a transaction without deadlocking and release the runner after end", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const createRunner = sinon.spy(dataSource, "createQueryRunner")
                let queryRunner: QueryRunner | undefined
                try {
                    const stream = await dataSource
                        .createQueryBuilder()
                        .select("value")
                        .from(
                            "(SELECT generate_series(1, 250) AS value)",
                            "rows",
                        )
                        .useTransaction(true)
                        .stream()

                    queryRunner = createRunner.lastCall.returnValue
                    expect(queryRunner!.isTransactionActive).to.equal(true)
                    expect(queryRunner!.isReleased).to.equal(false)

                    let count = 0
                    await new Promise<void>((resolve, reject) => {
                        stream.on("data", () => {
                            count++
                        })
                        stream.on("end", resolve)
                        stream.on("error", reject)
                    })

                    expect(count).to.equal(250)

                    // Pool size is 1: a follow-up query succeeds only if commit + release completed.
                    const check = await dataSource.query(
                        "SELECT 1::int4 AS value",
                    )
                    expect(check).to.deep.equal([{ value: 1 }])
                    expect(queryRunner!.isTransactionActive).to.equal(false)
                    expect(queryRunner!.isReleased).to.equal(true)
                } finally {
                    createRunner.restore()
                    if (queryRunner && !queryRunner.isReleased)
                        await queryRunner.release()
                }
            }),
        ))

    it("should finish cancellation before reusing a supplied runner", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const runner = dataSource.createQueryRunner()
                try {
                    const stream = await dataSource
                        .createQueryBuilder(runner)
                        .select("value")
                        .from(
                            "(SELECT generate_series(1, 250) AS value)",
                            "rows",
                        )
                        .useTransaction(true)
                        .stream()
                    const done = finished(stream)
                    stream.destroy()
                    await expect(done).to.be.rejectedWith(/premature close/i)
                    expect(runner.isTransactionActive).to.equal(false)
                    expect(
                        await runner.query("SELECT 1::int4 AS value"),
                    ).to.deep.equal([{ value: 1 }])
                } finally {
                    await runner.release()
                }
            }),
        ))

    it("should allow a supplied runner to start again after BEGIN fails", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const runner = dataSource.createQueryRunner()
                const failure = new Error("begin failed")
                const subscriber = {
                    beforeQuery(event: BeforeQueryEvent) {
                        if (event.query === "START TRANSACTION") throw failure
                    },
                }
                dataSource.subscribers.push(subscriber)
                try {
                    try {
                        await expect(
                            dataSource
                                .createQueryBuilder(runner)
                                .select("1")
                                .from("unused_table", "t")
                                .useTransaction(true)
                                .stream(),
                        ).to.be.rejectedWith(failure)
                    } finally {
                        dataSource.subscribers.splice(
                            dataSource.subscribers.indexOf(subscriber),
                            1,
                        )
                    }
                    await runner.startTransaction()
                    await runner.rollbackTransaction()
                } finally {
                    await runner.release()
                }
            }),
        ))

    it("should discard the connection when a partially started transaction cannot roll back", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const previous = await backendPid(dataSource)
                const failure = new Error("after start failed")
                const subscriber = {
                    afterTransactionStart() {
                        throw failure
                    },
                    beforeTransactionRollback() {
                        throw new Error("rollback failed")
                    },
                }
                dataSource.subscribers.push(subscriber)
                try {
                    await expect(
                        dataSource
                            .createQueryBuilder()
                            .select("1")
                            .from("unused_table", "t")
                            .useTransaction(true)
                            .stream(),
                    ).to.be.rejectedWith(failure)
                    expect(await backendPid(dataSource)).not.to.deep.equal(
                        previous,
                    )
                } finally {
                    dataSource.subscribers.splice(
                        dataSource.subscribers.indexOf(subscriber),
                        1,
                    )
                }
            }),
        ))

    it("should rollback and release the runner when a transactional stream errors", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const createRunner = sinon.spy(dataSource, "createQueryRunner")
                let queryRunner: QueryRunner | undefined
                try {
                    const stream = await dataSource
                        .createQueryBuilder()
                        .select("1 / (value - 5)", "ratio")
                        .from(
                            "(SELECT generate_series(1, 10) AS value)",
                            "rows",
                        )
                        .useTransaction(true)
                        .stream()

                    queryRunner = createRunner.lastCall.returnValue
                    const error = await new Promise<Error | null>((resolve) => {
                        stream.on("data", () => {})
                        stream.on("error", (err: Error) => resolve(err))
                        stream.on("end", () => resolve(null))
                    })

                    expect(error).to.be.instanceOf(Error)

                    const check = await dataSource.query(
                        "SELECT 1::int4 AS value",
                    )
                    expect(check).to.deep.equal([{ value: 1 }])
                    expect(queryRunner!.isTransactionActive).to.equal(false)
                    expect(queryRunner!.isReleased).to.equal(true)
                } finally {
                    createRunner.restore()
                    if (queryRunner && !queryRunner.isReleased)
                        await queryRunner.release()
                }
            }),
        ))

    for (const commit of [true, false]) {
        const hook = commit
            ? "afterTransactionCommit"
            : "afterTransactionRollback"
        it(`should discard an owned client if ${hook} starts another transaction`, () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const previous = await backendPid(dataSource)
                    const subscriber = {
                        [hook]: ({
                            queryRunner,
                        }: {
                            queryRunner: QueryRunner
                        }) => queryRunner.startTransaction(),
                    }
                    dataSource.subscribers.push(subscriber)
                    try {
                        const stream = await dataSource
                            .createQueryBuilder()
                            .select(commit ? "1" : "missing_column")
                            .from("(SELECT 1)", "rows")
                            .useTransaction(true)
                            .stream()
                        const done = finished(stream)
                        stream.resume()
                        if (commit) await done
                        else
                            await expect(done).to.be.rejectedWith(
                                /missing_column/,
                            )
                        expect(await backendPid(dataSource)).not.to.deep.equal(
                            previous,
                        )
                    } finally {
                        dataSource.subscribers.splice(
                            dataSource.subscribers.indexOf(subscriber),
                            1,
                        )
                    }
                }),
            ))
    }
})
