import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Post } from "./entity/Post"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import sinon from "sinon"
import { expect } from "chai"

describe("persistence > persistence options > transaction", () => {
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({ __dirname })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    it("should disable transaction when option is specified", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new Post()
                post.title = "Bakhrom"
                post.description = "Hello"

                const queryRunner = dataSource.createQueryRunner()

                const startTransactionFn = sinon.spy(
                    queryRunner,
                    "startTransaction",
                )
                const commitTransactionFn = sinon.spy(
                    queryRunner,
                    "commitTransaction",
                )

                await dataSource
                    .createEntityManager(queryRunner)
                    .getRepository(Post)
                    .save(post, { transaction: false })

                expect(startTransactionFn.called).to.be.false
                expect(commitTransactionFn.called).to.be.false

                // Cleanup
                await queryRunner.release()
                sinon.restore()
            }),
        ))

    it("should disable transaction when the drivers transactionSupport setting equals `none`", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new Post()
                post.title = "Bakhrom"
                post.description = "Hello"

                // Storing initial driver setting of the `transactionSupport` property
                // in order to be able to restore it later
                const transactionSupportInitial =
                    dataSource.driver.transactionSupport
                dataSource.driver.transactionSupport = "none"

                const queryRunner = dataSource.createQueryRunner()

                const startTransactionFn = sinon.spy(
                    queryRunner,
                    "startTransaction",
                )
                const commitTransactionFn = sinon.spy(
                    queryRunner,
                    "commitTransaction",
                )

                await dataSource
                    .createEntityManager(queryRunner)
                    .getRepository(Post)
                    .save(post)

                expect(startTransactionFn.called).to.be.false
                expect(commitTransactionFn.called).to.be.false

                // Cleanup
                await queryRunner.release()
                sinon.restore()
                dataSource.driver.transactionSupport = transactionSupportInitial
            }),
        ))
})
