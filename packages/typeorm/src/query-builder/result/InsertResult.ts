import type { ObjectLiteral } from "../../common/ObjectLiteral"
import type { QueryResult } from "../../query-runner/QueryResult"

/**
 * Result object returned by InsertQueryBuilder execution.
 */
export class InsertResult {
    static from(queryResult: QueryResult) {
        const result = new this()
        result.raw = queryResult.raw
        return result
    }

    /**
     * Contains inserted entity id.
     * Has entity-like structure (not just column database name and values).
     * Entries are `undefined` at positions whose rows were skipped (for example, by `orIgnore()`).
     */
    identifiers: (ObjectLiteral | undefined)[] = []

    /**
     * Generated values returned by a database.
     * Has entity-like structure (not just column database name and values).
     * Entries are `undefined` at positions whose rows were skipped (for example, by `orIgnore()`).
     */
    generatedMaps: (ObjectLiteral | undefined)[] = []

    /**
     * Raw SQL result returned by executed query.
     */
    raw: any
}
