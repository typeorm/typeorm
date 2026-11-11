import sinon from "sinon"
import type { DataSource } from "../../../../src/data-source/DataSource"
import type { SpannerPostgresDriver } from "../../../../src/driver/spanner-postgres/SpannerPostgresDriver"

/**
 * Wraps `updateSchema` of the Spanner database, to count the schema updates
 * sent to Spanner and the statements each one carries.
 */
export const spyOnSchemaUpdates = (dataSource: DataSource) => {
    const database = (dataSource.driver as SpannerPostgresDriver)
        .instanceDatabase
    const spy = sinon.spy(database, "updateSchema")
    return {
        get calls(): number {
            return spy.callCount
        },
        get statements(): string[][] {
            return spy
                .getCalls()
                .map((call: sinon.SinonSpyCall) => [call.args[0]].flat())
        },
        restore: () => spy.restore(),
    }
}
