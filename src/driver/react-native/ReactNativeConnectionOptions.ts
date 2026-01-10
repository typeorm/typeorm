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
     * Sets the default transaction isolation level for new connections.
     * You can override this value on a per-transaction basis using `queryRunner.startTransaction(isolationLevel)`.
     */
    readonly isolationLevel?: "READ UNCOMMITTED" | "SERIALIZABLE"
}
