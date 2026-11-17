import "reflect-metadata"
import { expect } from "chai"
import type { DataSource, QueryRunner } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("github issues > #13060 Expose queryRunner.transactionDepth", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [],
            enabledDrivers: ["better-sqlite3", "sqlite"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should expose transactionDepth on QueryRunner interface and track nested transaction depth", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner: QueryRunner = dataSource.createQueryRunner()
                try {
                    expect(queryRunner.transactionDepth).to.equal(0)
                    expect(queryRunner.isTransactionActive).to.be.false

                    await queryRunner.startTransaction()
                    expect(queryRunner.transactionDepth).to.equal(1)
                    expect(queryRunner.isTransactionActive).to.be.true

                    await queryRunner.startTransaction()
                    expect(queryRunner.transactionDepth).to.equal(2)
                    expect(queryRunner.isTransactionActive).to.be.true

                    await queryRunner.rollbackTransaction()
                    expect(queryRunner.transactionDepth).to.equal(1)
                    expect(queryRunner.isTransactionActive).to.be.true

                    await queryRunner.commitTransaction()
                    expect(queryRunner.transactionDepth).to.equal(0)
                    expect(queryRunner.isTransactionActive).to.be.false
                } finally {
                    await queryRunner.release()
                }
            }),
        ))
})
