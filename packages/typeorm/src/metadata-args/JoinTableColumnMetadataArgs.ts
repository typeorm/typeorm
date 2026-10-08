import type { DeferrableType } from "../metadata/types/DeferrableType"
import type { OnDeleteType } from "../metadata/types/OnDeleteType"
import type { OnUpdateType } from "../metadata/types/OnUpdateType"
import type { JoinColumnMetadataArgs } from "./JoinColumnMetadataArgs"

/**
 * Arguments for the join columns of a junction table.
 */
export interface JoinTableColumnMetadataArgs extends JoinColumnMetadataArgs {
    /**
     * Database cascade action on delete for the junction table foreign key.
     */
    onDelete?: OnDeleteType

    /**
     * Database cascade action on update for the junction table foreign key.
     */
    onUpdate?: OnUpdateType

    /**
     * Indicate if the junction table foreign key constraint can be deferred.
     */
    deferrable?: DeferrableType
}
