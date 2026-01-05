import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

describe("github issues > #10999 Migration: migration:generate Can't Generate a Drop SQL Command", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                migrations: [__dirname + "/migration/*{.js,.ts}"],
                schemaCreate: false,
                dropSchema: true,
                enabledDrivers: ["postgres"],
            })),
    )
    after(() => closeTestingConnections(dataSources))

    it("should generate drop removed column SQL command", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.runMigrations()

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                expect(sqlInMemory.upQueries[0].query).to.eql(
                    `ALTER TABLE "entity_with_virtual_column" DROP COLUMN "foo"`,
                )
                expect(sqlInMemory.downQueries[0].query).to.eql(
                    `ALTER TABLE "entity_with_virtual_column" ADD "foo" integer NOT NULL`,
                )
            }),
        ))

    // you can add additional tests if needed
})
