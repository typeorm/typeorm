"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniqueMetadata = void 0;
/**
 * Unique metadata contains all information about table's unique constraints.
 */
var UniqueMetadata = /** @class */ (function () {
    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------
    function UniqueMetadata(options) {
        /**
         * Unique columns.
         */
        this.columns = [];
        /**
         * Map of column names with order set.
         * Used only by MongoDB driver.
         */
        this.columnNamesWithOrderingMap = {};
        this.entityMetadata = options.entityMetadata;
        this.embeddedMetadata = options.embeddedMetadata;
        if (options.columns)
            this.columns = options.columns;
        if (options.args) {
            this.target = options.args.target;
            this.givenName = options.args.name;
            this.givenColumnNames = options.args.columns;
        }
    }
    // ---------------------------------------------------------------------
    // Public Build Methods
    // ---------------------------------------------------------------------
    /**
     * Builds some depend unique constraint properties.
     * Must be called after all entity metadata's properties map, columns and relations are built.
     */
    UniqueMetadata.prototype.build = function (namingStrategy) {
        var _this = this;
        var map = {};
        // if columns already an array of string then simply return it
        if (this.givenColumnNames) {
            var columnPropertyPaths = [];
            if (Array.isArray(this.givenColumnNames)) {
                columnPropertyPaths = this.givenColumnNames.map(function (columnName) {
                    if (_this.embeddedMetadata)
                        return _this.embeddedMetadata.propertyPath + "." + columnName;
                    return columnName;
                });
                columnPropertyPaths.forEach(function (propertyPath) { return map[propertyPath] = 1; });
            }
            else {
                // if columns is a function that returns array of field names then execute it and get columns names from it
                var columnsFnResult_1 = this.givenColumnNames(this.entityMetadata.propertiesMap);
                if (Array.isArray(columnsFnResult_1)) {
                    columnPropertyPaths = columnsFnResult_1.map(function (i) { return String(i); });
                    columnPropertyPaths.forEach(function (name) { return map[name] = 1; });
                }
                else {
                    columnPropertyPaths = Object.keys(columnsFnResult_1).map(function (i) { return String(i); });
                    Object.keys(columnsFnResult_1).forEach(function (columnName) { return map[columnName] = columnsFnResult_1[columnName]; });
                }
            }
            this.columns = columnPropertyPaths.map(function (propertyName) {
                var columnWithSameName = _this.entityMetadata.columns.find(function (column) { return column.propertyPath === propertyName; });
                if (columnWithSameName) {
                    return [columnWithSameName];
                }
                var relationWithSameName = _this.entityMetadata.relations.find(function (relation) { return relation.isWithJoinColumn && relation.propertyName === propertyName; });
                if (relationWithSameName) {
                    return relationWithSameName.joinColumns;
                }
                var indexName = _this.givenName ? "\"" + _this.givenName + "\" " : "";
                var entityName = _this.entityMetadata.targetName;
                throw new Error("Unique constraint " + indexName + "contains column that is missing in the entity (" + entityName + "): " + propertyName);
            })
                .reduce(function (a, b) { return a.concat(b); });
        }
        this.columnNamesWithOrderingMap = Object.keys(map).reduce(function (updatedMap, key) {
            var column = _this.entityMetadata.columns.find(function (column) { return column.propertyPath === key; });
            if (column)
                updatedMap[column.databasePath] = map[key];
            return updatedMap;
        }, {});
        this.name = this.givenName ? this.givenName : namingStrategy.uniqueConstraintName(this.entityMetadata.tablePath, this.columns.map(function (column) { return column.databaseName; }));
        return this;
    };
    return UniqueMetadata;
}());
exports.UniqueMetadata = UniqueMetadata;

//# sourceMappingURL=UniqueMetadata.js.map
