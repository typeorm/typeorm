import {IndexFieldsMap} from "../metadata-args/types/IndexFieldsMap";

export interface EntitySchemaUniqueOptions {

    /**
     * Unique constraint name.
     */
    name?: string;

    /**
     * Unique column names.
     */
    columns?: IndexFieldsMap|string[];

}
