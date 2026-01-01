import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"

/**
 * Sql.js-specific connection options.
 */
export interface SqljsConnectionOptions extends BaseDataSourceOptions {
    /**
     * Database type.
     */
    readonly type: "sqljs"

    /**
     * A Uint8Array that gets imported when the connection is opened.
     */
    readonly database?: Uint8Array

    /**
     * The driver object
     * This defaults to require("sql.js")
     */
    readonly driver?: any

    /**
     * Config that's used to initialize sql.js.
     */
    readonly sqlJsConfig?: any

    /**
     * Enables the autoSave mechanism which either saves to location
     * or calls autoSaveCallback every time a change to the database is made.
     */
    readonly autoSave?: boolean

    /**
     * A function that gets called on every change instead of the internal autoSave function.
     * autoSave has to be enabled for this to work.
     */
    readonly autoSaveCallback?: Function

    /**
     * File path (Node.js) or local storage key (browser) to load and save database from.
     * If this is specified without autoSave, the database is loaded from the location
     * and can be saved manually via the SqljsEntityManager. If autoSave is enabled,
     * location is used to automatically save the database.
     */
    readonly location?: string

    /**
     * Enables the usage of the localforage library to save & load the database asynchronously from the
     * indexedDB instead of using the synchron local storage methods in a browser environment.
     */
    readonly useLocalForage?: boolean

    readonly poolSize?: never

    /**
     * Sets the default transaction isolation level for new connections.
     * You can override this value on a per-transaction basis using `queryRunner.startTransaction(isolationLevel)`.
     */
    readonly isolationLevel?: "READ UNCOMMITTED" | "SERIALIZABLE"
}
