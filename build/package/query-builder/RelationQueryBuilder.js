"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationQueryBuilder = void 0;
var tslib_1 = require("tslib");
var QueryBuilder_1 = require("./QueryBuilder");
var RelationUpdater_1 = require("./RelationUpdater");
var RelationRemover_1 = require("./RelationRemover");
/**
 * Allows to work with entity relations and perform specific operations with those relations.
 *
 * todo: add transactions everywhere
 */
var RelationQueryBuilder = /** @class */ (function (_super) {
    tslib_1.__extends(RelationQueryBuilder, _super);
    function RelationQueryBuilder() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------
    /**
     * Gets generated sql query without parameters being replaced.
     */
    RelationQueryBuilder.prototype.getQuery = function () {
        return "";
    };
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Sets entity (target) which relations will be updated.
     */
    RelationQueryBuilder.prototype.of = function (entity) {
        this.expressionMap.of = entity;
        return this;
    };
    /**
     * Sets entity relation's value.
     * Value can be entity, entity id or entity id map (if entity has composite ids).
     * Works only for many-to-one and one-to-one relations.
     * For many-to-many and one-to-many relations use #add and #remove methods instead.
     */
    RelationQueryBuilder.prototype.set = function (value) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var relation, updater;
            return tslib_1.__generator(this, function (_a) {
                relation = this.expressionMap.relationMetadata;
                if (!this.expressionMap.of) // todo: move this check before relation query builder creation?
                    throw new Error("Entity whose relation needs to be set is not set. Use .of method to define whose relation you want to set.");
                if (relation.isManyToMany || relation.isOneToMany)
                    throw new Error("Set operation is only supported for many-to-one and one-to-one relations. " +
                        ("However given \"" + relation.propertyPath + "\" has " + relation.relationType + " relation. ") +
                        "Use .add() method instead.");
                // if there are multiple join columns then user must send id map as "value" argument. check if he really did it
                if (relation.joinColumns &&
                    relation.joinColumns.length > 1 &&
                    (!(value instanceof Object) || Object.keys(value).length < relation.joinColumns.length))
                    throw new Error("Value to be set into the relation must be a map of relation ids, for example: .set({ firstName: \"...\", lastName: \"...\" })");
                updater = new RelationUpdater_1.RelationUpdater(this, this.expressionMap);
                return [2 /*return*/, updater.update(value)];
            });
        });
    };
    /**
     * Adds (binds) given value to entity relation.
     * Value can be entity, entity id or entity id map (if entity has composite ids).
     * Value also can be array of entities, array of entity ids or array of entity id maps (if entity has composite ids).
     * Works only for many-to-many and one-to-many relations.
     * For many-to-one and one-to-one use #set method instead.
     */
    RelationQueryBuilder.prototype.add = function (value) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var relation, updater;
            return tslib_1.__generator(this, function (_a) {
                if (Array.isArray(value) && value.length === 0)
                    return [2 /*return*/];
                relation = this.expressionMap.relationMetadata;
                if (!this.expressionMap.of) // todo: move this check before relation query builder creation?
                    throw new Error("Entity whose relation needs to be set is not set. Use .of method to define whose relation you want to set.");
                if (relation.isManyToOne || relation.isOneToOne)
                    throw new Error("Add operation is only supported for many-to-many and one-to-many relations. " +
                        ("However given \"" + relation.propertyPath + "\" has " + relation.relationType + " relation. ") +
                        "Use .set() method instead.");
                // if there are multiple join columns then user must send id map as "value" argument. check if he really did it
                if (relation.joinColumns &&
                    relation.joinColumns.length > 1 &&
                    (!(value instanceof Object) || Object.keys(value).length < relation.joinColumns.length))
                    throw new Error("Value to be set into the relation must be a map of relation ids, for example: .set({ firstName: \"...\", lastName: \"...\" })");
                updater = new RelationUpdater_1.RelationUpdater(this, this.expressionMap);
                return [2 /*return*/, updater.update(value)];
            });
        });
    };
    /**
     * Removes (unbinds) given value from entity relation.
     * Value can be entity, entity id or entity id map (if entity has composite ids).
     * Value also can be array of entities, array of entity ids or array of entity id maps (if entity has composite ids).
     * Works only for many-to-many and one-to-many relations.
     * For many-to-one and one-to-one use #set method instead.
     */
    RelationQueryBuilder.prototype.remove = function (value) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var relation, remover;
            return tslib_1.__generator(this, function (_a) {
                if (Array.isArray(value) && value.length === 0)
                    return [2 /*return*/];
                relation = this.expressionMap.relationMetadata;
                if (!this.expressionMap.of) // todo: move this check before relation query builder creation?
                    throw new Error("Entity whose relation needs to be set is not set. Use .of method to define whose relation you want to set.");
                if (relation.isManyToOne || relation.isOneToOne)
                    throw new Error("Add operation is only supported for many-to-many and one-to-many relations. " +
                        ("However given \"" + relation.propertyPath + "\" has " + relation.relationType + " relation. ") +
                        "Use .set(null) method instead.");
                remover = new RelationRemover_1.RelationRemover(this, this.expressionMap);
                return [2 /*return*/, remover.remove(value)];
            });
        });
    };
    /**
     * Adds (binds) and removes (unbinds) given values to/from entity relation.
     * Value can be entity, entity id or entity id map (if entity has composite ids).
     * Value also can be array of entities, array of entity ids or array of entity id maps (if entity has composite ids).
     * Works only for many-to-many and one-to-many relations.
     * For many-to-one and one-to-one use #set method instead.
     */
    RelationQueryBuilder.prototype.addAndRemove = function (added, removed) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.remove(removed)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.add(added)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets entity's relation id.
    async getId(): Promise<any> {

    }*/
    /**
     * Gets entity's relation ids.
    async getIds(): Promise<any[]> {
        return [];
    }*/
    /**
     * Loads a single entity (relational) from the relation.
     * You can also provide id of relational entity to filter by.
     */
    RelationQueryBuilder.prototype.loadOne = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, this.loadMany().then(function (results) { return results[0]; })];
            });
        });
    };
    /**
     * Loads many entities (relational) from the relation.
     * You can also provide ids of relational entities to filter by.
     */
    RelationQueryBuilder.prototype.loadMany = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var of, metadata;
            return tslib_1.__generator(this, function (_a) {
                of = this.expressionMap.of;
                if (!(of instanceof Object)) {
                    metadata = this.expressionMap.mainAlias.metadata;
                    if (metadata.hasMultiplePrimaryKeys)
                        throw new Error("Cannot load entity because only one primary key was specified, however entity contains multiple primary keys");
                    of = metadata.primaryColumns[0].createValueMap(of);
                }
                return [2 /*return*/, this.connection.relationLoader.load(this.expressionMap.relationMetadata, of, this.queryRunner)];
            });
        });
    };
    return RelationQueryBuilder;
}(QueryBuilder_1.QueryBuilder));
exports.RelationQueryBuilder = RelationQueryBuilder;

//# sourceMappingURL=RelationQueryBuilder.js.map
