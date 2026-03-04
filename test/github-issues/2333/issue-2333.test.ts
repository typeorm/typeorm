import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Test } from "./entity/Test"

describe("github issues > #2333 datetime column showing changed on every schema:sync run", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                enabledDrivers: ["mysql", "mariadb"],
                schemaCreate: false,
                dropSchema: true,
                entities: [Test],
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
