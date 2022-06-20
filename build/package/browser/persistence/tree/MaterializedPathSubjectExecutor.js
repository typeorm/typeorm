import { OrmUtils } from "../../util/OrmUtils";
/**
 * Executes subject operations for materialized-path tree entities.
 */
export class MaterializedPathSubjectExecutor {
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
    async insert(subject) {
        let parent = subject.metadata.treeParentRelation.getEntityValue(subject.entity); // if entity was attached via parent
        if (!parent && subject.parentSubject && subject.parentSubject.entity)
            // if entity was attached via children
            parent = subject.parentSubject.insertedValueSet
                ? subject.parentSubject.insertedValueSet
                : subject.parentSubject.entity;
        const parentId = subject.metadata.getEntityIdMap(parent);
        let parentPath = "";
        if (parentId) {
            parentPath = await this.getEntityPath(subject, parentId);
        }
        const insertedEntityId = subject.metadata
            .treeParentRelation.joinColumns.map((joinColumn) => {
            return joinColumn.referencedColumn.getEntityValue(subject.insertedValueSet);
        })
            .join("_");
        await this.queryRunner.manager
            .createQueryBuilder()
            .update(subject.metadata.target)
            .set({
            [subject.metadata.materializedPathColumn.propertyPath]: parentPath + insertedEntityId + ".",
        })
            .where(subject.identifier)
            .execute();
    }
    /**
     * Executes operations when subject is being updated.
     */
    async update(subject) {
        let newParent = subject.metadata.treeParentRelation.getEntityValue(subject.entity); // if entity was attached via parent
        if (!newParent && subject.parentSubject && subject.parentSubject.entity)
            // if entity was attached via children
            newParent = subject.parentSubject.entity;
        let entity = subject.databaseEntity; // if entity was attached via parent
        if (!entity && newParent)
            // if entity was attached via children
            entity = subject.metadata
                .treeChildrenRelation.getEntityValue(newParent)
                .find((child) => {
                return Object.entries(subject.identifier).every(([key, value]) => child[key] === value);
            });
        const oldParent = subject.metadata.treeParentRelation.getEntityValue(entity);
        const oldParentId = subject.metadata.getEntityIdMap(oldParent);
        const newParentId = subject.metadata.getEntityIdMap(newParent);
        // Exit if the new and old parents are the same
        if (OrmUtils.compareIds(oldParentId, newParentId)) {
            return;
        }
        let newParentPath = "";
        if (newParentId) {
            newParentPath = await this.getEntityPath(subject, newParentId);
        }
        let oldParentPath = "";
        if (oldParentId) {
            oldParentPath =
                (await this.getEntityPath(subject, oldParentId)) || "";
        }
        const entityPath = subject.metadata
            .treeParentRelation.joinColumns.map((joinColumn) => {
            return joinColumn.referencedColumn.getEntityValue(entity);
        })
            .join("_");
        const propertyPath = subject.metadata.materializedPathColumn.propertyPath;
        await this.queryRunner.manager
            .createQueryBuilder()
            .update(subject.metadata.target)
            .set({
            [propertyPath]: () => `REPLACE(${propertyPath}, '${oldParentPath}${entityPath}.', '${newParentPath}${entityPath}.')`,
        })
            .where(`${propertyPath} LIKE :path`, {
            path: `${oldParentPath}${entityPath}.%`,
        })
            .execute();
    }
    getEntityPath(subject, id) {
        return this.queryRunner.manager
            .createQueryBuilder()
            .select(subject.metadata.targetName +
            "." +
            subject.metadata.materializedPathColumn.propertyPath, "path")
            .from(subject.metadata.target, subject.metadata.targetName)
            .whereInIds(id)
            .getRawOne()
            .then((result) => (result ? result["path"] : ""));
    }
}

//# sourceMappingURL=MaterializedPathSubjectExecutor.js.map
