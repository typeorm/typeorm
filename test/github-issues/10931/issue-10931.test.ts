import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { expect } from "chai"
import { Example } from "./entity/example"

describe("github issues > #10931 Migration:generate issue using postgres when defined enumName equals to auto-generated", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Example],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(async () => await reloadTestingDatabases(connections))
    after(async () => await closeTestingConnections(connections))

    it("can recognize model changes", () =>
        Promise.all(
            connections.map(async (connection) => {
                const schemaBuilder = connection.driver.createSchemaBuilder()
                const syncQueries = await schemaBuilder.log()
                console.log(syncQueries)
                expect(syncQueries.downQueries).to.be.eql([])
                expect(syncQueries.upQueries).to.be.eql([])
            }),
        ))
})
