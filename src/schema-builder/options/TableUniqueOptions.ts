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
     * Per-column sort orders for this unique constraint.
     * Columns not listed here use the database default (ASC).
     */
    columnOrders?: { [columnName: string]: "ASC" | "DESC" }
}
