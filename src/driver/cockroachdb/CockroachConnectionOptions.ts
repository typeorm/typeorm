import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"
import { IsolationLevel } from "../types/IsolationLevel"
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
     * Default transaction isolation level for all transactions started on this connection.
     * CockroachDB only supports SERIALIZABLE (default) and READ COMMITTED isolation levels.
     *
     * Note: Isolation level upgrades:
     * - READ UNCOMMITTED is upgraded to READ COMMITTED (if enabled) or SERIALIZABLE (if disabled)
     * - REPEATABLE READ is upgraded to SERIALIZABLE
     * - READ COMMITTED requires sql.txn.read_committed_isolation.enabled=true
     *
     * You can override this value on a per-transaction basis using queryRunner.startTransaction(isolationLevel).
     */
    readonly isolationLevel?: IsolationLevel
}
