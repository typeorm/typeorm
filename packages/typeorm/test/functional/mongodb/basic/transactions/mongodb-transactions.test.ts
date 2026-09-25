import "../../../../utils/test-setup"
import { expect } from "chai"
import sinon from "sinon"
import { DataSource } from "../../../../../src/data-source/DataSource"
import type { DataSourceOptions } from "../../../../../src/data-source/DataSourceOptions"
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
import { OtherTransactionDocument } from "./entity/OtherTransactionDocument"
import { MigrationExecutor } from "../../../../../src/migration/MigrationExecutor"
import { Migration } from "../../../../../src/migration/Migration"
import type { QueryRunner } from "../../../../../src/query-runner/QueryRunner"
import { BroadcasterResult } from "../../../../../src/subscriber/BroadcasterResult"
import { MigrationRunCommand } from "../../../../../src/commands/MigrationRunCommand"
import { MigrationRevertCommand } from "../../../../../src/commands/MigrationRevertCommand"
import { CommandUtils } from "../../../../../src/commands/CommandUtils"
import process from "process"

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

async function expectSequentialUpdates(
    manager: MongoEntityManager,
    operation: () => Promise<unknown>,
): Promise<void> {
    const queryRunner = manager.mongoQueryRunner
    const originalUpdateMany = queryRunner.updateMany.bind(queryRunner)
    let activeUpdates = 0
    let maximumActiveUpdates = 0
    const updateMany = sinon
        .stub(queryRunner, "updateMany")
        .callsFake(async (collectionName, query, update, options) => {
            activeUpdates += 1
            maximumActiveUpdates = Math.max(maximumActiveUpdates, activeUpdates)
            await new Promise((resolve) => setTimeout(resolve, 10))

            try {
                return await originalUpdateMany(
                    collectionName,
                    query,
                    update,
                    options,
                )
            } finally {
                activeUpdates -= 1
            }
        })

    try {
        await operation()
    } finally {
        updateMany.restore()
    }

    expect(maximumActiveUpdates).to.equal(1)
}

