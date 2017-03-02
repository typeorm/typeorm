import {Driver} from "../driver/Driver";
import {Repository} from "../repository/Repository";
import {EntitySubscriberInterface} from "../subscriber/EntitySubscriberInterface";
import {RepositoryNotFoundError} from "./error/RepositoryNotFoundError";
import {ObjectType} from "../common/ObjectType";
import {EntityListenerMetadata} from "../metadata/EntityListenerMetadata";
import {EntityManager} from "../entity-manager/EntityManager";
import {importClassesFromDirectories, importJsonsFromDirectories} from "../util/DirectoryExportedClassesLoader";
import {getMetadataArgsStorage, getFromContainer} from "../index";
import {EntityMetadataBuilder} from "../metadata-builder/EntityMetadataBuilder";
import {DefaultNamingStrategy} from "../naming-strategy/DefaultNamingStrategy";
import {CannotImportAlreadyConnectedError} from "./error/CannotImportAlreadyConnectedError";
import {CannotCloseNotConnectedError} from "./error/CannotCloseNotConnectedError";
import {CannotConnectAlreadyConnectedError} from "./error/CannotConnectAlreadyConnectedError";
import {TreeRepository} from "../repository/TreeRepository";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {NamingStrategyNotFoundError} from "./error/NamingStrategyNotFoundError";
import {RepositoryNotTreeError} from "./error/RepositoryNotTreeError";
import {EntitySchema} from "../entity-schema/EntitySchema";
import {CannotSyncNotConnectedError} from "./error/CannotSyncNotConnectedError";
import {CannotUseNamingStrategyNotConnectedError} from "./error/CannotUseNamingStrategyNotConnectedError";
import {Broadcaster} from "../subscriber/Broadcaster";
import {LazyRelationsWrapper} from "../lazy-loading/LazyRelationsWrapper";
import {SpecificRepository} from "../repository/SpecificRepository";
import {RepositoryAggregator} from "../repository/RepositoryAggregator";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {SchemaBuilder} from "../schema-builder/SchemaBuilder";
import {Logger} from "../logger/Logger";
import {QueryRunnerProvider} from "../query-runner/QueryRunnerProvider";
import {EntityMetadataNotFound} from "../metadata-args/error/EntityMetadataNotFound";
import {MigrationInterface} from "../migration/MigrationInterface";
import {MigrationExecutor} from "../migration/MigrationExecutor";
import {CannotRunMigrationNotConnectedError} from "./error/CannotRunMigrationNotConnectedError";
import {PlatformTools} from "../platform/PlatformTools";
import {AbstractRepository} from "../repository/AbstractRepository";
import {CustomRepositoryNotFoundError} from "../repository/error/CustomRepositoryNotFoundError";
import {CustomRepositoryReusedError} from "../repository/error/CustomRepositoryReusedError";
import {CustomRepositoryCannotInheritRepositoryError} from "../repository/error/CustomRepositoryCannotInheritRepositoryError";
import {MongoRepository} from "../repository/MongoRepository";
import {MongoDriver} from "../driver/mongodb/MongoDriver";
import {MongoEntityManager} from "../entity-manager/MongoEntityManager";

/**
 * Connection is a single database connection to a specific database of a database management system.
 * You can have multiple connections to multiple databases in your application.
 */
export class Connection {

    // -------------------------------------------------------------------------
    // Public Readonly properties
    // -------------------------------------------------------------------------

    /**
     * Connection name.
     */
    public readonly name: string;

    /**
     * Database driver used by this connection.
     */
    public readonly driver: Driver;

    /**
     * Logger used to log orm events.
     */
    public readonly logger: Logger;

    /**
     * All entity metadatas that are registered for this connection.
     */
    public readonly entityMetadatas: EntityMetadata[] = [];

    /**
     * Used to broadcast connection events.
     */
    public readonly broadcaster: Broadcaster;

    // -------------------------------------------------------------------------
    // Private Properties
    // -------------------------------------------------------------------------

    /**
     * Gets EntityManager of this connection.
     */
    private readonly _entityManager: EntityManager;

    /**
     * Stores all registered repositories.
     */
    private readonly repositoryAggregators: RepositoryAggregator[] = [];

