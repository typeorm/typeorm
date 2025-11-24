import "reflect-metadata"
import { expect } from "chai"

import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

import { EntityManager } from "../../../src"
import { BaseQueryRunner } from "../../../src/query-runner/BaseQueryRunner"
import { Company } from "./entity/Company"
import { User } from "./entity/User"

describe("github issues > #10626 Regression in transactionDepth handling", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["better-sqlite3", "postgres", "sqlite"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("transactionDepth should be updated correctly when commit fails", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const transactionDepths: Record<string, number> = {}
                const recordDepth = (mark: string) => {
                    transactionDepths[mark] = (
                        queryRunner as unknown as BaseQueryRunner
                    )["transactionDepth"]
                }

                recordDepth("initial")

                await queryRunner.startTransaction()
                recordDepth("startTransaction")

                const runInTransaction = async (
                    entityManager: EntityManager,
                ) => {
                    // first save user
                    const user = new User()
                    user.id = 1
                    user.company = { id: 100 }
                    user.name = "Bob"

                    await entityManager.save(user)

                    // then save company
                    const company = new Company()
                    company.id = 200
                    company.name = "Acme"

                    await entityManager.save(company)
                }
                await runInTransaction(queryRunner.manager).should.not.rejected
                recordDepth("afterStatements")

                await queryRunner.commitTransaction().should.be.rejected
                recordDepth("afterCommit")

                await queryRunner.rollbackTransaction().should.not.be.rejected
                recordDepth("afterRollback")

                await queryRunner.release()
                recordDepth("afterRelease")

                expect(transactionDepths).to.deep.equal({
                    initial: 0,
                    startTransaction: 1,
                    afterStatements: 1,
                    afterCommit: 1,
                    afterRollback: 0,
                    afterRelease: 0,
                })

                // check data
                const user = await connection.manager.findOneBy(User, { id: 1 })
                expect(user).to.equal(null)

                const company = await connection.manager.findOneBy(Company, {
                    id: 200,
                })
                expect(company).to.equal(null)
            }),
        ))
})
