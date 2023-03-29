import { TableColumn } from "./TableColumn";
import { TableIndex } from "./TableIndex";
import { TableForeignKey } from "./TableForeignKey";
import { TableUtils } from "../util/TableUtils";
import { TableUnique } from "./TableUnique";
import { TableCheck } from "./TableCheck";
import { TableExclusion } from "./TableExclusion";
/**
 * Table in the database represented in this class.
 */
var Table = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function Table(options) {
        /**
         * Table columns.
         */
        this.columns = [];
        /**
         * Table indices.
         */
        this.indices = [];
        /**
         * Table foreign keys.
         */
        this.foreignKeys = [];
        /**
         * Table unique constraints.
         */
        this.uniques = [];
        /**
         * Table check constraints.
         */
        this.checks = [];
        /**
         * Table exclusion constraints.
         */
        this.exclusions = [];
        /**
         * Indicates if table was just created.
         * This is needed, for example to check if we need to skip primary keys creation
         * for new tables.
         */
        this.justCreated = false;
        if (options) {
            this.name = options.name;
            if (options.columns)
                this.columns = options.columns.map(function (column) { return new TableColumn(column); });
            if (options.indices)
                this.indices = options.indices.map(function (index) { return new TableIndex(index); });
            if (options.foreignKeys)
                this.foreignKeys = options.foreignKeys.map(function (foreignKey) { return new TableForeignKey(foreignKey); });
            if (options.uniques)
                this.uniques = options.uniques.map(function (unique) { return new TableUnique(unique); });
            if (options.checks)
                this.checks = options.checks.map(function (check) { return new TableCheck(check); });
            if (options.exclusions)
                this.exclusions = options.exclusions.map(function (exclusion) { return new TableExclusion(exclusion); });
            if (options.justCreated !== undefined)
                this.justCreated = options.justCreated;
            this.engine = options.engine;
        }
    }
    Object.defineProperty(Table.prototype, "primaryColumns", {
        // -------------------------------------------------------------------------
        // Accessors
        // -------------------------------------------------------------------------
        get: function () {
            return this.columns.filter(function (column) { return column.isPrimary; });
        },
        enumerable: false,
        configurable: true
    });
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Clones this table to a new table with all properties cloned.
     */
    Table.prototype.clone = function () {
        return new Table({
            name: this.name,
            columns: this.columns.map(function (column) { return column.clone(); }),
            indices: this.indices.map(function (constraint) { return constraint.clone(); }),
            foreignKeys: this.foreignKeys.map(function (constraint) { return constraint.clone(); }),
            uniques: this.uniques.map(function (constraint) { return constraint.clone(); }),
            checks: this.checks.map(function (constraint) { return constraint.clone(); }),
            exclusions: this.exclusions.map(function (constraint) { return constraint.clone(); }),
            justCreated: this.justCreated,
            engine: this.engine,
        });
    };
    /**
     * Add column and creates its constraints.
     */
    Table.prototype.addColumn = function (column) {
        this.columns.push(column);
    };
    /**
     * Remove column and its constraints.
     */
    Table.prototype.removeColumn = function (column) {
        var foundColumn = this.columns.find(function (c) { return c.name === column.name; });
        if (foundColumn)
            this.columns.splice(this.columns.indexOf(foundColumn), 1);
    };
    /**
     * Adds unique constraint.
     */
    Table.prototype.addUniqueConstraint = function (uniqueConstraint) {
        this.uniques.push(uniqueConstraint);
        if (uniqueConstraint.columnNames.length === 1) {
            var uniqueColumn = this.columns.find(function (column) { return column.name === uniqueConstraint.columnNames[0]; });
            if (uniqueColumn)
                uniqueColumn.isUnique = true;
        }
    };
    /**
     * Removes unique constraint.
     */
    Table.prototype.removeUniqueConstraint = function (removedUnique) {
        var foundUnique = this.uniques.find(function (unique) { return unique.name === removedUnique.name; });
        if (foundUnique) {
            this.uniques.splice(this.uniques.indexOf(foundUnique), 1);
            if (foundUnique.columnNames.length === 1) {
                var uniqueColumn = this.columns.find(function (column) { return column.name === foundUnique.columnNames[0]; });
                if (uniqueColumn)
                    uniqueColumn.isUnique = false;
            }
        }
    };
    /**
     * Adds check constraint.
     */
    Table.prototype.addCheckConstraint = function (checkConstraint) {
        this.checks.push(checkConstraint);
    };
    /**
     * Removes check constraint.
     */
    Table.prototype.removeCheckConstraint = function (removedCheck) {
        var foundCheck = this.checks.find(function (check) { return check.name === removedCheck.name; });
        if (foundCheck) {
            this.checks.splice(this.checks.indexOf(foundCheck), 1);
        }
    };
    /**
     * Adds exclusion constraint.
     */
    Table.prototype.addExclusionConstraint = function (exclusionConstraint) {
        this.exclusions.push(exclusionConstraint);
    };
    /**
     * Removes exclusion constraint.
     */
    Table.prototype.removeExclusionConstraint = function (removedExclusion) {
        var foundExclusion = this.exclusions.find(function (exclusion) { return exclusion.name === removedExclusion.name; });
        if (foundExclusion) {
            this.exclusions.splice(this.exclusions.indexOf(foundExclusion), 1);
        }
    };
    /**
     * Adds foreign keys.
     */
    Table.prototype.addForeignKey = function (foreignKey) {
        this.foreignKeys.push(foreignKey);
    };
    /**
     * Removes foreign key.
     */
    Table.prototype.removeForeignKey = function (removedForeignKey) {
        var fk = this.foreignKeys.find(function (foreignKey) { return foreignKey.name === removedForeignKey.name; });
        if (fk)
            this.foreignKeys.splice(this.foreignKeys.indexOf(fk), 1);
    };
    /**
     * Adds index.
     */
    Table.prototype.addIndex = function (index, isMysql) {
        if (isMysql === void 0) { isMysql = false; }
        this.indices.push(index);
        // in Mysql unique indices and unique constraints are the same thing
        // if index is unique and have only one column, we mark this column as unique
        if (index.columnNames.length === 1 && index.isUnique && isMysql) {
            var column = this.columns.find(function (c) { return c.name === index.columnNames[0]; });
            if (column)
                column.isUnique = true;
        }
    };
    /**
     * Removes index.
     */
    Table.prototype.removeIndex = function (tableIndex, isMysql) {
        if (isMysql === void 0) { isMysql = false; }
        var index = this.indices.find(function (index) { return index.name === tableIndex.name; });
        if (index) {
            this.indices.splice(this.indices.indexOf(index), 1);
            // in Mysql unique indices and unique constraints are the same thing
            // if index is unique and have only one column, we move `unique` attribute from its column
            if (index.columnNames.length === 1 && index.isUnique && isMysql) {
                var column_1 = this.columns.find(function (c) { return c.name === index.columnNames[0]; });
                if (column_1)
                    column_1.isUnique = this.indices.some(function (ind) { return ind.columnNames.length === 1 && ind.columnNames[0] === column_1.name && !!index.isUnique; });
            }
        }
    };
    Table.prototype.findColumnByName = function (name) {
        return this.columns.find(function (column) { return column.name === name; });
    };
    /**
     * Returns all column indices.
     */
    Table.prototype.findColumnIndices = function (column) {
        return this.indices.filter(function (index) {
            return !!index.columnNames.find(function (columnName) { return columnName === column.name; });
        });
    };
    /**
     * Returns all column foreign keys.
     */
    Table.prototype.findColumnForeignKeys = function (column) {
        return this.foreignKeys.filter(function (foreignKey) {
            return !!foreignKey.columnNames.find(function (columnName) { return columnName === column.name; });
        });
    };
    /**
     * Returns all column uniques.
     */
    Table.prototype.findColumnUniques = function (column) {
        return this.uniques.filter(function (unique) {
            return !!unique.columnNames.find(function (columnName) { return columnName === column.name; });
        });
    };
    /**
     * Returns all column checks.
     */
    Table.prototype.findColumnChecks = function (column) {
        return this.checks.filter(function (check) {
            return !!check.columnNames.find(function (columnName) { return columnName === column.name; });
        });
    };
    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------
    /**
     * Creates table from a given entity metadata.
     */
    Table.create = function (entityMetadata, driver) {
        var options = {
            name: driver.buildTableName(entityMetadata.tableName, entityMetadata.schema, entityMetadata.database),
            engine: entityMetadata.engine,
            columns: entityMetadata.columns
                .filter(function (column) { return column; })
                .map(function (column) { return TableUtils.createTableColumnOptions(column, driver); }),
            indices: entityMetadata.indices
                .filter(function (index) { return index.synchronize === true; })
                .map(function (index) { return TableIndex.create(index); }),
            uniques: entityMetadata.uniques.map(function (unique) { return TableUnique.create(unique); }),
            checks: entityMetadata.checks.map(function (check) { return TableCheck.create(check); }),
            exclusions: entityMetadata.exclusions.map(function (exclusion) { return TableExclusion.create(exclusion); }),
        };
        return new Table(options);
    };
    return Table;
}());
export { Table };

//# sourceMappingURL=Table.js.map
