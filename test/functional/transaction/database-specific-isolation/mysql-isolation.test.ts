import { expect } from "chai"
import type { DataSource, EntityManager } from "../../../../src"
import {
    createTestingConnections,
    reloadTestingDatabases,
    closeTestingConnections,
} from "../../../utils/test-utils"
import { Category } from "./entity/Category"
import { Post } from "./entity/Post"

const getCurrentTransactionLevelAndAssert = async (
    entityManager: EntityManager,
    expectedIsolationLevel: string,
) => {
    const query = `SELECT isolation_level FROM performance_schema.events_transactions_current WHERE state = 'ACTIVE'`
    const actualIsolationLevel = (await entityManager.query(query))[0]
        .isolation_level
    actualIsolationLevel.should.be.equal(expectedIsolationLevel)
}

describe("transaction > transaction with mysql/mariadb dataSource isolation support", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"], // mariadb not returning any isolation level from performance_schema.events_transactions_current table
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
