import type postgres from "postgres"

import type { PostgresDataSourceOptions } from "./PostgresDataSourceOptions"

/**
 * Postgres.js-specific connection options.
 */
export type PostgresJsDataSourceOptions = Omit<
    PostgresDataSourceOptions,
    "type" | "driver" | "nativeDriver" | "poolErrorHandler"
> & {
    /**
     * Database client type.
     */
    readonly type: "postgres-js"

    /**
     * Postgres.js factory. Defaults to `require("postgres")`.
     */
    readonly driver?: typeof postgres
}
