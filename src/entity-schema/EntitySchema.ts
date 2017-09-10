import {TableType} from "../metadata/types/TableTypes";
import {OrderByCondition} from "../find-options/OrderByCondition";
import {JoinColumnOptions} from "../decorator/options/JoinColumnOptions";
import {ColumnType} from "../driver/types/ColumnTypes";
import {RelationType} from "../metadata/types/RelationTypes";
import {JoinTableMultipleColumnsOptions} from "../decorator/options/JoinTableMuplipleColumnsOptions";
import {OnDeleteType} from "../metadata/types/OnDeleteType";

/**
 * Interface for entity metadata mappings stored inside "schemas" instead of models decorated by decorators.
 */
export interface EntitySchema { // todo: make it-to-date

    /**
     * Name of the schema it extends.
     */
    extends?: string;

    /**
     * Target bind to this entity schema. Optional.
     */
    target?: Function;

    /**
     * Entity name.
     */
    name: string;

    /**
     * Entity table's options.
     */
    table?: {

        /**
         * Table name.
         */
        name?: string;

        /**
         * Table type.
         */
        type?: TableType;

        /**
         * Specifies a property name by which queries will perform ordering by default when fetching rows.
         */
        orderBy?: OrderByCondition;

    };

    /**
     * Entity column's options.
     */
    columns: {
        [columnName: string]: {

            /**
             * Indicates if this column is a primary column.
             */
            primary: boolean;

            /**
             * Indicates if this column is a created date column.
             */
            createDate: boolean;

            /**
             * Indicates if this column is an update date column.
             */
            updateDate: boolean;

            /**
             * Indicates if this column is a version column.
             */
            version: boolean;

            /**
             * Indicates if this column is a treeChildrenCount column.
             */
            treeChildrenCount: boolean;

            /**
             * Indicates if this column is a treeLevel column.
             */
            treeLevel: boolean;

            /**
             * Column type. Must be one of the value from the ColumnTypes class.
             */
            type: ColumnType;

            /**
             * Column name in the database.
             */
            name?: string;

            /**
             * Column type's length. For example type = "string" and length = 100 means that ORM will create a column with
             * type varchar(100).
             */
            length?: string;

            /**
             * Specifies if this column will use AUTO_INCREMENT or not (e.g. generated number).
             */
            generated?: true|"increment"|"uuid";

            /**
             * Specifies if column's value must be unique or not.
             */
            unique?: boolean;

            /**
             * Indicates if column's value can be set to NULL.
             */
            nullable?: boolean;

            /**
             * Extra column definition. Should be used only in emergency situations. Note that if you'll use this property
             * auto schema generation will not work properly anymore. Avoid using it.
             */
            columnDefinition?: string;

            /**
             * Column comment.
             */
            comment?: string;

            /**
             * Default database value.
             */
            default?: string;

            /**
             * The precision for a decimal (exact numeric) column (applies only for decimal column), which is the maximum
             * number of digits that are stored for the values.
             */
            precision?: number;

            /**
             * The scale for a decimal (exact numeric) column (applies only for decimal column), which represents the number
             * of digits to the right of the decimal point and must not be greater than precision.
             */
            scale?: number;

            /**
             * Column collation. Note that not all databases support it.
             */
            collation?: string; // todo: looks like this is not used

        };
    };

    /**
     * Entity relation's options.
     */
    relations: {
        [relationName: string]: {

            /**
             * Indicates with which entity this relation is made.
             */
            target: Function|string;

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
            joinTable?: boolean|JoinColumnOptions|JoinTableMultipleColumnsOptions;

            /**
             * Join column options of this column. If set to true then it simply means that it has a join column.
             */
            joinColumn?: boolean|{

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
            cascadeAll?: boolean;

            /**
             * If set to true then it means that related object can be allowed to be inserted to the db.
             */
            cascadeInsert?: boolean;

            /**
             * If set to true then it means that related object can be allowed to be updated in the db.
             */
            cascadeUpdate?: boolean;

            /**
             * If set to true then it means that related object can be allowed to be remove from the db.
             */
            cascadeRemove?: boolean;

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

        };
    };

     /**
     * Entity indices options.
     */
    indices: {
        [indexName: string]: {

            /**
             * Index column names.
             */
            columns: string[];

            /**
             * Indicates if this index must be unique or not.
             */
            unique: boolean;

            /**
             * If true, the index only references documents with the specified field.
             * These indexes use less space but behave differently in some situations (particularly sorts).
             * This option is only supported for mongodb database.
             */
            sparse?: boolean;
        };    
    };

}