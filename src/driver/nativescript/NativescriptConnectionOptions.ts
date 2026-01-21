import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"

/**
 * NativeScript-specific connection options.
 */
export interface NativescriptConnectionOptions extends BaseDataSourceOptions {
    /**
     * Database type.
     */
    readonly type: "nativescript"

    /**
     * Database name.
     */
    readonly database: string

    /**
     * The driver object
     * you should pass `require('nativescript-sqlite') here
     */
    readonly driver: any

    /**
     * Whether to mark the mark the database as read only on open (iOS only).
     */
    readonly readOnly?: boolean

    /**
     * The key to use for for using/opening encrypted databases. (requires the "Encrypted Plugin")
     */
    readonly key?: string

    /**
     * Whether to enable background multitasking. All SQL is ran on a background worker thread. (requires the "Commercial Plugin")
     */
    readonly multithreading?: boolean

    /**
     * Migrates a Encrypted Sql database from v3 to the new v4. If you are a new user you do not need to set this flag as new created databases will already be in v4.
     * If you are upgrading a app that used v1.3.0 or earlier of NS-Sqlite-Encrypted; then you will probably want to set this flag to true. (requires the "Encrypted Plugin")
     */
    readonly migrate?: boolean

    /**
     * Flags to pass to SQLite when opening the database on iOS. (see https://www.sqlite.org/c3ref/open.html)
     */
    readonly iosFlags?: number

    /**
     * Flags to pass to SQLite when opening the database on Android. (see https://developer.android.com/reference/android/database/sqlite/SQLiteDatabase.html)
     */
    readonly androidFlags?: number

    readonly poolSize?: never

    /**
     * Default transaction isolation level for all transactions in the current session.
     *
     * @see {@link https://www.sqlite.org/isolation.html}
     */
    readonly isolationLevel?: "READ UNCOMMITTED" | "SERIALIZABLE"
}
