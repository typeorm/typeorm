"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClosureSubjectExecutor = void 0;
var tslib_1 = require("tslib");
var CannotAttachTreeChildrenEntityError_1 = require("../../error/CannotAttachTreeChildrenEntityError");
/**
 * Executes subject operations for closure entities.
 */
var ClosureSubjectExecutor = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function ClosureSubjectExecutor(queryRunner) {
        this.queryRunner = queryRunner;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Removes all children of the given subject's entity.

     async deleteChildrenOf(subject: Subject) {
        // const relationValue = subject.metadata.treeParentRelation.getEntityValue(subject.databaseEntity);
        // console.log("relationValue: ", relationValue);
        // this.queryRunner.manager
        //     .createQueryBuilder()
        //     .from(subject.metadata.closureJunctionTable.target, "tree")
        //     .where("tree.");
    }*/
    /**
     * Executes operations when subject is being inserted.
     */
    ClosureSubjectExecutor.prototype.insert = function (subject) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var closureJunctionInsertMap, parent, escape_1, tableName, ancestorColumnNames, descendantColumnNames, firstQueryParameters_1, childEntityIdValues_1, childEntityIds1, whereCondition;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        closureJunctionInsertMap = {};
                        subject.metadata.closureJunctionTable.ancestorColumns.forEach(function (column) {
                            closureJunctionInsertMap[column.databaseName] = subject.identifier;
                        });
                        subject.metadata.closureJunctionTable.descendantColumns.forEach(function (column) {
                            closureJunctionInsertMap[column.databaseName] = subject.identifier;
                        });
                        // insert values into the closure junction table
                        return [4 /*yield*/, this.queryRunner
                                .manager
                                .createQueryBuilder()
                                .insert()
                                .into(subject.metadata.closureJunctionTable.tablePath)
                                .values(closureJunctionInsertMap)
                                .updateEntity(false)
                                .callListeners(false)
                                .execute()];
                    case 1:
                        // insert values into the closure junction table
                        _a.sent();
                        parent = subject.metadata.treeParentRelation.getEntityValue(subject.entity);
                        if (!parent && subject.parentSubject && subject.parentSubject.entity) // if entity was attached via children
                            parent = subject.parentSubject.insertedValueSet ? subject.parentSubject.insertedValueSet : subject.parentSubject.entity;
                        if (!parent) return [3 /*break*/, 3];
                        escape_1 = function (alias) { return _this.queryRunner.connection.driver.escape(alias); };
                        tableName = this.getTableName(subject.metadata.closureJunctionTable.tablePath);
                        ancestorColumnNames = subject.metadata.closureJunctionTable.ancestorColumns.map(function (column) {
                            return escape_1(column.databaseName);
                        });
                        descendantColumnNames = subject.metadata.closureJunctionTable.descendantColumns.map(function (column) {
                            return escape_1(column.databaseName);
                        });
                        firstQueryParameters_1 = [];
                        childEntityIdValues_1 = subject.metadata.primaryColumns.map(function (column) { return column.getEntityValue(subject.insertedValueSet); });
                        childEntityIds1 = subject.metadata.primaryColumns.map(function (column, index) {
                            firstQueryParameters_1.push(childEntityIdValues_1[index]);
                            return _this.queryRunner.connection.driver.createParameter("child_entity_" + column.databaseName, firstQueryParameters_1.length - 1);
                        });
                        whereCondition = subject.metadata.closureJunctionTable.descendantColumns.map(function (column) {
                            var columnName = escape_1(column.databaseName);
                            var parentId = column.referencedColumn.getEntityValue(parent);
                            if (!parentId)
                                throw new CannotAttachTreeChildrenEntityError_1.CannotAttachTreeChildrenEntityError(subject.metadata.name);
                            firstQueryParameters_1.push(parentId);
                            var parameterName = _this.queryRunner.connection.driver.createParameter("parent_entity_" + column.referencedColumn.databaseName, firstQueryParameters_1.length - 1);
                            return columnName + " = " + parameterName;
                        }).join(", ");
                        return [4 /*yield*/, this.queryRunner.query("INSERT INTO " + tableName + " (" + tslib_1.__spreadArray(tslib_1.__spreadArray([], tslib_1.__read(ancestorColumnNames)), tslib_1.__read(descendantColumnNames)).join(", ") + ") " +
                                ("SELECT " + ancestorColumnNames.join(", ") + ", " + childEntityIds1.join(", ") + " FROM " + tableName + " WHERE " + whereCondition), firstQueryParameters_1)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets escaped table name with schema name if SqlServer or Postgres driver used with custom
     * schema name, otherwise returns escaped table name.
     */
    ClosureSubjectExecutor.prototype.getTableName = function (tablePath) {
        var _this = this;
        return tablePath.split(".")
            .map(function (i) {
            // this condition need because in SQL Server driver when custom database name was specified and schema name was not, we got `dbName..tableName` string, and doesn't need to escape middle empty string
            if (i === "")
                return i;
            return _this.queryRunner.connection.driver.escape(i);
        }).join(".");
    };
    return ClosureSubjectExecutor;
}());
exports.ClosureSubjectExecutor = ClosureSubjectExecutor;

//# sourceMappingURL=ClosureSubjectExecutor.js.map
