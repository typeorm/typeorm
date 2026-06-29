import type { TlsOptions } from "tls"

/**
 * Postgres specific connection credential options.
 */
export interface PostgresConnectionCredentialsOptions {
    /**
     * Connection url where the connection is performed.
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
    readonly password?: string | (() => string) | (() => Promise<string>)

    /**
     * Database name to connect to.
     */
    readonly database?: string

    /**
     * Object with ssl parameters
     */
    readonly ssl?: boolean | TlsOptions

    /**
     * sets the application_name var to help db administrators identify
     * the service using this connection. Defaults to 'undefined'
     */
    readonly applicationName?: string

    /**
     * Per-endpoint extra pool options merged over the top-level `extra`.
     * Useful in replication mode to apply different pool settings per
     * master/slave endpoint (e.g. `maxLifetimeSeconds` only on slaves).
     */
    readonly extra?: any
}
