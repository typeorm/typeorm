import type { SpannerDataSourceOptions } from "../spanner/SpannerDataSourceOptions"

/**
 * Spanner connection options for databases using the PostgreSQL dialect.
 *
 * Connection settings (project, instance, database, credentials, ...) are
 * shared with the GoogleSQL "spanner" driver.
 */
export interface SpannerPostgresDataSourceOptions extends Omit<
    SpannerDataSourceOptions,
    "type" | "schema" | "supportBigNumbers" | "bigNumberStrings"
> {
    /**
     * Database type.
     */
    readonly type: "spanner-postgres"

    /**
     * Schema name. Defaults to the "public" schema of the database.
     */
    readonly schema?: string

    /**
     * Spanner stores every integer as a 64-bit value (`bigint`), which does not
     * always fit in a JavaScript number. As in the Postgres driver, `bigint`
     * (`int8`) columns are hydrated as strings by default.
     *
     * Enabling parseInt8 hydrates them as numbers instead. Note: the maximum
     * safe integer in JavaScript is `Number.MAX_SAFE_INTEGER` (`2^53 - 1`), larger
     * values lose precision.
     *
     * Columns of type `int`, `integer`, or without a type on a `number`
     * property, are always hydrated as numbers.
     */
    readonly parseInt8?: boolean
}
