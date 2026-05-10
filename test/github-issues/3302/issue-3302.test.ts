import sinon from "sinon"
import type { DataSource } from "../../../src"
import { PlatformTools } from "../../../src/platform/PlatformTools"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import {
    afterQueryLogPath,
    beforeQueryLogPath,
} from "./subscriber/PostSubscriber"

describe("github issues > #3302 Tracking query time for slow queries and statsd timers", () => {
    let dataSources: DataSource[]
    let appendStub: sinon.SinonStub
    let sandbox: sinon.SinonSandbox

    before(async () => {
        sandbox = sinon.createSandbox()
        appendStub = sandbox.stub(PlatformTools, "appendFileSync")
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
            subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
        })
    })
    beforeEach(async () => {
        await reloadTestingDatabases(dataSources)
    })
    after(async () => {
        sandbox.restore()
        await closeTestingConnections(dataSources)
    })

    it("if query executed, should write query to file", async () => {
        for (const dataSource of dataSources) {
            const testQuery = `SELECT COUNT(*) FROM ${dataSource.driver.escape(
                "post",
            )}`

            appendStub.resetHistory()
            await dataSource.query(testQuery)

            sinon.assert.calledWith(
                appendStub,
                beforeQueryLogPath,
                sinon.match(testQuery),
            )
            sinon.assert.calledWith(
                appendStub,
                afterQueryLogPath,
                sinon.match(testQuery),
            )
        }
    })
})