    /**
     * Stores all entity repository instances.
     */
    private readonly entityRepositories: Object[] = [];

    /**
     * Entity listeners that are registered for this connection.
     */
    private readonly entityListeners: EntityListenerMetadata[] = [];

    /**
     * Entity subscribers that are registered for this connection.
     */
    private readonly entitySubscribers: EntitySubscriberInterface<any>[] = [];

    /**
     * Registered entity classes to be used for this connection.
     */
    private readonly entityClasses: Function[] = [];

    /**
     * Registered entity schemas to be used for this connection.
     */
    private readonly entitySchemas: EntitySchema[] = [];

    /**
     * Registered subscriber classes to be used for this connection.
     */
    private readonly subscriberClasses: Function[] = [];

    /**
     * Registered naming strategy classes to be used for this connection.
     */
    private readonly namingStrategyClasses: Function[] = [];

    /**
     * Registered migration classes to be used for this connection.
     */
    private readonly migrationClasses: Function[] = [];

    /**
     * Naming strategy to be used in this connection.
     */
    private usedNamingStrategy: Function|string;

    /**
     * Indicates if connection has been done or not.
     */
    private _isConnected = false;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(name: string, driver: Driver, logger: Logger) {
        this.name = name;
        this.driver = driver;
        this.logger = logger;
        this._entityManager = this.createEntityManager();
        this.broadcaster = this.createBroadcaster();
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Indicates if connection to the database already established for this connection.
     */
    get isConnected(): boolean {
        return this._isConnected;
    }

    /**
     * Gets entity manager that allows to perform repository operations with any entity in this connection.
     */
    get entityManager(): EntityManager {
        // if (!this.isConnected)
        //     throw new CannotGetEntityManagerNotConnectedError(this.name);

        return this._entityManager;
    }

    /**
     * Gets the mongodb entity manager that allows to perform mongodb-specific repository operations
     * with any entity in this connection.
     */
    get mongoEntityManager(): MongoEntityManager {
        if (!(this._entityManager instanceof MongoEntityManager))
            throw new Error(`MongoEntityManager is only available for MongoDB databases.`);

        return this._entityManager as MongoEntityManager;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     */
    async connect(): Promise<this> {
        if (this.isConnected)
            throw new CannotConnectAlreadyConnectedError(this.name);

        // connect to the database via its driver
        await this.driver.connect();

        // set connected status for the current connection
        this._isConnected = true;

        // build all metadatas registered in the current connection
        try {
            this.buildMetadatas();

        } catch (error) {

            // if for some reason build metadata fail (for example validation error during entity metadata check)
            // connection needs to be closed
            await this.close();
            throw error;
        }

        return this;
    }

    /**
     * Closes connection with the database.
     * Once connection is closed, you cannot use repositories and perform any operations except
     * opening connection again.
     */
    async close(): Promise<void> {
        if (!this.isConnected)
            throw new CannotCloseNotConnectedError(this.name);

        await this.driver.disconnect();
        this._isConnected = false;
    }

    /**
     * Drops the database and all its data.
     */
    async dropDatabase(): Promise<void> {
        const queryRunner = await this.driver.createQueryRunner();
        await queryRunner.clearDatabase();
    }

    /**
     * Creates database schema for all entities registered in this connection.
     *
     * @param dropBeforeSync If set to true then it drops the database with all its tables and data
     */
    async syncSchema(dropBeforeSync: boolean = false): Promise<void> {

        if (!this.isConnected)
            return Promise.reject(new CannotSyncNotConnectedError(this.name));

        if (dropBeforeSync)
            await this.dropDatabase();

        if (this.driver instanceof MongoDriver) { // todo: temporary
            await this.driver.syncSchema(this.entityMetadatas);

        } else {
            await this.createSchemaBuilder().build();
        }
    }

    /**
     * Runs all pending migrations.
     */
    async runMigrations(): Promise<void> {

        if (!this.isConnected)
            return Promise.reject(new CannotRunMigrationNotConnectedError(this.name));

        const migrationExecutor = new MigrationExecutor(this);
        await migrationExecutor.executePendingMigrations();
    }

    /**
     * Reverts last executed migration.
     */
    async undoLastMigration(): Promise<void> {

        if (!this.isConnected)
            return Promise.reject(new CannotRunMigrationNotConnectedError(this.name));

        const migrationExecutor = new MigrationExecutor(this);
        await migrationExecutor.undoLastMigration();
    }

    /**
     * Imports entities from the given paths (directories) and registers them in the current connection.
     */
    importEntitiesFromDirectories(paths: string[]): this {
        this.importEntities(importClassesFromDirectories(paths));
        return this;
    }

    /**
     * Imports entity schemas from the given paths (directories) and registers them in the current connection.
     */
    importEntitySchemaFromDirectories(paths: string[]): this {
        this.importEntitySchemas(importJsonsFromDirectories(paths));
        return this;
    }

    /**
     * Imports subscribers from the given paths (directories) and registers them in the current connection.
     */
    importSubscribersFromDirectories(paths: string[]): this {
        this.importSubscribers(importClassesFromDirectories(paths));
        return this;
    }

    /**
     * Imports naming strategies from the given paths (directories) and registers them in the current connection.
     */
    importNamingStrategiesFromDirectories(paths: string[]): this {
        this.importEntities(importClassesFromDirectories(paths));
        return this;
    }

    /**
     * Imports migrations from the given paths (directories) and registers them in the current connection.
     */
    importMigrationsFromDirectories(paths: string[]): this {
        this.importMigrations(importClassesFromDirectories(paths));
        return this;
    }

    /**
     * Imports entities and registers them in the current connection.
     */
    importEntities(entities: Function[]): this {
        if (this.isConnected)
            throw new CannotImportAlreadyConnectedError("entities", this.name);

        entities.forEach(cls => this.entityClasses.push(cls));
        return this;
    }

    /**
     * Imports schemas and registers them in the current connection.
     */
    importEntitySchemas(schemas: EntitySchema[]): this {
        if (this.isConnected)
            throw new CannotImportAlreadyConnectedError("schemas", this.name);

        schemas.forEach(schema => this.entitySchemas.push(schema));
        return this;
    }

    /**
     * Imports subscribers and registers them in the current connection.
     */
    importSubscribers(subscriberClasses: Function[]): this {
        if (this.isConnected)
            throw new CannotImportAlreadyConnectedError("entity subscribers", this.name);

        subscriberClasses.forEach(cls => this.subscriberClasses.push(cls));
        return this;
    }

    /**
     * Imports naming strategies and registers them in the current connection.
     */
    importNamingStrategies(strategies: Function[]): this {
        if (this.isConnected)
            throw new CannotImportAlreadyConnectedError("naming strategies", this.name);

        strategies.forEach(cls => this.namingStrategyClasses.push(cls));
        return this;
    }

    /**
     * Imports migrations and registers them in the current connection.
     */
    importMigrations(migrations: Function[]): this {
        if (this.isConnected)
            throw new CannotImportAlreadyConnectedError("migrations", this.name);

        migrations.forEach(cls => this.migrationClasses.push(cls));
        return this;
    }

    /**
     * Sets given naming strategy to be used.
     * Naming strategy must be set to be used before connection is established.
     */
    useNamingStrategy(name: string): this;

    /**
     * Sets given naming strategy to be used.
     * Naming strategy must be set to be used before connection is established.
     */
    useNamingStrategy(strategy: Function): this;

    /**
     * Sets given naming strategy to be used.
     * Naming strategy must be set to be used before connection is established.
     */
    useNamingStrategy(strategyClassOrName: string|Function): this {
        if (this.isConnected)
            throw new CannotUseNamingStrategyNotConnectedError(this.name);

        this.usedNamingStrategy = strategyClassOrName;
        return this;
    }

    /**
     * Gets the entity metadata of the given entity class.
     */
    getMetadata(target: Function): EntityMetadata;

    /**
     * Gets the entity metadata of the given entity name.
     */
    getMetadata(target: string): EntityMetadata;

    /**
     * Gets the entity metadata of the given entity class or schema name.
     */
    getMetadata(target: Function|string): EntityMetadata;

    /**
     Gets entity metadata for the given entity class or schema name.
     */
    getMetadata(target: Function|string): EntityMetadata {
        const metadata = this.entityMetadatas.find(metadata => metadata.target === target || (typeof target === "string" && metadata.targetName === target));
        if (!metadata)
            throw new EntityMetadataNotFound(target);

        return metadata;
    }

    /**
     * Gets repository for the given entity class.
     */
    getRepository<Entity>(entityClass: ObjectType<Entity>): Repository<Entity>;

    /**
     * Gets repository for the given entity name.
     */
    getRepository<Entity>(entityName: string): Repository<Entity>;

    /**
     * Gets repository for the given entity name.
     */
    getRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): Repository<Entity>;

    /**
     * Gets repository for the given entity class or name.
     */
    getRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): Repository<Entity> {
        return this.findRepositoryAggregator(entityClassOrName).repository;
    }

