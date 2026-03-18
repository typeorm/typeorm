import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"

describe("migrations > show command", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            migrations: [__dirname + "/migration/*{.js,.ts}"],
            enabledDrivers: ["postgres", "better-sqlite3"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("can recognise pending migrations", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const migrations = await dataSource.showMigrations()
                migrations.should.be.equal(true)
            }),
        ))

    it("can recognise no pending migrations", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.runMigrations()
                const migrations = await dataSource.showMigrations()
                migrations.should.be.equal(false)
            }),
        ))
})
