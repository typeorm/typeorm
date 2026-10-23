import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { EventSubscriber } from "../../../src/decorator/listeners/EventSubscriber"
import type { EntitySubscriberInterface } from "../../../src/subscriber/EntitySubscriberInterface"
import type { TransactionRollbackEvent } from "../../../src/subscriber/event/TransactionRollbackEvent"
import { TypeORMError } from "../../../src/error/TypeORMError"
import type { QueryRunner } from "../../../src/query-runner/QueryRunner"
import { Post } from "./entity/Post"

describe("github issues > #12977 A failed ROLLBACK TO SAVEPOINT leaves the connection in a transaction", () => {
    let dataSources: DataSource[]
    let shouldThrowOnRollback = false

    const getDepth = (runner: QueryRunner): number =>
        (runner as unknown as { transactionDepth: number }).transactionDepth

    @EventSubscriber()
    class TestSubscriber implements EntitySubscriberInterface {
        beforeTransactionRollback(event: TransactionRollbackEvent) {
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
})
