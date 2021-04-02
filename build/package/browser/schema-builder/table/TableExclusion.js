/**
 * Database's table exclusion constraint stored in this class.
 */
var TableExclusion = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function TableExclusion(options) {
        this.name = options.name;
        this.expression = options.expression;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a new copy of this constraint with exactly same properties.
     */
    TableExclusion.prototype.clone = function () {
        return new TableExclusion({
            name: this.name,
            expression: this.expression,
        });
    };
    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------
    /**
     * Creates exclusions from the exclusion metadata object.
     */
    TableExclusion.create = function (exclusionMetadata) {
        return new TableExclusion({
            name: exclusionMetadata.name,
            expression: exclusionMetadata.expression
        });
    };
    return TableExclusion;
}());
export { TableExclusion };

//# sourceMappingURL=TableExclusion.js.map
