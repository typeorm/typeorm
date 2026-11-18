import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../../../utils/test-utils"
import { TestEntity } from "./entity/Test"

// https://github.com/typeorm/typeorm/issues/10418
describe("schema builder > column type > enum > enum default name", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres", "cockroachdb"],
            schemaCreate: false,
            dropSchema: true,
            entities: [TestEntity],
        })
    })
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

    it("should not generate queries when the explicit enumName equals the generated one", () =>
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

    it("should not recreate the enum type when an unrelated column property changes", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection.driver.createSchemaBuilder().build()

                const columnMetadata = connection
                    .getMetadata(TestEntity)
                    .columns.find((column) => column.databaseName === "type")!
                columnMetadata.isNullable = true

                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()
                const queries = sqlInMemory.upQueries.map(
                    (query) => query.query,
                )
                expect(queries).to.have.lengthOf(1)
                expect(queries[0]).to.match(/DROP NOT NULL/)
            }),
        ))
})
