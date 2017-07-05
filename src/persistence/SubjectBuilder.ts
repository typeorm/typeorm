import {EntityMetadata} from "../metadata/EntityMetadata";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {Connection} from "../connection/Connection";
import {Subject} from "./Subject";
import {MongoDriver} from "../driver/mongodb/MongoDriver";
import {OrmUtils} from "../util/OrmUtils";
import {QueryRunner} from "../query-runner/QueryRunner";

/**
 * To be able to execute persistence operations we need to load all entities from the database we need.
 * Loading should be efficient - we need to load entities in as few queries as possible + load as less data as we can.
 * This is how we determine which entities needs to be loaded from db:
 *
 * 1. example with cascade updates and inserts:
 *
 * [Y] - means "yes, we load"
 * [N] - means "no, we don't load"
 * in {} braces we specify what cascade options are set between relations
 *
 * if Post is new, author is not set in the post
 *
 * [Y] Post -> {all} // yes because of "update" and "insert" cascades, no because of "remove"
 *   [Y] Author -> {all} // no because author is not set
 *     [Y] Photo -> {all} // no because author and its photo are not set
 *       [Y] Tag -> {all} // no because author and its photo and its tag are not set
 *
 * if Post is new, author is new (or anything else is new)
 * if Post is updated
 * if Post and/or Author are updated
 *
 * [Y] Post -> {all} // yes because of "update" and "insert" cascades, no because of "remove"
 *   [Y] Author -> {all} // yes because of "update" and "insert" cascades, no because of "remove"
 *     [Y] Photo -> {all} // yes because of "update" and "insert" cascades, no because of "remove"
 *       [Y] Tag -> {all} // yes because of "update" and "insert" cascades, no because of "remove"
 *
 * Here we load post, author, photo, tag to check if they are new or not to persist insert or update operation.
 * We load post, author, photo, tag only if they exist in the relation.
 * From these examples we can see that we always load entity relations when it has "update" or "insert" cascades.
 *
 * 2. example with cascade removes
 *
 * if entity is new its remove operations by cascades should not be executed
 * if entity is updated then values that are null or missing in array (not undefined!, undefined means skip - don't do anything) are treated as removed
 * if entity is removed then all its downside relations which has cascade remove should be removed
 *
 * Once we find removed entity - we load it, and every downside entity which has "remove" cascade set.
 *
 * At the end we have all entities we need to operate with.
 * Next step is to store all loaded entities to manipulate them efficiently.
 *
 * Rules of updating by cascades.
 * Insert operation can lead to:
 *  - insert operations
 *  - update operations
 * Update operation can lead to:
 *  - insert operations
 *  - update operations
 *  - remove operations
 * Remove operation can lead to:
 *  - remove operation
 */
export class SubjectBuilder<Entity extends ObjectLiteral> {

    // -------------------------------------------------------------------------
    // Protected properties
    // -------------------------------------------------------------------------

    /**
     * If this gonna be reused then what to do with marked flags?
     * One of solution can be clone this object and reset all marked states for this persistence.
     * Or from reused just extract databaseEntities from their subjects? (looks better)
     */
    operateSubjects: Subject[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection, protected queryRunner: QueryRunner) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Builds operations for entity that is being inserted/updated.
     */
    async persist(entity: Entity, metadata: EntityMetadata): Promise<void> {

        // create subject for currently persisted entity and mark that it can be inserted and updated
        const mainPersistedSubject = new Subject(metadata, entity);
        mainPersistedSubject.canBeInserted = true;
        mainPersistedSubject.canBeUpdated = true;
        this.operateSubjects.push(mainPersistedSubject);

        // next step we build list of subjects we will operate with
        // these subjects are subjects that we need to insert or update alongside with main persisted entity
        this.buildCascadeUpdateAndInsertOperateSubjects(mainPersistedSubject);

        // next step is to load database entities of all operate subjects
        await this.loadOperateSubjectsDatabaseEntities();

        // next step - we filter subjects with database entities (only for non-new entities)
        // and find operate subjects that needs to be removed
        // here we also find operate subjects which relations should be updated
        // these relations usually are "update from inverse side" operations
        const operateSubjectsWithDatabaseEntities = this.operateSubjects.filter(subject => subject.hasDatabaseEntity);
        await Promise.all(operateSubjectsWithDatabaseEntities.map(subject => {
            return this.buildCascadeRemovedAndRelationUpdateOperateSubjects(subject);
        }));

        // finally find which operate subjects have insert and remove operations in their junction tables
        await this.buildJunctionOperations({ insert: true, remove: true });
    }

