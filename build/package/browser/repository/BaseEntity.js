import { __awaiter, __generator, __read, __spreadArray } from "tslib";
import { getConnection } from "../index";
import { ObjectUtils } from "../util/ObjectUtils";
/**
 * Base abstract entity for all entities, used in ActiveRecord patterns.
 */
var BaseEntity = /** @class */ (function () {
    function BaseEntity() {
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Checks if entity has an id.
     * If entity composite compose ids, it will check them all.
     */
    BaseEntity.prototype.hasId = function () {
        return this.constructor.getRepository().hasId(this);
    };
    /**
     * Saves current entity in the database.
     * If entity does not exist in the database then inserts, otherwise updates.
     */
    BaseEntity.prototype.save = function (options) {
        return this.constructor.getRepository().save(this, options);
    };
    /**
     * Removes current entity from the database.
     */
    BaseEntity.prototype.remove = function (options) {
        return this.constructor.getRepository().remove(this, options);
    };
    /**
     * Records the delete date of current entity.
     */
    BaseEntity.prototype.softRemove = function (options) {
        return this.constructor.getRepository().softRemove(this, options);
    };
    /**
     * Recovers a given entity in the database.
     */
    BaseEntity.prototype.recover = function (options) {
        return this.constructor.getRepository().recover(this, options);
    };
    /**
     * Reloads entity data from the database.
     */
    BaseEntity.prototype.reload = function () {
        return __awaiter(this, void 0, void 0, function () {
            var base, newestEntity;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        base = this.constructor;
                        return [4 /*yield*/, base.getRepository().findOneOrFail(base.getId(this))];
                    case 1:
                        newestEntity = _a.sent();
                        ObjectUtils.assign(this, newestEntity);
                        return [2 /*return*/];
                }
            });
        });
    };
    // -------------------------------------------------------------------------
    // Public Static Methods
    // -------------------------------------------------------------------------
    /**
     * Sets connection to be used by entity.
     */
    BaseEntity.useConnection = function (connection) {
        this.usedConnection = connection;
    };
    /**
     * Gets current entity's Repository.
     */
    BaseEntity.getRepository = function () {
        var connection = this.usedConnection || getConnection();
        return connection.getRepository(this);
    };
    Object.defineProperty(BaseEntity, "target", {
        /**
         * Returns object that is managed by this repository.
         * If this repository manages entity from schema,
         * then it returns a name of that schema instead.
         */
        get: function () {
            return this.getRepository().target;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Checks entity has an id.
     * If entity composite compose ids, it will check them all.
     */
    BaseEntity.hasId = function (entity) {
        return this.getRepository().hasId(entity);
    };
    /**
     * Gets entity mixed id.
     */
    BaseEntity.getId = function (entity) {
        return this.getRepository().getId(entity);
    };
    /**
     * Creates a new query builder that can be used to build a sql query.
     */
    BaseEntity.createQueryBuilder = function (alias) {
        return this.getRepository().createQueryBuilder(alias);
    };
    /**
      * Creates a new entity instance and copies all entity properties from this object into a new entity.
      * Note that it copies only properties that present in entity schema.
      */
    BaseEntity.create = function (entityOrEntities) {
        return this.getRepository().create(entityOrEntities);
    };
    /**
     * Merges multiple entities (or entity-like objects) into a given entity.
     */
    BaseEntity.merge = function (mergeIntoEntity) {
        var _a;
        var entityLikes = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            entityLikes[_i - 1] = arguments[_i];
        }
        return (_a = this.getRepository()).merge.apply(_a, __spreadArray([mergeIntoEntity], __read(entityLikes)));
    };
    /**
     * Creates a new entity from the given plain javascript object. If entity already exist in the database, then
     * it loads it (and everything related to it), replaces all values with the new ones from the given object
     * and returns this new entity. This new entity is actually a loaded from the db entity with all properties
     * replaced from the new object.
     *
     * Note that given entity-like object must have an entity id / primary key to find entity by.
     * Returns undefined if entity with given id was not found.
     */
    BaseEntity.preload = function (entityLike) {
        return this.getRepository().preload(entityLike);
    };
    /**
     * Saves one or many given entities.
     */
    BaseEntity.save = function (entityOrEntities, options) {
        return this.getRepository().save(entityOrEntities, options);
    };
    /**
     * Removes one or many given entities.
     */
    BaseEntity.remove = function (entityOrEntities, options) {
        return this.getRepository().remove(entityOrEntities, options);
    };
    /**
     * Records the delete date of one or many given entities.
     */
    BaseEntity.softRemove = function (entityOrEntities, options) {
        return this.getRepository().softRemove(entityOrEntities, options);
    };
    /**
     * Inserts a given entity into the database.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient INSERT query.
     * Does not check if entity exist in the database, so query will fail if duplicate entity is being inserted.
     */
    BaseEntity.insert = function (entity, options) {
        return this.getRepository().insert(entity, options);
    };
    /**
     * Updates entity partially. Entity can be found by a given conditions.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient UPDATE query.
     * Does not check if entity exist in the database.
     */
    BaseEntity.update = function (criteria, partialEntity, options) {
        return this.getRepository().update(criteria, partialEntity, options);
    };
    /**
     * Deletes entities by a given criteria.
     * Unlike remove method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient DELETE query.
     * Does not check if entity exist in the database.
     */
    BaseEntity.delete = function (criteria, options) {
        return this.getRepository().delete(criteria, options);
    };
    /**
     * Counts entities that match given find options or conditions.
     */
    BaseEntity.count = function (optionsOrConditions) {
        return this.getRepository().count(optionsOrConditions);
    };
    /**
     * Finds entities that match given find options or conditions.
     */
    BaseEntity.find = function (optionsOrConditions) {
        return this.getRepository().find(optionsOrConditions);
    };
    /**
     * Finds entities that match given find options or conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    BaseEntity.findAndCount = function (optionsOrConditions) {
        return this.getRepository().findAndCount(optionsOrConditions);
    };
    /**
     * Finds entities by ids.
     * Optionally find options can be applied.
     */
    BaseEntity.findByIds = function (ids, optionsOrConditions) {
        return this.getRepository().findByIds(ids, optionsOrConditions);
    };
    /**
     * Finds first entity that matches given conditions.
     */
    BaseEntity.findOne = function (optionsOrConditions, maybeOptions) {
        return this.getRepository().findOne(optionsOrConditions, maybeOptions);
    };
    /**
     * Finds first entity that matches given conditions.
     */
    BaseEntity.findOneOrFail = function (optionsOrConditions, maybeOptions) {
        return this.getRepository().findOneOrFail(optionsOrConditions, maybeOptions);
    };
    /**
     * Executes a raw SQL query and returns a raw database results.
     * Raw query execution is supported only by relational databases (MongoDB is not supported).
     */
    BaseEntity.query = function (query, parameters) {
        return this.getRepository().query(query, parameters);
    };
    /**
     * Clears all the data from the given table/collection (truncates/drops it).
     */
    BaseEntity.clear = function () {
        return this.getRepository().clear();
    };
    return BaseEntity;
}());
export { BaseEntity };

//# sourceMappingURL=BaseEntity.js.map
