import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"

describe("github issues > #9457 No changes in database schema were found, when simple-enum is changed.", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            migrations: [__dirname + "/migration/*{.js,.ts}"],
            schemaCreate: false,
            dropSchema: true,
            enabledDrivers: ["mssql"],
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should drop and recreate 'CHECK' constraint to match enum values", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.runMigrations()

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                expect(sqlInMemory.upQueries.length).to.eql(2)
                expect(sqlInMemory.upQueries[0].query).to.eql(
                    'ALTER TABLE "example_entity" DROP CONSTRAINT "CHK_0528bff24af57f1513a83e5cfe_ENUM"',
                )
                expect(sqlInMemory.upQueries[1].query).to.eql(
                    `ALTER TABLE "example_entity" ADD CONSTRAINT "CHK_ffdedc852f72174c29f8187223_ENUM" CHECK (enumcolumn IN ('enumvalue1','enumvalue2','enumvalue3','enumvalue4'))`,
                )

                expect(sqlInMemory.downQueries.length).to.eql(2)
                expect(sqlInMemory.downQueries[0].query).to.eql(
                    'ALTER TABLE "example_entity" DROP CONSTRAINT "CHK_ffdedc852f72174c29f8187223_ENUM"',
                )
                expect(sqlInMemory.downQueries[1].query).to.eql(
                    `ALTER TABLE "example_entity" ADD CONSTRAINT "CHK_0528bff24af57f1513a83e5cfe_ENUM" CHECK (enumcolumn IN ('enumvalue1','enumvalue2','enumvalue3'))`,
                )
            }),
        ))
})
