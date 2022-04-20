"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterializedPathSubjectExecutor = void 0;
var tslib_1 = require("tslib");
/**
 * Executes subject operations for materialized-path tree entities.
 */
var MaterializedPathSubjectExecutor = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function MaterializedPathSubjectExecutor(queryRunner) {
        this.queryRunner = queryRunner;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Executes operations when subject is being inserted.
     */
    MaterializedPathSubjectExecutor.prototype.insert = function (subject) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var parent, parentId, parentPath, insertedEntityId;
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        parent = subject.metadata.treeParentRelation.getEntityValue(subject.entity);
                        if (!parent && subject.parentSubject && subject.parentSubject.entity) // if entity was attached via children
                            parent = subject.parentSubject.insertedValueSet ? subject.parentSubject.insertedValueSet : subject.parentSubject.entity;
                        parentId = subject.metadata.getEntityIdMap(parent);
                        parentPath = "";
                        if (!parentId) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.queryRunner.manager
                                .createQueryBuilder()
                                .select(subject.metadata.targetName + "." + subject.metadata.materializedPathColumn.propertyPath, "path")
                                .from(subject.metadata.target, subject.metadata.targetName)
                                .whereInIds(parentId)
                                .getRawOne()
                                .then(function (result) { return result ? result["path"] : undefined; })];
                    case 1:
                        parentPath = _b.sent();
                        _b.label = 2;
                    case 2:
                        insertedEntityId = subject.metadata.treeParentRelation.joinColumns.map(function (joinColumn) {
                            return joinColumn.referencedColumn.getEntityValue(subject.insertedValueSet);
                        }).join("_");
                        return [4 /*yield*/, this.queryRunner.manager
                                .createQueryBuilder()
                                .update(subject.metadata.target)
                                .set((_a = {},
                                _a[subject.metadata.materializedPathColumn.propertyPath] = parentPath + insertedEntityId + ".",
                                _a))
                                .where(subject.identifier)
                                .execute()];
                    case 3:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return MaterializedPathSubjectExecutor;
}());
exports.MaterializedPathSubjectExecutor = MaterializedPathSubjectExecutor;

//# sourceMappingURL=MaterializedPathSubjectExecutor.js.map
