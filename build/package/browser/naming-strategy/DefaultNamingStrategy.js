import { __read, __spreadArray } from "tslib";
import { RandomGenerator } from "../util/RandomGenerator";
import { camelCase, snakeCase, titleCase } from "../util/StringUtils";
import { Table } from "../schema-builder/table/Table";
/**
 * Naming strategy that is used by default.
 */
var DefaultNamingStrategy = /** @class */ (function () {
    function DefaultNamingStrategy() {
        this.nestedSetColumnNames = { left: "nsleft", right: "nsright" };
        this.materializedPathColumnName = "mpath";
    }
    /**
     * Normalizes table name.
     *
     * @param targetName Name of the target entity that can be used to generate a table name.
     * @param userSpecifiedName For example if user specified a table name in a decorator, e.g. @Entity("name")
     */
    DefaultNamingStrategy.prototype.tableName = function (targetName, userSpecifiedName) {
        return userSpecifiedName ? userSpecifiedName : snakeCase(targetName);
    };
    /**
     * Creates a table name for a junction table of a closure table.
     *
     * @param originalClosureTableName Name of the closure table which owns this junction table.
     */
    DefaultNamingStrategy.prototype.closureJunctionTableName = function (originalClosureTableName) {
        return originalClosureTableName + "_closure";
    };
    DefaultNamingStrategy.prototype.columnName = function (propertyName, customName, embeddedPrefixes) {
        var name = customName || propertyName;
        if (embeddedPrefixes.length)
            return camelCase(embeddedPrefixes.join("_")) + titleCase(name);
        return name;
    };
    DefaultNamingStrategy.prototype.relationName = function (propertyName) {
        return propertyName;
    };
    DefaultNamingStrategy.prototype.primaryKeyName = function (tableOrName, columnNames) {
        // sort incoming column names to avoid issue when ["id", "name"] and ["name", "id"] arrays
        var clonedColumnNames = __spreadArray([], __read(columnNames));
        clonedColumnNames.sort();
        var tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
        var replacedTableName = tableName.replace(".", "_");
        var key = replacedTableName + "_" + clonedColumnNames.join("_");
        return "PK_" + RandomGenerator.sha1(key).substr(0, 27);
    };
    DefaultNamingStrategy.prototype.uniqueConstraintName = function (tableOrName, columnNames) {
        // sort incoming column names to avoid issue when ["id", "name"] and ["name", "id"] arrays
        var clonedColumnNames = __spreadArray([], __read(columnNames));
        clonedColumnNames.sort();
        var tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
        var replacedTableName = tableName.replace(".", "_");
        var key = replacedTableName + "_" + clonedColumnNames.join("_");
        return "UQ_" + RandomGenerator.sha1(key).substr(0, 27);
    };
    DefaultNamingStrategy.prototype.relationConstraintName = function (tableOrName, columnNames, where) {
        // sort incoming column names to avoid issue when ["id", "name"] and ["name", "id"] arrays
        var clonedColumnNames = __spreadArray([], __read(columnNames));
        clonedColumnNames.sort();
        var tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
        var replacedTableName = tableName.replace(".", "_");
        var key = replacedTableName + "_" + clonedColumnNames.join("_");
        if (where)
            key += "_" + where;
        return "REL_" + RandomGenerator.sha1(key).substr(0, 26);
    };
    DefaultNamingStrategy.prototype.defaultConstraintName = function (tableOrName, columnName) {
        var tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
        var replacedTableName = tableName.replace(".", "_");
        var key = replacedTableName + "_" + columnName;
        return "DF_" + RandomGenerator.sha1(key).substr(0, 27);
    };
    DefaultNamingStrategy.prototype.foreignKeyName = function (tableOrName, columnNames, _referencedTablePath, _referencedColumnNames) {
        // sort incoming column names to avoid issue when ["id", "name"] and ["name", "id"] arrays
        var clonedColumnNames = __spreadArray([], __read(columnNames));
        clonedColumnNames.sort();
        var tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
        var replacedTableName = tableName.replace(".", "_");
        var key = replacedTableName + "_" + clonedColumnNames.join("_");
        return "FK_" + RandomGenerator.sha1(key).substr(0, 27);
    };
    DefaultNamingStrategy.prototype.indexName = function (tableOrName, columnNames, where) {
        // sort incoming column names to avoid issue when ["id", "name"] and ["name", "id"] arrays
        var clonedColumnNames = __spreadArray([], __read(columnNames));
        clonedColumnNames.sort();
        var tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
        var replacedTableName = tableName.replace(".", "_");
        var key = replacedTableName + "_" + clonedColumnNames.join("_");
        if (where)
            key += "_" + where;
        return "IDX_" + RandomGenerator.sha1(key).substr(0, 26);
    };
    DefaultNamingStrategy.prototype.checkConstraintName = function (tableOrName, expression, isEnum) {
        var tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
        var replacedTableName = tableName.replace(".", "_");
        var key = replacedTableName + "_" + expression;
        var name = "CHK_" + RandomGenerator.sha1(key).substr(0, 26);
        return isEnum ? name + "_ENUM" : name;
    };
    DefaultNamingStrategy.prototype.exclusionConstraintName = function (tableOrName, expression) {
        var tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
        var replacedTableName = tableName.replace(".", "_");
        var key = replacedTableName + "_" + expression;
        return "XCL_" + RandomGenerator.sha1(key).substr(0, 26);
    };
    DefaultNamingStrategy.prototype.joinColumnName = function (relationName, referencedColumnName) {
        return camelCase(relationName + "_" + referencedColumnName);
    };
    DefaultNamingStrategy.prototype.joinTableName = function (firstTableName, secondTableName, firstPropertyName, secondPropertyName) {
        return snakeCase(firstTableName + "_" + firstPropertyName.replace(/\./gi, "_") + "_" + secondTableName);
    };
    DefaultNamingStrategy.prototype.joinTableColumnDuplicationPrefix = function (columnName, index) {
        return columnName + "_" + index;
    };
    DefaultNamingStrategy.prototype.joinTableColumnName = function (tableName, propertyName, columnName) {
        return camelCase(tableName + "_" + (columnName ? columnName : propertyName));
    };
    DefaultNamingStrategy.prototype.joinTableInverseColumnName = function (tableName, propertyName, columnName) {
        return this.joinTableColumnName(tableName, propertyName, columnName);
    };
    /**
     * Adds globally set prefix to the table name.
     * This method is executed no matter if prefix was set or not.
     * Table name is either user's given table name, either name generated from entity target.
     * Note that table name comes here already normalized by #tableName method.
     */
    DefaultNamingStrategy.prototype.prefixTableName = function (prefix, tableName) {
        return prefix + tableName;
    };
    DefaultNamingStrategy.prototype.eagerJoinRelationAlias = function (alias, propertyPath) {
        return alias + "_" + propertyPath.replace(".", "_");
    };
    return DefaultNamingStrategy;
}());
export { DefaultNamingStrategy };

//# sourceMappingURL=DefaultNamingStrategy.js.map
