import "reflect-metadata"
import { expect } from "chai"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"

describe("github issues > #4701 Duplicate migrations are executed.", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            migrations: [__dirname + "/migration/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

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