    /**
     * Gets tree repository for the given entity class.
     * Only tree-type entities can have a TreeRepository,
     * like ones decorated with @ClosureEntity decorator.
     */
    getTreeRepository<Entity>(entityClass: ObjectType<Entity>): TreeRepository<Entity>;

    /**
     * Gets tree repository for the given entity class.
     * Only tree-type entities can have a TreeRepository,
     * like ones decorated with @ClosureEntity decorator.
     */
    getTreeRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): TreeRepository<Entity>;

    /**
     * Gets tree repository for the given entity class.
     * Only tree-type entities can have a TreeRepository,
     * like ones decorated with @ClosureEntity decorator.
     */
    getTreeRepository<Entity>(entityName: string): TreeRepository<Entity>;

    /**
     * Gets tree repository for the given entity class or name.
     * Only tree-type entities can have a TreeRepository,
     * like ones decorated with @ClosureEntity decorator.
     */
    getTreeRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): TreeRepository<Entity> {
        // todo: add checks if tree repository is supported by driver (not supported by mongodb at least)

        const repository = this.findRepositoryAggregator(entityClassOrName).treeRepository;
        if (!repository)
            throw new RepositoryNotTreeError(entityClassOrName);

        return repository;
    }

    /**
     * Gets mongodb-specific repository for the given entity class.
     */
    getMongoRepository<Entity>(entityClass: ObjectType<Entity>): MongoRepository<Entity>;

    /**
     * Gets mongodb-specific repository for the given entity name.
     */
    getMongoRepository<Entity>(entityName: string): MongoRepository<Entity>;

    /**
     * Gets mongodb-specific repository for the given entity name.
     */
    getMongoRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): MongoRepository<Entity>;

    /**
     * Gets mongodb-specific repository for the given entity class or name.
     */
    getMongoRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): MongoRepository<Entity> {
        if (!(this.driver instanceof MongoDriver))
            throw new Error(`You can use getMongoRepository only for MongoDB connections.`);

        return this.findRepositoryAggregator(entityClassOrName).repository as MongoRepository<Entity>;
    }

    /**
     * Gets specific repository for the given entity class.
     * SpecificRepository is a special repository that contains specific and non standard repository methods.
     *
     * @experimental
     */
    getSpecificRepository<Entity>(entityClass: ObjectType<Entity>): SpecificRepository<Entity>;

    /**
     * Gets specific repository for the given entity name.
     * SpecificRepository is a special repository that contains specific and non standard repository methods.
     *
     * @experimental
     */
    getSpecificRepository<Entity>(entityName: string): SpecificRepository<Entity>;

    /**
     * Gets specific repository for the given entity class or name.
     * SpecificRepository is a special repository that contains specific and non standard repository methods.
     *
     * @experimental
     */
    getSpecificRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): SpecificRepository<Entity>;

    /**
     * Gets specific repository for the given entity class or name.
     * SpecificRepository is a special repository that contains specific and non standard repository methods.
     *
     * @experimental
     */
    getSpecificRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): SpecificRepository<Entity> {
        return this.findRepositoryAggregator(entityClassOrName).specificRepository;
    }

    /**
     * Creates a new entity manager with a single opened connection to the database.
     * This may be useful if you want to perform all db queries within one connection.
     * After finishing with entity manager, don't forget to release it, to release connection back to pool.
     */
    createEntityManagerWithSingleDatabaseConnection(queryRunnerProvider?: QueryRunnerProvider): EntityManager {
        if (!queryRunnerProvider)
            queryRunnerProvider = new QueryRunnerProvider(this.driver, true);

        return new EntityManager(this, queryRunnerProvider);
    }

    /**
     * Gets migration instances that are registered for this connection.
     */
    getMigrations(): MigrationInterface[] {
        if (this.migrationClasses && this.migrationClasses.length) {
            return this.migrationClasses.map(migrationClass => {
                return getFromContainer<MigrationInterface>(migrationClass);
            });
        }

        return [];
    }

    /**
     * Gets custom entity repository marked with @EntityRepository decorator.
     */
    getCustomRepository<T>(customRepository: ObjectType<T>): T {
        const entityRepositoryMetadataArgs = getMetadataArgsStorage().entityRepositories.toArray().find(repository => {
            return repository.target === (customRepository instanceof Function ? customRepository : (customRepository as any).constructor);
        });
        if (!entityRepositoryMetadataArgs)
            throw new CustomRepositoryNotFoundError(customRepository);

        let entityRepositoryInstance: any = this.entityRepositories.find(entityRepository => entityRepository.constructor === customRepository);
        if (!entityRepositoryInstance) {
            if (entityRepositoryMetadataArgs.useContainer) {
                entityRepositoryInstance = getFromContainer(entityRepositoryMetadataArgs.target);

                // if we get custom entity repository from container then there is a risk that it already was used
                // in some different connection. If it was used there then we check it and throw an exception
                // because we cant override its connection there again

                if (entityRepositoryInstance instanceof AbstractRepository || entityRepositoryInstance instanceof Repository) {
                    // NOTE: dynamic access to protected properties. We need this to prevent unwanted properties in those classes to be exposed,
                    // however we need these properties for internal work of the class
                    if ((entityRepositoryInstance as any)["connection"] && (entityRepositoryInstance as any)["connection"] !== this)
                        throw new CustomRepositoryReusedError(customRepository);
                }

            } else {
                entityRepositoryInstance = new (entityRepositoryMetadataArgs.target as any)();
            }

            if (entityRepositoryInstance instanceof AbstractRepository) {
                // NOTE: dynamic access to protected properties. We need this to prevent unwanted properties in those classes to be exposed,
                // however we need these properties for internal work of the class
                if (!(entityRepositoryInstance as any)["connection"])
                    (entityRepositoryInstance as any)["connection"] = this;
            }
            if (entityRepositoryInstance instanceof Repository) {
                if (!entityRepositoryMetadataArgs.entity)
                    throw new CustomRepositoryCannotInheritRepositoryError(customRepository);

                // NOTE: dynamic access to protected properties. We need this to prevent unwanted properties in those classes to be exposed,
                // however we need these properties for internal work of the class
                (entityRepositoryInstance as any)["connection"] = this;
                (entityRepositoryInstance as any)["metadata"] = this.getMetadata(entityRepositoryMetadataArgs.entity);
            }

            // register entity repository
            this.entityRepositories.push(entityRepositoryInstance);
        }

        return entityRepositoryInstance;
    }

    /**
     * Gets custom repository's managed entity.
     * If given custom repository does not manage any entity then undefined will be returned.
     */
    getCustomRepositoryTarget<T>(customRepository: any): Function|string|undefined {
        const entityRepositoryMetadataArgs = getMetadataArgsStorage().entityRepositories.toArray().find(repository => {
            return repository.target === (customRepository instanceof Function ? customRepository : (customRepository as any).constructor);
        });
        if (!entityRepositoryMetadataArgs)
            throw new CustomRepositoryNotFoundError(customRepository);

        return entityRepositoryMetadataArgs.entity;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Finds repository aggregator of the given entity class or name.
     */
    protected findRepositoryAggregator(entityClassOrName: ObjectType<any>|string): RepositoryAggregator {
        // if (!this.isConnected)
        //     throw new NoConnectionForRepositoryError(this.name);

        if (!this.entityMetadatas.find(metadata => metadata.target === entityClassOrName || (typeof entityClassOrName === "string" && metadata.targetName === entityClassOrName)))
            throw new RepositoryNotFoundError(this.name, entityClassOrName);

        const metadata = this.getMetadata(entityClassOrName);
        const repositoryAggregator = this.repositoryAggregators.find(repositoryAggregate => repositoryAggregate.metadata === metadata);
        if (!repositoryAggregator)
            throw new RepositoryNotFoundError(this.name, entityClassOrName);

        return repositoryAggregator;
    }

    /**
     * Builds all registered metadatas.
     */
    protected buildMetadatas() {

        this.entitySubscribers.length = 0;
        this.entityListeners.length = 0;
        this.repositoryAggregators.length = 0;
        this.entityMetadatas.length = 0;

        const namingStrategy = this.createNamingStrategy();
        this.driver.namingStrategy = namingStrategy;
        const lazyRelationsWrapper = this.createLazyRelationsWrapper();

        // take imported event subscribers
        if (this.subscriberClasses && this.subscriberClasses.length && !PlatformTools.getEnvVariable("SKIP_SUBSCRIBERS_LOADING")) {
            getMetadataArgsStorage()
                .entitySubscribers
                .filterByTargets(this.subscriberClasses)
                .toArray()
                .map(metadata => getFromContainer(metadata.target))
                .forEach(subscriber => this.entitySubscribers.push(subscriber));
        }

        // take imported entity listeners
        if (this.entityClasses && this.entityClasses.length) {
            getMetadataArgsStorage()
                .entityListeners
                .filterByTargets(this.entityClasses)
                .toArray()
                .forEach(metadata => this.entityListeners.push(new EntityListenerMetadata(metadata)));
        }

        // build entity metadatas from metadata args storage (collected from decorators)
        if (this.entityClasses && this.entityClasses.length) {
            getFromContainer(EntityMetadataBuilder)
                .buildFromMetadataArgsStorage(this.driver, lazyRelationsWrapper, namingStrategy, this.entityClasses)
                .forEach(metadata => {
                    this.entityMetadatas.push(metadata);
                    this.repositoryAggregators.push(new RepositoryAggregator(this, metadata));
                });
        }

        // build entity metadatas from given entity schemas
        if (this.entitySchemas && this.entitySchemas.length) {
            getFromContainer(EntityMetadataBuilder)
                .buildFromSchemas(this.driver, lazyRelationsWrapper, namingStrategy, this.entitySchemas)
                .forEach(metadata => {
                    this.entityMetadatas.push(metadata);
                    this.repositoryAggregators.push(new RepositoryAggregator(this, metadata));
                });
        }
    }

    /**
     * Creates a naming strategy to be used for this connection.
     */
    protected createNamingStrategy(): NamingStrategyInterface {

        // if naming strategies are not loaded, or used naming strategy is not set then use default naming strategy
        if (!this.namingStrategyClasses || !this.namingStrategyClasses.length || !this.usedNamingStrategy)
            return getFromContainer(DefaultNamingStrategy);

        // try to find used naming strategy in the list of loaded naming strategies
        const namingMetadata = getMetadataArgsStorage()
            .namingStrategies
            .filterByTargets(this.namingStrategyClasses)
            .toArray()
            .find(strategy => {
                if (typeof this.usedNamingStrategy === "string") {
                    return strategy.name === this.usedNamingStrategy;
                } else {
                    return strategy.target === this.usedNamingStrategy;
                }
            });

        // throw an error if not found
        if (!namingMetadata)
            throw new NamingStrategyNotFoundError(this.usedNamingStrategy, this.name);

        // initialize a naming strategy instance
        return getFromContainer<NamingStrategyInterface>(namingMetadata.target);
    }

    /**
     * Creates a new default entity manager without single connection setup.
     */
    protected createEntityManager() {
        if (this.driver instanceof MongoDriver)
            return new MongoEntityManager(this);

        return new EntityManager(this);
    }

    /**
     * Creates a new entity broadcaster using in this connection.
     */
    protected createBroadcaster() {
        return new Broadcaster(this, this.entitySubscribers, this.entityListeners);
    }

    /**
     * Creates a schema builder used to build a database schema for the entities of the current connection.
     */
    protected createSchemaBuilder() {
        return new SchemaBuilder(this.driver, this.logger, this.entityMetadatas);
    }

    /**
     * Creates a lazy relations wrapper.
     */
    protected createLazyRelationsWrapper() {
        return new LazyRelationsWrapper(this);
    }

}