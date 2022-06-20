/**
 * Result object returned by DeleteQueryBuilder execution.
 */
export class DeleteResult {
    static from(queryResult) {
        const result = new this();
        result.raw = queryResult.records;
        result.affected = queryResult.affected;
        return result;
    }
}

//# sourceMappingURL=DeleteResult.js.map
