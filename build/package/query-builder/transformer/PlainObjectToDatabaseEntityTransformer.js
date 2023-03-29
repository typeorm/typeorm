"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlainObjectToDatabaseEntityTransformer = void 0;
var tslib_1 = require("tslib");
/**
 */
var LoadMapItem = /** @class */ (function () {
    function LoadMapItem(plainEntity, metadata, parentLoadMapItem, relation) {
        this.plainEntity = plainEntity;
        this.metadata = metadata;
        this.parentLoadMapItem = parentLoadMapItem;
        this.relation = relation;
    }
    Object.defineProperty(LoadMapItem.prototype, "target", {
        get: function () {
            return this.metadata.target;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LoadMapItem.prototype, "id", {
        get: function () {
            return this.metadata.getEntityIdMixedMap(this.plainEntity);
        },
        enumerable: false,
        configurable: true
    });
    return LoadMapItem;
}());
var LoadMap = /** @class */ (function () {
    function LoadMap() {
        this.loadMapItems = [];
    }
    Object.defineProperty(LoadMap.prototype, "mainLoadMapItem", {
        get: function () {
            return this.loadMapItems.find(function (item) { return !item.relation && !item.parentLoadMapItem; });
        },
        enumerable: false,
        configurable: true
    });
    LoadMap.prototype.addLoadMap = function (newLoadMap) {
        var item = this.loadMapItems.find(function (item) { return item.target === newLoadMap.target && item.id === newLoadMap.id; });
        if (!item)
            this.loadMapItems.push(newLoadMap);
    };
    LoadMap.prototype.fillEntities = function (target, entities) {
        var _this = this;
        entities.forEach(function (entity) {
            var item = _this.loadMapItems.find(function (loadMapItem) {
                return loadMapItem.target === target && loadMapItem.metadata.compareEntities(entity, loadMapItem.plainEntity);
            });
            if (item)
                item.entity = entity;
        });
    };
    LoadMap.prototype.groupByTargetIds = function () {
        var groups = [];
        this.loadMapItems.forEach(function (loadMapItem) {
            var group = groups.find(function (group) { return group.target === loadMapItem.target; });
            if (!group) {
                group = { target: loadMapItem.target, ids: [] };
                groups.push(group);
            }
            group.ids.push(loadMapItem.id);
        });
        return groups;
    };
    return LoadMap;
}());
/**
 * Transforms plain old javascript object
 * Entity is constructed based on its entity metadata.
 */
var PlainObjectToDatabaseEntityTransformer = /** @class */ (function () {
    function PlainObjectToDatabaseEntityTransformer(manager) {
        this.manager = manager;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    PlainObjectToDatabaseEntityTransformer.prototype.transform = function (plainObject, metadata) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var loadMap, fillLoadMap;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // if plain object does not have id then nothing to load really
                        if (!metadata.hasAllPrimaryKeys(plainObject))
                            return [2 /*return*/, Promise.reject("Given object does not have a primary column, cannot transform it to database entity.")];
                        loadMap = new LoadMap();
                        fillLoadMap = function (entity, entityMetadata, parentLoadMapItem, relation) {
                            var item = new LoadMapItem(entity, entityMetadata, parentLoadMapItem, relation);
                            loadMap.addLoadMap(item);
                            entityMetadata
                                .extractRelationValuesFromEntity(entity, metadata.relations)
                                .filter(function (value) { return value !== null && value !== undefined; })
                                .forEach(function (_a) {
                                var _b = tslib_1.__read(_a, 3), relation = _b[0], value = _b[1], inverseEntityMetadata = _b[2];
                                return fillLoadMap(value, inverseEntityMetadata, item, relation);
                            });
                        };
                        fillLoadMap(plainObject, metadata);
                        // load all entities and store them in the load map
                        return [4 /*yield*/, Promise.all(loadMap.groupByTargetIds().map(function (targetWithIds) {
                                return _this.manager
                                    .findByIds(targetWithIds.target, targetWithIds.ids)
                                    .then(function (entities) { return loadMap.fillEntities(targetWithIds.target, entities); });
                            }))];
                    case 1:
                        // load all entities and store them in the load map
                        _a.sent();
                        // go through each item in the load map and set their entity relationship using metadata stored in load map
                        loadMap.loadMapItems.forEach(function (loadMapItem) {
                            if (!loadMapItem.relation ||
                                !loadMapItem.entity ||
                                !loadMapItem.parentLoadMapItem ||
                                !loadMapItem.parentLoadMapItem.entity)
                                return;
                            if (loadMapItem.relation.isManyToMany || loadMapItem.relation.isOneToMany) {
                                if (!loadMapItem.parentLoadMapItem.entity[loadMapItem.relation.propertyName])
                                    loadMapItem.parentLoadMapItem.entity[loadMapItem.relation.propertyName] = [];
                                loadMapItem.parentLoadMapItem.entity[loadMapItem.relation.propertyName].push(loadMapItem.entity);
                            }
                            else {
                                loadMapItem.parentLoadMapItem.entity[loadMapItem.relation.propertyName] = loadMapItem.entity;
                            }
                        });
                        return [2 /*return*/, loadMap.mainLoadMapItem ? loadMap.mainLoadMapItem.entity : undefined];
                }
            });
        });
    };
    return PlainObjectToDatabaseEntityTransformer;
}());
exports.PlainObjectToDatabaseEntityTransformer = PlainObjectToDatabaseEntityTransformer;

//# sourceMappingURL=PlainObjectToDatabaseEntityTransformer.js.map
