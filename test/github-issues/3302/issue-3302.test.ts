import "reflect-metadata"
import appRootPath from "app-root-path"
import sinon from "sinon"
import { DataSource } from "../../../src"
import {
    createTestingConnections,
    reloadTestingDatabases,
    closeTestingConnections,
} from "../../utils/test-utils"
import { PlatformTools } from "../../../src/platform/PlatformTools"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"

describe("github issues > #3302 Tracking query time for slow queries and statsd timers", () => {
    let connections: DataSource[]
    let stub: sinon.SinonStub
    let sandbox: sinon.SinonSandbox
    const beforeQueryLogPath = appRootPath + "/before-query.log"
    const afterQueryLogPath = appRootPath + "/after-query.log"

    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
        })
    })
    beforeEach(async () => {
        sandbox = sinon.createSandbox()
        stub = sandbox.stub(PlatformTools, "appendFileSync")
        await reloadTestingDatabases(connections)
    })
    afterEach(async () => {
        stub?.resetHistory()
        sandbox.restore()
        await closeTestingConnections(connections)
    })

    it("if query executed, should write query to file", async () =>
        Promise.all(
            connections.map(async (connection) => {
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
