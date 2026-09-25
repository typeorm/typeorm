import "../../../../utils/test-setup"
import { expect } from "chai"
import sinon from "sinon"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { EventSubscriber } from "../../../../../src/decorator/listeners/EventSubscriber"
import type { EntitySubscriberInterface } from "../../../../../src/subscriber/EntitySubscriberInterface"
import type { MongoDriver } from "../../../../../src/driver/mongodb/MongoDriver"
import type { MongoQueryRunner } from "../../../../../src/driver/mongodb/MongoQueryRunner"
import type { TransactionOptions } from "../../../../../src/driver/mongodb/typings"
import type { MongoEntityManager } from "../../../../../src/entity-manager/MongoEntityManager"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { TransactionDocument } from "./entity/TransactionDocument"

const transactionEvents: string[] = []
let beforeRollbackError: Error | undefined

@EventSubscriber()
class TransactionSubscriber implements EntitySubscriberInterface {
    beforeTransactionStart(): void {
        transactionEvents.push("before start")
    }

    afterTransactionStart(): void {
        transactionEvents.push("after start")
    }

    beforeTransactionCommit(): void {
        transactionEvents.push("before commit")
    }

    afterTransactionCommit(): void {
        transactionEvents.push("after commit")
    }

    beforeTransactionRollback(): void {
        transactionEvents.push("before rollback")
        if (beforeRollbackError) throw beforeRollbackError
    }

    afterTransactionRollback(): void {
        transactionEvents.push("after rollback")
    }
}

