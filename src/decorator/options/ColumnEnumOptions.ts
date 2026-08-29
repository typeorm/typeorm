/**
 * Column options for enum-typed columns.
 */
export interface ColumnEnumOptions {
    /**
     * Array of possible enumerated values.
     */
    enum?: any[] | object
    /**
     * Exact name of enum
     */
    enumName?: string
}
