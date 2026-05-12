/**
 * Describes a column entry for a composite index, optionally specifying sort order.
 */
export interface IndexColumnOptions {
    /**
     * Column property name.
     */
    field: string

    /**
     * Sort order for this column in the index.
     * Defaults to ASC when not specified.
     */
    order?: "ASC" | "DESC"
}
