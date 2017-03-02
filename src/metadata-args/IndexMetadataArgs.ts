/**
 * Arguments for IndexMetadata class.
 */
export interface IndexMetadataArgs {

    /**
     * Class to which index is applied.
     */
    readonly target?: Function|string;

    /**
     * Index name.
     */
    readonly name?: string;

    /**
     * Columns combination to be used as index.
     */
    readonly columns: ((object?: any) => (any[]|{ [key: string]: number }))|string[];

    /**
     * Indicates if index must be unique or not.
     */
    readonly unique: boolean;

}
