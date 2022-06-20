import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions";
import { CockroachConnectionCredentialsOptions } from "./CockroachConnectionCredentialsOptions";
/**
 * Cockroachdb-specific connection options.
 */
export interface CockroachConnectionOptions extends BaseDataSourceOptions, CockroachConnectionCredentialsOptions {
    /**
     * Database type.
     */
    readonly type: "cockroachdb";
    /**
     * Schema name.
     */
    readonly schema?: string;
    /**
     * The driver object
     * This defaults to `require("pg")`.
     */
    readonly driver?: any;
    /**
     * The driver object
     * This defaults to `require("pg-native")`.
     */
    readonly nativeDriver?: any;
    /**
     * Replication setup.
     */
    readonly replication?: {
        /**
         * Master server used by orm to perform writes.
         */
        readonly master: CockroachConnectionCredentialsOptions;
        /**
         * List of read-from severs (slaves).
         */
        readonly slaves: CockroachConnectionCredentialsOptions[];
    };
    /**
     * sets the application_name var to help db administrators identify
     * the service using this connection. Defaults to 'undefined'
     */
    readonly applicationName?: string;
    readonly poolErrorHandler?: (err: any) => any;
}
