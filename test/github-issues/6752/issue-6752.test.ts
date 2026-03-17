import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src"
import { expect } from "chai"
import { Block } from "./entity/Block"
import { PlanOfRecord } from "./entity/PlanOfRecord"

describe("github issues > #6752 column name not been find on unique index decorator", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Block, PlanOfRecord],
            schemaCreate: false,
            dropSchema: true,
            enabledDrivers: ["mssql"],
        })
        await reloadTestingDatabases(dataSources)
    })

    after(async () => {
        await closeTestingConnections(dataSources)
    })

    it("don't change anything", async () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const schemaBuilder = connection.driver.createSchemaBuilder()
                const syncQueries = await schemaBuilder.log()
                expect(syncQueries.downQueries).to.be.eql([])
                expect(syncQueries.upQueries).to.be.eql([])
            }),
        ))
})
