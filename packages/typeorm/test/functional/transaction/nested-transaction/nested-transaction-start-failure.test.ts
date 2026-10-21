import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { expect } from "chai"
import type { EntitySubscriberInterface } from "../../../../src/subscriber/EntitySubscriberInterface"
import { IsolationLevels } from "../../../../src/driver/types/IsolationLevel"

// GitHub Issue #12976: Nested transaction() rolls back the caller when startTransaction() fails
describe("transaction > nested transaction start failure", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not roll back enclosing transaction when nested startTransaction fails due to unsupported isolation level", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (dataSource.driver.transactionSupport !== "nested") return

                const unsupportedLevel = IsolationLevels.find(
                    (level) =>
                        !dataSource.driver.supportedIsolationLevels.includes(
                            level,
                        ),
                )
                if (!unsupportedLevel) return

                await dataSource.manager.transaction(async (em0) => {
                    const post1 = new Post()
                    post1.title = "outer-post-1"
                    await em0.save(post1)

                    let nestedError: Error | null = null
                    try {
                        await em0.transaction(unsupportedLevel, async (em1) => {
                            const post2 = new Post()
                            post2.title = "nested-post"
                            await em1.save(post2)
                        })
                    } catch (err) {
                        if (err instanceof Error) {
                            nestedError = err
                        }
                    }

                    expect(nestedError).to.not.be.null
                    expect(em0.queryRunner?.isTransactionActive).to.be.true

                    const post3 = new Post()
                    post3.title = "outer-post-2"
                    await em0.save(post3)
                })

                const savedPosts = await dataSource.manager.find(Post)
                expect(savedPosts).to.have.length(2)
                expect(savedPosts.map((p) => p.title)).to.include.members([
                    "outer-post-1",
                    "outer-post-2",
                ])
            }),
        ))

    it("should preserve enclosing transaction when nested beforeTransactionStart subscriber throws", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (dataSource.driver.transactionSupport !== "nested") return

                let failSubscriber = false
                const subscriber: EntitySubscriberInterface = {
                    beforeTransactionStart() {
                        if (failSubscriber) {
                            throw new Error(
                                "Subscriber failure during nested startTransaction",
                            )
                        }
                    },
                }
                dataSource.subscribers.push(subscriber)

                try {
                    await dataSource.manager.transaction(async (em0) => {
                        const post1 = new Post()
                        post1.title = "outer-sub-1"
                        await em0.save(post1)

                        failSubscriber = true
                        let nestedError: Error | null = null
                        try {
                            await em0.transaction(async (em1) => {
                                const post2 = new Post()
                                post2.title = "nested-sub"
                                await em1.save(post2)
                            })
                        } catch (err) {
                            if (err instanceof Error) {
                                nestedError = err
                            }
                        }

                        expect(nestedError).to.not.be.null
                        expect(em0.queryRunner?.isTransactionActive).to.be.true

                        const post3 = new Post()
                        post3.title = "outer-sub-2"
                        await em0.save(post3)
                    })

                    const savedPosts = await dataSource.manager.find(Post)
                    expect(savedPosts).to.have.length(2)
                    expect(savedPosts.map((p) => p.title)).to.include.members([
                        "outer-sub-1",
                        "outer-sub-2",
                    ])
                } finally {
                    const index = dataSource.subscribers.indexOf(subscriber)
                    if (index !== -1) {
                        dataSource.subscribers.splice(index, 1)
                    }
                }
            }),
        ))

    it("should clean up and restore runner when nested afterTransactionStart subscriber throws", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (dataSource.driver.transactionSupport !== "nested") return

                let failAfterSubscriber = false
                const subscriber: EntitySubscriberInterface = {
                    afterTransactionStart() {
                        if (failAfterSubscriber) {
                            throw new Error(
                                "Subscriber failure during nested afterTransactionStart",
                            )
                        }
                    },
                }
                dataSource.subscribers.push(subscriber)

                try {
                    await dataSource.manager.transaction(async (em0) => {
                        const post1 = new Post()
                        post1.title = "outer-after-1"
                        await em0.save(post1)

                        failAfterSubscriber = true
                        let nestedError: Error | null = null
                        try {
                            await em0.transaction(async (em1) => {
                                const post2 = new Post()
                                post2.title = "nested-after"
                                await em1.save(post2)
                            })
                        } catch (err) {
                            if (err instanceof Error) {
                                nestedError = err
                            }
                        }

                        expect(nestedError).to.not.be.null
                        expect(em0.queryRunner?.isTransactionActive).to.be.true

                        const post3 = new Post()
                        post3.title = "outer-after-2"
                        await em0.save(post3)
                    })

                    const savedPosts = await dataSource.manager.find(Post)
                    expect(savedPosts).to.have.length(2)
                    expect(savedPosts.map((p) => p.title)).to.include.members([
                        "outer-after-1",
                        "outer-after-2",
                    ])
                } finally {
                    const index = dataSource.subscribers.indexOf(subscriber)
                    if (index !== -1) {
                        dataSource.subscribers.splice(index, 1)
                    }
                }
            }),
        ))

    it("should not call rollbackTransaction and should reset isTransactionActive when root startTransaction fails", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                let failRootSubscriber = true
                const subscriber: EntitySubscriberInterface = {
                    beforeTransactionStart() {
                        if (failRootSubscriber) {
                            throw new Error(
                                "Subscriber failure during root startTransaction",
                            )
                        }
                    },
                }
                dataSource.subscribers.push(subscriber)

                try {
                    let rootError: Error | null = null
                    try {
                        await dataSource.transaction(async (em) => {
                            const post = new Post()
                            post.title = "should-not-save"
                            await em.save(post)
                        })
                    } catch (err) {
                        if (err instanceof Error) {
                            rootError = err
                        }
                    }

                    expect(rootError).to.not.be.null
                    expect(rootError?.message).to.equal(
                        "Subscriber failure during root startTransaction",
                    )

                    // Next transaction should succeed normally on the connection pool without orphaned transaction state
                    failRootSubscriber = false
                    await dataSource.transaction(async (em) => {
                        const post = new Post()
                        post.title = "clean-transaction-after-failure"
                        await em.save(post)
                    })

                    const posts = await dataSource.manager.find(Post)
                    expect(posts).to.have.length(1)
                    expect(posts[0].title).to.equal(
                        "clean-transaction-after-failure",
                    )
                } finally {
                    const index = dataSource.subscribers.indexOf(subscriber)
                    if (index !== -1) {
                        dataSource.subscribers.splice(index, 1)
                    }
                }
            }),
        ))

    it("should clean up connection state when root afterTransactionStart subscriber throws", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                let failRootAfterSubscriber = true
                const subscriber: EntitySubscriberInterface = {
                    afterTransactionStart() {
                        if (failRootAfterSubscriber) {
                            throw new Error(
                                "Subscriber failure during root afterTransactionStart",
                            )
                        }
                    },
                }
                dataSource.subscribers.push(subscriber)

                try {
                    let rootError: Error | null = null
                    try {
                        await dataSource.transaction(async (em) => {
                            const post = new Post()
                            post.title = "should-not-save"
                            await em.save(post)
                        })
                    } catch (err) {
                        if (err instanceof Error) {
                            rootError = err
                        }
                    }

                    expect(rootError).to.not.be.null
                    expect(rootError?.message).to.equal(
                        "Subscriber failure during root afterTransactionStart",
                    )

                    failRootAfterSubscriber = false
                    await dataSource.transaction(async (em) => {
                        const post = new Post()
                        post.title = "after-root-failure"
                        await em.save(post)
                    })

                    const posts = await dataSource.manager.find(Post)
                    expect(posts).to.have.length(1)
                    expect(posts[0].title).to.equal("after-root-failure")
                } finally {
                    const index = dataSource.subscribers.indexOf(subscriber)
                    if (index !== -1) {
                        dataSource.subscribers.splice(index, 1)
                    }
                }
            }),
        ))

    it("should allow another transaction on the same query runner after root afterTransactionStart subscriber failure", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                let failSubscriber = true
                const subscriber: EntitySubscriberInterface = {
                    afterTransactionStart() {
                        if (failSubscriber) {
                            throw new Error(
                                "Subscriber failure on single runner root start",
                            )
                        }
                    },
                }
                dataSource.subscribers.push(subscriber)

                const queryRunner = dataSource.createQueryRunner()
                try {
                    let firstError: Error | null = null
                    try {
                        await queryRunner.startTransaction()
                    } catch (err) {
                        if (err instanceof Error) {
                            firstError = err
                        }
                    }

                    expect(firstError).to.not.be.null
                    expect(firstError?.message).to.equal(
                        "Subscriber failure on single runner root start",
                    )
                    expect(queryRunner.isTransactionActive).to.be.false

                    // Subsequent transaction on the same runner should start as root and succeed
                    failSubscriber = false
                    await queryRunner.startTransaction()
                    expect(queryRunner.isTransactionActive).to.be.true

                    const post = new Post()
                    post.title = "same-runner-recovered"
                    await queryRunner.manager.save(post)

                    await queryRunner.commitTransaction()
                    expect(queryRunner.isTransactionActive).to.be.false

                    const posts = await dataSource.manager.find(Post)
                    expect(posts.map((p) => p.title)).to.include(
                        "same-runner-recovered",
                    )
                } finally {
                    await queryRunner.release()
                    const index = dataSource.subscribers.indexOf(subscriber)
                    if (index !== -1) {
                        dataSource.subscribers.splice(index, 1)
                    }
                }
            }),
        ))

    it("should notify rollback subscribers when afterTransactionStart throws and level is rolled back", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const events: string[] = []

                const observerSubscriber: EntitySubscriberInterface = {
                    beforeTransactionStart() {
                        events.push("beforeTransactionStart")
                    },
                    afterTransactionStart() {
                        events.push("afterTransactionStart")
                    },
                    beforeTransactionRollback() {
                        events.push("beforeTransactionRollback")
                    },
                    afterTransactionRollback() {
                        events.push("afterTransactionRollback")
                    },
                }

                const failingSubscriber: EntitySubscriberInterface = {
                    afterTransactionStart() {
                        throw new Error("After start failure")
                    },
                }

                dataSource.subscribers.push(
                    observerSubscriber,
                    failingSubscriber,
                )

                const queryRunner = dataSource.createQueryRunner()
                try {
                    let thrownError: Error | null = null
                    try {
                        await queryRunner.startTransaction()
                    } catch (err) {
                        if (err instanceof Error) {
                            thrownError = err
                        }
                    }

                    expect(thrownError).to.not.be.null
                    expect(events).to.deep.equal([
                        "beforeTransactionStart",
                        "afterTransactionStart",
                        "beforeTransactionRollback",
                        "afterTransactionRollback",
                    ])
                    expect(queryRunner.isTransactionActive).to.be.false
                } finally {
                    await queryRunner.release()
                    const idx1 =
                        dataSource.subscribers.indexOf(observerSubscriber)
                    if (idx1 !== -1) dataSource.subscribers.splice(idx1, 1)
                    const idx2 =
                        dataSource.subscribers.indexOf(failingSubscriber)
                    if (idx2 !== -1) dataSource.subscribers.splice(idx2, 1)
                }
            }),
        ))

    it("should settle and reject startTransaction even if both afterTransactionStart and afterTransactionRollback throw", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const failingSubscriber: EntitySubscriberInterface = {
                    afterTransactionStart() {
                        throw new Error("After start failure")
                    },
                    afterTransactionRollback() {
                        throw new Error("After rollback failure")
                    },
                }

                dataSource.subscribers.push(failingSubscriber)

                const queryRunner = dataSource.createQueryRunner()
                try {
                    let thrownError: Error | null = null
                    try {
                        await queryRunner.startTransaction()
                    } catch (err) {
                        if (err instanceof Error) {
                            thrownError = err
                        }
                    }

                    expect(thrownError).to.not.be.null
                    expect(queryRunner.isTransactionActive).to.be.false
                } finally {
                    await queryRunner.release()
                    const idx =
                        dataSource.subscribers.indexOf(failingSubscriber)
                    if (idx !== -1) dataSource.subscribers.splice(idx, 1)
                }
            }),
        ))
})
