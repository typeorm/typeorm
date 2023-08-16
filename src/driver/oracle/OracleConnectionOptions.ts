import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"
import { OracleConnectionCredentialsOptions } from "./OracleConnectionCredentialsOptions"

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
     * Another option is to configure the libDir to the Oracle Instant Client. For additional information, refer to the details provided in the following link:
     * (https://node-oracledb.readthedocs.io/en/latest/api_manual/oracledb.html#oracledb.initOracleClient)
     */
    readonly thickDriver?: boolean | string

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
         * List of read-from severs (slaves).
         */
        readonly slaves: OracleConnectionCredentialsOptions[]
    }
}
