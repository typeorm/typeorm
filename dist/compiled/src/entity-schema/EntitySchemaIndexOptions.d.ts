export interface EntitySchemaIndexOptions {
    /**
     * Index name.
     */
    name?: string;
    /**
     * Index column names.
     */
    columns?: ((object?: any) => (any[] | {
        [key: string]: number;
    })) | string[];
    /**
     * Indicates if index must sync with database index.
     */
    synchronize?: boolean;
    /**
     * If true, the index only references documents with the specified field.
     * These indexes use less space but behave differently in some situations (particularly sorts).
     * This option is only supported for mongodb database.
     */
    sparse?: boolean;
    /**
     * Indicates if this index must be unique or not.
     */
    unique?: boolean;
    /**
     * The SPATIAL modifier indexes the entire column and does not allow indexed columns to contain NULL values.
     * Works only in MySQL and PostgreSQL.
     */
    spatial?: boolean;
    /**
     * The FULLTEXT modifier indexes the entire column and does not allow prefixing.
     * Works only in MySQL.
     */
    fulltext?: boolean;
    /**
     * Index filter condition.
     */
    where?: string;
}
