import {BaseConnectionOptions} from "../../connection/BaseConnectionOptions";

/**
 * Sqlite-specific connection options.
 */
export interface SqliteConnectionOptions extends BaseConnectionOptions {

    /**
     * Database type.
     */
    readonly type: "sqlite";

    /**
     * Storage type or path to the storage.
     */
    readonly database: string;

    /**
     * Encryption key for for SQLCipher.
     */
    readonly key?: string;

    /**
     * In your SQLite application when you perform parallel writes its common to face SQLITE_BUSY error.
     * This error indicates that SQLite failed to write to the database file since someone else already writes into it.
     * Since SQLite cannot handle parallel saves this error cannot be avoided.
     *
     * To simplify life's of those who have this error this particular option sets a timeout within which ORM will try
     * to perform requested write operation again and again until it recieves SQLITE_BUSY error.
     *
     * Time in milliseconds.
     */
    readonly busyErrorRetry?: number;
}
