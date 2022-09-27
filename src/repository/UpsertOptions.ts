/**
 * Special options passed to Repository#upsert
 */

import { InsertOrUpdateOptions } from "../query-builder/InsertOrUpdateOptions"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface UpsertOptions<Entity> extends InsertOrUpdateOptions {
    conflictPaths: string[]
}
