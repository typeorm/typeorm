/**
 * Options for columns that can define a length of the column type.
 */
export interface ColumnUnsignedOptions {
    /**
     * Column type's display width. Used only on some column types in MySQL.
     * For example, INT(4) specifies an INT with a display width of four digits.
     * @deprecated MySQL deprecated and removed display width for integer types,
     * TypeORM will also remove it in an upcoming version. Use a character
     * column and the `LPAD` function as suggested by MySQL or handle the
     * formatting in the application layer.
     */
    width?: number

    /**
     * Puts ZEROFILL attribute on to numeric column. Works only for MySQL.
     * If you specify ZEROFILL for a numeric column, MySQL automatically adds
     * the UNSIGNED attribute to this column
     * @deprecated MySQL deprecated and removed the zerofill attribute. This
     * will also be removed from TypeORM in an upcoming version. Use a character
     * column and the `LPAD` function as suggested by MySQL or handle the
     * formatting in the application layer.
     */
    zerofill?: boolean

    /**
     * Puts UNSIGNED attribute on to numeric column. Works only for MySQL.
     */
    unsigned?: boolean
}
