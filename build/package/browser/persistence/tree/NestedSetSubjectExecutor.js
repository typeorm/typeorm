import { __awaiter, __generator } from "tslib";
import { OrmUtils } from "../../util/OrmUtils";
/**
 * Executes subject operations for nested set tree entities.
 */
var NestedSetSubjectExecutor = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function NestedSetSubjectExecutor(queryRunner) {
        this.queryRunner = queryRunner;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Executes operations when subject is being inserted.
     */
    NestedSetSubjectExecutor.prototype.insert = function (subject) {
        return __awaiter(this, void 0, void 0, function () {
            var escape, tableName, leftColumnName, rightColumnName, parent, parentId, parentNsRight;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        escape = function (alias) { return _this.queryRunner.connection.driver.escape(alias); };
                        tableName = this.getTableName(subject.metadata.tablePath);
                        leftColumnName = escape(subject.metadata.nestedSetLeftColumn.databaseName);
                        rightColumnName = escape(subject.metadata.nestedSetRightColumn.databaseName);
                        parent = subject.metadata.treeParentRelation.getEntityValue(subject.entity);
                        if (!parent && subject.parentSubject && subject.parentSubject.entity) // if entity was attached via children
                            parent = subject.parentSubject.insertedValueSet ? subject.parentSubject.insertedValueSet : subject.parentSubject.entity;
                        parentId = subject.metadata.getEntityIdMap(parent);
                        parentNsRight = undefined;
                        if (!parentId) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.queryRunner.manager
                                .createQueryBuilder()
                                .select(subject.metadata.targetName + "." + subject.metadata.nestedSetRightColumn.propertyPath, "right")
                                .from(subject.metadata.target, subject.metadata.targetName)
                                .whereInIds(parentId)
                                .getRawOne()
                                .then(function (result) {
                                var value = result ? result["right"] : undefined;
                                // CockroachDB returns numeric types as string
                                return typeof value === "string" ? parseInt(value) : value;
                            })];
                    case 1:
                        parentNsRight = _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!(parentNsRight !== undefined)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.queryRunner.query("UPDATE " + tableName + " SET " +
                                (leftColumnName + " = CASE WHEN " + leftColumnName + " > " + parentNsRight + " THEN " + leftColumnName + " + 2 ELSE " + leftColumnName + " END,") +
                                (rightColumnName + " = " + rightColumnName + " + 2 ") +
                                ("WHERE " + rightColumnName + " >= " + parentNsRight))];
                    case 3:
                        _a.sent();
                        OrmUtils.mergeDeep(subject.insertedValueSet, subject.metadata.nestedSetLeftColumn.createValueMap(parentNsRight), subject.metadata.nestedSetRightColumn.createValueMap(parentNsRight + 1));
                        return [3 /*break*/, 5];
                    case 4:
                        OrmUtils.mergeDeep(subject.insertedValueSet, subject.metadata.nestedSetLeftColumn.createValueMap(1), subject.metadata.nestedSetRightColumn.createValueMap(2));
                        _a.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets escaped table name with schema name if SqlServer or Postgres driver used with custom
     * schema name, otherwise returns escaped table name.
     */
    NestedSetSubjectExecutor.prototype.getTableName = function (tablePath) {
        var _this = this;
        return tablePath.split(".")
            .map(function (i) {
            // this condition need because in SQL Server driver when custom database name was specified and schema name was not, we got `dbName..tableName` string, and doesn't need to escape middle empty string
            if (i === "")
                return i;
            return _this.queryRunner.connection.driver.escape(i);
        }).join(".");
    };
    return NestedSetSubjectExecutor;
}());
export { NestedSetSubjectExecutor };

//# sourceMappingURL=NestedSetSubjectExecutor.js.map
