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
     * Extra pg pool options to apply to this specific endpoint only.
     * Merged over the top-level `extra` in the DataSource options,
     * allowing different pool configuration for master and each slave.
     * Has no effect outside of `replication` mode.
     *
     * Example: set a connection lifetime on read replicas only:
     * ```ts
     * replication: {
     *   master: { host: 'writer.example.com', ... },
     *   slaves: [{ host: 'reader.example.com', extra: { maxLifetimeSeconds: 60 }, ... }],
     * }
     * ```
     */
    readonly extra?: Record<string, unknown>
}
