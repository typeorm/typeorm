import {JoinColumnOptions} from "../decorator/options/JoinColumnOptions";
import {RelationType} from "../metadata/types/RelationTypes";
import {JoinTableMultipleColumnsOptions} from "../decorator/options/JoinTableMuplipleColumnsOptions";
import {OnDeleteType} from "../metadata/types/OnDeleteType";

export interface EntitySchemaRelation {

    /**
     * Indicates with which entity this relation is made.
     */
    target: Function | string;

    /**
     * Type of relation. Can be one of the value of the RelationTypes class.
     */
    type: RelationType;

    /**
     * Inverse side of the relation.
     */
    inverseSide?: string;

    /**
     * Indicates if this relation will be lazily loaded.
     */
    isLazy?: boolean;

    /**
     * Join table options of this column. If set to true then it simply means that it has a join table.
     */
    joinTable?: boolean | JoinColumnOptions | JoinTableMultipleColumnsOptions;

    /**
     * Join column options of this column. If set to true then it simply means that it has a join column.
     */
    joinColumn?: boolean | {

        /**
         * Name of the column.
         */
        name?: string;

        /**
         * Name of the column in the entity to which this column is referenced.
         */
        referencedColumnName?: string;
    };

    /**
     * Indicates if this is a parent (can be only many-to-one relation) relation in the tree tables.
     */
    isTreeParent?: boolean;

    /**
     * Indicates if this is a children (can be only one-to-many relation) relation in the tree tables.
     */
    isTreeChildren?: boolean;

    /**
     * If set to true then it means that related object can be allowed to be inserted / updated / removed to the db.
     * This is option a shortcut if you would like to set cascadeInsert, cascadeUpdate and cascadeRemove to true.
     */
    cascade?: boolean|("insert"|"update")[];

    /**
     * Default database value.
     */
    default?: any;

    /**
     * Indicates if relation column value can be nullable or not.
     */
    nullable?: boolean;

    /**
     * Database cascade action on delete.
     */
    onDelete?: OnDeleteType;

}