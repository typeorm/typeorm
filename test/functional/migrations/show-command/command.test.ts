import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"

describe("migrations > show command", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                migrations: [__dirname + "/migration/*.js"],
                enabledDrivers: ["postgres", "better-sqlite3"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("can recognise pending migrations", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const migrations = await connection.showMigrations()
                migrations.should.be.equal(true)
            }),
        ))

    it("can recognise no pending migrations", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection.runMigrations()
                const migrations = await connection.showMigrations()
                migrations.should.be.equal(false)
            }),
        ))
})
