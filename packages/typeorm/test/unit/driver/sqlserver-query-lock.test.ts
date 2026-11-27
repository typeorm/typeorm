import { expect } from "chai"
import sinon from "sinon"
import { DataSource } from "../../../src/data-source/DataSource"
import type { SqlServerDriver } from "../../../src/driver/sqlserver/SqlServerDriver"
import type { QueryRunner } from "../../../src/query-runner/QueryRunner"

// Regression for https://github.com/typeorm/typeorm/issues/12936
describe("SQL Server query lock", () => {
    let dataSource: DataSource
    let queryRunner: QueryRunner
    let requestQuery: sinon.SinonStub

    beforeEach(() => {
        dataSource = new DataSource({ type: "mssql", host: "localhost" })
        const driver = dataSource.driver as SqlServerDriver
        sinon.stub(driver, "obtainMasterConnection").resolves({})
        requestQuery = sinon.stub().resolves({
            recordset: [{ value: 1 }],
            rowsAffected: [1],
        })
        sinon.stub(driver.mssql, "Request").callsFake(function () {
            return { query: requestQuery }
        })
        queryRunner = dataSource.createQueryRunner()
    })
    afterEach(() => sinon.restore())

    for (const event of ["beforeQuery", "afterQuery"] as const) {
        for (const asynchronous of [false, true]) {
            it(`should unlock after ${event} ${asynchronous ? "rejects" : "throws"}`, async () => {
                const hookError = new Error("subscriber failed")
                const fail = () => {
                    throw hookError
                }
                dataSource.subscribers.push({
                    [event]: asynchronous
                        ? () => Promise.reject(hookError)
                        : fail,
                })

                await expect(
                    queryRunner.query("SELECT 1 AS value"),
                ).to.be.rejectedWith(hookError)
                expect(requestQuery.callCount).to.equal(
                    event === "beforeQuery" ? 0 : 1,
                )
                dataSource.subscribers.length = 0

                expect(
                    await queryRunner.query("SELECT 1 AS value"),
                ).to.deep.equal([{ value: 1 }])
            })
        }

        it(`should hold the lock until ${event} settles`, async () => {
            let finishHook: () => void
            const hookPromise = new Promise<void>((resolve) => {
                finishHook = resolve
            })
            dataSource.subscribers.push({ [event]: () => hookPromise })
            const first = queryRunner.query("SELECT 1 AS value")
            const second = queryRunner.query("SELECT 1 AS value")

            try {
                await new Promise((resolve) => setImmediate(resolve))
                expect(requestQuery.callCount).to.equal(
                    event === "beforeQuery" ? 0 : 1,
                )
            } finally {
                finishHook!()
            }

            expect(await Promise.all([first, second])).to.deep.equal([
                [{ value: 1 }],
                [{ value: 1 }],
            ])
            expect(requestQuery.callCount).to.equal(2)
        })
    }

    it("should unlock after a database error", async () => {
        requestQuery.onFirstCall().rejects(new Error("database failed"))
        await expect(queryRunner.query("SELECT 1 AS value")).to.be.rejectedWith(
            "database failed",
        )
        expect(await queryRunner.query("SELECT 1 AS value")).to.deep.equal([
            { value: 1 },
        ])
    })
})
