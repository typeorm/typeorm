import { RandomGenerator } from "../util/RandomGenerator";
import { camelCase, snakeCase, titleCase } from "../util/StringUtils";
/**
 * Naming strategy that is used by default.
 */
export class DefaultNamingStrategy {
    constructor() {
        this.nestedSetColumnNames = { left: "nsleft", right: "nsright" };
        this.materializedPathColumnName = "mpath";
    }
    getTableName(tableOrName) {
        if (typeof tableOrName !== "string") {
            tableOrName = tableOrName.name;
        }
        return tableOrName.split(".").pop();
    }
    /**
     * Normalizes table name.
     *
     * @param targetName Name of the target entity that can be used to generate a table name.
     * @param userSpecifiedName For example if user specified a table name in a decorator, e.g. @Entity("name")
     */
    tableName(targetName, userSpecifiedName) {
        return userSpecifiedName ? userSpecifiedName : snakeCase(targetName);
    }
    /**
     * Creates a table name for a junction table of a closure table.
     *
     * @param originalClosureTableName Name of the closure table which owns this junction table.
     */
    closureJunctionTableName(originalClosureTableName) {
        return originalClosureTableName + "_closure";
    }
    columnName(propertyName, customName, embeddedPrefixes) {
        const name = customName || propertyName;
        if (embeddedPrefixes.length)
            return camelCase(embeddedPrefixes.join("_")) + titleCase(name);
        return name;
    }
    relationName(propertyName) {
        return propertyName;
    }
    primaryKeyName(tableOrName, columnNames) {
        // sort incoming column names to avoid issue when ["id", "name"] and ["name", "id"] arrays
        const clonedColumnNames = [...columnNames];
        clonedColumnNames.sort();
        const tableName = this.getTableName(tableOrName);
        const replacedTableName = tableName.replace(".", "_");
        const key = `${replacedTableName}_${clonedColumnNames.join("_")}`;
        return "PK_" + RandomGenerator.sha1(key).substr(0, 27);
    }
    uniqueConstraintName(tableOrName, columnNames) {
        // sort incoming column names to avoid issue when ["id", "name"] and ["name", "id"] arrays
        const clonedColumnNames = [...columnNames];
        clonedColumnNames.sort();
        const tableName = this.getTableName(tableOrName);
        const replacedTableName = tableName.replace(".", "_");
        const key = `${replacedTableName}_${clonedColumnNames.join("_")}`;
        return "UQ_" + RandomGenerator.sha1(key).substr(0, 27);
    }
    relationConstraintName(tableOrName, columnNames, where) {
        // sort incoming column names to avoid issue when ["id", "name"] and ["name", "id"] arrays
        const clonedColumnNames = [...columnNames];
        clonedColumnNames.sort();
        const tableName = this.getTableName(tableOrName);
        const replacedTableName = tableName.replace(".", "_");
        let key = `${replacedTableName}_${clonedColumnNames.join("_")}`;
        if (where)
            key += `_${where}`;
        return "REL_" + RandomGenerator.sha1(key).substr(0, 26);
    }
    defaultConstraintName(tableOrName, columnName) {
        const tableName = this.getTableName(tableOrName);
        const replacedTableName = tableName.replace(".", "_");
        const key = `${replacedTableName}_${columnName}`;
        return "DF_" + RandomGenerator.sha1(key).substr(0, 27);
    }
    foreignKeyName(tableOrName, columnNames, _referencedTablePath, _referencedColumnNames) {
        // sort incoming column names to avoid issue when ["id", "name"] and ["name", "id"] arrays
        const clonedColumnNames = [...columnNames];
        clonedColumnNames.sort();
        const tableName = this.getTableName(tableOrName);
        const replacedTableName = tableName.replace(".", "_");
        const key = `${replacedTableName}_${clonedColumnNames.join("_")}`;
        return "FK_" + RandomGenerator.sha1(key).substr(0, 27);
    }
    indexName(tableOrName, columnNames, where) {
        // sort incoming column names to avoid issue when ["id", "name"] and ["name", "id"] arrays
        const clonedColumnNames = [...columnNames];
        clonedColumnNames.sort();
        const tableName = this.getTableName(tableOrName);
        const replacedTableName = tableName.replace(".", "_");
        let key = `${replacedTableName}_${clonedColumnNames.join("_")}`;
        if (where)
            key += `_${where}`;
        return "IDX_" + RandomGenerator.sha1(key).substr(0, 26);
    }
    checkConstraintName(tableOrName, expression, isEnum) {
        const tableName = this.getTableName(tableOrName);
        const replacedTableName = tableName.replace(".", "_");
        const key = `${replacedTableName}_${expression}`;
        const name = "CHK_" + RandomGenerator.sha1(key).substr(0, 26);
        return isEnum ? `${name}_ENUM` : name;
    }
    exclusionConstraintName(tableOrName, expression) {
        const tableName = this.getTableName(tableOrName);
        const replacedTableName = tableName.replace(".", "_");
        const key = `${replacedTableName}_${expression}`;
        return "XCL_" + RandomGenerator.sha1(key).substr(0, 26);
    }
    joinColumnName(relationName, referencedColumnName) {
        return camelCase(relationName + "_" + referencedColumnName);
    }
    joinTableName(firstTableName, secondTableName, firstPropertyName, secondPropertyName) {
        return snakeCase(firstTableName +
            "_" +
            firstPropertyName.replace(/\./gi, "_") +
            "_" +
            secondTableName);
    }
    joinTableColumnDuplicationPrefix(columnName, index) {
        return columnName + "_" + index;
    }
    joinTableColumnName(tableName, propertyName, columnName) {
        return camelCase(tableName + "_" + (columnName ? columnName : propertyName));
    }
    joinTableInverseColumnName(tableName, propertyName, columnName) {
        return this.joinTableColumnName(tableName, propertyName, columnName);
    }
    /**
     * Adds globally set prefix to the table name.
     * This method is executed no matter if prefix was set or not.
     * Table name is either user's given table name, either name generated from entity target.
     * Note that table name comes here already normalized by #tableName method.
     */
    prefixTableName(prefix, tableName) {
        return prefix + tableName;
    }
    eagerJoinRelationAlias(alias, propertyPath) {
        return alias + "_" + propertyPath.replace(".", "_");
    }
}

//# sourceMappingURL=DefaultNamingStrategy.js.map
