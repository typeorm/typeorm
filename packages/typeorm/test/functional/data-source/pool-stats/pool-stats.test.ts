import { expect } from "chai"
import { DataSource } from "../../../../src/data-source/DataSource"
import type { DataSourceOptions } from "../../../../src/data-source/DataSourceOptions"
import {
    closeTestingConnections,
    setupTestingConnections,
} from "../../../utils/test-utils"

// https://github.com/typeorm/typeorm/issues/12927
describe("DataSource > connection pool statistics", () => {
    let dataSources: DataSource[]

    before(async () => {
        const options = setupTestingConnections({
            enabledDrivers: ["postgres", "cockroachdb", "mssql", "oracle"],
            entities: [],
        })
        dataSources = []
        for (const connectionOptions of options) {
            let dataSource: DataSource
            if (connectionOptions.type === "mssql") {
                const pool = {
                    ...connectionOptions.pool,
                    ...connectionOptions.extra?.pool,
                    max: 1,
                    min: 0,
                }
                dataSource = new DataSource({
                    ...connectionOptions,
                    pool,
                    extra: { ...connectionOptions.extra, pool },
                })
            } else if (
                connectionOptions.type === "postgres" ||
                connectionOptions.type === "cockroachdb" ||
                connectionOptions.type === "oracle"
            ) {
                dataSource = new DataSource({
                    ...connectionOptions,
                    poolSize: 1,
                    extra: {
                        ...connectionOptions.extra,
                        ...(connectionOptions.type === "oracle"
                            ? { poolMax: 1, poolMin: 0 }
                            : { max: 1 }),
                    },
                })
            } else {
                continue
            }
            await dataSource.initialize()
            dataSources.push(dataSource)
        }
    })
    after(() => closeTestingConnections(dataSources))

    it("should reflect a connection being checked out and released", async () => {
        for (const dataSource of dataSources) {
            const before = dataSource.getPoolStats()!
            const queryRunner = dataSource.createQueryRunner("master")
            try {
                await queryRunner.connect()
                // SQL Server checks out a connection when a transaction begins,
                // rather than when QueryRunner.connect() is called.
                await queryRunner.startTransaction()
                const acquired = dataSource.getPoolStats()!
                expect(acquired.active).to.equal(before.active! + 1)
                expect(acquired.total).to.be.at.least(acquired.active!)
                expect(acquired.idle).to.equal(0)
                await queryRunner.rollbackTransaction()
                await queryRunner.release()

                const released = dataSource.getPoolStats()!
                expect(released.active).to.equal(before.active)
                expect(released.idle).to.equal(1)
                expect(acquired.active).to.equal(before.active! + 1)
            } finally {
                if (queryRunner.isTransactionActive)
                    await queryRunner.rollbackTransaction()
                if (!queryRunner.isReleased) await queryRunner.release()
            }
        }
    })

    it("should report a waiting request when the pool is saturated", async () => {
        for (const dataSource of dataSources) {
            if (dataSource.getPoolStats()!.waiting === undefined) continue

            const heldRunner = dataSource.createQueryRunner("master")
            const waitingRunner = dataSource.createQueryRunner("master")
            let pending: Promise<unknown> | undefined
            let acquisitionFinished = false
            try {
                await heldRunner.connect()
                await heldRunner.startTransaction()
                pending = waitingRunner.startTransaction().finally(() => {
                    acquisitionFinished = true
                })
                while (
                    !acquisitionFinished &&
                    dataSource.getPoolStats()!.waiting === 0
                ) {
                    await new Promise<void>((resolve) => setImmediate(resolve))
                }
                expect(dataSource.getPoolStats()).to.deep.equal({
                    total: 1,
                    active: 1,
                    idle: 0,
                    waiting: 1,
                })

                await heldRunner.rollbackTransaction()
                await heldRunner.release()
                await pending
                expect(dataSource.getPoolStats()!.waiting).to.equal(0)
                expect(dataSource.getPoolStats()!.active).to.equal(1)
            } finally {
                if (heldRunner.isTransactionActive)
                    await heldRunner.rollbackTransaction()
                if (!heldRunner.isReleased) await heldRunner.release()
                if (pending) await pending
                if (waitingRunner.isTransactionActive)
                    await waitingRunner.rollbackTransaction()
                if (!waitingRunner.isReleased) await waitingRunner.release()
            }
        }
    })

    it("should include primary and replica pools in the snapshot", async () => {
        const options = setupTestingConnections({
            enabledDrivers: ["postgres", "cockroachdb"],
        })
        for (const connectionOptions of options) {
            if (
                connectionOptions.type !== "postgres" &&
                connectionOptions.type !== "cockroachdb"
            )
                continue

            const dataSource = new DataSource({
                ...connectionOptions,
                poolSize: 1,
                replication: {
                    master: connectionOptions,
                    slaves: [connectionOptions, connectionOptions],
                },
            } as DataSourceOptions)
            await dataSource.initialize()
            const primary = dataSource.createQueryRunner("master")
            const replica = dataSource.createQueryRunner("slave")
            try {
                expect(dataSource.getPoolStats()).to.deep.equal({
                    total: 3,
                    active: 0,
                    idle: 3,
                    waiting: 0,
                })
                await primary.connect()
                await replica.connect()
                expect(dataSource.getPoolStats()).to.deep.equal({
                    total: 3,
                    active: 2,
                    idle: 1,
                    waiting: 0,
                })
            } finally {
                await primary.release()
                await replica.release()
                await dataSource.destroy()
            }
        }
    })
})
