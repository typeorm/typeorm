import type { DeferrableType } from "../../metadata/types/DeferrableType"

/**
 * Describes all unique options.
 */
export interface UniqueOptions {
    /**
     * Indicate if unique constraints can be deferred.
     */
    deferrable?: DeferrableType

    /**
     * Sort order for the column when @Unique is used as a property decorator.
     * Has no effect when @Unique is used as a class decorator (use { field, order } objects in the columns array instead).
     */
    order?: "ASC" | "DESC"
}
