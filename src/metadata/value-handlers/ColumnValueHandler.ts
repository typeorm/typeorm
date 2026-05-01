/** Defines how a column's values are normalized and compared. */
export interface ColumnValueHandler<TIn = unknown, TOut = TIn> {
    /** Canonicalize a value to its consistent internal representation. */
    normalize(value: TIn): TOut

    /** Check if two normalized values are semantically equal. */
    areEqual(a: TOut, b: TOut): boolean
}
