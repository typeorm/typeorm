/**
 * Result object returned by UpdateQueryBuilder execution.
 */
var UpdateResult = /** @class */ (function () {
    function UpdateResult() {
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
    return UpdateResult;
}());
export { UpdateResult };

//# sourceMappingURL=UpdateResult.js.map
