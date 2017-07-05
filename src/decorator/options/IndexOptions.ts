/**
 * Describes all composite index's options.
 */
export interface IndexOptions {

    /**
     * Indicates if this composite index must be unique or not.
     */
    unique?: boolean;

    /**
     * If true, the index only references documents with the specified field.
     * These indexes use less space but behave differently in some situations (particularly sorts).
     * This option is only supported for mongodb database.
     */
    sparse?: boolean;

}