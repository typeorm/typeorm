"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
/**
 * Database's table index stored in this class.
 */
var TableIndex = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function TableIndex(options) {
        /**
         * Columns included in this index.
         */
        this.columnNames = [];
        this.name = options.name;
        this.columnNames = options.columnNames;
        this.isUnique = !!options.isUnique;
        this.isSpatial = !!options.isSpatial;
        this.isFulltext = !!options.isFulltext;
        this.where = options.where ? options.where : "";
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a new copy of this index with exactly same properties.
     */
    TableIndex.prototype.clone = function () {
        return new TableIndex({
            name: this.name,
            columnNames: tslib_1.__spread(this.columnNames),
            isUnique: this.isUnique,
            isSpatial: this.isSpatial,
            isFulltext: this.isFulltext,
            where: this.where
        });
    };
    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------
    /**
     * Creates index from the index metadata object.
     */
    TableIndex.create = function (indexMetadata) {
        return new TableIndex({
            name: indexMetadata.name,
            columnNames: indexMetadata.columns.map(function (column) { return column.databaseName; }),
            isUnique: indexMetadata.isUnique,
            isSpatial: indexMetadata.isSpatial,
            isFulltext: indexMetadata.isFulltext,
            where: indexMetadata.where
        });
    };
    return TableIndex;
}());
exports.TableIndex = TableIndex;
//# sourceMappingURL=TableIndex.js.map