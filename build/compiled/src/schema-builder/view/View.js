"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.View = void 0;
/**
 * View in the database represented in this class.
 */
class View {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(options) {
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
    clone() {
        return new View({
            name: this.name,
            expression: this.expression,
            materialized: this.materialized,
        });
    }
    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------
    /**
     * Creates view from a given entity metadata.
     */
    static create(entityMetadata, driver) {
        const options = {
            name: driver.buildTableName(entityMetadata.tableName, entityMetadata.schema, entityMetadata.database),
            expression: entityMetadata.expression,
            materialized: entityMetadata.tableMetadataArgs.materialized
        };
        return new View(options);
    }
}
exports.View = View;
//# sourceMappingURL=View.js.map