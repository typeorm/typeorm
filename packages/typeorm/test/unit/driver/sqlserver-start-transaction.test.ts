import { expect } from "chai"
import sinon from "sinon"
import { DataSource } from "../../../src/data-source/DataSource"
import type { SqlServerDriver } from "../../../src/driver/sqlserver/SqlServerDriver"
import { QueryFailedError } from "../../../src/error/QueryFailedError"
import type { QueryRunner } from "../../../src/query-runner/QueryRunner"

// Regression for https://github.com/typeorm/typeorm/issues/13084
describe("SQL Server startTransaction", () => {
    let queryRunner: QueryRunner
    let obtainMasterConnection: sinon.SinonStub
    let begin: sinon.SinonStub
    let requestQuery: sinon.SinonStub

    beforeEach(() => {
        const dataSource = new DataSource({ type: "mssql", host: "localhost" })
        const driver = dataSource.driver as SqlServerDriver
        begin = sinon
            .stub()
            .callsFake((callback: (err?: Error) => void) => callback())
        obtainMasterConnection = sinon
            .stub(driver, "obtainMasterConnection")
            .resolves({ transaction: () => ({ begin }) })
        requestQuery = sinon.stub().resolves({ recordset: [] })
        sinon.stub(driver.mssql, "Request").callsFake(function () {
            return { query: requestQuery }
        })
        queryRunner = dataSource.createQueryRunner()
    })
    afterEach(() => sinon.restore())

    it("should reject when a connection cannot be obtained", async () => {
        obtainMasterConnection.onFirstCall().rejects(new Error("lost"))

        await expect(queryRunner.startTransaction()).to.be.rejectedWith("lost")
        expect(queryRunner.isTransactionActive).to.equal(false)

        await queryRunner.startTransaction()
        expect(begin).to.have.been.calledOnce
    })

    it("should reject when BEGIN TRANSACTION fails", async () => {
        begin
            .onFirstCall()
            .callsFake((callback: (err?: Error) => void) =>
                callback(new Error("lost")),
            )

        await expect(queryRunner.startTransaction()).to.be.rejectedWith("lost")
        expect(queryRunner.isTransactionActive).to.equal(false)

        await queryRunner.startTransaction()
        expect(begin).to.have.been.calledTwice
        expect(requestQuery).not.to.have.been.called
    })

    it("should reject when SAVE TRANSACTION fails", async () => {
        await queryRunner.startTransaction()
        requestQuery.onFirstCall().rejects(new Error("lost"))

        await expect(queryRunner.startTransaction()).to.be.rejectedWith(
            QueryFailedError,
            "lost",
        )
        expect(queryRunner.isTransactionActive).to.equal(true)

        await queryRunner.startTransaction()
        expect(requestQuery.args.map(([query]) => query)).to.deep.equal([
            "SAVE TRANSACTION typeorm_1",
            "SAVE TRANSACTION typeorm_1",
        ])
    })
})
