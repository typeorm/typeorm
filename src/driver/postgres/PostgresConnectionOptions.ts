import {BaseConnectionOptions} from "../../connection/BaseConnectionOptions";

/**
 * Postgres-specific connection options.
 */
export interface PostgresConnectionOptions extends BaseConnectionOptions {

    /**
     * Database type.
     */
    readonly type: "postgres";

    /**
     * Connection url where perform connection to.
     */
    readonly url?: string;

    /**
     * Database host.
     */
    readonly host?: string;

    /**
     * Database host port.
     */
    readonly port?: number;

    /**
     * Database username.
     */
    readonly username?: string;

    /**
     * Database password.
     */
    readonly password?: string;

    /**
     * Database name to connect to.
     */
    readonly database?: string;

    /**
     * Schema name. By default is "public".
     */
    readonly schemaName?: string;

}