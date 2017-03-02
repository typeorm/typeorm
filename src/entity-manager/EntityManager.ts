import {Connection} from "../connection/Connection";
import {FindManyOptions} from "../find-options/FindManyOptions";
import {ObjectType} from "../common/ObjectType";
import {BaseEntityManager} from "./BaseEntityManager";
import {QueryRunnerProviderAlreadyReleasedError} from "../query-runner/error/QueryRunnerProviderAlreadyReleasedError";
import {QueryRunnerProvider} from "../query-runner/QueryRunnerProvider";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {FindOneOptions} from "../find-options/FindOneOptions";
import {DeepPartial} from "../common/DeepPartial";
import {RemoveOptions} from "../repository/RemoveOptions";
import {PersistOptions} from "../repository/PersistOptions";

/**
 * Entity manager supposed to work with any entity, automatically find its repository and call its methods,
 * whatever entity type are you passing.
 */
export class EntityManager extends BaseEntityManager {

    // -------------------------------------------------------------------------
    // Private properties
    // -------------------------------------------------------------------------

    /**
     * Stores temporarily user data.
     * Useful for sharing data with subscribers.
     */
    private data: ObjectLiteral = {};

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection, queryRunnerProvider?: QueryRunnerProvider) {
        super(connection, queryRunnerProvider);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Gets user data by a given key.
     */
    getData(key: string): any {
        return this.data[key];
    }

    /**
     * Sets value for the given key in user data.
     */
    setData(key: string, value: any) {
        this.data[key] = value;
    }

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    persist<Entity>(entity: Entity, options?: PersistOptions): Promise<Entity>;

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    persist<Entity>(targetOrEntity: Function, entity: Entity, options?: PersistOptions): Promise<Entity>;

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    persist<Entity>(targetOrEntity: string, entity: Entity, options?: PersistOptions): Promise<Entity>;

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    persist<Entity>(entities: Entity[], options?: PersistOptions): Promise<Entity[]>;

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    persist<Entity>(targetOrEntity: Function, entities: Entity[], options?: PersistOptions): Promise<Entity[]>;

    /**
     * Persists (saves) all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    persist<Entity>(targetOrEntity: string, entities: Entity[], options?: PersistOptions): Promise<Entity[]>;

    /**
     * Persists (saves) a given entity in the database.
     */
    persist<Entity>(targetOrEntity: (Entity|Entity[])|Function|string, maybeEntity?: Entity|Entity[], options?: PersistOptions): Promise<Entity|Entity[]> {
        const target = arguments.length === 2 ? maybeEntity as Entity|Entity[] : targetOrEntity as Function|string;
        const entity = arguments.length === 2 ? maybeEntity as Entity|Entity[] : targetOrEntity as Entity|Entity[];
        return Promise.resolve().then(() => { // we MUST call "fake" resolve here to make sure all properties of lazily loaded properties are resolved.
            if (typeof target === "string") {
                return this.getRepository<Entity|Entity[]>(target).persist(entity, options);
            } else {
                // todo: throw exception if constructor in target is not set
                if (target instanceof Array) {
                    if (target.length === 0)
                        return Promise.resolve(target);

                    return this.getRepository<Entity[]>(target[0].constructor).persist(entity as Entity[], options);
                } else {
                    return this.getRepository<Entity>(target.constructor).persist(entity as Entity, options);
                }
            }
        });
    }

    /**
     * Updates entity partially. Entity can be found by a given conditions.
     */
    async update<Entity>(target: Function|string, conditions: Partial<Entity>, partialEntity: DeepPartial<Entity>, options?: PersistOptions): Promise<void>;

    /**
     * Updates entity partially. Entity can be found by a given find options.
     */
    async update<Entity>(target: Function|string, findOptions: FindOneOptions<Entity>, partialEntity: DeepPartial<Entity>, options?: PersistOptions): Promise<void>;

    /**
     * Updates entity partially. Entity can be found by a given conditions.
     */
    async update<Entity>(target: Function|string, conditionsOrFindOptions: Partial<Entity>|FindOneOptions<Entity>, partialEntity: DeepPartial<Entity>, options?: PersistOptions): Promise<void> {
        return this.getRepository<Entity|Entity[]>(target as any)
            .update(conditionsOrFindOptions as any, partialEntity, options);
    }

    /**
     * Updates entity partially. Entity will be found by a given id.
     */
    async updateById<Entity>(target: Function|string, id: any, partialEntity: DeepPartial<Entity>, options?: PersistOptions): Promise<void> {
        return this.getRepository<Entity|Entity[]>(target as any)
            .updateById(id, partialEntity, options);
    }

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(entity: Entity): Promise<Entity>;

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(targetOrEntity: Function, entity: Entity, options?: RemoveOptions): Promise<Entity>;

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(targetOrEntity: string, entity: Entity, options?: RemoveOptions): Promise<Entity>;

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(entity: Entity[], options?: RemoveOptions): Promise<Entity>;

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(targetOrEntity: Function, entity: Entity[], options?: RemoveOptions): Promise<Entity[]>;

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(targetOrEntity: string, entity: Entity[], options?: RemoveOptions): Promise<Entity[]>;

    /**
     * Removes a given entity from the database.
     */
    remove<Entity>(targetOrEntity: (Entity|Entity[])|Function|string, maybeEntity?: Entity|Entity[], options?: RemoveOptions): Promise<Entity|Entity[]> {
        const target = arguments.length === 2 ? maybeEntity as Entity|Entity[] : targetOrEntity as Function|string;
        const entity = arguments.length === 2 ? maybeEntity as Entity|Entity[] : targetOrEntity as Entity|Entity[];
        if (typeof target === "string") {
            return this.getRepository<Entity|Entity[]>(target).remove(entity, options);
        } else {
            // todo: throw exception if constructor in target is not set
            if (target instanceof Array) {
                return this.getRepository<Entity[]>(target[0].constructor).remove(entity as Entity[], options);
            } else {
                return this.getRepository<Entity>(target.constructor).remove(entity as Entity, options);
            }
        }
    }

    /**
     * Removes entity by a given entity id.
     */
    async removeById(targetOrEntity: Function|string, id: any, options?: RemoveOptions): Promise<void> {
        return this.getRepository(targetOrEntity as any).removeById(id, options);
    }

    /**
     * Counts entities that match given options.
     */
    count<Entity>(entityClass: ObjectType<Entity>, options?: FindManyOptions<Entity>): Promise<number>;

    /**
     * Counts entities that match given conditions.
     */
    count<Entity>(entityClass: ObjectType<Entity>, conditions?: Partial<Entity>): Promise<number>;

    /**
     * Counts entities that match given find options or conditions.
     */
    count<Entity>(entityClass: ObjectType<Entity>, optionsOrConditions?: FindManyOptions<Entity>|Partial<Entity>): Promise<number> {
        return this.getRepository(entityClass).count(optionsOrConditions as ObjectLiteral);
    }

    /**
     * Finds entities that match given options.
     */
    find<Entity>(entityClass: ObjectType<Entity>, options?: FindManyOptions<Entity>): Promise<Entity[]>;

    /**
     * Finds entities that match given conditions.
     */
    find<Entity>(entityClass: ObjectType<Entity>, conditions?: Partial<Entity>): Promise<Entity[]>;

    /**
     * Finds entities that match given find options or conditions.
     */
    find<Entity>(entityClass: ObjectType<Entity>, optionsOrConditions?: FindManyOptions<Entity>|Partial<Entity>): Promise<Entity[]> {
        return this.getRepository(entityClass).find(optionsOrConditions as ObjectLiteral);
    }

    /**
     * Finds entities that match given find options.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    findAndCount<Entity>(entityClass: ObjectType<Entity>, options?: FindManyOptions<Entity>): Promise<[Entity[], number]>;

    /**
     * Finds entities that match given conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    findAndCount<Entity>(entityClass: ObjectType<Entity>, conditions?: Partial<Entity>): Promise<[Entity[], number]>;

    /**
     * Finds entities that match given find options and conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    findAndCount<Entity>(entityClass: ObjectType<Entity>, optionsOrConditions?: FindManyOptions<Entity>|Partial<Entity>): Promise<[Entity[], number]> {
        return this.getRepository(entityClass).findAndCount(optionsOrConditions as ObjectLiteral);
    }

    /**
     * Finds first entity that matches given find options.
     */
    findOne<Entity>(entityClass: ObjectType<Entity>, options?: FindOneOptions<Entity>): Promise<Entity|undefined>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ObjectType<Entity>, conditions?: Partial<Entity>): Promise<Entity|undefined>;

    /**
     * Finds first entity that matches given conditions.
     */
    findOne<Entity>(entityClass: ObjectType<Entity>, optionsOrConditions?: FindOneOptions<Entity>|Partial<Entity>): Promise<Entity|undefined> {
        return this.getRepository(entityClass).findOne(optionsOrConditions as ObjectLiteral);
    }

    /**
     * Finds entities with ids.
     * Optionally find options can be applied.
     */
    findByIds<Entity>(entityClass: ObjectType<Entity>, ids: any[], options?: FindManyOptions<Entity>): Promise<Entity[]>;

    /**
     * Finds entities with ids.
     * Optionally conditions can be applied.
     */
    findByIds<Entity>(entityClass: ObjectType<Entity>, ids: any[], conditions?: Partial<Entity>): Promise<Entity[]>;

    /**
     * Finds entities with ids.
     * Optionally find options or conditions can be applied.
     */
    findByIds<Entity>(entityClass: ObjectType<Entity>, ids: any[], optionsOrConditions?: FindManyOptions<Entity>|Partial<Entity>): Promise<Entity[]> {
        return this.getRepository(entityClass).findByIds(ids, optionsOrConditions as ObjectLiteral);
    }

    /**
     * Finds entity with given id.
     * Optionally find options can be applied.
     */
    findOneById<Entity>(entityClass: ObjectType<Entity>, id: any, options?: FindOneOptions<Entity>): Promise<Entity|undefined>;

    /**
     * Finds entity with given id.
     * Optionally conditions can be applied.
     */
    findOneById<Entity>(entityClass: ObjectType<Entity>, id: any, conditions?: Partial<Entity>): Promise<Entity|undefined>;

    /**
     * Finds entity with given id.
     * Optionally find options or conditions can be applied.
     */
    findOneById<Entity>(entityClass: ObjectType<Entity>, id: any, optionsOrConditions?: FindOneOptions<Entity>|Partial<Entity>): Promise<Entity|undefined> {
        return this.getRepository(entityClass).findOneById(id, optionsOrConditions as ObjectLiteral);
    }

    /**
     * Executes raw SQL query and returns raw database results.
     */
    async query(query: string, parameters?: any[]): Promise<any> {
        if (this.queryRunnerProvider && this.queryRunnerProvider.isReleased)
            throw new QueryRunnerProviderAlreadyReleasedError();

        const queryRunnerProvider = this.queryRunnerProvider || new QueryRunnerProvider(this.connection.driver);
        const queryRunner = await queryRunnerProvider.provide();

        try {
            return await queryRunner.query(query, parameters);  // await is needed here because we are using finally

        } finally {
            await queryRunnerProvider.release(queryRunner);
        }
    }

    /**
     * Wraps given function execution (and all operations made there) in a transaction.
     * All database operations must be executed using provided entity manager.
     */
    async transaction(runInTransaction: (entityManger: EntityManager) => Promise<any>): Promise<any> {
        if (this.queryRunnerProvider && this.queryRunnerProvider.isReleased)
            throw new QueryRunnerProviderAlreadyReleasedError();

        const queryRunnerProvider = this.queryRunnerProvider || new QueryRunnerProvider(this.connection.driver, true);
        const queryRunner = await queryRunnerProvider.provide();
        const transactionEntityManager = new EntityManager(this.connection, queryRunnerProvider);

        try {
            await queryRunner.beginTransaction();
            const result = await runInTransaction(transactionEntityManager);
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
     * Clears all the data from the given table (truncates/drops it).
     */
    clear<Entity>(entityClass: ObjectType<Entity>): Promise<void> {
        return this.getRepository(entityClass).clear();
    }

}