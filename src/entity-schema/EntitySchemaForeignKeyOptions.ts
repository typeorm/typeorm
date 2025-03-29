import { EntityTarget } from "../common/EntityTarget"
import { ForeignKeyOptions } from "../decorator/options/ForeignKeyOptions"

export interface EntitySchemaForeignKeyOptions extends ForeignKeyOptions {
    /**
     * Indicates with which entity this relation is made.
     */
    target: EntityTarget<any>

    /**
     * Column names which included by this foreign key.
     */
    columnNames: string[]

    /**
     * Column names which included by this foreign key.
     */
    referencedColumnNames: string[]
}
