/**
 * Options for columns that can define a length of the column type.
 */
export interface ColumnWithSignOptions {
    /**
     * Column type's display width. Used only on some column types in MySQL.
     * For example, INT(4) specifies an INT with a display width of four digits.
     * @deprecated No longer supported in newer MySQL versions, will be removed
     * from TypeORM in an upcoming version. Use a character column and the
     * `LPAD` function as suggested by MySQL
     */
    width?: number

    /**
     * Puts ZEROFILL attribute on to numeric column. Works only for MySQL.
     * If you specify ZEROFILL for a numeric column, MySQL automatically adds the UNSIGNED attribute to this column
     * @deprecated No longer supported in newer MySQL versions, will be removed
     * from TypeORM in an upcoming version. Use a character column and the
     * `LPAD` function as suggested by MySQL
     */
    zerofill?: boolean

    /**
     * Puts UNSIGNED attribute on to numeric column. Works only for MySQL.
     */
    unsigned?: boolean
}
