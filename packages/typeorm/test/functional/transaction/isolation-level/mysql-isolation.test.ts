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
    const query = `SELECT transaction_event.isolation_level
        FROM performance_schema.events_transactions_current transaction_event
        INNER JOIN performance_schema.threads thread
            ON thread.THREAD_ID = transaction_event.THREAD_ID
        WHERE transaction_event.state = 'ACTIVE'
            AND thread.PROCESSLIST_ID = CONNECTION_ID()`
    const actualIsolationLevel = (await entityManager.query(query))[0]
        .isolation_level
    expect(actualIsolationLevel).to.equal(expectedIsolationLevel)
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

        it("should inspect only the current connection when another transaction is active", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const readCommittedRunner = dataSource.createQueryRunner()
                    const serializableRunner = dataSource.createQueryRunner()
                    const runners = [readCommittedRunner, serializableRunner]
                    try {
                        await readCommittedRunner.startTransaction(
                            "READ COMMITTED",
                        )
                        await serializableRunner.startTransaction(
                            "SERIALIZABLE",
                        )

                        await getCurrentTransactionLevelAndAssert(
                            readCommittedRunner.manager,
                            "READ COMMITTED",
                        )
                        await getCurrentTransactionLevelAndAssert(
                            serializableRunner.manager,
                            "SERIALIZABLE",
                        )
                    } finally {
                        await Promise.all(
                            runners.map(async (runner) => {
                                try {
                                    if (runner.isTransactionActive)
                                        await runner.rollbackTransaction()
                                } finally {
                                    await runner.release()
                                }
                            }),
                        )
                    }
                }),
            ))

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
                    // DDL failures under non-default isolation
                    const setup = await createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"],
                        schemaCreate: true,
                        dropSchema: true,
                    })
                    await closeTestingConnections(setup)

                    dataSources = await createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"],
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
                                        isolationLevel,
                                    )
                                },
                            )
                        }),
                    ))
            })
        }
    })
})
