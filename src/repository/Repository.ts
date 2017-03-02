import {Connection} from "../connection/Connection";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {PlainObjectToNewEntityTransformer} from "../query-builder/transformer/PlainObjectToNewEntityTransformer";
import {PlainObjectToDatabaseEntityTransformer} from "../query-builder/transformer/PlainObjectToDatabaseEntityTransformer";
import {FindManyOptions} from "../find-options/FindManyOptions";
import {FindOptionsUtils} from "../find-options/FindOptionsUtils";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {QueryRunnerProvider} from "../query-runner/QueryRunnerProvider";
import {SubjectOperationExecutor} from "../persistence/SubjectOperationExecutor";
import {SubjectBuilder} from "../persistence/SubjectBuilder";
import {FindOneOptions} from "../find-options/FindOneOptions";
import {DeepPartial} from "../common/DeepPartial";
import {PersistOptions} from "./PersistOptions";
import {RemoveOptions} from "./RemoveOptions";

/**
 * Repository is supposed to work with your entity objects. Find entities, insert, update, delete, etc.
 */
export class Repository<Entity extends ObjectLiteral> {

    // -------------------------------------------------------------------------
    // Protected Methods Set Dynamically
    // -------------------------------------------------------------------------

    /**
     * Connection used by this repository.
     */
    protected connection: Connection;

    /**
     * Entity metadata of the entity current repository manages.
     */
    protected metadata: EntityMetadata;

    /**
     * Query runner provider used for this repository.
     */
    protected queryRunnerProvider?: QueryRunnerProvider;

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Returns object that is managed by this repository.
     * If this repository manages entity from schema,
     * then it returns a name of that schema instead.
     */
    get target(): Function|string {
        return this.metadata.target;
    }

    /**
     * Checks if entity has an id.
     * If entity contains compose ids, then it checks them all.
     */
    hasId(entity: Entity): boolean {
        return this.metadata.hasId(entity);
    }

    /**
     * Gets entity mixed id.
     */
    getId(entity: Entity): any {
        return this.metadata.getEntityIdMixedMap(entity);
    }

    /**
     * Creates a new query builder that can be used to build a sql query.
     */
    createQueryBuilder(alias: string, queryRunnerProvider?: QueryRunnerProvider): QueryBuilder<Entity> {
        return new QueryBuilder(this.connection, queryRunnerProvider || this.queryRunnerProvider)
            .select(alias)
            .from(this.metadata.target, alias);
    }

    /**
     * Creates a new entity instance.
     */
    create(): Entity;

    /**
     * Creates a new entities and copies all entity properties from given objects into their new entities.
     * Note that it copies only properties that present in entity schema.
     */
    create(entityLikeArray: DeepPartial<Entity>[]): Entity[];

    /**
     * Creates a new entity instance and copies all entity properties from this object into a new entity.
     * Note that it copies only properties that present in entity schema.
     */
    create(entityLike: DeepPartial<Entity>): Entity;

    /**
     * Creates a new entity instance or instances.
     * Can copy properties from the given object into new entities.
     */
    create(plainEntityLikeOrPlainEntityLikes?: DeepPartial<Entity>|DeepPartial<Entity>[]): Entity|Entity[] {

        if (!plainEntityLikeOrPlainEntityLikes)
            return this.metadata.create();

        if (plainEntityLikeOrPlainEntityLikes instanceof Array)
            return plainEntityLikeOrPlainEntityLikes.map(plainEntityLike => this.create(plainEntityLike));

        return this.merge(this.metadata.create(), plainEntityLikeOrPlainEntityLikes);
    }

    /**
     * Merges multiple entities (or entity-like objects) into a given entity.
     */
    merge(mergeIntoEntity: Entity, ...entityLikes: DeepPartial<Entity>[]): Entity {
        const plainObjectToEntityTransformer = new PlainObjectToNewEntityTransformer();
        entityLikes.forEach(object => plainObjectToEntityTransformer.transform(mergeIntoEntity, object, this.metadata));
        return mergeIntoEntity;
    }

