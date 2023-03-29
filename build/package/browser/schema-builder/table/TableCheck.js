import { __read, __spreadArray } from "tslib";
/**
 * Database's table check constraint stored in this class.
 */
var TableCheck = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function TableCheck(options) {
        /**
         * Column that contains this constraint.
         */
        this.columnNames = [];
        this.name = options.name;
        this.columnNames = options.columnNames;
        this.expression = options.expression;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a new copy of this constraint with exactly same properties.
     */
    TableCheck.prototype.clone = function () {
        return new TableCheck({
            name: this.name,
            columnNames: this.columnNames ? __spreadArray([], __read(this.columnNames)) : [],
            expression: this.expression,
        });
    };
    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------
    /**
     * Creates checks from the check metadata object.
     */
    TableCheck.create = function (checkMetadata) {
        return new TableCheck({
            name: checkMetadata.name,
            expression: checkMetadata.expression
        });
    };
    return TableCheck;
}());
export { TableCheck };

//# sourceMappingURL=TableCheck.js.map
