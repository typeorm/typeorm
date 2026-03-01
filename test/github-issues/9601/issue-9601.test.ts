import "reflect-metadata"
import { DataSource } from "../../../src/index"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

describe("github issues > #9601 view+schema+synchronize broken for oracle", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: false,
                dropSchema: true,
                enabledDrivers: ["oracle"],
            })),
    )
    after(() => closeTestingConnections(dataSources))

    it("should recognize model changes", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()
                sqlInMemory.upQueries.length.should.be.greaterThan(0)
                sqlInMemory.downQueries.length.should.be.greaterThan(0)
            }),
        ))

    it("should not generate queries when no model changes", () =>
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
