import {ObjectLiteral} from "../common/ObjectLiteral";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {Connection} from "../connection/Connection";
import {QueryRunner} from "../query-runner/QueryRunner";
import {Subject, JunctionInsert, JunctionRemove} from "./Subject";
import {OrmUtils} from "../util/OrmUtils";
import {QueryRunnerProvider} from "../query-runner/QueryRunnerProvider";
import {EntityManager} from "../entity-manager/EntityManager";
import {PromiseUtils} from "../util/PromiseUtils";
import {MongoDriver} from "../driver/mongodb/MongoDriver";
import {EmbeddedMetadata} from "../metadata/EmbeddedMetadata";

/**
 * Executes all database operations (inserts, updated, deletes) that must be executed
 * with given persistence subjects.
 */
export class SubjectOperationExecutor {

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * All subjects that needs to be operated.
     */
    protected allSubjects: Subject[];

    /**
     * Subjects that must be inserted.
     */
    protected insertSubjects: Subject[];

    /**
     * Subjects that must be updated.
     */
    protected updateSubjects: Subject[];

    /**
     * Subjects that must be removed.
     */
    protected removeSubjects: Subject[];

    /**
     * Subjects which relations should be updated.
     */
    protected relationUpdateSubjects: Subject[];

    /**
     * Query runner used to execute queries.
     */
    protected queryRunner: QueryRunner;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection,
                protected transactionEntityManager: EntityManager,
                protected queryRunnerProvider: QueryRunnerProvider) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Executes all operations over given array of subjects.
     * Executes queries using given query runner.
     */
    async execute(subjects: Subject[]): Promise<void> {

        /*subjects.forEach(subject => {
            console.log(subject.entity);
            console.log("mustBeInserted: ", subject.mustBeInserted);
            console.log("mustBeUpdated: ", subject.mustBeUpdated);
            console.log("mustBeRemoved: ", subject.mustBeRemoved);
        });*/

        // validate all subjects first
        subjects.forEach(subject => subject.validate());

        // set class properties for easy use
        this.allSubjects = subjects;
        this.insertSubjects = subjects.filter(subject => subject.mustBeInserted);
        this.updateSubjects = subjects.filter(subject => subject.mustBeUpdated);
        this.removeSubjects = subjects.filter(subject => subject.mustBeRemoved);
        this.relationUpdateSubjects = subjects.filter(subject => subject.hasRelationUpdates);

        // if there are no operations to execute then don't need to do something including opening a transaction
        if (!this.insertSubjects.length &&
            !this.updateSubjects.length &&
            !this.removeSubjects.length &&
            !this.relationUpdateSubjects.length &&
            subjects.every(subject => !subject.junctionInserts.length) &&
            subjects.every(subject => !subject.junctionRemoves.length))
            return;

        // start execute queries in a transaction
        // if transaction is already opened in this query runner then we don't touch it
        // if its not opened yet then we open it here, and once we finish - we close it
        let isTransactionStartedByItself = false;
        try {

            this.queryRunner = await this.queryRunnerProvider.provide();

            // open transaction if its not opened yet
            if (!this.queryRunner.isTransactionActive()) {
                isTransactionStartedByItself = true;
                await this.queryRunner.beginTransaction();
            }

            // broadcast "before" events before we start updating
            await this.connection.broadcaster.broadcastBeforeEventsForAll(this.transactionEntityManager, this.insertSubjects, this.updateSubjects, this.removeSubjects);

            // since events can trigger some internal changes (for example update depend property) we need to perform some re-computations here
            this.updateSubjects.forEach(subject => subject.recompute());

            await this.executeInsertOperations();
            await this.executeInsertClosureTableOperations();
            await this.executeInsertJunctionsOperations();
            await this.executeRemoveJunctionsOperations();
            await this.executeUpdateOperations();
            await this.executeUpdateRelations();
            await this.executeRemoveOperations();

            // commit transaction if it was started by us
            if (isTransactionStartedByItself === true)
                await this.queryRunner.commitTransaction();

            // update all special columns in persisted entities, like inserted id or remove ids from the removed entities
            await this.updateSpecialColumnsInPersistedEntities();

            // finally broadcast "after" events
            // note that we are broadcasting events after commit because we want to have ids of the entities inside them to be available in subscribers
            await this.connection.broadcaster.broadcastAfterEventsForAll(this.transactionEntityManager, this.insertSubjects, this.updateSubjects, this.removeSubjects);

        } catch (error) {

            // rollback transaction if it was started by us
            if (isTransactionStartedByItself) {
                try {
                    await this.queryRunner.rollbackTransaction();

                } catch (secondaryError) {
                }
            }

            throw error;
        }

    }

    // -------------------------------------------------------------------------
    // Private Methods: Insertion
    // -------------------------------------------------------------------------

    /**
     * Executes insert operations.
     *
     * For insertion we separate two groups of entities:
     * - first group of entities are entities which do not have any relations
     *      or entities which do not have any non-nullable relation
     * - second group of entities are entities which does have non-nullable relations
     *
     * Insert process of the entities from the first group which can only have nullable relations are actually a two-step process:
     * - first we insert entities without their relations, explicitly left them NULL
     * - later we update inserted entity once again with id of the object inserted with it
     *
     * Yes, two queries are being executed, but this is by design.
     * There is no better way to solve this problem and others at the same time.
     *
     * Insert process of the entities from the second group which can have only non nullable relations is a single-step process:
     * - we simply insert all entities and get into attention all its dependencies which were inserted in the first group
     */
    private async executeInsertOperations(): Promise<void> {

        // separate insert entities into groups:

        // TODO: current ordering mechanism is bad. need to create a correct order in which entities should be persisted, need to build a dependency graph

        // first group of subjects are subjects without any non-nullable column
        // we need to insert first such entities because second group entities may rely on those entities.
        const firstInsertSubjects = this.insertSubjects.filter(subject => !subject.metadata.hasNonNullableColumns);

        // second group - are all other subjects
        // since in this group there are non nullable columns, some of them may depend on value of the
        // previously inserted entity (which only can be entity with all nullable columns)
        const secondInsertSubjects = this.insertSubjects.filter(subject => subject.metadata.hasNonNullableColumns);

        // note: these operations should be executed in sequence, not in parallel
        // because second group depend of obtained data from the first group
        await Promise.all(firstInsertSubjects.map(subject => this.insert(subject, [])));
        await Promise.all(secondInsertSubjects.map(subject => this.insert(subject, firstInsertSubjects)));

        // we need to update relation ids of the newly inserted objects (where we inserted NULLs in relations)
        // once we inserted all entities, we need to update relations which were bind to inserted entities.
        // For example we have a relation many-to-one Post<->Category. Relation is nullable.
        // New category was set to the new post and post where persisted.
        // Here this method executes two inserts: one for post, one for category,
        // but category in post is inserted with "null".
        // now we need to update post table - set category with a newly persisted category id.
        const updatePromises: Promise<any>[] = [];
        firstInsertSubjects.forEach(subject => {

            // first update relations with join columns (one-to-one owner and many-to-one relations)
            const updateOptions: ObjectLiteral = {};
            subject.metadata.relationsWithJoinColumns.forEach(relation => {
                const referencedColumn = relation.joinColumn.referencedColumn;
                const relatedEntity = relation.getEntityValue(subject.entity);

                // if relation value is not set then nothing to do here
                if (!relatedEntity)
                    return;

                // check if relation reference column is a relation
                let relationId: any;
                const columnRelation = relation.inverseEntityMetadata.relations.find(rel => rel.propertyName === relation.joinColumn.referencedColumn.propertyName);
                if (columnRelation) { // if referenced column is a relation
                    const insertSubject = this.insertSubjects.find(insertedSubject => insertedSubject.entity === relatedEntity[referencedColumn.propertyName]);

                    // if this relation was just inserted
                    if (insertSubject) {

                        // check if we have this relation id already
                        relationId = relatedEntity[referencedColumn.propertyName][columnRelation.propertyName];
                        if (!relationId) {

                            // if we don't have relation id then use special values
                            if (referencedColumn.isGenerated) {
                                relationId = insertSubject.newlyGeneratedId;

                            } else if (referencedColumn.isObjectId) {
                                relationId = insertSubject.generatedObjectId;

                            }
                            // todo: handle other special types too
                        }
                    }

                } else { // if referenced column is a simple non relational column
                    const insertSubject = this.insertSubjects.find(insertedSubject => insertedSubject.entity === relatedEntity);

                    // if this relation was just inserted
                    if (insertSubject) {

                        // check if we have this relation id already
                        relationId = relatedEntity[referencedColumn.propertyName];
                        if (!relationId) {

                            // if we don't have relation id then use special values
                            if (referencedColumn.isGenerated) {
                                relationId = insertSubject.newlyGeneratedId;

                            } else if (referencedColumn.isObjectId) {
                                relationId = insertSubject.generatedObjectId;
                            }
                            // todo: handle other special types too
                        }
                    }

                }

                if (relationId) {
                    updateOptions[relation.name] = relationId;
                }

            });

            // if we found relations which we can update - then update them
            if (Object.keys(updateOptions).length > 0 /*&& subject.hasEntity*/) {
                // const relatedEntityIdMap = subject.getPersistedEntityIdMap; // todo: this works incorrectly

                const columns = subject.metadata.parentEntityMetadata ? subject.metadata.primaryColumnsWithParentIdColumns : subject.metadata.primaryColumns;
                const conditions: ObjectLiteral = {};

                columns.forEach(column => {
                    const entityValue = subject.entity[column.propertyName];

                    // if entity id is a relation, then extract referenced column from that relation
                    const columnRelation = subject.metadata.relations.find(relation => relation.propertyName === column.propertyName);

                    if (entityValue && columnRelation && columnRelation.joinColumn) { // not sure if we need handle join column from inverse side
                        let relationIdOfEntityValue = entityValue[columnRelation.joinColumn.referencedColumn.propertyName];
                        if (!relationIdOfEntityValue) {
                            const entityValueInsertSubject = this.insertSubjects.find(subject => subject.entity === entityValue);
                            if (entityValueInsertSubject) {
                                if (columnRelation.joinColumn.referencedColumn.isGenerated) {
                                    relationIdOfEntityValue = entityValueInsertSubject.newlyGeneratedId;

                                } else if (columnRelation.joinColumn.referencedColumn.isObjectId) {
                                    relationIdOfEntityValue = entityValueInsertSubject.generatedObjectId;

                                }
                            }
                        }
                        if (relationIdOfEntityValue) {
                            conditions[column.fullName] = relationIdOfEntityValue;
                        }

                    } else {
                        if (entityValue) {
                            conditions[column.fullName] = entityValue;
                        } else {
                            if (subject.newlyGeneratedId) {
                                conditions[column.fullName] = subject.newlyGeneratedId;

                            } else if (subject.generatedObjectId) {
                                conditions[column.fullName] = subject.generatedObjectId;
                            }
                        }
                    }
                });
                if (!Object.keys(conditions).length)
                    return;

                const updatePromise = this.queryRunner.update(subject.metadata.table.name, updateOptions, conditions);
                updatePromises.push(updatePromise);
            }

            // we need to update relation ids if newly inserted objects are used from inverse side in one-to-many inverse relation
            // we also need to update relation ids if newly inserted objects are used from inverse side in one-to-one inverse relation
            const oneToManyAndOneToOneNonOwnerRelations = subject.metadata.oneToManyRelations.concat(subject.metadata.oneToOneRelations.filter(relation => !relation.isOwning));
            subject.metadata.extractRelationValuesFromEntity(subject.entity, oneToManyAndOneToOneNonOwnerRelations)
                .forEach(([relation, subRelatedEntity, inverseEntityMetadata]) => {
                    const referencedColumn = relation.inverseRelation.joinColumn.referencedColumn;
                    const columns = inverseEntityMetadata.parentEntityMetadata ? inverseEntityMetadata.primaryColumnsWithParentIdColumns : inverseEntityMetadata.primaryColumns;
                    const conditions: ObjectLiteral = {};

                    columns.forEach(column => {
                        const entityValue = subRelatedEntity[column.propertyName];

                        // if entity id is a relation, then extract referenced column from that relation
                        const columnRelation = inverseEntityMetadata.relations.find(relation => relation.propertyName === column.propertyName);

                        if (entityValue && columnRelation && columnRelation.joinColumn) { // not sure if we need handle join column from inverse side
                            let relationIdOfEntityValue = entityValue[columnRelation.joinColumn.referencedColumn.propertyName];
                            if (!relationIdOfEntityValue) {
                                const entityValueInsertSubject = this.insertSubjects.find(subject => subject.entity === entityValue);
                                if (entityValueInsertSubject) {
                                    if (columnRelation.joinColumn.referencedColumn.isGenerated) {
                                        relationIdOfEntityValue = entityValueInsertSubject.newlyGeneratedId;

                                    } else if (columnRelation.joinColumn.referencedColumn.isObjectId) {
                                        relationIdOfEntityValue = entityValueInsertSubject.generatedObjectId;
                                    }
                                }
                            }
                            if (relationIdOfEntityValue) {
                                conditions[column.fullName] = relationIdOfEntityValue;
                            }

                        } else {
                            const entityValueInsertSubject = this.insertSubjects.find(subject => subject.entity === subRelatedEntity);
                            if (entityValue) {
                                conditions[column.fullName] = entityValue;
                            } else {
                                if (entityValueInsertSubject && entityValueInsertSubject.newlyGeneratedId) {
                                    conditions[column.fullName] = entityValueInsertSubject.newlyGeneratedId;

                                } else if (entityValueInsertSubject && entityValueInsertSubject.generatedObjectId) {
                                    conditions[column.fullName] = entityValueInsertSubject.generatedObjectId;

                                }
                            }
                        }
                    });
                    if (!Object.keys(conditions).length)
                        return;

                    const updateOptions: ObjectLiteral = {};
                    const columnRelation = relation.inverseEntityMetadata.relations.find(rel => rel.propertyName === referencedColumn.propertyName);
                    if (columnRelation) {
                        let id = subject.entity[referencedColumn.propertyName][columnRelation.propertyName];
                        if (!id) {
                            const insertSubject = this.insertSubjects.find(subject => subject.entity === subject.entity[referencedColumn.propertyName]);
                            if (insertSubject) {
                                if (insertSubject.newlyGeneratedId) {
                                    id = insertSubject.newlyGeneratedId;

                                } else if (insertSubject.generatedObjectId) {
                                    id = insertSubject.generatedObjectId;
                                }
                            }
                        }
                        updateOptions[relation.inverseRelation.joinColumn.name] = id;
                    } else {
                        updateOptions[relation.inverseRelation.joinColumn.name] = subject.entity[referencedColumn.propertyName] || subject.newlyGeneratedId || subRelatedEntity.generatedObjectId;
                    }

                    const updatePromise = this.queryRunner.update(relation.inverseEntityMetadata.table.name, updateOptions, conditions);
                    updatePromises.push(updatePromise);
                });

        });

        await Promise.all(updatePromises);

        // todo: make sure to search in all insertSubjects during updating too if updated entity uses links to the newly persisted entity
    }

    /**
     * Inserts an entity from the given insert operation into the database.
     * If entity has an generated column, then after saving new generated value will be stored to the InsertOperation.
     * If entity uses class-table-inheritance, then multiple inserts may by performed to save all entities.
     */
    private async insert(subject: Subject, alreadyInsertedSubjects: Subject[]): Promise<any> {

        const parentEntityMetadata = subject.metadata.parentEntityMetadata;
        const metadata = subject.metadata;
        const entity = subject.entity;
        let newlyGeneratedId: any, parentGeneratedId: any;

        // if entity uses class table inheritance then we need to separate entity into sub values that will be inserted into multiple tables
        if (metadata.table.isClassTableChild) { // todo: with current implementation inheritance of multiple class table children will not work

            // first insert entity values into parent class table
            const parentValuesMap = this.collectColumnsAndValues(parentEntityMetadata, entity, subject.date, undefined, metadata.discriminatorValue, alreadyInsertedSubjects);
            newlyGeneratedId = parentGeneratedId = await this.queryRunner.insert(parentEntityMetadata.table.name, parentValuesMap, parentEntityMetadata.generatedColumnIfExist);

            // second insert entity values into child class table
            const childValuesMap = this.collectColumnsAndValues(metadata, entity, subject.date, newlyGeneratedId, undefined, alreadyInsertedSubjects);
            const secondGeneratedId = await this.queryRunner.insert(metadata.table.name, childValuesMap, metadata.generatedColumnIfExist);
            if (!newlyGeneratedId && secondGeneratedId) newlyGeneratedId = secondGeneratedId;

        } else { // in the case when class table inheritance is not used

            const valuesMap = this.collectColumnsAndValues(metadata, entity, subject.date, undefined, undefined, alreadyInsertedSubjects);
            newlyGeneratedId = await this.queryRunner.insert(metadata.table.name, valuesMap, metadata.generatedColumnIfExist);
        }

        if (parentGeneratedId)
            subject.parentGeneratedId = parentGeneratedId;

        // todo: better if insert method will return object with all generated ids, object id, etc.
        if (newlyGeneratedId) {
            if (metadata.hasGeneratedColumn) {
                subject.newlyGeneratedId = newlyGeneratedId;

            } else if (metadata.hasObjectIdColumn) {
                subject.generatedObjectId = newlyGeneratedId;

            }
        }
    }

    /**
     * Collects columns and values for the insert operation.
     */
    private collectColumnsAndValues(metadata: EntityMetadata, entity: ObjectLiteral, date: Date, parentIdColumnValue: any, discriminatorValue: any, alreadyInsertedSubjects: Subject[]): ObjectLiteral {

        const columnNames: string[] = [];
        const columnValues: any[] = [];
        const columnsAndValuesMap: ObjectLiteral = {};

        metadata.columnsWithoutEmbeddeds
            .filter(column => {
                return !column.isVirtual && !column.isParentId && !column.isDiscriminator && column.hasEntityValue(entity);
            })
            .forEach(column => {
                const value = this.connection.driver.preparePersistentValue(entity[column.propertyName], column);
                columnNames.push(column.fullName);
                columnValues.push(value);
                columnsAndValuesMap[column.name] = value;
            });

        const collectFromEmbeddeds = (entity: any, columnsAndValues: ObjectLiteral, embeddeds: EmbeddedMetadata[]) => {
            embeddeds.forEach(embedded => {
                if (!entity[embedded.propertyName])
                    return;

                if (embedded.isArray) {
                    columnsAndValues[embedded.propertyName] = (entity[embedded.propertyName] as any[]).map(subValue => {
                        const newItem: ObjectLiteral = {};
                        embedded.columns.forEach(column => {
                            const value = this.connection.driver.preparePersistentValue(subValue[column.propertyName], column);
                            columnNames.push(column.fullName); // todo: probably we dont need it right now because relational databases dont support array embeddedables yet
                            columnValues.push(value);
                            newItem[column.propertyName] = value;
                        });
                        return newItem;
                    });

                } else {
                    columnsAndValues[embedded.propertyName] = {};
                    embedded.columns.forEach(column => {
                        const value = this.connection.driver.preparePersistentValue(entity[embedded.propertyName][column.propertyName], column);
                        columnNames.push(column.fullName);
                        columnValues.push(value);
                        columnsAndValues[embedded.propertyName][column.propertyName] = value;
                    });
                }
                collectFromEmbeddeds(entity[embedded.propertyName], columnsAndValues[embedded.propertyName], embedded.embeddeds);
            });
        };
        collectFromEmbeddeds(entity, columnsAndValuesMap, metadata.embeddeds);

        metadata.relationsWithJoinColumns.forEach(relation => {

            let relationValue: any;
            const value = relation.getEntityValue(entity);

            if (value) {
                // if relation value is stored in the entity itself then use it from there
                const relationId = relation.getInverseEntityRelationId(value); // todo: check it
                if (relationId) {
                    relationValue = relationId;
                }

                // otherwise try to find relational value from just inserted subjects
                const alreadyInsertedSubject = alreadyInsertedSubjects.find(insertedSubject => {
                    return insertedSubject.entity === value;
                });
                if (alreadyInsertedSubject) {
                    const referencedColumn = relation.joinColumn.referencedColumn;
                    // if join column references to the primary generated column then seek in the newEntityId of the insertedSubject
                    if (referencedColumn.referencedColumn && referencedColumn.referencedColumn.isGenerated) {
                        if (referencedColumn.isParentId) {
                            relationValue = alreadyInsertedSubject.parentGeneratedId;
                        }
                        // todo: what if reference column is not generated?
                        // todo: what if reference column is not related to table inheritance?
                    }

                    if (referencedColumn.isGenerated)
                        relationValue = alreadyInsertedSubject.newlyGeneratedId;
                    if (referencedColumn.isObjectId)
                        relationValue = alreadyInsertedSubject.generatedObjectId;
                    // if it references to create or update date columns
                    if (referencedColumn.isCreateDate || referencedColumn.isUpdateDate)
                        relationValue = this.connection.driver.preparePersistentValue(alreadyInsertedSubject.date, referencedColumn);
                    // if it references to version column
                    if (referencedColumn.isVersion)
                        relationValue = this.connection.driver.preparePersistentValue(1, referencedColumn);
                }
            } else if (relation.hasInverseSide) {
                const inverseSubject = this.allSubjects.find(subject => {
                    if (!subject.hasEntity || subject.entityTarget !== relation.inverseRelation.target)
                        return false;

                    const inverseRelationValue = subject.entity[relation.inverseRelation.propertyName];
                    if (inverseRelationValue) {
                        if (inverseRelationValue instanceof Array) {
                            return inverseRelationValue.find(subValue => subValue === subValue);
                        } else {
                            return inverseRelationValue === entity;
                        }
                    }
                });
                if (inverseSubject && inverseSubject.entity[relation.joinColumn.referencedColumn.propertyName]) {
                    relationValue = inverseSubject.entity[relation.joinColumn.referencedColumn.propertyName];
                }
            }

            if (relationValue) {
                columnNames.push(relation.name);
                columnValues.push(relationValue);
                columnsAndValuesMap[relation.propertyName] = entity[relation.name];
            }
        });

        // add special column and value - date of creation
        if (metadata.hasCreateDateColumn) {
            const value = this.connection.driver.preparePersistentValue(date, metadata.createDateColumn);
            columnNames.push(metadata.createDateColumn.fullName);
            columnValues.push(value);
            columnsAndValuesMap[metadata.createDateColumn.fullName] = value;
        }

        // add special column and value - date of updating
        if (metadata.hasUpdateDateColumn) {
            const value = this.connection.driver.preparePersistentValue(date, metadata.updateDateColumn);
            columnNames.push(metadata.updateDateColumn.fullName);
            columnValues.push(value);
            columnsAndValuesMap[metadata.updateDateColumn.fullName] = value;
        }

        // add special column and value - version column
        if (metadata.hasVersionColumn) {
            const value = this.connection.driver.preparePersistentValue(1, metadata.versionColumn);
            columnNames.push(metadata.versionColumn.fullName);
            columnValues.push(value);
            columnsAndValuesMap[metadata.versionColumn.fullName] = value;
        }

        // add special column and value - discriminator value (for tables using table inheritance)
        if (metadata.hasDiscriminatorColumn) {
            const value = this.connection.driver.preparePersistentValue(discriminatorValue || metadata.discriminatorValue, metadata.discriminatorColumn);
            columnNames.push(metadata.discriminatorColumn.fullName);
            columnValues.push(value);
            columnsAndValuesMap[metadata.discriminatorColumn.fullName] = value;
        }

        // add special column and value - tree level and tree parents (for tree-type tables)
        if (metadata.hasTreeLevelColumn && metadata.hasTreeParentRelation) {
            const parentEntity = entity[metadata.treeParentRelation.propertyName];
            const parentLevel = parentEntity ? (parentEntity[metadata.treeLevelColumn.propertyName] || 0) : 0;

            columnNames.push(metadata.treeLevelColumn.fullName);
            columnValues.push(parentLevel + 1);
        }

        // add special column and value - parent id column (for tables using table inheritance)
        if (metadata.parentEntityMetadata && metadata.hasParentIdColumn) {
            columnNames.push(metadata.parentIdColumn.fullName); // todo: should be array of primary keys
            columnValues.push(parentIdColumnValue || entity[metadata.parentEntityMetadata.firstPrimaryColumn.propertyName]); // todo: should be array of primary keys
        }

        if (this.connection.driver instanceof MongoDriver) { // todo: make better abstraction
            return columnsAndValuesMap;

        } else {
            return OrmUtils.zipObject(columnNames, columnValues);
        }
    }

    // -------------------------------------------------------------------------
    // Private Methods: Insertion into closure tables
    // -------------------------------------------------------------------------

    /**
     * Inserts all given subjects into closure table.
     */
    private executeInsertClosureTableOperations(/*, updatesByRelations: Subject[]*/) { // todo: what to do with updatesByRelations
        const promises = this.insertSubjects
            .filter(subject => subject.metadata.table.isClosure)
            .map(async subject => {
                // const relationsUpdateMap = this.findUpdateOperationForEntity(updatesByRelations, insertSubjects, subject.entity);
                // subject.treeLevel = await this.insertIntoClosureTable(subject, relationsUpdateMap);
                await this.insertClosureTableValues(subject);
            });
        return Promise.all(promises);
    }

    /**
     * Inserts given subject into closure table.
     */
    private async insertClosureTableValues(subject: Subject): Promise<void> {
        // todo: since closure tables do not support compose primary keys - throw an exception?
        // todo: what if parent entity or parentEntityId is empty?!
        const tableName = subject.metadata.closureJunctionTable.table.name;
        const referencedColumn = subject.metadata.treeParentRelation.joinColumn.referencedColumn; // todo: check if joinColumn works

        let newEntityId = subject.entity[referencedColumn.propertyName];
        if (!newEntityId && referencedColumn.isGenerated) {
            newEntityId = subject.newlyGeneratedId;
            // we should not handle object id here because closure tables are not supported by mongodb driver.
        } // todo: implement other special column types too

        const parentEntity = subject.entity[subject.metadata.treeParentRelation.propertyName];
        let parentEntityId: any = 0; // zero is important
        if (parentEntity) {
            parentEntityId = parentEntity[referencedColumn.propertyName];
            if (!parentEntityId && referencedColumn.isGenerated) {
                const parentInsertedSubject = this.insertSubjects.find(subject => subject.entity === parentEntity);
                // todo: throw exception if parentInsertedSubject is not set
                parentEntityId = parentInsertedSubject!.newlyGeneratedId;
            } // todo: implement other special column types too
        }

        // try to find parent entity id in some other entity that has this entity in its children
        if (!parentEntityId) {
            const parentSubject = this.allSubjects.find(allSubject => {
                if (!allSubject.hasEntity || !allSubject.metadata.table.isClosure || !allSubject.metadata.hasTreeChildrenRelation)
                    return false;

                const children = allSubject.entity[subject.metadata.treeChildrenRelation.propertyName];
                return children instanceof Array ? children.indexOf(subject.entity) !== -1 : false;
            });

            if (parentSubject) {
                parentEntityId = parentSubject.entity[referencedColumn.propertyName];
                if (!parentEntityId && parentSubject.newlyGeneratedId) { // if still not found then it means parent just inserted with generated column
                    parentEntityId = parentSubject.newlyGeneratedId;
                }
            }
        }

        // if parent entity exist then insert a new row into closure table
        subject.treeLevel = await this.queryRunner.insertIntoClosureTable(tableName, newEntityId, parentEntityId, subject.metadata.hasTreeLevelColumn);

        if (subject.metadata.hasTreeLevelColumn) {
            const values = { [subject.metadata.treeLevelColumn.fullName]: subject.treeLevel };
            await this.queryRunner.update(subject.metadata.table.name, values, { [referencedColumn.fullName]: newEntityId });
        }
    }

    // -------------------------------------------------------------------------
    // Private Methods: Update
    // -------------------------------------------------------------------------

    /**
     * Updates all given subjects in the database.
     */
    private async executeUpdateOperations(): Promise<void> {
        await Promise.all(this.updateSubjects.map(subject => this.update(subject)));
    }

    /**
     * Updates given subject in the database.
     */
    private async update(subject: Subject): Promise<void> {
        const entity = subject.entity;

        if (this.connection.driver instanceof MongoDriver) {
            const idMap = subject.metadata.getDatabaseEntityIdMap(entity);
            if (!idMap)
                throw new Error(`Internal error. Cannot get id of the updating entity.`);


            const addEmbeddedValuesRecursively = (entity: any, value: any, embeddeds: EmbeddedMetadata[]) => {
                embeddeds.forEach(embedded => {
                    if (!entity[embedded.propertyName])
                        return;
                    if (embedded.isArray) {
                        value[embedded.prefix] = (entity[embedded.propertyName] as any[]).map(subValue => {
                            const newItem: ObjectLiteral = {};
                            embedded.columns.forEach(column => {
                                newItem[column.name] = subValue[column.propertyName];
                            });
                            return newItem;
                        });

                    } else {
                        embedded.columns.forEach(column => {
                            if (!value[embedded.prefix])
                                value[embedded.prefix] = {};

                            value[embedded.prefix][column.name] = entity[embedded.propertyName][column.propertyName];
                        });
                    }
                    addEmbeddedValuesRecursively(entity[embedded.propertyName], value[embedded.prefix], embedded.embeddeds);
                });
            };

            const value: ObjectLiteral = {};
            subject.metadata.columnsWithoutEmbeddeds.forEach(column => {
                if (entity[column.propertyName] !== undefined)
                    value[column.fullName] = entity[column.propertyName];
            });
            addEmbeddedValuesRecursively(entity, value, subject.metadata.embeddeds);

            // if number of updated columns = 0 no need to update updated date and version columns
            if (Object.keys(value).length === 0)
                return;

            if (subject.metadata.hasUpdateDateColumn)
                value[subject.metadata.updateDateColumn.fullName] = this.connection.driver.preparePersistentValue(new Date(), subject.metadata.updateDateColumn);

            if (subject.metadata.hasVersionColumn)
                value[subject.metadata.versionColumn.fullName] = this.connection.driver.preparePersistentValue(entity[subject.metadata.versionColumn.propertyName] + 1, subject.metadata.versionColumn);

            return this.queryRunner.update(subject.metadata.table.name, value, idMap);
        }

        // we group by table name, because metadata can have different table names
        const valueMaps: { tableName: string, metadata: EntityMetadata, values: ObjectLiteral }[] = [];

        subject.diffColumns.forEach(column => {
            if (!column.entityTarget) return; // todo: how this can be possible?
            const metadata = this.connection.getMetadata(column.entityTarget);
            let valueMap = valueMaps.find(valueMap => valueMap.tableName === metadata.table.name);
            if (!valueMap) {
                valueMap = { tableName: metadata.table.name, metadata: metadata, values: {} };
                valueMaps.push(valueMap);
            }

            valueMap.values[column.fullName] = this.connection.driver.preparePersistentValue(column.getEntityValue(entity), column);
        });

        subject.diffRelations.forEach(relation => {
            const metadata = this.connection.getMetadata(relation.entityTarget);
            let valueMap = valueMaps.find(valueMap => valueMap.tableName === metadata.table.name);
            if (!valueMap) {
                valueMap = { tableName: metadata.table.name, metadata: metadata, values: {} };
                valueMaps.push(valueMap);
            }

            const value = relation.getEntityValue(entity);
            valueMap.values[relation.name] = value !== null && value !== undefined ? value[relation.inverseEntityMetadata.firstPrimaryColumn.propertyName] : null; // todo: should not have a call to primaryColumn, instead join column metadata should be used
        });

        // if number of updated columns = 0 no need to update updated date and version columns
        if (Object.keys(valueMaps).length === 0)
            return;

        if (subject.metadata.hasUpdateDateColumn) {
            let valueMap = valueMaps.find(valueMap => valueMap.tableName === subject.metadata.table.name);
            if (!valueMap) {
                valueMap = { tableName: subject.metadata.table.name, metadata: subject.metadata, values: {} };
                valueMaps.push(valueMap);
            }

            valueMap.values[subject.metadata.updateDateColumn.fullName] = this.connection.driver.preparePersistentValue(new Date(), subject.metadata.updateDateColumn);
        }

        if (subject.metadata.hasVersionColumn) {
            let valueMap = valueMaps.find(valueMap => valueMap.tableName === subject.metadata.table.name);
            if (!valueMap) {
                valueMap = { tableName: subject.metadata.table.name, metadata: subject.metadata, values: {} };
                valueMaps.push(valueMap);
            }

            valueMap.values[subject.metadata.versionColumn.fullName] = this.connection.driver.preparePersistentValue(entity[subject.metadata.versionColumn.propertyName] + 1, subject.metadata.versionColumn);
        }

        if (subject.metadata.parentEntityMetadata) {
            if (subject.metadata.parentEntityMetadata.hasUpdateDateColumn) {
                let valueMap = valueMaps.find(valueMap => valueMap.tableName === subject.metadata.parentEntityMetadata.table.name);
                if (!valueMap) {
                    valueMap = {
                        tableName: subject.metadata.parentEntityMetadata.table.name,
                        metadata: subject.metadata.parentEntityMetadata,
                        values: {}
                    };
                    valueMaps.push(valueMap);
                }

                valueMap.values[subject.metadata.parentEntityMetadata.updateDateColumn.fullName] = this.connection.driver.preparePersistentValue(new Date(), subject.metadata.parentEntityMetadata.updateDateColumn);
            }

            if (subject.metadata.parentEntityMetadata.hasVersionColumn) {
                let valueMap = valueMaps.find(valueMap => valueMap.tableName === subject.metadata.parentEntityMetadata.table.name);
                if (!valueMap) {
                    valueMap = {
                        tableName: subject.metadata.parentEntityMetadata.table.name,
                        metadata: subject.metadata.parentEntityMetadata,
                        values: {}
                    };
                    valueMaps.push(valueMap);
                }

                valueMap.values[subject.metadata.parentEntityMetadata.versionColumn.fullName] = this.connection.driver.preparePersistentValue(entity[subject.metadata.parentEntityMetadata.versionColumn.propertyName] + 1, subject.metadata.parentEntityMetadata.versionColumn);
            }
        }

        await Promise.all(valueMaps.map(valueMap => {
            const idMap = valueMap.metadata.getDatabaseEntityIdMap(entity);
            if (!idMap)
                throw new Error(`Internal error. Cannot get id of the updating entity.`);

            return this.queryRunner.update(valueMap.tableName, valueMap.values, idMap);
        }));
    }

    // -------------------------------------------------------------------------
    // Private Methods: Update only relations
    // -------------------------------------------------------------------------

    /**
     * Updates relations of all given subjects in the database.
     */
    private executeUpdateRelations() {
        return Promise.all(this.relationUpdateSubjects.map(subject => this.updateRelations(subject)));
    }

    /**
     * Updates relations of the given subject in the database.
     */
    private async updateRelations(subject: Subject) {
        const values: ObjectLiteral = {};
        subject.relationUpdates.forEach(setRelation => {
            const value = setRelation.value ? setRelation.value[setRelation.relation.joinColumn.referencedColumn.propertyName] : null;
            values[setRelation.relation.name] = value; // todo: || fromInsertedSubjects ??
        });

        const idMap = subject.metadata.getDatabaseEntityIdMap(subject.databaseEntity);
        if (!idMap)
            throw new Error(`Internal error. Cannot get id of the updating entity.`);

        return this.queryRunner.update(subject.metadata.table.name, values, idMap);
    }

    // -------------------------------------------------------------------------
    // Private Methods: Remove
    // -------------------------------------------------------------------------

    /**
     * Removes all given subjects from the database.
     */
    private async executeRemoveOperations(): Promise<void> {
        await PromiseUtils.runInSequence(this.removeSubjects, async subject => await this.remove(subject));
    }

    /**
     * Updates given subject from the database.
     */
    private async remove(subject: Subject): Promise<void> {
        if (subject.metadata.parentEntityMetadata) {
            const parentConditions: ObjectLiteral = {};
            subject.metadata.parentPrimaryColumns.forEach(column => {
                parentConditions[column.fullName] = subject.databaseEntity[column.propertyName];
            });
            await this.queryRunner.delete(subject.metadata.parentEntityMetadata.table.name, parentConditions);

            const childConditions: ObjectLiteral = {};
            subject.metadata.primaryColumnsWithParentIdColumns.forEach(column => {
                childConditions[column.fullName] = subject.databaseEntity[column.propertyName];
            });
            await this.queryRunner.delete(subject.metadata.table.name, childConditions);
        } else {
            await this.queryRunner.delete(subject.metadata.table.name, subject.metadata.getEntityIdColumnMap(subject.databaseEntity)!);
        }
    }

    // -------------------------------------------------------------------------
    // Private Methods: Insertion into junction tables
    // -------------------------------------------------------------------------

    /**
     * Inserts into database junction tables all given array of subjects junction data.
     */
    private async executeInsertJunctionsOperations(): Promise<void> {
        const promises: Promise<any>[] = [];
        this.allSubjects.forEach(subject => {
            subject.junctionInserts.forEach(junctionInsert => {
                promises.push(this.insertJunctions(subject, junctionInsert));
            });
        });

        await Promise.all(promises);
    }

    /**
     * Inserts into database junction table given subject's junction insert data.
     */
    private async insertJunctions(subject: Subject, junctionInsert: JunctionInsert): Promise<void> {
        // I think here we can only support to work only with single primary key entities

        const relation = junctionInsert.relation;
        const joinTable = relation.isOwning ? relation.joinTable : relation.inverseRelation.joinTable;
        const firstColumn = relation.isOwning ? joinTable.referencedColumn : joinTable.inverseReferencedColumn;
        const secondColumn = relation.isOwning ? joinTable.inverseReferencedColumn : joinTable.referencedColumn;

        let ownId = relation.getOwnEntityRelationId(subject.entity);
        if (!ownId) {
            if (firstColumn.isGenerated) {
                ownId = subject.newlyGeneratedId;

            } else if (firstColumn.isObjectId) {
                ownId = subject.generatedObjectId;

            }
            // todo: implement other special referenced column types (update date, create date, version, discriminator column, etc.)
        }

        if (!ownId)
            throw new Error(`Cannot insert object of ${subject.entityTarget} type. Looks like its not persisted yet, or cascades are not set on the relation.`); // todo: better error message

        const promises = junctionInsert.junctionEntities.map(newBindEntity => {

            // get relation id from the newly bind entity
            let relationId: any;
            if (relation.isManyToManyOwner) {
                relationId = newBindEntity[relation.joinTable.inverseReferencedColumn.propertyName];

            } else if (relation.isManyToManyNotOwner) {
                relationId = newBindEntity[relation.inverseRelation.joinTable.referencedColumn.propertyName];
            }

            // if relation id is missing in the newly bind entity then check maybe it was just persisted
            // and we can use special newly generated value
            if (!relationId) {
                const insertSubject = this.insertSubjects.find(subject => subject.entity === newBindEntity);
                if (insertSubject) {
                    if (secondColumn.isGenerated) {
                        relationId = insertSubject.newlyGeneratedId;

                    } else if (secondColumn.isObjectId) {
                        relationId = insertSubject.generatedObjectId;

                    }
                    // todo: implement other special values too
                }
            }

            // if relation id still does not exist - we arise an error
            if (!relationId)
                throw new Error(`Cannot insert object of ${(newBindEntity.constructor as any).name} type. Looks like its not persisted yet, or cascades are not set on the relation.`); // todo: better error message

            const columns = relation.junctionEntityMetadata.columnsWithoutEmbeddeds.map(column => column.fullName);
            const values = relation.isOwning ? [ownId, relationId] : [relationId, ownId];

            return this.queryRunner.insert(relation.junctionEntityMetadata.table.name, OrmUtils.zipObject(columns, values));
        });

        await Promise.all(promises);
    }

    // -------------------------------------------------------------------------
    // Private Methods: Remove from junction tables
    // -------------------------------------------------------------------------

    /**
     * Removes from database junction tables all given array of subjects removal junction data.
     */
    private async executeRemoveJunctionsOperations(): Promise<void> {
        const promises: Promise<any>[] = [];
        this.allSubjects.forEach(subject => {
            subject.junctionRemoves.forEach(junctionRemove => {
                promises.push(this.removeJunctions(subject, junctionRemove));
            });
        });

        await Promise.all(promises);
    }

    /**
     * Removes from database junction table all given subject's removal junction data.
     */
    private async removeJunctions(subject: Subject, junctionRemove: JunctionRemove) {
        const junctionMetadata = junctionRemove.relation.junctionEntityMetadata;
        const entity = subject.hasEntity ? subject.entity : subject.databaseEntity;
        const ownId = junctionRemove.relation.getOwnEntityRelationId(entity);
        const ownColumn = junctionRemove.relation.isOwning ? junctionMetadata.columns[0] : junctionMetadata.columns[1];
        const relateColumn = junctionRemove.relation.isOwning ? junctionMetadata.columns[1] : junctionMetadata.columns[0];
        const removePromises = junctionRemove.junctionRelationIds.map(relationId => {
            return this.queryRunner.delete(junctionMetadata.table.name, {
                [ownColumn.fullName]: ownId,
                [relateColumn.fullName]: relationId
            });
        });

        await Promise.all(removePromises);
    }

    // -------------------------------------------------------------------------
    // Private Methods: Refresh entity values after persistence
    // -------------------------------------------------------------------------

    /**
     * Updates all special columns of the saving entities (create date, update date, versioning).
     */
    private updateSpecialColumnsInPersistedEntities() {

        // update entity columns that gets updated on each entity insert
        this.insertSubjects.forEach(subject => {
            if (subject.generatedObjectId && subject.metadata.hasObjectIdColumn)
                subject.entity[subject.metadata.objectIdColumn.propertyName] = subject.generatedObjectId;

            subject.metadata.primaryColumns.forEach(primaryColumn => {
                if (subject.newlyGeneratedId)
                    subject.entity[primaryColumn.propertyName] = subject.newlyGeneratedId;
            });
            subject.metadata.parentPrimaryColumns.forEach(primaryColumn => {
                if (subject.parentGeneratedId)
                    subject.entity[primaryColumn.propertyName] = subject.parentGeneratedId;
            });

            if (subject.metadata.hasUpdateDateColumn)
                subject.entity[subject.metadata.updateDateColumn.propertyName] = subject.date;
            if (subject.metadata.hasCreateDateColumn)
                subject.entity[subject.metadata.createDateColumn.propertyName] = subject.date;
            if (subject.metadata.hasVersionColumn)
                subject.entity[subject.metadata.versionColumn.propertyName] = 1;
            if (subject.metadata.hasTreeLevelColumn) {
                // const parentEntity = insertOperation.entity[metadata.treeParentMetadata.propertyName];
                // const parentLevel = parentEntity ? (parentEntity[metadata.treeLevelColumn.propertyName] || 0) : 0;
                subject.entity[subject.metadata.treeLevelColumn.propertyName] = subject.treeLevel;
            }
            /*if (subject.metadata.hasTreeChildrenCountColumn) {
                 subject.entity[subject.metadata.treeChildrenCountColumn.propertyName] = 0;
            }*/
        });

        // update special columns that gets updated on each entity update
        this.updateSubjects.forEach(subject => {
            if (subject.metadata.hasUpdateDateColumn)
                subject.entity[subject.metadata.updateDateColumn.propertyName] = subject.date;
            if (subject.metadata.hasVersionColumn)
                subject.entity[subject.metadata.versionColumn.propertyName]++;
        });

        // remove ids from the entities that were removed
        this.removeSubjects
            .filter(subject => subject.hasEntity)
            .forEach(subject => {
                subject.metadata.primaryColumns.forEach(primaryColumn => {
                    subject.entity[primaryColumn.propertyName] = undefined;
                });
            });
    }

}