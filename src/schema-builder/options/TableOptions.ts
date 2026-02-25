import { TableColumnOptions } from "./TableColumnOptions"
import { TableIndexOptions } from "./TableIndexOptions"
import { TableForeignKeyOptions } from "./TableForeignKeyOptions"
import { TableUniqueOptions } from "./TableUniqueOptions"
import { TableCheckOptions } from "./TableCheckOptions"
import { TableExclusionOptions } from "./TableExclusionOptions"

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
     * Enables strict mode. This will make sure that columns are always treated with their defined types.
     * For example, if a column is defined as an integer, it will always be treated as an integer.
     * This can help prevent issues with type coercion and ensure data integrity.
     * Supports only Sqlite.
     *
     * @see https://www.sqlite.org/stricttables.html
     */
    strict?: boolean

    /**
     * Table engine.
     */
    engine?: string

    /**
     * Table comment. Not supported by all database types.
     */
    comment?: string
}
