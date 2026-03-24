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
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
        })
        sandbox = sinon.createSandbox()
        appendStub = sandbox.stub(PlatformTools, "appendFileSync")
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterEach(async () => {
        appendStub.resetHistory()
        sandbox.restore()
        await closeTestingConnections(dataSources)
    })

    it("if query executed, should write query to file", async () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const testQuery = `SELECT COUNT(*) FROM ${connection.driver.escape(
                    "post",
                )}`

                await connection.query(testQuery)

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
            }),
        ))
})
