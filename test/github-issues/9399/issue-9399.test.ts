import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import { expect } from "chai"

describe("github issues > #9399 mssql: Column is dropped and recreated in every migration", () => {
    let dataSources: DataSource[]
    beforeAll(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["mssql"],
            })),
    )
    afterAll(() => closeTestingConnections(dataSources))

    it("No migration should be created", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.runMigrations()
                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                expect(sqlInMemory.upQueries.length).to.eql(0)
                expect(sqlInMemory.downQueries.length).to.eql(0)
            }),
        ))
})
