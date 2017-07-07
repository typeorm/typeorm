import {ColumnType} from "../../driver/types/ColumnTypes";

/**
 * Describes all column's options.
 */
export interface ColumnOptions {

    /**
     * Column type. Must be one of the value from the ColumnTypes class.
     */
    type?: ColumnType;

    /**
     * Column name in the database.
     */
    name?: string;

    /**
     * Column type's length. Used only on some column types.
     * For example type = "string" and length = "100" means that ORM will create a column with type varchar(100).
     */
    length?: string|number;

    /**
     * Indicates if this column is a primary key.
     * Same can be achieved when @PrimaryColumn decorator is used.
     */
    primary?: boolean;

    /**
     * Specifies if this column will use auto increment (sequence, generated identity).
     * Note that only one column in entity can be marked as generated, and it must be a primary column.
     * (todo: create validation logic for this condition)
     */
    generated?: boolean; // |"uuid"|"sequence";

    /**
     * Specifies if column's value must be unique or not.
     */
    unique?: boolean;

    /**
     * Indicates if column's value can be set to NULL.
     */
    nullable?: boolean;

    /**
     * Column comment. Not supported by all database types.
     */
    comment?: string;

    /**
     * Default database value.
     */
    default?: any;

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
     * Array of possible enumerated values.
     */
    enum?: any[];

    /**
     * Indicates if this column is an array.
     * Can be simply set to true or array length can be specified.
     * Supported only by postgres.
     */
    array?: boolean|string;

}
