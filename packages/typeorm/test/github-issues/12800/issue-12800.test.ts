import "reflect-metadata"
import type { DataSource } from "../../../src"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { WorkOrder } from "./entity/WorkOrder"

describe("github issues > #12800 Postgres: geometry column with precision generates an endless phantom migration", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres", "cockroachdb"],
            schemaCreate: false,
            dropSchema: true,
            entities: [WorkOrder],
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should not generate queries when schema has not changed", () =>
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
