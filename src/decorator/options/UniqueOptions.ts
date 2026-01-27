import { DeferrableType } from "../../metadata/types/DeferrableType"

/**
 * Describes all unique options.
 */
export interface UniqueOptions {
    /**
     * Indicate if unique constraints can be deferred.
     */
    deferrable?: DeferrableType
    /**
     * Indicate if NULL values in a unique index should be treated as equal.
     */
    nullsNotDistinct?: boolean
}
