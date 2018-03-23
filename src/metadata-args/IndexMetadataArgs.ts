/**
 * Arguments for IndexMetadata class.
 */
export interface IndexMetadataArgs {

    /**
     * Class to which index is applied.
     */
    target: Function|string;

    /**
     * Index name.
     */
    name?: string;

    /**
     * Columns combination to be used as index.
     */
    columns?: ((object?: any) => (any[]|{ [key: string]: number }))|string[];

    /**
     * Indicates if index must be unique or not.
     */
    unique: boolean;

    /**
     * Index filter condition.
     */
    where?: string;

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
}
