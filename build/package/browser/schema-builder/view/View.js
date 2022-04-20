/**
 * View in the database represented in this class.
 */
var View = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function View(options) {
        if (options) {
            this.name = options.name;
            this.expression = options.expression;
            this.materialized = !!options.materialized;
        }
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Clones this table to a new table with all properties cloned.
     */
    View.prototype.clone = function () {
        return new View({
            name: this.name,
            expression: this.expression,
            materialized: this.materialized,
        });
    };
    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------
    /**
     * Creates view from a given entity metadata.
     */
    View.create = function (entityMetadata, driver) {
        var options = {
            name: driver.buildTableName(entityMetadata.tableName, entityMetadata.schema, entityMetadata.database),
            expression: entityMetadata.expression,
            materialized: entityMetadata.tableMetadataArgs.materialized
        };
        return new View(options);
    };
    return View;
}());
export { View };

//# sourceMappingURL=View.js.map
