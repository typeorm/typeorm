import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { TEST_TABLE_NAME } from "./migration/init"
import { expect } from "chai"

describe("github issues > #10991", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            migrations: [__dirname + "/migration/*{.js,.ts}"],
            enabledDrivers: ["cockroachdb", "postgres"],
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should be able to load tables with names containing quotes", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection.runMigrations()
                const queryRunner = connection.createQueryRunner()
                const tables = await queryRunner.getTables()
                const tableNames = tables.map((table) => table.name)
                expect(tableNames).to.include(TEST_TABLE_NAME)
                await queryRunner.release()
            }),
        ))
})
