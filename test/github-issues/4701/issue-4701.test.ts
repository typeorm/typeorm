import "reflect-metadata"
import { expect } from "chai"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"

describe("github issues > #4701 Duplicate migrations are executed.", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                migrations: [__dirname + "/migration/*.js"],
                enabledDrivers: ["postgres"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should throw error if there're duplicate migrations", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await expect(connection.runMigrations()).to.be.rejectedWith(
                    Error,
                    "Duplicate migrations: ExampleMigrationOne1567759789051",
                )
            }),
        ))
})
