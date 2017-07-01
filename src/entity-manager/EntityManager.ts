import {Connection} from "../connection/Connection";
import {FindManyOptions} from "../find-options/FindManyOptions";
import {ObjectType} from "../common/ObjectType";
import {QueryRunnerProviderAlreadyReleasedError} from "../error/QueryRunnerProviderAlreadyReleasedError";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {FindOneOptions} from "../find-options/FindOneOptions";
import {DeepPartial} from "../common/DeepPartial";
import {RemoveOptions} from "../repository/RemoveOptions";
import {SaveOptions} from "../repository/SaveOptions";
import {NoNeedToReleaseEntityManagerError} from "../error/NoNeedToReleaseEntityManagerError";
import {MongoRepository} from "../repository/MongoRepository";
import {TreeRepository} from "../repository/TreeRepository";
import {Repository} from "../repository/Repository";
import {FindOptionsUtils} from "../find-options/FindOptionsUtils";
import {SubjectBuilder} from "../persistence/SubjectBuilder";
import {SubjectOperationExecutor} from "../persistence/SubjectOperationExecutor";
import {PlainObjectToNewEntityTransformer} from "../query-builder/transformer/PlainObjectToNewEntityTransformer";
import {PlainObjectToDatabaseEntityTransformer} from "../query-builder/transformer/PlainObjectToDatabaseEntityTransformer";
import {CustomRepositoryNotFoundError} from "../error/CustomRepositoryNotFoundError";
import {getMetadataArgsStorage} from "../index";
import {AbstractRepository} from "../repository/AbstractRepository";
import {CustomRepositoryCannotInheritRepositoryError} from "../error/CustomRepositoryCannotInheritRepositoryError";
import {QueryRunner} from "../query-runner/QueryRunner";
import {SelectQueryBuilder} from "../query-builder/SelectQueryBuilder";

/**
 * Entity manager supposed to work with any entity, automatically find its repository and call its methods,
 * whatever entity type are you passing.
 */
export class EntityManager {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Connection used by this entity manager.
     */
    connection: Connection;

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Custom query runner to be used for operations in this entity manager.
     */
    protected queryRunner?: QueryRunner;

