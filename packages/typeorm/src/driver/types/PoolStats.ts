/**
 * A snapshot of the local connection pools managed by a data source.
 * Metrics unavailable from the underlying database driver are omitted.
 */
export interface PoolStats {
    /**
     * Total number of connections in the pools. Some drivers also count
     * connections being created.
     */
    total?: number

    /**
     * Number of connections currently in use. PostgreSQL and CockroachDB also
     * count connections being created.
     */
    active?: number

    /**
     * Number of idle connections available for checkout.
     */
    idle?: number

    /**
     * Number of requests waiting to acquire a connection.
     */
    waiting?: number
}
