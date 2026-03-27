import { expect } from "chai"
import type { DataSource, EntityManager } from "../../../../src"
import {
    createTestingConnections,
    reloadTestingDatabases,
    closeTestingConnections,
} from "../../../utils/test-utils"
import { Category } from "./entity/Category"
import { Post } from "./entity/Post"
import { IsolationLevels } from "../../../../src/driver/types/IsolationLevel"
import { MysqlDriver } from "../../../../src/driver/mysql/MysqlDriver"

const supportedLevels = MysqlDriver.supportedIsolationLevels
const unsupportedLevels = IsolationLevels.filter(
    (level) => !supportedLevels.includes(level),
)

const getCurrentTransactionLevelAndAssert = async (
    entityManager: EntityManager,
    expectedIsolationLevel: string,
) => {
    const query = `SELECT isolation_level FROM performance_schema.events_transactions_current WHERE state = 'ACTIVE'`
    const actualIsolationLevel = (await entityManager.query(query))[0]
        .isolation_level
    actualIsolationLevel.should.be.equal(expectedIsolationLevel)
}

describe("transaction > isolation level > mysql", () => {
    describe("defined for transaction", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                // MariaDB excluded: it does not implement performance_schema.events_transactions_current (MySQL-only),
                // and SELECT @@transaction_isolation returns the session default, not the active transaction's level.
                // See: https://bugs.mysql.com/bug.php?id=53341
                enabledDrivers: ["mysql"],
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        describe("supported", () => {
            for (const isolationLevel of supportedLevels) {
                it(isolationLevel, () =>
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

                            const post = await dataSource.manager.findOne(
                                Post,
                                {
                                    where: { title: "Post #1" },
                                },
                            )
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
                    ),
                )
            }
        })

        describe("unsupported", () => {
            for (const level of unsupportedLevels) {
                it(level, () =>
                    Promise.all(
                        dataSources.map(async (dataSource) => {
                            await dataSource.manager
                                .transaction(level, async () => {})
                                .should.be.rejectedWith("is not supported")
                        }),
                    ),
                )
            }
        })
    })
})
