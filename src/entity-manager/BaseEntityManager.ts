import {Connection} from "../connection/Connection";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {Repository} from "../repository/Repository";
import {ObjectType} from "../common/ObjectType";
import {TreeRepository} from "../repository/TreeRepository";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {QueryRunnerProvider} from "../query-runner/QueryRunnerProvider";
import {RepositoryAggregator} from "../repository/RepositoryAggregator";
import {RepositoryNotTreeError} from "../connection/error/RepositoryNotTreeError";
import {NoNeedToReleaseEntityManagerError} from "./error/NoNeedToReleaseEntityManagerError";
import {QueryRunnerProviderAlreadyReleasedError} from "../query-runner/error/QueryRunnerProviderAlreadyReleasedError";
import {SpecificRepository} from "../repository/SpecificRepository";
import {MongoRepository} from "../repository/MongoRepository";
import {DeepPartial} from "../common/DeepPartial";

/**
 * Common functions shared between different entity manager types.
 */
export abstract class BaseEntityManager {

    // -------------------------------------------------------------------------
    // Private Properties
    // -------------------------------------------------------------------------

    /**
     * Stores all registered repositories.
     * Used when custom queryRunnerProvider is provided.
     */
    private readonly repositoryAggregators: RepositoryAggregator[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /**
     * @param connection Connection to be used in this entity manager
     * @param queryRunnerProvider Custom query runner to be used for operations in this entity manager
     */
    constructor(protected connection: Connection,
                protected queryRunnerProvider?: QueryRunnerProvider) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Gets repository for the given entity class.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getRepository<Entity>(entityClass: ObjectType<Entity>): Repository<Entity>;

    /**
     * Gets repository for the given entity name.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getRepository<Entity>(entityName: string): Repository<Entity>;

    /**
     * Gets repository for the given entity class or name.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): Repository<Entity> {

        // if single db connection is used then create its own repository with reused query runner
        if (this.queryRunnerProvider)
            return this.obtainRepositoryAggregator(entityClassOrName as any).repository;

        return this.connection.getRepository<Entity>(entityClassOrName as any);
    }

    /**
     * Gets tree repository for the given entity class.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getTreeRepository<Entity>(entityClass: ObjectType<Entity>): TreeRepository<Entity>;

    /**
     * Gets tree repository for the given entity name.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getTreeRepository<Entity>(entityName: string): TreeRepository<Entity>;

    /**
     * Gets tree repository for the given entity class or name.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getTreeRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): TreeRepository<Entity> {

        // if single db connection is used then create its own repository with reused query runner
        if (this.queryRunnerProvider) {
            const treeRepository = this.obtainRepositoryAggregator(entityClassOrName).treeRepository;
            if (!treeRepository)
                throw new RepositoryNotTreeError(entityClassOrName);

            return treeRepository;
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
        if (this.queryRunnerProvider)
            return this.obtainRepositoryAggregator(entityClassOrName as any).repository as MongoRepository<Entity>;

        return this.connection.getMongoRepository<Entity>(entityClassOrName as any);
    }

    /**
     * Gets specific repository for the given entity class.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getSpecificRepository<Entity>(entityClass: ObjectType<Entity>): SpecificRepository<Entity>;

    /**
     * Gets specific repository for the given entity name.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getSpecificRepository<Entity>(entityName: string): SpecificRepository<Entity>;

    /**
     * Gets specific repository for the given entity class or name.
     * If single database connection mode is used, then repository is obtained from the
     * repository aggregator, where each repository is individually created for this entity manager.
     * When single database connection is not used, repository is being obtained from the connection.
     */
    getSpecificRepository<Entity>(entityClassOrName: ObjectType<Entity>|string): SpecificRepository<Entity> {

        // if single db connection is used then create its own repository with reused query runner
        if (this.queryRunnerProvider)
            return this.obtainRepositoryAggregator(entityClassOrName).specificRepository;

        return this.connection.getSpecificRepository<Entity>(entityClassOrName as any);
    }

    /**
     * Gets custom entity repository marked with @EntityRepository decorator.
     */
    getCustomRepository<T>(customRepository: ObjectType<T>): T {
        return this.connection.getCustomRepository<T>(customRepository);
    }

    /**
     * Checks if entity has an id.
     */
    hasId(entity: any): boolean;

    /**
     * Checks if entity of given schema name has an id.
     */
    hasId(target: string, entity: any): boolean;

    /**
     * Checks if entity has an id by its Function type or schema name.
     */
    hasId(targetOrEntity: any|string, maybeEntity?: any): boolean {
        const target = arguments.length === 2 ? targetOrEntity : targetOrEntity.constructor;
        const entity = arguments.length === 2 ? maybeEntity : targetOrEntity;
        return this.getRepository(target as any).hasId(entity);
    }

    /**
     * Gets entity mixed id.
     */
    getId(entity: any): any;

    /**
     * Gets entity mixed id.
     */
    getId(target: string, entity: any): any;

    /**
     * Gets entity mixed id.
     */
    getId(targetOrEntity: any|string, maybeEntity?: any): any {
        const target = arguments.length === 2 ? targetOrEntity : targetOrEntity.constructor;
        const entity = arguments.length === 2 ? maybeEntity : targetOrEntity;
        return this.getRepository(target as any).getId(entity);
    }

    /**
     * Creates a new query builder that can be used to build an sql query.
     */
    createQueryBuilder<Entity>(entityClass: ObjectType<Entity>|Function|string, alias: string): QueryBuilder<Entity> {
        return this.getRepository(entityClass as any).createQueryBuilder(alias);
    }

    /**
     * Creates a new entity instance.
     */
    create<Entity>(entityClass: ObjectType<Entity>): Entity;

    /**
     * Creates a new entity instance and copies all entity properties from this object into a new entity.
     * Note that it copies only properties that present in entity schema.
     */
    create<Entity>(entityClass: ObjectType<Entity>, plainObject: DeepPartial<Entity>): Entity;

    /**
     * Creates a new entities and copies all entity properties from given objects into their new entities.
     * Note that it copies only properties that present in entity schema.
     */
    create<Entity>(entityClass: ObjectType<Entity>, plainObjects: DeepPartial<Entity>[]): Entity[];

    /**
     * Creates a new entity instance or instances.
     * Can copy properties from the given object into new entities.
     */
    create<Entity>(entityClass: ObjectType<Entity>, plainObjectOrObjects?: DeepPartial<Entity>|DeepPartial<Entity>[]): Entity|Entity[] {
        if (plainObjectOrObjects instanceof Array) {
            return this.getRepository(entityClass).create(plainObjectOrObjects);

        } else if (plainObjectOrObjects) {
            return this.getRepository(entityClass).create(plainObjectOrObjects);

        } else {
            return this.getRepository(entityClass).create();
        }
    }

    /**
     * Creates a new entity from the given plan javascript object. If entity already exist in the database, then
     * it loads it (and everything related to it), replaces all values with the new ones from the given object
     * and returns this new entity. This new entity is actually a loaded from the db entity with all properties
     * replaced from the new object.
     */
    preload<Entity>(entityClass: ObjectType<Entity>, object: DeepPartial<Entity>): Promise<Entity> {
        return this.getRepository(entityClass).preload(object);
    }

    /**
     * Merges two entities into one new entity.
     */
    merge<Entity>(entityClass: ObjectType<Entity>, mergeIntoEntity: Entity, ...objects: DeepPartial<Entity>[]): Entity { // todo: throw exception ie tntity manager is released
        return <Entity> this.getRepository(entityClass).merge(mergeIntoEntity, ...objects);
    }

    /**
     * Releases all resources used by entity manager.
     * This is used when entity manager is created with a single query runner,
     * and this single query runner needs to be released after job with entity manager is done.
     */
    async release(): Promise<void> {
        if (!this.queryRunnerProvider)
            throw new NoNeedToReleaseEntityManagerError();

        return this.queryRunnerProvider.releaseReused();
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Gets, or if does not exist yet, creates and returns a repository aggregator for a particular entity target.
     */
    protected obtainRepositoryAggregator<Entity>(entityClassOrName: ObjectType<Entity>|string): RepositoryAggregator {
        if (this.queryRunnerProvider && this.queryRunnerProvider.isReleased)
            throw new QueryRunnerProviderAlreadyReleasedError();

        const metadata = this.connection.getMetadata(entityClassOrName);
        let repositoryAggregator = this.repositoryAggregators.find(repositoryAggregate => repositoryAggregate.metadata === metadata);
        if (!repositoryAggregator) {
            repositoryAggregator = new RepositoryAggregator(
                this.connection,
                this.connection.getMetadata(entityClassOrName as any),
                this.queryRunnerProvider
            );
            this.repositoryAggregators.push(repositoryAggregator); // todo: check isnt memory leak here?
        }

        return repositoryAggregator;
    }

}