/**
 * Result object returned by UpdateQueryBuilder execution.
 */
export class UpdateResult {
    constructor() {
        /**
         * Contains inserted entity id.
         * Has entity-like structure (not just column database name and values).
         */
        // identifier: ObjectLiteral[] = [];
        /**
         * Generated values returned by a database.
         * Has entity-like structure (not just column database name and values).
         */
        this.generatedMaps = [];
    }
}

//# sourceMappingURL=UpdateResult.js.map
