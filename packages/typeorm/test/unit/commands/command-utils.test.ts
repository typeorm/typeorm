import { expect } from "chai"
import sinon from "sinon"
import { CommandUtils } from "../../../src/commands/CommandUtils"
import type { DataSource } from "../../../src/data-source/DataSource"
import type { Logger } from "../../../src/logger/Logger"

/**
 * Builds the minimal part of a DataSource that CommandUtils.log reads,
 * so the tests do not need a database connection.
 */
function fakeDataSource(
    configuredLogger: DataSource["options"]["logger"],
    activeLogger: Partial<Logger>,
): DataSource {
    return {
        options: { logger: configuredLogger },
        logger: activeLogger,
    } as unknown as DataSource
}

describe("CommandUtils.log", () => {
    let consoleLog: sinon.SinonStub

    beforeEach(() => {
        consoleLog = sinon.stub(console, "log")
    })

    afterEach(() => {
        consoleLog.restore()
    })

    it("prints to the console when there is no DataSource", () => {
        CommandUtils.log(undefined, "plain", "formatted")

        expect(consoleLog.calledOnceWithExactly("formatted")).to.equal(true)
    })

    it("prints the plain message when no formatted message is given", () => {
        CommandUtils.log(undefined, "plain")

        expect(consoleLog.calledOnceWithExactly("plain")).to.equal(true)
    })

    it("prints to the console when no logger is configured", () => {
        const log = sinon.spy()
        const dataSource = fakeDataSource(undefined, { log })

        CommandUtils.log(dataSource, "plain", "formatted")

        expect(consoleLog.calledOnceWithExactly("formatted")).to.equal(true)
        expect(log.called).to.equal(false)
    })

    it("prints to the console when a built-in logger is configured", () => {
        const log = sinon.spy()
        const dataSource = fakeDataSource("advanced-console", { log })

        CommandUtils.log(dataSource, "plain", "formatted")

        expect(consoleLog.calledOnceWithExactly("formatted")).to.equal(true)
        expect(log.called).to.equal(false)
    })

    it("sends the plain message to a custom logger instance", () => {
        const log = sinon.spy()
        const customLogger = { log } as unknown as Logger
        const dataSource = fakeDataSource(customLogger, customLogger)

        CommandUtils.log(dataSource, "plain", "formatted")

        expect(log.calledOnceWithExactly("info", "plain")).to.equal(true)
        expect(consoleLog.called).to.equal(false)
    })
})
