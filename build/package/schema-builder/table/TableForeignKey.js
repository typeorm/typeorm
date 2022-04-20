"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableForeignKey = void 0;
var tslib_1 = require("tslib");
/**
 * Foreign key from the database stored in this class.
 */
var TableForeignKey = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function TableForeignKey(options) {
        /**
         * Column names which included by this foreign key.
         */
        this.columnNames = [];
        /**
         * Column names which included by this foreign key.
         */
        this.referencedColumnNames = [];
        this.name = options.name;
        this.columnNames = options.columnNames;
        this.referencedColumnNames = options.referencedColumnNames;
        this.referencedTableName = options.referencedTableName;
        this.onDelete = options.onDelete;
        this.onUpdate = options.onUpdate;
        this.deferrable = options.deferrable;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a new copy of this foreign key with exactly same properties.
     */
    TableForeignKey.prototype.clone = function () {
        return new TableForeignKey({
            name: this.name,
            columnNames: tslib_1.__spreadArray([], tslib_1.__read(this.columnNames)),
            referencedColumnNames: tslib_1.__spreadArray([], tslib_1.__read(this.referencedColumnNames)),
            referencedTableName: this.referencedTableName,
            onDelete: this.onDelete,
            onUpdate: this.onUpdate,
            deferrable: this.deferrable,
        });
    };
    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a new table foreign key from the given foreign key metadata.
     */
    TableForeignKey.create = function (metadata) {
        return new TableForeignKey({
            name: metadata.name,
            columnNames: metadata.columnNames,
            referencedColumnNames: metadata.referencedColumnNames,
            referencedTableName: metadata.referencedTablePath,
            onDelete: metadata.onDelete,
            onUpdate: metadata.onUpdate,
            deferrable: metadata.deferrable,
        });
    };
    return TableForeignKey;
}());
exports.TableForeignKey = TableForeignKey;

//# sourceMappingURL=TableForeignKey.js.map
