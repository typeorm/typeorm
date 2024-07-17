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
     * By default, NULL values are not treated as distinct entries.
     * Specifying NULLS NOT DISTINCT on unique constraints
     * will cause NULL values to be treated distinctly.
     *
     * Works only in PostgreSQL 15 and above.
     */
    nullsNotDistinct?: boolean
}
