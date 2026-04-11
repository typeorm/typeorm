/**
 * Result object returned by UpdateQueryBuilder execution.
 */
export class QueryResult<T = any> {
    /**
     * Raw SQL result returned by executed query.
     */
    raw: any

    /**
     * Rows
     */
    records: T[] = []

    /**
     * Complete recordsets array.
     *
     * Access this property to get all recordsets returned by the query.
     */
    recordsets: T[][] = []

    /**
     * Number of affected rows/documents
     */
    affected?: number
}
