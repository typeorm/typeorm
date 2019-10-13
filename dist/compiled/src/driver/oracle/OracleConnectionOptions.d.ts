import { BaseConnectionOptions } from "../../connection/BaseConnectionOptions";
import { OracleConnectionCredentialsOptions } from "./OracleConnectionCredentialsOptions";
/**
 * Oracle-specific connection options.
 */
export interface OracleConnectionOptions extends BaseConnectionOptions, OracleConnectionCredentialsOptions {
    /**
     * Database type.
     */
    readonly type: "oracle";
    /**
     * Schema name. By default is "public".
     */
    readonly schema?: string;
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
