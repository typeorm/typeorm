import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"
import { SapConnectionCredentialsOptions } from "./SapConnectionCredentialsOptions"

/**
 * SAP Hana specific connection options.
 */
export interface SapConnectionOptions
    extends BaseDataSourceOptions,
        SapConnectionCredentialsOptions {
    /**
     * Database type.
     */
    readonly type: "sap"

    /**
     * Database schema.
     */
    readonly schema?: string

    /**
     * The driver objects
     * This defaults to require("@sap/hana-client")
     */
    readonly driver?: any

    /**
     * @deprecated Use {@link driver} instead.
     */
    readonly hanaClientDriver?: any

    /**
     * Pool options.
     */
    readonly pool?: {
        /**
         * Maximum number of open connections created by the pool, each of which
         * may be in the pool waiting to be reused or may no longer be in the
         * pool and actively being used (default: 10).
         */
        readonly maxConnectedOrPooled?: number

        /**
         * Defines the maximum time, in seconds, that connections are allowed to
         * remain in the pool before being marked for eviction (default: 30).
         */
        readonly maxPooledIdleTime?: number

        /**
         * Determines whether or not the pooled connection should be tested for
         * viability before being reused (default: false).
         */
        readonly pingCheck?: boolean

        /**
         * Maximum number of connections allowed to be in the pool, waiting to
         * be reused (default: 0, no limit).
         */
        readonly poolCapacity?: number

        /**
         * Max number of connections.
         * @deprecated Use {@link maxConnectedOrPooled} instead.
         */
        readonly max?: number

        /**
         * Minimum number of connections.
         * @deprecated Obsolete, no alternative exists.
         */
        readonly min?: number

        /**
         * Maximum number of waiting requests allowed.
         * @deprecated Obsolete, no alternative exists.
         */
        readonly maxWaitingRequests?: number

        /**
         * Max milliseconds a request will wait for a resource before timing out.
         * @deprecated Obsolete, no alternative exists.
         */
        readonly requestTimeout?: number

        /**
         * How often to run resource timeout checks.
         * @deprecated Obsolete, no alternative exists.
         */
        readonly checkInterval?: number

        /**
         * Idle timeout (in milliseconds).
         * @deprecated Use {@link maxPooledIdleTime} (in seconds) instead .
         */
        readonly idleTimeout?: number

        /**
         * Function handling errors thrown by drivers pool.
         * Defaults to logging error with `warn` level.
         */
        readonly poolErrorHandler?: (err: any) => any
    }
}
