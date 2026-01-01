import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"

/**
 * Sqlite-specific connection options.
 */
export interface CordovaConnectionOptions extends BaseDataSourceOptions {
    /**
     * Database type.
     */
    readonly type: "cordova"

    /**
     * Database name.
     */
    readonly database: string

    /**
     * The driver object
     * This defaults to `window.sqlitePlugin`
     */
    readonly driver?: any

    /**
     * Storage Location
     */
    readonly location: string

    readonly poolSize?: never

    /**
     * Sets the default transaction isolation level for new connections.
     * You can override this value on a per-transaction basis using `queryRunner.startTransaction(isolationLevel)`.
     */
    readonly isolationLevel?: "READ UNCOMMITTED" | "SERIALIZABLE"
}
