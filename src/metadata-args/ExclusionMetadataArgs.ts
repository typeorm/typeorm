import { DeferrableType } from "../metadata/types/DeferrableType"

/**
 * Arguments for ExclusionMetadata class.
 */
export interface ExclusionMetadataArgs {
    /**
     * Class to which index is applied.
     */
    target: Function | string

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
