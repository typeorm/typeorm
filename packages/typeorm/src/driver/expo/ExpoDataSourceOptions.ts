import type { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"

/**
 * Expo SQLite-specific connection options.
 */
export interface ExpoDataSourceOptions extends BaseDataSourceOptions {
    /**
     * Database type.
     */
    readonly type: "expo"

    /**
     * Database name.
     */
    readonly database: string

    /**
     * Driver module. Optional — if omitted, TypeORM will load `expo-sqlite`
     * automatically. Pass explicitly when you need to control which instance
     * of the module is used (e.g. patch-package, custom wrappers).
     */
    readonly driver?: any

    /**
     * If set to `true` it tells expo-sqlite to create a new connection even
     * if an existing connection exists in cache
     */
    readonly useNewConnection?: boolean

    /**
     * @deprecated Not supported by expo-sqlite
     */
    readonly poolSize?: never
}
