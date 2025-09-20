import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"

/**
 * Sqlite-specific connection options.
 */
export interface CapacitorConnectionOptions extends BaseDataSourceOptions {
    /**
     * Database type.
     */
    readonly type: "capacitor"

    /**
     * The capacitor-sqlite instance. For example, `new SQLiteConnection(CapacitorSQLite)`.
     */
    readonly driver: any

    /**
     * Database name (capacitor-sqlite will add the suffix `SQLite.db`)
     */
    readonly database: string

    /**
     * Set the mode for database encryption
     */
    readonly mode?: "no-encryption" | "encryption" | "secret" | "newsecret"

    /**
     * Database version
     */
    readonly version?: number

    /**
     * The SQLite journal mode (optional)
     */
    readonly journalMode?:
        | "DELETE"
        | "TRUNCATE"
        | "PERSIST"
        | "MEMORY"
        | "WAL"
        | "OFF"

    readonly poolSize?: never
}
