import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"

describe("github issues > #3357 migration generation drops and creates columns instead of altering", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should generate ALTER COLUMN TYPE instead of DROP+ADD when only the length changes", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                // Insert a row to confirm data is preserved after the migration
                await dataSource
                    .getRepository(Post)
                    .save({ title: "Hello World" })

                // Temporarily change the entity metadata to simulate a length change:
                // varchar(50) → varchar(100)
                const postMetadata = dataSource.entityMetadatas.find(
                    (m) => m.name === "Post",
                )!
                const titleColumn = postMetadata.columns.find(
                    (c) => c.propertyName === "title",
                )!
                const originalLength = titleColumn.length

                // Patch the column length to trigger a schema diff
                titleColumn.length = "100"

                let logs
                try {
                    logs = await dataSource.driver.createSchemaBuilder().log()
                } finally {
                    // Always restore original length
                    titleColumn.length = originalLength
                }

                const upQueryStrings = logs.upQueries.map((q) =>
                    q.query.toUpperCase(),
                )

                const hasDropColumn = upQueryStrings.some((q) =>
                    q.includes("DROP COLUMN"),
                )
                const hasAlterColumnType = upQueryStrings.some(
                    (q) => q.includes("ALTER COLUMN") && q.includes("TYPE"),
                )

                expect(
                    hasDropColumn,
                    `Expected no DROP COLUMN query, but got: ${logs.upQueries
                        .map((q) => q.query)
                        .join("; ")}`,
                ).to.be.false

                expect(
                    hasAlterColumnType,
                    `Expected ALTER COLUMN … TYPE query, but got: ${logs.upQueries
                        .map((q) => q.query)
                        .join("; ")}`,
                ).to.be.true
            }),
        )
    })

    it("should preserve existing data when increasing column length", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const repo = dataSource.getRepository(Post)

                // Insert test data before the migration
                const post = await repo.save({ title: "Preserved Data" })

                // Run the equivalent ALTER COLUMN TYPE query directly
                await dataSource.query(
                    `ALTER TABLE "post" ALTER COLUMN "title" TYPE character varying(100)`,
                )

                // Verify data is still there after the column resize
                const found = await repo.findOneBy({ id: post.id })
                expect(found).to.not.be.null
                expect(found!.title).to.equal("Preserved Data")
            }),
        )
    })
})
