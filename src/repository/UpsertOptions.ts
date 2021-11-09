import { PropertyPath } from "../util/PropertyPath";

/**
 * Special options passed to Repository#upsert
 */
export interface UpsertOptions<Entity> {
    conflictPaths: PropertyPath<Entity>[]
}
