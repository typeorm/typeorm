import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { expect } from "chai"

describe("schema builder > idempotency > function default uppercase", () => {
    let dataSources: DataSource[]

    it("MSSQL, Sqljs, Sqlite", async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/MSSQLDummy{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: ["mssql", "sqljs", "better-sqlite3"],
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
