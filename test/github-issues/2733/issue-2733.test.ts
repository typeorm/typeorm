import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"

describe("github issues > #2733 should correctly handle function calls with upercase letters as default values", () => {
    let dataSources: DataSource[]

    it("MSSQL, Sqljs, Sqlite", async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/MSSQLDummy{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: ["mssql", "sqljs", "sqlite", "better-sqlite3"],
        })
        await reloadTestingDatabases(dataSources)
        await Promise.all(
            dataSources.map(async (connection) => {
                const schemaBuilder = connection.driver.createSchemaBuilder()
                const syncQueries = await schemaBuilder.log()
                expect(syncQueries.downQueries).to.be.eql([])
                expect(syncQueries.upQueries).to.be.eql([])
            }),
        )
        await closeTestingConnections(dataSources)
    })
    it("Postgres", async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/PostgresDummy{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: ["postgres"],
        })
        await reloadTestingDatabases(dataSources)
        await Promise.all(
            dataSources.map(async (connection) => {
                const schemaBuilder = connection.driver.createSchemaBuilder()
                const syncQueries = await schemaBuilder.log()
                expect(syncQueries.downQueries).to.be.eql([])
                expect(syncQueries.upQueries).to.be.eql([])
            }),
        )
        await closeTestingConnections(dataSources)
    })
})
