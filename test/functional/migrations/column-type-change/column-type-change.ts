import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("migrations > column type change", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not drop column when type changes", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Ignore drivers that don't support this or have different behavior (like SQLite which recreates the table)
                if (
                    ["sqlite", "better-sqlite3", "sqljs", "capacitor", "cordova", "expo", "nativescript", "react-native"].includes(
                        dataSource.driver.options.type,
                    )
                ) {
                    return
                }

                // Insert some data to verify it's not lost (in a real scenario)
                const post = new Post()
                post.title = "test title"
                await dataSource.manager.save(post)

                // Change column type in metadata
                const columnMetadata = dataSource
                    .getMetadata(Post)
                    .findColumnWithPropertyName("title")
                columnMetadata!.type = "text"
                // Clear the length since text doesn't have it in some drivers
                columnMetadata!.length = ""

                // Generate migration queries
                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                const upQueries = sqlInMemory.upQueries.map((q) => q.query.toLowerCase())
                const downQueries = sqlInMemory.downQueries.map((q) => q.query.toLowerCase())

                // Check for DROP COLUMN
                const hasDropColumn = upQueries.some(
                    (q) => q.includes("drop column") || q.includes("drop \"title\""),
                )
                
                // Currently, this will FAIL (it will have DROP COLUMN)
                // We want it to have ALTER COLUMN ... TYPE or MODIFY COLUMN
                expect(hasDropColumn, `Driver ${dataSource.driver.options.type} should not drop the column`).to.be.false
                
                const hasAlterType = upQueries.some(
                    (q) => (q.includes("alter column") && q.includes("type")) || q.includes("modify column"),
                )
                expect(hasAlterType, `Driver ${dataSource.driver.options.type} should use ALTER/MODIFY`).to.be.true
            }),
        ))
})
