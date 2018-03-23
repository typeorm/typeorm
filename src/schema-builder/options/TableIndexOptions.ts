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
    name?: string;

    /**
     * Columns included in this index.
     */
    columnNames: string[];

    /**
     * Indicates if this index is unique.
     */
    isUnique?: boolean;

    /**
     * Index filter condition.
     */
    where?: string;

}