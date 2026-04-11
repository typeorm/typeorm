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
    expect(
        actualIsolationLevel[actualIsolationLevel.length - 1].Value,
    ).to.equal(expectedIsolationLevel.toLowerCase())
}

const prepareDataAndTest = async (dataSource: DataSource) => {
    const post = new Post()
    post.title = "Post #1"
    await dataSource.manager.save(post)

    const category = new Category()
    category.name = "Category #1"
    await dataSource.manager.save(category)

    const loadedPost = await dataSource.manager.findOneBy(Post, {
        title: "Post #1",
    })

    expect(loadedPost).to.eql({
        id: post.id,
        title: "Post #1",
    })

    const loadedCategory = await dataSource.manager.findOneBy(Category, {
        name: "Category #1",
    })
    expect(loadedCategory).to.eql({
        id: category.id,
        name: "Category #1",
    })
}

describe("transaction > isolation level > mssql", () => {
    describe("defined in data source", () => {
        describe("isolationLevel", () => {
            // SNAPSHOT excluded: requires ALTER DATABASE ... SET ALLOW_SNAPSHOT_ISOLATION ON
            const levelsWithoutSnapshot = supportedLevels.filter(
                (l) => l !== "SNAPSHOT",
            )

            for (const isolationLevel of levelsWithoutSnapshot) {
                describe(isolationLevel, () => {
                    let dataSources: DataSource[]
                    before(async () => {
                        // Create schema without isolation level to avoid
                        // DDL failures under non-default isolation
                        const setup = await createTestingConnections({
                            entities: [__dirname + "/entity/*{.js,.ts}"],
                            enabledDrivers: ["mssql"],
                            schemaCreate: true,
                            dropSchema: true,
                        })
                        await closeTestingConnections(setup)

                        dataSources = await createTestingConnections({
                            entities: [__dirname + "/entity/*{.js,.ts}"],
                            enabledDrivers: ["mssql"],
                            driverSpecific: {
                                isolationLevel,
                            },
                        })
                    })
                    after(() => closeTestingConnections(dataSources))

                    it(`should apply ${isolationLevel} as default`, () =>
                        Promise.all(
                            dataSources.map(async (dataSource) => {
                                await dataSource.manager.transaction(
                                    async (transactionalEntityManager) => {
                                        await getCurrentTransactionLevelAndAssert(
                                            transactionalEntityManager,
                                            isolationLevel,
                                        )
                                    },
                                )
                            }),
                        ))
                })
            }
        })

        describe("driver options", () => {
            describe("connectionIsolationLevel", () => {
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
                                    entities: [
                                        __dirname + "/entity/*{.js,.ts}",
                                    ],
                                    enabledDrivers: ["mssql"],
                                    driverSpecific: {
                                        options: {
                                            connectionIsolationLevel:
                                                isolationLevel,
                                        },
                                    },
                                })
                            })
                            beforeEach(() =>
                                reloadTestingDatabases(dataSources),
                            )
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

            describe("isolationLevel", () => {
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
                                    entities: [
                                        __dirname + "/entity/*{.js,.ts}",
                                    ],
                                    enabledDrivers: ["mssql"],
                                    driverSpecific: {
                                        options: {
                                            isolationLevel: isolationLevel,
                                        },
                                    },
                                })
                            })
                            beforeEach(() =>
                                reloadTestingDatabases(dataSources),
                            )
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
                                if (isolationLevel === "SNAPSHOT") {
                                    // SNAPSHOT may fail if not enabled on the database
                                    expect(error.message).to.match(
                                        /snapshot isolation.*not allowed/i,
                                    )
                                    return
                                }
                                throw error
                            }

                            const loadedPost = await dataSource.manager.findOne(
                                Post,
                                {
                                    where: { id: postId },
                                },
                            )

                            expect(loadedPost).to.eql({
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
