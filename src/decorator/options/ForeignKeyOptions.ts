import type { DeferrableType } from "../../metadata/types/DeferrableType"
import type { OnDeleteType } from "../../metadata/types/OnDeleteType"
import type { OnUpdateType } from "../../metadata/types/OnUpdateType"

/**
 * Describes all foreign key options.
 */
export interface ForeignKeyOptions {
    /**
     * Name of the foreign key constraint.
     */
    name?: string

    /**
     * Database cascade action on delete.
     */
    onDelete?: OnDeleteType

    /**
     * Database cascade action on update.
     */
    onUpdate?: OnUpdateType

    /**
     * Indicate if foreign key constraints can be deferred.
     */
    deferrable?: DeferrableType
}
