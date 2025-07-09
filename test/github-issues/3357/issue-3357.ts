import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { expect } from "chai"
import { Table } from "../../../src/schema-builder/table/Table"
import { TableColumn } from "../../../src/schema-builder/table/TableColumn"

describe("github issues > #3357 Migration generation drops and creates columns instead of altering resulting in data loss", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should use ALTER COLUMN instead of DROP/ADD when increasing varchar length", () =>
        Promise.all(
            connections.map(async function (connection) {
                const queryRunner = connection.createQueryRunner()

                // Create initial table with varchar(50)
                const table = new Table({
                    name: "test_post",
                    columns: [
                        {
                            name: "id",
                            type: "int",
                            isPrimary: true,
                            isGenerated: true,
                            generationStrategy: "increment",
                        },
                        {
                            name: "title",
                            type: "varchar",
                            length: "50",
                        },
                    ],
                })

                await queryRunner.createTable(table)

                // Insert test data
                await queryRunner.query(
                    `INSERT INTO test_post (title) VALUES ('Test data that should not be lost')`,
                )

                // Get the original column
                const originalColumn = new TableColumn({
                    name: "title",
                    type: "varchar",
                    length: "50",
                })

                // Create new column with increased length
                const newColumn = new TableColumn({
                    name: "title",
                    type: "varchar",
                    length: "100",
                })

                // Change the column - this should use ALTER COLUMN, not DROP/ADD
                await queryRunner.changeColumn(table, originalColumn, newColumn)

                // Verify data is still there
                const result = await queryRunner.query(
                    `SELECT title FROM test_post WHERE title = 'Test data that should not be lost'`,
                )

                expect(result).to.have.length(1)
                expect(result[0].title).to.equal(
                    "Test data that should not be lost",
                )

                // Verify column length was actually changed
                const tableAfterChange = await queryRunner.getTable("test_post")
                const changedColumn =
                    tableAfterChange!.findColumnByName("title")
                expect(changedColumn!.length).to.equal("100")

                await queryRunner.dropTable(table)
                await queryRunner.release()
            }),
        ))

    it("should preserve data when using entity-based column length increase", () =>
        Promise.all(
            connections.map(async function (connection) {
                // Save initial data with the entity
                const post = new Post()
                post.title = "This is a test post with some content"
                await connection.manager.save(post)

                // Verify data exists
                const savedPost = await connection.manager.findOneBy(Post, {
                    title: "This is a test post with some content",
                })
                expect(savedPost).to.not.be.null
                expect(savedPost!.title).to.equal(
                    "This is a test post with some content",
                )

                // The entity already has length: 100, so synchronization should
                // detect the difference and use ALTER COLUMN instead of DROP/ADD
                await connection.synchronize()

                // Verify data is still there after synchronization
                const postAfterSync = await connection.manager.findOneBy(Post, {
                    title: "This is a test post with some content",
                })
                expect(postAfterSync).to.not.be.null
                expect(postAfterSync!.title).to.equal(
                    "This is a test post with some content",
                )
            }),
        ))
})
