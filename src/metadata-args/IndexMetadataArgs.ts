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

}
