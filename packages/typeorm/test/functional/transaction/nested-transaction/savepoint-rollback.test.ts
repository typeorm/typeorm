import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { EventSubscriber } from "../../../../src/decorator/listeners/EventSubscriber"
import type { EntitySubscriberInterface } from "../../../../src/subscriber/EntitySubscriberInterface"
import type { TransactionRollbackEvent } from "../../../../src/subscriber/event/TransactionRollbackEvent"
import { TypeORMError } from "../../../../src/error/TypeORMError"
import type { QueryRunner } from "../../../../src/query-runner/QueryRunner"
import { Post } from "./entity/Post"

describe("transaction > nested-transaction > savepoint rollback (#12977)", () => {
    let dataSources: DataSource[]
    let shouldThrowOnRollback = false
    let shouldCommitInSubscriber = false
    let shouldStartInSubscriber = false

    const getDepth = (runner: QueryRunner): number =>
        (runner as unknown as { transactionDepth: number }).transactionDepth

    @EventSubscriber()
    class TestSubscriber implements EntitySubscriberInterface {
        async beforeTransactionRollback(event: TransactionRollbackEvent) {
            if (shouldCommitInSubscriber && event.queryRunner) {
                // Nested subscriber commits before the savepoint rollback statement
                await event.queryRunner.commitTransaction()
                return
            }

            if (shouldStartInSubscriber && event.queryRunner) {
                shouldStartInSubscriber = false
                await event.queryRunner.startTransaction()
                return
            }

            const depth = event.queryRunner
                ? getDepth(event.queryRunner)
                : undefined
            if (shouldThrowOnRollback && depth !== undefined && depth > 1) {
                throw new Error("injected rollback failure")
            }
        }
    }

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            subscribers: [TestSubscriber],
            enabledDrivers: ["better-sqlite3"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => {
        shouldThrowOnRollback = false
        shouldCommitInSubscriber = false
        shouldStartInSubscriber = false
        return reloadTestingDatabases(dataSources)
    })
    after(() => closeTestingConnections(dataSources))

    it("should prevent committing outer transaction when nested rollback fails", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                let innerErrorCaught = false
                let outerError: Error | undefined

                try {
                    await dataSource.transaction(async (manager) => {
                        await manager.save(Post, { title: "outer" })

                        try {
                            await manager.transaction(async (inner) => {
                                await inner.save(Post, {
                                    title: "inner-doomed",
                                })
                                shouldThrowOnRollback = true
                                throw new Error("inner unit failed")
                            })
                        } catch {
                            innerErrorCaught = true
                            shouldThrowOnRollback = false
                        }
                    })
                } catch (err) {
                    outerError = err as Error
                }

                expect(innerErrorCaught).to.be.true
                expect(outerError).to.be.instanceOf(TypeORMError)
                expect(outerError?.message).to.include(
                    "Cannot commit transaction because a nested rollback failed",
                )

                // Ensure nothing was committed to the database
                const posts = await dataSource.manager.find(Post)
                expect(posts).to.have.length(0)
            }),
        ))

    it("should correctly update transactionDepth and rollback cleanly when inner rollback fails without catching", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                let outerError: Error | undefined
                try {
                    await dataSource.transaction(async (manager) => {
                        await manager.save(Post, { title: "outer" })

                        await manager.transaction(async (inner) => {
                            await inner.save(Post, { title: "inner-doomed" })
                            shouldThrowOnRollback = true
                            throw new Error("inner unit failed")
                        })
                    })
                } catch (err) {
                    outerError = err as Error
                } finally {
                    shouldThrowOnRollback = false
                }

                expect(outerError).to.exist
                // Ensure everything rolled back cleanly
                const posts = await dataSource.manager.find(Post)
                expect(posts).to.have.length(0)
            }),
        ))

    it("should allow committing outer transaction if enclosing savepoint rolled back successfully", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.transaction(async (manager) => {
                    await manager.save(Post, { title: "outer" })

                    try {
                        await manager.transaction(async (middle) => {
                            await middle.save(Post, { title: "middle" })

                            try {
                                await middle.transaction(async (inner) => {
                                    await inner.save(Post, {
                                        title: "inner-doomed",
                                    })
                                    shouldThrowOnRollback = true
                                    throw new Error("inner failed")
                                })
                            } catch {
                                shouldThrowOnRollback = false
                            }

                            throw new Error("middle failed")
                        })
                    } catch {
                        // Middle failed and successfully rolled back to outer savepoint
                    }
                })

                // Outer transaction committed successfully; only outer post exists
                const posts = await dataSource.manager.find(Post)
                expect(posts).to.have.length(1)
                expect(posts[0].title).to.equal("outer")
            }),
        ))

    it("should allow a savepoint opened after the failure to commit while preventing the contaminated scope from committing", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                let outerError: Error | undefined
                let secondSavepointCommitted = false

                try {
                    await dataSource.transaction(async (manager) => {
                        await manager.save(Post, { title: "outer" })

                        // Savepoint A fails rollback
                        try {
                            await manager.transaction(async (inner) => {
                                await inner.save(Post, {
                                    title: "inner-doomed",
                                })
                                shouldThrowOnRollback = true
                                throw new Error("savepoint A failed")
                            })
                        } catch {
                            shouldThrowOnRollback = false
                        }

                        // Savepoint B opened after the failure can commit
                        await manager.transaction(async (inner2) => {
                            await inner2.save(Post, { title: "inner-valid" })
                        })
                        secondSavepointCommitted = true
                    })
                } catch (err) {
                    outerError = err as Error
                }

                expect(secondSavepointCommitted).to.be.true
                expect(outerError).to.be.instanceOf(TypeORMError)
                expect(outerError?.message).to.include(
                    "Cannot commit transaction because a nested rollback failed",
                )

                // Since outer transaction could not commit, all changes are rolled back
                const posts = await dataSource.manager.find(Post)
                expect(posts).to.have.length(0)
            }),
        ))

    it("queryRunner transactionDepth reflects depth correctly on failed nested rollback", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    await queryRunner.startTransaction()
                    expect(getDepth(queryRunner)).to.equal(1)

                    await queryRunner.startTransaction()
                    expect(getDepth(queryRunner)).to.equal(2)

                    shouldThrowOnRollback = true
                    let thrownError: Error | undefined
                    try {
                        await queryRunner.rollbackTransaction()
                    } catch (err) {
                        thrownError = err as Error
                    } finally {
                        shouldThrowOnRollback = false
                    }

                    expect(thrownError).to.exist
                    expect(thrownError?.message).to.equal(
                        "injected rollback failure",
                    )

                    // Depth must be decremented to 1 despite the failure
                    expect(getDepth(queryRunner)).to.equal(1)

                    // Commit at depth 1 must fail
                    try {
                        await queryRunner.commitTransaction()
                        expect.fail("should not allow commit")
                    } catch (err) {
                        expect(err).to.be.instanceOf(TypeORMError)
                    }

                    // Rollback at depth 1 must cleanly succeed and reset depth to 0
                    await queryRunner.rollbackTransaction()
                    expect(getDepth(queryRunner)).to.equal(0)
                    expect(queryRunner.isTransactionActive).to.be.false
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("async disposal rolls back contaminated transaction before release and rejects", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                await queryRunner.startTransaction()
                await queryRunner.manager.save(Post, {
                    title: "disposal-outer",
                })

                await queryRunner.startTransaction()
                await queryRunner.manager.save(Post, {
                    title: "disposal-inner",
                })

                shouldThrowOnRollback = true
                try {
                    await queryRunner.rollbackTransaction()
                } catch {
                    // expected failure
                } finally {
                    shouldThrowOnRollback = false
                }

                // Invoking async disposal on contaminated runner performs root rollback and rejects with TypeORMError
                let disposalError: Error | undefined
                try {
                    await queryRunner[Symbol.asyncDispose]()
                } catch (err) {
                    disposalError = err as Error
                }

                expect(disposalError).to.be.instanceOf(TypeORMError)
                expect(disposalError?.message).to.include(
                    "Cannot commit transaction because a nested rollback failed",
                )
                expect(queryRunner.isTransactionActive).to.be.false

                // Verify nothing was committed
                const posts = await dataSource.manager.find(Post)
                expect(posts).to.have.length(0)
            }),
        ))

    it("handles transaction-depth changes made during BeforeTransactionRollback hook", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    await queryRunner.startTransaction()
                    await queryRunner.startTransaction()
                    expect(getDepth(queryRunner)).to.equal(2)

                    shouldCommitInSubscriber = true
                    // Rollback at depth 2 triggers hook which commits nested savepoint
                    await queryRunner.rollbackTransaction()

                    // Outer transaction is not marked contaminated because no rollback failed
                    expect(getDepth(queryRunner)).to.equal(1)
                    await queryRunner.commitTransaction()
                    expect(getDepth(queryRunner)).to.equal(0)
                    expect(queryRunner.isTransactionActive).to.be.false
                } finally {
                    shouldCommitInSubscriber = false
                    await queryRunner.release()
                }
            }),
        ))

    it("handles subscriber starting a nested transaction during root rollback followed by another transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    await queryRunner.startTransaction()
                    expect(getDepth(queryRunner)).to.equal(1)
                    await queryRunner.manager.save(Post, {
                        title: "root-post",
                    })

                    shouldStartInSubscriber = true
                    // Rollback at depth 1 triggers hook which starts nested transaction (depth -> 2)
                    // The rollback then targets savepoint 1 and updates bookkeeping to depth 1
                    await queryRunner.rollbackTransaction()

                    expect(queryRunner.isTransactionActive).to.be.true
                    expect(getDepth(queryRunner)).to.equal(1)

                    // Start another nested transaction
                    await queryRunner.startTransaction()
                    expect(getDepth(queryRunner)).to.equal(2)
                    await queryRunner.manager.save(Post, {
                        title: "nested-post",
                    })

                    // Nested commit releases savepoint without committing root
                    await queryRunner.commitTransaction()
                    expect(queryRunner.isTransactionActive).to.be.true
                    expect(getDepth(queryRunner)).to.equal(1)

                    // Finally rollback root transaction
                    await queryRunner.rollbackTransaction()
                    expect(queryRunner.isTransactionActive).to.be.false
                    expect(getDepth(queryRunner)).to.equal(0)

                    // Verify nothing was committed
                    const posts = await dataSource.manager.find(Post)
                    expect(posts).to.have.length(0)
                } finally {
                    shouldStartInSubscriber = false
                    await queryRunner.release()
                }
            }),
        ))
})
