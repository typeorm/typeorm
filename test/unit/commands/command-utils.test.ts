import { expect } from "chai"
import * as sinon from "sinon"
import type { DataSource } from "../../../src/data-source/DataSource"
import type { Logger } from "../../../src/logger/Logger"
import { CommandUtils } from "../../../src/commands/CommandUtils"

describe("CommandUtils", () => {
    let sandbox: sinon.SinonSandbox

    beforeEach(() => {
        sandbox = sinon.createSandbox()
    })

    afterEach(() => {
        sandbox.restore()
    })

    it("returns false when no logger is configured", () => {
        const dataSource = {
            options: {},
        } as Pick<DataSource, "options">

        expect(
            CommandUtils.logDataSourceMessage(
                dataSource,
                "message",
                "schema-build",
            ),
        ).to.be.false
    })

    it("uses a custom logger instance when configured", () => {
        const logger = {
            logQuery: sandbox.stub(),
            logQueryError: sandbox.stub(),
            logQuerySlow: sandbox.stub(),
            logSchemaBuild: sandbox.stub(),
            logMigration: sandbox.stub(),
            log: sandbox.stub(),
        } as unknown as Logger
        const dataSource = {
            options: {
                logger,
            },
        } as Pick<DataSource, "options">

        expect(
            CommandUtils.logDataSourceMessage(
                dataSource,
                "migration message",
                "migration",
            ),
        ).to.be.true
        expect(
            (logger.logMigration as sinon.SinonStub).calledOnceWithExactly(
                "migration message",
            ),
        ).to.be.true
    })

    it("uses configured built-in loggers instead of falling back to console", () => {
        const consoleLogStub = sandbox.stub(console, "log")
        const dataSource = {
            options: {
                logger: "simple-console",
            },
        } as Pick<DataSource, "options">

        expect(
            CommandUtils.logDataSourceMessage(
                dataSource,
                "schema message",
                "schema-build",
            ),
        ).to.be.true
        expect(consoleLogStub.calledOnceWithExactly("schema message")).to.be
            .true
    })
})
