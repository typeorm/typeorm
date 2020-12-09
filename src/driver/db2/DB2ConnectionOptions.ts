import { BaseConnectionOptions } from "../../connection/BaseConnectionOptions";
import { DB2ConnectionCredentialsOptions } from "./DB2ConnectionCredentialsOptions";

/**
 * DB2-specific connection options.
 */
export interface DB2ConnectionOptions
    extends BaseConnectionOptions,
        DB2ConnectionCredentialsOptions {
    /**
     * Database type.
     */
    readonly type: "db2";

    /**
     * Schema name. By default is "public".
     */
    readonly schema: string;

    /**
     * Replication setup.
     */
    readonly replication?: {
        /**
         * Master server used by orm to perform writes.
         */
        readonly master: DB2ConnectionCredentialsOptions;

        /**
         * List of read-from severs (slaves).
         */
        readonly slaves: DB2ConnectionCredentialsOptions[];
    };
}
