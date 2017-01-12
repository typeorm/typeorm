import {ColumnType} from "../../metadata/types/ColumnTypes";

/**
 * Describes all column's options.
 */
export interface ColumnOptions {

    /**
     * Column type. Must be one of the value from the ColumnTypes class.
     */
    readonly type?: ColumnType;

    /**
     * Column name in the database.
     */
    readonly name?: string;

    /**
     * Column type's length. Used only on some column types.
     * For example type = "string" and length = "100" means that ORM will create a column with type varchar(100).
     */
    readonly length?: string|number;

    /**
     * Indicates if this column is PRIMARY.
     * Same can be achieved if @PrimaryColumn decorator will be used.
     */
    readonly primary?: boolean;

    /**
     * Specifies if this column will use auto increment (sequence, generated identity).
     * Note that only one column in entity can be marked as generated, and it must be a primary column.
     * (todo: create validation logic for this condition)
     */
    readonly generated?: boolean;

    /**
     * Specifies if column's value must be unique or not.
     */
    readonly unique?: boolean;

    /**
     * Indicates if column's value can be set to NULL.
     */
    nullable?: boolean;

    /**
     * Column comment.
     */
    readonly comment?: string;

    /**
     * Default database value.
     */
    readonly default?: any;

    /**
     * The precision for a decimal (exact numeric) column (applies only for decimal column), which is the maximum
     * number of digits that are stored for the values.
     */
    readonly precision?: number;

    /**
     * The scale for a decimal (exact numeric) column (applies only for decimal column), which represents the number
     * of digits to the right of the decimal point and must not be greater than precision.
     */
    readonly scale?: number;

    /**
     * Indicates if this date column will contain a timezone.
     * Used only for date-typed column types.
     * Note that timezone option is not supported by all databases (only postgres for now).
     */
    readonly timezone?: boolean;

    /**
     * Indicates if date object must be stored in given date's timezone.
     * By default date is saved in UTC timezone.
     * Works only with "datetime" columns.
     */
    readonly localTimezone?: boolean;

}
