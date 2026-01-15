import { DeferrableType } from "../metadata/types/DeferrableType"

export interface EntitySchemaExclusionOptions {
    /**
     * Exclusion constraint name.
     */
    name?: string

    /**
     * Exclusion expression.
     */
    expression: string

    /**
     * Indicate if exclusion constraints can be deferred.
     */
    deferrable?: DeferrableType
}