    /**
     * Creates a new entity from the given plan javascript object. If entity already exist in the database, then
     * it loads it (and everything related to it), replaces all values with the new ones from the given object
     * and returns this new entity. This new entity is actually a loaded from the db entity with all properties
     * replaced from the new object.
     *
     * Note that given entity-like object must have an entity id / primary key to find entity by.
     * Returns undefined if entity with given id was not found.
     */
    async preload(entityLike: DeepPartial<Entity>): Promise<Entity|undefined> {
        // todo: right now sending this.connection.entityManager is not correct because its out of query runner of this repository
        const plainObjectToDatabaseEntityTransformer = new PlainObjectToDatabaseEntityTransformer(this.connection.entityManager);
        const transformedEntity = await plainObjectToDatabaseEntityTransformer.transform(entityLike, this.metadata);
        if (transformedEntity)
            return this.merge(transformedEntity as Entity, entityLike);

        return undefined;
    }

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    async persist(entities: Entity[], options?: PersistOptions): Promise<Entity[]>;

    /**
     * Persists (saves) a given entity in the database.
     * If entity does not exist in the database then inserts, otherwise updates.
     */
    async persist(entity: Entity, options?: PersistOptions): Promise<Entity>;

    /**
     * Persists one or many given entities.
     */
    async persist(entityOrEntities: Entity|Entity[], options?: PersistOptions): Promise<Entity|Entity[]> {

        // if for some reason non empty entity was passed then return it back without having to do anything
        if (!entityOrEntities)
            return entityOrEntities;

        // if multiple entities given then go throw all of them and save them
        if (entityOrEntities instanceof Array)
            return Promise.all(entityOrEntities.map(entity => this.persist(entity)));

        const queryRunnerProvider = this.queryRunnerProvider || new QueryRunnerProvider(this.connection.driver, true);
        try {
            const transactionEntityManager = this.connection.createEntityManagerWithSingleDatabaseConnection(queryRunnerProvider);
            // transactionEntityManager.data =

            const databaseEntityLoader = new SubjectBuilder(this.connection, queryRunnerProvider);
            await databaseEntityLoader.persist(entityOrEntities, this.metadata);

            const executor = new SubjectOperationExecutor(this.connection, transactionEntityManager, queryRunnerProvider);
            await executor.execute(databaseEntityLoader.operateSubjects);

            return entityOrEntities;

        } finally {
            if (!this.queryRunnerProvider) // release it only if its created by this method
                await queryRunnerProvider.releaseReused();
        }
    }

    /**
     * Updates entity partially. Entity can be found by a given conditions.
     */
    async update(conditions: Partial<Entity>, partialEntity: DeepPartial<Entity>, options?: PersistOptions): Promise<void>;

    /**
     * Updates entity partially. Entity can be found by a given find options.
     */
    async update(findOptions: FindOneOptions<Entity>, partialEntity: DeepPartial<Entity>, options?: PersistOptions): Promise<void>;

    /**
     * Updates entity partially. Entity can be found by a given conditions.
     */
    async update(conditionsOrFindOptions: Partial<Entity>|FindOneOptions<Entity>, partialEntity: DeepPartial<Entity>, options?: PersistOptions): Promise<void> {
        const entity = await this.findOne(conditionsOrFindOptions as any); // this is temporary, in the future can be refactored to perform better
        if (!entity)
            throw new Error(`Cannot find entity to update by a given criteria`);

        Object.assign(entity, partialEntity);
        await this.persist(entity, options);
    }

    /**
     * Updates entity partially. Entity will be found by a given id.
     */
    async updateById(id: any, partialEntity: DeepPartial<Entity>, options?: PersistOptions): Promise<void> {
        const entity = await this.findOneById(id as any); // this is temporary, in the future can be refactored to perform better
        if (!entity)
            throw new Error(`Cannot find entity to update by a id`);

        Object.assign(entity, partialEntity);
        await this.persist(entity, options);
    }

    /**
     * Removes a given entities from the database.
     */
    async remove(entities: Entity[], options?: RemoveOptions): Promise<Entity[]>;

    /**
     * Removes a given entity from the database.
     */
    async remove(entity: Entity, options?: RemoveOptions): Promise<Entity>;

