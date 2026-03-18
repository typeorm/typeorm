import "reflect-metadata"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("query runner > create and drop database", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql", "mssql", "cockroachdb", "postgres"],
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should correctly create and drop database and revert it", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

                await queryRunner.createDatabase("myTestDatabase", true)
                let hasDatabase =
                    await queryRunner.hasDatabase("myTestDatabase")
                hasDatabase.should.be.true

                await queryRunner.dropDatabase("myTestDatabase")
                hasDatabase = await queryRunner.hasDatabase("myTestDatabase")
                hasDatabase.should.be.false

                await queryRunner.executeMemoryDownSql()

                hasDatabase = await queryRunner.hasDatabase("myTestDatabase")
                hasDatabase.should.be.false

                await queryRunner.release()
            }),
        ))

    it("should not throw when dropping non-existent database with ifExists", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                await queryRunner.dropDatabase("non_existent_database", true)
                await queryRunner.release()
            }),
        ))
})