    /**
     * Builds only remove operations for entity that is being removed.
     */
    async remove(entity: Entity, metadata: EntityMetadata): Promise<void> {

        // create subject for currently removed entity and mark that it must be removed
        const mainRemovedSubject = new Subject(metadata, entity);
        mainRemovedSubject.mustBeRemoved = true;
        this.operateSubjects.push(mainRemovedSubject);

        // next step we build list of subjects we will operate with
        // these subjects are subjects that we need to remove alongside with main removed entity
        this.buildCascadeRemoveOperateSubjects(mainRemovedSubject);

        // next step is to load database entities for all operate subjects
        await this.loadOperateSubjectsDatabaseEntities();

        // next step - we filter subjects with database entities (only for non-new entities)
        // and find operate subjects that needs to be removed
        // todo(this should not be in remove?) // here we also find operate subjects which relations should be updated
        // todo(this should not be in remove?) // these relations usually are "update from inverse side" operations
        const operateSubjectsWithDatabaseEntities = this.operateSubjects.filter(subject => subject.hasDatabaseEntity);
        await Promise.all(operateSubjectsWithDatabaseEntities.map(subject => {
            return this.buildCascadeRemovedAndRelationUpdateOperateSubjects(subject);
        }));

        // finally find which operate subjects have remove operations in their junction tables
        await this.buildJunctionOperations({ insert: false, remove: true });
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Builds and pushes to array of operate entities all entities that we will work with.
     * These are only relational entities which has insert and update cascades.
     * All such entities will be loaded from the database, because they can be inserted or updated.
     * That's why we load them - to understand if they should be inserted or updated, or which columns we need to update.
     * We can't add removed entities here, because to know which entity was removed we need first to
     * load original entity (particularly its id) from the database.
     * That's why we first need to load all changed entities, then extract ids of the removed entities from them,
     * and only then load removed entities by extracted ids.
     */
    protected buildCascadeUpdateAndInsertOperateSubjects(subject: Subject): void {
        subject.metadata
            .extractRelationValuesFromEntity(subject.entity, subject.metadata.relations)
            .filter(([relation, value, valueMetadata]) => {

                // we need only defined values and insert or update cascades of the relation should be set
                return value !== undefined && value !== null && (relation.isCascadeInsert || relation.isCascadeUpdate);
            })
            .forEach(([relation, value, valueMetadata]) => {

                // if we already has this entity in list of operated subjects then skip it to avoid recursion
                const alreadyExistValueSubject = this.findByEntityLike(valueMetadata.target, value);
                if (alreadyExistValueSubject) {
                    if (alreadyExistValueSubject.canBeInserted === false)
                        alreadyExistValueSubject.canBeInserted = relation.isCascadeInsert === true;
                    if (alreadyExistValueSubject.canBeUpdated === false)
                        alreadyExistValueSubject.canBeUpdated = relation.isCascadeUpdate === true;
                    return;
                }

                // mark subject with what we can do with it
                // and add to the array of subjects to load only if there is no same entity there already
                const valueSubject = new Subject(valueMetadata, value);
                valueSubject.canBeInserted = relation.isCascadeInsert === true;
                valueSubject.canBeUpdated = relation.isCascadeUpdate === true;
                this.operateSubjects.push(valueSubject);

                // go recursively and find other entities we need to operate with
                this.buildCascadeUpdateAndInsertOperateSubjects(valueSubject);
            });
    }

    /**
     * Builds and pushes to array of operate entities all entities that must be removed.
     */
    protected buildCascadeRemoveOperateSubjects(subject: Subject): void {
        subject.metadata
            .extractRelationValuesFromEntity(subject.entity, subject.metadata.relations)
            .filter(([relation, value, valueMetadata]) => {

                // we need only defined values and insert cascades of the relation should be set
                return value !== undefined && value !== null && relation.isCascadeRemove;
            })
            .forEach(([relation, value, valueMetadata]) => {

                // if we already has this entity in list of operated subjects then skip it to avoid recursion
                const alreadyExistValueSubject = this.findByEntityLike(valueMetadata.target, value);
                if (alreadyExistValueSubject) {
                    alreadyExistValueSubject.mustBeRemoved = true;
                    return;
                }

                // add to the array of subjects to load only if there is no same entity there already
                const valueSubject = new Subject(valueMetadata, value);
                valueSubject.mustBeRemoved = true;
                this.operateSubjects.push(valueSubject);

                // go recursively and find other entities to load by cascades in currently inserted entities
                this.buildCascadeRemoveOperateSubjects(valueSubject);
            });
    }

    /**
     * Loads database entities for all operate subjects which do not have database entity set.
     * All entities that we load database entities for are marked as updated or inserted.
     * To understand which of them really needs to be inserted or updated we need to load
     * their original representations from the database.
     */
    protected async loadOperateSubjectsDatabaseEntities(): Promise<void> {

        // we are grouping subjects by target to perform more optimized queries using WHERE IN operator
        // go throw the groups and perform loading of database entities of each subject in the group
        const promises = this.groupByEntityTargets().map(async subjectGroup => {

            // prepare entity ids of the subjects we need to load
            const allIds = subjectGroup.subjects
                .filter(subject => !subject.hasDatabaseEntity) // we don't load if subject already has a database entity loaded
                .filter(subject => {
                    return !subject.metadata.isEntityMapEmpty(subject.entity);
                }) // we only need entity id
                .map(subject => { // we don't need empty ids
                    // console.log(subject.entity);
                    return subject.metadata.getEntityIdMap(subject.entity);
                    // if (mixedId instanceof Object)
                    //     return Object.keys(mixedId).every(key => mixedId[key] !== undefined && mixedId[key] !== null && mixedId[key] !== "");
                    //
                    // return mixedId !== undefined && mixedId !== null && mixedId !== "";
                });

            // if there no ids found (which means all entities are new and have generated ids) - then nothing to load there
            // console.log("allIds: ", allIds);
            // console.log("subject.entity: ", subjectGroup.subjects);
            // console.log("allIds: ", allIds);
            if (!allIds.length)
                return;
            // console.log("Y");

            // load database entities for all given ids
            // todo: such implementation is temporary, need to create a good abstraction there
            // todo: its already possible to do that with repository.findByIds method however setting "RELATION_ID_VALUES" option is an issue
            // todo: also custom queryRunnerProvider is an issue
            let entities: any[];
            if (this.connection.driver instanceof MongoDriver) {

                entities = await this.connection
                    .getMongoRepository<ObjectLiteral>(subjectGroup.target)
                    .findByIds(allIds);

            } else {
                entities = await this.connection
                    .getRepository<ObjectLiteral>(subjectGroup.target)
                    .createQueryBuilder("subject", this.queryRunner)
                    .whereInIds(allIds)
                    .loadAllRelationIds()
                    .getMany();
            }

            // now when we have entities we need to find subject of each entity
            // and insert that entity into database entity of the found subject
            entities.forEach(entity => {
                // console.log(1);
                const subject = this.findByEntityLike(subjectGroup.target, entity);
                if (subject)
                    subject.databaseEntity = entity;
            });

        });

        await Promise.all(promises);
    }

    /**
     * We need to load removed entity when:
     *  - entity with relations is not new (this can be determined only after entity is loaded from db)
     *      (note: simple "id" check will not work because id can be not generated)
     *  - entity missing relation. When relation is simple
     *      - in the case of one-to-one owner (with join column) relation we need to load owner entity
     *      - in the case of one-to-one (without join column) relation we need to load inverse side entity
     *      - in the case of many-to-one relations we need to load entity itself
     *      - in the case of one-to-many relations we need to load entities by relation from inverse side
     *
     *  Before loading each entity we need to check in the loaded subjects - maybe it was already loaded.
     *
     *  BIG NOTE: objects are being removed by cascades not only when relation is removed, but also when
     *  relation is replaced (e.g. changed with different object).
     */
    protected async buildCascadeRemovedAndRelationUpdateOperateSubjects(subject: Subject): Promise<void> {

        // note: we can't use extractRelationValuesFromEntity here because it does not handle empty arrays
        const promises = subject.metadata.relations.map(async relation => {
            const valueMetadata = relation.inverseEntityMetadata;
            const qbAlias = valueMetadata.tableName;

            // added for type-safety, but subject without databaseEntity cant come here anyway because of checks on upper levels
            if (!subject.hasDatabaseEntity) return;

            // for one-to-one owner and many-to-one relations no need to load entity to check if something removed
            // because join column is in this side of relation and we have a database entity with which we can compare
            // and understand if relation was removed or not
            if (relation.isOneToOneOwner || relation.isManyToOne) {

                // we only work with cascade removes here
                if (!relation.isCascadeRemove) return;

                /**
                 * By example (one-to-one owner). Let's say we have a one-to-one relation between Post and Details.
                 * Post contains detailsId. It means he owns relation. Post has cascade remove with details.
                 * Now here we have a post object with removed details.
                 * We need to remove Details if post.details = null
                 * or if post.details != databasePost.details
                 */

                /**
                 * By example (many-to-one). Let's say we have a many-to-one relation between Post and Details.
                 * Post contains detailsId. It means he owns relation.
                 * It also means that post can have only one details, and details can have multiple posts.
                 * Post has cascade remove with details.
                 * Now here we have a post object with removed details.
                 * We need to remove Details (one) if post.details = null
                 * or if post.details != databasePost.details
                 */

                // (example) "relation" - is a relation in post with details.
                // (example) "valueMetadata" - is an entity metadata of the Details object.
                // (example) "persistValue" - is a detailsId from the persisted entity

                // note that if databaseEntity has relation, it can only be a relation id,
                // because of query builder option "RELATION_ID_VALUES" we used
                const relationIdInDatabaseEntity = relation.getEntityValue(subject.databaseEntity); // (example) returns post.detailsId

                // if database relation id does not exist in the database object then nothing to remove
                if (relationIdInDatabaseEntity === null || relationIdInDatabaseEntity === undefined)
                    return;

                // if this subject is persisted subject then we get its value to check if its not empty or its values changed
                let persistValueRelationId: any = undefined, persistValue: any = undefined;
                if (subject.hasEntity) {
                    persistValue = relation.getEntityValue(subject.entity);
                    if (persistValue === null) persistValueRelationId = null;
                    if (persistValue) persistValueRelationId = relation.joinColumns.reduce((map, column) => column.referencedColumn!.getEntityValueMap(persistValue), {} as ObjectLiteral);
                    if (persistValueRelationId === undefined) return; // skip undefined properties
                }

                // object is removed only if relation id in the persisted entity is empty or is changed
                // if (persistValueRelationId !== null && persistValueRelationId === relationIdInDatabaseEntity)
                //     return;
                // console.log("relationIdInDatabaseEntity:", relationIdInDatabaseEntity);
                // console.log("persistValue:", persistValue);
                // console.log("compareEntities:", relation.entityMetadata.compareEntities(relationIdInDatabaseEntity, persistValue));
                // console.log("compareIds:", relation.entityMetadata.compareIds(relationIdInDatabaseEntity, persistValue));
                if (persistValueRelationId !== null && relation.entityMetadata.compareIds(relationIdInDatabaseEntity, persistValue))
                    return;

                // first check if we already loaded this object before load from the database
                let alreadyLoadedRelatedDatabaseSubject = this.operateSubjects.find(relatedSubject => {

                    // (example) filter only subject that has database entity loaded and its target is Details
                    if (!relatedSubject.hasDatabaseEntity || relatedSubject.entityTarget !== valueMetadata.target)
                        return false;

                    // (example) here we seek a Details loaded from the database in the subjects
                    // (example) here relatedSubject.databaseEntity is a Details
                    // (example) and we need to compare details.id === post.detailsId
                    return relation.entityMetadata.compareIds(relationIdInDatabaseEntity, relation.getEntityValue(relatedSubject.databaseEntity));
                });

                // if not loaded yet then load it from the database
                if (!alreadyLoadedRelatedDatabaseSubject) {

                    // (example) we need to load a details where details.id = post.details
                    const qb = this.connection
                        .getRepository<ObjectLiteral>(valueMetadata.target)
                        .createQueryBuilder(qbAlias, this.queryRunner) // todo: this wont work for mongodb. implement this in some method and call it here instead?
                        .loadAllRelationIds();

                    const condition = relation.joinColumns.map(joinColumn => {
                        return `${qbAlias}.${joinColumn.referencedColumn!.propertyPath} = :${joinColumn.databaseName}`;
                    }).join(" AND ");

                    const parameters = relation.joinColumns.reduce((parameters, joinColumn) => {
                        parameters[joinColumn.databaseName] = joinColumn.referencedColumn!.getEntityValue(relationIdInDatabaseEntity);
                        return parameters;
                    }, {} as ObjectLiteral);

                    qb.where(condition)
                        .setParameters(parameters);

                    const databaseEntity = await qb.getOne();

                    if (databaseEntity) {
                        alreadyLoadedRelatedDatabaseSubject = new Subject(valueMetadata, undefined, databaseEntity);
                        this.operateSubjects.push(alreadyLoadedRelatedDatabaseSubject);
                    }
                }

                if (alreadyLoadedRelatedDatabaseSubject) {

                    // if object is already marked as removed then no need to proceed because it already was proceed
                    // if we remove this it will cause a recursion
                    if (alreadyLoadedRelatedDatabaseSubject.mustBeRemoved)
                        return;

                    alreadyLoadedRelatedDatabaseSubject.mustBeRemoved = true;
                    await this.buildCascadeRemovedAndRelationUpdateOperateSubjects(alreadyLoadedRelatedDatabaseSubject);
                }
            }

            // for one-to-one not owner we need to load entity to understand that it was really removed or not,
            // since column value that indicates relation is stored on inverse side
            if (relation.isOneToOneNotOwner) {

                // we only work with cascade removes here
                if (!relation.isCascadeRemove) return; // todo: no

                /**
                 * By example. Let's say we have a one-to-one relation between Post and Details.
                 * Post contains detailsId. It means he owns relation. Details has cascade remove with post.
                 * Now here we have a details object with removed post.
                 * We need to remove Post if details.post = null and databasePost.detailsId = details.id exist in the db,
                 * or if databasePost.id === details.post.id (we need to load it) and databasePost.detailsId != details.id
                 */

                // (example) "relation" - is a relation in details with post.
                // (example) "valueMetadata" - is an entity metadata of the Post object.
                // (example) "subject.databaseEntity" - is a details object

                // if this subject is persisted subject then we get its value to check if its not empty or its values changed
                let persistValueRelationId: any = undefined;
                if (subject.hasEntity && !subject.mustBeRemoved) {
                    const persistValue = relation.getEntityValue(subject.entity);
                    if (persistValue) persistValueRelationId = relation.inverseRelation!.getEntityValue(persistValue);
                    if (persistValueRelationId === undefined) return; // skip undefined properties
                }

                // (example) returns us referenced column (detail's id)
                const relationIdInDatabaseEntity = relation.inverseRelation!.joinColumns[0].referencedColumn!.getEntityValue(subject.databaseEntity);

                // if database relation id does not exist then nothing to remove (but can this be possible?)
                if (relationIdInDatabaseEntity === null || relationIdInDatabaseEntity === undefined)
                    return;

                // first check if we already have this object loaded before load from the database
                let alreadyLoadedRelatedDatabaseSubject = this.operateSubjects.find(relatedSubject => {

                    // (example) filter only subject that has database entity loaded and its target is Post
                    if (!relatedSubject.hasDatabaseEntity || relatedSubject.entityTarget !== valueMetadata.target)
                        return false;

                    // (example) here we seek a Post loaded from the database in the subjects
                    // (example) here relatedSubject.databaseEntity is a Post
                    // (example) and we need to compare post.detailsId === details.id
                    return relation.inverseRelation!.getEntityValue(relatedSubject.databaseEntity) === relationIdInDatabaseEntity;
                });

                // if not loaded yet then load it from the database
                if (!alreadyLoadedRelatedDatabaseSubject) {

                    // (example) we need to load a post where post.detailsId = details.id
                    const databaseEntity = await this.connection
                        .getRepository<ObjectLiteral>(valueMetadata.target)
                        .createQueryBuilder(qbAlias, this.queryRunner) // todo: this wont work for mongodb. implement this in some method and call it here instead?
                        .where(qbAlias + "." + relation.inverseSidePropertyPath + "=:id") // TODO relation.inverseRelation.joinColumns
                        .setParameter("id", relationIdInDatabaseEntity) // (example) subject.entity is a details here, and the value is details.id
                        .loadAllRelationIds()
                        .getOne();

                    // add only if database entity exist - because in the case of inverse side of the one-to-one relation
                    // we cannot check if it was removed or not until we query the database
                    // and it can be a situation that relation wasn't exist at all. This is particular that case
                    alreadyLoadedRelatedDatabaseSubject = new Subject(valueMetadata, undefined, databaseEntity);
                    this.operateSubjects.push(alreadyLoadedRelatedDatabaseSubject);
                }

                // check if we really has a relation between entities. If relation not found then alreadyLoadedRelatedDatabaseSubject will be empty
                if (alreadyLoadedRelatedDatabaseSubject && alreadyLoadedRelatedDatabaseSubject.hasDatabaseEntity) {

                    // also check if relation value exist then then make sure its changed
                    // (example) persistValue is a postFromPersistedDetails here
                    // (example) alreadyLoadedRelatedDatabaseSubject.databaseEntity is a postFromDatabaseDetails here
                    // (example) postFromPersistedDetails.id === postFromDatabaseDetails - means nothing changed
                    const inverseEntityRelationId = relation.inverseRelation!.getEntityValue(alreadyLoadedRelatedDatabaseSubject.databaseEntity);
                    if (persistValueRelationId && persistValueRelationId === inverseEntityRelationId)
                        return;

                    // if object is already marked as removed then no need to proceed because it already was proceed
                    // if we remove this it will cause a recursion
                    if (alreadyLoadedRelatedDatabaseSubject.mustBeRemoved)
                        return;

                    alreadyLoadedRelatedDatabaseSubject.mustBeRemoved = true;
                    await this.buildCascadeRemovedAndRelationUpdateOperateSubjects(alreadyLoadedRelatedDatabaseSubject);
                }
            }

            // for one-to-many we need to load entities to understand which was really removed
            // since column value that indicates relation is stored on inverse side
            if (relation.isOneToMany || relation.isManyToMany) {

                // we only work with cascade removes here
                // if (!relation.isCascadeRemove && !relation.isCascadeUpdate) return;

                /**
                 * By example. Let's say we have a one-to-many relation between Post and Details.
                 * Post contains detailsId. It means he owns relation.
                 * It also means that one details contains multiple post, and one post contain only one details.
                 * Details has cascade remove with post.
                 * Now here we have a details object with removed post.
                 * There can be one or multiple removed posts, because posts is an array in details.
                 * If details.posts is undefined then we skip it as we do with any persisted undefined property.
                 * If details.posts is an empty array it means all its items should be removed.
                 * If details.posts is a null it means same - all its items has been removed.
                 * We need to remove each Post in the databaseDetails where post is missing in details.posts
                 * but databasePost.detailsId = details.id exist in the db.
                 */

                // (example) "relation" - is a relation in details with post.
                // (example) "valueMetadata" - is an entity metadata of the Post object.
                // (example) "subject.databaseEntity" - is a details object

                // if this subject is persisted subject then we get its value to check if its not empty or its values changed
                let persistValue: any = undefined;
                if (subject.hasEntity) {
                    persistValue = relation.getEntityValue(subject.entity);
                    if (persistValue === undefined) return; // skip undefined properties
                }

                // we can't get already loaded objects from loadMap because we don't know exactly how
                // many objects are in database entity, and entities from loadMap may return us not all of them
                // that's why we are forced to load all its entities from the database even if loaded some of them before
                // (example) we need to load a posts where post.detailsId = details.id
                let databaseEntities: ObjectLiteral[] = [];

                // create shortcuts for better readability
                const escape = (name: string) => this.connection.driver.escape(name);

                if (relation.isManyToManyOwner) {

                    // we only need to load inverse entities if cascade removes are set
                    // because remove by cascades is the only reason we need relational entities here
                    if (!relation.isCascadeRemove) return;

                    const joinAlias = escape("persistenceJoinedRelation");

                    const joinColumnConditions = relation.joinColumns.map(joinColumn => {
                        return `${joinAlias}.${joinColumn.propertyName} = :${joinColumn.propertyName}`;
                    });
                    const inverseJoinColumnConditions = relation.inverseJoinColumns.map(inverseJoinColumn => {
                        return `${joinAlias}.${inverseJoinColumn.propertyName} = ${escape(qbAlias)}.${escape(inverseJoinColumn.referencedColumn!.propertyName)}`;
                    });

                    const conditions = joinColumnConditions.concat(inverseJoinColumnConditions).join(" AND ");

                    // (example) returns us referenced column (detail's id)
                    const parameters = relation.joinColumns.reduce((parameters, joinColumn) => {
                        parameters[joinColumn.propertyName] = joinColumn.referencedColumn!.getEntityValue(subject.databaseEntity);
                        return parameters;
                    }, {} as ObjectLiteral);

                    databaseEntities = await this.connection
                        .getRepository<ObjectLiteral>(valueMetadata.target)
                        .createQueryBuilder(qbAlias, this.queryRunner) // todo: this wont work for mongodb. implement this in some method and call it here instead?
                        .innerJoin(relation.junctionEntityMetadata!.tableName, joinAlias, conditions)
                        .setParameters(parameters)
                        .loadAllRelationIds()
                        .getMany();

                } else if (relation.isManyToManyNotOwner) {

                    // we only need to load inverse entities if cascade removes are set
                    // because remove by cascades is the only reason we need relational entities here
                    if (!relation.isCascadeRemove) return;

                    const joinAlias = escape("persistenceJoinedRelation");

                    const joinColumnConditions = relation.joinColumns.map(joinColumn => {
                        return `${joinAlias}.${joinColumn.propertyName} = ${escape(qbAlias)}.${escape(joinColumn.referencedColumn!.propertyName)}`;
                    });
                    const inverseJoinColumnConditions = relation.inverseJoinColumns.map(inverseJoinColumn => {
                        return `${joinAlias}.${inverseJoinColumn.propertyName} = :${inverseJoinColumn.propertyName}`;
                    });

                    const conditions = joinColumnConditions.concat(inverseJoinColumnConditions).join(" AND ");

                    // (example) returns us referenced column (detail's id)
                    const parameters = relation.inverseRelation!.inverseJoinColumns.reduce((parameters, joinColumn) => {
                        parameters[joinColumn.propertyName] = joinColumn.referencedColumn!.getEntityValue(subject.databaseEntity);
                        return parameters;
                    }, {} as ObjectLiteral);

                    databaseEntities = await this.connection
                        .getRepository<ObjectLiteral>(valueMetadata.target)
                        .createQueryBuilder(qbAlias, this.queryRunner) // todo: this wont work for mongodb. implement this in some method and call it here instead?
                        .innerJoin(relation.junctionEntityMetadata!.tableName, joinAlias, conditions)
                        .setParameters(parameters)
                        .loadAllRelationIds()
                        .getMany();

                } else { // this case can only be a oneToMany relation
                    // todo: fix issues with joinColumn[0]
                    // (example) returns us referenced column (detail's id)
                    const relationIdInDatabaseEntity = relation.inverseRelation!.joinColumns[0].referencedColumn!.getEntityValue(subject.databaseEntity);

                    // in this case we need inverse entities not only because of cascade removes
                    // because we also need inverse entities to be able to perform update of entities
                    // in the inverse side when entities is detached from one-to-many relation

                    databaseEntities = await this.connection
                        .getRepository<ObjectLiteral>(valueMetadata.target)
                        .createQueryBuilder(qbAlias, this.queryRunner) // todo: this wont work for mongodb. implement this in some method and call it here instead?
                        .where(qbAlias + "." + relation.inverseSidePropertyPath + "=:id")
                        .setParameter("id", relationIdInDatabaseEntity)
                        .loadAllRelationIds()
                        .getMany();
                }

                // add to loadMap loaded entities if some of them are missing
                databaseEntities.forEach(databaseEntity => {
                    const subjectInLoadMap = this.findByEntityLike(valueMetadata.target, databaseEntity);
                    if (subjectInLoadMap && !subjectInLoadMap.hasDatabaseEntity) {
                        subjectInLoadMap.databaseEntity = databaseEntity;

                    } else if (!subjectInLoadMap) {
                        const subject = new Subject(valueMetadata, undefined, databaseEntity);
                        this.operateSubjects.push(subject);
                    }
                });


                // add new relations for newly bind entities from the one-to-many relations
                if (relation.isOneToMany && persistValue) { // todo: implement same for one-to-one
                    const promises = (persistValue as ObjectLiteral[]).map(async persistValue => {

                        // try to find in the database entities persistedValue (entity bind to this relation)
                        const persistedValueInDatabaseEntity = databaseEntities.find(databaseEntity => {
                            return valueMetadata.compareEntities(persistValue, databaseEntity);
                        });

                        // if it does not exist in the database entity - it means we need to bind it
                        // to bind it we need to update related entity itself
                        // this operation is performed only in one-to-many relations
                        if (!persistedValueInDatabaseEntity) {

                            // now find subject with
                            let loadedSubject = this.findByDatabaseEntityLike(valueMetadata.target, persistValue);
                            if (!loadedSubject) {
                                const id = valueMetadata.getEntityIdMap(persistValue);
                                if (id) { // if there is no id (for newly inserted) then we cant load
                                    const databaseEntity = await this.connection
                                        .getRepository<ObjectLiteral>(valueMetadata.target)
                                        .createQueryBuilder(qbAlias, this.queryRunner) // todo: this wont work for mongodb. implement this in some method and call it here instead?
                                        .whereInIds([id])
                                        .loadAllRelationIds()
                                        .getOne();

                                    if (databaseEntity) {
                                        loadedSubject = new Subject(valueMetadata, undefined, databaseEntity); // todo: what if entity like object exist in the loaded subjects but without databaseEntity?
                                        this.operateSubjects.push(loadedSubject);
                                    }
                                }
                            }

                            if (loadedSubject) {
                                loadedSubject.relationUpdates.push({
                                    relation: relation.inverseRelation!,
                                    value: subject.entity
                                });
                            }
                        }
                    });

                    await Promise.all(promises);
                }

                // iterate throw loaded inverse entities to find out removed entities and inverse updated entities (only for one-to-many relation)
                const promises = databaseEntities.map(async databaseEntity => {

                    // find a subject object of the related database entity
                    let relatedEntitySubject = this.findByDatabaseEntityLike(valueMetadata.target, databaseEntity);
                    if (!relatedEntitySubject) return; // should not be possible, anyway add it for type-safety

                    // if object is already marked as removed then no need to proceed because it already was proceed
                    // if we remove this check it will cause a recursion
                    if (relatedEntitySubject.mustBeRemoved) return;  // todo: add another check for entity in unsetRelations?

                    // check if in persisted value there is a database value to understand if it was removed or not
                    let relatedValue = ((persistValue || []) as ObjectLiteral[]).find(persistValueItem => {
                        return valueMetadata.compareEntities(relatedEntitySubject!.databaseEntity, persistValueItem);
                    });

                    // if relation value is set to undefined then we don't do anything - simply skip any check and remove
                    // but if relation value is set to null then it means user wants to remove each entity in this relation
                    // OR
                    // value was removed from persisted value - means we need to mark it as removed
                    // and check if mark as removed all underlying entities that has cascade remove
                    if (persistValue === null || !relatedValue) {

                        // if cascade remove option is set then need to remove related entity
                        if (relation.isCascadeRemove) {
                            relatedEntitySubject.mustBeRemoved = true;

                            // mark as removed all underlying entities that has cascade remove
                            await this.buildCascadeRemovedAndRelationUpdateOperateSubjects(relatedEntitySubject);

                        // if cascade remove option is not set then it means we simply need to remove
                        // reference to this entity from inverse side (from loaded database entity)
                        // this applies only on one-to-many relationship
                        } else if (relation.isOneToMany && relation.inverseRelation) {
                            relatedEntitySubject.relationUpdates.push({
                                relation: relation.inverseRelation,
                                value: null
                            }); // todo: implement same for one-to-one
                        }

                    }

                });

                await Promise.all(promises);
            }
        });

        await Promise.all(promises);
    }

    /**
     * Builds all junction insert and remove operations used to insert new bind data into junction tables,
     * or remove old junction records.
     * Options specifies which junction operations should be built - insert, remove or both.
     */
    private async buildJunctionOperations(options: { insert: boolean, remove: boolean }): Promise<void> {
        const promises = this.operateSubjects.filter(subject => subject.hasEntity).map(subject => {
            const metadata = subject.metadata.parentEntityMetadata ? subject.metadata.parentEntityMetadata : subject.metadata;
            const promises = metadata.manyToManyRelations.map(async relation => {
                // if subject marked to be removed then all its junctions must be removed
                if (subject.mustBeRemoved && options.remove) {
                    // load from db all relation ids of inverse entities that are "bind" to the currently persisted entity
                    // this way we gonna check which relation ids are missing and which are new (e.g. inserted or removed)
                    const existInverseEntityRelationIds = relation.getEntityValue(subject.databaseEntity);

                    // finally create a new junction remove operation and push it to the array of such operations
                    if (existInverseEntityRelationIds.length > 0) {
                        subject.junctionRemoves.push({
                            relation: relation,
                            junctionRelationIds: existInverseEntityRelationIds
                        });
                    }

                    return;
                }

                // if entity don't have entity then no need to find something that should be inserted or removed
                if (!subject.hasEntity)
                    return;

                // else check changed junctions in the persisted entity
                // extract entity value - we only need to proceed if value is defined and its an array
                const relatedValue = relation.getEntityValue(subject.entity);
                if (!(relatedValue instanceof Array))
                    return;

                // load from db all relation ids of inverse entities that are "bind" to the currently persisted entity
                // this way we gonna check which relation ids are missing and which are new (e.g. inserted or removed)
                // we could load this relation ids with entity using however this way it may be more efficient, because
                // this way we load only relations that come, e.g. we don't load data for empty relations set with object.
                // this is also useful when object is being saved partial.
                let existInverseEntityRelationIds: any[] = [];

                // if subject don't have database entity it means its new and we don't need to remove something that is not exist
                if (subject.hasDatabaseEntity) {
                    existInverseEntityRelationIds = relation.getEntityValue(subject.databaseEntity);
                    // console.log("existInverseEntityRelationIds:", existInverseEntityRelationIds[0]);
                }

                // get all inverse entities relation ids that are "bind" to the currently persisted entity
                const changedInverseEntityRelationIds = relatedValue
                    .map(subRelationValue => {
                        const joinColumns = relation.isOwning ? relation.inverseJoinColumns : relation.inverseRelation!.joinColumns;
                        return joinColumns.reduce((ids, joinColumn) => {
                            return OrmUtils.mergeDeep(ids, joinColumn.referencedColumn!.createValueMap(joinColumn.referencedColumn!.getEntityValue(subRelationValue))); // todo: duplicate. relation.createJoinColumnsIdMap(entity) ?
                        }, {} as ObjectLiteral);
                    })
                    .filter(subRelationValue => subRelationValue !== undefined && subRelationValue !== null);
                // console.log("changedInverseEntityRelationIds:", changedInverseEntityRelationIds);

                // now from all entities in the persisted entity find only those which aren't found in the db
                const removedJunctionEntityIds = existInverseEntityRelationIds.filter(existRelationId => {
                    return !changedInverseEntityRelationIds.find(changedRelationId => {
                        return relation.inverseEntityMetadata.compareIds(changedRelationId, existRelationId);
                    });
                });
                // console.log("removedJunctionEntityIds:", removedJunctionEntityIds);

                // now from all entities in the persisted entity find only those which aren't found in the db
                const newJunctionEntities = relatedValue.filter(subRelatedValue => {
                    // console.log(subRelatedValue);

                    const joinColumns = relation.isOwning ? relation.inverseJoinColumns : relation.inverseRelation!.joinColumns;
                    const ids = joinColumns.reduce((ids, joinColumn) => {
                        return OrmUtils.mergeDeep(ids, joinColumn.referencedColumn!.createValueMap(joinColumn.referencedColumn!.getEntityValue(subRelatedValue))); // todo: duplicate. relation.createJoinColumnsIdMap(entity) ?
                    }, {} as ObjectLiteral);
                    // console.log("ids:", ids);
                    return !existInverseEntityRelationIds.find(relationId => {
                        return relation.inverseEntityMetadata.compareIds(relationId, ids);
                    });
                });

                // console.log("newJunctionEntities: ", newJunctionEntities);

                // finally create a new junction insert operation and push it to the array of such operations
                if (newJunctionEntities.length > 0 && options.insert) {
                    subject.junctionInserts.push({
                        relation: relation,
                        junctionEntities: newJunctionEntities
                    });
                }

                // finally create a new junction remove operation and push it to the array of such operations
                if (removedJunctionEntityIds.length > 0 && options.remove) {
                    subject.junctionRemoves.push({
                        relation: relation,
                        junctionRelationIds: removedJunctionEntityIds
                    });
                }
            });

            return Promise.all(promises);
        });

        await Promise.all(promises);
    }

    /**
     * Finds subject where entity like given subject's entity.
     * Comparision made by entity id.
     */
    protected findByEntityLike(entityTarget: Function|string, entity: ObjectLiteral): Subject|undefined {
        return this.operateSubjects.find(subject => {
            if (!subject.hasEntity)
                return false;

            if (subject.entity === entity)
                return true;

            return subject.entityTarget === entityTarget && subject.metadata.compareEntities(subject.entity, entity);
        });
    }

    /**
     * Finds subject where entity like given subject's database entity.
     * Comparision made by entity id.
     */
    protected findByDatabaseEntityLike(entityTarget: Function|string, entity: ObjectLiteral): Subject|undefined {
        return this.operateSubjects.find(subject => {
            if (!subject.hasDatabaseEntity)
                return false;

            return subject.entityTarget === entityTarget && subject.metadata.compareEntities(subject.databaseEntity, entity);
        });
    }

    /**
     * Groups given Subject objects into groups separated by entity targets.
     */
    protected groupByEntityTargets(): { target: Function|string, subjects: Subject[] }[] {
        return this.operateSubjects.reduce((groups, operatedEntity) => {
            let group = groups.find(group => group.target === operatedEntity.entityTarget);
            if (!group) {
                group = { target: operatedEntity.entityTarget, subjects: [] };
                groups.push(group);
            }
            group.subjects.push(operatedEntity);
            return groups;
        }, [] as { target: Function|string, subjects: Subject[] }[]);
    }

}