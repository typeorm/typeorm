import type { TableColumnOptions } from "./TableColumnOptions"
import type { TableIndexOptions } from "./TableIndexOptions"
import type { TableForeignKeyOptions } from "./TableForeignKeyOptions"
import type { TableUniqueOptions } from "./TableUniqueOptions"
import type { TableCheckOptions } from "./TableCheckOptions"
import type { TableExclusionOptions } from "./TableExclusionOptions"

/**
 * Table options.
 */
export interface TableOptions {
    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Table schema.
     */
    schema?: string

    /**
     * Table database.
     */
    database?: string

    /**
     * Table name.
     */
    name: string

    /**
     * Table columns.
     */
    columns?: TableColumnOptions[]

    /**
     * Table indices.
     */
    indices?: TableIndexOptions[]

    /**
     * Table foreign keys.
     */
    foreignKeys?: TableForeignKeyOptions[]

    /**
     * Table unique constraints.
     */
    uniques?: TableUniqueOptions[]

    /**
     * Table check constraints.
     */
    checks?: TableCheckOptions[]

    /**
     * Table check constraints.
     */
    exclusions?: TableExclusionOptions[]

    /**
     * Indicates if table was just created.
     * This is needed, for example to check if we need to skip primary keys creation
     * for new tables.
     */
    justCreated?: boolean

    /**
     * Enables Sqlite "WITHOUT ROWID" modifier for the "CREATE TABLE" statement
     */
    withoutRowid?: boolean

    /**
     * Table engine.
     */
    engine?: string

    /**
     * Table comment. Not supported by all database types.
     */
    comment?: string
}
