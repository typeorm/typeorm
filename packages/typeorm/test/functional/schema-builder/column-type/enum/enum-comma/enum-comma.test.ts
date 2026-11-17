import "reflect-metadata"
import type { DataSource } from "../../../../../../src"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../../../../utils/test-utils"
import { SomeEntity } from "./entity/SomeEntity"

describe("schema builder > column type > enum > enum comma", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            migrations: [],
            enabledDrivers: ["mysql", "mariadb"],
            schemaCreate: false,
            dropSchema: true,
            entities: [SomeEntity],
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should not generate queries for enum values with commas and quotes", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection.driver.createSchemaBuilder().build()

                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()
                sqlInMemory.upQueries.length.should.be.equal(0)
                sqlInMemory.downQueries.length.should.be.equal(0)
            }),
        ))
})
