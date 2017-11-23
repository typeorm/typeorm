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
    name?: string;

    /**
     * Columns that contains this constraint.
     */
    columnNames: string[];

}