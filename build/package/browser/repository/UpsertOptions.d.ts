/**
 * Special options passed to Repository#upsert
 */
export interface UpsertOptions<Entity> {
    conflictPaths: string[];
    /**
     * If true, postgres will skip the update if no values would be changed (reduces writes)
     */
    skipUpdateIfNoValuesChanged?: boolean;
}
