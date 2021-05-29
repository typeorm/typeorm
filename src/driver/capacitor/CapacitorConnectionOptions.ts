import { BaseConnectionOptions } from "../../connection/BaseConnectionOptions";

/**
 * Sqlite-specific connection options.
 */
export interface CapacitorConnectionOptions extends BaseConnectionOptions {
    /**
     * Database type.
     */
    readonly type: "capacitor";

    /**
     * Database name (capacitor-sqlite will add the suffix `SQLite.db`)
     */
    readonly database: string;

    /**
     * The capacitor-sqlite instance. For example, `new SQLiteConnection(CapacitorSQLite)`.
     */
    readonly driver: any;
}
