import {Subject} from "../Subject";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {OrmUtils} from "../../util/OrmUtils";
import {ObjectLiteral} from "../../common/ObjectLiteral";

/**
 * Executes subject operations for materialized-path tree entities.
 */
export class MaterializedPathSubjectExecutor {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected queryRunner: QueryRunner) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Executes operations when subject is being inserted.
     */
    async insert(subject: Subject): Promise<void> {
        let parent = subject.metadata.treeParentRelation!.getEntityValue(subject.entity!); // if entity was attached via parent
        if (!parent && subject.parentSubject && subject.parentSubject.entity) // if entity was attached via children
            parent = subject.parentSubject.insertedValueSet ? subject.parentSubject.insertedValueSet : subject.parentSubject.entity;

        const parentId = subject.metadata.getEntityIdMap(parent);

        let parentPath: string = "";
        if (parentId) {
            parentPath = await this.getEntityPath(subject, parentId);
        }

        const insertedEntityId = subject.metadata.treeParentRelation!.joinColumns.map(joinColumn => {
            return joinColumn.referencedColumn!.getEntityValue(subject.insertedValueSet!);
        }).join("_");

        await this.queryRunner.manager
            .createQueryBuilder()
            .update(subject.metadata.target)
            .set({
                [subject.metadata.materializedPathColumn!.propertyPath]: parentPath + insertedEntityId + "."
            } as any)
            .where(subject.identifier!)
            .execute();
    }

    /**
     * Executes operations when subject is being updated.
     */
    async update(subject: Subject): Promise<void> {
        let newParent = subject.metadata.treeParentRelation!.getEntityValue(subject.entity!); // if entity was attached via parent
        if (!newParent && subject.parentSubject && subject.parentSubject.entity) // if entity was attached via children
            newParent = subject.parentSubject.entity;

        let entity = subject.databaseEntity; // if entity was attached via parent
        if (!entity && newParent) // if entity was attached via children
            entity = subject.metadata.treeChildrenRelation!.getEntityValue(newParent).find((child: any) => {
                return Object.entries(subject.identifier!).every(([key, value]) => child[key] === value);
            });


        const oldParent = subject.metadata.treeParentRelation!.getEntityValue(entity!);
        const oldParentId = subject.metadata.getEntityIdMap(oldParent);
        const newParentId = subject.metadata.getEntityIdMap(newParent);

        // Exit if the new and old parents are the same
        if (OrmUtils.compareIds(oldParentId, newParentId)) {
            return;
        }

        let newParentPath: string = "";
        if (newParentId) {
            newParentPath = await this.getEntityPath(subject, newParentId);
        }

        let oldParentPath: string = "";
        if (oldParentId) {
            oldParentPath = await this.getEntityPath(subject, oldParentId) || "";
        }

        const entityPath = subject.metadata.treeParentRelation!.joinColumns.map(joinColumn => {
            return joinColumn.referencedColumn!.getEntityValue(entity!);
        }).join("_");

        const propertyPath = subject.metadata.materializedPathColumn!.propertyPath;
        await this.queryRunner.manager
            .createQueryBuilder()
            .update(subject.metadata.target)
            .set({
                [propertyPath]: () => `REPLACE(${propertyPath}, '${oldParentPath}${entityPath}.', '${newParentPath}${entityPath}.')`
            } as any)
            .where(`${propertyPath} LIKE :path`, { path: `${oldParentPath}${entityPath}.%` })
            .execute();
    }

    private getEntityPath(subject: Subject, id: ObjectLiteral): Promise<string> {
        return this.queryRunner.manager
            .createQueryBuilder()
            .select(subject.metadata.targetName + "." + subject.metadata.materializedPathColumn!.propertyPath, "path")
            .from(subject.metadata.target, subject.metadata.targetName)
            .whereInIds(id)
            .getRawOne()
            .then(result => result ? result["path"] : "");
    }
}
