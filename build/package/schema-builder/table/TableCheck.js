"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableCheck = void 0;
var tslib_1 = require("tslib");
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
            columnNames: this.columnNames ? tslib_1.__spreadArray([], tslib_1.__read(this.columnNames)) : [],
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
exports.TableCheck = TableCheck;

//# sourceMappingURL=TableCheck.js.map
