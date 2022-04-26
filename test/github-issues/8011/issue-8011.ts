import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Example } from "./entity/Example"

describe("github issues > #8011 Enum values with multiple apostrophes not properly escaped in MySQL", () => {
    let connections: DataSource[]

    before(async () => {
        connections = await createTestingConnections({
            enabledDrivers: ["mysql"],
            entities: [Example],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should properly escape all apostrophes", () =>
        Promise.all(
            connections.map(async (connection) => {
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
