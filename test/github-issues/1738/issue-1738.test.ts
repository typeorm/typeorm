import sinon from "sinon"
import { PlatformTools } from "../../../src/platform/PlatformTools"
import { FormattedConsoleLogger } from "../../../src"
import { FORMAT_SQL_TEST_CASES } from "./queries"

describe("github issues > #1738 Add FormattedConsoleLogger", () => {
    let logger: FormattedConsoleLogger
    let logInfoStub: sinon.SinonStub
    let highlightStub: sinon.SinonStub

    beforeEach(() => {
        logInfoStub = sinon.stub(PlatformTools, "logInfo")
        highlightStub = sinon.stub(PlatformTools, "highlightSql")
        highlightStub.callsFake((sql: string) => sql)
        logger = new FormattedConsoleLogger("all")
    })

    afterEach(() => {
        logInfoStub.restore()
        highlightStub.restore()
    })
    FORMAT_SQL_TEST_CASES.forEach((testCase) => {
        it(`formats sql query: ${testCase.unformatted}`, () => {
            logger.logQuery(testCase.unformatted)
            sinon.assert.calledWith(logInfoStub, "query:", testCase.formatted)
        })
    })
})
