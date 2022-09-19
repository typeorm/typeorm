import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"

/**
 * Sqlite-specific connection options.
 */
export interface ExpoConnectionOptions extends BaseDataSourceOptions {
    /**
     * Database type.
     */
    readonly type: "expo"

    /**
     * Database name.
     */
    readonly database: string

    /**
     * Driver module
     */
    readonly driver: any

    readonly poolSize?: never
}
