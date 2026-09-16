import type { DeferrableType } from "../../metadata/types/DeferrableType"
import type { OnDeleteType } from "../../metadata/types/OnDeleteType"
import type { OnUpdateType } from "../../metadata/types/OnUpdateType"
import type { JoinColumnOptions } from "./JoinColumnOptions"

/**
 * Describes join column options of a junction table.
 * In addition to the regular join column options, the referential actions
 * of the junction table foreign key can be set here.
 *
 * Options set on the relation (or on the inverse relation for the inverse
 * join column) take precedence over these options.
 */
export interface JoinTableColumnOptions extends JoinColumnOptions {
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
