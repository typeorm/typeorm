"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoEntityManager = void 0;
var tslib_1 = require("tslib");
var EntityManager_1 = require("./EntityManager");
var DocumentToEntityTransformer_1 = require("../query-builder/transformer/DocumentToEntityTransformer");
var FindOptionsUtils_1 = require("../find-options/FindOptionsUtils");
var PlatformTools_1 = require("../platform/PlatformTools");
var InsertResult_1 = require("../query-builder/result/InsertResult");
var UpdateResult_1 = require("../query-builder/result/UpdateResult");
var DeleteResult_1 = require("../query-builder/result/DeleteResult");
var BroadcasterResult_1 = require("../subscriber/BroadcasterResult");
/**
 * Entity manager supposed to work with any entity, automatically find its repository and call its methods,
 * whatever entity type are you passing.
 *
 * This implementation is used for MongoDB driver which has some specifics in its EntityManager.
 */
var MongoEntityManager = /** @class */ (function (_super) {
    tslib_1.__extends(MongoEntityManager, _super);
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function MongoEntityManager(connection) {
        return _super.call(this, connection) || this;
    }
    Object.defineProperty(MongoEntityManager.prototype, "mongoQueryRunner", {
        get: function () {
            return this.connection.driver.queryRunner;
        },
        enumerable: false,
        configurable: true
    });
    // -------------------------------------------------------------------------
    // Overridden Methods
    // -------------------------------------------------------------------------
    /**
     * Finds entities that match given find options or conditions.
     */
    MongoEntityManager.prototype.find = function (entityClassOrName, optionsOrConditions) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var query, cursor;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = this.convertFindManyOptionsOrConditionsToMongodbQuery(optionsOrConditions);
                        return [4 /*yield*/, this.createEntityCursor(entityClassOrName, query)];
                    case 1:
                        cursor = _a.sent();
                        if (FindOptionsUtils_1.FindOptionsUtils.isFindManyOptions(optionsOrConditions)) {
                            if (optionsOrConditions.select)
                                cursor.project(this.convertFindOptionsSelectToProjectCriteria(optionsOrConditions.select));
                            if (optionsOrConditions.skip)
                                cursor.skip(optionsOrConditions.skip);
                            if (optionsOrConditions.take)
                                cursor.limit(optionsOrConditions.take);
                            if (optionsOrConditions.order)
                                cursor.sort(this.convertFindOptionsOrderToOrderCriteria(optionsOrConditions.order));
                        }
                        return [2 /*return*/, cursor.toArray()];
                }
            });
        });
    };
    /**
     * Finds entities that match given find options or conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    MongoEntityManager.prototype.findAndCount = function (entityClassOrName, optionsOrConditions) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var query, cursor, _a, results, count;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = this.convertFindManyOptionsOrConditionsToMongodbQuery(optionsOrConditions);
                        return [4 /*yield*/, this.createEntityCursor(entityClassOrName, query)];
                    case 1:
                        cursor = _b.sent();
                        if (FindOptionsUtils_1.FindOptionsUtils.isFindManyOptions(optionsOrConditions)) {
                            if (optionsOrConditions.select)
                                cursor.project(this.convertFindOptionsSelectToProjectCriteria(optionsOrConditions.select));
                            if (optionsOrConditions.skip)
                                cursor.skip(optionsOrConditions.skip);
                            if (optionsOrConditions.take)
                                cursor.limit(optionsOrConditions.take);
                            if (optionsOrConditions.order)
                                cursor.sort(this.convertFindOptionsOrderToOrderCriteria(optionsOrConditions.order));
                        }
                        return [4 /*yield*/, Promise.all([
                                cursor.toArray(),
                                this.count(entityClassOrName, query),
                            ])];
                    case 2:
                        _a = tslib_1.__read.apply(void 0, [_b.sent(), 2]), results = _a[0], count = _a[1];
                        return [2 /*return*/, [results, parseInt(count)]];
                }
            });
        });
    };
    /**
     * Finds entities by ids.
     * Optionally find options can be applied.
     */
    MongoEntityManager.prototype.findByIds = function (entityClassOrName, ids, optionsOrConditions) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var metadata, query, objectIdInstance, cursor;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        metadata = this.connection.getMetadata(entityClassOrName);
                        query = this.convertFindManyOptionsOrConditionsToMongodbQuery(optionsOrConditions) || {};
                        objectIdInstance = PlatformTools_1.PlatformTools.load("mongodb").ObjectID;
                        query["_id"] = {
                            $in: ids.map(function (id) {
                                if (id instanceof objectIdInstance)
                                    return id;
                                return id[metadata.objectIdColumn.propertyName];
                            })
                        };
                        return [4 /*yield*/, this.createEntityCursor(entityClassOrName, query)];
                    case 1:
                        cursor = _a.sent();
                        if (FindOptionsUtils_1.FindOptionsUtils.isFindManyOptions(optionsOrConditions)) {
                            if (optionsOrConditions.select)
                                cursor.project(this.convertFindOptionsSelectToProjectCriteria(optionsOrConditions.select));
                            if (optionsOrConditions.skip)
                                cursor.skip(optionsOrConditions.skip);
                            if (optionsOrConditions.take)
                                cursor.limit(optionsOrConditions.take);
                            if (optionsOrConditions.order)
                                cursor.sort(this.convertFindOptionsOrderToOrderCriteria(optionsOrConditions.order));
                        }
                        return [4 /*yield*/, cursor.toArray()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Finds first entity that matches given conditions and/or find options.
     */
    MongoEntityManager.prototype.findOne = function (entityClassOrName, optionsOrConditions, maybeOptions) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var objectIdInstance, id, findOneOptionsOrConditions, query, cursor, result;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        objectIdInstance = PlatformTools_1.PlatformTools.load("mongodb").ObjectID;
                        id = (optionsOrConditions instanceof objectIdInstance) || typeof optionsOrConditions === "string" ? optionsOrConditions : undefined;
                        findOneOptionsOrConditions = (id ? maybeOptions : optionsOrConditions);
                        query = this.convertFindOneOptionsOrConditionsToMongodbQuery(findOneOptionsOrConditions) || {};
                        if (id) {
                            query["_id"] = (id instanceof objectIdInstance) ? id : new objectIdInstance(id);
                        }
                        return [4 /*yield*/, this.createEntityCursor(entityClassOrName, query)];
                    case 1:
                        cursor = _a.sent();
                        if (FindOptionsUtils_1.FindOptionsUtils.isFindOneOptions(findOneOptionsOrConditions)) {
                            if (findOneOptionsOrConditions.select)
                                cursor.project(this.convertFindOptionsSelectToProjectCriteria(findOneOptionsOrConditions.select));
                            if (findOneOptionsOrConditions.order)
                                cursor.sort(this.convertFindOptionsOrderToOrderCriteria(findOneOptionsOrConditions.order));
                        }
                        return [4 /*yield*/, cursor.limit(1).toArray()];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.length > 0 ? result[0] : undefined];
                }
            });
        });
    };
    /**
     * Inserts a given entity into the database.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient INSERT query.
     * Does not check if entity exist in the database, so query will fail if duplicate entity is being inserted.
     * You can execute bulk inserts using this method.
     */
    MongoEntityManager.prototype.insert = function (target, entity) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var result, _a, _b;
            var _this = this;
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        result = new InsertResult_1.InsertResult();
                        if (!Array.isArray(entity)) return [3 /*break*/, 2];
                        _a = result;
                        return [4 /*yield*/, this.insertMany(target, entity)];
                    case 1:
                        _a.raw = _c.sent();
                        Object.keys(result.raw.insertedIds).forEach(function (key) {
                            var insertedId = result.raw.insertedIds[key];
                            result.generatedMaps.push(_this.connection.driver.createGeneratedMap(_this.connection.getMetadata(target), insertedId));
                            result.identifiers.push(_this.connection.driver.createGeneratedMap(_this.connection.getMetadata(target), insertedId));
                        });
                        return [3 /*break*/, 4];
                    case 2:
                        _b = result;
                        return [4 /*yield*/, this.insertOne(target, entity)];
                    case 3:
                        _b.raw = _c.sent();
                        result.generatedMaps.push(this.connection.driver.createGeneratedMap(this.connection.getMetadata(target), result.raw.insertedId));
                        result.identifiers.push(this.connection.driver.createGeneratedMap(this.connection.getMetadata(target), result.raw.insertedId));
                        _c.label = 4;
                    case 4: return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Updates entity partially. Entity can be found by a given conditions.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient UPDATE query.
     * Does not check if entity exist in the database.
     */
    MongoEntityManager.prototype.update = function (target, criteria, partialEntity) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var metadata;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!Array.isArray(criteria)) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.all(criteria.map(function (criteriaItem) {
                                return _this.update(target, criteriaItem, partialEntity);
                            }))];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2:
                        metadata = this.connection.getMetadata(target);
                        return [4 /*yield*/, this.updateOne(target, this.convertMixedCriteria(metadata, criteria), { $set: partialEntity })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/, new UpdateResult_1.UpdateResult()];
                }
            });
        });
    };
    /**
     * Deletes entities by a given conditions.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient DELETE query.
     * Does not check if entity exist in the database.
     */
    MongoEntityManager.prototype.delete = function (target, criteria) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!Array.isArray(criteria)) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.all(criteria.map(function (criteriaItem) {
                                return _this.delete(target, criteriaItem);
                            }))];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.deleteOne(target, this.convertMixedCriteria(this.connection.getMetadata(target), criteria))];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/, new DeleteResult_1.DeleteResult()];
                }
            });
        });
    };
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     */
    MongoEntityManager.prototype.createCursor = function (entityClassOrName, query) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.cursor(metadata.tableName, query);
    };
    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     * This returns modified version of cursor that transforms each result into Entity model.
     */
    MongoEntityManager.prototype.createEntityCursor = function (entityClassOrName, query) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        var cursor = this.createCursor(entityClassOrName, query);
        this.applyEntityTransformationToCursor(metadata, cursor);
        return cursor;
    };
    /**
     * Execute an aggregation framework pipeline against the collection.
     */
    MongoEntityManager.prototype.aggregate = function (entityClassOrName, pipeline, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.aggregate(metadata.tableName, pipeline, options);
    };
    /**
     * Execute an aggregation framework pipeline against the collection.
     * This returns modified version of cursor that transforms each result into Entity model.
     */
    MongoEntityManager.prototype.aggregateEntity = function (entityClassOrName, pipeline, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        var cursor = this.mongoQueryRunner.aggregate(metadata.tableName, pipeline, options);
        this.applyEntityTransformationToCursor(metadata, cursor);
        return cursor;
    };
    /**
     * Perform a bulkWrite operation without a fluent API.
     */
    MongoEntityManager.prototype.bulkWrite = function (entityClassOrName, operations, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.bulkWrite(metadata.tableName, operations, options);
    };
    /**
     * Count number of matching documents in the db to a query.
     */
    MongoEntityManager.prototype.count = function (entityClassOrName, query, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.count(metadata.tableName, query, options);
    };
    /**
     * Creates an index on the db and collection.
     */
    MongoEntityManager.prototype.createCollectionIndex = function (entityClassOrName, fieldOrSpec, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.createCollectionIndex(metadata.tableName, fieldOrSpec, options);
    };
    /**
     * Creates multiple indexes in the collection, this method is only supported for MongoDB 2.6 or higher.
     * Earlier version of MongoDB will throw a command not supported error.
     * Index specifications are defined at http://docs.mongodb.org/manual/reference/command/createIndexes/.
     */
    MongoEntityManager.prototype.createCollectionIndexes = function (entityClassOrName, indexSpecs) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.createCollectionIndexes(metadata.tableName, indexSpecs);
    };
    /**
     * Delete multiple documents on MongoDB.
     */
    MongoEntityManager.prototype.deleteMany = function (entityClassOrName, query, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.deleteMany(metadata.tableName, query, options);
    };
    /**
     * Delete a document on MongoDB.
     */
    MongoEntityManager.prototype.deleteOne = function (entityClassOrName, query, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.deleteOne(metadata.tableName, query, options);
    };
    /**
     * The distinct command returns returns a list of distinct values for the given key across a collection.
     */
    MongoEntityManager.prototype.distinct = function (entityClassOrName, key, query, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.distinct(metadata.tableName, key, query, options);
    };
    /**
     * Drops an index from this collection.
     */
    MongoEntityManager.prototype.dropCollectionIndex = function (entityClassOrName, indexName, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.dropCollectionIndex(metadata.tableName, indexName, options);
    };
    /**
     * Drops all indexes from the collection.
     */
    MongoEntityManager.prototype.dropCollectionIndexes = function (entityClassOrName) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.dropCollectionIndexes(metadata.tableName);
    };
    /**
     * Find a document and delete it in one atomic operation, requires a write lock for the duration of the operation.
     */
    MongoEntityManager.prototype.findOneAndDelete = function (entityClassOrName, query, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.findOneAndDelete(metadata.tableName, query, options);
    };
    /**
     * Find a document and replace it in one atomic operation, requires a write lock for the duration of the operation.
     */
    MongoEntityManager.prototype.findOneAndReplace = function (entityClassOrName, query, replacement, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.findOneAndReplace(metadata.tableName, query, replacement, options);
    };
    /**
     * Find a document and update it in one atomic operation, requires a write lock for the duration of the operation.
     */
    MongoEntityManager.prototype.findOneAndUpdate = function (entityClassOrName, query, update, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.findOneAndUpdate(metadata.tableName, query, update, options);
    };
    /**
     * Execute a geo search using a geo haystack index on a collection.
     */
    MongoEntityManager.prototype.geoHaystackSearch = function (entityClassOrName, x, y, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.geoHaystackSearch(metadata.tableName, x, y, options);
    };
    /**
     * Execute the geoNear command to search for items in the collection.
     */
    MongoEntityManager.prototype.geoNear = function (entityClassOrName, x, y, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.geoNear(metadata.tableName, x, y, options);
    };
    /**
     * Run a group command across a collection.
     */
    MongoEntityManager.prototype.group = function (entityClassOrName, keys, condition, initial, reduce, finalize, command, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.group(metadata.tableName, keys, condition, initial, reduce, finalize, command, options);
    };
    /**
     * Retrieve all the indexes on the collection.
     */
    MongoEntityManager.prototype.collectionIndexes = function (entityClassOrName) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.collectionIndexes(metadata.tableName);
    };
    /**
     * Retrieve all the indexes on the collection.
     */
    MongoEntityManager.prototype.collectionIndexExists = function (entityClassOrName, indexes) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.collectionIndexExists(metadata.tableName, indexes);
    };
    /**
     * Retrieves this collections index info.
     */
    MongoEntityManager.prototype.collectionIndexInformation = function (entityClassOrName, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.collectionIndexInformation(metadata.tableName, options);
    };
    /**
     * Initiate an In order bulk write operation, operations will be serially executed in the order they are added, creating a new operation for each switch in types.
     */
    MongoEntityManager.prototype.initializeOrderedBulkOp = function (entityClassOrName, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.initializeOrderedBulkOp(metadata.tableName, options);
    };
    /**
     * Initiate a Out of order batch write operation. All operations will be buffered into insert/update/remove commands executed out of order.
     */
    MongoEntityManager.prototype.initializeUnorderedBulkOp = function (entityClassOrName, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.initializeUnorderedBulkOp(metadata.tableName, options);
    };
    /**
     * Inserts an array of documents into MongoDB.
     */
    MongoEntityManager.prototype.insertMany = function (entityClassOrName, docs, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.insertMany(metadata.tableName, docs, options);
    };
    /**
     * Inserts a single document into MongoDB.
     */
    MongoEntityManager.prototype.insertOne = function (entityClassOrName, doc, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.insertOne(metadata.tableName, doc, options);
    };
    /**
     * Returns if the collection is a capped collection.
     */
    MongoEntityManager.prototype.isCapped = function (entityClassOrName) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.isCapped(metadata.tableName);
    };
    /**
     * Get the list of all indexes information for the collection.
     */
    MongoEntityManager.prototype.listCollectionIndexes = function (entityClassOrName, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.listCollectionIndexes(metadata.tableName, options);
    };
    /**
     * Run Map Reduce across a collection. Be aware that the inline option for out will return an array of results not a collection.
     */
    MongoEntityManager.prototype.mapReduce = function (entityClassOrName, map, reduce, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.mapReduce(metadata.tableName, map, reduce, options);
    };
    /**
     * Return N number of parallel cursors for a collection allowing parallel reading of entire collection.
     * There are no ordering guarantees for returned results.
     */
    MongoEntityManager.prototype.parallelCollectionScan = function (entityClassOrName, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.parallelCollectionScan(metadata.tableName, options);
    };
    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    MongoEntityManager.prototype.reIndex = function (entityClassOrName) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.reIndex(metadata.tableName);
    };
    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    MongoEntityManager.prototype.rename = function (entityClassOrName, newName, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.rename(metadata.tableName, newName, options);
    };
    /**
     * Replace a document on MongoDB.
     */
    MongoEntityManager.prototype.replaceOne = function (entityClassOrName, query, doc, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.replaceOne(metadata.tableName, query, doc, options);
    };
    /**
     * Get all the collection statistics.
     */
    MongoEntityManager.prototype.stats = function (entityClassOrName, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.stats(metadata.tableName, options);
    };
    MongoEntityManager.prototype.watch = function (entityClassOrName, pipeline, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.watch(metadata.tableName, pipeline, options);
    };
    /**
     * Update multiple documents on MongoDB.
     */
    MongoEntityManager.prototype.updateMany = function (entityClassOrName, query, update, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.updateMany(metadata.tableName, query, update, options);
    };
    /**
     * Update a single document on MongoDB.
     */
    MongoEntityManager.prototype.updateOne = function (entityClassOrName, query, update, options) {
        var metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.updateOne(metadata.tableName, query, update, options);
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Converts FindManyOptions to mongodb query.
     */
    MongoEntityManager.prototype.convertFindManyOptionsOrConditionsToMongodbQuery = function (optionsOrConditions) {
        if (!optionsOrConditions)
            return undefined;
        if (FindOptionsUtils_1.FindOptionsUtils.isFindManyOptions(optionsOrConditions))
            // If where condition is passed as a string which contains sql we have to ignore
            // as mongo is not a sql database
            return typeof optionsOrConditions.where === "string"
                ? {}
                : optionsOrConditions.where;
        return optionsOrConditions;
    };
    /**
     * Converts FindOneOptions to mongodb query.
     */
    MongoEntityManager.prototype.convertFindOneOptionsOrConditionsToMongodbQuery = function (optionsOrConditions) {
        if (!optionsOrConditions)
            return undefined;
        if (FindOptionsUtils_1.FindOptionsUtils.isFindOneOptions(optionsOrConditions))
            // If where condition is passed as a string which contains sql we have to ignore
            // as mongo is not a sql database
            return typeof optionsOrConditions.where === "string"
                ? {}
                : optionsOrConditions.where;
        return optionsOrConditions;
    };
    /**
     * Converts FindOptions into mongodb order by criteria.
     */
    MongoEntityManager.prototype.convertFindOptionsOrderToOrderCriteria = function (order) {
        return Object.keys(order).reduce(function (orderCriteria, key) {
            switch (order[key]) {
                case "DESC":
                    orderCriteria[key] = -1;
                    break;
                case "ASC":
                    orderCriteria[key] = 1;
                    break;
                default:
                    orderCriteria[key] = order[key];
            }
            return orderCriteria;
        }, {});
    };
    /**
     * Converts FindOptions into mongodb select by criteria.
     */
    MongoEntityManager.prototype.convertFindOptionsSelectToProjectCriteria = function (selects) {
        return selects.reduce(function (projectCriteria, key) {
            projectCriteria[key] = 1;
            return projectCriteria;
        }, {});
    };
    /**
     * Ensures given id is an id for query.
     */
    MongoEntityManager.prototype.convertMixedCriteria = function (metadata, idMap) {
        var objectIdInstance = PlatformTools_1.PlatformTools.load("mongodb").ObjectID;
        // check first if it's ObjectId compatible:
        // string, number, Buffer, ObjectId or ObjectId-like
        if (objectIdInstance.isValid(idMap)) {
            return {
                "_id": new objectIdInstance(idMap)
            };
        }
        // if it's some other type of object build a query from the columns
        // this check needs to be after the ObjectId check, because a valid ObjectId is also an Object instance
        if (idMap instanceof Object) {
            return metadata.columns.reduce(function (query, column) {
                var columnValue = column.getEntityValue(idMap);
                if (columnValue !== undefined)
                    query[column.databasePath] = columnValue;
                return query;
            }, {});
        }
        // last resort: try to convert it to an ObjectID anyway
        // most likely it will fail, but we want to be backwards compatible and keep the same thrown Errors.
        // it can still pass with null/undefined
        return {
            "_id": new objectIdInstance(idMap)
        };
    };
    /**
     * Overrides cursor's toArray and next methods to convert results to entity automatically.
     */
    MongoEntityManager.prototype.applyEntityTransformationToCursor = function (metadata, cursor) {
        var ParentCursor = PlatformTools_1.PlatformTools.load("mongodb").Cursor;
        var queryRunner = this.mongoQueryRunner;
        cursor.toArray = function (callback) {
            if (callback) {
                ParentCursor.prototype.toArray.call(this, function (error, results) {
                    if (error) {
                        callback(error, results);
                        return;
                    }
                    var transformer = new DocumentToEntityTransformer_1.DocumentToEntityTransformer();
                    var entities = transformer.transformAll(results, metadata);
                    // broadcast "load" events
                    var broadcastResult = new BroadcasterResult_1.BroadcasterResult();
                    queryRunner.broadcaster.broadcastLoadEventsForAll(broadcastResult, metadata, entities);
                    Promise.all(broadcastResult.promises).then(function () { return callback(error, entities); });
                });
            }
            else {
                return ParentCursor.prototype.toArray.call(this).then(function (results) {
                    var transformer = new DocumentToEntityTransformer_1.DocumentToEntityTransformer();
                    var entities = transformer.transformAll(results, metadata);
                    // broadcast "load" events
                    var broadcastResult = new BroadcasterResult_1.BroadcasterResult();
                    queryRunner.broadcaster.broadcastLoadEventsForAll(broadcastResult, metadata, entities);
                    return Promise.all(broadcastResult.promises).then(function () { return entities; });
                });
            }
        };
        cursor.next = function (callback) {
            if (callback) {
                ParentCursor.prototype.next.call(this, function (error, result) {
                    if (error || !result) {
                        callback(error, result);
                        return;
                    }
                    var transformer = new DocumentToEntityTransformer_1.DocumentToEntityTransformer();
                    var entity = transformer.transform(result, metadata);
                    // broadcast "load" events
                    var broadcastResult = new BroadcasterResult_1.BroadcasterResult();
                    queryRunner.broadcaster.broadcastLoadEventsForAll(broadcastResult, metadata, [entity]);
                    Promise.all(broadcastResult.promises).then(function () { return callback(error, entity); });
                });
            }
            else {
                return ParentCursor.prototype.next.call(this).then(function (result) {
                    if (!result)
                        return result;
                    var transformer = new DocumentToEntityTransformer_1.DocumentToEntityTransformer();
                    var entity = transformer.transform(result, metadata);
                    // broadcast "load" events
                    var broadcastResult = new BroadcasterResult_1.BroadcasterResult();
                    queryRunner.broadcaster.broadcastLoadEventsForAll(broadcastResult, metadata, [entity]);
                    return Promise.all(broadcastResult.promises).then(function () { return entity; });
                });
            }
        };
    };
    return MongoEntityManager;
}(EntityManager_1.EntityManager));
exports.MongoEntityManager = MongoEntityManager;

//# sourceMappingURL=MongoEntityManager.js.map
