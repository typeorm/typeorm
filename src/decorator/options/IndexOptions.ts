/**
 * Describes all index options.
 */
export interface IndexOptions {

    /**
     * Indicates if this composite index must be unique or not.
     */
    unique?: boolean;

    /**
     * The SPATIAL modifier indexes the entire column and does not allow indexed columns to contain NULL values.
     * Works only in MySQL and PostgreSQL.
     */
    spatial?: boolean;

    /**
     * The PG_TEXT_SEARCH_INDEX modifier creates an index to improve the performance of full text searches.
     * Works only in PostgreSQL.
     * https://www.postgresql.org/docs/10/textsearch-indexes.html
     */
    pgTextSearchIndex?: {
        indexType: "GIN" | "GIST";
        operator?: string;
    };

    /**
     * The FULLTEXT modifier indexes the entire column and does not allow prefixing.
     * Works only in MySQL.
     */
    fulltext?: boolean;

    /**
     * Index filter condition.
     */
    where?: string;

    /**
     * If true, the index only references documents with the specified field.
     * These indexes use less space but behave differently in some situations (particularly sorts).
     * This option is only supported for mongodb database.
     */
    sparse?: boolean;

    /**
     * Builds the index in the background so that building an index an does not block other database activities.
     * This option is only supported for mongodb database.
     */
    background?: boolean;

    /**
     * Specifies a time to live, in seconds.
     * This option is only supported for mongodb database.
     */
    expireAfterSeconds?: number;

}
