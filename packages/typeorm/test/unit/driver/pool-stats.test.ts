import { expect } from "chai"
import sinon from "sinon"
import { DataSource } from "../../../src/data-source/DataSource"
import { CannotExecuteNotConnectedError } from "../../../src/error/CannotExecuteNotConnectedError"
import { DriverUtils } from "../../../src/driver/DriverUtils"
import { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import { CockroachDriver } from "../../../src/driver/cockroachdb/CockroachDriver"
import { SqlServerDriver } from "../../../src/driver/sqlserver/SqlServerDriver"
import { OracleDriver } from "../../../src/driver/oracle/OracleDriver"
import { AuroraPostgresDriver } from "../../../src/driver/aurora-postgres/AuroraPostgresDriver"
import type { PoolStats } from "../../../src"

// https://github.com/typeorm/typeorm/issues/12927
describe("connection pool statistics", () => {
    describe("DataSource.getPoolStats", () => {
        it("should require an initialized data source", () => {
            const dataSource = new DataSource({ type: "sqljs" })
            const getPoolStats = sinon.stub().returns({ total: 1 })
            dataSource.driver.getPoolStats = getPoolStats

            expect(() => dataSource.getPoolStats()).to.throw(
                CannotExecuteNotConnectedError,
            )
            expect(getPoolStats.called).to.be.false
        })

        it("should return undefined for an initialized driver without pool statistics", async () => {
            const dataSource = new DataSource({ type: "sqljs" })
            await dataSource.initialize()
            try {
                expect(dataSource.getPoolStats()).to.be.undefined
            } finally {
                await dataSource.destroy()
            }
            expect(() => dataSource.getPoolStats()).to.throw(
                CannotExecuteNotConnectedError,
            )
        })

        it("should delegate to the driver with its receiver and preserve partial metrics", async () => {
            const dataSource = new DataSource({ type: "sqljs" })
            const stats: PoolStats = { total: 2, active: 1 }
            const getPoolStats = sinon.stub().returns(stats)
            dataSource.driver.getPoolStats = getPoolStats
            await dataSource.initialize()
            try {
                expect(dataSource.getPoolStats()).to.equal(stats)
                expect(getPoolStats.calledOnce).to.be.true
                expect(getPoolStats.calledOn(dataSource.driver)).to.be.true
            } finally {
                await dataSource.destroy()
            }
            getPoolStats.resetHistory()
            expect(() => dataSource.getPoolStats()).to.throw(
                CannotExecuteNotConnectedError,
            )
            expect(getPoolStats.called).to.be.false
        })

        it("should preserve undefined returned by a driver", async () => {
            const dataSource = new DataSource({ type: "sqljs" })
            dataSource.driver.getPoolStats = () => undefined
            await dataSource.initialize()
            try {
                expect(dataSource.getPoolStats()).to.be.undefined
            } finally {
                await dataSource.destroy()
            }
        })
    })

    describe("DriverUtils.aggregatePoolStats", () => {
        it("should return undefined when there are no pools", () => {
            expect(DriverUtils.aggregatePoolStats([])).to.be.undefined
        })

        it("should omit metrics unavailable from any pool", () => {
            expect(
                DriverUtils.aggregatePoolStats([
                    { total: 3, active: 1, idle: 2, waiting: 4 },
                    { total: 2, active: 0, idle: 2 },
                ]),
            ).to.deep.equal({ total: 5, active: 1, idle: 4 })
        })

        it("should preserve zero metrics and not mutate its inputs", () => {
            const pool = Object.freeze({
                total: 0,
                active: 0,
                idle: 0,
                waiting: 0,
            })
            const stats = DriverUtils.aggregatePoolStats([pool])!
            expect(stats).to.deep.equal(pool)
            expect(stats).not.to.equal(pool)
            stats.total = 10
            expect(pool.total).to.equal(0)
        })
    })

    for (const DriverClass of [PostgresDriver, CockroachDriver]) {
        describe(DriverClass.name, () => {
            // Avoid connecting or loading dependencies; these tests exercise
            // the real driver method with controlled pool counters.
            const createDriver = (): PostgresDriver | CockroachDriver =>
                Object.assign(Object.create(DriverClass.prototype), {
                    master: undefined,
                    slaves: [],
                })

            it("should return undefined when no pool exists", () => {
                expect(createDriver().getPoolStats()).to.be.undefined
            })

            it("should expose current counters without acquiring a connection", () => {
                const driver = createDriver()
                const connect = sinon.spy()
                const pool = {
                    totalCount: 5,
                    idleCount: 2,
                    waitingCount: 3,
                    connect,
                }
                driver.master = pool
                const snapshot = driver.getPoolStats()
                expect(snapshot).to.deep.equal({
                    total: 5,
                    active: 3,
                    idle: 2,
                    waiting: 3,
                })

                pool.idleCount = 4
                pool.waitingCount = 0
                expect(driver.getPoolStats()).to.deep.equal({
                    total: 5,
                    active: 1,
                    idle: 4,
                    waiting: 0,
                })
                expect(snapshot).to.deep.equal({
                    total: 5,
                    active: 3,
                    idle: 2,
                    waiting: 3,
                })
                expect(connect.called).to.be.false
            })

            it("should sum the primary and all replica pools", () => {
                const driver = createDriver()
                driver.master = { totalCount: 4, idleCount: 1, waitingCount: 2 }
                driver.slaves = [
                    { totalCount: 3, idleCount: 2, waitingCount: 1 },
                    { totalCount: 0, idleCount: 0, waitingCount: 0 },
                ]
                expect(driver.getPoolStats()).to.deep.equal({
                    total: 7,
                    active: 4,
                    idle: 3,
                    waiting: 3,
                })
            })

            it("should report zeros for an empty pool", () => {
                const driver = createDriver()
                driver.master = { totalCount: 0, idleCount: 0, waitingCount: 0 }
                expect(driver.getPoolStats()).to.deep.equal({
                    total: 0,
                    active: 0,
                    idle: 0,
                    waiting: 0,
                })
            })
        })
    }

    describe("SqlServerDriver", () => {
        it("should return undefined when no pool exists", () => {
            const driver: SqlServerDriver = Object.create(
                SqlServerDriver.prototype,
            )
            expect(driver.getPoolStats()).to.be.undefined
        })

        it("should use public pool counters including pending creations in total", () => {
            const driver: SqlServerDriver = Object.assign(
                Object.create(SqlServerDriver.prototype),
                {
                    master: { size: 5, borrowed: 2, available: 1, pending: 3 },
                    slaves: [
                        { size: 4, borrowed: 1, available: 2, pending: 1 },
                        { size: 0, borrowed: 0, available: 0, pending: 0 },
                    ],
                },
            )
            expect(driver.getPoolStats()).to.deep.equal({
                total: 9,
                active: 3,
                idle: 3,
                waiting: 4,
            })
        })
    })

    describe("OracleDriver", () => {
        it("should return undefined when no pool exists", () => {
            const driver: OracleDriver = Object.create(OracleDriver.prototype)
            expect(driver.getPoolStats()).to.be.undefined
        })

        it("should sum open and checked-out connections without inventing a waiting count", () => {
            const driver: OracleDriver = Object.assign(
                Object.create(OracleDriver.prototype),
                {
                    master: {
                        connectionsOpen: 4,
                        connectionsInUse: 1,
                        getStatistics: () => null,
                    },
                    slaves: [
                        {
                            connectionsOpen: 3,
                            connectionsInUse: 2,
                            getStatistics: () => null,
                        },
                        {
                            connectionsOpen: 0,
                            connectionsInUse: 0,
                            getStatistics: () => null,
                        },
                    ],
                },
            )
            expect(driver.getPoolStats()).to.deep.equal({
                total: 7,
                active: 3,
                idle: 4,
            })
        })

        it("should expose waiting requests when statistics are enabled on all pools", () => {
            const driver: OracleDriver = Object.assign(
                Object.create(OracleDriver.prototype),
                {
                    master: {
                        connectionsOpen: 4,
                        connectionsInUse: 4,
                        getStatistics: () => ({ currentQueueLength: 2 }),
                    },
                    slaves: [
                        {
                            connectionsOpen: 3,
                            connectionsInUse: 3,
                            getStatistics: () => ({ currentQueueLength: 1 }),
                        },
                    ],
                },
            )
            expect(driver.getPoolStats()).to.deep.equal({
                total: 7,
                active: 7,
                idle: 0,
                waiting: 3,
            })

            driver.slaves[0].getStatistics = () => null
            expect(driver.getPoolStats()).to.deep.equal({
                total: 7,
                active: 7,
                idle: 0,
            })
        })
    })

    it("should return undefined for the Aurora PostgreSQL Data API driver", () => {
        const driver: AuroraPostgresDriver = Object.create(
            AuroraPostgresDriver.prototype,
        )
        expect(driver.getPoolStats()).to.be.undefined
    })
})
