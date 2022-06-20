/**
 * Database's table exclusion constraint stored in this class.
 */
export class TableExclusion {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(options) {
        this["@instanceof"] = Symbol.for("TableExclusion");
        this.name = options.name;
        this.expression = options.expression;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a new copy of this constraint with exactly same properties.
     */
    clone() {
        return new TableExclusion({
            name: this.name,
            expression: this.expression,
        });
    }
    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------
    /**
     * Creates exclusions from the exclusion metadata object.
     */
    static create(exclusionMetadata) {
        return new TableExclusion({
            name: exclusionMetadata.name,
            expression: exclusionMetadata.expression,
        });
    }
}

//# sourceMappingURL=TableExclusion.js.map
