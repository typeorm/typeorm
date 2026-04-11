import type { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"
import type { SapConnectionCredentialsOptions } from "./SapConnectionCredentialsOptions"

/**
 * SAP Hana specific connection options.
 */
export interface SapDataSourceOptions
    extends BaseDataSourceOptions, SapConnectionCredentialsOptions {
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
         * Defines the maximum time, in milliseconds, to wait for a connection
         * to become available once the specified number of `maxConnectedOrPooled`
         * open connections have been reached (default: 0, no wait).
<<<<<<< HEAD:src/driver/sap/SapConnectionOptions.ts
