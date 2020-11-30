import {IndexFields, IndexFieldsFn} from "../metadata-args/types/IndexFields";

export interface EntitySchemaUniqueOptions {

    /**
     * Unique constraint name.
     */
    name?: string;

    /**
     * Unique column names.
     */
    columns?: IndexFields | IndexFieldsFn;

}