    /**
     * Removes one or many given entities.
     */
    async remove(entityOrEntities: Entity|Entity[], options?: RemoveOptions): Promise<Entity|Entity[]> {

        // if for some reason non empty entity was passed then return it back without having to do anything
        if (!entityOrEntities)
            return entityOrEntities;

        // if multiple entities given then go throw all of them and save them
        if (entityOrEntities instanceof Array)
            return Promise.all(entityOrEntities.map(entity => this.remove(entity)));

        const queryRunnerProvider = this.queryRunnerProvider || new QueryRunnerProvider(this.connection.driver, true);
        try {
            const transactionEntityManager = this.connection.createEntityManagerWithSingleDatabaseConnection(queryRunnerProvider);

            const databaseEntityLoader = new SubjectBuilder(this.connection, queryRunnerProvider);
            await databaseEntityLoader.remove(entityOrEntities, this.metadata);

            const executor = new SubjectOperationExecutor(this.connection, transactionEntityManager, queryRunnerProvider);
            await executor.execute(databaseEntityLoader.operateSubjects);

            return entityOrEntities;

        } finally {
            if (!this.queryRunnerProvider) // release it only if its created by this method
                await queryRunnerProvider.releaseReused();
        }
    }

    /**
     * Removes entity by a given entity id.
     */
    async removeById(id: any, options?: RemoveOptions): Promise<void> {
        const entity = await this.findOneById(id); // this is temporary, in the future can be refactored to perform better
        if (!entity)
            throw new Error(`Cannot find entity to remove by a given id`);

        await this.remove(entity, options);
    }

    /**
     * Counts entities that match given options.
     */
    count(options?: FindManyOptions<Entity>): Promise<number>;

    /**
     * Counts entities that match given conditions.
     */
    count(conditions?: DeepPartial<Entity>): Promise<number>;

    /**
     * Counts entities that match given find options or conditions.
     */
    count(optionsOrConditions?: FindManyOptions<Entity>|DeepPartial<Entity>): Promise<number> {
        const qb = this.createQueryBuilder(FindOptionsUtils.extractFindManyOptionsAlias(optionsOrConditions) || this.metadata.table.name);
        return FindOptionsUtils.applyFindManyOptionsOrConditionsToQueryBuilder(qb, optionsOrConditions).getCount();
    }

    /**
     * Finds entities that match given options.
     */
    find(options?: FindManyOptions<Entity>): Promise<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find(conditions?: DeepPartial<Entity>): Promise<Entity[]>;

    /**
     * Finds entities that match given find options or conditions.
     */
    find(optionsOrConditions?: FindManyOptions<Entity>|DeepPartial<Entity>): Promise<Entity[]> {
        const qb = this.createQueryBuilder(FindOptionsUtils.extractFindManyOptionsAlias(optionsOrConditions) || this.metadata.table.name);
        return FindOptionsUtils.applyFindManyOptionsOrConditionsToQueryBuilder(qb, optionsOrConditions).getMany();
    }

    /**
     * Finds entities that match given find options.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    findAndCount(options?: FindManyOptions<Entity>): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    findAndCount(conditions?: DeepPartial<Entity>): Promise<[ Entity[], number ]>;

    /**
     * Finds entities that match given find options or conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    findAndCount(optionsOrConditions?: FindManyOptions<Entity>|DeepPartial<Entity>): Promise<[ Entity[], number ]> {
        const qb = this.createQueryBuilder(FindOptionsUtils.extractFindManyOptionsAlias(optionsOrConditions) || this.metadata.table.name);
        return FindOptionsUtils.applyFindManyOptionsOrConditionsToQueryBuilder(qb, optionsOrConditions).getManyAndCount();
    }

    /**
     * Finds entities by ids.
     * Optionally find options can be applied.
     */
    findByIds(ids: any[], options?: FindManyOptions<Entity>): Promise<Entity[]>;

    /**
     * Finds entities by ids.
     * Optionally conditions can be applied.
     */
    findByIds(ids: any[], conditions?: DeepPartial<Entity>): Promise<Entity[]>;

    /**
     * Finds entities by ids.
     * Optionally find options can be applied.
     */
    findByIds(ids: any[], optionsOrConditions?: FindManyOptions<Entity>|DeepPartial<Entity>): Promise<Entity[]> {
        const qb = this.createQueryBuilder(FindOptionsUtils.extractFindManyOptionsAlias(optionsOrConditions) || this.metadata.table.name);
        return FindOptionsUtils.applyFindManyOptionsOrConditionsToQueryBuilder(qb, optionsOrConditions)
            .andWhereInIds(ids)
            .getMany();
    }

