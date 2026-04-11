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
import { PostgresDriver } from "../../../../src/driver/postgres/PostgresDriver"

const supportedLevels = PostgresDriver.supportedIsolationLevels
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

    if (
        entityManager.dataSource.driver.options.type === "cockroachdb" &&
        expectedIsolationLevel === "READ UNCOMMITTED"
    ) {
        // CockroachDB does not support READ UNCOMMITTED isolation level, it uses READ COMMITTED
        expect(actualIsolationLevel).to.equal("read committed")
    } else {
        expect(actualIsolationLevel).to.equal(
            expectedIsolationLevel.toLowerCase(),
        )
    }
}

describe("transaction > isolation level > postgres / cockroachdb", () => {
    describe("defined for transaction", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres", "cockroachdb"],
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
                        enabledDrivers: ["postgres", "cockroachdb"],
                        schemaCreate: true,
                        dropSchema: true,
                    })
                    await closeTestingConnections(setup)

                    dataSources = await createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["postgres", "cockroachdb"],
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
