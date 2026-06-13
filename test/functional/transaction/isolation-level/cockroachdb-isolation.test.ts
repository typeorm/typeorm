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
import { CockroachDriver } from "../../../../src/driver/cockroachdb/CockroachDriver"

const supportedLevels = CockroachDriver.supportedIsolationLevels
const unsupportedLevels = IsolationLevels.filter(
    (level) => !supportedLevels.includes(level),
)

const getCurrentTransactionLevelAndAssert = async (
    entityManager: EntityManager,
    expectedIsolationLevel: string,
) => {
    const query = `SHOW TRANSACTION ISOLATION LEVEL`
    const actualIsolationLevel = (await entityManager.query(query))[0]
        .transaction_isolation

    expect(actualIsolationLevel).to.equal(expectedIsolationLevel.toLowerCase())
}

const getExpectedIsolationForDefaultSettings = (
    requestedIsolationLevel: string,
) => {
    if (requestedIsolationLevel === "READ UNCOMMITTED") {
        return "READ COMMITTED"
    }

    return requestedIsolationLevel
}

const setIsolationClusterSettings = async (
    dataSource: DataSource,
    settings: {
        readCommitted: boolean
        repeatableRead: boolean
    },
) => {
    await dataSource.query(
        `SET CLUSTER SETTING sql.txn.read_committed_isolation.enabled = '${settings.readCommitted}'`,
    )
    await dataSource.query(
        `SET CLUSTER SETTING sql.txn.repeatable_read_isolation.enabled = '${settings.repeatableRead}'`,
    )
}

describe("transaction > isolation level > cockroachdb", () => {
    describe("defined for transaction", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["cockroachdb"],
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
                                        getExpectedIsolationForDefaultSettings(
                                            isolationLevel,
                                        ),
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
                            expect(post).to.eql({
                                id: postId,
                                title: "Post #1",
                            })

                            const category = await dataSource.manager.findOne(
                                Category,
                                {
                                    where: { name: "Category #1" },
                                },
                            )
                            expect(category).to.eql({
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

    describe("defined in data source", () => {
        for (const isolationLevel of supportedLevels) {
            describe(isolationLevel, () => {
                let dataSources: DataSource[]
                before(async () => {
                    // Create schema without isolation level to avoid
                    // DDL failures under weak isolation
                    const setup = await createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["cockroachdb"],
                        schemaCreate: true,
                        dropSchema: true,
                    })
                    await closeTestingConnections(setup)

                    dataSources = await createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["cockroachdb"],
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
                                async (entityManager) => {
                                    await getCurrentTransactionLevelAndAssert(
                                        entityManager,
                                        getExpectedIsolationForDefaultSettings(
                                            isolationLevel,
                                        ),
                                    )
                                },
                            )
                        }),
                    ))
            })
        }
    })

    describe("fallback behavior", () => {
        let dataSources: DataSource[]

        before(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["cockroachdb"],
            })
        })

        beforeEach(() => reloadTestingDatabases(dataSources))
        after(async () => {
            try {
                await Promise.all(
                    dataSources.map((dataSource) =>
                        setIsolationClusterSettings(dataSource, {
                            readCommitted: true,
                            repeatableRead: true,
                        }),
                    ),
                )
            } finally {
                await closeTestingConnections(dataSources)
            }
        })

        const fallbackCases: Array<{
            name: string
            requestedIsolationLevel:
                | "READ COMMITTED"
                | "READ UNCOMMITTED"
                | "REPEATABLE READ"
            settings: {
                readCommitted: boolean
                repeatableRead: boolean
            }
            expectedIsolationLevel:
                | "READ COMMITTED"
                | "REPEATABLE READ"
                | "SERIALIZABLE"
        }> = [
            {
                name: "READ COMMITTED -> SERIALIZABLE when read committed and repeatable read settings are disabled",
                requestedIsolationLevel: "READ COMMITTED",
                settings: {
                    readCommitted: false,
                    repeatableRead: false,
                },
                expectedIsolationLevel: "SERIALIZABLE",
            },
            {
                name: "READ COMMITTED -> REPEATABLE READ when read committed setting is disabled and repeatable read setting is enabled",
                requestedIsolationLevel: "READ COMMITTED",
                settings: {
                    readCommitted: false,
                    repeatableRead: true,
                },
                expectedIsolationLevel: "REPEATABLE READ",
            },
            {
                name: "READ UNCOMMITTED -> SERIALIZABLE when read committed and repeatable read settings are disabled",
                requestedIsolationLevel: "READ UNCOMMITTED",
                settings: {
                    readCommitted: false,
                    repeatableRead: false,
                },
                expectedIsolationLevel: "SERIALIZABLE",
            },
            {
                name: "READ UNCOMMITTED -> READ COMMITTED when read committed setting is enabled",
                requestedIsolationLevel: "READ UNCOMMITTED",
                settings: {
                    readCommitted: true,
                    repeatableRead: true,
                },
                expectedIsolationLevel: "READ COMMITTED",
            },
            {
                name: "READ UNCOMMITTED -> REPEATABLE READ when read committed setting is disabled and repeatable read setting is enabled",
                requestedIsolationLevel: "READ UNCOMMITTED",
                settings: {
                    readCommitted: false,
                    repeatableRead: true,
                },
                expectedIsolationLevel: "REPEATABLE READ",
            },
            {
                name: "REPEATABLE READ -> SERIALIZABLE when repeatable read setting is disabled",
                requestedIsolationLevel: "REPEATABLE READ",
                settings: {
                    readCommitted: true,
                    repeatableRead: false,
                },
                expectedIsolationLevel: "SERIALIZABLE",
            },
        ]

        for (const testCase of fallbackCases) {
            it(testCase.name, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await setIsolationClusterSettings(
                            dataSource,
                            testCase.settings,
                        )

                        await dataSource.manager.transaction(
                            testCase.requestedIsolationLevel,
                            async (entityManager) => {
                                await getCurrentTransactionLevelAndAssert(
                                    entityManager,
                                    testCase.expectedIsolationLevel,
                                )
                            },
                        )
                    }),
                ),
            )
        }
    })
})
