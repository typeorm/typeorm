import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../../../src"
import {
    TestingOptions,
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"

describe("driver > mysql > connection options > enableQueryTimeout", () => {
    let dataSources: DataSource[]
    const commonConnectionOptions: TestingOptions = {
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
        enabledDrivers: ["mysql"],
    }
    const timeoutMs = 150
    const longQueryTimeSec = 0.2
    const shortQueryTimeSec = 0.005

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

        it("should throw a query execution timeout error for the query when it exceeds the maxQueryExecutionTime", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await expect(
                        dataSource.manager
                            .sql`SELECT SLEEP(${longQueryTimeSec})`,
                    ).to.eventually.be.rejected.then((err) => {
                        expect(err).to.have.nested.property(
                            "driverError.code",
                            "PROTOCOL_SEQUENCE_TIMEOUT",
                        )
                        expect(err).to.have.nested.property(
                            "driverError.timeout",
                            timeoutMs,
                        )
                    })
                }),
            ))

        it("should not throw a query execution timeout error for the query when it runs within the maxQueryExecutionTime", async () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await expect(
                        dataSource.manager
                            .sql`SELECT SLEEP(${shortQueryTimeSec})`,
                    ).to.eventually.be.fulfilled
                }),
            ))
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

        it("should not throw a query execution timeout error", () =>
            Promise.all(
                datasources.map(async (dataSource) => {
                    await expect(
                        dataSource.manager
                            .sql`SELECT SLEEP(${longQueryTimeSec})`,
                    ).to.eventually.be.fulfilled
                }),
            ))
    })
})
