/**
 * Spanner specific connection credential options.
 */
export interface SpannerConnectionCredentialsOptions {
    /**
     * Connection url where the connection is performed.
     */
    readonly instanceId?: string

    /**
     * Database host.
     */
    readonly projectId?: string

    /**
     * Database host port.
     */
    readonly databaseId?: string

    /**
     * Object containing client_email and private_key properties, or the external account client options. Cannot be used with apiKey.
     */
    readonly credentials?: {
        /**
         * Client email connection credentials (Optional)
         */
        readonly client_email: string

        /**
         * Private key connection credentials (Optional)
         */
        readonly private_key: string
    }
}
