import { __read, __spreadArray } from "tslib";
/**
 * Database's table unique constraint stored in this class.
 */
var TableUnique = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function TableUnique(options) {
        /**
         * Columns that contains this constraint.
         */
        this.columnNames = [];
        this.name = options.name;
        this.columnNames = options.columnNames;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a new copy of this constraint with exactly same properties.
     */
    TableUnique.prototype.clone = function () {
        return new TableUnique({
            name: this.name,
            columnNames: __spreadArray([], __read(this.columnNames))
        });
    };
    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------
    /**
     * Creates unique from the unique metadata object.
     */
    TableUnique.create = function (uniqueMetadata) {
        return new TableUnique({
            name: uniqueMetadata.name,
            columnNames: uniqueMetadata.columns.map(function (column) { return column.databaseName; })
        });
    };
    return TableUnique;
}());
export { TableUnique };

//# sourceMappingURL=TableUnique.js.map
