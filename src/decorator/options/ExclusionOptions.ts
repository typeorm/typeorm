import { DeferrableType } from "../../metadata/types/DeferrableType"

/**
 * Describes all exclusion options.
 */
export interface ExclusionOptions {
    /**
     * Indicate if exclusion constraints can be deferred.
     */
    deferrable?: DeferrableType
}
