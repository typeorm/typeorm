import { expect } from "chai"
import sinon from "sinon"
import { Readable } from "stream"
import { DataSource } from "../../../src/data-source/DataSource"
import type { SapDriver } from "../../../src/driver/sap/SapDriver"

// Regression for https://github.com/typeorm/typeorm/issues/12934
describe("query builder > driver stream cleanup", () => {
    afterEach(() => sinon.restore())

    it("should not release a SAP connection while its stream cleanup is pending", async () => {
        const dataSource = new DataSource({ type: "sap", driver: {} })
        const driver = dataSource.driver as SapDriver
        const stream = new Readable({ read() {} })
        driver.streamClient = { createObjectStream: () => stream }
        let finishResultSetClose: () => void
        const resultSet = {
            close: (callback: () => void) => {
                finishResultSetClose = callback
            },
        }
        const statement = {
            executeQuery: sinon.stub().callsArgWith(1, null, resultSet),
            drop: sinon.stub().callsArgWith(0, null),
        }
        const connection = {
            prepare: sinon.stub().callsArgWith(1, null, statement),
            disconnect: sinon.stub().callsArgWith(0, null),
        }
        sinon.stub(driver, "obtainMasterConnection").resolves(connection)
        const createRunner = sinon.spy(dataSource, "createQueryRunner")

        try {
            await dataSource
                .createQueryBuilder()
                .select("value")
                .from("test_table", "test")
                .stream()
            const closed = new Promise<void>((resolve) =>
                stream.once("close", resolve),
            )
            stream.destroy()
            await closed
            expect(statement.drop.callCount).to.equal(0)
            expect(connection.disconnect.callCount).to.equal(0)
        } finally {
            finishResultSetClose!()
            await new Promise((resolve) => setImmediate(resolve))
            await createRunner.lastCall.returnValue.release()
        }
        expect(statement.drop.callCount).to.equal(1)
    })
})
