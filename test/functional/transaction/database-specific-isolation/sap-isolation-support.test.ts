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
import type { EntityManager } from "../../../../src"

const getCurrentTransactionLevelAndAssert = async (
    entityManager: EntityManager,
    expectedIsolationLevel: string,
) => {
    const query = `SELECT CURRENT_TRANSACTION_ISOLATION_LEVEL AS isolation_level FROM SYS.DUMMY`
    const actualIsolationLevel = (await entityManager.query(query))[0]
        .ISOLATION_LEVEL
    actualIsolationLevel.should.be.equal(expectedIsolationLevel)
}

describe("transaction > transaction with sap full isolation support", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["sap"],
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
                    if (isolationLevel === "READ UNCOMMITTED") return

                    let postId: number | undefined = undefined,
                        categoryId: number | undefined = undefined

                    await dataSource.manager.transaction(
                        isolationLevel,
                        async (entityManager) => {
                            await getCurrentTransactionLevelAndAssert(
                                entityManager,
                                isolationLevel,
                            )

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
