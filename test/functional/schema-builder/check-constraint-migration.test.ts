import { DataSource } from "../../../src"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { CheckEntity } from "./entity/Check"

describe("schema builder > change check constraint with migration", () => {
    let datasources: DataSource[]
    before(async () => {
        datasources = await createTestingConnections({
            entities: [CheckEntity],
            migrations: [__dirname + "/migrations/*{.js,.ts}"],
            schemaCreate: false,
            dropSchema: true,
            enabledDrivers: ["postgres"],
        })
    })
    after(() => closeTestingConnections(datasources))

    it("should correctly change check with migration", () =>
        Promise.all(
            datasources.map(async (datasource) => {
                await datasource.runMigrations()

                const sqlInMemory = await datasource.driver
                    .createSchemaBuilder()
                    .log()
                const upQueries = sqlInMemory.upQueries
                const downQueries = sqlInMemory.downQueries
                upQueries.length.should.be.greaterThan(0)
                downQueries.length.should.be.greaterThan(0)
            }),
        ))
    it("should not change check if expression is the same", () =>
        Promise.all(
            datasources.map(async (datasource) => {
                await datasource.synchronize()
                const sqlInMemory = await datasource.driver
                    .createSchemaBuilder()
                    .log()
                const upQueries = sqlInMemory.upQueries
                const downQueries = sqlInMemory.downQueries

                upQueries.length.should.be.equal(0)
                downQueries.length.should.be.equal(0)
            }),
        ))
})
