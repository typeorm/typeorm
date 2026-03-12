import "reflect-metadata"
import appRootPath from "app-root-path"
import sinon from "sinon"
import type { DataSource } from "../../../src"
import {
    createTestingConnections,
    reloadTestingDatabases,
    closeTestingConnections,
} from "../../utils/test-utils"
import { PlatformTools } from "../../../src/platform/PlatformTools"

describe("github issues > #3302 Tracking query time for slow queries and statsd timers", () => {
    let dataSources: DataSource[]
    let stub: sinon.SinonStub
    let sandbox: sinon.SinonSandbox
    const beforeQueryLogPath = appRootPath + "/before-query.log"
    const afterQueryLogPath = appRootPath + "/after-query.log"

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
        })
        sandbox = sinon.createSandbox()
        stub = sandbox.stub(PlatformTools, "appendFileSync")
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterEach(async () => {
        stub.resetHistory()
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
                    stub,
                    beforeQueryLogPath,
                    sinon.match(testQuery),
                )
                sinon.assert.calledWith(
                    stub,
                    afterQueryLogPath,
                    sinon.match(testQuery),
                )
            }),
        ))
})
