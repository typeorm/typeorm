import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import { expect } from "chai"

describe("transaction > transaction with full isolation support", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql", "mariadb", "mssql", "postgres", "sap"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    const isolationLevels = [
        "READ UNCOMMITTED",
        "SERIALIZABLE",
        "REPEATABLE READ",
        "READ COMMITTED",
    ] as const

    for (const isolationLevel of isolationLevels) {
        it(`should execute all operations in a single transaction with ${isolationLevel} isolation level`, () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    // SAP does not support READ UNCOMMITTED isolation level
                    if (
                        dataSource.driver.options.type === "sap" &&
                        isolationLevel === "READ UNCOMMITTED"
                    )
                        return

                    let postId: number | undefined = undefined,
                        categoryId: number | undefined = undefined

                    await dataSource.manager.transaction(
                        isolationLevel,
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            const category = new Category()
                            category.name = "Category #1"
                            await entityManager.save(category)

                            postId = post.id
                            categoryId = category.id
                        },
                    )

                    const post = await dataSource.manager.findOne(Post, {
                        where: { title: "Post #1" },
                    })
                    expect(post).not.to.be.null
                    post!.should.be.eql({
                        id: postId,
                        title: "Post #1",
                    })

                    const category = await dataSource.manager.findOne(
                        Category,
                        {
                            where: { name: "Category #1" },
                        },
                    )
                    expect(category).not.to.be.null
                    category!.should.be.eql({
                        id: categoryId,
                        name: "Category #1",
                    })
                }),
            ))
    }
})
