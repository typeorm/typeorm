import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Test } from "./entity/Test"

describe("schema builder > idempotency > unsigned integer", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Test],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not create migrations for unsigned indices", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()
                expect(sqlInMemory.upQueries).to.eql([])
                expect(sqlInMemory.downQueries).to.eql([])
            }),
        ))
})
