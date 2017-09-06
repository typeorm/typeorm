import {Driver} from "../driver/Driver";
import {Repository} from "../repository/Repository";
import {EntitySubscriberInterface} from "../subscriber/EntitySubscriberInterface";
import {ObjectType} from "../common/ObjectType";
import {EntityManager} from "../entity-manager/EntityManager";
import {DefaultNamingStrategy} from "../naming-strategy/DefaultNamingStrategy";
import {CannotExecuteNotConnectedError} from "../error/CannotExecuteNotConnectedError";
import {CannotConnectAlreadyConnectedError} from "../error/CannotConnectAlreadyConnectedError";
import {TreeRepository} from "../repository/TreeRepository";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {Logger} from "../logger/Logger";
import {EntityMetadataNotFound} from "../error/EntityMetadataNotFound";
import {MigrationInterface} from "../migration/MigrationInterface";
import {MigrationExecutor} from "../migration/MigrationExecutor";
import {MongoRepository} from "../repository/MongoRepository";
import {MongoDriver} from "../driver/mongodb/MongoDriver";
import {MongoEntityManager} from "../entity-manager/MongoEntityManager";
import {EntityMetadataValidator} from "../metadata-builder/EntityMetadataValidator";
import {ConnectionOptions} from "./ConnectionOptions";
import {QueryRunnerProviderAlreadyReleasedError} from "../error/QueryRunnerProviderAlreadyReleasedError";
import {EntityManagerFactory} from "../entity-manager/EntityManagerFactory";
import {DriverFactory} from "../driver/DriverFactory";
import {ConnectionMetadataBuilder} from "./ConnectionMetadataBuilder";
import {QueryRunner} from "../query-runner/QueryRunner";
import {SelectQueryBuilder} from "../query-builder/SelectQueryBuilder";
import {LoggerFactory} from "../logger/LoggerFactory";

/**
 * Connection is a single database ORM connection to a specific database.
 * Its not required to be a database connection, depend on database type it can create connection pool.
 * You can have multiple connections to multiple databases in your application.
 */
export class Connection {

    // -------------------------------------------------------------------------
    // Public Readonly Properties
    // -------------------------------------------------------------------------

    /**
     * Connection name.
     */
    readonly name: string;

    /**
     * Connection options.
     */
    readonly options: ConnectionOptions;

    /**
     * Indicates if connection is initialized or not.
     */
    readonly isConnected = false;

    /**
     * Database driver used by this connection.
     */
    readonly driver: Driver;

    /**
     * EntityManager of this connection.
     */
    readonly manager: EntityManager;

    /**
     * Naming strategy used in the connection.
     */
    readonly namingStrategy: NamingStrategyInterface;

    /**
     * Logger used to log orm events.
     */
    readonly logger: Logger;

    /**
     * Migration instances that are registered for this connection.
     */
    readonly migrations: MigrationInterface[] = [];

    /**
     * Entity subscriber instances that are registered for this connection.
     */
    readonly subscribers: EntitySubscriberInterface<any>[] = [];

