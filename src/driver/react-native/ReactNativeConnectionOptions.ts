import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"

/**
 * Sqlite-specific connection options.
 */
export interface ReactNativeConnectionOptions extends BaseDataSourceOptions {
    /**
     * Database type.
     */
    readonly type: "react-native"

    /**
     * Database name.
     */
    readonly database: string

    /**
     * The driver object
     * This defaults to require("react-native-sqlite-storage")
     */
    readonly driver?: any

    /**
     * Storage Location
     */
    readonly location: string

    readonly poolSize?: never
    /**
     * Encryption key for encryption supported databases
     */
    readonly encryptionKey?: string
}
