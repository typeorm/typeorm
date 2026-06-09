import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src"
import { QueryRunnerAlreadyReleasedError } from "../../../../../src"
import type { MongoQueryRunner } from "../../../../../src/driver/mongodb/MongoQueryRunner"
import { TransactionDocument } from "./entity/TransactionDocument"

describe("mongodb > transaction support", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["mongodb"],
            entities: [TransactionDocument],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should start and commit a transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(TransactionDocument)

                // Start a transaction
                const queryRunner =
                    dataSource.createQueryRunner() as MongoQueryRunner
                await queryRunner.startTransaction()

                try {
                    // Save a document within the transaction
                    const doc = new TransactionDocument()
                    doc.name = "test-transaction-commit"
                    const savedDoc = await queryRunner.manager.save(
                        TransactionDocument,
                        doc,
                    )

                    // Commit the transaction
                    await queryRunner.commitTransaction()

                    // Verify the document was persisted
                    const foundDoc = await repository.findOne({
                        where: { id: savedDoc.id },
                    })
                    expect(foundDoc).to.exist
                    expect(foundDoc?.name).to.equal("test-transaction-commit")
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("should rollback a transaction when aborted", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(TransactionDocument)

                const queryRunner =
                    dataSource.createQueryRunner() as MongoQueryRunner
                await queryRunner.startTransaction()

                try {
                    // Save a document within the transaction
                    const doc = new TransactionDocument()
                    doc.name = "test-transaction-rollback"
                    await queryRunner.manager.save(TransactionDocument, doc)

                    // Rollback the transaction
                    await queryRunner.rollbackTransaction()

                    // Verify the document was NOT persisted
                    const foundDocs = await repository.find()
                    expect(foundDocs).to.have.length(0)
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("should handle multiple inserts in a transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(TransactionDocument)

                const queryRunner =
                    dataSource.createQueryRunner() as MongoQueryRunner
                await queryRunner.startTransaction()

                try {
                    // Save multiple documents within the transaction
                    const doc1 = new TransactionDocument()
                    doc1.name = "doc-1"
                    await queryRunner.manager.save(TransactionDocument, doc1)

                    const doc2 = new TransactionDocument()
                    doc2.name = "doc-2"
                    await queryRunner.manager.save(TransactionDocument, doc2)

                    // Commit the transaction
                    await queryRunner.commitTransaction()

                    // Verify both documents were persisted
                    const foundDocs = await repository.find()
                    expect(foundDocs).to.have.length(2)
                    expect(foundDocs.map((d) => d.name).sort()).to.deep.equal([
                        "doc-1",
                        "doc-2",
                    ])
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("should support EntityManager transaction method", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(TransactionDocument)

                // Use the transaction method on entity manager
                const result = await dataSource.manager.transaction(
                    async (transactionalManager) => {
                        const doc = new TransactionDocument()
                        doc.name = "manager-transaction"
                        return await transactionalManager.save(
                            TransactionDocument,
                            doc,
                        )
                    },
                )

                // Verify the document was persisted
                const foundDoc = await repository.findOne({
                    where: { id: result.id },
                })
                expect(foundDoc).to.exist
                expect(foundDoc?.name).to.equal("manager-transaction")
            }),
        ))

    it("should support DataSource transaction method with options", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(TransactionDocument)

                // Use the transaction method on data source
                const result = await dataSource.transaction(async (manager) => {
                    const doc = new TransactionDocument()
                    doc.name = "datasource-transaction"
                    return await manager.save(TransactionDocument, doc)
                })

                // Verify the document was persisted
                const foundDoc = await repository.findOne({
                    where: { id: result.id },
                })
                expect(foundDoc).to.exist
                expect(foundDoc?.name).to.equal("datasource-transaction")
            }),
        ))

    it("should fail to save within a rolled back transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(TransactionDocument)

                const queryRunner =
                    dataSource.createQueryRunner() as MongoQueryRunner
                await queryRunner.startTransaction()

                try {
                    // Attempt to save a document in a rolled back transaction
                    const doc = new TransactionDocument()
                    doc.name = "should-not-persist"
                    // Note: We save but then rollback before commit
                    await queryRunner.manager.save(TransactionDocument, doc)
                    await queryRunner.rollbackTransaction()

                    // Verify the document was NOT persisted
                    const foundDocs = await repository.find()
                    expect(foundDocs).to.have.length(0)
                } finally {
                    await queryRunner.release()
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