    /**
     * All entity metadatas that are registered for this connection.
     */
    readonly entityMetadatas: EntityMetadata[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(options: ConnectionOptions) {
        this.name = options.name || "default";
        this.options = options;
        this.logger = new LoggerFactory().create(this.options.logger, this.options.logging);
        this.driver = new DriverFactory().create(this);
        this.manager = new EntityManagerFactory().create(this);
        this.namingStrategy = options.namingStrategy || new DefaultNamingStrategy();
    }

    // -------------------------------------------------------------------------
    // Public Accessors
    // -------------------------------------------------------------------------

    /**
     * Gets the mongodb entity manager that allows to perform mongodb-specific repository operations
     * with any entity in this connection.
     *
     * Available only in mongodb connections.
     */
    get mongoManager(): MongoEntityManager {
        if (!(this.manager instanceof MongoEntityManager))
            throw new Error(`MongoEntityManager is only available for MongoDB databases.`);

        return this.manager as MongoEntityManager;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     * This method should be called once on application bootstrap.
     * This method not necessarily creates database connection (depend on database type),
     * but it also can setup a connection pool with database to use.
     */
    async connect(): Promise<this> {
        if (this.isConnected)
            throw new CannotConnectAlreadyConnectedError(this.name);

        // connect to the database via its driver
        await this.driver.connect();

        // set connected status for the current connection
        Object.assign(this, { isConnected: true });

        try {

            // build all metadatas registered in the current connection
            this.buildMetadatas();

            await this.driver.afterConnect();

            // if option is set - drop schema once connection is done
            if (this.options.dropSchema || this.options.dropSchemaOnConnection)
                await this.dropDatabase();

            // if option is set - automatically synchronize a schema
            if (this.options.synchronize || this.options.autoSchemaSync)
                await this.synchronize();

            // if option is set - automatically synchronize a schema
            if (this.options.migrationsRun || this.options.autoMigrationsRun)
                await this.runMigrations();

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
     * Once connection is closed, you cannot use repositories or perform any operations except opening connection again.
     */
    async close(): Promise<void> {
        if (!this.isConnected)
            throw new CannotExecuteNotConnectedError(this.name);

        await this.driver.disconnect();
        Object.assign(this, { isConnected: false });
    }

    /**
     * Creates database schema for all entities registered in this connection.
     * Can be used only after connection to the database is established.
     *
     * @param dropBeforeSync If set to true then it drops the database with all its tables and data
     */
    async synchronize(dropBeforeSync: boolean = false): Promise<void> {

        if (!this.isConnected)
            throw new CannotExecuteNotConnectedError(this.name);

        if (dropBeforeSync)
            await this.dropDatabase();

        const schemaBuilder = this.driver.createSchemaBuilder();
        await schemaBuilder.build();
    }

    /**
     * Drops the database and all its data.
     * Be careful with this method on production since this method will erase all your database tables and their data.
     * Can be used only after connection to the database is established.
     */
    async dropDatabase(): Promise<void> {
        const queryRunner = await this.createQueryRunner();
        await queryRunner.clearDatabase();
        await queryRunner.release();
    }

    /**
     * Runs all pending migrations.
     * Can be used only after connection to the database is established.
     */
    async runMigrations(): Promise<void> {

        if (!this.isConnected)
            throw new CannotExecuteNotConnectedError(this.name);

        const migrationExecutor = new MigrationExecutor(this);
        await migrationExecutor.executePendingMigrations();
    }

    /**
     * Reverts last executed migration.
     * Can be used only after connection to the database is established.
     */
    async undoLastMigration(): Promise<void> {

        if (!this.isConnected)
            throw new CannotExecuteNotConnectedError(this.name);

        const migrationExecutor = new MigrationExecutor(this);
        await migrationExecutor.undoLastMigration();
    }

    /**
     * Checks if entity metadata exist for the given entity class, target name or table name.
     */
    hasMetadata(target: Function|string): boolean {
        return !!this.findMetadata(target);
    }

    /**
     * Gets entity metadata for the given entity class or schema name.
     */
    getMetadata(target: Function|string): EntityMetadata {
        const metadata = this.findMetadata(target);
        if (!metadata)
            throw new EntityMetadataNotFound(target);

        return metadata;
    }

    /**
     * Gets repository for the given entity.
     */
    getRepository<Entity>(target: ObjectType<Entity>|string): Repository<Entity> {
        return this.manager.getRepository(target);
    }

    /**
     * Gets tree repository for the given entity class or name.
     * Only tree-type entities can have a TreeRepository, like ones decorated with @ClosureEntity decorator.
     */
    getTreeRepository<Entity>(target: ObjectType<Entity>|string): TreeRepository<Entity> {
        return this.manager.getTreeRepository(target);
    }

    /**
     * Gets mongodb-specific repository for the given entity class or name.
     * Works only if connection is mongodb-specific.
     */
    getMongoRepository<Entity>(target: ObjectType<Entity>|string): MongoRepository<Entity> {
        if (!(this.driver instanceof MongoDriver))
            throw new Error(`You can use getMongoRepository only for MongoDB connections.`);

        return this.manager.getRepository(target) as any;
    }

    /**
     * Gets custom entity repository marked with @EntityRepository decorator.
     */
    getCustomRepository<T>(customRepository: ObjectType<T>): T {
        return this.manager.getCustomRepository(customRepository);
    }

    /**
     * Wraps given function execution (and all operations made there) into a transaction.
     * All database operations must be executed using provided entity manager.
     */
    async transaction(runInTransaction: (entityManger: EntityManager) => Promise<any>): Promise<any> {
        return this.manager.transaction(runInTransaction);
    }

    /**
     * Executes raw SQL query and returns raw database results.
     */
    async query(query: string, parameters?: any[], queryRunner?: QueryRunner): Promise<any> {
        if (this instanceof MongoEntityManager)
            throw new Error(`Queries aren't supported by MongoDB.`);

        if (queryRunner && queryRunner.isReleased)
            throw new QueryRunnerProviderAlreadyReleasedError();

        const usedQueryRunner = queryRunner || this.createQueryRunner();

        try {
            return await usedQueryRunner.query(query, parameters);  // await is needed here because we are using finally

        } finally {
            if (!queryRunner)
                await usedQueryRunner.release();
        }
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
    createQueryBuilder<Entity>(entityOrRunner?: ObjectType<Entity>|Function|string|QueryRunner, alias?: string, queryRunner?: QueryRunner): SelectQueryBuilder<Entity> {
        if (this instanceof MongoEntityManager)
            throw new Error(`Query Builder is not supported by MongoDB.`);

        if (alias) {
            const metadata = this.getMetadata(entityOrRunner as Function|string);
            return new SelectQueryBuilder(this, queryRunner)
                .select(alias)
                .from(metadata.target, alias);

        } else {
            return new SelectQueryBuilder(this, entityOrRunner as QueryRunner|undefined);
        }
    }

    /**
     * Creates a query runner used for perform queries on a single database connection.
     * Using query runners you can control your queries to execute using single database connection and
     * manually control your database transaction.
     */
    createQueryRunner(): QueryRunner {
        const queryRunner = this.driver.createQueryRunner();
        const manager = new EntityManagerFactory().create(this, queryRunner);
        Object.assign(queryRunner, { manager: manager });
        return queryRunner;
    }

    /**
     * Creates a new entity manager with a single opened connection to the database.
     * This may be useful if you want to perform all db queries within one connection.
     * After finishing with entity manager, don't forget to release it (to release database connection back to pool).
     */
    /*createIsolatedManager(): EntityManager {
        if (this.driver instanceof MongoDriver)
            throw new Error(`You can use createIsolatedManager only for non MongoDB connections.`);

        // sqlite has a single query runner and does not support isolated managers
        if (this.driver instanceof SqliteDriver)
            return this.manager;

        return new EntityManagerFactory().create(this, this.driver.createQueryRunner());
    }*/

    /**
     * Creates a new repository with a single opened connection to the database.
     * This may be useful if you want to perform all db queries within one connection.
     * After finishing with repository, don't forget to release its query runner (to release database connection back to pool).
     */
    /*createIsolatedRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): Repository<Entity> {
        if (this.driver instanceof MongoDriver)
            throw new Error(`You can use createIsolatedRepository only for non MongoDB connections.`);

        // sqlite has a single query runner and does not support isolated repositories
        if (this.driver instanceof SqliteDriver)
            return this.manager.getRepository(entityClassOrName);

        return this.createIsolatedManager().getRepository(entityClassOrName);
    }*/

    // -------------------------------------------------------------------------
    // Deprecated Public Methods
    // -------------------------------------------------------------------------

    /**
     * Gets entity manager that allows to perform repository operations with any entity in this connection.
     *
     * @deprecated use manager instead.
     */
    get entityManager(): EntityManager {
        return this.manager;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Finds exist entity metadata by the given entity class, target name or table name.
     */
    protected findMetadata(target: Function|string): EntityMetadata|undefined {
        return this.entityMetadatas.find(metadata => {
            if (metadata.target === target)
                return true;
            if (typeof target === "string")
                return metadata.name === target || metadata.tableName === target;

            return false;
        });
    }

    /**
     * Builds metadatas for all registered classes inside this connection.
     */
    protected buildMetadatas(): void {

        const connectionMetadataBuilder = new ConnectionMetadataBuilder(this);
        const entityMetadataValidator = new EntityMetadataValidator();

        // create subscribers instances if they are not disallowed from high-level (for example they can disallowed from migrations run process)
        const subscribers = connectionMetadataBuilder.buildSubscribers(this.options.subscribers || []);
        Object.assign(this, { subscribers: subscribers });

        // build entity metadatas
        const entityMetadatas = connectionMetadataBuilder.buildEntityMetadatas(this.options.entities || [], this.options.entitySchemas || []);
        Object.assign(this, { entityMetadatas: entityMetadatas });

        // create migration instances
        const migrations = connectionMetadataBuilder.buildMigrations(this.options.migrations || []);
        Object.assign(this, { migrations: migrations });

        // validate all created entity metadatas to make sure user created entities are valid and correct
        entityMetadataValidator.validateMany(this.entityMetadatas, this.driver);
    }

}