import "reflect-metadata"
import { expect } from "chai"
import sinon from "sinon"
import { finished } from "stream/promises"
import { DataSource } from "../../../../src"
import type { BeforeQueryEvent, TransactionStartEvent } from "../../../../src"
import {
    closeTestingConnections,
    setupTestingConnections,
} from "../../../utils/test-utils"

describe("query builder > MySQL transactional streams", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = setupTestingConnections({
            enabledDrivers: ["mysql", "mariadb"],
        }).map(
            (options) =>
                new DataSource({
                    ...options,
                    extra: {
                        ...options.extra,
                        connectionLimit: 1,
                        waitForConnections: false,
                    },
                }),
        )
        for (const dataSource of dataSources) await dataSource.initialize()
    })
    after(() => closeTestingConnections(dataSources))

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
                const backend = () =>
                    dataSource.query("SELECT CONNECTION_ID() AS pid")
                const previous = await backend()
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
                    expect(await backend()).not.to.deep.equal(previous)
                } finally {
                    dataSource.subscribers.splice(
                        dataSource.subscribers.indexOf(subscriber),
                        1,
                    )
                }
            }),
        ))

    for (const event of [
        "afterTransactionCommit",
        "afterTransactionRollback",
    ] as const) {
        it(`should discard a connection left in a transaction by ${event}`, () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const backend = () =>
                        dataSource.query("SELECT CONNECTION_ID() AS pid")
                    const previous = await backend()
                    const subscriber = {
                        [event]: ({ queryRunner }: TransactionStartEvent) =>
                            queryRunner.startTransaction(),
                    }
                    dataSource.subscribers.push(subscriber)
                    try {
                        const query = dataSource
                            .createQueryBuilder()
                            .from("(SELECT 1 AS value)", "r")
                            .useTransaction(true)
                        if (event === "afterTransactionCommit") {
                            const stream = await query
                                .select("r.value")
                                .stream()
                            await finished(stream.resume())
                        } else {
                            await expect(
                                query.select("r.missing").stream(),
                            ).to.be.rejectedWith(/unknown column/i)
                        }
                        expect(await backend()).not.to.deep.equal(previous)
                    } finally {
                        dataSource.subscribers.splice(
                            dataSource.subscribers.indexOf(subscriber),
                            1,
                        )
                    }
                }),
            ))
    }

    it("should roll back a mysql2 command error before committing the transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.query(
                    "CREATE TEMPORARY TABLE stream_rollback_probe (value VARCHAR(16)) ENGINE=InnoDB",
                )
                const subscriber = {
                    afterTransactionStart({
                        queryRunner,
                    }: TransactionStartEvent) {
                        return queryRunner.query(
                            "INSERT INTO stream_rollback_probe VALUES ('pending')",
                        )
                    },
                    afterTransactionCommit: sinon.spy(),
                    afterTransactionRollback: sinon.spy(),
                }
                dataSource.subscribers.push(subscriber)
                try {
                    await expect(
                        dataSource
                            .createQueryBuilder()
                            .select("r.missing")
                            .from("(SELECT 1 AS value)", "r")
                            .useTransaction(true)
                            .stream(),
                    ).to.be.rejectedWith(/unknown column/i)
                    expect(subscriber.afterTransactionCommit.called).to.equal(
                        false,
                    )
                    expect(
                        subscriber.afterTransactionRollback.calledOnce,
                    ).to.equal(true)
                    expect(
                        await dataSource.query(
                            "SELECT value FROM stream_rollback_probe",
                        ),
                    ).to.deep.equal([])
                } finally {
                    dataSource.subscribers.splice(
                        dataSource.subscribers.indexOf(subscriber),
                        1,
                    )
                    await dataSource.query(
                        "DROP TEMPORARY TABLE IF EXISTS stream_rollback_probe",
                    )
                }
            }),
        ))
})
