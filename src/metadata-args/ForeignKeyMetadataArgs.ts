import { DeferrableType } from "../metadata/types/DeferrableType"
import { OnDeleteType } from "../metadata/types/OnDeleteType"
import { OnUpdateType } from "../metadata/types/OnUpdateType"
import { PropertyTypeFactory } from "../metadata/types/PropertyTypeInFunction"
import { RelationTypeInFunction } from "../metadata/types/RelationTypeInFunction"

/**
 * Arguments for ForeignKeyMetadata class.
 */
export interface ForeignKeyMetadataArgs {
    /**
     * Class to which foreign key is applied.
     */
    readonly target: Function | string

    /**
     * Class's property name to which this foreign key is applied.
     */
    readonly propertyName: string

    /**
     * Type of the relation. This type is in function because of language specifics and problems with recursive
     * referenced classes.
     */
    readonly type: RelationTypeInFunction

    /**
     * Foreign key constraint name.
     */
    readonly name?: string

    /**
     * Inverse side of the relation.
     */
    readonly inverseSide?: PropertyTypeFactory<any>

    /**
     * Column names which included by this foreign key.
     */
    readonly columnNames?: string[]

    /**
     * Column names which included by this foreign key.
     */
    readonly referencedColumnNames?: string[]

    /**
     * "ON DELETE" of this foreign key, e.g. what action database should perform when
     * referenced stuff is being deleted.
     */
    readonly onDelete?: OnDeleteType

    /**
     * "ON UPDATE" of this foreign key, e.g. what action database should perform when
     * referenced stuff is being updated.
     */
    readonly onUpdate?: OnUpdateType

    /**
     * Set this foreign key constraint as "DEFERRABLE" e.g. check constraints at start
     * or at the end of a transaction
     */
    readonly deferrable?: DeferrableType
}
