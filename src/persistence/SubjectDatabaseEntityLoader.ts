import {Subject} from "./Subject";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {QueryRunner} from "../query-runner/QueryRunner";
import {FindManyOptions} from "../find-options/FindManyOptions";

/**
 * Loads database entities for all operate subjects which do not have database entity set.
 * All entities that we load database entities for are marked as updated or inserted.
 * To understand which of them really needs to be inserted or updated we need to load
 * their original representations from the database.
 */
export class SubjectDatabaseEntityLoader {

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(protected queryRunner: QueryRunner,
                protected subjects: Subject[]) {
    }

    // ---------------------------------------------------------------------
    // Public Methods
    // ---------------------------------------------------------------------

    /**
     * Loads database entities for all subjects.
     *
     * loadAllRelations flag is used to load all relation ids of the object, no matter if they present in subject entity or not.
     * This option is used for deletion.
     */
    async load(operationType: "save"|"remove"): Promise<void> {

        // we are grouping subjects by target to perform more optimized queries using WHERE IN operator
        // go through the groups and perform loading of database entities of each subject in the group
        const promises = this.groupByEntityTargets().map(async subjectGroup => {

            // prepare entity ids of the subjects we need to load
            const allIds: ObjectLiteral[] = [];
            subjectGroup.subjects.forEach(subject => {

                // we don't load if subject already has a database entity loaded
                if (subject.databaseEntity)
                    return;

                // we only need entity id
                if (subject.metadata.isEntityIdMapEmpty(subject.entity!)) // can we use getEntityIdMap instead
                    return;

                allIds.push(subject.metadata.getEntityIdMap(subject.entity!)!);
            });

            // if there no ids found (means all entities are new and have generated ids) - then nothing to load there
            if (!allIds.length)
                return;

            const loadRelationPropertyPaths: string[] = [];

            // for the save operation
            // extract all property paths of the relations we need to load relation ids for
            // this is for optimization purpose - this way we don't load relation ids for entities
            // whose relations are undefined, and since they are undefined its really pointless to
            // load something for them, since undefined properties are skipped by the orm
            if (operationType === "save") {
                subjectGroup.subjects.forEach(subject => {

                    // gets all relation property paths that exist in the persisted entity.
                    subject.metadata.relations
                        .filter(relation => relation.getEntityValue(subject.entity!) !== undefined)
                        .map(relation => relation.propertyPath)
                        .forEach(propertyPath => {
                            if (loadRelationPropertyPaths.indexOf(propertyPath) === -1)
                                loadRelationPropertyPaths.push(propertyPath);
                        });
                });
            } else { // remove

                // for remove operation
                // we only need to load junction relation ids since only they are removed by cascades
                loadRelationPropertyPaths.push(...subjectGroup.subjects[0].metadata.manyToManyRelations.map(relation => relation.propertyPath));
            }

            const findOptions: FindManyOptions<any> = {
                loadRelationIds: {
                    relations: loadRelationPropertyPaths,
                    disableMixedMap: true
                }
            };

            // load database entities for all given ids
            const entities = await this.queryRunner.manager
                .getRepository<ObjectLiteral>(subjectGroup.target)
                .findByIds(allIds, findOptions);

            // now when we have entities we need to find subject of each entity
            // and insert that entity into database entity of the found subject
            entities.forEach(entity => {
                const subject = this.findByPersistEntityLike(subjectGroup.target, entity);
                if (subject) {
                    subject.databaseEntity = entity;
                    if (!subject.identifier)
                        subject.identifier = subject.metadata.isEntityIdMapEmpty(entity) ? undefined : subject.metadata.getEntityIdMap(entity);
                }
            });

        });

        await Promise.all(promises);
    }

    // ---------------------------------------------------------------------
    // Protected Methods
    // ---------------------------------------------------------------------

    /**
     * Finds subject where entity like given subject's entity.
     * Comparision made by entity id.
     */
    protected findByPersistEntityLike(entityTarget: Function|string, entity: ObjectLiteral): Subject|undefined {
        return this.subjects.find(subject => {
            if (!subject.entity)
                return false;

            if (subject.entity === entity)
                return true;

            return subject.metadata.target === entityTarget && subject.metadata.compareEntities(subject.entity, entity);
        });
    }

    /**
     * Groups given Subject objects into groups separated by entity targets.
     */
    protected groupByEntityTargets(): { target: Function|string, subjects: Subject[] }[] {
        return this.subjects.reduce((groups, operatedEntity) => {
            let group = groups.find(group => group.target === operatedEntity.metadata.target);
            if (!group) {
                group = { target: operatedEntity.metadata.target, subjects: [] };
                groups.push(group);
            }
            group.subjects.push(operatedEntity);
            return groups;
        }, [] as { target: Function|string, subjects: Subject[] }[]);
    }

}