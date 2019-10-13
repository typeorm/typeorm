import { BaseConnectionOptions } from "../../connection/BaseConnectionOptions";
import { PostgresConnectionCredentialsOptions } from "./PostgresConnectionCredentialsOptions";
/**
 * Postgres-specific connection options.
 */
export interface PostgresConnectionOptions extends BaseConnectionOptions, PostgresConnectionCredentialsOptions {
    /**
     * Database type.
     */
    readonly type: "postgres";
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
        readonly master: PostgresConnectionCredentialsOptions;
        /**
         * List of read-from severs (slaves).
         */
        readonly slaves: PostgresConnectionCredentialsOptions[];
    };
    /**
     * The Postgres extension to use to generate UUID columns. Defaults to uuid-ossp.
     * If pgcrypto is selected, TypeORM will use the gen_random_uuid() function from this extension.
     * If uuid-ossp is selected, TypeORM will use the uuid_generate_v4() function from this extension.
     */
    readonly uuidExtension?: "pgcrypto" | "uuid-ossp";
    readonly poolErrorHandler?: (err: any) => any;
}
