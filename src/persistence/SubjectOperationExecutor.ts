import {ObjectLiteral} from "../common/ObjectLiteral";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {Connection} from "../connection/Connection";
import {QueryRunner} from "../query-runner/QueryRunner";
import {JunctionInsert, JunctionRemove, Subject} from "./Subject";
import {OrmUtils} from "../util/OrmUtils";
import {EntityManager} from "../entity-manager/EntityManager";
import {PromiseUtils} from "../util/PromiseUtils";
import {MongoDriver} from "../driver/mongodb/MongoDriver";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {EmbeddedMetadata} from "../metadata/EmbeddedMetadata";
import {Broadcaster} from "../subscriber/Broadcaster";

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

    protected broadcaster: Broadcaster;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection,
                protected transactionEntityManager: EntityManager,
                protected queryRunner: QueryRunner,
                subjects: Subject[]) {

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

        this.broadcaster = new Broadcaster(this.connection);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    areExecutableOperations(): boolean {
        return this.insertSubjects.length > 0 ||
            this.updateSubjects.length > 0 ||
            this.removeSubjects.length > 0 ||
            this.relationUpdateSubjects.length > 0 ||
            this.allSubjects.some(subject => subject.junctionInserts.length > 0) ||
            this.allSubjects.some(subject => subject.junctionRemoves.length > 0);
    }

    /**
     * Executes all operations over given array of subjects.
     * Executes queries using given query runner.
     */
    async execute(): Promise<void> {

        // broadcast "before" events before we start updating
        await this.broadcaster.broadcastBeforeEventsForAll(this.transactionEntityManager, this.insertSubjects, this.updateSubjects, this.removeSubjects);

        // since events can trigger some internal changes (for example update depend property) we need to perform some re-computations here
        this.updateSubjects.forEach(subject => subject.recompute());

        await this.executeInsertOperations();
        await this.executeInsertClosureTableOperations();
        await this.executeInsertJunctionsOperations();
        await this.executeRemoveJunctionsOperations();
        await this.executeUpdateOperations();
        await this.executeUpdateRelations();
        await this.executeRemoveOperations();

        // update all special columns in persisted entities, like inserted id or remove ids from the removed entities
        await this.updateSpecialColumnsInPersistedEntities();

        // finally broadcast "after" events
        // todo: THIS SHOULD NOT BE TRUTH: note that we are broadcasting events after commit because we want to have ids of the entities inside them to be available in subscribers
        await this.broadcaster.broadcastAfterEventsForAll(this.transactionEntityManager, this.insertSubjects, this.updateSubjects, this.removeSubjects);
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
        const firstInsertSubjects = this.insertSubjects.filter(subject => !subject.metadata.hasNonNullableRelations);

        // second group - are all other subjects
        // since in this group there are non nullable columns, some of them may depend on value of the
        // previously inserted entity (which only can be entity with all nullable columns)
        const secondInsertSubjects = this.insertSubjects.filter(subject => subject.metadata.hasNonNullableRelations);

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
                relation.joinColumns.forEach(joinColumn => {
                    const referencedColumn = joinColumn.referencedColumn!;
                    const relatedEntity = relation.getEntityValue(subject.entity);

                    // if relation value is not set then nothing to do here
                    if (!relatedEntity)
                        return;

                    // check if relation reference column is a relation
                    let relationId: any;
                    const columnRelation = relation.inverseEntityMetadata.findRelationWithPropertyPath(joinColumn.referencedColumn!.propertyPath);
                    if (columnRelation) { // if referenced column is a relation
                        const insertSubject = this.insertSubjects.find(insertedSubject => insertedSubject.entity === referencedColumn.getEntityValue(relatedEntity));

                        // if this relation was just inserted
                        if (insertSubject) {

                            // check if we have this relation id already
                            relationId = columnRelation.getEntityValue(referencedColumn.getEntityValue(relatedEntity));
                            if (!relationId) {

                                // if we don't have relation id then use special values
                                if (referencedColumn.isGenerated && insertSubject.generatedMap)
                                    relationId = referencedColumn.getEntityValue(insertSubject.generatedMap);
                                // todo: handle other special types too
                            }
                        }

                    } else { // if referenced column is a simple non relational column
                        const insertSubject = this.insertSubjects.find(insertedSubject => insertedSubject.entity === relatedEntity);

                        // if this relation was just inserted
                        if (insertSubject) {

                            // check if we have this relation id already
                            relationId = referencedColumn.getEntityValue(relatedEntity);
                            if (!relationId) {

                                // if we don't have relation id then use special values
                                if (referencedColumn.isGenerated && insertSubject.generatedMap)
                                    relationId = referencedColumn.getEntityValue(insertSubject.generatedMap);
                                // todo: handle other special types too
                            }
                        }

                    }

                    if (relationId) {
                        updateOptions[joinColumn.databaseName] = relationId;
                    }

                });
            });

            // if we found relations which we can update - then update them
            if (Object.keys(updateOptions).length > 0 /*&& subject.hasEntity*/) {
                // const relatedEntityIdMap = subject.getPersistedEntityIdMap; // todo: this works incorrectly

                const columns = subject.metadata.parentEntityMetadata ? subject.metadata.primaryColumns : subject.metadata.primaryColumns;
                const conditions: ObjectLiteral = {};

                columns.forEach(column => {
                    const entityValue = column.getEntityValue(subject.entity);

                    // if entity id is a relation, then extract referenced column from that relation
                    const columnRelation = subject.metadata.relations.find(relation => relation.propertyName === column.propertyName);

                    if (entityValue && columnRelation) { // not sure if we need handle join column from inverse side
                        columnRelation.joinColumns.forEach(joinColumn => {
                            let relationIdOfEntityValue = entityValue[joinColumn.referencedColumn!.propertyName];
                            if (!relationIdOfEntityValue) {
                                const entityValueInsertSubject = this.insertSubjects.find(subject => subject.entity === entityValue);
                                if (entityValueInsertSubject) {
                                    if (joinColumn.referencedColumn!.isGenerated && entityValueInsertSubject.generatedMap)
                                        relationIdOfEntityValue = joinColumn.referencedColumn!.getEntityValue(entityValueInsertSubject.generatedMap);
                                }
                            }
                            if (relationIdOfEntityValue) {
                                conditions[column.databaseName] = relationIdOfEntityValue;
                            }
                        });

                    } else {
                        if (entityValue) {
                            conditions[column.databaseName] = entityValue;
                        } else {
                            if (subject.generatedMap)
                                conditions[column.databaseName] = column.getEntityValue(subject.generatedMap);
                        }
                    }
                });
                if (!Object.keys(conditions).length)
                    return;



                const updatePromise = this.queryRunner.update(subject.metadata.tablePath, updateOptions, conditions);
                updatePromises.push(updatePromise);
            }

            // we need to update relation ids if newly inserted objects are used from inverse side in one-to-many inverse relation
            // we also need to update relation ids if newly inserted objects are used from inverse side in one-to-one inverse relation
            const oneToManyAndOneToOneNonOwnerRelations = subject.metadata.oneToManyRelations.concat(subject.metadata.oneToOneRelations.filter(relation => !relation.isOwning));
            // console.log(oneToManyAndOneToOneNonOwnerRelations);
            subject.metadata.extractRelationValuesFromEntity(subject.entity, oneToManyAndOneToOneNonOwnerRelations)
                .forEach(([relation, subRelatedEntity, inverseEntityMetadata]) => {
                    relation.inverseRelation!.joinColumns.forEach(joinColumn => {

                        const referencedColumn = joinColumn.referencedColumn!;
                        const columns = inverseEntityMetadata.parentEntityMetadata ? inverseEntityMetadata.primaryColumns : inverseEntityMetadata.primaryColumns;
                        const conditions: ObjectLiteral = {};

                        columns.forEach(column => {
                            const entityValue = column.getEntityValue(subRelatedEntity);

                            // if entity id is a relation, then extract referenced column from that relation
                            const columnRelation = inverseEntityMetadata.relations.find(relation => relation.propertyName === column.propertyName);

                            if (entityValue && columnRelation) { // not sure if we need handle join column from inverse side
                                columnRelation.joinColumns.forEach(columnRelationJoinColumn => {
                                    let relationIdOfEntityValue = entityValue[columnRelationJoinColumn.referencedColumn!.propertyName];
                                    if (!relationIdOfEntityValue) {
                                        const entityValueInsertSubject = this.insertSubjects.find(subject => subject.entity === entityValue);
                                        if (entityValueInsertSubject) {
                                            if (columnRelationJoinColumn.referencedColumn!.isGenerated && entityValueInsertSubject.generatedMap) {
                                                relationIdOfEntityValue = columnRelationJoinColumn.referencedColumn!.getEntityValue(entityValueInsertSubject.generatedMap);
                                            }
                                        }
                                    }
                                    if (relationIdOfEntityValue) {
                                        conditions[column.databaseName] = relationIdOfEntityValue;
                                    }
                                });

                            } else {
                                const entityValueInsertSubject = this.insertSubjects.find(subject => subject.entity === subRelatedEntity);
                                if (entityValue) {
                                    conditions[column.databaseName] = entityValue;
                                } else {
                                    if (entityValueInsertSubject && entityValueInsertSubject.generatedMap)
                                        conditions[column.databaseName] = column.getEntityValue(entityValueInsertSubject.generatedMap);
                                }
                            }
                        });

                        if (!Object.keys(conditions).length)
                            return;

                        const updateOptions: ObjectLiteral = {};
                        const columnRelation = relation.inverseEntityMetadata.relations.find(rel => rel.propertyName === referencedColumn.propertyName);
                        const columnValue = referencedColumn.getEntityValue(subject.entity);
                        if (columnRelation) {
                            let id = columnRelation.getEntityValue(columnValue);
                            if (!id) {
                                const insertSubject = this.insertSubjects.find(subject => subject.entity === columnValue);
                                if (insertSubject) {
                                    if (insertSubject.generatedMap)
                                        id = referencedColumn.getEntityValue(insertSubject.generatedMap);
                                }
                            }
                            updateOptions[joinColumn.databaseName] = id;
                        } else {
                            const generatedColumnValue = subject.generatedMap ? referencedColumn.getEntityValue(subject.generatedMap) : undefined;
                            updateOptions[joinColumn.databaseName] = columnValue || generatedColumnValue;
                        }

                        const updatePromise = this.queryRunner.update(relation.inverseEntityMetadata.tablePath, updateOptions, conditions);
                        updatePromises.push(updatePromise);

                    });
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
        let insertResult: any, parentGeneratedId: any;

        // if entity uses class table inheritance then we need to separate entity into sub values that will be inserted into multiple tables
        if (metadata.isClassTableChild) { // todo: with current implementation inheritance of multiple class table children will not work

            // first insert entity values into parent class table
            const parentValuesMap = this.collectColumnsAndValues(parentEntityMetadata, entity, subject.date, undefined, metadata.discriminatorValue, alreadyInsertedSubjects, "insert");
            insertResult = parentGeneratedId = await this.queryRunner.insert(parentEntityMetadata.tablePath, parentValuesMap);

            // second insert entity values into child class table
            const childValuesMap = this.collectColumnsAndValues(metadata, entity, subject.date, insertResult.generatedMap[parentEntityMetadata.primaryColumns[0].propertyName], undefined, alreadyInsertedSubjects, "insert");
            const secondGeneratedId = await this.queryRunner.insert(metadata.tablePath, childValuesMap);
            if (!insertResult && secondGeneratedId) insertResult = secondGeneratedId;

        } else { // in the case when class table inheritance is not used

            const valuesMap = this.collectColumnsAndValues(metadata, entity, subject.date, undefined, undefined, alreadyInsertedSubjects, "insert");
            // console.log("valuesMap", valuesMap);
            insertResult = await this.queryRunner.insert(metadata.tablePath, valuesMap);
        }

        if (parentGeneratedId)
            subject.parentGeneratedId = parentGeneratedId.generatedMap[parentEntityMetadata.primaryColumns[0].propertyName];

        // todo: better if insert method will return object with all generated ids, object id, etc.
        if (insertResult.generatedMap)
            subject.generatedMap = insertResult.generatedMap;
    }

    private collectColumns(columns: ColumnMetadata[], entity: ObjectLiteral, object: ObjectLiteral, operation: "insert"|"update") {
        columns.forEach(column => {
            if (column.isVirtual || column.isParentId || column.isDiscriminator)
                return;
            if (operation === "update" && column.isReadonly)
                return;

            const value = entity[column.propertyName];
            if (value === undefined)
                return;

            object[column.databaseNameWithoutPrefixes] = this.connection.driver.preparePersistentValue(value, column); // todo: maybe preparePersistentValue is not responsibility of this class
        });
    }

    private collectEmbeds(embed: EmbeddedMetadata, entity: ObjectLiteral, object: ObjectLiteral, operation: "insert"|"update") {

        if (embed.isArray) {
            if (entity[embed.propertyName] instanceof Array) {
                if (!object[embed.prefix])
                    object[embed.prefix] = [];

                entity[embed.propertyName].forEach((subEntity: any, index: number) => {
                    if (!object[embed.prefix][index])
                        object[embed.prefix][index] = {};
                    this.collectColumns(embed.columns, subEntity, object[embed.prefix][index], operation);
                    embed.embeddeds.forEach(childEmbed => this.collectEmbeds(childEmbed, subEntity, object[embed.prefix][index], operation));
                });
            }
        } else {
            if (entity[embed.propertyName] !== undefined) {
                if (!object[embed.prefix])
                    object[embed.prefix] = {};
                this.collectColumns(embed.columns, entity[embed.propertyName], object[embed.prefix], operation);
                embed.embeddeds.forEach(childEmbed => this.collectEmbeds(childEmbed, entity[embed.propertyName], object[embed.prefix], operation));
            }
        }
    }

    /**
     * Collects columns and values for the insert operation.
     */
    private collectColumnsAndValues(metadata: EntityMetadata, entity: ObjectLiteral, date: Date, parentIdColumnValue: any, discriminatorValue: any, alreadyInsertedSubjects: Subject[], operation: "insert"|"update"): ObjectLiteral {

        const values: ObjectLiteral = {};

        if (this.connection.driver instanceof MongoDriver) {
            this.collectColumns(metadata.ownColumns, entity, values, operation);
            metadata.embeddeds.forEach(embed => this.collectEmbeds(embed, entity, values, operation));

        } else {
            metadata.columns.forEach(column => {
                if (column.isVirtual || column.isParentId || column.isDiscriminator)
                    return;

                const value = column.getEntityValue(entity);
                if (value === undefined)
                    return;

                values[column.databaseName] = this.connection.driver.preparePersistentValue(value, column); // todo: maybe preparePersistentValue is not responsibility of this class
            });
        }

        metadata.relationsWithJoinColumns.forEach(relation => {
            relation.joinColumns.forEach(joinColumn => {

                let relationValue: any;
                const value = relation.getEntityValue(entity);

                if (value) {
                    // if relation value is stored in the entity itself then use it from there
                    const relationId = joinColumn.referencedColumn!.getEntityValue(value); // relation.getInverseEntityRelationId(value); // todo: check it
                    if (relationId) {
                        relationValue = relationId;
                    }

                    // otherwise try to find relational value from just inserted subjects
                    const alreadyInsertedSubject = alreadyInsertedSubjects.find(insertedSubject => {
                        return insertedSubject.entity === value;
                    });
                    if (alreadyInsertedSubject) {
                        const referencedColumn = joinColumn.referencedColumn!;
                        // if join column references to the primary generated column then seek in the newEntityId of the insertedSubject
                        if (referencedColumn.referencedColumn && referencedColumn.referencedColumn!.isGenerated) {
                            if (referencedColumn.isParentId) {
                                relationValue = alreadyInsertedSubject.parentGeneratedId;
                            }
                            // todo: what if reference column is not generated?
                            // todo: what if reference column is not related to table inheritance?
                        }

                        if (referencedColumn.isGenerated && alreadyInsertedSubject.generatedMap)
                            relationValue = referencedColumn.getEntityValue(alreadyInsertedSubject.generatedMap);
                        // if it references to create or update date columns
                        if (referencedColumn.isCreateDate || referencedColumn.isUpdateDate)
                            relationValue = this.connection.driver.preparePersistentValue(alreadyInsertedSubject.date, referencedColumn);
                        // if it references to version column
                        if (referencedColumn.isVersion)
                            relationValue = this.connection.driver.preparePersistentValue(1, referencedColumn);
                    }
                } else if (relation.inverseRelation) {
                    const inverseSubject = this.allSubjects.find(subject => {
                        if (!subject.hasEntity || subject.entityTarget !== relation.inverseRelation!.target)
                            return false;

                        const inverseRelationValue = relation.inverseRelation!.getEntityValue(subject.entity);
                        if (inverseRelationValue) {
                            if (inverseRelationValue instanceof Array) {
                                return inverseRelationValue.find(subValue => subValue === subValue);
                            } else {
                                return inverseRelationValue === entity;
                            }
                        }
                    });
                    if (inverseSubject && joinColumn.referencedColumn!.getEntityValue(inverseSubject.entity)) {
                        relationValue = joinColumn.referencedColumn!.getEntityValue(inverseSubject.entity);
                    }
                }

                if (relationValue) {
                    values[joinColumn.databaseName] = relationValue;
                }

            });
        });

        // add special column and value - date of creation
        if (metadata.createDateColumn) {
            const value = this.connection.driver.preparePersistentValue(date, metadata.createDateColumn);
            values[metadata.createDateColumn.databaseName] = value;
        }

        // add special column and value - date of updating
        if (metadata.updateDateColumn) {
            const value = this.connection.driver.preparePersistentValue(date, metadata.updateDateColumn);
            values[metadata.updateDateColumn.databaseName] = value;
        }

        // add special column and value - version column
        if (metadata.versionColumn) {
            const value = this.connection.driver.preparePersistentValue(1, metadata.versionColumn);
            values[metadata.versionColumn.databaseName] = value;
        }

        // add special column and value - discriminator value (for tables using table inheritance)
        if (metadata.discriminatorColumn) {
            const value = this.connection.driver.preparePersistentValue(discriminatorValue || metadata.discriminatorValue, metadata.discriminatorColumn);
            values[metadata.discriminatorColumn.databaseName] = value;
        }

        metadata.generatedColumns
            .filter(column => column.generationStrategy === "uuid")
            .forEach(column => {
                if (column.isNullable && values[column.databaseName] === null)
                    return;
                const uuid = this.connection.driver.preparePersistentValue("", column);
                if (uuid && !values[column.databaseName])
                    values[column.databaseName] = uuid;
            });

        // add special column and value - tree level and tree parents (for tree-type tables)
        if (metadata.treeLevelColumn && metadata.treeParentRelation) {
            const parentEntity = metadata.treeParentRelation.getEntityValue(entity);
            const parentLevel = parentEntity ? (metadata.treeLevelColumn.getEntityValue(parentEntity) || 0) : 0;

            values[metadata.treeLevelColumn.databaseName] = parentLevel + 1;
        }

        // add special column and value - parent id column (for tables using table inheritance)
        if (metadata.parentEntityMetadata && metadata.parentIdColumns.length) { // todo: should be array of primary keys
            values[metadata.parentIdColumns[0].databaseName] = parentIdColumnValue || metadata.parentEntityMetadata.primaryColumns[0].getEntityValue(entity);
        }

        return values;
    }

    // -------------------------------------------------------------------------
    // Private Methods: Insertion into closure tables
    // -------------------------------------------------------------------------

    /**
     * Inserts all given subjects into closure table.
     */
    private executeInsertClosureTableOperations(/*, updatesByRelations: Subject[]*/) { // todo: what to do with updatesByRelations
        const promises = this.insertSubjects
            .filter(subject => subject.metadata.isClosure)
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
        const tablePath = subject.metadata.closureJunctionTable.tablePath;
        const referencedColumn = subject.metadata.treeParentRelation!.joinColumns[0].referencedColumn!; // todo: check if joinColumn works
        // todo: fix joinColumns[0] usage

        let newEntityId = referencedColumn.getEntityValue(subject.entity);
        if (!newEntityId && referencedColumn.isGenerated && subject.generatedMap) {
            newEntityId = referencedColumn.getEntityValue(subject.generatedMap);
            // we should not handle object id here because closure tables are not supported by mongodb driver.
        } // todo: implement other special column types too

        const parentEntity = subject.metadata.treeParentRelation!.getEntityValue(subject.entity);
        let parentEntityId: any = 0; // zero is important
        if (parentEntity) {
            parentEntityId = referencedColumn.getEntityValue(parentEntity);
            if (!parentEntityId && referencedColumn.isGenerated) {
                const parentInsertedSubject = this.insertSubjects.find(subject => subject.entity === parentEntity);
                // todo: throw exception if parentInsertedSubject is not set
                if (parentInsertedSubject!.generatedMap)
                    parentEntityId = referencedColumn.getEntityValue(parentInsertedSubject!.generatedMap!);
            } // todo: implement other special column types too
        }

        // try to find parent entity id in some other entity that has this entity in its children
        if (!parentEntityId) {
            const parentSubject = this.allSubjects.find(allSubject => {
                if (!allSubject.hasEntity || !allSubject.metadata.isClosure || !allSubject.metadata.treeChildrenRelation)
                    return false;

                const children = subject.metadata.treeChildrenRelation!.getEntityValue(allSubject.entity);
                return children instanceof Array ? children.indexOf(subject.entity) !== -1 : false;
            });

            if (parentSubject) {
                parentEntityId = referencedColumn.getEntityValue(parentSubject.entity);
                if (!parentEntityId && parentSubject.generatedMap) { // if still not found then it means parent just inserted with generated column
                    parentEntityId = referencedColumn.getEntityValue(parentSubject.generatedMap);
                }
            }
        }

        // if parent entity exist then insert a new row into closure table
        subject.treeLevel = await this.queryRunner.insertIntoClosureTable(tablePath, newEntityId, parentEntityId, !!subject.metadata.treeLevelColumn);

        if (subject.metadata.treeLevelColumn) {
            const values = { [subject.metadata.treeLevelColumn.databaseName]: subject.treeLevel };
            await this.queryRunner.update(subject.metadata.tablePath, values, { [referencedColumn.databaseName]: newEntityId });
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

            /*const value: ObjectLiteral = {};
            subject.metadata.columns.forEach(column => {
                const columnValue = column.getEntityValue(entity);
                if (columnValue !== undefined)
                    value[column.databaseName] = columnValue;
            });*/
            // addEmbeddedValuesRecursively(entity, value, subject.metadata.embeddeds);

            const value: ObjectLiteral = {};
            this.collectColumns(subject.metadata.ownColumns, entity, value, "update");
            subject.metadata.embeddeds.forEach(embed => this.collectEmbeds(embed, entity, value, "update"));

            // if number of updated columns = 0 no need to update updated date and version columns
            if (Object.keys(value).length === 0)
                return;

            if (subject.metadata.updateDateColumn)
                value[subject.metadata.updateDateColumn.databaseName] = this.connection.driver.preparePersistentValue(new Date(), subject.metadata.updateDateColumn);

            if (subject.metadata.versionColumn)
                value[subject.metadata.versionColumn.databaseName] = this.connection.driver.preparePersistentValue(subject.metadata.versionColumn.getEntityValue(entity) + 1, subject.metadata.versionColumn);

            return this.queryRunner.update(subject.metadata.tablePath, value, idMap);
        }

        // we group by table name, because metadata can have different table names
        const valueMaps: { tablePath: string, metadata: EntityMetadata, values: ObjectLiteral }[] = [];

        // console.log(subject.diffColumns);
        subject.diffColumns.forEach(column => {
            // if (!column.entityTarget) return; // todo: how this can be possible?
            const metadata = this.connection.getMetadata(column.entityMetadata.target);
            let valueMap = valueMaps.find(valueMap => valueMap.tablePath === metadata.tablePath);
            if (!valueMap) {
                valueMap = { tablePath: metadata.tablePath, metadata: metadata, values: {} };
                valueMaps.push(valueMap);
            }

            valueMap.values[column.databaseName] = this.connection.driver.preparePersistentValue(column.getEntityValue(entity), column);
        });

        subject.diffRelations.forEach(relation => {
            let valueMap = valueMaps.find(valueMap => valueMap.tablePath === relation.entityMetadata.tablePath);
            if (!valueMap) {
                valueMap = { tablePath: relation.entityMetadata.tablePath, metadata: relation.entityMetadata, values: {} };
                valueMaps.push(valueMap);
            }

            const value = relation.getEntityValue(entity);
            relation.joinColumns.forEach(joinColumn => {
                valueMap!.values[joinColumn.databaseName] = value !== null && value !== undefined ? value[joinColumn.referencedColumn!.propertyName] : null; // todo: should not have a call to primaryColumn, instead join column metadata should be used
            });
        });

        // if number of updated columns = 0 no need to update updated date and version columns
        if (Object.keys(valueMaps).length === 0)
            return;

        if (subject.metadata.updateDateColumn) {
            let valueMap = valueMaps.find(valueMap => valueMap.tablePath === subject.metadata.tablePath);
            if (!valueMap) {
                valueMap = { tablePath: subject.metadata.tablePath, metadata: subject.metadata, values: {} };
                valueMaps.push(valueMap);
            }

            valueMap.values[subject.metadata.updateDateColumn.databaseName] = this.connection.driver.preparePersistentValue(new Date(), subject.metadata.updateDateColumn);
        }

        if (subject.metadata.versionColumn) {
            let valueMap = valueMaps.find(valueMap => valueMap.tablePath === subject.metadata.tablePath);
            if (!valueMap) {
                valueMap = { tablePath: subject.metadata.tablePath, metadata: subject.metadata, values: {} };
                valueMaps.push(valueMap);
            }

            valueMap.values[subject.metadata.versionColumn.databaseName] = this.connection.driver.preparePersistentValue(subject.metadata.versionColumn.getEntityValue(entity) + 1, subject.metadata.versionColumn);
        }

        if (subject.metadata.parentEntityMetadata) {
            if (subject.metadata.parentEntityMetadata.updateDateColumn) {
                let valueMap = valueMaps.find(valueMap => valueMap.tablePath === subject.metadata.parentEntityMetadata.tablePath);
                if (!valueMap) {
                    valueMap = {
                        tablePath: subject.metadata.parentEntityMetadata.tablePath,
                        metadata: subject.metadata.parentEntityMetadata,
                        values: {}
                    };
                    valueMaps.push(valueMap);
                }

                valueMap.values[subject.metadata.parentEntityMetadata.updateDateColumn.databaseName] = this.connection.driver.preparePersistentValue(new Date(), subject.metadata.parentEntityMetadata.updateDateColumn);
            }

            if (subject.metadata.parentEntityMetadata.versionColumn) {
                let valueMap = valueMaps.find(valueMap => valueMap.tablePath === subject.metadata.parentEntityMetadata.tablePath);
                if (!valueMap) {
                    valueMap = {
                        tablePath: subject.metadata.parentEntityMetadata.tablePath,
                        metadata: subject.metadata.parentEntityMetadata,
                        values: {}
                    };
                    valueMaps.push(valueMap);
                }

                valueMap.values[subject.metadata.parentEntityMetadata.versionColumn.databaseName] = this.connection.driver.preparePersistentValue(subject.metadata.parentEntityMetadata.versionColumn.getEntityValue(entity) + 1, subject.metadata.parentEntityMetadata.versionColumn);
            }
        }

        await Promise.all(valueMaps.map(valueMap => {
            const idMap = valueMap.metadata.getDatabaseEntityIdMap(entity);
            if (!idMap)
                throw new Error(`Internal error. Cannot get id of the updating entity.`);

            return this.queryRunner.update(valueMap.tablePath, valueMap.values, idMap);
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
            setRelation.relation.joinColumns.forEach(joinColumn => {
                const value = setRelation.value ? setRelation.value[joinColumn.referencedColumn!.propertyName] : null;
                values[joinColumn.databaseName] = value; // todo: || fromInsertedSubjects ??
            });
        });

        const idMap = subject.metadata.getDatabaseEntityIdMap(subject.databaseEntity);
        if (!idMap)
            throw new Error(`Internal error. Cannot get id of the updating entity.`);

        return this.queryRunner.update(subject.metadata.tablePath, values, idMap);
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
        if (subject.metadata.parentEntityMetadata) { // this code should not be there. it should be handled by  subject.metadata.getEntityIdColumnMap
            const parentConditions: ObjectLiteral = {};
            subject.metadata.primaryColumns.forEach(column => {
                parentConditions[column.databaseName] = column.getEntityValue(subject.databaseEntity);
            });
            await this.queryRunner.delete(subject.metadata.parentEntityMetadata.tableName, parentConditions);

            const childConditions: ObjectLiteral = {};
            subject.metadata.primaryColumns.forEach(column => {
                childConditions[column.databaseName] = column.getEntityValue(subject.databaseEntity);
            });
            await this.queryRunner.delete(subject.metadata.tableName, childConditions);
        } else {
            await this.queryRunner.delete(subject.metadata.tableName, subject.metadata.getDatabaseEntityIdMap(subject.databaseEntity)!);
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

        const getRelationId = (entity: ObjectLiteral, joinColumns: ColumnMetadata[]): any[] => {
            return joinColumns.map(joinColumn => {
                const id = joinColumn.referencedColumn!.getEntityValue(entity);
                if (!id && joinColumn.referencedColumn!.isGenerated) {
                    const insertSubject = this.insertSubjects.find(subject => subject.entity === entity);
                    if (insertSubject && insertSubject.generatedMap)
                        return joinColumn.referencedColumn!.getEntityValue(insertSubject.generatedMap);
                }
                // todo: implement other special referenced column types (update date, create date, version, discriminator column, etc.)

                return id;
            });
        };

        const relation = junctionInsert.relation;
        const joinColumns = relation.isManyToManyOwner ? relation.joinColumns : relation.inverseRelation!.inverseJoinColumns;
        const ownId = getRelationId(subject.entity, joinColumns);

        if (!ownId.length)
            throw new Error(`Cannot insert object of ${subject.entityTarget} type. Looks like its not persisted yet, or cascades are not set on the relation.`); // todo: better error message

        const promises = junctionInsert.junctionEntities.map(newBindEntity => {

            // get relation id from the newly bind entity
            const joinColumns = relation.isManyToManyOwner ? relation.inverseJoinColumns : relation.inverseRelation!.joinColumns;
            const relationId = getRelationId(newBindEntity, joinColumns);

            // if relation id still does not exist - we arise an error
            if (!relationId)
                throw new Error(`Cannot insert object of ${(newBindEntity.constructor as any).name} type. Looks like its not persisted yet, or cascades are not set on the relation.`); // todo: better error message

            const columns = relation.junctionEntityMetadata!.columns.map(column => column.databaseName);
            const values = relation.isOwning ? [...ownId, ...relationId] : [...relationId, ...ownId];

            return this.queryRunner.insert(relation.junctionEntityMetadata!.tablePath, OrmUtils.zipObject(columns, values));
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
        const junctionMetadata = junctionRemove.relation.junctionEntityMetadata!;
        const entity = subject.hasEntity ? subject.entity : subject.databaseEntity;

        const firstJoinColumns = junctionRemove.relation.isOwning ? junctionRemove.relation.joinColumns : junctionRemove.relation.inverseRelation!.inverseJoinColumns;
        const secondJoinColumns = junctionRemove.relation.isOwning ? junctionRemove.relation.inverseJoinColumns : junctionRemove.relation.inverseRelation!.joinColumns;
        let conditions: ObjectLiteral = {};
        firstJoinColumns.forEach(joinColumn => {
            conditions[joinColumn.databaseName] = joinColumn.referencedColumn!.getEntityValue(entity);
        });

        const removePromises = junctionRemove.junctionRelationIds.map(relationIds => {
            let inverseConditions: ObjectLiteral = {};
            secondJoinColumns.forEach(joinColumn => {
                inverseConditions[joinColumn.databaseName] = joinColumn.referencedColumn!.getEntityValue(relationIds);
            });
            return this.queryRunner.delete(junctionMetadata.tableName, Object.assign({}, inverseConditions, conditions));
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
            // if (subject.generatedObjectId && subject.metadata.objectIdColumn)
            //     subject.metadata.objectIdColumn.setEntityValue(subject.entity, subject.generatedObjectId);

            if (subject.generatedMap) {
                subject.metadata.generatedColumns.forEach(generatedColumn => {
                    const generatedValue = generatedColumn.getEntityValue(subject.generatedMap!);
                    if (!generatedValue)
                        return;

                    generatedColumn.setEntityValue(subject.entity, generatedValue);
                });
            }
            subject.metadata.primaryColumns.forEach(primaryColumn => {
                if (subject.parentGeneratedId)
                    primaryColumn.setEntityValue(subject.entity, subject.parentGeneratedId);
            });

            if (subject.metadata.updateDateColumn)
                subject.metadata.updateDateColumn.setEntityValue(subject.entity, subject.date);
            if (subject.metadata.createDateColumn)
                subject.metadata.createDateColumn.setEntityValue(subject.entity, subject.date);
            if (subject.metadata.versionColumn)
                subject.metadata.versionColumn.setEntityValue(subject.entity, 1);
            if (subject.metadata.treeLevelColumn) {
                // const parentEntity = insertOperation.entity[metadata.treeParentMetadata.propertyName];
                // const parentLevel = parentEntity ? (parentEntity[metadata.treeLevelColumn.propertyName] || 0) : 0;
                subject.metadata.treeLevelColumn.setEntityValue(subject.entity, subject.treeLevel);
            }
            /*if (subject.metadata.hasTreeChildrenCountColumn) {
                 subject.entity[subject.metadata.treeChildrenCountColumn.propertyName] = 0;
            }*/

            // set values to "null" for nullable columns that did not have values
            subject.metadata.columns
                .filter(column => column.isNullable && !column.isVirtual)
                .forEach(column => {
                    const columnValue = column.getEntityValue(subject.entity);
                    if (columnValue === undefined)
                        column.setEntityValue(subject.entity, null);
                });
        });

        // update special columns that gets updated on each entity update
        this.updateSubjects.forEach(subject => {
            if (subject.metadata.updateDateColumn)
                subject.metadata.updateDateColumn.setEntityValue(subject.entity, subject.date);
            if (subject.metadata.versionColumn)
                subject.metadata.versionColumn.setEntityValue(subject.entity, subject.metadata.versionColumn.getEntityValue(subject.entity) + 1);
        });

        // remove ids from the entities that were removed
        this.removeSubjects
            .filter(subject => subject.hasEntity)
            .forEach(subject => {
                subject.metadata.primaryColumns.forEach(primaryColumn => {
                    primaryColumn.setEntityValue(subject.entity, undefined);
                });
            });

        this.allSubjects
            .filter(subject => subject.hasEntity)
            .forEach(subject => {
                subject.metadata.relationIds.forEach(relationId => {
                    relationId.setValue(subject.entity);
                });
            });
    }

}
