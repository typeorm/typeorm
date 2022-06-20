/**
 * Spanner specific connection credential options.
 */
export interface SpannerConnectionCredentialsOptions {
    /**
     * Connection url where perform connection to.
     */
    readonly instanceId?: string;
    /**
     * Database host.
     */
    readonly projectId?: string;
    /**
     * Database host port.
     */
    readonly databaseId?: string;
}
