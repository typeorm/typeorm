import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../../../src"
import {
    TestingOptions,
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"

describe("mysql driver > enableQueryTimeout connection option", () => {
    let dataSources: DataSource[]
    const commonConnectionOptions: TestingOptions = {
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
        enabledDrivers: ["mysql"],
    }
    const timeoutMs = 4000
    const longQueryTime = timeoutMs / 1000 + 1
    const shortQueryTime = timeoutMs / 2000

    describe("when enableQueryTimeout is true", () => {
        before(async () => {
            dataSources = await createTestingConnections({
                ...commonConnectionOptions,
                driverSpecific: {
                    enableQueryTimeout: true,
                    maxQueryExecutionTime: timeoutMs,
                },
            })
        })

        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("should throw a query execution timeout error for the query when it exceeds the maxQueryExecutionTime", async () => {
            await Promise.all(
                dataSources.map(async (dataSource) => {
                    let errorThrown = false
                    try {
                        await dataSource.manager.query(
                            `SELECT SLEEP(${longQueryTime})`,
                        )
                    } catch (err) {
                        errorThrown = true
                        expect(err).to.have.nested.property(
                            "driverError.code",
                            "PROTOCOL_SEQUENCE_TIMEOUT",
                        )
                        expect(err).to.have.nested.property(
                            "driverError.timeout",
                            timeoutMs,
                        )
                    }
                    expect(errorThrown).to.be.true
                }),
            )
        })

        it("should not throw a query execution timeout error for the query when it runs within the maxQueryExecutionTime", async () => {
            await Promise.all(
                dataSources.map(async (dataSource) => {
                    let errorThrown = false
                    try {
                        await dataSource.manager.query(
                            `SELECT SLEEP(${shortQueryTime})`,
                        )
                    } catch (err) {
                        errorThrown = true
                    }
                    expect(errorThrown).to.be.false
                }),
            )
        })
    })

    describe("when enableQueryTimeout is not provided", () => {
        let datasources: DataSource[]

        before(async () => {
            datasources = await createTestingConnections({
                ...commonConnectionOptions,
                driverSpecific: { maxQueryExecutionTime: timeoutMs },
            })
        })

        after(() => closeTestingConnections(datasources))

        it("should not throw a query execution timeout error", () => {
            Promise.all(
                datasources.map(async (dataSource) => {
                    let errorThrown = false
                    try {
                        await dataSource.manager.query(
                            `SELECT SLEEP(${longQueryTime})`,
                        )
                    } catch (err) {
                        errorThrown = true
                    }
                    expect(errorThrown).to.be.false
                }),
            )
        })
    })
})
