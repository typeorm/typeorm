import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { PushLog } from "./entity/PushLog"

describe("github issues > #7381 Infinite same ALTERs upon startup (mysql, ver 0.2.30)", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["mysql", "mariadb"],
                schemaCreate: false,
                dropSchema: true,
                entities: [PushLog],
            })),
    )
    after(() => closeTestingConnections(connections))

    it("should recognize model changes", () =>
        Promise.all(
            connections.map(async (connection) => {
                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()
                sqlInMemory.upQueries.length.should.be.greaterThan(0)
                sqlInMemory.downQueries.length.should.be.greaterThan(0)
            }),
        ))

    it("should not generate queries when no model changes", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.driver.createSchemaBuilder().build()
                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()
                sqlInMemory.upQueries.length.should.be.equal(0)
                sqlInMemory.downQueries.length.should.be.equal(0)
            }),
        ))
})
