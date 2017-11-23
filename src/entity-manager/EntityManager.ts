import {Connection} from "../connection/Connection";
import {FindManyOptions} from "../find-options/FindManyOptions";
import {ObjectType} from "../common/ObjectType";
import {QueryRunnerProviderAlreadyReleasedError} from "../error/QueryRunnerProviderAlreadyReleasedError";
import {FindOneOptions} from "../find-options/FindOneOptions";
import {DeepPartial} from "../common/DeepPartial";
import {RemoveOptions} from "../repository/RemoveOptions";
import {SaveOptions} from "../repository/SaveOptions";
import {NoNeedToReleaseEntityManagerError} from "../error/NoNeedToReleaseEntityManagerError";
import {MongoRepository} from "../repository/MongoRepository";
import {TreeRepository} from "../repository/TreeRepository";
import {Repository} from "../repository/Repository";
import {FindOptionsUtils} from "../find-options/FindOptionsUtils";
import {PlainObjectToNewEntityTransformer} from "../query-builder/transformer/PlainObjectToNewEntityTransformer";
import {PlainObjectToDatabaseEntityTransformer} from "../query-builder/transformer/PlainObjectToDatabaseEntityTransformer";
import {CustomRepositoryNotFoundError} from "../error/CustomRepositoryNotFoundError";
import {getMetadataArgsStorage} from "../index";
import {AbstractRepository} from "../repository/AbstractRepository";
import {CustomRepositoryCannotInheritRepositoryError} from "../error/CustomRepositoryCannotInheritRepositoryError";
import {QueryRunner} from "../query-runner/QueryRunner";
import {SelectQueryBuilder} from "../query-builder/SelectQueryBuilder";
import {MongoDriver} from "../driver/mongodb/MongoDriver";
import {RepositoryNotFoundError} from "../error/RepositoryNotFoundError";
import {RepositoryNotTreeError} from "../error/RepositoryNotTreeError";
import {RepositoryFactory} from "../repository/RepositoryFactory";
import {TreeRepositoryNotSupportedError} from "../error/TreeRepositoryNotSupportedError";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {QueryPartialEntity} from "../query-builder/QueryPartialEntity";
import {EntityPersistExecutor} from "../persistence/EntityPersistExecutor";
import {ObjectID} from "../driver/mongodb/typings";
import {InsertResult} from "../query-builder/result/InsertResult";
import {UpdateResult} from "../query-builder/result/UpdateResult";
import {DeleteResult} from "../query-builder/result/DeleteResult";

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
    readonly connection: Connection;

    /**
     * Custom query runner to be used for operations in this entity manager.
     * Used only in non-global entity manager.
     */
    readonly queryRunner?: QueryRunner;

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Once created and then reused by en repositories.
     */
    protected repositories: Repository<any>[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection, queryRunner?: QueryRunner) {
        this.connection = connection;
        if (queryRunner) {
            this.queryRunner = queryRunner;
            // dynamic: this.queryRunner = manager;
            Object.assign(this.queryRunner, { manager: this });
        }
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Wraps given function execution (and all operations made there) in a transaction.
     * All database operations must be executed using provided entity manager.
     */
    async transaction<T>(runInTransaction: (entityManger: EntityManager) => Promise<T>): Promise<T> {

        if (this.connection.driver instanceof MongoDriver)
            throw new Error(`Transactions aren't supported by MongoDB.`);

        if (this.queryRunner && this.queryRunner.isReleased)
            throw new QueryRunnerProviderAlreadyReleasedError();

        if (this.queryRunner && this.queryRunner.isTransactionActive)
            throw new Error(`Cannot start transaction because its already started`);

        // if query runner is already defined in this class, it means this entity manager was already created for a single connection
        // if its not defined we create a new query runner - single connection where we'll execute all our operations
        const queryRunner = this.queryRunner || this.connection.createQueryRunner("master");

        try {
            await queryRunner.startTransaction();
            const result = await runInTransaction(queryRunner.manager);
            await queryRunner.commitTransaction();
            return result;

        } catch (err) {
            try { // we throw original error even if rollback thrown an error
                await queryRunner.rollbackTransaction();
            } catch (rollbackError) { }
            throw err;

        } finally {
            if (!this.queryRunner) // if we used a new query runner provider then release it
                await queryRunner.release();
        }
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

        const mergeIntoEntity = metadata.create();
        const plainObjectToEntityTransformer = new PlainObjectToNewEntityTransformer(true);
        plainObjectToEntityTransformer.transform(mergeIntoEntity, plainObjectOrObjects, metadata);
        return mergeIntoEntity;
    }

    /**
     * Merges two entities into one new entity.
     */
    merge<Entity>(entityClass: ObjectType<Entity>|string, mergeIntoEntity: Entity, ...entityLikes: DeepPartial<Entity>[]): Entity { // todo: throw exception if entity manager is released
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
     * Saves all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    save<Entity>(entity: Entity, options?: SaveOptions): Promise<Entity>;

    /**
     * Saves all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    save<Entity, T extends DeepPartial<Entity>>(targetOrEntity: ObjectType<Entity>|string, entity: T, options?: SaveOptions): Promise<T>;

    /**
     * Saves all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    save<Entity>(entities: Entity[], options?: SaveOptions): Promise<Entity[]>;

    /**
     * Saves all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    save<Entity, T extends DeepPartial<Entity>>(targetOrEntity: ObjectType<Entity>|string, entities: T[], options?: SaveOptions): Promise<T[]>;

    /**
     * Saves a given entity in the database.
     */
    save<Entity, T extends DeepPartial<Entity>>(targetOrEntity: (T|T[])|ObjectType<Entity>|string, maybeEntityOrOptions?: T|T[], maybeOptions?: SaveOptions): Promise<T|T[]> {

        // normalize mixed parameters
        const target = (arguments.length > 1 && (targetOrEntity instanceof Function || typeof targetOrEntity === "string")) ? targetOrEntity as Function|string : undefined;
        const entity: T|T[] = target ? maybeEntityOrOptions as T|T[] : targetOrEntity as T|T[];
        const options = target ? maybeOptions : maybeEntityOrOptions as SaveOptions;

        // execute save operation
        return new EntityPersistExecutor(this.connection, this.queryRunner, "save", target, entity, options)
            .execute()
            .then(() => entity);
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

        // normalize mixed parameters
        const target = (arguments.length > 1 && (targetOrEntity instanceof Function || typeof targetOrEntity === "string")) ? targetOrEntity as Function|string : undefined;
        const entity: Entity|Entity[] = target ? maybeEntityOrOptions as Entity|Entity[] : targetOrEntity as Entity|Entity[];
        const options = target ? maybeOptions : maybeEntityOrOptions as SaveOptions;

        // execute save operation
        return new EntityPersistExecutor(this.connection, this.queryRunner, "remove", target, entity, options)
            .execute()
            .then(() => entity);
    }

    /**
     * Inserts a given entity into the database.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient INSERT query.
     * Does not check if entity exist in the database, so query will fail if duplicate entity is being inserted.
     * You can execute bulk inserts using this method.
     */
    async insert<Entity>(target: ObjectType<Entity>|string, entity: QueryPartialEntity<Entity>|(QueryPartialEntity<Entity>[]), options?: SaveOptions): Promise<InsertResult> {
        return this.createQueryBuilder()
            .insert()
            .into(target)
            .values(entity)
            .execute();
    }

    /**
     * Updates entity partially. Entity can be found by a given conditions.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient UPDATE query.
     * Does not check if entity exist in the database.
     */
    update<Entity>(target: ObjectType<Entity>|string, criteria: string|string[]|number|number[]|Date|Date[]|ObjectID|ObjectID[]|DeepPartial<Entity>, partialEntity: DeepPartial<Entity>, options?: SaveOptions): Promise<UpdateResult> {
        if (typeof criteria === "string" ||
            typeof criteria === "number" ||
            criteria instanceof Date ||
            criteria instanceof Array) {

            return this.createQueryBuilder()
                .update(target)
                .set(partialEntity)
                .whereInIds(criteria)
                .execute();

        } else {
            return this.createQueryBuilder()
                .update(target)
                .set(partialEntity)
                .where(criteria)
                .execute();
        }
    }

    /**
     * Deletes entities by a given conditions.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient DELETE query.
     * Does not check if entity exist in the database.
     */
    delete<Entity>(targetOrEntity: ObjectType<Entity>|string, criteria: string|string[]|number|number[]|Date|Date[]|ObjectID|ObjectID[]|DeepPartial<Entity>, options?: RemoveOptions): Promise<DeleteResult> {
        if (typeof criteria === "string" ||
            typeof criteria === "number" ||
            criteria instanceof Date ||
            criteria instanceof Array) {

            return this.createQueryBuilder()
                .delete()
                .from(targetOrEntity)
                .whereInIds(criteria)
                .execute();

        } else {
            return this.createQueryBuilder()
                .delete()
                .from(targetOrEntity)
                .where(criteria)
                .execute();
        }
    }

    /**
     * Counts entities that match given options.
     * Useful for pagination.
     */
    count<Entity>(entityClass: ObjectType<Entity>|string, options?: FindManyOptions<Entity>): Promise<number>;

    /**
     * Counts entities that match given conditions.
     * Useful for pagination.
     */
    count<Entity>(entityClass: ObjectType<Entity>|string, conditions?: DeepPartial<Entity>): Promise<number>;

    /**
     * Counts entities that match given find options or conditions.
     * Useful for pagination.
     */
    count<Entity>(entityClass: ObjectType<Entity>|string, optionsOrConditions?: FindManyOptions<Entity>|DeepPartial<Entity>): Promise<number> {
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
    find<Entity>(entityClass: ObjectType<Entity>|string, conditions?: DeepPartial<Entity>): Promise<Entity[]>;

    /**
     * Finds entities that match given find options or conditions.
     */
    find<Entity>(entityClass: ObjectType<Entity>|string, optionsOrConditions?: FindManyOptions<Entity>|DeepPartial<Entity>): Promise<Entity[]> {
        const metadata = this.connection.getMetadata(entityClass);
        const qb = this.createQueryBuilder(entityClass, FindOptionsUtils.extractFindManyOptionsAlias(optionsOrConditions) || metadata.name);
        this.joinEagerRelations(qb, qb.alias, metadata);
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
    findAndCount<Entity>(entityClass: ObjectType<Entity>|string, conditions?: DeepPartial<Entity>): Promise<[Entity[], number]>;

    /**
     * Finds entities that match given find options and conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    findAndCount<Entity>(entityClass: ObjectType<Entity>|string, optionsOrConditions?: FindManyOptions<Entity>|DeepPartial<Entity>): Promise<[Entity[], number]> {
        const metadata = this.connection.getMetadata(entityClass);
        const qb = this.createQueryBuilder(entityClass, FindOptionsUtils.extractFindManyOptionsAlias(optionsOrConditions) || metadata.name);
        this.joinEagerRelations(qb, qb.alias, metadata);
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
    findByIds<Entity>(entityClass: ObjectType<Entity>|string, ids: any[], conditions?: DeepPartial<Entity>): Promise<Entity[]>;

    /**
     * Finds entities with ids.
     * Optionally find options or conditions can be applied.
     */
    findByIds<Entity>(entityClass: ObjectType<Entity>|string, ids: any[], optionsOrConditions?: FindManyOptions<Entity>|DeepPartial<Entity>): Promise<Entity[]> {

        // if no ids passed, no need to execute a query - just return an empty array of values
        if (!ids.length)
            return Promise.resolve([]);
        const metadata = this.connection.getMetadata(entityClass);
        const qb = this.createQueryBuilder(entityClass, FindOptionsUtils.extractFindManyOptionsAlias(optionsOrConditions) || metadata.name);
        qb.whereInIds(ids.map(id => metadata.ensureEntityIdMap(id)));
        FindOptionsUtils.applyFindManyOptionsOrConditionsToQueryBuilder(qb, optionsOrConditions);
        this.joinEagerRelations(qb, qb.alias, metadata);
        return qb.getMany();
    }

    /**
     * Finds first entity that matches given find options.
     */
    findOne<Entity>(entityClass: ObjectType<Entity>|string, id?: string|number|Date|ObjectID, options?: FindOneOptions<Entity>): Promise<Entity|undefined>;

    /**
     * Finds first entity that matches given find options.
     */
    findOne<Entity>(entityClass: ObjectType<Entity>|string, options?: FindOneOptions<Entity>): Promise<Entity|undefined>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ObjectType<Entity>|string, conditions?: DeepPartial<Entity>, options?: FindOneOptions<Entity>): Promise<Entity|undefined>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ObjectType<Entity>|string, idOrOptionsOrConditions?: string|string[]|number|number[]|Date|Date[]|ObjectID|ObjectID[]|FindOneOptions<Entity>|DeepPartial<Entity>, maybeOptions?: FindOneOptions<Entity>): Promise<Entity|undefined> {

        const metadata = this.connection.getMetadata(entityClass);
        let alias: string = metadata.name;
        if (FindOptionsUtils.isFindOneOptions(idOrOptionsOrConditions) && idOrOptionsOrConditions.join) {
            alias = idOrOptionsOrConditions.join.alias;

        } else if (maybeOptions && FindOptionsUtils.isFindOneOptions(maybeOptions) && maybeOptions.join) {
            alias = maybeOptions.join.alias;
        }
        const qb = this.createQueryBuilder(entityClass, alias);

        this.joinEagerRelations(qb, qb.alias, metadata);

        if (maybeOptions) {
            FindOptionsUtils.applyOptionsToQueryBuilder(qb, maybeOptions);
        }

        if (FindOptionsUtils.isFindOneOptions(idOrOptionsOrConditions)) {
            FindOptionsUtils.applyOptionsToQueryBuilder(qb, idOrOptionsOrConditions);

        } else if (idOrOptionsOrConditions instanceof Object) {
            qb.where(idOrOptionsOrConditions as any);

        } else if (typeof idOrOptionsOrConditions === "string" || typeof idOrOptionsOrConditions === "number" || (idOrOptionsOrConditions as any) instanceof Date) {
            qb.andWhereInIds(metadata.ensureEntityIdMap(idOrOptionsOrConditions));
        }

        return qb.getOne();
    }

    /**
     * Clears all the data from the given table (truncates/drops it).
     *
     * Note: this method uses TRUNCATE and may not work as you expect in transactions on some platforms.
     * @see https://stackoverflow.com/a/5972738/925151
     */
    async clear<Entity>(entityClass: ObjectType<Entity>|string): Promise<void> {
        const metadata = this.connection.getMetadata(entityClass);
        const queryRunner = this.queryRunner || this.connection.createQueryRunner("master");
        try {
            return await queryRunner.clearTable(metadata.tablePath); // await is needed here because we are using finally

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
    getRepository<Entity>(target: ObjectType<Entity>|string): Repository<Entity> {

        // throw exception if there is no repository with this target registered
        if (!this.connection.hasMetadata(target))
            throw new RepositoryNotFoundError(this.connection.name, target);

        // find already created repository instance and return it if found
        const metadata = this.connection.getMetadata(target);
        const repository = this.repositories.find(repository => repository.metadata === metadata);
        if (repository)
            return repository;

        // if repository was not found then create it, store its instance and return it
        const newRepository = new RepositoryFactory().create(this, metadata, this.queryRunner);
        this.repositories.push(newRepository);
        return newRepository;
    }

    /**
     * Gets tree repository for the given entity class or name.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getTreeRepository<Entity>(target: ObjectType<Entity>|string): TreeRepository<Entity> {

        // tree tables aren't supported by some drivers (mongodb)
        if (this.connection.driver.treeSupport === false)
            throw new TreeRepositoryNotSupportedError(this.connection.driver);

        // check if repository is real tree repository
        const repository = this.getRepository(target);
        if (!(repository instanceof TreeRepository))
            throw new RepositoryNotTreeError(target);

        return repository;
    }

    /**
     * Gets mongodb repository for the given entity class.
     */
    getMongoRepository<Entity>(target: string|ObjectType<Entity>): MongoRepository<Entity> {
        return this.connection.getMongoRepository<Entity>(target);
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

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Joins all eager relations recursively.
     */
    protected joinEagerRelations(qb: SelectQueryBuilder<any>, alias: string, metadata: EntityMetadata) {
        metadata.eagerRelations.forEach(relation => {
            const relationAlias = alias + "_" + relation.propertyPath.replace(".", "_");
            qb.leftJoinAndSelect(alias + "." + relation.propertyPath, relationAlias);
            this.joinEagerRelations(qb, relationAlias, relation.inverseEntityMetadata);
        });
    }

}