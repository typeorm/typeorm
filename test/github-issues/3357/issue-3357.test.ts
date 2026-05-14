import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Bug } from "./entity/Bug"

describe("github issues > #3357 migration generation should alter varchar length without dropping column", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            entities: [Bug],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("does not drop and recreate a varchar column when only the length changes", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const metadata = dataSource.getMetadata(Bug)
                const column = metadata.findColumnWithPropertyName("example")!
                column.length = "51"

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()
                const upQueries = sqlInMemory.upQueries.map(
                    (query) => query.query,
                )
                const generatedSql = upQueries.join("\n")

                expect(upQueries).to.include(
                    `ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(51)`,
                )
                expect(generatedSql).not.to.include(`DROP COLUMN "example"`)
                expect(generatedSql).not.to.include(`ADD "example"`)

                column.length = "50"
            }),
        ))
})
