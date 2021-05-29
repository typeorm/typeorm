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
     * The SPATIAL modifier indexes the entire column and does not allow indexed columns to contain NULL values.
     * Works only in MySQL.
     */
    isSpatial?: boolean;

    /**
     * The FULLTEXT modifier indexes the entire column and does not allow prefixing.
     * Supported only in MySQL & SAP HANA.
     */
    isFulltext?: boolean;

    /**
     * Fulltext parser.
     * Works only in MySQL.
     */
    parser?: string;

    /**
     * Index filter condition.
     */
    where?: string;

}
