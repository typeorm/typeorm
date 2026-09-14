import { expect } from "chai"
import { AbstractLogger } from "../../../src/logger/AbstractLogger"
import type { LogLevel, LogMessage } from "../../../src/logger/Logger"

/**
 * Captures what `writeLog` was handed, so the values a concrete logger would
 * render can be asserted without a database connection.
 */
class CapturingLogger extends AbstractLogger {
    readonly written: { level: LogLevel; messages: LogMessage[] }[] = []

    protected writeLog(
        level: LogLevel,
        message:
            LogMessage | string | number | (LogMessage | string | number)[],
    ): void {
        this.written.push({
            level,
            messages: this.prepareLogMessages(message, {
                highlightSql: false,
            }),
        })
    }
}

describe("AbstractLogger", () => {
    describe("logQuerySlow", () => {
        it("rounds the execution time to whole milliseconds", () => {
            const logger = new CapturingLogger("all")

            logger.logQuerySlow(1234.5678901, "SELECT 1")

            const [{ messages }] = logger.written
            expect(messages[0].additionalInfo?.time).to.equal(1235)
            expect(messages[1].message).to.equal(1235)
        })

        it("keeps the logged time an integer, as it was before performance.now()", () => {
            const logger = new CapturingLogger("all")

            for (const time of [0.4, 0.5, 99.99, 100]) {
                logger.logQuerySlow(time, "SELECT 1")
            }

            expect(logger.written).to.have.lengthOf(4)
            for (const { messages } of logger.written) {
                expect(messages[0].additionalInfo?.time).to.satisfy(
                    Number.isInteger,
                )
                expect(messages[1].message).to.satisfy(Number.isInteger)
            }
        })
    })
})
