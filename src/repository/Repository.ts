import {EntityMetadata} from "../metadata/EntityMetadata";
import {FindManyOptions} from "../find-options/FindManyOptions";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {FindOneOptions} from "../find-options/FindOneOptions";
import {DeepPartial} from "../common/DeepPartial";
import {SaveOptions} from "./SaveOptions";
import {RemoveOptions} from "./RemoveOptions";
import {EntityManager} from "../entity-manager/EntityManager";
import {QueryRunner} from "../query-runner/QueryRunner";
import {SelectQueryBuilder} from "../query-builder/SelectQueryBuilder";

/**
 * Repository is supposed to work with your entity objects. Find entities, insert, update, delete, etc.
 */
export class Repository<Entity extends ObjectLiteral> {

    // -------------------------------------------------------------------------
    // Protected Methods Set Dynamically
    // -------------------------------------------------------------------------

    // todo: wny not to make them public?

    /**
     * Entity Manager used by this repository.
     */
    protected manager: EntityManager;

    /**
     * Entity metadata of the entity current repository manages.
     */
    protected metadata: EntityMetadata;

    /**
     * Query runner provider used for this repository.
     */
    protected queryRunner?: QueryRunner;

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
     * If entity composite compose ids, it will check them all.
     */
    hasId(entity: Entity): boolean {
        return this.manager.hasId(this.metadata.target, entity);
    }

    /**
     * Gets entity mixed id.
     */
    getId(entity: Entity): any {
        return this.manager.getId(this.metadata.target, entity);
    }

    /**
     * Creates a new query builder that can be used to build a sql query.
     */
    createQueryBuilder(alias: string, queryRunner?: QueryRunner): SelectQueryBuilder<Entity> {
        return this.manager.createQueryBuilder(this.metadata.target, alias, queryRunner || this.queryRunner);
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
        return this.manager.create<any>(this.metadata.target, plainEntityLikeOrPlainEntityLikes as any);
    }

    /**
     * Merges multiple entities (or entity-like objects) into a given entity.
     */
    merge(mergeIntoEntity: Entity, ...entityLikes: DeepPartial<Entity>[]): Entity {
        return this.manager.merge(this.metadata.target, mergeIntoEntity, ...entityLikes);
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
        return this.manager.preload(this.metadata.target, entityLike);
    }

    /**
     * Saves all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    async save(entities: Entity[], options?: SaveOptions): Promise<Entity[]>;

    /**
     * Saves a given entity in the database.
     * If entity does not exist in the database then inserts, otherwise updates.
     */
    async save(entity: Entity, options?: SaveOptions): Promise<Entity>;

    /**
     * Saves one or many given entities.
     */
    async save(entityOrEntities: Entity|Entity[], options?: SaveOptions): Promise<Entity|Entity[]> {
        return this.manager.save(this.metadata.target, entityOrEntities as any, options);
    }

    /**
     * Saves all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
    async persist(entities: Entity[], options?: SaveOptions): Promise<Entity[]>;

    /**
     * Saves a given entity in the database.
     * If entity does not exist in the database then inserts, otherwise updates.
     */
    async persist(entity: Entity, options?: SaveOptions): Promise<Entity>;

    /**
     * Saves one or many given entities.
     */
    async persist(entityOrEntities: Entity|Entity[], options?: SaveOptions): Promise<Entity|Entity[]> {
        return this.save(entityOrEntities as any, options);
    }

    /**
     * Updates entity partially. Entity can be found by a given conditions.
     */
    async update(conditions: Partial<Entity>, partialEntity: DeepPartial<Entity>, options?: SaveOptions): Promise<void>;

    /**
     * Updates entity partially. Entity can be found by a given find options.
     */
    async update(findOptions: FindOneOptions<Entity>, partialEntity: DeepPartial<Entity>, options?: SaveOptions): Promise<void>;

    /**
     * Updates entity partially. Entity can be found by a given conditions.
     */
    async update(conditionsOrFindOptions: Partial<Entity>|FindOneOptions<Entity>, partialEntity: DeepPartial<Entity>, options?: SaveOptions): Promise<void> {
        const entity = await this.findOne(conditionsOrFindOptions as any); // this is temporary, in the future can be refactored to perform better
        if (!entity)
            throw new Error(`Cannot find entity to update by a given criteria`);

        Object.assign(entity, partialEntity);
        await this.save(entity, options);
    }

    /**
     * Updates entity partially. Entity will be found by a given id.
     */
    async updateById(id: any, partialEntity: DeepPartial<Entity>, options?: SaveOptions): Promise<void> {
        return this.manager.updateById(this.metadata.target, id, partialEntity, options);
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
        return this.manager.remove(this.metadata.target, entityOrEntities as any, options);
    }

    /**
     * Removes entity by a given entity id.
     */
    async removeById(id: any, options?: RemoveOptions): Promise<void> {
        return this.manager.removeById(this.metadata.target, id, options);
    }

    /**
     * Removes entity by a given entity id.
     */
    async removeByIds(ids: any[], options?: RemoveOptions): Promise<void> {
        return this.manager.removeByIds(this.metadata.target, ids, options);
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
        return this.manager.count(this.metadata.target, optionsOrConditions as any);
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
        return this.manager.find(this.metadata.target, optionsOrConditions as any);
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
        return this.manager.findAndCount(this.metadata.target, optionsOrConditions as any);
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
        return this.manager.findByIds(this.metadata.target, ids, optionsOrConditions as any);
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
        return this.manager.findOne(this.metadata.target, optionsOrConditions as any);
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
        return this.manager.findOneById(this.metadata.target, id, optionsOrConditions as any);
    }

    /**
     * Executes a raw SQL query and returns a raw database results.
     * Raw query execution is supported only by relational databases (MongoDB is not supported).
     */
    async query(query: string, parameters?: any[]): Promise<any> {
        return this.manager.query(query, parameters);
    }

    /**
     * Clears all the data from the given table/collection (truncates/drops it).
     */
    async clear(): Promise<void> {
        return this.manager.clear(this.metadata.target);
    }

}