    /**
     * Stores temporarily user data.
     * Useful for sharing data with subscribers.
     */
    protected data: ObjectLiteral = {};

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection, queryRunner?: QueryRunner) {
        this.connection = connection;
        this.queryRunner = queryRunner;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Wraps given function execution (and all operations made there) in a transaction.
     * All database operations must be executed using provided entity manager.
     */
    async transaction(runInTransaction: (entityManger: EntityManager) => Promise<any>): Promise<any> {
        return this.connection.transaction(runInTransaction, this.queryRunner);
    }

    /**
     * Executes raw SQL query and returns raw database results.
     */
    async query(query: string, parameters?: any[]): Promise<any> {
        return this.connection.query(query, parameters, this.queryRunner);
    }

    /**
     * Creates a new query builder that can be used to build a sql query.
     */
    createQueryBuilder<Entity>(entityClass: ObjectType<Entity>|Function|string, alias: string, queryRunner?: QueryRunner): SelectQueryBuilder<Entity>;

    /**
     * Creates a new query builder that can be used to build a sql query.
     */
    createQueryBuilder(queryRunner?: QueryRunner): SelectQueryBuilder<any>;

    /**
     * Creates a new query builder that can be used to build a sql query.
     */
    createQueryBuilder<Entity>(entityClass?: ObjectType<Entity>|Function|string|QueryRunner, alias?: string, queryRunner?: QueryRunner): SelectQueryBuilder<Entity> {
        if (alias) {
            return this.connection.createQueryBuilder(entityClass as Function|string, alias, queryRunner || this.queryRunner);

        } else {
            return this.connection.createQueryBuilder(entityClass as QueryRunner|undefined || this.queryRunner);
        }
    }

    /**
     * Gets user data by a given key.
     * Used get stored data stored in a transactional entity manager.
     */
    getData(key: string): any {
        return this.data[key];
    }

    /**
     * Sets value for the given key in user data.
     * Used to store data in a transactional entity manager which can be accessed in subscribers then.
     */
    setData(key: string, value: any): this {
        this.data[key] = value;
        return this;
    }

    /**
     * Checks if entity has an id.
     */
    hasId(entity: any): boolean;

    /**
     * Checks if entity of given schema name has an id.
     */
    hasId(target: Function|string, entity: any): boolean;

    /**
     * Checks if entity has an id by its Function type or schema name.
     */
    hasId(targetOrEntity: any|Function|string, maybeEntity?: any): boolean {
        const target = arguments.length === 2 ? targetOrEntity : targetOrEntity.constructor;
        const entity = arguments.length === 2 ? maybeEntity : targetOrEntity;
        const metadata = this.connection.getMetadata(target);
        return metadata.hasId(entity);
    }

    /**
     * Gets entity mixed id.
     */
    getId(entity: any): any;

    /**
     * Gets entity mixed id.
     */
    getId(target: Function|string, entity: any): any;

    /**
     * Gets entity mixed id.
     */
    getId(targetOrEntity: any|Function|string, maybeEntity?: any): any {
        const target = arguments.length === 2 ? targetOrEntity : targetOrEntity.constructor;
        const entity = arguments.length === 2 ? maybeEntity : targetOrEntity;
        const metadata = this.connection.getMetadata(target);
        return metadata.getEntityIdMixedMap(entity);
    }

    /**
     * Creates a new entity instance.
     */
    create<Entity>(entityClass: ObjectType<Entity>): Entity;

    /**
     * Creates a new entity instance and copies all entity properties from this object into a new entity.
     * Note that it copies only properties that present in entity schema.
     */
    create<Entity>(entityClass: ObjectType<Entity>|string, plainObject: DeepPartial<Entity>): Entity;

    /**
     * Creates a new entities and copies all entity properties from given objects into their new entities.
     * Note that it copies only properties that present in entity schema.
     */
    create<Entity>(entityClass: ObjectType<Entity>|string, plainObjects: DeepPartial<Entity>[]): Entity[];

    /**
     * Creates a new entity instance or instances.
     * Can copy properties from the given object into new entities.
     */
    create<Entity>(entityClass: ObjectType<Entity>|string, plainObjectOrObjects?: DeepPartial<Entity>|DeepPartial<Entity>[]): Entity|Entity[] {
        const metadata = this.connection.getMetadata(entityClass);

        if (!plainObjectOrObjects)
            return metadata.create();

        if (plainObjectOrObjects instanceof Array)
            return plainObjectOrObjects.map(plainEntityLike => this.create(entityClass, plainEntityLike));

        return this.merge(entityClass, metadata.create(), plainObjectOrObjects);
    }

    /**
     * Merges two entities into one new entity.
     */
    merge<Entity>(entityClass: ObjectType<Entity>|string, mergeIntoEntity: Entity, ...entityLikes: DeepPartial<Entity>[]): Entity { // todo: throw exception ie tntity manager is released
        const metadata = this.connection.getMetadata(entityClass);
        const plainObjectToEntityTransformer = new PlainObjectToNewEntityTransformer();
        entityLikes.forEach(object => plainObjectToEntityTransformer.transform(mergeIntoEntity, object, metadata));
        return mergeIntoEntity;
    }

    /**
     * Creates a new entity from the given plan javascript object. If entity already exist in the database, then
     * it loads it (and everything related to it), replaces all values with the new ones from the given object
     * and returns this new entity. This new entity is actually a loaded from the db entity with all properties
     * replaced from the new object.
     */
    async preload<Entity>(entityClass: ObjectType<Entity>|string, entityLike: DeepPartial<Entity>): Promise<Entity|undefined> {
        const metadata = this.connection.getMetadata(entityClass);
        const plainObjectToDatabaseEntityTransformer = new PlainObjectToDatabaseEntityTransformer(this.connection.manager);
        const transformedEntity = await plainObjectToDatabaseEntityTransformer.transform(entityLike, metadata);
        if (transformedEntity)
            return this.merge(entityClass, transformedEntity as Entity, entityLike);

        return undefined;
    }

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    save<Entity>(entity: Entity, options?: SaveOptions): Promise<Entity>;

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    save<Entity>(targetOrEntity: Function|string, entity: Entity, options?: SaveOptions): Promise<Entity>;

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    save<Entity>(entities: Entity[], options?: SaveOptions): Promise<Entity[]>;

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    save<Entity>(targetOrEntity: Function|string, entities: Entity[], options?: SaveOptions): Promise<Entity[]>;

    /**
     * Persists (saves) a given entity in the database.
     */
    save<Entity>(targetOrEntity: (Entity|Entity[])|Function|string, maybeEntityOrOptions?: Entity|Entity[], maybeOptions?: SaveOptions): Promise<Entity|Entity[]> {

        const target = (arguments.length > 1 && (targetOrEntity instanceof Function || typeof targetOrEntity === "string")) ? targetOrEntity as Function|string : undefined;
        const entity: Entity|Entity[] = target ? maybeEntityOrOptions as Entity|Entity[] : targetOrEntity as Entity|Entity[];
        const options = target ? maybeOptions : maybeEntityOrOptions as SaveOptions;

        return Promise.resolve().then(async () => { // we MUST call "fake" resolve here to make sure all properties of lazily loaded properties are resolved.

            const queryRunner = this.queryRunner || this.connection.createQueryRunner();
            const transactionEntityManager = this.connection.createIsolatedManager(queryRunner);
            if (options && options.data)
                transactionEntityManager.data = options.data;

            try {
                const executors: SubjectOperationExecutor[] = [];
                if (entity instanceof Array) {
                    await Promise.all(entity.map(async entity => {
                        const entityTarget = target ? target : entity.constructor;
                        const metadata = this.connection.getMetadata(entityTarget);

                        const databaseEntityLoader = new SubjectBuilder(this.connection, queryRunner);
                        await databaseEntityLoader.persist(entity, metadata);

                        const executor = new SubjectOperationExecutor(this.connection, transactionEntityManager, queryRunner, databaseEntityLoader.operateSubjects);
                        executors.push(executor);
                    }));

                } else {
                    const finalTarget = target ? target : entity.constructor;
                    const metadata = this.connection.getMetadata(finalTarget);

                    const databaseEntityLoader = new SubjectBuilder(this.connection, queryRunner);
                    await databaseEntityLoader.persist(entity, metadata);

                    const executor = new SubjectOperationExecutor(this.connection, transactionEntityManager, queryRunner, databaseEntityLoader.operateSubjects);
                    executors.push(executor);
                }

                const executorsNeedsToBeExecuted = executors.filter(executor => executor.areExecutableOperations());
                if (executorsNeedsToBeExecuted.length) {

                    // start execute queries in a transaction
                    // if transaction is already opened in this query runner then we don't touch it
                    // if its not opened yet then we open it here, and once we finish - we close it
                    let isTransactionStartedByItself = false;
                    try {

                        // open transaction if its not opened yet
                        if (!queryRunner.isTransactionActive) {
                            isTransactionStartedByItself = true;
                            await queryRunner.startTransaction();
                        }

                        await Promise.all(executorsNeedsToBeExecuted.map(executor => {
                            return executor.execute();
                        }));

                        // commit transaction if it was started by us
                        if (isTransactionStartedByItself === true)
                            await queryRunner.commitTransaction();

                    } catch (error) {

                        // rollback transaction if it was started by us
                        if (isTransactionStartedByItself) {
                            try {
                                await queryRunner.rollbackTransaction();
                            } catch (rollbackError) { }
                        }

                        throw error;
                    }
                }

            } finally {
                if (!this.queryRunner) // release it only if its created by this method
                    await queryRunner.release();
            }

            return entity;
        });
    }

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     *
     * @deprecated
     */
    persist<Entity>(entity: Entity, options?: SaveOptions): Promise<Entity>;

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     *
     * @deprecated
     */
    persist<Entity>(targetOrEntity: Function, entity: Entity, options?: SaveOptions): Promise<Entity>;

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     *
     * @deprecated
     */
    persist<Entity>(targetOrEntity: string, entity: Entity, options?: SaveOptions): Promise<Entity>;

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     *
     * @deprecated
     */
    persist<Entity>(entities: Entity[], options?: SaveOptions): Promise<Entity[]>;

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     *
     * @deprecated
     */
    persist<Entity>(targetOrEntity: Function, entities: Entity[], options?: SaveOptions): Promise<Entity[]>;

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     *
     * @deprecated
     */
    persist<Entity>(targetOrEntity: string, entities: Entity[], options?: SaveOptions): Promise<Entity[]>;

    /**
     * Persists (saves) a given entity in the database.
     *
     * @deprecated
     */
    persist<Entity>(targetOrEntity: (Entity|Entity[])|Function|string, maybeEntity?: Entity|Entity[], options?: SaveOptions): Promise<Entity|Entity[]> {
        return this.save(targetOrEntity as any, maybeEntity as any, options);
    }

    /**
     * Updates entity partially. Entity can be found by a given conditions.
     */
    async update<Entity>(target: ObjectType<Entity>|string, conditions: Partial<Entity>, partialEntity: DeepPartial<Entity>, options?: SaveOptions): Promise<void>;

    /**
     * Updates entity partially. Entity can be found by a given find options.
     */
    async update<Entity>(target: ObjectType<Entity>|string, findOptions: FindOneOptions<Entity>, partialEntity: DeepPartial<Entity>, options?: SaveOptions): Promise<void>;

    /**
     * Updates entity partially. Entity can be found by a given conditions.
     */
    async update<Entity>(target: ObjectType<Entity>|string, conditionsOrFindOptions: Partial<Entity>|FindOneOptions<Entity>, partialEntity: DeepPartial<Entity>, options?: SaveOptions): Promise<void> {
        const entity = await this.findOne(target, conditionsOrFindOptions as any); // this is temporary, in the future can be refactored to perform better
        if (!entity)
            throw new Error(`Cannot find entity to update by a given criteria`);

        Object.assign(entity, partialEntity);
        await this.save(entity, options);
    }

    /**
     * Updates entity partially. Entity will be found by a given id.
     */
    async updateById<Entity>(target: ObjectType<Entity>|string, id: any, partialEntity: DeepPartial<Entity>, options?: SaveOptions): Promise<void> {
        const entity = await this.findOneById(target, id as any); // this is temporary, in the future can be refactored to perform better
        if (!entity)
            throw new Error(`Cannot find entity to update by a id`);

        Object.assign(entity, partialEntity);
        await this.save(entity, options);
    }

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(entity: Entity): Promise<Entity>;

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(targetOrEntity: ObjectType<Entity>|string, entity: Entity, options?: RemoveOptions): Promise<Entity>;

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(entity: Entity[], options?: RemoveOptions): Promise<Entity>;

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(targetOrEntity: ObjectType<Entity>|string, entity: Entity[], options?: RemoveOptions): Promise<Entity[]>;

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(targetOrEntity: (Entity|Entity[])|Function|string, maybeEntityOrOptions?: Entity|Entity[], maybeOptions?: RemoveOptions): Promise<Entity|Entity[]> {

        const target = (arguments.length > 1 && (targetOrEntity instanceof Function || typeof targetOrEntity === "string")) ? targetOrEntity as Function|string : undefined;
        const entity: Entity|Entity[] = target ? maybeEntityOrOptions as Entity|Entity[] : targetOrEntity as Entity|Entity[];
        const options = target ? maybeOptions : maybeEntityOrOptions as SaveOptions;

        return Promise.resolve().then(async () => { // we MUST call "fake" resolve here to make sure all properties of lazily loaded properties are resolved.

            const queryRunner = this.queryRunner || this.connection.createQueryRunner();
            const transactionEntityManager = this.connection.createIsolatedManager(queryRunner);
            if (options && options.data)
                transactionEntityManager.data = options.data;

            try {
                const executors: SubjectOperationExecutor[] = [];
                if (entity instanceof Array) {
                    await Promise.all(entity.map(async entity => {
                        const entityTarget = target ? target : entity.constructor;
                        const metadata = this.connection.getMetadata(entityTarget);

                        const databaseEntityLoader = new SubjectBuilder(this.connection, queryRunner);
                        await databaseEntityLoader.remove(entity, metadata);

                        const executor = new SubjectOperationExecutor(this.connection, transactionEntityManager, queryRunner, databaseEntityLoader.operateSubjects);
                        executors.push(executor);
                    }));

                } else {
                    const finalTarget = target ? target : entity.constructor;
                    const metadata = this.connection.getMetadata(finalTarget);

                    const databaseEntityLoader = new SubjectBuilder(this.connection, queryRunner);
                    await databaseEntityLoader.remove(entity, metadata);

                    const executor = new SubjectOperationExecutor(this.connection, transactionEntityManager, queryRunner, databaseEntityLoader.operateSubjects);
                    executors.push(executor);
                }

                const executorsNeedsToBeExecuted = executors.filter(executor => executor.areExecutableOperations());
                if (executorsNeedsToBeExecuted.length) {

                    // start execute queries in a transaction
                    // if transaction is already opened in this query runner then we don't touch it
                    // if its not opened yet then we open it here, and once we finish - we close it
                    let isTransactionStartedByItself = false;
                    try {

                        // open transaction if its not opened yet
                        if (!queryRunner.isTransactionActive) {
                            isTransactionStartedByItself = true;
                            await queryRunner.startTransaction();
                        }

                        await Promise.all(executorsNeedsToBeExecuted.map(executor => {
                            return executor.execute();
                        }));

                        // commit transaction if it was started by us
                        if (isTransactionStartedByItself === true)
                            await queryRunner.commitTransaction();

                    } catch (error) {

                        // rollback transaction if it was started by us
                        if (isTransactionStartedByItself) {
                            try {
                                await queryRunner.rollbackTransaction();
                            } catch (rollbackError) { }
                        }

                        throw error;
                    }
                }

            } finally {
                if (!this.queryRunner) // release it only if its created by this method
                    await queryRunner.release();
            }

            return entity;
        });
    }

    /**
     * Removes entity by a given entity id.
     */
    async removeById<Entity>(targetOrEntity: ObjectType<Entity>|string, id: any, options?: RemoveOptions): Promise<void> {
        const entity = await this.findOneById<any>(targetOrEntity, id); // this is temporary, in the future can be refactored to perform better
        if (!entity)
            throw new Error(`Cannot find entity to remove by a given id`);

        await this.remove(entity, options);
    }

    /**
     * Removes entity by a given entity ids.
     */
    async removeByIds<Entity>(targetOrEntity: ObjectType<Entity>|string, ids: any[], options?: RemoveOptions): Promise<void> {
        const promises = ids.map(async id => {
            const entity = await this.findOneById<any>(targetOrEntity, id); // this is temporary, in the future can be refactored to perform better
            if (!entity)
                throw new Error(`Cannot find entity to remove by a given id`);

            await this.remove(entity, options);
        });

        await Promise.all(promises);
    }

    /**
     * Counts entities that match given options.
     */
    count<Entity>(entityClass: ObjectType<Entity>|string, options?: FindManyOptions<Entity>): Promise<number>;

    /**
     * Counts entities that match given conditions.
     */
    count<Entity>(entityClass: ObjectType<Entity>|string, conditions?: Partial<Entity>): Promise<number>;

    /**
     * Counts entities that match given find options or conditions.
     */
    count<Entity>(entityClass: ObjectType<Entity>|string, optionsOrConditions?: FindManyOptions<Entity>|Partial<Entity>): Promise<number> {
        const metadata = this.connection.getMetadata(entityClass);
        const qb = this.createQueryBuilder(entityClass, FindOptionsUtils.extractFindManyOptionsAlias(optionsOrConditions) || metadata.name);
        return FindOptionsUtils.applyFindManyOptionsOrConditionsToQueryBuilder(qb, optionsOrConditions).getCount();
    }

    /**
     * Finds entities that match given options.
     */
    find<Entity>(entityClass: ObjectType<Entity>|string, options?: FindManyOptions<Entity>): Promise<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ObjectType<Entity>|string, conditions?: Partial<Entity>): Promise<Entity[]>;

    /**
     * Finds entities that match given find options or conditions.
     */
    find<Entity>(entityClass: ObjectType<Entity>|string, optionsOrConditions?: FindManyOptions<Entity>|Partial<Entity>): Promise<Entity[]> {
        const metadata = this.connection.getMetadata(entityClass);
        const qb = this.createQueryBuilder(entityClass, FindOptionsUtils.extractFindManyOptionsAlias(optionsOrConditions) || metadata.name);
        return FindOptionsUtils.applyFindManyOptionsOrConditionsToQueryBuilder(qb, optionsOrConditions).getMany();
    }

    /**
     * Finds entities that match given find options.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    findAndCount<Entity>(entityClass: ObjectType<Entity>|string, options?: FindManyOptions<Entity>): Promise<[Entity[], number]>;

    /**
     * Finds entities that match given conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    findAndCount<Entity>(entityClass: ObjectType<Entity>|string, conditions?: Partial<Entity>): Promise<[Entity[], number]>;

    /**
     * Finds entities that match given find options and conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    findAndCount<Entity>(entityClass: ObjectType<Entity>|string, optionsOrConditions?: FindManyOptions<Entity>|Partial<Entity>): Promise<[Entity[], number]> {
        const metadata = this.connection.getMetadata(entityClass);
        const qb = this.createQueryBuilder(entityClass, FindOptionsUtils.extractFindManyOptionsAlias(optionsOrConditions) || metadata.name);
        return FindOptionsUtils.applyFindManyOptionsOrConditionsToQueryBuilder(qb, optionsOrConditions).getManyAndCount();
    }

    /**
     * Finds entities with ids.
     * Optionally find options can be applied.
     */
    findByIds<Entity>(entityClass: ObjectType<Entity>|string, ids: any[], options?: FindManyOptions<Entity>): Promise<Entity[]>;

    /**
     * Finds entities with ids.
     * Optionally conditions can be applied.
     */
    findByIds<Entity>(entityClass: ObjectType<Entity>|string, ids: any[], conditions?: Partial<Entity>): Promise<Entity[]>;

    /**
     * Finds entities with ids.
     * Optionally find options or conditions can be applied.
     */
    findByIds<Entity>(entityClass: ObjectType<Entity>|string, ids: any[], optionsOrConditions?: FindManyOptions<Entity>|Partial<Entity>): Promise<Entity[]> {
        const metadata = this.connection.getMetadata(entityClass);
        const qb = this.createQueryBuilder(entityClass, FindOptionsUtils.extractFindManyOptionsAlias(optionsOrConditions) || metadata.name);
        FindOptionsUtils.applyFindManyOptionsOrConditionsToQueryBuilder(qb, optionsOrConditions);

        ids = ids.map(id => {
            if (!metadata.hasMultiplePrimaryKeys && !(id instanceof Object)) {
                return metadata.createEntityIdMap([id]);
            }
            return id;
        });
        qb.whereInIds(ids);
        return qb.getMany();
    }

    /**
     * Finds first entity that matches given find options.
     */
    findOne<Entity>(entityClass: ObjectType<Entity>|string, options?: FindOneOptions<Entity>): Promise<Entity|undefined>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ObjectType<Entity>|string, conditions?: Partial<Entity>): Promise<Entity|undefined>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ObjectType<Entity>|string, optionsOrConditions?: FindOneOptions<Entity>|Partial<Entity>): Promise<Entity|undefined> {
        const metadata = this.connection.getMetadata(entityClass);
        const qb = this.createQueryBuilder(entityClass, FindOptionsUtils.extractFindOneOptionsAlias(optionsOrConditions) || metadata.name);
        return FindOptionsUtils.applyFindOneOptionsOrConditionsToQueryBuilder(qb, optionsOrConditions).getOne();
    }

    /**
     * Finds entity with given id.
     * Optionally find options can be applied.
     */
    findOneById<Entity>(entityClass: ObjectType<Entity>|string, id: any, options?: FindOneOptions<Entity>): Promise<Entity|undefined>;

    /**
     * Finds entity with given id.
     * Optionally conditions can be applied.
     */
    findOneById<Entity>(entityClass: ObjectType<Entity>|string, id: any, conditions?: Partial<Entity>): Promise<Entity|undefined>;

    /**
     * Finds entity with given id.
     * Optionally find options or conditions can be applied.
     */
    findOneById<Entity>(entityClass: ObjectType<Entity>|string, id: any, optionsOrConditions?: FindOneOptions<Entity>|Partial<Entity>): Promise<Entity|undefined> {
        const metadata = this.connection.getMetadata(entityClass);
        const qb = this.createQueryBuilder(entityClass, FindOptionsUtils.extractFindOneOptionsAlias(optionsOrConditions) || metadata.name);
        if (metadata.hasMultiplePrimaryKeys && !(id instanceof Object)) {
            // const columnNames = this.metadata.getEntityIdMap({  });
            throw new Error(`You have multiple primary keys in your entity, to use findOneById with multiple primary keys please provide ` +
                `complete object with all entity ids, like this: { firstKey: value, secondKey: value }`);
        }

        if (!metadata.hasMultiplePrimaryKeys && !(id instanceof Object)) {
            id = metadata.createEntityIdMap([id]);
        }
        qb.whereInIds([id]);
        FindOptionsUtils.applyFindOneOptionsOrConditionsToQueryBuilder(qb, optionsOrConditions);
        return qb.getOne();
    }

    /**
     * Clears all the data from the given table (truncates/drops it).
     */
    async clear<Entity>(entityClass: ObjectType<Entity>|string): Promise<void> {
        const metadata = this.connection.getMetadata(entityClass);
        const queryRunner = this.queryRunner || this.connection.createQueryRunner();
        try {
            return await queryRunner.truncate(metadata.tableName); // await is needed here because we are using finally

        } finally {
            if (!this.queryRunner)
                await queryRunner.release();
        }
    }

    /**
     * Gets repository for the given entity class or name.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): Repository<Entity> {

        // if single db connection is used then create its own repository with reused query runner
        if (this.queryRunner) {
            if (this.queryRunner.isReleased)
                throw new QueryRunnerProviderAlreadyReleasedError();

            return this.connection.createIsolatedRepository(entityClassOrName, this.queryRunner);
        }

        return this.connection.getRepository<Entity>(entityClassOrName as any);
    }

    /**
     * Gets tree repository for the given entity class or name.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getTreeRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): TreeRepository<Entity> {

        // if single db connection is used then create its own repository with reused query runner
        if (this.queryRunner) {
            if (this.queryRunner.isReleased)
                throw new QueryRunnerProviderAlreadyReleasedError();

            return this.connection.createIsolatedRepository(entityClassOrName, this.queryRunner) as TreeRepository<Entity>;
        }

        return this.connection.getTreeRepository<Entity>(entityClassOrName as any);
    }

    /**
     * Gets mongodb repository for the given entity class.
     */
    getMongoRepository<Entity>(entityClass: ObjectType<Entity>): MongoRepository<Entity>;

    /**
     * Gets mongodb repository for the given entity name.
     */
    getMongoRepository<Entity>(entityName: string): MongoRepository<Entity>;

    /**
     * Gets mongodb repository for the given entity class or name.
     */
    getMongoRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): MongoRepository<Entity> {

        // if single db connection is used then create its own repository with reused query runner
        if (this.queryRunner) {
            if (this.queryRunner.isReleased)
                throw new QueryRunnerProviderAlreadyReleasedError();

            return this.connection.createIsolatedRepository(entityClassOrName, this.queryRunner) as MongoRepository<Entity>;
        }

        return this.connection.getMongoRepository<Entity>(entityClassOrName as any);
    }

    /**
     * Gets custom entity repository marked with @EntityRepository decorator.
     */
    getCustomRepository<T>(customRepository: ObjectType<T>): T {
        const entityRepositoryMetadataArgs = getMetadataArgsStorage().entityRepositories.find(repository => {
            return repository.target === (customRepository instanceof Function ? customRepository : (customRepository as any).constructor);
        });
        if (!entityRepositoryMetadataArgs)
            throw new CustomRepositoryNotFoundError(customRepository);

        const entityMetadata = entityRepositoryMetadataArgs.entity ? this.connection.getMetadata(entityRepositoryMetadataArgs.entity) : undefined;

        const entityRepositoryInstance = new (entityRepositoryMetadataArgs.target as any)(this, entityMetadata);

        // NOTE: dynamic access to protected properties. We need this to prevent unwanted properties in those classes to be exposed,
        // however we need these properties for internal work of the class
        if (entityRepositoryInstance instanceof AbstractRepository) {
            if (!(entityRepositoryInstance as any)["manager"])
                (entityRepositoryInstance as any)["manager"] = this;
        }
        if (entityRepositoryInstance instanceof Repository) {
            if (!entityMetadata)
                throw new CustomRepositoryCannotInheritRepositoryError(customRepository);

            (entityRepositoryInstance as any)["manager"] = this;
            (entityRepositoryInstance as any)["metadata"] = entityMetadata;
        }

        return entityRepositoryInstance;
    }

    /**
     * Releases all resources used by entity manager.
     * This is used when entity manager is created with a single query runner,
     * and this single query runner needs to be released after job with entity manager is done.
     */
    async release(): Promise<void> {
        if (!this.queryRunner)
            throw new NoNeedToReleaseEntityManagerError();

        return this.queryRunner.release();
    }

}