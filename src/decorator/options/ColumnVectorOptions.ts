/**
 * Column options for vector-typed columns.
 */
export interface ColumnVectorOptions {
    /**
     * Vector dimensions. Used only for vector type.
     * For example type = "vector" and dimensions = 3 means that we will create a column with type vector(3).
     */
    dimensions?: number
}
