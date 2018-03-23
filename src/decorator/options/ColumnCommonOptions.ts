import {ValueTransformer} from "./ValueTransformer";

/**
 * Column options specific to all column types.
 */
export interface ColumnCommonOptions {

    /**
     * Indicates if column is always selected by QueryBuilder and find operations.
     * Default value is "true".
     */
    select?: boolean;

    /**
     * Column name in the database.
     */
    name?: string;

    /**
     * Indicates if this column is a primary key.
     * Same can be achieved when @PrimaryColumn decorator is used.
     */
    primary?: boolean;

    /**
     * Specifies if this column will use auto increment (sequence, generated identity).
     * Note that only one column in entity can be marked as generated, and it must be a primary column.
     */
    generated?: boolean;

    /**
     * Specifies if column's value must be unique or not.
     */
    unique?: boolean;

    /**
     * Indicates if column's value can be set to NULL.
     */
    nullable?: boolean;

    /**
     * Default database value.
     */
    default?: any;

    /**
     * Column comment. Not supported by all database types.
     */
    comment?: string;

    /**
     * Indicates if this column is an array.
     * Can be simply set to true or array length can be specified.
     * Supported only by postgres.
     */
    isArray?: boolean;

    /**
     * Specifies a value transformer that is to be used to (un)marshal
     * this column when reading or writing to the database.
     */
    transformer?: ValueTransformer;

}
