import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { AlterColumnEntity } from "./entity/AlterColumnEntity"

describe("schema builder > alter column type", () => {
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
                entities: [AlterColumnEntity],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    after(() => closeTestingConnections(connections))

    it("should generate ALTER COLUMN instead of DROP+ADD when column length changes", async () => {
        await Promise.all(
            connections.map(async (connection) => {
                const meta = connection.getMetadata(AlterColumnEntity)
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

    it("should use DROP+ADD for incompatible type changes to avoid cast errors", async () => {
        await Promise.all(
            connections.map(async (connection) => {
                const meta = connection.getMetadata(AlterColumnEntity)
                const col = meta.columns.find(
                    (c) => c.propertyName === "description",
                )!

                const originalType = col.type
                const originalLength = col.length

                // Change column type from varchar to text (different type)
                col.type = "text"
                col.length = ""

                // Generate migration queries
                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()

                const upQueries = sqlInMemory.upQueries.map((q) =>
                    q.query.replace(/\s+/g, " ").trim(),
                )

                // Type changes should use DROP+ADD since not all type
                // conversions are safe (e.g. int -> uuid would fail)
                const hasDropColumn = upQueries.some(
                    (q) =>
                        q.includes("DROP COLUMN") && q.includes("description"),
                )
                const hasAddColumn = upQueries.some(
                    (q) => q.includes("ADD") && q.includes("description"),
                )
                expect(
                    hasDropColumn && hasAddColumn,
                    "Migration should use DROP+ADD for type changes",
                ).to.be.true

                // Restore original
                col.type = originalType
                col.length = originalLength
            }),
        )
    })
})
