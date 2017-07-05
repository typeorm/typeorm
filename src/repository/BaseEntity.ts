import {Repository} from "./Repository";
import {getConnection} from "../index";
import {DeepPartial} from "../common/DeepPartial";
import {SaveOptions} from "./SaveOptions";
import {FindOneOptions} from "../find-options/FindOneOptions";
import {RemoveOptions} from "./RemoveOptions";
import {FindManyOptions} from "../find-options/FindManyOptions";
import {Connection} from "../connection/Connection";
import {ObjectType} from "../common/ObjectType";
import {SelectQueryBuilder} from "../query-builder/SelectQueryBuilder";

/**
 * Base abstract entity for all entities, used in ActiveRecord patterns.
 */
export class BaseEntity {

    // -------------------------------------------------------------------------
    // Private Static Properties
    // -------------------------------------------------------------------------

    /**
     * Connection used in all static methods of the BaseEntity.
     */
    private static usedConnection?: Connection;

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Checks if entity has an id.
     * If entity composite compose ids, it will check them all.
     */
    hasId(): boolean {
        return (this.constructor as any).getRepository().hasId(this);
    }

    /**
     * Saves current entity in the database.
     * If entity does not exist in the database then inserts, otherwise updates.
     */
    save(): Promise<this> {
        return (this.constructor as any).getRepository().save(this);
    }

    /**
     * Removes current entity from the database.
     */
    remove(): Promise<this> {
        return (this.constructor as any).getRepository().remove(this);
    }

    // -------------------------------------------------------------------------
    // Public Static Methods
    // -------------------------------------------------------------------------

    /**
     * Sets connection to be used by entity.
     */
    static useConnection(connection: Connection) {
        this.usedConnection = connection;
    }

    /**
     * Gets current entity's Repository.
     */
    static getRepository<T extends BaseEntity>(this: ObjectType<T>, ): Repository<T> {
        const connection: Connection = (this as any).usedConnection || getConnection();
        return connection.getRepository<T>(this);
    }

    /**
     * Returns object that is managed by this repository.
     * If this repository manages entity from schema,
     * then it returns a name of that schema instead.
     */
    static get target(): Function|string {
        return this.getRepository().target;
    }

    /**
     * Checks entity has an id.
     * If entity composite compose ids, it will check them all.
     */
    static hasId(entity: BaseEntity): boolean {
        return this.getRepository().hasId(entity);
    }

    /**
     * Gets entity mixed id.
     */
    static getId<T extends BaseEntity>(this: ObjectType<T>, entity: T): any {
        return (this as any).getRepository().getId(entity);
    }

    /**
     * Creates a new query builder that can be used to build a sql query.
     */
    static createQueryBuilder<T extends BaseEntity>(this: ObjectType<T>, alias: string): SelectQueryBuilder<T> {
        return (this as any).getRepository().createQueryBuilder(alias);
    }

    /**
     * Creates a new entity instance.
     */
    static create<T extends BaseEntity>(this: ObjectType<T>): T {
        return (this as any).getRepository().create();
    }

