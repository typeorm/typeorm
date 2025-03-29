import { EntityTarget } from "../common/EntityTarget"
import { ForeignKeyOptions } from "../decorator/options/ForeignKeyOptions"

export interface EntitySchemaColumnForeignKeyOptions extends ForeignKeyOptions {
    /**
     * Indicates with which entity this relation is made.
     */
    target: EntityTarget<any>

    /**
     * Inverse side of the relation.
     */
    inverseSide?: string
}
