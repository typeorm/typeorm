/**
 * Special options passed to Repository#upsert
 */

import { UpsertType } from "../driver/types/UpsertType"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface UpsertOptions<Entity> {
    // TODO: Make conflictPaths optional if usertype is set to 'upsert'
    conflictPaths: string[]
    /**
     * If true, postgres will skip the update if no values would be changed (reduces writes)
     */
    skipUpdateIfNoValuesChanged?: boolean

    /**
     * Define the type of upsert to use (currently, CockroachDB only).
     *
     * If none provided, it will use the default for the database (first one in the list)
     */
    upsertType?: UpsertType
}
