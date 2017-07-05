import {BaseConnectionOptions} from "../../connection/BaseConnectionOptions";

/**
 * MySQL specific connection options.
 */
export interface MysqlConnectionOptions extends BaseConnectionOptions {

    /**
     * Database type.
     */
    readonly type: "mysql"|"mariadb";

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