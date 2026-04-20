import type { DataSource } from "../../../src"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { CheckEntity } from "./entity/check-migration/CheckEntity"
import { CreateCheckEntity0000000000001 } from "./migrations/0000000000001-CreateCheckEntity"

describe("schema builder > check constraint migration", () => {
    describe("change detection for modified check constraints", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [CheckEntity],
                migrations: [CreateCheckEntity0000000000001],
                schemaCreate: false,
                dropSchema: true,
                enabledDrivers: [
                    "postgres",
                    "cockroachdb",
                    "mssql",
                    "oracle",
                    "sap",
                    "better-sqlite3",
                    "sqljs",
                ],
            })
        })
        after(() => closeTestingConnections(dataSources))

        it("should detect modified check constraints after migration", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await dataSource.runMigrations()

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    sqlInMemory.upQueries.length.should.be.greaterThan(0)
                    sqlInMemory.downQueries.length.should.be.greaterThan(0)
                }),
            ))
    })

    describe("no change for matching check constraints", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [CheckEntity],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: [
                    "postgres",
                    "cockroachdb",
                    "mssql",
                    "oracle",
                    "sap",
                    "better-sqlite3",
                    "sqljs",
                ],
            })
        })
        after(() => closeTestingConnections(dataSources))

        it("should not generate queries when check expressions match", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    sqlInMemory.upQueries.length.should.be.equal(0)
                    sqlInMemory.downQueries.length.should.be.equal(0)
                }),
            ))
    })
})
