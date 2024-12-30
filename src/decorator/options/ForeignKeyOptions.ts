import { DeferrableType } from "../../metadata/types/DeferrableType"
import { OnDeleteType } from "../../metadata/types/OnDeleteType"
import { OnUpdateType } from "../../metadata/types/OnUpdateType"

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
