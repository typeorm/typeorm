import { expect } from "chai"
import sinon from "sinon"
import type { DataSource } from "../../../src"
import { QueryFailedError } from "../../../src/error/QueryFailedError"
import type { ExpoDriver } from "../../../src/driver/expo/ExpoDriver"
import { ExpoQueryRunner } from "../../../src/driver/expo/ExpoQueryRunner"

describe("ExpoQueryRunner", () => {
    it("should log, broadcast AfterQuery(success=false) and wrap the error when prepareAsync rejects", async () => {
        const prepareError = new Error("prepare failed")
        const databaseConnection = {
            prepareAsync: sinon.stub().rejects(prepareError),
        }
        const logQueryError = sinon.fake()
        const afterQuery = sinon.fake()

        const driver = {
            databaseConnection,
            options: {},
            dataSource: {
                logger: {
                    logQuery: sinon.fake(),
                    logQueryError,
                    logQuerySlow: sinon.fake(),
                },
                subscribers: [{ afterQuery }],
            } as unknown as DataSource,
        } as unknown as ExpoDriver

        const queryRunner = new ExpoQueryRunner(driver)
        const query = "SELECT ?"
        const parameters = [1, "a"]

        const thrown = await queryRunner.query(query, parameters).then(
            () => undefined,
            (err: unknown) => err,
        )

        if (!(thrown instanceof QueryFailedError))
            throw new Error(`expected a QueryFailedError, got ${thrown}`)
        expect(thrown.driverError).to.equal(prepareError)

        expect(logQueryError.calledOnce).to.be.true
        expect(logQueryError.args[0]).to.deep.equal([
            prepareError,
            query,
            parameters,
            queryRunner,
        ])

        expect(afterQuery.calledOnce).to.be.true
        const event = afterQuery.args[0][0]
        expect(event.query).to.equal(query)
        expect(event.parameters).to.equal(parameters)
        expect(event.success).to.be.false
        expect(event.error).to.equal(prepareError)
    })

    it("should still finalize the statement when prepareAsync succeeds but executeAsync fails", async () => {
        const executeError = new Error("execute failed")
        const finalizeAsync = sinon.fake.resolves(undefined)
        const statement = {
            executeAsync: sinon.stub().rejects(executeError),
            finalizeAsync,
        }
        const databaseConnection = {
            prepareAsync: sinon.stub().resolves(statement),
        }

        const driver = {
            databaseConnection,
            options: {},
            dataSource: {
                logger: {
                    logQuery: sinon.fake(),
                    logQueryError: sinon.fake(),
                    logQuerySlow: sinon.fake(),
                },
                subscribers: [],
            } as unknown as DataSource,
        } as unknown as ExpoDriver

        const queryRunner = new ExpoQueryRunner(driver)

        const thrown = await queryRunner.query("SELECT 1").then(
            () => undefined,
            (err: unknown) => err,
        )

        expect(thrown).to.be.instanceOf(QueryFailedError)
        expect(finalizeAsync.calledOnce).to.be.true
    })
})
