import type { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"

/**
 * Sqlite-specific connection options.
 */
export interface AbstractSqliteDataSourceOptions extends BaseDataSourceOptions {
    /**
     * Keeps SQLite foreign-key checks enabled during migrations.
     *
     * By default, TypeORM disables them while migrations run.
     *
     * @default false
     */
    readonly preserveForeignKeysDuringMigrations?: boolean
}
