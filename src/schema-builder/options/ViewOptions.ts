import { DataSource } from "../../data-source"
import { SelectQueryBuilder } from "../../query-builder/SelectQueryBuilder"

/**
 * View options.
 */
export interface ViewOptions {
    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Database name that this table resides in if it applies.
     */
    database?: string

    /**
     * Schema name that this table resides in if it applies.
     */
    schema?: string

    /**
     * View name.
     */
    name: string

    /**
     * View expression.
     */
    expression: string | ((dataSource: DataSource) => SelectQueryBuilder<any>)

    /**
     * Indicates if view is materialized
     */

    materialized?: boolean
}
