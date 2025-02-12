import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"
import { SapConnectionCredentialsOptions } from "./SapConnectionCredentialsOptions"

/**
 * SAP Hana specific connection options.
 */
export interface SapConnectionOptions
    extends BaseDataSourceOptions,
        SapConnectionCredentialsOptions {
    /**
     * Database type.
     */
    readonly type: "sap"

    /**
     * Database schema.
     */
    readonly schema?: string

    /**
     * Aborts communication attempts to the server
     * after the specified timeout.
     */
    readonly communicationTimeout?: number

    /**
     * Sap Pool Options
     */
    readonly pooling?: boolean

    readonly maxPoolSize?: number

    readonly poolingCheck?: boolean

    readonly connectionLifetime?: number

    readonly poolKey?: string
}
