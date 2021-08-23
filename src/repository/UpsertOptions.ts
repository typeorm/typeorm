import { QueryDeepPartialEntity } from "../query-builder/QueryPartialEntity";

/**
 * Special options passed to Repository#upsert
 */
export interface UpsertOptions<Entity> {

    /**
     * Allow potentially unsafe insert only
     */
    allowUnsafeInsertOnly?: boolean;

    /**
     * Some values that will be written on insert but not on update
     */
    insertOnly?: QueryDeepPartialEntity<Entity>
}
