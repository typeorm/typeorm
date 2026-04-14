import { expect } from "chai"
import type { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Category } from "./entity/Category"
import { Post } from "./entity/Post"
import { IsolationLevels } from "../../../../src/driver/types/IsolationLevel"
import { SpannerDriver } from "../../../../src/driver/spanner/SpannerDriver"

const supportedLevels = SpannerDriver.supportedIsolationLevels
const unsupportedLevels = IsolationLevels.filter(
    (level) => !supportedLevels.includes(level),
)

describe("transaction > isolation level > spanner", () => {
    describe("defined for transaction", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["spanner"],
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

    describe("state after start", () => {
        // The Spanner session transaction is a protected field and has no
        // public accessor; these tests inspect and stub it through a narrow
        // local type rather than a blanket `any` cast.
        type SessionTransactionLike = {
            setReadWriteTransactionOptions(options: {
                isolationLevel: string
            }): void
            begin(): Promise<void>
            _options?: { isolationLevel?: unknown }
        }
        type QueryRunnerInternals = {
            sessionTransaction?: SessionTransactionLike
        }

        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["spanner"],
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("should not leak isolation level between subsequent transactions", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const queryRunner = dataSource.createQueryRunner()
                    const internals =
                        queryRunner as unknown as QueryRunnerInternals
                    try {
                        await queryRunner.startTransaction("REPEATABLE READ")
                        await queryRunner.commitTransaction()

                        await queryRunner.startTransaction()
                        // _options.isolationLevel may hold either the numeric
                        // protobuf value or its string key — both represent
                        // REPEATABLE_READ and would indicate a leaked option.
                        expect([2, "REPEATABLE_READ"]).to.not.include(
                            internals.sessionTransaction?._options
                                ?.isolationLevel,
                        )
                        await queryRunner.commitTransaction()
                    } finally {
                        await queryRunner.release()
                    }
                }),
            ))

        it("should reset isTransactionActive if begin fails", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const queryRunner = dataSource.createQueryRunner()
                    const internals =
                        queryRunner as unknown as QueryRunnerInternals
                    try {
                        await queryRunner.connect()
                        internals.sessionTransaction = {
                            setReadWriteTransactionOptions: () => {},
                            begin: async () => {
                                throw new Error("simulated begin failure")
                            },
                        }
                        await queryRunner
                            .startTransaction()
                            .should.be.rejectedWith("simulated begin failure")
                        expect(queryRunner.isTransactionActive).to.equal(false)
                    } finally {
                        await queryRunner.release()
                    }
                }),
            ))
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
                        enabledDrivers: ["spanner"],
                        schemaCreate: true,
                        dropSchema: true,
                    })
                    await closeTestingConnections(setup)

                    dataSources = await createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["spanner"],
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
                                    const post = new Post()
                                    post.title = "Post #1"
                                    await entityManager.save(post)
                                },
                            )
                        }),
                    ))
            })
        }
    })
})
