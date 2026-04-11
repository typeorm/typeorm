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
import type { EntityManager } from "../../../../src/entity-manager/EntityManager"
import { IsolationLevels } from "../../../../src/driver/types/IsolationLevel"
import { AbstractSqliteDriver } from "../../../../src/driver/sqlite-abstract/AbstractSqliteDriver"

const supportedLevels = AbstractSqliteDriver.supportedIsolationLevels
const unsupportedLevels = IsolationLevels.filter(
    (level) => !supportedLevels.includes(level),
)

const getCurrentTransactionLevelAndAssert = async (
    entityManager: EntityManager,
    expectedIsolationLevel: string,
) => {
    const query = `PRAGMA read_uncommitted`
    const actualIsolationLevel = (await entityManager.query(query))[0]
        .read_uncommitted
    if (expectedIsolationLevel === "READ UNCOMMITTED") {
        expect(actualIsolationLevel).to.equal(1)
    } else {
        expect(actualIsolationLevel).to.equal(0)
    }
}

describe("transaction > isolation level > sqlite", () => {
    describe("defined for transaction", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["better-sqlite3", "sqljs"],
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
                                    const post = new Post()
                                    post.title = "Post #1"
                                    await entityManager.save(post)

                                    await getCurrentTransactionLevelAndAssert(
                                        entityManager,
                                        isolationLevel,
                                    )

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
                    // DDL failures under non-default isolation
                    const setup = await createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["better-sqlite3", "sqljs"],
                        schemaCreate: true,
                        dropSchema: true,
                    })
                    await closeTestingConnections(setup)

                    dataSources = await createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["better-sqlite3", "sqljs"],
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
