import type { IndexColumnOptions } from "../decorator/options/IndexColumnOptions"
import type { DeferrableType } from "../metadata/types/DeferrableType"

export interface EntitySchemaUniqueOptions {
    /**
     * Unique constraint name.
     */
    name?: string

    /**
     * Unique column names, optionally with sort order.
     */
    columns?:
        | ((object?: any) => any[] | { [key: string]: number })
        | (string | IndexColumnOptions)[]

    /**
     * Indicate if unique constraints can be deferred.
     */
    deferrable?: DeferrableType
}
