import { expect } from "chai"
import type { DataSource } from "../../../../src"
import { QueryFailedError } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"

// https://github.com/typeorm/typeorm/issues/11772
// https://github.com/typeorm/typeorm/issues/9984
describe("transaction > cockroachdb retry", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["cockroachdb"],
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    // Commits a write to the post outside the running transaction, on another
    // pooled connection. The transaction has already read the post, so its
    // next write conflicts and CockroachDB raises a 40001 serialization error.
    const concurrentUpdate = (dataSource: DataSource, values: Partial<Post>) =>
        dataSource.manager.update(Post, { id: 1 }, values)

    const isSerializationError = (err: unknown) =>
        err instanceof QueryFailedError &&
        (err.driverError as { code?: string }).code === "40001"

    it("should re-run the transaction callback when it is retried", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager.insert(Post, {
                    id: 1,
                    version: 1,
                    views: 0,
                })

                let attempts = 0
                await dataSource.manager.transaction(async (manager) => {
                    attempts++
                    await manager.findOneByOrFail(Post, { id: 1 })
                    if (attempts === 1)
                        await concurrentUpdate(dataSource, { version: 99 })
                    await manager.update(Post, { id: 1 }, { views: 1 })
                })

                // the callback must run again: a retry that skips it cannot
                // re-evaluate any application logic
                expect(attempts).to.be.greaterThan(1)
            }),
        ))

    it("should not skip conditional application logic on retry", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager.insert(Post, {
                    id: 1,
                    version: 1,
                    views: 0,
                })

                let attempts = 0
                try {
                    await dataSource.manager.transaction(async (manager) => {
                        attempts++
                        const post = await manager.findOneByOrFail(Post, {
                            id: 1,
                        })
                        if (attempts === 1)
                            await concurrentUpdate(dataSource, { version: 99 })
                        if (post.version === 1) {
                            await manager.update(
                                Post,
                                { id: 1 },
                                { version: 2 },
                            )
                        }
                    })
                } catch (err) {
                    // surfacing the serialization error is also acceptable
                    expect(isSerializationError(err)).to.be.true
                }

                const post = await dataSource.manager.findOneByOrFail(Post, {
                    id: 1,
                })
                // the concurrent write must not be silently overwritten
                expect(post.version).to.equal(99)
            }),
        ))

    it("should not write stale computed values on retry", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager.insert(Post, {
                    id: 1,
                    version: 1,
                    views: 0,
                })

                let attempts = 0
                let committed = true
                try {
                    await dataSource.manager.transaction(async (manager) => {
                        attempts++
                        const post = await manager.findOneByOrFail(Post, {
                            id: 1,
                        })
                        if (attempts === 1)
                            await concurrentUpdate(dataSource, { views: 1 })
                        await manager.update(
                            Post,
                            { id: 1 },
                            { views: post.views + 1 },
                        )
                    })
                } catch (err) {
                    expect(isSerializationError(err)).to.be.true
                    committed = false
                }

                const post = await dataSource.manager.findOneByOrFail(Post, {
                    id: 1,
                })
                // both increments must be kept, or only the concurrent one if
                // the transaction failed - never a lost update
                expect(post.views).to.equal(committed ? 2 : 1)
            }),
        ))

    it("should surface the 40001 error to manually controlled transactions", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager.insert(Post, {
                    id: 1,
                    version: 1,
                    views: 0,
                })

                const queryRunner = dataSource.createQueryRunner()
                let error: unknown
                try {
                    await queryRunner.startTransaction()
                    const post = await queryRunner.manager.findOneByOrFail(
                        Post,
                        { id: 1 },
                    )
                    await concurrentUpdate(dataSource, { version: 99 })
                    if (post.version === 1) {
                        await queryRunner.manager.update(
                            Post,
                            { id: 1 },
                            { version: 2 },
                        )
                    }
                    await queryRunner.commitTransaction()
                } catch (err) {
                    error = err
                    if (queryRunner.isTransactionActive)
                        await queryRunner.rollbackTransaction()
                } finally {
                    await queryRunner.release()
                }

                // TypeORM cannot re-run the application logic between the
                // queries, so it must not retry them on its own
                expect(isSerializationError(error)).to.be.true

                const post = await dataSource.manager.findOneByOrFail(Post, {
                    id: 1,
                })
                expect(post.version).to.equal(99)
            }),
        ))

    it("should surface the 40001 error from transactions opened by save()", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                let error: unknown
                try {
                    await queryRunner.query(
                        "SET inject_retry_errors_enabled = true",
                    )
                    await queryRunner.manager.save(Post, {
                        id: 1,
                        version: 1,
                        views: 0,
                    })
                } catch (err) {
                    error = err
                } finally {
                    await queryRunner.query(
                        "SET inject_retry_errors_enabled = false",
                    )
                    await queryRunner.release()
                }

                expect(isSerializationError(error)).to.be.true
                expect(await dataSource.manager.count(Post)).to.equal(0)
            }),
        ))

    it("should retry the transaction callback until injected retry errors stop", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // the injected errors stop after a few retries within the
                // same transaction, using the cockroach_restart savepoint
                const queryRunner = dataSource.createQueryRunner()
                let attempts = 0
                try {
                    await queryRunner.query(
                        "SET inject_retry_errors_enabled = true",
                    )
                    await queryRunner.manager.transaction((manager) => {
                        attempts++
                        return manager.save(Post, {
                            id: 1,
                            version: 1,
                            views: 0,
                        })
                    })
                } finally {
                    await queryRunner.query(
                        "SET inject_retry_errors_enabled = false",
                    )
                    await queryRunner.release()
                }

                expect(attempts).to.be.greaterThan(1)
                expect(await dataSource.manager.count(Post)).to.equal(1)
            }),
        ))

    it("should commit concurrent conflicting transactions by retrying them", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager.insert(Post, {
                    id: 1,
                    version: 1,
                    views: 0,
                })

                await Promise.all(
                    [1, 2, 3].map((i) =>
                        dataSource.manager.transaction(async (manager) => {
                            const post = await manager.findOneByOrFail(Post, {
                                id: 1,
                            })
                            await manager.update(
                                Post,
                                { id: 1 },
                                { version: i + 1, views: post.views + 1 },
                            )
                        }),
                    ),
                )

                const post = await dataSource.manager.findOneByOrFail(Post, {
                    id: 1,
                })
                expect(post.views).to.equal(3)
            }),
        ))

    it("should retry only the outermost transaction when transactions are nested", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager.insert(Post, {
                    id: 1,
                    version: 1,
                    views: 0,
                })

                let outerAttempts = 0
                let innerAttempts = 0
                await dataSource.manager.transaction(async (outer) => {
                    outerAttempts++
                    await outer.transaction(async (inner) => {
                        innerAttempts++
                        const post = await inner.findOneByOrFail(Post, {
                            id: 1,
                        })
                        if (innerAttempts === 1)
                            await concurrentUpdate(dataSource, { views: 1 })
                        await inner.update(
                            Post,
                            { id: 1 },
                            { views: post.views + 1 },
                        )
                    })
                })

                expect(outerAttempts).to.equal(2)
                expect(innerAttempts).to.equal(2)

                const post = await dataSource.manager.findOneByOrFail(Post, {
                    id: 1,
                })
                expect(post.views).to.equal(2)
            }),
        ))

    it("should retry the outermost transaction when the outer callback queries before the nested one", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager.insert(Post, {
                    id: 1,
                    version: 1,
                    views: 0,
                })

                let outerAttempts = 0
                let innerAttempts = 0
                await dataSource.manager.transaction(async (outer) => {
                    outerAttempts++
                    // after a retry error CockroachDB rejects rolling back to a
                    // savepoint created after the transaction did some work
                    await outer.findOneByOrFail(Post, { id: 1 })
                    await outer.transaction(async (inner) => {
                        innerAttempts++
                        const post = await inner.findOneByOrFail(Post, {
                            id: 1,
                        })
                        if (innerAttempts === 1)
                            await concurrentUpdate(dataSource, { views: 1 })
                        await inner.update(
                            Post,
                            { id: 1 },
                            { views: post.views + 1 },
                        )
                    })
                })

                expect(outerAttempts).to.equal(2)
                expect(innerAttempts).to.equal(2)

                const post = await dataSource.manager.findOneByOrFail(Post, {
                    id: 1,
                })
                expect(post.views).to.equal(2)
            }),
        ))

    describe("with maxTransactionRetries set to 0", () => {
        let noRetryDataSources: DataSource[]

        before(async () => {
            noRetryDataSources = await createTestingConnections({
                entities: [Post],
                enabledDrivers: ["cockroachdb"],
                driverSpecific: { maxTransactionRetries: 0 },
            })
        })

        beforeEach(() => reloadTestingDatabases(noRetryDataSources))
        after(() => closeTestingConnections(noRetryDataSources))

        it("should not retry the transaction callback", () =>
            Promise.all(
                noRetryDataSources.map(async (dataSource) => {
                    await dataSource.manager.insert(Post, {
                        id: 1,
                        version: 1,
                        views: 0,
                    })

                    let attempts = 0
                    let error: unknown
                    try {
                        await dataSource.manager.transaction(
                            async (manager) => {
                                attempts++
                                await manager.findOneByOrFail(Post, { id: 1 })
                                await concurrentUpdate(dataSource, {
                                    version: 99,
                                })
                                await manager.update(
                                    Post,
                                    { id: 1 },
                                    { version: 2 },
                                )
                            },
                        )
                    } catch (err) {
                        error = err
                    }

                    expect(attempts).to.equal(1)
                    expect(isSerializationError(error)).to.be.true

                    const post = await dataSource.manager.findOneByOrFail(
                        Post,
                        { id: 1 },
                    )
                    expect(post.version).to.equal(99)
                }),
            ))
    })
})
