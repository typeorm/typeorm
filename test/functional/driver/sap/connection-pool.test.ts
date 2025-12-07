import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"
import { SapDriver } from "../../../../src/driver/sap/SapDriver"
import { QueryRunner } from "../../../../src"
import { ConnectionPool } from "@sap/hana-client"

describe("driver > sap > connection pool", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                enabledDrivers: ["sap"],
                driverSpecific: {
                    pool: {
                        maxConnectedOrPooled: 3,
                    },
                },
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should be managed correctly", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const poolClient = (dataSource.driver as SapDriver)
                    .master as ConnectionPool
                expect(poolClient.getInUseCount()).to.equal(0)
                expect(poolClient.getPooledCount()).to.be.at.most(3)

                const queryRunners: QueryRunner[] = []
                for (let i = 0; i < 3; i++) {
                    const queryRunner = dataSource.createQueryRunner()
                    queryRunners.push(queryRunner)

                    // the QueryRunner takes a connection from the pool once the first query is executed
                    await queryRunner.sql`SELECT * FROM SYS.DUMMY`
                }
                expect(poolClient.getInUseCount()).to.equal(3)
                expect(poolClient.getPooledCount()).to.equal(0)

                const newQueryRunner = dataSource.createQueryRunner()
                await expect(newQueryRunner.connect()).to.be.rejectedWith(
                    "Unable to create connection, the maxConnectedOrPool limit has been reached",
                )
                await newQueryRunner.release()

                const oldQueryRunner = queryRunners.pop()!
                await oldQueryRunner.release()
                expect(poolClient.getInUseCount()).to.equal(2)
                expect(poolClient.getPooledCount()).to.equal(1)

                const queryRunner = dataSource.createQueryRunner()
                queryRunners.push(queryRunner)
                await expect(queryRunner.connect()).to.be.fulfilled
                expect(poolClient.getInUseCount()).to.equal(3)
                expect(poolClient.getPooledCount()).to.equal(0)

                for (const queryRunner of queryRunners) {
                    await queryRunner.release()
                }
                expect(poolClient.getInUseCount()).to.equal(0)
                expect(poolClient.getPooledCount()).to.equal(3)
            }),
        ))

    it("should be managed correctly with explicit resource management ", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const poolClient = (dataSource.driver as SapDriver)
                    .master as ConnectionPool
                expect(poolClient.getInUseCount()).to.equal(0)
                expect(poolClient.getPooledCount()).to.be.at.most(3)

                {
                    await using queryRunner = dataSource.createQueryRunner()
                    await queryRunner.connect()
                    expect(poolClient.getInUseCount()).to.equal(1)
                    expect(poolClient.getPooledCount()).to.be.at.most(2)
                }

                expect(poolClient.getInUseCount()).to.equal(0)
                expect(poolClient.getPooledCount()).to.be.at.most(3)
            }),
        ))
})
