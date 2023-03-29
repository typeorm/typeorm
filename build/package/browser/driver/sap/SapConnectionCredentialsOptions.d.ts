/**
 * SAP Hana specific connection credential options.
 */
export interface SapConnectionCredentialsOptions {
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
     * Encrypt database connection
     */
    readonly encrypt?: boolean;
    /**
     * Validate database certificate
     */
    readonly sslValidateCertificate?: boolean;
    /**
     * Key for encrypted connection
     */
    readonly key?: string;
    /**
     * Cert for encrypted connection
     */
    readonly cert?: string;
    /**
     * Ca for encrypted connection
     */
    readonly ca?: string;
}
