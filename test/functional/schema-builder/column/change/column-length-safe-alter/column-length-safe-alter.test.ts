import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../../utils/test-utils"
import { Post } from "./entity/Post"

// Regression test for #3357: length-only changes must use ALTER COLUMN
// rather than DROP+ADD, which would destroy data.
describe("schema builder > change column > length safe alter (#3357)", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            // CockroachDB + Spanner have slightly different syntax; the
            // Postgres check is the canonical regression case.
            enabledDrivers: ["postgres"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should use ALTER COLUMN TYPE (not DROP+ADD) for length-only changes", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMetadata = dataSource.getMetadata(Post)
                const nameColumn =
                    postMetadata.findColumnWithPropertyName("name")!
                // bump length from 255 -> 500 (length-only change)
                nameColumn.length = "500"

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                const upQueries = sqlInMemory.upQueries.map((q) => q.query)

                // must not contain DROP COLUMN
                for (const query of upQueries) {
                    expect(query).to.not.include("DROP COLUMN")
                    expect(query).to.not.include("ADD COLUMN")
                }
                // must contain ALTER COLUMN ... TYPE
                expect(
                    upQueries.some((q) =>
                        q.includes('ALTER COLUMN "name" TYPE'),
                    ),
                ).to.be.true

                // revert
                nameColumn.length = "255"
            }),
        ))
})
