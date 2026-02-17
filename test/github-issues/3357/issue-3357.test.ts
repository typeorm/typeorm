import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { Post } from "./entity/Post"

describe("github issues > #3357 Migration generation should use ALTER COLUMN instead of DROP+ADD to prevent data loss", () => {
    let connections: DataSource[]

    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: [
                    "postgres",
                    "cockroachdb",
                    "mysql",
                    "mariadb",
                    "mssql",
                ],
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    after(() => closeTestingConnections(connections))

    it("should generate ALTER COLUMN instead of DROP+ADD when column length changes", async () => {
        await Promise.all(
            connections.map(async (connection) => {
                const meta = connection.getMetadata(Post)
                const col = meta.columns.find(
                    (c) => c.propertyName === "title",
                )!

                // Change column length from 50 to 100
                col.length = "100"

                // Generate migration queries
                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()

                const upQueries = sqlInMemory.upQueries.map((q) =>
                    q.query.replace(/\s+/g, " ").trim(),
                )
                const downQueries = sqlInMemory.downQueries.map((q) =>
                    q.query.replace(/\s+/g, " ").trim(),
                )

                // Should NOT contain DROP COLUMN
                const hasDropColumn = upQueries.some(
                    (q) => q.includes("DROP COLUMN") && q.includes("title"),
                )
                expect(
                    hasDropColumn,
                    "Migration should NOT use DROP COLUMN for length changes",
                ).to.be.false

                // Should contain ALTER COLUMN or MODIFY
                const hasAlterColumn = upQueries.some(
                    (q) =>
                        (q.includes("ALTER COLUMN") || q.includes("MODIFY")) &&
                        q.includes("title"),
                )
                expect(
                    hasAlterColumn,
                    "Migration should use ALTER COLUMN / MODIFY for length changes",
                ).to.be.true

                // Down queries should also not contain DROP COLUMN
                const downHasDropColumn = downQueries.some(
                    (q) => q.includes("DROP COLUMN") && q.includes("title"),
                )
                expect(
                    downHasDropColumn,
                    "Down migration should NOT use DROP COLUMN for length changes",
                ).to.be.false

                // Restore original length
                col.length = "50"
            }),
        )
    })

    it("should generate ALTER COLUMN instead of DROP+ADD when column type changes", async () => {
        await Promise.all(
            connections.map(async (connection) => {
                const meta = connection.getMetadata(Post)
                const col = meta.columns.find(
                    (c) => c.propertyName === "content",
                )!

                const originalType = col.type
                const originalLength = col.length

                // Change column type from varchar to text
                col.type = "text"
                col.length = ""

                // Generate migration queries
                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()

                const upQueries = sqlInMemory.upQueries.map((q) =>
                    q.query.replace(/\s+/g, " ").trim(),
                )

                // Should NOT contain DROP COLUMN
                const hasDropColumn = upQueries.some(
                    (q) => q.includes("DROP COLUMN") && q.includes("content"),
                )
                expect(
                    hasDropColumn,
                    "Migration should NOT use DROP COLUMN for type changes",
                ).to.be.false

                // Should contain ALTER COLUMN or MODIFY
                const hasAlterColumn = upQueries.some(
                    (q) =>
                        (q.includes("ALTER COLUMN") || q.includes("MODIFY")) &&
                        q.includes("content"),
                )
                expect(
                    hasAlterColumn,
                    "Migration should use ALTER COLUMN / MODIFY for type changes",
                ).to.be.true

                // Restore original
                col.type = originalType
                col.length = originalLength
            }),
        )
    })
})
