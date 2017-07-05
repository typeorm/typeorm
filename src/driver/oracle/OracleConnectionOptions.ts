import {BaseConnectionOptions} from "../../connection/BaseConnectionOptions";

/**
 * Oracle-specific connection options.
 */
export interface OracleConnectionOptions extends BaseConnectionOptions {

    /**
     * Database type.
     */
    readonly type: "oracle";

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
     * Connection SID.
     */
    readonly sid?: string;

    /**
     * Schema name. By default is "public".
     */
    readonly schemaName?: string;

}