import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions";
import { OracleConnectionCredentialsOptions } from "./OracleConnectionCredentialsOptions";
/**
 * Oracle-specific connection options.
 */
export interface OracleConnectionOptions extends BaseDataSourceOptions, OracleConnectionCredentialsOptions {
    /**
     * Database type.
     */
    readonly type: "oracle";
    /**
     * Schema name. By default is "public".
     */
    readonly schema?: string;
    /**
     * The driver object
     * This defaults to require("oracledb")
     */
    readonly driver?: any;
    /**
     * A boolean determining whether to pass time values in UTC or local time. (default: true).
     */
    readonly useUTC?: boolean;
    /**
     * Replication setup.
     */
    readonly replication?: {
        /**
         * Master server used by orm to perform writes.
         */
        readonly master: OracleConnectionCredentialsOptions;
        /**
         * List of read-from severs (slaves).
         */
        readonly slaves: OracleConnectionCredentialsOptions[];
    };
}
