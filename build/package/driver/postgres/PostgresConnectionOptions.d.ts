import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions";
import { PostgresConnectionCredentialsOptions } from "./PostgresConnectionCredentialsOptions";
/**
 * Postgres-specific connection options.
 */
export interface PostgresConnectionOptions extends BaseDataSourceOptions, PostgresConnectionCredentialsOptions {
    /**
     * Database type.
     */
    readonly type: "postgres";
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
        readonly master: PostgresConnectionCredentialsOptions;
        /**
         * List of read-from severs (slaves).
         */
        readonly slaves: PostgresConnectionCredentialsOptions[];
    };
    /**
     * The milliseconds before a timeout occurs during the initial connection to the postgres
     * server. If undefined, or set to 0, there is no timeout. Defaults to undefined.
     */
    readonly connectTimeoutMS?: number;
    /**
     * The Postgres extension to use to generate UUID columns. Defaults to uuid-ossp.
     * If pgcrypto is selected, TypeORM will use the gen_random_uuid() function from this extension.
     * If uuid-ossp is selected, TypeORM will use the uuid_generate_v4() function from this extension.
     */
    readonly uuidExtension?: "pgcrypto" | "uuid-ossp";
    readonly poolErrorHandler?: (err: any) => any;
    /**
     * Include notification messages from Postgres server in client logs
     */
    readonly logNotifications?: boolean;
    /**
     * Automatically install postgres extensions
     */
    readonly installExtensions?: boolean;
    /**
     * sets the application_name var to help db administrators identify
     * the service using this connection. Defaults to 'undefined'
     */
    readonly applicationName?: string;
}
