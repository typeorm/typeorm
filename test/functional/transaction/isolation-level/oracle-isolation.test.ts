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
import { IsolationLevels } from "../../../../src/driver/types/IsolationLevel"
import { OracleDriver } from "../../../../src/driver/oracle/OracleDriver"

const supportedLevels = OracleDriver.supportedIsolationLevels
const unsupportedLevels = IsolationLevels.filter(
    (level) => !supportedLevels.includes(level),
)

// Note: Oracle does not expose the current transaction isolation level through any
// dictionary view, system variable, or built-in package, so these tests only verify
// that transactions complete successfully at each isolation level without asserting
// the active level directly.
describe("transaction > isolation level > oracle", () => {
    describe("defined for transaction", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["oracle"],
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

                            if (isolationLevel === "SERIALIZABLE") {
                                // Initial inserts are required to prevent ORA-08177 errors in Oracle 21c when using a serializable dataSource
                                // immediately after DDL statements. This ensures proper synchronization and helps avoid conflicts.
                                await dataSource.manager
                                    .getRepository(Post)
                                    .save({ title: "Post #0" })
                                await dataSource.manager
                                    .getRepository(Category)
                                    .save({ name: "Category #0" })
                            }

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
