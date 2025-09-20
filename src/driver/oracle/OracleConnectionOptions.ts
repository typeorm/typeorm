import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"
import { OracleConnectionCredentialsOptions } from "./OracleConnectionCredentialsOptions"

export interface OracleThickModeOptions {
    binaryDir?: string
    configDir?: string
    driverName?: string
    errorUrl?: string
    libDir?: string
}

/**
 * Oracle-specific connection options.
 */
export interface OracleConnectionOptions
    extends BaseDataSourceOptions,
        OracleConnectionCredentialsOptions {
    /**
     * Database type.
     */
    readonly type: "oracle"

    /**
     * Schema name. By default is "public".
     */
    readonly schema?: string

    /**
     * The driver object
     * This defaults to require("oracledb")
     */
    readonly driver?: any

    /**
     * Utilize the thick driver. Starting from oracledb version 6, it's necessary to set this to true when opting for the thick client usage.
     * Alternatively, an 'OracleThickModeOptions' object can be configured, which is used for the thick mode configuration by passing it to the 'node-oracledb' driver.
     * For additional information, refer to the details provided in the following link:
     * (https://node-oracledb.readthedocs.io/en/latest/api_manual/oracledb.html#oracledb.initOracleClient)
     */
    readonly thickMode?: boolean | OracleThickModeOptions

    /**
     * A boolean determining whether to pass time values in UTC or local time. (default: false).
     */
    readonly useUTC?: boolean

    /**
     * Replication setup.
     */
    readonly replication?: {
        /**
         * Master server used by orm to perform writes.
         */
        readonly master: OracleConnectionCredentialsOptions

        /**
         * List of read-from servers (slaves).
         */
        readonly slaves: OracleConnectionCredentialsOptions[]
    }
}
