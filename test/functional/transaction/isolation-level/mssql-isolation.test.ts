import { expect } from "chai"
import type { DataSource, EntityManager } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Category } from "./entity/Category"
import { Post } from "./entity/Post"
import { IsolationLevels } from "../../../../src/driver/types/IsolationLevel"
import { SqlServerDriver } from "../../../../src/driver/sqlserver/SqlServerDriver"

const supportedLevels = SqlServerDriver.supportedIsolationLevels
const unsupportedLevels = IsolationLevels.filter(
    (level) => !supportedLevels.includes(level),
)

const getCurrentTransactionLevelAndAssert = async (
    entityManagerOrDataSource: EntityManager | DataSource,
    expectedIsolationLevel: string,
) => {
    const query = `DBCC USEROPTIONS`
    const actualIsolationLevel = await entityManagerOrDataSource.query(query)
    actualIsolationLevel[actualIsolationLevel.length - 1].Value.should.be.equal(
        expectedIsolationLevel.toLowerCase(),
    )
}

const prepareDataAndTest = async (dataSource: DataSource) => {
    const post = new Post()
    post.title = "Post #1"
    await dataSource.manager.save(post)

    const category = new Category()
    category.name = "Category #1"
    await dataSource.manager.save(category)

    const loadedPost = await dataSource.manager.findOne(Post, {
        where: { title: "Post #1" },
    })

    expect(loadedPost).not.to.be.null
    loadedPost!.should.be.eql({
        id: post.id,
        title: "Post #1",
    })

    const loadedCategory = await dataSource.manager.findOne(Category, {
        where: { name: "Category #1" },
    })
    expect(loadedCategory).not.to.be.null
    loadedCategory!.should.be.eql({
        id: category.id,
        name: "Category #1",
    })
}

describe("transaction > isolation level > mssql", () => {
    describe("defined in data source", () => {
        describe("connection level", () => {
            // Skipped: node-mssql does not reset session state when returning connections
            // to the pool, so connectionIsolationLevel can be overwritten by prior operations.
            // Upstream: https://github.com/tediousjs/node-mssql/issues/1483
            // Docs: https://typeorm.io/microsoft-sqlserver#connection-pool-does-not-reset-isolation-level
            describe.skip("supported", () => {
                for (const isolationLevel of supportedLevels) {
                    // As per SqlServerDataSourceOptions: The default isolation level for new connections. All out-of-transaction queries are executed with this setting.
                    describe(isolationLevel, () => {
                        let dataSources: DataSource[]
                        before(async () => {
                            dataSources = await createTestingConnections({
                                entities: [__dirname + "/entity/*{.js,.ts}"],
                                enabledDrivers: ["mssql"],
                                driverSpecific: {
                                    options: {
                                        connectionIsolationLevel:
                                            isolationLevel,
                                    },
                                },
                            })
                        })
                        beforeEach(() => reloadTestingDatabases(dataSources))
                        after(() => closeTestingConnections(dataSources))

                        it(`should execute all operations with default ${isolationLevel} level for new connections`, () =>
                            Promise.all(
                                dataSources.map(async (dataSource) => {
                                    await getCurrentTransactionLevelAndAssert(
                                        dataSource,
                                        isolationLevel,
                                    )
                                    await prepareDataAndTest(dataSource)
                                }),
                            ))
                    })
                }
            })

            describe("unsupported", () => {
                for (const level of unsupportedLevels) {
                    it(level, async () => {
                        await createTestingConnections({
                            entities: [__dirname + "/entity/*{.js,.ts}"],
                            enabledDrivers: ["mssql"],
                            driverSpecific: {
                                options: {
                                    connectionIsolationLevel: level,
                                },
                            },
                        }).should.be.rejectedWith("is not supported")
                    })
                }
            })
        })

        describe("default level", () => {
            // Skipped: same upstream pool limitation as connectionIsolationLevel above.
            // Upstream: https://github.com/tediousjs/node-mssql/issues/1483
            // Docs: https://typeorm.io/microsoft-sqlserver#connection-pool-does-not-reset-isolation-level
            describe.skip("supported", () => {
                for (const isolationLevel of supportedLevels) {
                    // As per SqlServerDataSourceOptions: The default isolation level that transactions will be run with.
                    describe(isolationLevel, () => {
                        let dataSources: DataSource[]
                        before(async () => {
                            dataSources = await createTestingConnections({
                                entities: [__dirname + "/entity/*{.js,.ts}"],
                                enabledDrivers: ["mssql"],
                                driverSpecific: {
                                    options: {
                                        isolationLevel: isolationLevel,
                                    },
                                },
                            })
                        })
                        beforeEach(() => reloadTestingDatabases(dataSources))
                        after(() => closeTestingConnections(dataSources))

                        it(`should execute all operations with default ${isolationLevel} level`, () =>
                            Promise.all(
                                dataSources.map(async (dataSource) => {
                                    await getCurrentTransactionLevelAndAssert(
                                        dataSource,
                                        isolationLevel,
                                    )
                                    await prepareDataAndTest(dataSource)
                                }),
                            ))
                    })
                }
            })

            describe("unsupported", () => {
                for (const level of unsupportedLevels) {
                    it(level, async () => {
                        await createTestingConnections({
                            entities: [__dirname + "/entity/*{.js,.ts}"],
                            enabledDrivers: ["mssql"],
                            driverSpecific: {
                                options: {
                                    isolationLevel: level,
                                },
                            },
                        }).should.be.rejectedWith("is not supported")
                    })
                }
            })
        })
    })

    describe("defined for transaction", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["mssql"],
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        describe("supported", () => {
            for (const isolationLevel of supportedLevels) {
                it(isolationLevel, () =>
                    Promise.all(
                        dataSources.map(async (dataSource) => {
                            let postId: number | undefined
                            const transactionPromise =
                                dataSource.manager.transaction(
                                    isolationLevel,
                                    async (transactionalEntityManager) => {
                                        const post = new Post()
                                        post.title = "Post #1"
                                        const savedPost =
                                            await transactionalEntityManager.save(
                                                post,
                                            )

                                        await getCurrentTransactionLevelAndAssert(
                                            transactionalEntityManager,
                                            isolationLevel,
                                        ) // per-transaction isolation level correctly set

                                        postId = savedPost.id

                                        const category = new Category()
                                        category.name = "Category #1"
                                        await transactionalEntityManager.save(
                                            category,
                                        )
                                    },
                                )

                            try {
                                await transactionPromise
                            } catch (error) {
                                expect(error.message).to.match(
                                    /Snapshot isolation transaction failed accessing database 'tempdb' because snapshot isolation is not allowed in this database/,
                                )
                                return
                            }

                            const loadedPost = await dataSource.manager.findOne(
                                Post,
                                {
                                    where: { id: postId },
                                },
                            )

                            expect(loadedPost).not.to.be.null
                            loadedPost!.should.be.eql({
                                id: postId,
                                title: "Post #1",
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
