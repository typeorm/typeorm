export interface SapPoolOptions {
    /**
     * By default, implicit connection pooling is disabled.
     */
    pooling: boolean

    /**
     * The maximum pool size for a specific connection string or option.
     * By default value is 0, meaning that there is no limit.
     * DO NOT use this if pooling=false
     */
    maxPoolSize: number

    /**
     * If set to true, the Node.js driver specifies that connections
     * in the connection pool should be tested for viability before being reused.
     * DO NOT use this if pooling=false
     */
    poolingCheck: boolean

    /**
     * Specifies the maximum time, in seconds,
     * that the connection is cached in the implicit connection pool.
     * A value of 0 causes implicit pooled connections to be cached permanently.
     * DO NOT use this if pooling=false
     */
    connectionLifetime?: number
    /**
     * Sub-pool name.
     */
    poolKey?: string
}
