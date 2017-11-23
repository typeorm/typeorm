
/**
 * Table's column options.
 */
export interface TableColumnOptions {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Column name.
     */
    name: string;

    /**
     * Column type.
     */
    type: string;

    /**
     * Column's default value.
     */
    default?: any;

    /**
     * Indicates if column is NULL, or is NOT NULL in the database.
     */
    isNullable?: boolean;

    /**
     * Indicates if column is auto-generated sequence.
     */
    isGenerated?: boolean;

    /**
     * Specifies generation strategy if this column will use auto increment.
     */
    generationStrategy?: "uuid"|"increment";

    /**
     * Indicates if column is a primary key.
     */
    isPrimary?: boolean;

    /**
     * Indicates if column has unique value.
     */
    isUnique?: boolean;

    /**
     * Indicates if column stores array.
     */
    isArray?: boolean;

    /**
     * Column's comment.
     */
    comment?: string;

    /**
     * Column type's length. Used only on some column types.
     * For example type = "string" and length = "100" means that ORM will create a column with type varchar(100).
     */
    length?: string;

    /**
     * Defines column character set.
     */
    charset?: string;

    /**
     * Defines column collation.
     */
    collation?: string;

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
}