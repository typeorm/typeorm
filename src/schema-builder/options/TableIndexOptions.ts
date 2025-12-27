import { TableIndexTypes } from "./TableIndexTypes"

/**
 * Database's table index options.
 */
export interface TableIndexOptions {
    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Constraint name.
     */
    name?: string

    /**
     * Columns included in this index.
     */
    columnNames: string[]

    /**
     * Indicates if this index is unique.
     */
    isUnique?: boolean

    /**
     * The SPATIAL modifier indexes the entire column and does not allow indexed columns to contain NULL values.
     * Works only in MySQL.
     */
    isSpatial?: boolean

    /**
     * Builds the index using the concurrently option.
     * This options is only supported for postgres database.
     */
    isConcurrent?: boolean

    /**
     * The FULLTEXT modifier indexes the entire column and does not allow prefixing.
     * Supported only in MySQL & SAP HANA.
     */
    isFulltext?: boolean

    /**
     * NULL_FILTERED indexes are particularly useful for indexing sparse columns, where most rows contain a NULL value.
     * In these cases, the NULL_FILTERED index can be considerably smaller and more efficient to maintain than
     * a normal index that includes NULL values.
     *
     * Works only in Spanner.
     */
    isNullFiltered?: boolean

    /**
     * UNIQUE NULLS NOT DISTINCT constraint allows only a single NULL value to appear in a UNIQUE index.
     * This option is only applicable in PostgreSQL.
     */
    isNullsNotDistinct?: boolean

    /**
     * Fulltext parser.
     * Works only in MySQL.
     */
    parser?: string

    /**
     * Index filter condition.
     */
    where?: string

    /**
     * The `type` option defines the type of the index being created.
     * Supported types include B-tree, Hash, GiST, SP-GiST, GIN, and BRIN
     * This option is only applicable in PostgreSQL.
     */
    type?: TableIndexTypes
}
