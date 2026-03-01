import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src"

describe("table-inheritance > single-table > database-option-inherited", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                // creating more databases isn't always possible(e.g oracle official docker images)
                enabledDrivers: [
                    "postgres",
                    "cockroachdb",
                    "mariadb",
                    "mssql",
                    "mysql",
                    "better-sqlite3",
                    "sqljs",
                ],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should correctly inherit database option", () => {
        dataSources.forEach((connection) => {
            connection.entityMetadatas.forEach((metadata) =>
                metadata.database!.should.equal("test"),
            )
        })
    })
})
