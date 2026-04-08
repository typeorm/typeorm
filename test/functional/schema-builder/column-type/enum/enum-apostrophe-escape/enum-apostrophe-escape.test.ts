import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../../utils/test-utils"
import { Example } from "./entity/Example"

describe("schema builder > column type > enum > enum apostrophe escape", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["mysql"],
            entities: [Example],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should properly escape all apostrophes", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection.driver.createSchemaBuilder().build()
                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()
                expect(sqlInMemory.upQueries.length).to.be.greaterThan(0)
                expect(
                    sqlInMemory.upQueries.some(({ query }) =>
                        query.includes("Men''s and Women''s Clothing"),
                    ),
                ).to.be.true
            }),
        ))
})