    /**
     * Finds first entity that matches given options.
     */
    findOne(options?: FindOneOptions<Entity>): Promise<Entity|undefined>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne(conditions?: DeepPartial<Entity>): Promise<Entity|undefined>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne(optionsOrConditions?: FindOneOptions<Entity>|DeepPartial<Entity>): Promise<Entity|undefined> {
        const qb = this.createQueryBuilder(FindOptionsUtils.extractFindOneOptionsAlias(optionsOrConditions) || this.metadata.table.name);
        return FindOptionsUtils.applyFindOneOptionsOrConditionsToQueryBuilder(qb, optionsOrConditions).getOne();
    }

    /**
     * Finds entity by given id.
     * Optionally find options can be applied.
     */
    findOneById(id: any, options?: FindOneOptions<Entity>): Promise<Entity|undefined>;

    /**
     * Finds entity by given id.
     * Optionally conditions can be applied.
     */
    findOneById(id: any, conditions?: DeepPartial<Entity>): Promise<Entity|undefined>;

    /**
     * Finds entity by given id.
     * Optionally find options or conditions can be applied.
     */
    findOneById(id: any, optionsOrConditions?: FindOneOptions<Entity>|DeepPartial<Entity>): Promise<Entity|undefined> {
        const qb = this.createQueryBuilder(FindOptionsUtils.extractFindOneOptionsAlias(optionsOrConditions) || this.metadata.table.name);
        return FindOptionsUtils.applyFindOneOptionsOrConditionsToQueryBuilder(qb, optionsOrConditions)
            .andWhereInIds([id])
            .getOne();
    }

    /**
     * Executes a raw SQL query and returns a raw database results.
     * Raw query execution is supported only by relational databases (MongoDB is not supported).
     */
    async query(query: string, parameters?: any[]): Promise<any> {
        const queryRunnerProvider = this.queryRunnerProvider || new QueryRunnerProvider(this.connection.driver);
        const queryRunner = await queryRunnerProvider.provide();
        try {
            return await queryRunner.query(query, parameters); // await is needed here because we are using finally

        } finally {
            await queryRunnerProvider.release(queryRunner);
        }
    }

    /**
     * Wraps given function execution (and all operations made there) in a transaction.
     * All database operations must be executed using provided repository.
     *
     * Most important, you should execute all your database operations using provided repository instance,
     * all other operations would not be included in the transaction.
     * If you want to execute transaction and persist multiple different entity types, then
     * use EntityManager.transaction method instead.
     *
     * Transactions are supported only by relational databases (MongoDB is not supported).
     */
    async transaction(runInTransaction: (repository: Repository<Entity>) => Promise<any>|any): Promise<any> {
        const queryRunnerProvider = this.queryRunnerProvider || new QueryRunnerProvider(this.connection.driver, true);
        const queryRunner = await queryRunnerProvider.provide();

        // NOTE: dynamic access to protected properties. We need this to prevent unwanted properties in those classes to be exposed,
        // however we need these properties for internal work of the class
        const transactionRepository = new Repository<any>();
        (transactionRepository as any)["connection"] = this.connection;
        (transactionRepository as any)["metadata"] = this.metadata;
        (transactionRepository as any)["queryRunnerProvider"] = queryRunnerProvider;
        // todo: same code in the repository factory. probably better to use repository factory here too

        try {
            await queryRunner.beginTransaction();
            const result = await runInTransaction(transactionRepository);
            await queryRunner.commitTransaction();
            return result;

        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;

        } finally {
            await queryRunnerProvider.release(queryRunner);
            if (!this.queryRunnerProvider) // if we used a new query runner provider then release it
                await queryRunnerProvider.releaseReused();
        }
    }

    /**
     * Clears all the data from the given table/collection (truncates/drops it).
     */
    async clear(): Promise<void> {
        const queryRunnerProvider = this.queryRunnerProvider || new QueryRunnerProvider(this.connection.driver);
        const queryRunner = await queryRunnerProvider.provide();
        try {
            return await queryRunner.truncate(this.metadata.table.name); // await is needed here because we are using finally

        } finally {
            await queryRunnerProvider.release(queryRunner);
        }
    }

}