import { DataSource } from "../../../src"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { CheckEntity } from "./entity/check-migration/CheckEntity"

describe("schema builder > change check constraint with migration (#11714)", () => {
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

    it("should detect modified check constraints after migration", () =>
        Promise.all(
            datasources.map(async (datasource) => {
                await datasource.runMigrations()

                const sqlInMemory = await datasource.driver
                    .createSchemaBuilder()
                    .log()

                // Migration creates constraints with different expressions
                // than the entity metadata, so sync should detect changes
                sqlInMemory.upQueries.length.should.be.greaterThan(0)
                sqlInMemory.downQueries.length.should.be.greaterThan(0)
            }),
        ))
})

describe("schema builder > no change for matching check constraints", () => {
    let datasources: DataSource[]
    before(async () => {
        datasources = await createTestingConnections({
            entities: [CheckEntity],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: ["postgres"],
        })
    })
    after(() => closeTestingConnections(datasources))

    it("should not generate queries when check expressions match", () =>
        Promise.all(
            datasources.map(async (datasource) => {
                const sqlInMemory = await datasource.driver
                    .createSchemaBuilder()
                    .log()

                sqlInMemory.upQueries.length.should.be.equal(0)
                sqlInMemory.downQueries.length.should.be.equal(0)
            }),
        ))
})
