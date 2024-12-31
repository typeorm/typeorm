import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"

/**
 * Sqlite-specific connection options.
 */
export interface ExpoLegacyConnectionOptions extends BaseDataSourceOptions {
    /**
     * Database type.
     */
    readonly type: "expo-legacy"

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
