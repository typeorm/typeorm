import type { AbstractSqliteConnectionOptions } from "../sqlite-abstract/AbstractSqliteConnectionOptions"

/**
 * libSQL-specific connection options.
 */
export interface LibSqlConnectionOptions
    extends AbstractSqliteConnectionOptions {
    /**
     * Database type.
     */
    readonly type: "libsql"

    readonly poolSize?: never
}
