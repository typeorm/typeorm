import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource, MongoEntityManager } from "../../../../../src"
import { QueryRunnerAlreadyReleasedError } from "../../../../../src"
import type { MongoQueryRunner } from "../../../../../src/driver/mongodb/MongoQueryRunner"
import type { ClientSession } from "../../../../../src/driver/mongodb/typings"
import { TransactionDocument } from "./entity/TransactionDocument"
import sinon from "sinon"
import { expect } from "chai"

type TestClientSessionFixture = {
    startTransaction: sinon.SinonSpy
    commitTransaction: sinon.SinonStub
    abortTransaction: sinon.SinonStub
    endSession: sinon.SinonStub
}

type QueryRunnerWithCollection<TCollection> = {
    getCollection(collectionName: string): TCollection
}

const createTestClientSession = (): TestClientSessionFixture => ({
    startTransaction: sinon.spy(),
    commitTransaction: sinon.stub().resolves(),
    abortTransaction: sinon.stub().resolves(),
    endSession: sinon.stub().resolves(),
})

describe("mongodb > transaction support", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["mongodb"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should start and commit a transaction using a client session", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner =
                    dataSource.createQueryRunner() as MongoQueryRunner

                const fakeSession = createTestClientSession()
                const session = fakeSession as unknown as ClientSession

                const startSessionStub = sinon
                    .stub(queryRunner.databaseConnection, "startSession")
                    .returns(session)

                await queryRunner.startTransaction()
                expect(queryRunner.isTransactionActive).to.be.true
                expect(fakeSession.startTransaction.calledOnce).to.be.true

                await queryRunner.commitTransaction()
                expect(queryRunner.isTransactionActive).to.be.false
                expect(fakeSession.commitTransaction.calledOnce).to.be.true
                expect(fakeSession.endSession.calledOnce).to.be.true

                startSessionStub.restore()
                await queryRunner.release()
            }),
        ))

    it("should pass active transaction session into collection operations", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner =
                    dataSource.createQueryRunner() as MongoQueryRunner

                const fakeSession = createTestClientSession()
                const session = fakeSession as unknown as ClientSession

                const insertOne = sinon.stub().resolves({ insertedId: 1 })
                const collection = {
                    insertOne,
                }

                const queryRunnerWithCollection =
                    queryRunner as unknown as QueryRunnerWithCollection<
                        typeof collection
                    >

                const startSessionStub = sinon
                    .stub(queryRunner.databaseConnection, "startSession")
                    .returns(session)
                const getCollectionStub = sinon
                    .stub(queryRunnerWithCollection, "getCollection")
                    .returns(collection)

                await queryRunner.startTransaction()
                await queryRunner.insertOne("transaction_document", {
                    name: "inside tx",
                })
                await queryRunner.rollbackTransaction()

                expect(insertOne.calledOnce).to.be.true
                expect(insertOne.firstCall.args[1]).to.have.property(
                    "session",
                    session,
                )

                startSessionStub.restore()
                getCollectionStub.restore()
                await queryRunner.release()
            }),
        ))

    it("should pass active transaction session into bulk operation initializers", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner =
                    dataSource.createQueryRunner() as MongoQueryRunner

                const fakeSession = createTestClientSession()
                const session = fakeSession as unknown as ClientSession

                const initializeOrderedBulkOp = sinon.stub().returns({})
                const initializeUnorderedBulkOp = sinon.stub().returns({})
                const collection = {
                    initializeOrderedBulkOp,
                    initializeUnorderedBulkOp,
                }

                const queryRunnerWithCollection =
                    queryRunner as unknown as QueryRunnerWithCollection<
                        typeof collection
                    >

                const startSessionStub = sinon
                    .stub(queryRunner.databaseConnection, "startSession")
                    .returns(session)
                const getCollectionStub = sinon
                    .stub(queryRunnerWithCollection, "getCollection")
                    .returns(collection)

                await queryRunner.startTransaction()
                queryRunner.initializeOrderedBulkOp("transaction_document")
                queryRunner.initializeUnorderedBulkOp("transaction_document")
                await queryRunner.rollbackTransaction()

                expect(initializeOrderedBulkOp.calledOnce).to.be.true
                expect(initializeUnorderedBulkOp.calledOnce).to.be.true
                expect(
                    initializeOrderedBulkOp.firstCall.args[0],
                ).to.have.property("session", session)
                expect(
                    initializeUnorderedBulkOp.firstCall.args[0],
                ).to.have.property("session", session)

                startSessionStub.restore()
                getCollectionStub.restore()
                await queryRunner.release()
            }),
        ))

    it("should pass active transaction session into createCollectionIndexes", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner =
                    dataSource.createQueryRunner() as MongoQueryRunner

                const fakeSession = createTestClientSession()
                const session = fakeSession as unknown as ClientSession

                const createIndexes = sinon.stub().resolves(["idx_1"])
                const collection = { createIndexes }

                const queryRunnerWithCollection =
                    queryRunner as unknown as QueryRunnerWithCollection<
                        typeof collection
                    >

                const startSessionStub = sinon
                    .stub(queryRunner.databaseConnection, "startSession")
                    .returns(session)
                const getCollectionStub = sinon
                    .stub(queryRunnerWithCollection, "getCollection")
                    .returns(collection)

                await queryRunner.startTransaction()
                await queryRunner.createCollectionIndexes(
                    "transaction_document",
                    [{ key: { name: 1 } }],
                )
                await queryRunner.rollbackTransaction()

                expect(createIndexes.calledOnce).to.be.true
                expect(createIndexes.firstCall.args[1]).to.have.property(
                    "session",
                    session,
                )

                startSessionStub.restore()
                getCollectionStub.restore()
                await queryRunner.release()
            }),
        ))

    it("should pass active transaction session into dropCollectionIndexes", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner =
                    dataSource.createQueryRunner() as MongoQueryRunner

                const fakeSession = createTestClientSession()
                const session = fakeSession as unknown as ClientSession

                const dropIndexes = sinon.stub().resolves(true)
                const collection = { dropIndexes }

                const queryRunnerWithCollection =
                    queryRunner as unknown as QueryRunnerWithCollection<
                        typeof collection
                    >

                const startSessionStub = sinon
                    .stub(queryRunner.databaseConnection, "startSession")
                    .returns(session)
                const getCollectionStub = sinon
                    .stub(queryRunnerWithCollection, "getCollection")
                    .returns(collection)

                await queryRunner.startTransaction()
                await queryRunner.dropCollectionIndexes("transaction_document")
                await queryRunner.rollbackTransaction()

                expect(dropIndexes.calledOnce).to.be.true
                expect(dropIndexes.firstCall.args[0]).to.have.property(
                    "session",
                    session,
                )

                startSessionStub.restore()
                getCollectionStub.restore()
                await queryRunner.release()
            }),
        ))

    it("should wire transaction callback to query-runner-scoped manager", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const managerSpy = sinon.spy(dataSource, "createEntityManager")
                try {
                    await dataSource.transaction(
                        async (transactionalManager) => {
                            transactionalManager.getRepository(
                                TransactionDocument,
                            )
                            await Promise.resolve()
                        },
                    )

                    expect(managerSpy.called).to.be.true
                    const callsWithQueryRunner = managerSpy
                        .getCalls()
                        .filter((call) => call.args.length > 0)
                    expect(callsWithQueryRunner.length).to.be.greaterThan(0)
                } finally {
                    managerSpy.restore()
                }
            }),
        ))

    it("should pass mongodb transaction options to session.startTransaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner =
                    dataSource.createQueryRunner() as MongoQueryRunner
                const manager = dataSource.createEntityManager(
                    queryRunner,
                ) as MongoEntityManager

                const transactionOptions = {
                    maxCommitTimeMS: 2500,
                    readPreference: "primary" as const,
                }

                const fakeSession = createTestClientSession()
                const session = fakeSession as unknown as ClientSession

                const startSessionStub = sinon
                    .stub(queryRunner.databaseConnection, "startSession")
                    .returns(session)

                try {
                    await manager.transaction(transactionOptions, async () => {
                        // no-op, only verify option plumbing
                        await Promise.resolve()
                    })

                    expect(fakeSession.startTransaction.calledOnce).to.be.true
                    expect(
                        fakeSession.startTransaction.firstCall.args[0],
                    ).to.deep.equal(transactionOptions)
                } finally {
                    startSessionStub.restore()
                    await queryRunner.release()
                }
            }),
        ))

    it("should allow passing mongodb transaction options through data source transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const transactionOptions = {
                    maxCommitTimeMS: 1500,
                    readPreference: "primary" as const,
                }

                const managerTransactionSpy = sinon.spy(
                    dataSource.manager,
                    "transaction",
                )

                try {
                    await dataSource.transaction(
                        transactionOptions,
                        async (_manager) => {
                            await Promise.resolve()
                        },
                    )

                    expect(managerTransactionSpy.calledOnce).to.be.true
                    expect(
                        managerTransactionSpy.firstCall.args[0],
                    ).to.deep.equal(transactionOptions)
                } finally {
                    managerTransactionSpy.restore()
                }
            }),
        ))

    it("should not allow collection operations after query runner release", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner =
                    dataSource.createQueryRunner() as MongoQueryRunner

                await queryRunner.release()

                let error: unknown
                try {
                    await queryRunner.insertOne("transaction_document", {
                        name: "after-release",
                    })
                } catch (err) {
                    error = err
                }

                expect(error).to.be.instanceOf(QueryRunnerAlreadyReleasedError)
            }),
        ))

    it("should not allow clearDatabase after query runner release", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner =
                    dataSource.createQueryRunner() as MongoQueryRunner

                await queryRunner.release()

                let error: unknown
                try {
                    await queryRunner.clearDatabase()
                } catch (err) {
                    error = err
                }

                expect(error).to.be.instanceOf(QueryRunnerAlreadyReleasedError)
            }),
        ))

    it("should not allow clearTable after query runner release", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner =
                    dataSource.createQueryRunner() as MongoQueryRunner

                await queryRunner.release()

                let error: unknown
                try {
                    await queryRunner.clearTable("transaction_document")
                } catch (err) {
                    error = err
                }

                expect(error).to.be.instanceOf(QueryRunnerAlreadyReleasedError)
            }),
        ))
})
