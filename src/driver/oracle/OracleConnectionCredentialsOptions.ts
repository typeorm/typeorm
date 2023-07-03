/**
 * Oracle specific connection credential options.
 */
export interface OracleConnectionCredentialsOptions {
    /**
     * Connection url where perform connection to.
     */
    readonly url?: string

    /**
     * Database host.
     */
    readonly host?: string

    /**
     * Database host port.
     */
    readonly port?: number

    /**
     * Database username.
     */
    readonly username?: string

    /**
     * Database password.
     */
    readonly password?: string

    /**
     * Database name to connect to.
     */
    readonly database?: string

    /**
     * Connection SID.
     */
    readonly sid?: string

    /**
     * Connection Service Name.
     */
    readonly serviceName?: string

    /**
     * Embedded TNS Connection String
     */
    readonly connectString?: string
}