    /**
     * Merges multiple entities (or entity-like objects) into a given entity.
     */
    static merge<T extends BaseEntity>(this: ObjectType<T>, mergeIntoEntity: T, ...entityLikes: DeepPartial<T>[]): T {
        return (this as any).getRepository().merge(mergeIntoEntity, ...entityLikes);
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
    static preload<T extends BaseEntity>(this: ObjectType<T>, entityLike: DeepPartial<T>): Promise<T|undefined> {
        return (this as any).getRepository().preload(entityLike);
    }

    /**
     * Saves all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    static save<T extends BaseEntity>(this: ObjectType<T>, entities: T[], options?: SaveOptions): Promise<T[]>;

    /**
     * Saves a given entity in the database.
     * If entity does not exist in the database then inserts, otherwise updates.
     */
    static save<T extends BaseEntity>(this: ObjectType<T>, entity: T, options?: SaveOptions): Promise<T>;

    /**
     * Saves one or many given entities.
     */
    static save<T extends BaseEntity>(this: ObjectType<T>, entityOrEntities: T|T[], options?: SaveOptions): Promise<T|T[]> {
        return (this as any).getRepository().save(entityOrEntities as any, options);
    }

    /**
     * Updates entity partially. Entity can be found by a given conditions.
     */
    static update<T extends BaseEntity>(this: ObjectType<T>, conditions: Partial<T>, partialEntity: DeepPartial<T>, options?: SaveOptions): Promise<void>;

    /**
     * Updates entity partially. Entity can be found by a given find options.
     */
    static update<T extends BaseEntity>(this: ObjectType<T>, findOptions: FindOneOptions<T>, partialEntity: DeepPartial<T>, options?: SaveOptions): Promise<void>;

    /**
     * Updates entity partially. Entity can be found by a given conditions.
     */
    static update<T extends BaseEntity>(this: ObjectType<T>, conditionsOrFindOptions: Partial<T>|FindOneOptions<T>, partialEntity: DeepPartial<T>, options?: SaveOptions): Promise<void> {
        return (this as any).getRepository().update(conditionsOrFindOptions as any, partialEntity, options);
    }

    /**
     * Updates entity partially. Entity will be found by a given id.
     */
    static updateById<T extends BaseEntity>(this: ObjectType<T>, id: any, partialEntity: DeepPartial<T>, options?: SaveOptions): Promise<void> {
        return (this as any).getRepository().updateById(id, partialEntity, options);
    }

    /**
     * Removes a given entities from the database.
     */
    static remove<T extends BaseEntity>(this: ObjectType<T>, entities: T[], options?: RemoveOptions): Promise<T[]>;

    /**
     * Removes a given entity from the database.
     */
    static remove<T extends BaseEntity>(this: ObjectType<T>, entity: T, options?: RemoveOptions): Promise<T>;

    /**
     * Removes one or many given entities.
     */
    static remove<T extends BaseEntity>(this: ObjectType<T>, entityOrEntities: T|T[], options?: RemoveOptions): Promise<T|T[]> {
        return (this as any).getRepository().remove(entityOrEntities as any, options);
    }

    /**
     * Removes entity by a given entity id.
     */
    static removeById<T extends BaseEntity>(this: ObjectType<T>, id: any, options?: RemoveOptions): Promise<void> {
        return (this as any).getRepository().removeById(id, options);
    }

    /**
     * Counts entities that match given options.
     */
    static count<T extends BaseEntity>(this: ObjectType<T>, options?: FindManyOptions<T>): Promise<number>;

    /**
     * Counts entities that match given conditions.
     */
    static count<T extends BaseEntity>(this: ObjectType<T>, conditions?: DeepPartial<T>): Promise<number>;

    /**
     * Counts entities that match given find options or conditions.
     */
    static count<T extends BaseEntity>(this: ObjectType<T>, optionsOrConditions?: FindManyOptions<T>|DeepPartial<T>): Promise<number> {
        return (this as any).getRepository().count(optionsOrConditions as any);
    }

    /**
     * Finds entities that match given options.
     */
    static find<T extends BaseEntity>(this: ObjectType<T>, options?: FindManyOptions<T>): Promise<T[]>;

    /**
     * Finds entities that match given conditions.
     */
    static find<T extends BaseEntity>(this: ObjectType<T>, conditions?: DeepPartial<T>): Promise<T[]>;

    /**
     * Finds entities that match given find options or conditions.
     */
    static find<T extends BaseEntity>(this: ObjectType<T>, optionsOrConditions?: FindManyOptions<T>|DeepPartial<T>): Promise<T[]> {
        return (this as any).getRepository().find(optionsOrConditions as any);
    }

    /**
     * Finds entities that match given find options.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    static findAndCount<T extends BaseEntity>(this: ObjectType<T>, options?: FindManyOptions<T>): Promise<[ T[], number ]>;

    /**
     * Finds entities that match given conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    static findAndCount<T extends BaseEntity>(this: ObjectType<T>, conditions?: DeepPartial<T>): Promise<[ T[], number ]>;

    /**
     * Finds entities that match given find options or conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    static findAndCount<T extends BaseEntity>(this: ObjectType<T>, optionsOrConditions?: FindManyOptions<T>|DeepPartial<T>): Promise<[ T[], number ]> {
        return (this as any).getRepository().findAndCount(optionsOrConditions as any);
    }

    /**
     * Finds entities by ids.
     * Optionally find options can be applied.
     */
    static findByIds<T extends BaseEntity>(this: ObjectType<T>, ids: any[], options?: FindManyOptions<T>): Promise<T[]>;

    /**
     * Finds entities by ids.
     * Optionally conditions can be applied.
     */
    static findByIds<T extends BaseEntity>(this: ObjectType<T>, ids: any[], conditions?: DeepPartial<T>): Promise<T[]>;

    /**
     * Finds entities by ids.
     * Optionally find options can be applied.
     */
    static findByIds<T extends BaseEntity>(this: ObjectType<T>, ids: any[], optionsOrConditions?: FindManyOptions<T>|DeepPartial<T>): Promise<T[]> {
        return (this as any).getRepository().findByIds(ids, optionsOrConditions as any);
    }

    /**
     * Finds first entity that matches given options.
     */
    static findOne<T extends BaseEntity>(this: ObjectType<T>, options?: FindOneOptions<T>): Promise<T|undefined>;

    /**
     * Finds first entity that matches given conditions.
     */
    static findOne<T extends BaseEntity>(this: ObjectType<T>, conditions?: DeepPartial<T>): Promise<T|undefined>;

    /**
     * Finds first entity that matches given conditions.
     */
    static findOne<T extends BaseEntity>(this: ObjectType<T>, optionsOrConditions?: FindOneOptions<T>|DeepPartial<T>): Promise<T|undefined> {
        return (this as any).getRepository().findOne(optionsOrConditions as any);
    }

    /**
     * Finds entity by given id.
     * Optionally find options can be applied.
     */
    static findOneById<T extends BaseEntity>(this: ObjectType<T>, id: any, options?: FindOneOptions<T>): Promise<T|undefined>;

    /**
     * Finds entity by given id.
     * Optionally conditions can be applied.
     */
    static findOneById<T extends BaseEntity>(this: ObjectType<T>, id: any, conditions?: DeepPartial<T>): Promise<T|undefined>;

    /**
     * Finds entity by given id.
     * Optionally find options or conditions can be applied.
     */
    static findOneById<T extends BaseEntity>(this: ObjectType<T>, id: any, optionsOrConditions?: FindOneOptions<T>|DeepPartial<T>): Promise<T|undefined> {
        return (this as any).getRepository().findOneById(id, optionsOrConditions as any);
    }

    /**
     * Executes a raw SQL query and returns a raw database results.
     * Raw query execution is supported only by relational databases (MongoDB is not supported).
     */
    static query<T extends BaseEntity>(this: ObjectType<T>, query: string, parameters?: any[]): Promise<any> {
        return (this as any).getRepository().query(query, parameters);
    }

    /**
     * Clears all the data from the given table/collection (truncates/drops it).
     */
    static clear<T extends BaseEntity>(this: ObjectType<T>, ): Promise<void> {
        return (this as any).getRepository().clear();
    }

}