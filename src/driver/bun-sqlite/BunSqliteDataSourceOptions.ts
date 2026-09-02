import type { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"

/** Minimal structural type for a bun:sqlite Statement instance. */
export interface BunSqliteStatement {
    readonly columnNames: string[]
    all(...params: unknown[]): Record<string, unknown>[]
    run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint }
}

/** Minimal structural type for a bun:sqlite Database instance. */
export interface BunSqliteDatabase {
    prepare(sql: string): BunSqliteStatement
    close(): void
}

/**
 * Bun SQLite-specific connection options.
 * Uses the built-in `bun:sqlite` module — no native addon required.
 */
export interface BunSqliteDataSourceOptions extends BaseDataSourceOptions {
    /**
     * Database type.
     */
    readonly type: "bun-sqlite"

    /**
     * Storage type or path to the storage.
     */
    readonly database: string

    /**
     * Cache size of sqlite statement to speed up queries.
     * Default: 100.
     */
    readonly statementCacheSize?: number

    /**
     * Function to run before a database is used in typeorm.
     * You can set pragmas, register plugins or register
     * functions or aggregates in this function.
     */
    readonly prepareDatabase?: (db: BunSqliteDatabase) => void | Promise<void>

    /**
     * Open the database connection in readonly mode.
     * Default: false.
     */
    readonly readonly?: boolean

    /**
     * Not supported by bun:sqlite (synchronous, single-connection driver).
     */
    readonly poolSize?: never

    /**
     * Enables WAL mode. By default its disabled.
     *
     * @see https://www.sqlite.org/wal.html
     */
    readonly enableWAL?: boolean
}
