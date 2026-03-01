import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"
import { ReplicationMode } from "../types/ReplicationMode"
import { CockroachConnectionCredentialsOptions } from "./CockroachConnectionCredentialsOptions"

/**
 * Cockroachdb-specific connection options.
 */
export interface CockroachDataSourceOptions
    extends BaseDataSourceOptions, CockroachConnectionCredentialsOptions {
    /**
     * Database type.
     */
    readonly type: "cockroachdb"

    /**
     * Enable time travel queries on cockroachdb.
     * https://www.cockroachlabs.com/docs/stable/as-of-system-time.html
     */
    readonly timeTravelQueries: boolean

    /**
     * Schema name.
     */
    readonly schema?: string

    /**
     * The driver object
     * This defaults to `require("pg")`.
     */
    readonly driver?: any

    /**
     * The driver object
     * This defaults to `require("pg-native")`.
     */
    readonly nativeDriver?: any

    /**
     * Replication setup.
     */
    readonly replication?: {
        /**
         * Primary server used by orm to perform writes.
         */
        readonly primary?: CockroachConnectionCredentialsOptions

        /**
         * List of read-from servers (replicas).
         */
        readonly replicas?: CockroachConnectionCredentialsOptions[]

        /**
         * Master server used by orm to perform writes.
         * @deprecated Use `primary` instead. Will be removed in a future major version.
         */
        readonly master?: CockroachConnectionCredentialsOptions

        /**
         * List of read-from servers (slaves).
         * @deprecated Use `replicas` instead. Will be removed in a future major version.
         */
        readonly slaves?: CockroachConnectionCredentialsOptions[]

        /**
         * Default connection pool to use for SELECT queries
         * @default "slave"
         */
        readonly defaultMode?: ReplicationMode
    }

    /**
     * sets the application_name var to help db administrators identify
     * the service using this connection. Defaults to 'undefined'
     */
    readonly applicationName?: string

    /**
     * Function handling errors thrown by drivers pool.
     * Defaults to logging error with `warn` level.
     */
    readonly poolErrorHandler?: (err: any) => any

    /**
     * Max number of transaction retries in case of 40001 error.
     */
    readonly maxTransactionRetries?: number
}
