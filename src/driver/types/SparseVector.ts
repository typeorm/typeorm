/**
 *  Sparse Vector Type
 */
export interface SparseVector {
    values: Record<number, number> // non-zero values with their indices
    length?: number // length of the full vector
}
