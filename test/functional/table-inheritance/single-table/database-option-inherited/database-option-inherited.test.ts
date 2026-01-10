import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src"

describe("table-inheritance > single-table > database-option-inherited", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                // creating more databases isn't always possible(e.g oracle official docker images)
                enabledDrivers: [
                    "postgres",
                    "cockroachdb",
                    "mariadb",
                    "mssql",
                    "mysql",
                    "sqlite",
                    "better-sqlite3",
                    "sqljs",
                ],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should correctly inherit database option", () => {
        connections.forEach((connection) => {
            connection.entityMetadatas.forEach((metadata) =>
                metadata.database!.should.equal("test"),
            )
        })
    })
})
