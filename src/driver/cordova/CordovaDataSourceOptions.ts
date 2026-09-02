import type { AbstractSqliteDataSourceOptions } from "../sqlite-abstract/AbstractSqliteDataSourceOptions"

/**
 * Sqlite-specific connection options.
 */
export interface CordovaDataSourceOptions extends AbstractSqliteDataSourceOptions {
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
}
