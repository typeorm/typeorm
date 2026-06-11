import "reflect-metadata"
import { expect } from "chai"
import type { DataSource, MongoEntityManager } from "../../../../../src"
import {
    DataSource as DataSourceClass,
    QueryRunnerAlreadyReleasedError,
} from "../../../../../src"
import type { MongoQueryRunner } from "../../../../../src/driver/mongodb/MongoQueryRunner"
import { TransactionDocument } from "./entity/TransactionDocument"

describe("mongodb > transaction support", () => {
    let dataSource: DataSource

    before(async () => {
        dataSource = new DataSourceClass({
            type: "mongodb",
            url: "mongodb://localhost:27017/?replicaSet=rs0",
            entities: [TransactionDocument],
            synchronize: false,
        })

        await Promise.race([
            dataSource.initialize(),
            new Promise((_, reject) =>
                setTimeout(
                    () => reject(new Error("MongoDB connection timeout")),
                    8000,
                ),
            ),
        ])
    })

    beforeEach(async () => {
        // Clear the TransactionDocument collection before each test
        if (dataSource.isInitialized) {
            const repository = dataSource.getRepository(TransactionDocument)
            await repository.clear()
        }
    })

    after(async () => {
        if (dataSource.isInitialized) {
            await dataSource.destroy()
        }
    })

    it("query runner > should start and commit a transaction", async () => {
        const repository = dataSource.getRepository(TransactionDocument)

        // Start a transaction
        const queryRunner = dataSource.createQueryRunner() as MongoQueryRunner
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
    })

    it("query runner > should rollback a transaction when aborted", async () => {
        const repository = dataSource.getRepository(TransactionDocument)

        const queryRunner = dataSource.createQueryRunner() as MongoQueryRunner
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
    })

    it("query runner > should handle multiple inserts in a transaction", async () => {
        const repository = dataSource.getRepository(TransactionDocument)

        const queryRunner = dataSource.createQueryRunner() as MongoQueryRunner
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
    })

    it("query runner > should start transaction with NONE isolation level and transaction options", async () => {
        const repository = dataSource.getRepository(TransactionDocument)

        const queryRunner = dataSource.createQueryRunner() as MongoQueryRunner

        // Start a transaction with NONE isolation level and transaction options
        // IMPORTANT - NONE is just a placeholder to avoid refactoring the startTransaction to receive an object with optional
        // configs instead of optional parameters which would introduce a braking change for all query runners.
        // It must be considered in future refactorings to properly support transaction options and isolation levels.
        await queryRunner.startTransaction("NONE", {
            maxCommitTimeMS: 5000,
            readPreference: "primary",
            readConcern: {
                level: "majority",
            },
            writeConcern: {
                w: 1,
            },
        })

        try {
            // Save a document within the transaction
            const doc = new TransactionDocument()
            doc.name = "query-runner-transaction-with-options"
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
            expect(foundDoc?.name).to.equal(
                "query-runner-transaction-with-options",
            )
        } finally {
            await queryRunner.release()
        }
    })

    it("entity manager > should support EntityManager transaction", async () => {
        const repository = dataSource.getRepository(TransactionDocument)

        // Use the transaction method on entity manager
        const result = await dataSource.manager.transaction(
            async (transactionalManager) => {
                const doc = new TransactionDocument()
                doc.name = "manager-transaction"
                return await transactionalManager.save(TransactionDocument, doc)
            },
        )

        // Verify the document was persisted
        const foundDoc = await repository.findOne({
            where: { id: result.id },
        })
        expect(foundDoc).to.exist
        expect(foundDoc?.name).to.equal("manager-transaction")
    })

    it("entity manager > should support EntityManager transaction method with maxCommitTimeMS option", async () => {
        const repository = dataSource.getRepository(TransactionDocument)
        const manager = dataSource.manager as MongoEntityManager

        // Positive case: Use the transaction method with reasonable maxCommitTimeMS
        // Transaction will be automatically COMMITTED on success
        const result = (await manager.transaction(
            {
                maxCommitTimeMS: 5000, // 5 second timeout
            },
            async (mgr) => {
                const doc = new TransactionDocument()
                doc.name = "manager-transaction-max-commit"
                return await mgr.save(TransactionDocument, doc)
            },
        )) as TransactionDocument

        // Verify the document was persisted (confirms commit happened)
        const foundDoc = await repository.findOne({
            where: { id: result.id },
        })
        expect(foundDoc).to.exist
        expect(foundDoc?.name).to.equal("manager-transaction-max-commit")
    })

    it("entity manager > should support EntityManager transaction method with readPreference option", async () => {
        const repository = dataSource.getRepository(TransactionDocument)
        const manager = dataSource.manager as MongoEntityManager

        // MongoDB transactions only support "primary" read preference
        // This ensures reads go to the primary node in a replica set
        // Transaction will be automatically COMMITTED on success
        const result1 = (await manager.transaction(
            {
                readPreference: "primary",
            },
            async (mgr) => {
                const doc = new TransactionDocument()
                doc.name = "manager-transaction-read-preference-primary"
                const saved = await mgr.save(TransactionDocument, doc)

                // Verify we can read within the same transaction
                const found = await mgr.findOne(TransactionDocument, {
                    where: { id: saved.id },
                })
                expect(found).to.exist
                expect(found?.name).to.equal(
                    "manager-transaction-read-preference-primary",
                )

                return saved
            },
        )) as TransactionDocument

        // Verify the document was persisted (confirms commit happened)
        const foundDoc = await repository.findOne({
            where: { id: result1.id },
        })
        expect(foundDoc).to.exist
        expect(foundDoc?.name).to.equal(
            "manager-transaction-read-preference-primary",
        )
    })

    it(" entity manager > should support EntityManager transaction method with readConcern option", async () => {
        const repository = dataSource.getRepository(TransactionDocument)
        const manager = dataSource.manager as MongoEntityManager

        // Positive case: Use readConcern with "majority" level
        // This ensures we read data acknowledged by majority of replica set
        // Transaction will be automatically COMMITTED on success
        const result1 = (await manager.transaction(
            {
                readConcern: {
                    level: "majority",
                },
            },
            async (mgr) => {
                const doc = new TransactionDocument()
                doc.name = "manager-transaction-read-concern-majority"
                const saved = await mgr.save(TransactionDocument, doc)

                // Read within transaction to verify read concern is applied
                const found = await mgr.findOne(TransactionDocument, {
                    where: { id: saved.id },
                })
                expect(found).to.exist
                expect(found?.name).to.equal(
                    "manager-transaction-read-concern-majority",
                )

                return saved
            },
        )) as TransactionDocument

        // Verify the document was persisted with majority read concern (confirms commit happened)
        const foundDoc = await repository.findOne({
            where: { id: result1.id },
        })
        expect(foundDoc).to.exist
        expect(foundDoc?.name).to.equal(
            "manager-transaction-read-concern-majority",
        )

        // Negative case: Use readConcern with "local" level
        // Local is less strict and may read uncommitted data
        // Transaction will be automatically COMMITTED on success
        const result2 = (await manager.transaction(
            {
                readConcern: {
                    level: "local",
                },
            },
            async (mgr) => {
                const doc = new TransactionDocument()
                doc.name = "manager-transaction-read-concern-local"
                const saved = await mgr.save(TransactionDocument, doc)

                // This should succeed immediately with local read concern
                const found = await mgr.findOne(TransactionDocument, {
                    where: { id: saved.id },
                })
                expect(found).to.exist

                return saved
            },
        )) as TransactionDocument

        // Verify document was persisted with local read concern (confirms commit happened)
        const foundDoc2 = await repository.findOne({
            where: { id: result2.id },
        })
        expect(foundDoc2).to.exist
        expect(foundDoc2?.name).to.equal(
            "manager-transaction-read-concern-local",
        )

        // Verify both documents exist (both concerns worked and were committed)
        const allDocs = await repository.find()
        expect(allDocs.length).to.be.greaterThanOrEqual(2)
    })

    it("entity manager > should support EntityManager transaction method with writeConcern option", async () => {
        const repository = dataSource.getRepository(TransactionDocument)
        const manager = dataSource.manager as MongoEntityManager

        // Positive case: writeConcern with w:1 (acknowledged by 1 node)
        // This ensures the write is acknowledged by at least 1 node
        // Transaction will be automatically COMMITTED on success
        const result1 = (await manager.transaction(
            {
                writeConcern: {
                    w: 1,
                },
            },
            async (mgr) => {
                const doc = new TransactionDocument()
                doc.name = "manager-transaction-write-concern-w1"
                const saved = await mgr.save(TransactionDocument, doc)

                // Verify write was persisted within transaction
                const found = await mgr.findOne(TransactionDocument, {
                    where: { id: saved.id },
                })
                expect(found).to.exist
                expect(found?.name).to.equal(
                    "manager-transaction-write-concern-w1",
                )

                return saved
            },
        )) as TransactionDocument

        // Verify the document was persisted with write concern w:1 (confirms commit happened)
        const foundDoc1 = await repository.findOne({
            where: { id: result1.id },
        })
        expect(foundDoc1).to.exist
        expect(foundDoc1?.name).to.equal("manager-transaction-write-concern-w1")

        // Negative case: writeConcern with stricter settings
        // In a replica set, we could use majority but single-node setups treat it as w:1
        // Transaction will be automatically COMMITTED on success
        const result2 = (await manager.transaction(
            {
                writeConcern: {
                    w: "majority", // Requires majority of replica set to acknowledge
                },
            },
            async (mgr) => {
                const doc = new TransactionDocument()
                doc.name = "manager-transaction-write-concern-majority-string"
                const saved = await mgr.save(TransactionDocument, doc)

                // Verify write was acknowledged by majority
                const found = await mgr.findOne(TransactionDocument, {
                    where: { id: saved.id },
                })
                expect(found).to.exist

                return saved
            },
        )) as TransactionDocument

        // Verify the document was persisted with majority write concern (confirms commit happened)
        const foundDoc2 = await repository.findOne({
            where: { id: result2.id },
        })
        expect(foundDoc2).to.exist
        expect(foundDoc2?.name).to.equal(
            "manager-transaction-write-concern-majority-string",
        )

        // Verify both documents with different write concerns exist (both commits succeeded)
        const allDocs = await repository.find()
        expect(allDocs.length).to.be.greaterThanOrEqual(2)

        // Verify we can distinguish between them by name
        const names = allDocs.map((d) => d.name)
        expect(names).to.include("manager-transaction-write-concern-w1")
        expect(names).to.include(
            "manager-transaction-write-concern-majority-string",
        )
    })

    it("entity manager > should support EntityManager transaction method with multiple options", async () => {
        const repository = dataSource.getRepository(TransactionDocument)
        const manager = dataSource.manager as MongoEntityManager

        // Positive case: Use all transaction options together
        // MongoDB transactions only support "primary" read preference
        // This validates that all options can coexist and work together
        // Transaction will be automatically COMMITTED on success
        const result1 = (await manager.transaction(
            {
                maxCommitTimeMS: 5000,
                readPreference: "primary",
                readConcern: {
                    level: "majority",
                },
                writeConcern: {
                    w: 1,
                },
            },
            async (mgr) => {
                const doc = new TransactionDocument()
                doc.name = "manager-transaction-combined-options-success"
                const saved = await mgr.save(TransactionDocument, doc)

                // Read back to verify all settings work together
                const found = await mgr.findOne(TransactionDocument, {
                    where: { id: saved.id },
                })
                expect(found).to.exist
                expect(found?.name).to.equal(
                    "manager-transaction-combined-options-success",
                )

                return saved
            },
        )) as TransactionDocument

        // Verify the document was persisted with all options (confirms commit happened)
        const foundDoc1 = await repository.findOne({
            where: { id: result1.id },
        })
        expect(foundDoc1).to.exist
        expect(foundDoc1?.name).to.equal(
            "manager-transaction-combined-options-success",
        )
    })

    it("should fail to save within a rolled back transaction", async () => {
        const repository = dataSource.getRepository(TransactionDocument)

        const queryRunner = dataSource.createQueryRunner() as MongoQueryRunner
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
    })

    it("should not allow collection operations after query runner release", async () => {
        const queryRunner = dataSource.createQueryRunner() as MongoQueryRunner

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
    })

    it("should not allow clearDatabase after query runner release", async () => {
        const queryRunner = dataSource.createQueryRunner() as MongoQueryRunner

        await queryRunner.release()

        let error: unknown
        try {
            await queryRunner.clearDatabase()
        } catch (err) {
            error = err
        }

        expect(error).to.be.instanceOf(QueryRunnerAlreadyReleasedError)
    })

    it("should not allow clearTable after query runner release", async () => {
        const queryRunner = dataSource.createQueryRunner() as MongoQueryRunner

        await queryRunner.release()

        let error: unknown
        try {
            await queryRunner.clearTable("transaction_document")
        } catch (err) {
            error = err
        }

        expect(error).to.be.instanceOf(QueryRunnerAlreadyReleasedError)
    })
})
