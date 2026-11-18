import { expect } from "chai"
import sinon from "sinon"
import { CommandUtils } from "../../../src/commands/CommandUtils"
import type { DataSource } from "../../../src/data-source/DataSource"
import type { Logger } from "../../../src/logger/Logger"
import { SimpleConsoleLogger } from "../../../src/logger/SimpleConsoleLogger"

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

    it("sends the plain message to a configured built-in logger", () => {
        const log = sinon.spy()
        const dataSource = fakeDataSource("file", { log })

        CommandUtils.log(dataSource, "plain", "formatted")

        expect(log.calledOnceWithExactly("info", "plain")).to.equal(true)
        expect(consoleLog.called).to.equal(false)
    })

    it("sends the plain message to a custom logger instance", () => {
        const log = sinon.spy()
        const customLogger = { log } as unknown as Logger
        const dataSource = fakeDataSource(customLogger, customLogger)

        CommandUtils.log(dataSource, "plain", "formatted")

        expect(log.calledOnceWithExactly("info", "plain")).to.equal(true)
        expect(consoleLog.called).to.equal(false)
    })

    it("lets a built-in logger with the commands' logging override write it", () => {
        const written: unknown[] = []
        // Same override the schema and cache commands apply before logging.
        const logger = new SimpleConsoleLogger(["query", "schema", "info"])
        const dataSource = fakeDataSource("simple-console", logger)
        consoleLog.callsFake((...args: unknown[]) => written.push(args))
        const consoleInfo = sinon
            .stub(console, "info")
            .callsFake((...args: unknown[]) => written.push(args))

        try {
            CommandUtils.log(dataSource, "Cache was successfully cleared")
        } finally {
            consoleInfo.restore()
        }

        expect(JSON.stringify(written)).to.contain(
            "Cache was successfully cleared",
        )
    })
})
