import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"

/**
 * LibSQL-specific connection options.
 */
export interface LibsqlConnectionOptions extends BaseDataSourceOptions {
    /**
     * Database type.
     */
    readonly type: "libsql"

    /**
     * Database URL for remote connections or file path for local connections.
     * Examples:
     * - "file:local.db" for local file
     * - "http://localhost:8080" for remote server
     * - "https://[database].[region].turso.io" for Turso
     */
    readonly url: string

    /**
     * Database name (optional, can be derived from URL).
     * For local files, this is the file path.
     * For remote connections, this is the database name.
     */
    readonly database?: string

    /**
     * Authentication token for remote connections.
     * Required for remote connections to Turso and other libSQL servers.
     */
    readonly authToken?: string

    /**
     * The driver object.
     * This defaults to require("@libsql/client")
     */
    readonly driver?: any

    /**
     * Encryption key for SQLCipher.
     */
    readonly key?: string

    /**
     * Function to run before a database is used in typeorm.
     * You can set pragmas, register plugins or register
     * functions or aggregates in this function.
     */
    readonly prepareDatabase?: (db: any) => void | Promise<void>

    /**
     * Enable WAL mode for local databases.
     * Default: false
     */
    readonly enableWAL?: boolean

    /**
     * Sync URL for embedded replicas.
     * When provided, creates an embedded replica that syncs with the remote database.
     */
    readonly syncUrl?: string

    /**
     * Sync period in seconds for embedded replicas.
     * Default: 60
     */
    readonly syncPeriod?: number

    /**
     * Read your writes consistency for embedded replicas.
     * Default: false
     */
    readonly readYourWrites?: boolean

    readonly poolSize?: never
}
