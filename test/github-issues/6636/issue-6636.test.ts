import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Test } from "./entity/Test"
import { expect } from "chai"

describe("github issues > #6636 migration issues with scale & precision", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [Test],
                enabledDrivers: ["sqljs", "better-sqlite3"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not create migrations columns with precision", async () => {
        await Promise.all(
            dataSources.map(async (connection) => {
                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()
                expect(sqlInMemory.upQueries).to.eql([])
                expect(sqlInMemory.downQueries).to.eql([])
            }),
        )
    })
})
