import type { DeferrableType } from "../metadata/types/DeferrableType"
import type { IndexColumnOptions } from "../decorator/options/IndexColumnOptions"

/**
 * Arguments for UniqueMetadata class.
 */
export interface UniqueMetadataArgs {
    /**
     * Class to which index is applied.
     */
    target: Function | string

    /**
     * Unique constraint name.
     */
    name?: string

    /**
     * Columns combination to be unique.
     */
    columns?:
        | ((object?: any) => any[] | { [key: string]: number })
        | (string | IndexColumnOptions)[]

    /**
     * Indicate if unique constraints can be deferred.
     */
    deferrable?: DeferrableType
}
