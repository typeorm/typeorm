/**
 * Database's table unique constraint options.
 */
export interface TableUniqueOptions {
    /**
     * Constraint name.
     */
    name?: string;
    /**
     * Columns that contains this constraint.
     */
    columnNames: string[];
}
