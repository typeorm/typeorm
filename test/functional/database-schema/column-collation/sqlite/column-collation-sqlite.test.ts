import "reflect-metadata"
import { Post } from "./entity/Post"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { expect } from "chai"

describe("database schema > column collation > sqlite", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["better-sqlite3"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should correctly create column with collation option", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    const postRepository = dataSource.getRepository(Post)
                    const table = await queryRunner.getTable("post")

                    const post = new Post()
                    post.id = 1
                    post.name = "Post"
                    post.description = "description"
                    post.text = "text"
                    post.nonCollated = "nonCollated"
                    post.defaultContainsCollateKeyword =
                        "defaultContainsCollateKeyword"
                    post.enumCollated = "COLLATE BINARY"
                    post.nameAsTableName = "nameAsTableName"
                    post.nameWithComma = "nameWithComma"
                    post.nameWithDot = "nameWithDot"
                    await postRepository.save(post)

                    expect(table?.findColumnByName("name")?.collation).to.equal(
                        "RTRIM",
                    )

                    expect(
                        table?.findColumnByName("description")?.collation,
                    ).to.equal("NOCASE")

                    expect(table?.findColumnByName("text")?.collation).to.equal(
                        "BINARY",
                    )

                    expect(
                        table?.findColumnByName("enumCollated")?.collation,
                    ).to.equal("NOCASE")

                    expect(table?.findColumnByName("post")?.collation).to.equal(
                        "NOCASE",
                    )

                    expect(
                        table?.findColumnByName("name,with,comma")?.collation,
                    ).to.equal("RTRIM")

                    expect(
                        table?.findColumnByName("name.with.dot")?.collation,
                    ).to.equal("NOCASE")

                    expect(
                        table?.findColumnByName("defaultContainsCollateKeyword")
                            ?.collation,
                    ).to.be.undefined

                    expect(table?.findColumnByName("nonCollated")?.collation).to
                        .be.undefined
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("should not generate schema changes for collation formatting differences", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                expect(sqlInMemory.upQueries).to.eql([])
                expect(sqlInMemory.downQueries).to.eql([])
            }),
        ))
})
