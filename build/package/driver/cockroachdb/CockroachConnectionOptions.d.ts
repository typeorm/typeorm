import { BaseConnectionOptions } from "../../connection/BaseConnectionOptions";
import { CockroachConnectionCredentialsOptions } from "./CockroachConnectionCredentialsOptions";
/**
 * Cockroachdb-specific connection options.
 */
export interface CockroachConnectionOptions extends BaseConnectionOptions, CockroachConnectionCredentialsOptions {
    /**
     * Database type.
     */
    readonly type: "cockroachdb";
    /**
     * Schema name.
     */
    readonly schema?: string;
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
    readonly poolErrorHandler?: (err: any) => any;
}