describe("mongodb > transactions", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [TransactionDocument, OtherTransactionDocument],
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

    it("serializes multi-entity persistence operations", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository =
                    dataSource.getMongoRepository(TransactionDocument)
                const documents = await repository.save([
                    { name: "first" },
                    { name: "second" },
                ])
                documents[0].name = "updated first"
                documents[1].name = "updated second"

                await dataSource.transaction(async (entityManager) => {
                    const manager = entityManager as MongoEntityManager
                    await expectSequentialUpdates(manager, () =>
                        manager.save(TransactionDocument, documents),
                    )
                    await expectSequentialUpdates(manager, () =>
                        manager.softRemove(TransactionDocument, documents),
                    )
                    await expectSequentialUpdates(manager, () =>
                        manager.recover(TransactionDocument, documents),
                    )
                })

                expect(await repository.count()).to.equal(2)
            }),
        ))

    it("rejects unsupported transaction count filters clearly", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const filters = [
                    { operator: "$where", filter: { $where: "true" } },
                    {
                        operator: "$near",
                        filter: { location: { $near: [0, 0] } },
                    },
                    {
                        operator: "$nearSphere",
                        filter: {
                            $and: [
                                { active: true },
                                {
                                    location: {
                                        $nearSphere: [0, 0],
                                    },
                                },
                            ],
                        },
                    },
                ]

                for (const { operator, filter } of filters) {
                    await dataSource
                        .transaction((entityManager) =>
                            (entityManager as MongoEntityManager).count(
                                TransactionDocument,
                                filter,
                            ),
                        )
                        .should.be.rejectedWith(
                            `MongoDB transaction counts do not support ${operator}`,
                        )
                }

                await dataSource
                    .getMongoRepository(TransactionDocument)
                    .insertOne({ name: "counted" })
                const count = await dataSource.transaction((entityManager) =>
                    (entityManager as MongoEntityManager).count(
                        TransactionDocument,
                        { name: "counted" },
                    ),
                )
                expect(count).to.equal(1)
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

    it("preloads an uncommitted document through the callback manager", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .transaction(async (manager) => {
                        const inserted = await manager
                            .getMongoRepository(TransactionDocument)
                            .save({ name: "original" })
                        const loaded = await manager.preload(
                            TransactionDocument,
                            { id: inserted.id, name: "changed" },
                        )
                        expect(loaded?.name).to.equal("changed")
                        throw new Error("rollback preload")
                    })
                    .should.be.rejectedWith("rollback preload")
                expect(
                    await dataSource
                        .getMongoRepository(TransactionDocument)
                        .count(),
                ).to.equal(0)
            }),
        ))

    it("sequences mixed-target loader reads and commits or rolls back together", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const firstRepository =
                    dataSource.getMongoRepository(TransactionDocument)
                const secondRepository = dataSource.getMongoRepository(
                    OtherTransactionDocument,
                )
                const first = await firstRepository.save(
                    firstRepository.create({ name: "first" }),
                )
                const second = await secondRepository.save(
                    secondRepository.create({ name: "second" }),
                )
                for (const rollback of [false, true]) {
                    let active = 0
                    let maximum = 0
                    await dataSource
                        .transaction(async (entityManager) => {
                            const manager = entityManager as MongoEntityManager
                            const runner = manager.mongoQueryRunner
                            const original = runner.cursor.bind(runner)
                            const stub = sinon
                                .stub(runner, "cursor")
                                .callsFake((collection, filter) => {
                                    const cursor = original(collection, filter)
                                    const toArray = cursor.toArray.bind(cursor)
                                    sinon
                                        .stub(cursor, "toArray")
                                        .callsFake(async () => {
                                            active++
                                            maximum = Math.max(maximum, active)
                                            try {
                                                await new Promise((resolve) =>
                                                    setTimeout(resolve, 10),
                                                )
                                                return await toArray()
                                            } finally {
                                                active--
                                            }
                                        })
                                    return cursor
                                })
                            try {
                                first.name = rollback
                                    ? "discarded"
                                    : "committed"
                                second.name = rollback
                                    ? "discarded"
                                    : "committed"
                                await manager.save([first, second])
                            } finally {
                                stub.restore()
                            }
                            expect(maximum).to.equal(1)
                            if (rollback) throw new Error("rollback mixed save")
                        })
                        .catch((error) => {
                            if (
                                !rollback ||
                                error.message !== "rollback mixed save"
                            )
                                throw error
                        })
                }
                expect(
                    (
                        await dataSource
                            .getMongoRepository(TransactionDocument)
                            .findOneByOrFail({ id: first.id })
                    ).name,
                ).to.equal("committed")
                expect(
                    (
                        await dataSource
                            .getMongoRepository(OtherTransactionDocument)
                            .findOneByOrFail({ id: second.id })
                    ).name,
                ).to.equal("committed")
            }),
        ))

    it("runs query-performing transaction and persistence hooks in order without blocking nested saves", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const order: string[] = []
                let active = 0
                let maximum = 0
                const hook =
                    (name: string) =>
                    async (event: { manager: any; metadata?: any }) => {
                        order.push(name)
                        active++
                        maximum = Math.max(maximum, active)
                        try {
                            await new Promise((resolve) =>
                                setTimeout(resolve, 10),
                            )
                            await event.manager
                                .getMongoRepository(TransactionDocument)
                                .count()
                        } finally {
                            active--
                        }
                        if (
                            name === "beforeInsert:first" &&
                            event.metadata.target === TransactionDocument
                        ) {
                            await event.manager
                                .getMongoRepository(OtherTransactionDocument)
                                .save({ name: "nested" })
                        }
                    }
                const subscribers: any[] = [
                    {
                        afterTransactionStart: hook("start:first"),
                        beforeInsert: (event: any) =>
                            event.metadata.target === TransactionDocument &&
                            hook("beforeInsert:first")(event),
                        afterLoad: (_: any, event: any) =>
                            hook("load:first")(event),
                        beforeTransactionCommit: hook("commit:first"),
                    },
                    {
                        afterTransactionStart: hook("start:second"),
                        beforeInsert: (event: any) =>
                            event.metadata.target === TransactionDocument &&
                            hook("beforeInsert:second")(event),
                        afterLoad: (_: any, event: any) =>
                            hook("load:second")(event),
                        beforeTransactionCommit: hook("commit:second"),
                    },
                ]
                dataSource.subscribers.push(...subscribers)
                try {
                    await dataSource.transaction(async (manager) => {
                        await manager.save(TransactionDocument, {
                            name: "hooked",
                        })
                        await manager
                            .getMongoRepository(TransactionDocument)
                            .find()
                    })
                } finally {
                    dataSource.subscribers.splice(
                        dataSource.subscribers.indexOf(subscribers[0]),
                        2,
                    )
                }
                expect(maximum).to.equal(1)
                expect(order).to.deep.equal([
                    "start:first",
                    "start:second",
                    "beforeInsert:first",
                    "beforeInsert:second",
                    "load:first",
                    "load:second",
                    "commit:first",
                    "commit:second",
                ])
                expect(
                    await dataSource
                        .getMongoRepository(OtherTransactionDocument)
                        .count(),
                ).to.equal(1)
            }),
        ))

    it("keeps ordinary broadcaster hooks eager and single-use", async () => {
        const result = new BroadcasterResult()
        const order: string[] = []
        result.add(() => {
            order.push("first")
            return Promise.resolve()
        })
        result.add(() => {
            order.push("second")
        })
        expect(order).to.deep.equal(["first", "second"])
        await result.wait()
        await result.wait()
        expect(result.count).to.equal(2)
        expect(() =>
            result.add(() => {
                throw new Error("synchronous")
            }),
        ).to.throw("synchronous")
    })

    it("defers Mongo hook invocation once and stops on the first error", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const runner = dataSource.createQueryRunner()
                await runner.startTransaction()
                const result = new BroadcasterResult(runner)
                const order: string[] = []
                result.add(() => {
                    order.push("first")
                    return Promise.resolve()
                })
                result.add(() => {
                    order.push("failure")
                    throw new Error("hook failure")
                })
                result.add(() => {
                    order.push("never")
                })
                expect(order).to.deep.equal([])
                try {
                    await result.wait().should.be.rejectedWith("hook failure")
                    await result.wait().should.be.rejectedWith("hook failure")
                    expect(order).to.deep.equal(["first", "failure"])
                    expect(result.count).to.equal(1)
                } finally {
                    await runner.rollbackTransaction()
                    await runner.release()
                }
            }),
        ))

    it("runs successful deferred hooks once and stops after an asynchronous failure", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const runner = dataSource.createQueryRunner()
                await runner.startTransaction()
                try {
                    const success = new BroadcasterResult(runner)
                    const order: string[] = []
                    success.add(async () => {
                        order.push("first")
                    })
                    success.add(() => {
                        order.push("second")
                    })
                    expect(success.count).to.equal(0)
                    await success.wait()
                    await success.wait()
                    expect(order).to.deep.equal(["first", "second"])
                    expect(success.count).to.equal(2)

                    const failure = new BroadcasterResult(runner)
                    failure.add(async () => {
                        await Promise.resolve()
                        throw new Error("asynchronous failure")
                    })
                    failure.add(() => {
                        order.push("never")
                    })
                    await failure
                        .wait()
                        .should.be.rejectedWith("asynchronous failure")
                    expect(failure.count).to.equal(1)
                    expect(order).to.deep.equal(["first", "second"])
                } finally {
                    await runner.rollbackTransaction()
                    await runner.release()
                }
            }),
        ))

    it("exposes the session only between after-start and before-commit hooks", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const sessionStates: boolean[] = []
                const counts: number[] = []
                const observe = async (event: any) => {
                    sessionStates.push(!!event.queryRunner.session)
                    counts.push(
                        await event.manager
                            .getMongoRepository(TransactionDocument)
                            .count(),
                    )
                }
                const subscriber = {
                    beforeTransactionStart: observe,
                    afterTransactionStart: observe,
                    beforeTransactionCommit: observe,
                    afterTransactionCommit: observe,
                }
                dataSource.subscribers.push(subscriber)
                try {
                    await dataSource.transaction(async (manager) => {
                        await manager
                            .getMongoRepository(TransactionDocument)
                            .insertOne({ name: "visible before commit" })
                    })
                } finally {
                    dataSource.subscribers.splice(
                        dataSource.subscribers.indexOf(subscriber),
                        1,
                    )
                }
                expect(sessionStates).to.deep.equal([false, true, true, false])
                expect(counts).to.deep.equal([0, 0, 1, 1])
            }),
        ))

    it("binds native cursors and bulk builders at creation, not consumption", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const runner =
                    dataSource.createQueryRunner() as MongoQueryRunner
                const cursorOutside = runner.cursor("lifetime_documents", {})
                const bulkOutside =
                    runner.initializeOrderedBulkOp("lifetime_documents")
                bulkOutside.insert({ name: "outside" })
                await runner.startTransaction()
                const cursorInside = runner.cursor("lifetime_documents", {})
                const bulkInside =
                    runner.initializeOrderedBulkOp("lifetime_documents")
                bulkInside.insert({ name: "inside" })
                try {
                    await bulkOutside.execute()
                    await bulkInside.execute()
                    expect(await cursorInside.toArray()).to.have.length(2)
                    await runner.rollbackTransaction()
                    expect(
                        await runner.count("lifetime_documents", {}),
                    ).to.equal(1)
                    expect(await cursorOutside.toArray()).to.have.length(1)
                    cursorInside.rewind()
                    await cursorInside.toArray().should.be.rejected
                } finally {
                    if (runner.isTransactionActive)
                        await runner.rollbackTransaction()
                    await runner.release()
                    await cursorOutside.close()
                }
            }),
        ))

    it("defaults Mongo migrations to none and preserves explicit modes and session-bound history", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const runner =
                    dataSource.createQueryRunner() as MongoQueryRunner
                const start = sinon.spy(runner, "startTransaction")
                const executor = new MigrationExecutor(dataSource, runner)
                expect(executor.transaction).to.equal("none")
                let failRevert = false
                class First1700000000001 {
                    async up(q: QueryRunner) {
                        await (q as MongoQueryRunner).insertOne(
                            "migration_payload",
                            { name: "first" },
                        )
                    }
                    async down(q: QueryRunner) {
                        await (q as MongoQueryRunner).deleteOne(
                            "migration_payload",
                            { name: "first" },
                        )
                        if (failRevert) throw new Error("revert failure")
                    }
                }
                class Failing1700000000002 {
                    async up(_q: QueryRunner) {
                        throw new Error("migration failure")
                    }
                    async down(_q: QueryRunner) {
                        /* no-op */
                    }
                }
                const first = new First1700000000001()
                dataSource.migrations.push(first)
                try {
                    await executor.executePendingMigrations()
                    expect(start.notCalled).to.be.true
                    expect(
                        await runner.count("migration_payload", {}),
                    ).to.equal(1)
                    await dataSource.undoLastMigration()
                    expect(
                        await runner.count("migration_payload", {}),
                    ).to.equal(0)
                    expect(
                        await executor.getExecutedMigrations(),
                    ).to.have.length(0)

                    await dataSource.runMigrations()
                    expect(
                        await runner.count("migration_payload", {}),
                    ).to.equal(1)
                    await dataSource.undoLastMigration()
                    expect(
                        await executor.getExecutedMigrations(),
                    ).to.have.length(0)

                    dataSource.migrations.push(new Failing1700000000002())
                    await dataSource
                        .runMigrations({ transaction: "all" })
                        .should.be.rejectedWith("migration failure")
                    expect(
                        await runner.count("migration_payload", {}),
                    ).to.equal(0)
                    expect(
                        await executor.getExecutedMigrations(),
                    ).to.have.length(0)
                    await dataSource
                        .runMigrations({ transaction: "each" })
                        .should.be.rejectedWith("migration failure")
                    expect(
                        await runner.count("migration_payload", {}),
                    ).to.equal(1)
                    expect(
                        await executor.getExecutedMigrations(),
                    ).to.have.length(1)
                    failRevert = true
                    await dataSource
                        .undoLastMigration({ transaction: "all" })
                        .should.be.rejectedWith("revert failure")
                    expect(
                        await runner.count("migration_payload", {}),
                    ).to.equal(1)
                    expect(
                        await executor.getExecutedMigrations(),
                    ).to.have.length(1)
                    failRevert = false
                    await dataSource.undoLastMigration({
                        transaction: "all",
                        fake: true,
                    })
                    expect(
                        await executor.getExecutedMigrations(),
                    ).to.have.length(0)
                    expect(
                        await runner.count("migration_payload", {}),
                    ).to.equal(1)
                    await dataSource.runMigrations({
                        transaction: "all",
                        fake: true,
                    })
                    expect(
                        await executor.getExecutedMigrations(),
                    ).to.have.length(2)
                    expect(
                        await runner.count("migration_payload", {}),
                    ).to.equal(1)
                } finally {
                    dataSource.migrations.splice(
                        dataSource.migrations.indexOf(first),
                    )
                    const failing = dataSource.migrations.find(
                        (m) => m instanceof Failing1700000000002,
                    )
                    if (failing)
                        dataSource.migrations.splice(
                            dataSource.migrations.indexOf(failing),
                            1,
                        )
                    start.restore()
                    await runner.release()
                }
            }),
        ))

    it("uses configured migration mode for automatic apply and default revert", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const observed: boolean[] = []
                class Configured1700000000005 {
                    async up(q: QueryRunner) {
                        observed.push(q.isTransactionActive)
                        await (q as MongoQueryRunner).insertOne(
                            "configured_migration",
                            { ok: true },
                        )
                    }
                    async down(q: QueryRunner) {
                        observed.push(q.isTransactionActive)
                        await (q as MongoQueryRunner).deleteOne(
                            "configured_migration",
                            { ok: true },
                        )
                    }
                }
                const configured = new DataSource({
                    ...dataSource.options,
                    database: "typeorm_remediation_configured_worker",
                    migrations: [Configured1700000000005],
                    migrationsRun: true,
                    migrationsTransactionMode: "each",
                    synchronize: false,
                    dropSchema: false,
                } as DataSourceOptions)
                try {
                    await configured.initialize()
                    await configured.undoLastMigration()
                    expect(observed).to.deep.equal([true, true])
                } finally {
                    if (configured.isInitialized) {
                        await configured.dropDatabase()
                        await configured.destroy()
                    }
                }
            }),
        ))

    it("passes omitted, configured, and explicit migration modes through CLI run and revert", async () => {
        const exit = sinon.stub(process, "exit")
        try {
            for (const mode of [undefined, "each"] as const) {
                const dataSource = new DataSource({
                    type: "mongodb",
                    database: "unused_cli_migration_database",
                    migrationsTransactionMode: mode,
                })
                const load = sinon
                    .stub(CommandUtils, "loadDataSource")
                    .resolves(dataSource)
                const initialize = sinon
                    .stub(dataSource, "initialize")
                    .resolves(dataSource)
                const destroy = sinon.stub(dataSource, "destroy").resolves()
                const run = sinon.stub(dataSource, "runMigrations").resolves([])
                const revert = sinon
                    .stub(dataSource, "undoLastMigration")
                    .resolves()
                try {
                    for (const transaction of ["default", "all"] as const) {
                        const args = {
                            dataSource: "unused.ts",
                            t: transaction,
                            f: false,
                        } as any
                        await new MigrationRunCommand().handler(args)
                        await new MigrationRevertCommand().handler(args)
                        const expected =
                            transaction === "default" ? mode : "all"
                        expect(run.lastCall.args[0]?.transaction).to.equal(
                            expected,
                        )
                        expect(revert.lastCall.args[0]?.transaction).to.equal(
                            expected,
                        )
                    }
                    expect(initialize.callCount).to.equal(4)
                    expect(destroy.callCount).to.equal(4)
                } finally {
                    load.restore()
                }
            }
            expect(exit.alwaysCalledWith(0)).to.be.true
        } finally {
            exit.restore()
        }
    })

    it("reports after-commit hook failures without undoing committed data", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const subscriber = {
                    afterTransactionCommit: () => {
                        throw new Error("after commit failed")
                    },
                }
                dataSource.subscribers.push(subscriber)
                try {
                    await dataSource
                        .transaction(async (manager) => {
                            await manager
                                .getMongoRepository(TransactionDocument)
                                .insertOne({ name: "committed" })
                        })
                        .should.be.rejectedWith("after commit failed")
                } finally {
                    dataSource.subscribers.splice(
                        dataSource.subscribers.indexOf(subscriber),
                        1,
                    )
                }
                expect(
                    await dataSource
                        .getMongoRepository(TransactionDocument)
                        .count(),
                ).to.equal(1)
            }),
        ))

    it("uses a supplied runner for executeMigration and fake bookkeeping", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const runner =
                    dataSource.createQueryRunner() as MongoQueryRunner
                const migration = new Migration(
                    undefined,
                    1700000000004,
                    "Direct1700000000004",
                    {
                        async up(q: QueryRunner) {
                            await (q as MongoQueryRunner).insertOne(
                                "direct_payload",
                                { ok: true },
                            )
                        },
                        async down(q: QueryRunner) {
                            await (q as MongoQueryRunner).deleteOne(
                                "direct_payload",
                                { ok: true },
                            )
                        },
                    },
                )
                const executor = new MigrationExecutor(dataSource, runner)
                await runner.startTransaction()
                try {
                    await executor.executeMigration(migration)
                    expect(
                        await executor.getExecutedMigrations(),
                    ).to.have.length(1)
                    await runner.rollbackTransaction()
                    expect(
                        await executor.getExecutedMigrations(),
                    ).to.have.length(0)
                    expect(await runner.count("direct_payload", {})).to.equal(0)
                    await runner.startTransaction()
                    await executor.insertMigration(migration)
                    await executor.deleteMigration(migration)
                    expect(
                        await executor.getExecutedMigrations(),
                    ).to.have.length(0)
                    await runner.rollbackTransaction()
                } finally {
                    if (runner.isTransactionActive)
                        await runner.rollbackTransaction()
                    await runner.release()
                }
            }),
        ))

    it("runs migrations during initialize without an implicit Mongo transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                class Initialize1700000000003 {
                    async up(q: QueryRunner) {
                        await (q as MongoQueryRunner).insertOne(
                            "initialized_migration",
                            { ok: true },
                        )
                    }
                    async down(q: QueryRunner) {
                        await (q as MongoQueryRunner).deleteOne(
                            "initialized_migration",
                            { ok: true },
                        )
                    }
                }
                const isolated = new DataSource({
                    ...dataSource.options,
                    database: "typeorm_remediation_initialize_worker",
                    migrations: [Initialize1700000000003],
                    migrationsRun: true,
                    synchronize: false,
                    dropSchema: false,
                } as DataSourceOptions)
                try {
                    await isolated.initialize()
                    const runner =
                        isolated.createQueryRunner() as MongoQueryRunner
                    expect(
                        await runner.count("initialized_migration", {}),
                    ).to.equal(1)
                    expect(
                        await new MigrationExecutor(
                            isolated,
                        ).getExecutedMigrations(),
                    ).to.have.length(1)
                    await isolated.undoLastMigration()
                    expect(
                        await runner.count("initialized_migration", {}),
                    ).to.equal(0)
                    await runner.release()
                } finally {
                    if (isolated.isInitialized) {
                        await isolated.dropDatabase()
                        await isolated.destroy()
                    }
                }
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
