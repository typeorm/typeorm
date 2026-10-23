import { expect } from "chai"
import sinon from "sinon"
import type { DataSource } from "../../../src/data-source/DataSource"
import type { ExpoDriver } from "../../../src/driver/expo/ExpoDriver"
import { ExpoQueryRunner } from "../../../src/driver/expo/ExpoQueryRunner"

describe("Expo query runner", () => {
    it("finalizes a statement when a failure-event subscriber rejects after a successful event", async () => {
        const subscriberError = new Error("failure-event subscriber rejected")
        const afterQuery = sinon
            .stub()
            .callsFake((event: { success: boolean }) =>
                event.success ? undefined : Promise.reject(subscriberError),
            )
        const dataSource = {
            driver: { options: { type: "expo" } },
            subscribers: [{ afterQuery }],
            logger: {
                logQuery: sinon.spy(),
                logQueryError: sinon.spy(),
            },
        } as unknown as DataSource
        const runner = new ExpoQueryRunner({
            dataSource,
            options: {},
        } as ExpoDriver)
        const statement = {
            executeAsync: sinon.stub().resolves({
                changes: 0,
                getAllAsync: sinon.stub().rejects(new Error("read failed")),
            }),
            finalizeAsync: sinon.stub().resolves(),
        }
        const connection = { prepareAsync: sinon.stub().resolves(statement) }
        sinon.stub(runner, "connect").resolves(connection)

        try {
            await runner.query("SELECT 1")
            expect.fail("the query should reject")
        } catch (error) {
            if (error !== subscriberError) throw error
        }
        expect(afterQuery.calledTwice).to.be.true
        expect(afterQuery.firstCall.args[0].success).to.be.true
        expect(afterQuery.secondCall.args[0].success).to.be.false
        expect(statement.finalizeAsync.calledOnce).to.be.true
    })
})
