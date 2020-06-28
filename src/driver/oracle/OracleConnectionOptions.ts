import {BaseConnectionOptions} from "../../connection/BaseConnectionOptions";
import {OracleConnectionCredentialsOptions} from "./OracleConnectionCredentialsOptions";

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
         * Primary server used by orm to perform writes.
         *
         * @deprecated
         * @see primary
         */
        readonly master: OracleConnectionCredentialsOptions;

        /**
         * List of read-from severs (replicas).
         *
         * @deprecated
         * @see replicas
         */
        readonly slaves: OracleConnectionCredentialsOptions[];

    }|{

        /**
         * Primary server used by orm to perform writes.
         */
        readonly primary: OracleConnectionCredentialsOptions;

        /**
         * List of read-from severs (replicas).
         */
        readonly replicas: OracleConnectionCredentialsOptions[];

    };

}
