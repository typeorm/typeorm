import { expect } from "chai"
import type { DataSource } from "../../../src/data-source/DataSource"
import { EntityManager } from "../../../src/entity-manager/EntityManager"
import { QueryRunnerProviderAlreadyReleasedError } from "../../../src/error/QueryRunnerProviderAlreadyReleasedError"
import type { ObjectLiteral } from "../../../src/common/ObjectLiteral"
import type { QueryRunner } from "../../../src/query-runner/QueryRunner"

describe("github issues > #12645 transaction manager query race", () => {
    // Regression test for https://github.com/typeorm/typeorm/issues/12645.
    it("should prevent manager queries between rollback and query runner release", async () => {
        const executedQueries: string[] = []
        let transactionManager!: EntityManager
        let queryAfterRollbackError: unknown

        const dataSource = {
            createQueryRunner: () => queryRunner,
            query: (
                query: string,
                parameters?: any[] | ObjectLiteral,
                queryRunner?: QueryRunner,
            ) => {
                if (!queryRunner) throw new Error("Expected a query runner")

                return queryRunner.query(query, parameters)
            },
        } as unknown as DataSource

        const queryRunner = {
            isReleased: false,
            isTransactionActive: false,
            manager: undefined as unknown as EntityManager,
            query: async (query: string) => {
                executedQueries.push(query)
                return []
            },
            startTransaction: async function () {
                this.isTransactionActive = true
                await this.query("START TRANSACTION")
            },
            commitTransaction: async function () {
                await this.query("COMMIT")
                this.isTransactionActive = false
            },
            rollbackTransaction: async function () {
                await this.query("ROLLBACK")
                this.isTransactionActive = false
            },
            release: async function () {
                try {
                    await transactionManager.query("UPDATE should_not_run")
                } catch (error) {
                    queryAfterRollbackError = error
                }

                this.isReleased = true
            },
        }

        queryRunner.manager = new EntityManager(
            dataSource,
            queryRunner as unknown as QueryRunner,
        )

        const manager = new EntityManager(dataSource)
        const originalError = new Error("transaction failed")

        try {
            await manager.transaction(async (entityManager) => {
                transactionManager = entityManager
                throw originalError
            })
            expect.fail("transaction should reject")
        } catch (error) {
            expect(error).to.equal(originalError)
        }

        expect(queryAfterRollbackError).to.be.instanceOf(
            QueryRunnerProviderAlreadyReleasedError,
        )
        expect(executedQueries).to.deep.equal(["START TRANSACTION", "ROLLBACK"])
    })
})
