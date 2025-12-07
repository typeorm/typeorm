import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
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

describe("github issues > #3158 Cannot run sync a second time", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: [
                    "mysql",
                    "mariadb",
                    "oracle",
                    "mssql",
                    "sqljs",
                    "sqlite",
                    "better-sqlite3",
                ],
                // todo(AlexMesser): check why tests are failing under postgres driver
            })),
    )
    beforeEach(async () => await reloadTestingDatabases(connections))
    after(async () => await closeTestingConnections(connections))

    it("can recognize model changes", () =>
        Promise.all(
            connections.map(async (connection) => {
                const schemaBuilder = connection.driver.createSchemaBuilder()
                const syncQueries = await schemaBuilder.log()
                expect(syncQueries.downQueries).to.be.eql([])
                expect(syncQueries.upQueries).to.be.eql([])
            }),
        ))
})
