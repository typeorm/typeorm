import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"
import { ReplicationMode } from "../types/ReplicationMode"
import { PostgresConnectionCredentialsOptions } from "../postgres/PostgresConnectionCredentialsOptions"

/**
 * Postgres.js-specific connection options.
 * @see https://github.com/porsager/postgres
 */
export interface PostgresJSConnectionOptions
    extends BaseDataSourceOptions, PostgresConnectionCredentialsOptions {
    /**
     * Database type.
     */
    readonly type: "postgres-js"

    /**
     * Schema name.
     */
    readonly schema?: string

    /**
     * The postgres.js module object.
     * This defaults to `require("postgres")`.
     * Used for testing or when the package is pre-bundled.
     */
    readonly driver?: any

    /**
     * A boolean determining whether to pass time values in UTC or local time.
     * Defaults to false.
     */
    readonly useUTC?: boolean

    /**
     * Replication setup.
     */
    readonly replication?: {
        readonly master: PostgresConnectionCredentialsOptions
        readonly slaves: PostgresConnectionCredentialsOptions[]
        readonly defaultMode?: ReplicationMode
    }

    /**
     * The milliseconds before a timeout occurs during the initial connection.
     */
    readonly connectTimeoutMS?: number

    /**
     * UUID extension to use.
     */
    readonly uuidExtension?: "pgcrypto" | "uuid-ossp"

    /**
     * Function handling errors raised by the driver.
     */
    readonly poolErrorHandler?: (err: any) => any

    /**
     * Include notification messages from Postgres server in client logs.
     * Includes NOTICE messages via postgres.js onnotice config.
     * NOTIFY/LISTEN must be handled manually via sql.listen().
     */
    readonly logNotifications?: boolean

    /**
     * Automatically install postgres extensions.
     * Defaults to true.
     */
    readonly installExtensions?: boolean

    /**
     * Parse int8 (bigint) columns as JavaScript numbers.
     * Maps to postgres.js bigint type transform.
     */
    readonly parseInt8?: boolean

    /**
     * List of additional Postgres extensions to install.
     */
    readonly extensions?: string[]

    /**
     * Extra options passed directly to the postgres() constructor.
     * These override any options derived from TypeORM fields.
     * @see https://github.com/porsager/postgres#connection
     */
    readonly postgresJSOptions?: Record<string, any>
}
