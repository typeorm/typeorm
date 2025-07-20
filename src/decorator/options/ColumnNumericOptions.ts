/**
 * Options for numeric column types where user can specify scale and precision.
 */
export interface ColumnNumericOptions {
    /**
     * The precision for a decimal (exact numeric) column (applies only for decimal column), which is the maximum
     * number of digits that are stored for the values.
     */
    precision?: number

    /**
     * The scale for a decimal (exact numeric) column (applies only for decimal column), which represents the number
     * of digits to the right of the decimal point and must not be greater than precision.
     */
    scale?: number

    /**
     * Puts ZEROFILL attribute on to numeric column. Works only for MySQL.
     * If you specify ZEROFILL for a numeric column, MySQL automatically adds the UNSIGNED attribute to the column
     * @deprecated No longer supported in newer MySQL versions, will be removed
     * from TypeORM in an upcoming version. Use a character column and the
     * `LPAD` function as suggested by MySQL
     */
    zerofill?: boolean

    /**
     * Puts UNSIGNED attribute on to numeric column. Works only for MySQL.
     * @deprecated MySQL only supports unsigned integers in newer versions.
     */
    unsigned?: boolean
}
