import "reflect-metadata"
import { DataSource } from "../../../src"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { ProductBrand } from "./entity/ProductBrand"

describe("github issues > #6412 Generating migrations when having entities with CreateDateColumn/UpdateDateColumn and default values as CURRENT_TIMESTAMP leads to a lot of redundant queries in resulting migrations", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["mysql", "mariadb"],
                schemaCreate: false,
                dropSchema: true,
                entities: [ProductBrand],
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
