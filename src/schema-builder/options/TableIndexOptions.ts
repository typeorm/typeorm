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
     * Works only in MySQL.
     */
    isFulltext?: boolean;

    /**
     * Index filter condition.
     */
    where?: string;

    /**
     * The PG_TEXT_SEARCH_INDEX modifier creates an index to improve the performance of full text searches.
     * Works only in PostgreSQL.
     * https://www.postgresql.org/docs/10/textsearch-indexes.html
     */
    pgTextSearchIndex?: {
        indexType: "GIN" | "GIST";
        operator?: string;
    };

}