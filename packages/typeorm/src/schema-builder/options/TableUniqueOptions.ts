/**
 * Database's table unique constraint options.
 */
export interface TableUniqueOptions {
    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Constraint name.
     */
    name?: string

    /**
     * Columns that contains this constraint.
     */
    columnNames: string[]

    /**
     * Set this foreign key constraint as "DEFERRABLE" e.g. check constraints at start
     * or at the end of a transaction
     */
    deferrable?: string

    /**
     * UNIQUE NULLS NOT DISTINCT constraint allows only a single NULL value to appear in a UNIQUE index.
     * This option is only applicable in PostgreSQL.
     */
    isNullsNotDistinct?: boolean
}
