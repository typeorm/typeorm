import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("github issues > #9266 queryRunner.getTable() fails if Foreign Key is set in target table", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            migrations: [__dirname + "/migration/*{.js,.ts}"],
            enabledDrivers: ["sqlite", "better-sqlite3"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should be able to load tables", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection.runMigrations()
                const queryRunner = connection.createQueryRunner()
                const tables = await queryRunner.getTables()
                const tableNames = tables.map((table) => table.name)
                expect(tableNames).to.include("author")
                expect(tableNames).to.include("post")
                await queryRunner.release()
            }),
        ))
})
