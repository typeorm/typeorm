"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseEntity = void 0;
const tslib_1 = require("tslib");
const index_1 = require("../index");
const ObjectUtils_1 = require("../util/ObjectUtils");
/**
 * Base abstract entity for all entities, used in ActiveRecord patterns.
 */
class BaseEntity {
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Checks if entity has an id.
     * If entity composite compose ids, it will check them all.
     */
    hasId() {
        return this.constructor.getRepository().hasId(this);
    }
    /**
     * Saves current entity in the database.
     * If entity does not exist in the database then inserts, otherwise updates.
     */
    save(options) {
        return this.constructor.getRepository().save(this, options);
    }
    /**
     * Removes current entity from the database.
     */
    remove(options) {
        return this.constructor.getRepository().remove(this, options);
    }
    /**
     * Records the delete date of current entity.
     */
    softRemove(options) {
        return this.constructor.getRepository().softRemove(this, options);
    }
    /**
     * Recovers a given entity in the database.
     */
    recover(options) {
        return this.constructor.getRepository().recover(this, options);
    }
    /**
     * Reloads entity data from the database.
     */
    reload() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const base = this.constructor;
            const newestEntity = yield base.getRepository().findOneOrFail(base.getId(this));
            ObjectUtils_1.ObjectUtils.assign(this, newestEntity);
        });
    }
    // -------------------------------------------------------------------------
    // Public Static Methods
    // -------------------------------------------------------------------------
    /**
     * Sets connection to be used by entity.
     */
    static useConnection(connection) {
        this.usedConnection = connection;
    }
    /**
     * Gets current entity's Repository.
     */
    static getRepository() {
        const connection = this.usedConnection || (0, index_1.getConnection)();
        return connection.getRepository(this);
    }
    /**
     * Returns object that is managed by this repository.
     * If this repository manages entity from schema,
     * then it returns a name of that schema instead.
     */
    static get target() {
        return this.getRepository().target;
    }
    /**
     * Checks entity has an id.
     * If entity composite compose ids, it will check them all.
     */
    static hasId(entity) {
        return this.getRepository().hasId(entity);
    }
    /**
     * Gets entity mixed id.
     */
    static getId(entity) {
        return this.getRepository().getId(entity);
    }
    /**
     * Creates a new query builder that can be used to build a sql query.
     */
    static createQueryBuilder(alias) {
        return this.getRepository().createQueryBuilder(alias);
    }
    /**
      * Creates a new entity instance and copies all entity properties from this object into a new entity.
      * Note that it copies only properties that present in entity schema.
      */
    static create(entityOrEntities) {
        return this.getRepository().create(entityOrEntities);
    }
    /**
     * Merges multiple entities (or entity-like objects) into a given entity.
     */
    static merge(mergeIntoEntity, ...entityLikes) {
        return this.getRepository().merge(mergeIntoEntity, ...entityLikes);
    }
    /**
     * Creates a new entity from the given plain javascript object. If entity already exist in the database, then
     * it loads it (and everything related to it), replaces all values with the new ones from the given object
     * and returns this new entity. This new entity is actually a loaded from the db entity with all properties
     * replaced from the new object.
     *
     * Note that given entity-like object must have an entity id / primary key to find entity by.
     * Returns undefined if entity with given id was not found.
     */
    static preload(entityLike) {
        return this.getRepository().preload(entityLike);
    }
    /**
     * Saves one or many given entities.
     */
    static save(entityOrEntities, options) {
        return this.getRepository().save(entityOrEntities, options);
    }
    /**
     * Removes one or many given entities.
     */
    static remove(entityOrEntities, options) {
        return this.getRepository().remove(entityOrEntities, options);
    }
    /**
     * Records the delete date of one or many given entities.
     */
    static softRemove(entityOrEntities, options) {
        return this.getRepository().softRemove(entityOrEntities, options);
    }
    /**
     * Inserts a given entity into the database.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient INSERT query.
     * Does not check if entity exist in the database, so query will fail if duplicate entity is being inserted.
     */
    static insert(entity, options) {
        return this.getRepository().insert(entity, options);
    }
    /**
     * Updates entity partially. Entity can be found by a given conditions.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient UPDATE query.
     * Does not check if entity exist in the database.
     */
    static update(criteria, partialEntity, options) {
        return this.getRepository().update(criteria, partialEntity, options);
    }
    /**
     * Deletes entities by a given criteria.
     * Unlike remove method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient DELETE query.
     * Does not check if entity exist in the database.
     */
    static delete(criteria, options) {
        return this.getRepository().delete(criteria, options);
    }
    /**
     * Counts entities that match given find options or conditions.
     */
    static count(optionsOrConditions) {
        return this.getRepository().count(optionsOrConditions);
    }
    /**
     * Finds entities that match given find options or conditions.
     */
    static find(optionsOrConditions) {
        return this.getRepository().find(optionsOrConditions);
    }
    /**
     * Finds entities that match given find options or conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    static findAndCount(optionsOrConditions) {
        return this.getRepository().findAndCount(optionsOrConditions);
    }
    /**
     * Finds entities by ids.
     * Optionally find options can be applied.
     */
    static findByIds(ids, optionsOrConditions) {
        return this.getRepository().findByIds(ids, optionsOrConditions);
    }
    /**
     * Finds first entity that matches given conditions.
     */
    static findOne(optionsOrConditions, maybeOptions) {
        return this.getRepository().findOne(optionsOrConditions, maybeOptions);
    }
    /**
     * Finds first entity that matches given conditions.
     */
    static findOneOrFail(optionsOrConditions, maybeOptions) {
        return this.getRepository().findOneOrFail(optionsOrConditions, maybeOptions);
    }
    /**
     * Executes a raw SQL query and returns a raw database results.
     * Raw query execution is supported only by relational databases (MongoDB is not supported).
     */
    static query(query, parameters) {
        return this.getRepository().query(query, parameters);
    }
    /**
     * Clears all the data from the given table/collection (truncates/drops it).
     */
    static clear() {
        return this.getRepository().clear();
    }
}
exports.BaseEntity = BaseEntity;
//# sourceMappingURL=BaseEntity.js.map