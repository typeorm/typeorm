import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Migration } from "../../../src/migration/Migration"

describe("github issues > #2875 runMigrations() function is not returning a list of migrated files", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                migrations: [__dirname + "/migration/*.js"],
                enabledDrivers: ["postgres"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should be able to run all necessary migrations", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const mymigr: Migration[] = await connection.runMigrations()

                mymigr.length.should.be.equal(1)
                mymigr[0].name.should.be.equal("InitUsers1530542855524")
            }),
        ))
})