describe("mongodb > transactions", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [TransactionDocument],
            subscribers: [TransactionSubscriber],
            enabledDrivers: ["mongodb"],
        })
    })
    beforeEach(async () => {
        await reloadTestingDatabases(dataSources)
        transactionEvents.length = 0
        beforeRollbackError = undefined
    })
    after(() => closeTestingConnections(dataSources))

    it("commits writes from the transaction manager", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.transaction(async (manager) => {
                    const repository =
                        manager.getMongoRepository(TransactionDocument)
                    await manager.save(TransactionDocument, [
                        { name: "first" },
                        { name: "second" },
                    ])
                    expect(await repository.count()).to.equal(2)
                })

                expect(
                    await dataSource
                        .getMongoRepository(TransactionDocument)
                        .count(),
                ).to.equal(2)
            }),
        ))

    it("does not start a transaction for ordinary saves", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner =
                    dataSource.createQueryRunner() as MongoQueryRunner
                const startTransaction = sinon.spy(
                    queryRunner,
                    "startTransaction",
                )
                const createQueryRunner = sinon
                    .stub(dataSource, "createQueryRunner")
                    .returns(queryRunner)

                try {
                    await dataSource
                        .getMongoRepository(TransactionDocument)
                        .save({ name: "ordinary save" })
                } finally {
                    createQueryRunner.restore()
                    startTransaction.restore()
                }

                expect(startTransaction.notCalled).to.be.true
                expect(
                    await dataSource
                        .getMongoRepository(TransactionDocument)
                        .count(),
                ).to.equal(1)
            }),
        ))

    it("commits chunked saves sequentially", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.transaction(async (manager) => {
                    await manager.save(
                        TransactionDocument,
                        [{ name: "first" }, { name: "second" }],
                        { chunk: 1 },
                    )
                })

                expect(
                    await dataSource
                        .getMongoRepository(TransactionDocument)
                        .count(),
                ).to.equal(2)
            }),
        ))

    it("rolls back writes when the callback fails", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .transaction(async (manager) => {
                        await manager
                            .getMongoRepository(TransactionDocument)
                            .insertOne({ name: "rolled back" })
                        throw new Error("stop transaction")
                    })
                    .should.be.rejectedWith("stop transaction")

                expect(
                    await dataSource
                        .getMongoRepository(TransactionDocument)
                        .count(),
                ).to.equal(0)
            }),
        ))

    it("does not report committed work as failed when session cleanup fails", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const client = (dataSource.driver as MongoDriver)
                    .databaseConnection!
                const session = client.startSession()
                const startSession = sinon
                    .stub(client, "startSession")
                    .returns(session)
                const endSession = sinon
                    .stub(session, "endSession")
                    .rejects(new Error("session cleanup failed"))

                try {
                    await dataSource.transaction(async (manager) => {
                        await manager
                            .getMongoRepository(TransactionDocument)
                            .insertOne({ name: "committed" })
                    })
                } finally {
                    startSession.restore()
                    endSession.restore()
                    await session.endSession()
                }

                expect(
                    await dataSource
                        .getMongoRepository(TransactionDocument)
                        .count(),
                ).to.equal(1)
            }),
        ))

    it("preserves the callback error when rollback fails", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const client = (dataSource.driver as MongoDriver)
                    .databaseConnection!
                const session = client.startSession()
                const startSession = sinon
                    .stub(client, "startSession")
                    .returns(session)
                const endSession = sinon.spy(session, "endSession")
                const abortTransaction = sinon
                    .stub(session, "abortTransaction")
                    .rejects(new Error("abort failed"))

                try {
                    await dataSource
                        .transaction(async (manager) => {
                            await manager
                                .getMongoRepository(TransactionDocument)
                                .insertOne({ name: "rolled back" })
                            throw new Error("callback failed")
                        })
                        .should.be.rejectedWith("callback failed")
                } finally {
                    startSession.restore()
                    abortTransaction.restore()
                }

                expect(endSession.calledOnce).to.be.true
            }),
        ))

    it("preserves the callback error when rollback broadcasting and abort fail", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const client = (dataSource.driver as MongoDriver)
                    .databaseConnection!
                const session = client.startSession()
                const startSession = sinon
                    .stub(client, "startSession")
                    .returns(session)
                const endSession = sinon.spy(session, "endSession")
                const abortTransaction = sinon
                    .stub(session, "abortTransaction")
                    .rejects(new Error("abort failed"))
                beforeRollbackError = new Error("subscriber failed")

                try {
                    await dataSource
                        .transaction(() => {
                            throw new Error("callback failed")
                        })
                        .should.be.rejectedWith("callback failed")
                } finally {
                    startSession.restore()
                    abortTransaction.restore()
                }

                expect(abortTransaction.called).to.be.true
                expect(endSession.calledOnce).to.be.true
            }),
        ))

    it("runs array updates and deletes inside a transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository =
                    dataSource.getMongoRepository(TransactionDocument)
                const documents = await repository.save([
                    { name: "first" },
                    { name: "second" },
                ])

                await dataSource.transaction(async (manager) => {
                    await manager.update(
                        TransactionDocument,
                        documents.map((document) => document.id),
                        { name: "updated" },
                    )
                    const [updatedDocuments, count] =
                        await manager.findAndCount(TransactionDocument)
                    expect(count).to.equal(2)
                    expect(
                        updatedDocuments.every(
                            (document) => document.name === "updated",
                        ),
                    ).to.be.true
                    await manager.delete(
                        TransactionDocument,
                        documents.map((document) => document.id),
                    )
                })

                expect(await repository.count()).to.equal(0)
            }),
        ))

    it("isolates concurrent transaction runners", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const managers: MongoEntityManager[] = []
                const repository =
                    dataSource.getMongoRepository(TransactionDocument)
                await repository.insertOne({ name: "seed" })
                await repository.deleteMany({})

                await Promise.all([
                    dataSource.transaction(async (manager) => {
                        managers.push(manager as MongoEntityManager)
                        await manager
                            .getMongoRepository(TransactionDocument)
                            .insertOne({ name: "first transaction" })
                    }),
                    dataSource.transaction(async (manager) => {
                        managers.push(manager as MongoEntityManager)
                        await manager
                            .getMongoRepository(TransactionDocument)
                            .insertOne({ name: "second transaction" })
                    }),
                ])

                expect(managers[0].queryRunner).not.to.equal(
                    managers[1].queryRunner,
                )
                expect(
                    await dataSource
                        .getMongoRepository(TransactionDocument)
                        .count(),
                ).to.equal(2)
            }),
        ))

    it("includes ordered and unordered bulk operations", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository =
                    dataSource.getMongoRepository(TransactionDocument)
                await repository.insertOne({ name: "seed" })
                await repository.deleteMany({})

                await dataSource.transaction(async (manager) => {
                    const transactionRepository =
                        manager.getMongoRepository(TransactionDocument)
                    const ordered =
                        transactionRepository.initializeOrderedBulkOp()
                    ordered.insert({ name: "ordered" })
                    await ordered.execute()

                    const unordered =
                        transactionRepository.initializeUnorderedBulkOp()
                    unordered.insert({ name: "unordered" })
                    await unordered.execute()
                })

                expect(await repository.count()).to.equal(2)
            }),
        ))

    it("rejects nested transactions without aborting the outer transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.transaction(async (manager) => {
                    await manager
                        .transaction(() => Promise.resolve())
                        .should.be.rejectedWith(
                            "Transaction already started for the given connection",
                        )
                    await manager
                        .getMongoRepository(TransactionDocument)
                        .insertOne({ name: "outer transaction" })
                })

                expect(
                    await dataSource
                        .getMongoRepository(TransactionDocument)
                        .count(),
                ).to.equal(1)
            }),
        ))

    it("rejects SQL isolation levels", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .transaction("SERIALIZABLE", () => Promise.resolve())
                    .should.be.rejectedWith(
                        "MongoDB does not support SQL transaction isolation levels.",
                    )
            }),
        ))

    it("preserves transaction start errors", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const client = (dataSource.driver as MongoDriver)
                    .databaseConnection!
                const startSession = sinon
                    .stub(client, "startSession")
                    .throws(new Error("session start failed"))

                try {
                    await dataSource
                        .transaction(() => Promise.resolve())
                        .should.be.rejectedWith("session start failed")
                } finally {
                    startSession.restore()
                }
            }),
        ))

    it("ends the session when aborting during release fails", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const client = (dataSource.driver as MongoDriver)
                    .databaseConnection!
                const session = client.startSession()
                const startSession = sinon
                    .stub(client, "startSession")
                    .returns(session)
                const endSession = sinon.spy(session, "endSession")
                const abortTransaction = sinon
                    .stub(session, "abortTransaction")
                    .rejects(new Error("abort failed"))
                const queryRunner =
                    dataSource.createQueryRunner() as MongoQueryRunner

                try {
                    await queryRunner.startTransaction()
                    await queryRunner
                        .release()
                        .should.be.rejectedWith("abort failed")
                } finally {
                    startSession.restore()
                    abortTransaction.restore()
                }

                expect(endSession.calledOnce).to.be.true
                expect(queryRunner.isReleased).to.be.true
            }),
        ))

    it("rejects operations after releasing a query runner", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const manager = queryRunner.manager as MongoEntityManager
                await queryRunner.release()

                await manager
                    .getMongoRepository(TransactionDocument)
                    .insertOne({ name: "too late" })
                    .should.be.rejectedWith(
                        "Query runner already released. Cannot run queries anymore.",
                    )
            }),
        ))

    it("rejects clearing a collection inside a transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.transaction(async (manager) => {
                    await manager
                        .clear(TransactionDocument)
                        .should.be.rejectedWith(
                            "MongoDB cannot clear a collection inside a transaction.",
                        )
                })
            }),
        ))

    it("broadcasts transaction events in order", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.transaction(() => Promise.resolve())

                expect(transactionEvents).to.deep.equal([
                    "before start",
                    "after start",
                    "before commit",
                    "after commit",
                ])
            }),
        ))

    it("accepts MongoDB transaction options", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const options: TransactionOptions = {
                    readPreference: "primary",
                    readConcern: { level: "majority" },
                    writeConcern: { w: "majority" },
                }
                const client = (dataSource.driver as MongoDriver)
                    .databaseConnection!
                const session = client.startSession()
                const startTransaction = sinon.spy(session, "startTransaction")
                const startSession = sinon
                    .stub(client, "startSession")
                    .returns(session)

                try {
                    await dataSource.mongoManager.transaction(
                        options,
                        async (manager) => {
                            await manager
                                .getMongoRepository(TransactionDocument)
                                .insertOne({ name: "configured" })
                        },
                    )
                } finally {
                    startSession.restore()
                }

                expect(startTransaction.calledOnceWithExactly(options)).to.be
                    .true
                expect(
                    await dataSource
                        .getMongoRepository(TransactionDocument)
                        .count(),
                ).to.equal(1)
            }),
        ))
})
