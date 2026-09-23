import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import type { Logger } from "../../../../src/logger/Logger"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import { QueryExecutionTimeSubscriber } from "./subscribers/QueryExecutionTimeSubscriber"

/**
 * sql.js runs the statement while `step()` is iterated, not while it is
 * prepared. A query whose work lives entirely in that loop therefore separates
 * preparation time from execution time.
 */
const slowQuery = `WITH RECURSIVE counter(x) AS (
    SELECT 1 UNION ALL SELECT x + 1 FROM counter WHERE x < 500000
) SELECT count(*) AS total FROM counter`

class RecordingLogger implements Logger {
    readonly slowQueries: { time: number; query: string }[] = []

    logQuery(): void {}
    logQueryError(): void {}
    logSchemaBuild(): void {}
    logMigration(): void {}
    log(): void {}

    logQuerySlow(time: number, query: string): void {
        this.slowQueries.push({ time, query })
    }
}

describe("sqljs driver > query execution time", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [],
            enabledDrivers: ["sqljs"],
            subscribers: [QueryExecutionTimeSubscriber],
            // above the few milliseconds prepare() takes on its own
            driverSpecific: { maxQueryExecutionTime: 50 },
            createLogger: () => new RecordingLogger(),
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should measure the time spent executing the query, not just preparing it", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const subscriber = dataSource
                    .subscribers[0] as QueryExecutionTimeSubscriber
                const logger = dataSource.options.logger as RecordingLogger
                subscriber.clear()
                logger.slowQueries.length = 0

                const startedAt = Date.now()
                await dataSource.query(slowQuery)
                const elapsed = Date.now() - startedAt

                const executionTimes = subscriber.getExecutionTimes()
                expect(executionTimes).to.have.lengthOf(1)

                // Comparing against the caller's own measurement keeps this
                // independent of how fast the machine is. Timing the statement
                // before it runs reports the preparation only, which is a small
                // fraction of the elapsed time.
                //
                // The caller's window is the wider one: it also covers the
                // BeforeQuery broadcast that precedes queryStartTime and the
                // subscriber settling that follows queryEndTime. The bound is
                // left loose so that time spent outside the measured section
                // cannot fail a correct measurement.
                expect(executionTimes[0]).to.be.at.least(elapsed / 3)

                // the same measurement decides whether the query is slow
                expect(logger.slowQueries).to.have.lengthOf(1)
                expect(logger.slowQueries[0].query).to.equal(slowQuery)
                expect(logger.slowQueries[0].time).to.equal(executionTimes[0])
            }),
        ))
})
