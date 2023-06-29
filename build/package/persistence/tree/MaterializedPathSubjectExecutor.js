"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterializedPathSubjectExecutor = void 0;
const tslib_1 = require("tslib");
/**
 * Executes subject operations for materialized-path tree entities.
 */
class MaterializedPathSubjectExecutor {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(queryRunner) {
        this.queryRunner = queryRunner;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Executes operations when subject is being inserted.
     */
    insert(subject) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let parent = subject.metadata.treeParentRelation.getEntityValue(subject.entity); // if entity was attached via parent
            if (!parent && subject.parentSubject && subject.parentSubject.entity) // if entity was attached via children
                parent = subject.parentSubject.insertedValueSet ? subject.parentSubject.insertedValueSet : subject.parentSubject.entity;
            const parentId = subject.metadata.getEntityIdMap(parent);
            let parentPath = "";
            if (parentId) {
                parentPath = yield this.queryRunner.manager
                    .createQueryBuilder()
                    .select(subject.metadata.targetName + "." + subject.metadata.materializedPathColumn.propertyPath, "path")
                    .from(subject.metadata.target, subject.metadata.targetName)
                    .whereInIds(parentId)
                    .getRawOne()
                    .then(result => result ? result["path"] : undefined);
            }
            const insertedEntityId = subject.metadata.treeParentRelation.joinColumns.map(joinColumn => {
                return joinColumn.referencedColumn.getEntityValue(subject.insertedValueSet);
            }).join("_");
            yield this.queryRunner.manager
                .createQueryBuilder()
                .update(subject.metadata.target)
                .set({
                [subject.metadata.materializedPathColumn.propertyPath]: parentPath + insertedEntityId + "."
            })
                .where(subject.identifier)
                .execute();
        });
    }
}
exports.MaterializedPathSubjectExecutor = MaterializedPathSubjectExecutor;

//# sourceMappingURL=MaterializedPathSubjectExecutor.js.map
