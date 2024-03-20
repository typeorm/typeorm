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
     * By default, implicit connection pooling is disabled.
     */
    readonly pooling?: boolean

    /**
     * The maximum pool size for a specific connection string or option.
     * By default value is 0, meaning that there is no limit.
     * DO NOT use this if pooling=false
     */
    readonly maxPoolSize?: number

    /**
     * If set to true, the Node.js driver specifies that connections
     * in the connection pool should be tested for viability before being reused.
     * DO NOT use this if pooling=false
     */
    readonly poolingCheck?: boolean

    /**
     * Specifies the maximum time, in seconds,
     * that the connection is cached in the implicit connection pool.
     * A value of 0 causes implicit pooled connections to be cached permanently.
     * DO NOT use this if pooling=false
     */
    readonly connectionLifetime?: number

    /**
     * Sub-pool name.
     */
    readonly poolKey?: string

    /**
     * Aborts communication attempts to the server
     * after the specified timeout.
     */
    readonly communicationTimeout?: number
}
