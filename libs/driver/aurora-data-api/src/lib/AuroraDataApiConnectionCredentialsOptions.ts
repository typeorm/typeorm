/**
 * MySQL specific connection credential options.
 *
 * @see https://github.com/mysqljs/mysql#connection-options
 */
export interface AuroraDataApiConnectionCredentialsOptions {

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
    readonly password?: string | any;

    /**
     * Database name to connect to.
     */
    readonly database?: string | any;

    /**
     * Object with ssl parameters or a string containing name of ssl profile.
     */
    readonly ssl?: any;

}
