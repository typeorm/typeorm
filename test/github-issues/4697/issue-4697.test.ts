import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"

describe("github issues > #4697 Revert migrations running in reverse order.", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                migrations: [__dirname + "/migration/*.js"],
                enabledDrivers: ["mongodb"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should revert migrations in the right order", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.runMigrations()

                await connection.undoLastMigration()

                const [lastMigration] = await connection.runMigrations()

                lastMigration.should.have.property("timestamp", 1567689639607)
                lastMigration.should.have.property(
                    "name",
                    "MergeConfigs1567689639607",
                )
            }),
        ))
})
