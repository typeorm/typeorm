import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { expect } from "chai"
import { TableIndex } from "../../../../../src/schema-builder/table/TableIndex"
import { Post } from "./entity/Post"

describe("indices > ordered index > cockroachdb > column options in index (ASC/DESC)", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [Post],
                enabledDrivers: ["cockroachdb"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should correctly store columnOptions in entity metadata for ASC", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMetadata = dataSource.getMetadata(Post)
                const index = postMetadata.indices.find(
                    (idx) => idx.name === "IDX_POST_TITLE_ASC",
                )
                expect(index).to.exist
                expect(index!.columnOptions).to.exist
                expect(index!.columnOptions!["title"]).to.deep.equal({
                    order: "ASC",
                })
            }),
        ))

    it("should correctly store columnOptions in entity metadata for DESC", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMetadata = dataSource.getMetadata(Post)
                const index = postMetadata.indices.find(
                    (idx) => idx.name === "IDX_POST_DESCRIPTION_DESC",
                )
                expect(index).to.exist
                expect(index!.columnOptions).to.exist
                expect(index!.columnOptions!["description"]).to.deep.equal({
                    order: "DESC",
                })
            }),
        ))

    it("should correctly store columnOptions for composite index with mixed options", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMetadata = dataSource.getMetadata(Post)
                const index = postMetadata.indices.find(
                    (idx) => idx.name === "IDX_POST_COMPOSITE",
                )
                expect(index).to.exist
                expect(index!.columnOptions).to.exist
                expect(index!.columnOptions!["title"]).to.deep.equal({
                    order: "ASC",
                })
                expect(index!.columnOptions!["author"]).to.deep.equal({
                    order: "DESC",
                })
                // category intentionally has no options
                expect(index!.columnOptions!["category"]).to.be.undefined
            }),
        ))

    it("should generate correct SQL for index with ASC", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const postMetadata = dataSource.getMetadata(Post)
                const index = postMetadata.indices.find(
                    (idx) => idx.name === "IDX_POST_TITLE_ASC",
                )

                const tableIndex = TableIndex.create(index!)
                const table = await queryRunner.getTable(postMetadata.tableName)

                // Access the protected method via type assertion
                const sql = (queryRunner as any).createIndexSql(
                    table,
                    tableIndex,
                )

                expect(sql.query).to.include("ASC")
                expect(sql.query).to.match(/"title"\s+ASC/i)

                await queryRunner.release()
            }),
        ))

    it("should generate correct SQL for index at column level without options", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const postMetadata = dataSource.getMetadata(Post)
                const index = postMetadata.indices.find(
                    (idx) => idx.name === "IDX_POST_CATEGORY",
                )
                expect(index).to.exist

                const tableIndex = TableIndex.create(index!)
                const table = await queryRunner.getTable(postMetadata.tableName)

                const sql = (queryRunner as any).createIndexSql(
                    table,
                    tableIndex,
                )

                expect(sql.query).to.match(/"category"/i)
                expect(sql.query).to.not.match(/ASC|DESC/i)

                await queryRunner.release()
            }),
        ))

    it("should generate correct SQL for composite index with mixed column options", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const postMetadata = dataSource.getMetadata(Post)
                const index = postMetadata.indices.find(
                    (idx) => idx.name === "IDX_POST_COMPOSITE",
                )

                const tableIndex = TableIndex.create(index!)
                const table = await queryRunner.getTable(postMetadata.tableName)

                const sql = (queryRunner as any).createIndexSql(
                    table,
                    tableIndex,
                )

                // Check that title has ASC
                expect(sql.query).to.match(/"title"\s+ASC/i)
                // Check that author has DESC
                expect(sql.query).to.match(/"author"\s+DESC/i)
                // Check that category has no options (just the column name)
                expect(sql.query).to.include('"category"')

                await queryRunner.release()
            }),
        ))

    it("should correctly create and drop index with column options", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                expect(table).to.exist

                // Create a new index with column options
                const newIndex = new TableIndex({
                    name: "IDX_TEST_DYNAMIC",
                    columnNames: ["title", "description"],
                    columnOptions: {
                        title: { order: "ASC" },
                        description: { order: "DESC" },
                    },
                })

                await queryRunner.createIndex(table!, newIndex)

                // Verify the index was created by checking table indices
                const tableAfterCreate = await queryRunner.getTable("post")
                const createdIndex = tableAfterCreate!.indices.find(
                    (idx) => idx.name === "IDX_TEST_DYNAMIC",
                )
                expect(createdIndex).to.exist

                // Drop the index
                await queryRunner.dropIndex(table!, newIndex)

                // Verify the index was dropped
                const tableAfterDrop = await queryRunner.getTable("post")
                const droppedIndex = tableAfterDrop!.indices.find(
                    (idx) => idx.name === "IDX_TEST_DYNAMIC",
                )
                expect(droppedIndex).to.be.undefined

                await queryRunner.release()
            }),
        ))

    it("should handle indexes without column options (backward compatibility)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMetadata = dataSource.getMetadata(Post)
                const index = postMetadata.indices.find(
                    (idx) => idx.name === "IDX_POST_LIKES",
                )
                expect(index).to.exist

                // columnOptions should be undefined for indexes without options
                expect(
                    index!.columnOptions === undefined ||
                        index!.columnOptions["likes"] === undefined,
                ).to.be.true

                // Verify SQL generation doesn't add extra options
                const queryRunner = dataSource.createQueryRunner()
                const tableIndex = TableIndex.create(index!)
                const table = await queryRunner.getTable(postMetadata.tableName)

                const sql = (queryRunner as any).createIndexSql(
                    table,
                    tableIndex,
                )

                // Should not have ASC/DESC or NULLS options
                expect(sql.query).to.not.match(/ASC|DESC/i)

                await queryRunner.release()
            }),
        ))

    it("should throw error when columnOptions has more keys than columns", async () => {
        // Dynamically import the entity with too many options
        const { InvalidPost } = await import("./entity/InvalidPost")
        const { getMetadataArgsStorage } =
            await import("../../../../../src/globals")

        await Promise.all(
            dataSources.map(async (dataSource) => {
                const testDataSource =
                    dataSource.driver.createQueryRunner("master")
                await testDataSource.connect()

                const { EntityMetadataBuilder } =
                    await import("../../../../../src/metadata-builder/EntityMetadataBuilder")
                const entityMetadataBuilder = new EntityMetadataBuilder(
                    dataSource,
                    getMetadataArgsStorage(),
                )

                try {
                    entityMetadataBuilder.build([InvalidPost])
                    expect.fail("Should have thrown an error")
                } catch (error) {
                    expect(error.message).to.include("columnOptions")
                    expect(error.message).to.include(
                        "2 columnOptions but only 1 columns",
                    )
                }

                await testDataSource.release()
            }),
        )
    })

    it("should support property-level index with shorthand order syntax", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMetadata = dataSource.getMetadata(Post)
                const infoIndex = postMetadata.indices.find(
                    (idx) => idx.name === "IDX_POST_INFO_ASC",
                )

                expect(infoIndex).to.exist
                expect(infoIndex!.columnOptions).to.exist
                expect(infoIndex!.columnOptions!.info).to.exist
                expect(infoIndex!.columnOptions!.info.order).to.equal("ASC")

                // Verify SQL generation
                const queryRunner = dataSource.createQueryRunner()
                const tableIndex = TableIndex.create(infoIndex!)
                const table = await queryRunner.getTable(postMetadata.tableName)

                const sql = (queryRunner as any).createIndexSql(
                    table,
                    tableIndex,
                )

                expect(sql.query).to.include("ASC")

                await queryRunner.release()
            }),
        ))

    it("should support shorthand order syntax for property-level index", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMetadata = dataSource.getMetadata(Post)
                const ratingIndex = postMetadata.indices.find(
                    (idx) => idx.name === "IDX_POST_RATING_DESC",
                )

                expect(ratingIndex).to.exist
                expect(ratingIndex!.columnOptions).to.exist
                expect(ratingIndex!.columnOptions!.rating).to.exist
                expect(ratingIndex!.columnOptions!.rating.order).to.equal(
                    "DESC",
                )

                // Verify SQL generation
                const queryRunner = dataSource.createQueryRunner()
                const tableIndex = TableIndex.create(ratingIndex!)
                const table = await queryRunner.getTable(postMetadata.tableName)

                const sql = (queryRunner as any).createIndexSql(
                    table,
                    tableIndex,
                )

                expect(sql.query).to.include("DESC")

                await queryRunner.release()
            }),
        ))
})
