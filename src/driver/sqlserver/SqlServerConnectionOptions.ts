import {BaseConnectionOptions} from "../../connection/BaseConnectionOptions";

/**
 * Microsoft Sql Server specific connection options.
 */
export interface SqlServerConnectionOptions extends BaseConnectionOptions {

    /**
     * Database type.
     */
    readonly type: "mssql";

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

}