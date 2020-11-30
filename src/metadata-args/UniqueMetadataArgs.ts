import {IndexFields, IndexFieldsFn} from "./types/IndexFields";

/**
 * Arguments for UniqueMetadata class.
 */
export interface UniqueMetadataArgs {

    /**
     * Class to which index is applied.
     */
    target: Function|string;

    /**
     * Unique constraint name.
     */
    name?: string;

    /**
     * Columns combination to be unique.
     */
    columns?: IndexFields | IndexFieldsFn;
}
