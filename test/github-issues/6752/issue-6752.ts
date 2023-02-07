import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import { expect } from "chai"
import { Block } from "./entity/Block"
import { PlanOfRecord } from "./entity/PlanOfRecord"

describe("github issues > #6752 column name not been find on unique index decorator", () => {
    it("dont change anything", async () => {
        let connections: DataSource[]
        connections = await createTestingConnections({
            entities: [Block, PlanOfRecord],
            schemaCreate: false,
            dropSchema: true,
            enabledDrivers: ["mssql"],
        })
        await reloadTestingDatabases(connections)
        await Promise.all(
            connections.map(async (connection) => {
                const schemaBuilder = connection.driver.createSchemaBuilder()
                const syncQueries = await schemaBuilder.log()
                expect(syncQueries.downQueries).to.be.eql([])
                expect(syncQueries.upQueries).to.be.eql([])
            }),
        )
        await closeTestingConnections(connections)
    })
})
