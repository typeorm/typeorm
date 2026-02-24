import type { DefaultAuthentication } from "./authentication/DefaultAuthentication"
import type { AzureActiveDirectoryAccessTokenAuthentication } from "./authentication/AzureActiveDirectoryAccessTokenAuthentication"
import type { AzureActiveDirectoryDefaultAuthentication } from "./authentication/AzureActiveDirectoryDefaultAuthentication"
import type { AzureActiveDirectoryMsiAppServiceAuthentication } from "./authentication/AzureActiveDirectoryMsiAppServiceAuthentication"
import type { AzureActiveDirectoryMsiVmAuthentication } from "./authentication/AzureActiveDirectoryMsiVmAuthentication"
import type { AzureActiveDirectoryPasswordAuthentication } from "./authentication/AzureActiveDirectoryPasswordAuthentication"
import type { AzureActiveDirectoryServicePrincipalSecret } from "./authentication/AzureActiveDirectoryServicePrincipalSecret"
import type { NtlmAuthentication } from "./authentication/NtlmAuthentication"

export type SqlServerConnectionCredentialsAuthenticationOptions =
    | DefaultAuthentication
    | NtlmAuthentication
    | AzureActiveDirectoryAccessTokenAuthentication
    | AzureActiveDirectoryDefaultAuthentication
    | AzureActiveDirectoryMsiAppServiceAuthentication
    | AzureActiveDirectoryMsiVmAuthentication
    | AzureActiveDirectoryPasswordAuthentication
    | AzureActiveDirectoryServicePrincipalSecret

/**
 * SqlServer specific connection credential options.
 */
export interface SqlServerConnectionCredentialsOptions {
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
     * Database name to connect to.
     */
    readonly database?: string

    /**
     * Database username.
     */
    readonly username?: string

    /**
     * Database password.
     */
    readonly password?: string

    /**
     * Authentication settings
     * It overrides username and password, when passed.
     */
    readonly authentication?: SqlServerConnectionCredentialsAuthenticationOptions

    /**
     * Once you set domain, driver will connect to SQL Server using domain login.
     * @see SqlServerConnectionCredentialsOptions.authentication
     * @see NtlmAuthentication
     * @deprecated
     */
    readonly domain?: string
}
