/**
 * Special options passed to Repository#upsert
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface UpsertOptions<Entity> {
    conflictPaths: string[]
}
