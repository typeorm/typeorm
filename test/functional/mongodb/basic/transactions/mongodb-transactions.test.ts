import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource, MongoEntityManager } from "../../../../../src"
import { QueryRunnerAlreadyReleasedError } from "../../../../../src"
import type { MongoQueryRunner } from "../../../../../src/driver/mongodb/MongoQueryRunner"
import { TransactionDocument } from "./entity/TransactionDocument"
import sinon from "sinon"
import { expect } from "chai"

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

                const fakeSession = {
                    startTransaction: sinon.spy(),
                    commitTransaction: sinon.stub().resolves(),
                    abortTransaction: sinon.stub().resolves(),
                    endSession: sinon.stub().resolves(),
                }

                const startSessionStub = sinon
                    .stub(queryRunner.databaseConnection, "startSession")
                    .returns(fakeSession as any)

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

                const session = {
                    startTransaction: sinon.spy(),
                    commitTransaction: sinon.stub().resolves(),
                    abortTransaction: sinon.stub().resolves(),
                    endSession: sinon.stub().resolves(),
                }

                const insertOne = sinon.stub().resolves({ insertedId: 1 })
                const collection = {
                    insertOne,
                }

                const startSessionStub = sinon
                    .stub(queryRunner.databaseConnection, "startSession")
                    .returns(session as any)
                const getCollectionStub = sinon
                    .stub(queryRunner as any, "getCollection")
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

                const session = {
                    startTransaction: sinon.spy(),
                    commitTransaction: sinon.stub().resolves(),
                    abortTransaction: sinon.stub().resolves(),
                    endSession: sinon.stub().resolves(),
                }

                const initializeOrderedBulkOp = sinon.stub().returns({})
                const initializeUnorderedBulkOp = sinon.stub().returns({})
                const collection = {
                    initializeOrderedBulkOp,
                    initializeUnorderedBulkOp,
                }

                const startSessionStub = sinon
                    .stub(queryRunner.databaseConnection, "startSession")
                    .returns(session as any)
                const getCollectionStub = sinon
                    .stub(queryRunner as any, "getCollection")
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

                const fakeSession = {
                    startTransaction: sinon.spy(),
                    commitTransaction: sinon.stub().resolves(),
                    abortTransaction: sinon.stub().resolves(),
                    endSession: sinon.stub().resolves(),
                }

                const startSessionStub = sinon
                    .stub(queryRunner.databaseConnection, "startSession")
                    .returns(fakeSession as any)

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
})
