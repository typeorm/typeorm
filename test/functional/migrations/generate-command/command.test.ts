import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Category, Post } from "./entity"

describe("migrations > generate command", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            migrations: [],
            schemaCreate: false,
            dropSchema: true,
            entities: [Post, Category],
        })
    })
    afterAll(() => closeTestingConnections(dataSources))

    it("can recognize model changes", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()
                sqlInMemory.upQueries.length.should.be.greaterThan(0)
                sqlInMemory.downQueries.length.should.be.greaterThan(0)
            }),
        ))

    it("does not generate when no model changes", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.driver.createSchemaBuilder().build()

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                sqlInMemory.upQueries.length.should.be.equal(0)
                sqlInMemory.downQueries.length.should.be.equal(0)
            }),
        ))
})
