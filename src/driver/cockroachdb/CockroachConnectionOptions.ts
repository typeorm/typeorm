import { IsolationLevel } from "../.."
import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"
import { ReplicationMode } from "../types/ReplicationMode"
import { CockroachConnectionCredentialsOptions } from "./CockroachConnectionCredentialsOptions"

/**
 * Cockroachdb-specific connection options.
 */
export interface CockroachConnectionOptions
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
         * Master server used by orm to perform writes.
         */
        readonly master: CockroachConnectionCredentialsOptions

        /**
         * List of read-from servers (slaves).
         */
        readonly slaves: CockroachConnectionCredentialsOptions[]

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

    /**
     * Default transaction isolation level for all transactions in the current session.
     * CockroachDB only supports SERIALIZABLE (default), READ COMMITTED, and REPEATABLE READ.
     *
     * **Note: Isolation level upgrades:**
     * - **REPEATABLE READ**: Requires `sql.txn.repeatable_read_isolation.enabled=true` (defaults to `false`).
     * Otherwise, it will be automatically interpreted as `SERIALIZABLE`.
     * - **READ COMMITTED**: Requires `sql.txn.read_committed_isolation.enabled=true` (defaults to `true`).
     * Otherwise, it will be automatically interpreted as `SERIALIZABLE`.
     *
     * @see {@link https://www.cockroachlabs.com/docs/releases/v24.3.html#v24-3-0-settings-added|Release Notes v24.3}
     * @see {@link https://www.cockroachlabs.com/docs/stable/transactions.html#transaction-isolation-levels|CockroachDB Isolation Levels}
     * @see {@link https://www.cockroachlabs.com/docs/stable/read-committed#enable-read-committed-isolation|Enabling Read Committed}
     */
    readonly isolationLevel?: IsolationLevel
}
