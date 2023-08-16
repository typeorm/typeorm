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
     * This specifies the directory containing the Oracle Client libraries.
     * If libDir is not specified, the default library search mechanism is used.
     * For additional information, refer to the details provided in the following link:
     * (https://node-oracledb.readthedocs.io/en/latest/api_manual/oracledb.html#oracledb.initOracleClient)
     */
    readonly thickDriverLibDir?: string

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
