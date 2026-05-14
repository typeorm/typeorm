import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"

describe("github issues > #3357 migration generation should alter varchar length", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("uses ALTER COLUMN TYPE instead of DROP and ADD when varchar length changes", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const postMetadata = dataSource.getMetadata(Post)
                const exampleColumn =
                    postMetadata.findColumnWithPropertyName("example")!
                exampleColumn.length = "51"

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                const upQueries = sqlInMemory.upQueries.map((query) =>
                    query.query.replaceAll(/\s+/g, " ").trim(),
                )

                expect(upQueries).to.include(
                    `ALTER TABLE "post" ALTER COLUMN "example" TYPE character varying(51)`,
                )
                expect(upQueries.join(" ")).not.to.include(
                    `DROP COLUMN "example"`,
                )
                expect(upQueries.join(" ")).not.to.include(`ADD "example"`)

                exampleColumn.length = "50"
            }),
        )
    })
})
