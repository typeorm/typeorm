import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("github issues > #3357 migration generation drops and creates columns instead of altering", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: ["postgres"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should preserve data when changing column length", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Insert data before modifying the column
                await dataSource.getRepository(Post).insert({
                    id: 1,
                    title: "Test Post",
                    description: "Some description",
                })

                // Change column length via query runner (simulates migration)
                const queryRunner = dataSource.createQueryRunner()
                let table = await queryRunner.getTable("post")
                const titleColumn = table!.findColumnByName("title")!

                const changedTitleColumn = titleColumn.clone()
                changedTitleColumn.length = "100"
                await queryRunner.changeColumn(
                    table!,
                    titleColumn,
                    changedTitleColumn,
                )

                // Verify data is preserved
                const post = await dataSource
                    .getRepository(Post)
                    .findOneBy({ id: 1 })
                expect(post).to.not.be.null
                expect(post!.title).to.equal("Test Post")
                expect(post!.description).to.equal("Some description")

                // Verify column length was changed
                table = await queryRunner.getTable("post")
                expect(table!.findColumnByName("title")!.length).to.equal("100")

                // Revert and verify data still intact
                await queryRunner.executeMemoryDownSql()

                const postAfterRevert = await dataSource
                    .getRepository(Post)
                    .findOneBy({ id: 1 })
                expect(postAfterRevert).to.not.be.null
                expect(postAfterRevert!.title).to.equal("Test Post")

                await queryRunner.release()
            }),
        ))

    it("should preserve data when changing column type", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Insert data
                await dataSource.getRepository(Post).insert({
                    id: 1,
                    title: "Test Post",
                    description: "Some description",
                })

                // Change column type (varchar -> text)
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                const titleColumn = table!.findColumnByName("title")!

                const changedTitleColumn = titleColumn.clone()
                changedTitleColumn.type = "text"
                changedTitleColumn.length = ""
                await queryRunner.changeColumn(
                    table!,
                    titleColumn,
                    changedTitleColumn,
                )

                // Verify data is preserved after type change
                const post = await dataSource
                    .getRepository(Post)
                    .findOneBy({ id: 1 })
                expect(post).to.not.be.null
                expect(post!.title).to.equal("Test Post")

                // Revert and verify data still intact
                await queryRunner.executeMemoryDownSql()

                const postAfterRevert = await dataSource
                    .getRepository(Post)
                    .findOneBy({ id: 1 })
                expect(postAfterRevert).to.not.be.null
                expect(postAfterRevert!.title).to.equal("Test Post")

                await queryRunner.release()
            }),
        ))

    it("should generate ALTER COLUMN TYPE SQL instead of DROP+ADD", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                const titleColumn = table!.findColumnByName("title")!

                const changedTitleColumn = titleColumn.clone()
                changedTitleColumn.length = "200"

                // Clear SQL memory to capture only our change
                queryRunner.clearSqlMemory()
                await queryRunner.changeColumn(
                    table!,
                    titleColumn,
                    changedTitleColumn,
                )

                const sqlMemory = queryRunner.getMemorySql()
                const upQueries = sqlMemory.upQueries.map((q) => q.query)

                // Should contain ALTER COLUMN TYPE
                const hasAlterType = upQueries.some(
                    (q) => q.includes("ALTER COLUMN") && q.includes("TYPE"),
                )
                expect(hasAlterType).to.be.true

                // Should NOT contain DROP COLUMN
                const hasDropColumn = upQueries.some((q) =>
                    q.includes("DROP COLUMN"),
                )
                expect(hasDropColumn).to.be.false

                await queryRunner.executeMemoryDownSql()
                await queryRunner.release()
            }),
        ))
})
