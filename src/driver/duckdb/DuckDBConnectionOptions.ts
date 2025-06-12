import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"

/**
 * DuckDB-specific connection options.
 */
export interface DuckDBConnectionOptions extends BaseDataSourceOptions {
    /**
     * Database type.
     */
    readonly type: "duckdb"

    /**
     * Storage type or path to the storage.
     */
    readonly database: string

    /**
     * The driver object
     * This defaults to require("@duckdb/node-api")
     */
    readonly driver?: any

    /**
     * Additional DuckDB configuration options.
     * @see https://duckdb.org/docs/configuration/overview.html
     */
    readonly config?: {
        /**
         * Maximum memory usage (in bytes). Default is 80% of available memory.
         */
        max_memory?: string

        /**
         * Number of threads to use for parallel query execution.
         */
        threads?: number

        /**
         * Enable or disable progress bar for long-running queries.
         */
        enable_progress_bar?: boolean

        /**
         * Default order for NULL values in ORDER BY clauses.
         */
        default_null_order?: "first" | "last"

        /**
         * Enable or disable object cache.
         */
        enable_object_cache?: boolean

        /**
         * Enable or disable HTTP file system.
         */
        enable_http_filesystem?: boolean

        /**
         * Additional configuration options as key-value pairs.
         */
        [key: string]: any
    }

    /**
     * Read-only mode. When enabled, the database cannot be modified.
     */
    readonly readOnly?: boolean

    /**
     * Enable WAL (Write-Ahead Log) mode for better concurrency.
     */
    readonly enableWAL?: boolean

    /**
     * Pool size is not applicable for DuckDB (single-process embedded database).
     */
    readonly poolSize?: never

    /**
     * Access mode for the database file.
     */
    readonly accessMode?: "automatic" | "read_only" | "read_write"
}
