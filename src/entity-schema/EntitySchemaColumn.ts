import {ColumnType} from "../driver/types/ColumnTypes";

export interface EntitySchemaColumn {
    
    /**
     * Indicates if this column is a primary column.
     */
    primary?: boolean;

    /**
     * Indicates if this column is a created date column.
     */
    createDate?: boolean;

    /**
     * Indicates if this column is an update date column.
     */
    updateDate?: boolean;
    /**
     * Indicates if this column is a soft delete date column.
    */
    softDeleteDate?: boolean;

    /**
     * Indicates if this column is a version column.
     */
    version?: boolean;

    /**
     * Indicates if this column is a treeChildrenCount column.
     */
    treeChildrenCount?: boolean;

    /**
     * Indicates if this column is a treeLevel column.
     */
    treeLevel?: boolean;

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
    length?: string | number;

    /**
     * Specifies if this column will use AUTO_INCREMENT or not (e.g. generated number).
     */
    generated?: true | "increment" | "uuid";

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

}
