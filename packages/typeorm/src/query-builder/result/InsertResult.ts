import type { ObjectLiteral } from "../../common/ObjectLiteral"
import type { QueryResult } from "../../query-runner/QueryResult"

/**
 * Result object returned by InsertQueryBuilder execution.
 */
export class InsertResult {
    static from(queryResult: QueryResult) {
        const result = new this()
        result.raw = queryResult.raw
        if (typeof queryResult.affected === "number") {
            result.affected = queryResult.affected
        }
        return result
    }

    /**
     * Contains inserted entity id.
     * Has entity-like structure (not just column database name and values).
     */
    identifiers: ObjectLiteral[] = []

    /**
     * Generated values returned by a database.
     * Has entity-like structure (not just column database name and values).
     */
    generatedMaps: ObjectLiteral[] = []

    /**
     * Raw SQL result returned by executed query.
     */
    raw: any

    /**
     * Number of rows actually inserted/updated by the statement, when the
     * underlying driver reports it. With a conflict clause (orIgnore/orUpdate)
     * this can be lower than the number of entities passed to the query.
     */
    affected?: number
}
