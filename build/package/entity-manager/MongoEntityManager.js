"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoEntityManager = void 0;
const EntityManager_1 = require("./EntityManager");
const DocumentToEntityTransformer_1 = require("../query-builder/transformer/DocumentToEntityTransformer");
const FindOptionsUtils_1 = require("../find-options/FindOptionsUtils");
const PlatformTools_1 = require("../platform/PlatformTools");
const InsertResult_1 = require("../query-builder/result/InsertResult");
const UpdateResult_1 = require("../query-builder/result/UpdateResult");
const DeleteResult_1 = require("../query-builder/result/DeleteResult");
const ObjectUtils_1 = require("../util/ObjectUtils");
/**
 * Entity manager supposed to work with any entity, automatically find its repository and call its methods,
 * whatever entity type are you passing.
 *
 * This implementation is used for MongoDB driver which has some specifics in its EntityManager.
 */
class MongoEntityManager extends EntityManager_1.EntityManager {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(connection) {
        super(connection);
        this["@instanceof"] = Symbol.for("MongoEntityManager");
    }
    get mongoQueryRunner() {
        return this.connection.driver
            .queryRunner;
    }
    // -------------------------------------------------------------------------
    // Overridden Methods
    // -------------------------------------------------------------------------
    /**
     * Finds entities that match given find options.
     */
    async find(entityClassOrName, options) {
        return this.executeFind(entityClassOrName, options);
    }
    /**
     * Finds entities that match given conditions.
     */
    async findBy(entityClassOrName, where) {
        return this.executeFind(entityClassOrName, where);
    }
    /**
     * Finds entities that match given find options.
     */
    async findAndCount(entityClassOrName, options) {
        return this.executeFindAndCount(entityClassOrName, options);
    }
    /**
     * Finds entities that match given where conditions.
     */
    async findAndCountBy(entityClassOrName, where) {
        return this.executeFindAndCount(entityClassOrName, where);
    }
    /**
     * Finds entities by ids.
     * Optionally find options can be applied.
     *
     * @deprecated use `findBy` method instead.
     */
    async findByIds(entityClassOrName, ids, optionsOrConditions) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        const query = this.convertFindManyOptionsOrConditionsToMongodbQuery(optionsOrConditions) || {};
        const objectIdInstance = PlatformTools_1.PlatformTools.load("mongodb").ObjectID;
        query["_id"] = {
            $in: ids.map((id) => {
                if (typeof id === "string") {
                    return new objectIdInstance(id);
                }
                if (ObjectUtils_1.ObjectUtils.isObject(id)) {
                    if (id instanceof objectIdInstance) {
                        return id;
                    }
                    const propertyName = metadata.objectIdColumn.propertyName;
                    if (id[propertyName] instanceof objectIdInstance) {
                        return id[propertyName];
                    }
                }
            }),
        };
        const cursor = await this.createEntityCursor(entityClassOrName, query);
        const deleteDateColumn = this.connection.getMetadata(entityClassOrName).deleteDateColumn;
        if (FindOptionsUtils_1.FindOptionsUtils.isFindManyOptions(optionsOrConditions)) {
            if (optionsOrConditions.select)
                cursor.project(this.convertFindOptionsSelectToProjectCriteria(optionsOrConditions.select));
            if (optionsOrConditions.skip)
                cursor.skip(optionsOrConditions.skip);
            if (optionsOrConditions.take)
                cursor.limit(optionsOrConditions.take);
            if (optionsOrConditions.order)
                cursor.sort(this.convertFindOptionsOrderToOrderCriteria(optionsOrConditions.order));
            if (deleteDateColumn && !optionsOrConditions.withDeleted) {
                this.filterSoftDeleted(cursor, deleteDateColumn);
            }
        }
        else if (deleteDateColumn) {
            this.filterSoftDeleted(cursor, deleteDateColumn);
        }
        return await cursor.toArray();
    }
    /**
     * Finds first entity that matches given find options.
     */
    async findOne(entityClassOrName, options) {
        return this.executeFindOne(entityClassOrName, options);
    }
    /**
     * Finds first entity that matches given WHERE conditions.
     */
    async findOneBy(entityClassOrName, where) {
        return this.executeFindOne(entityClassOrName, where);
    }
    /**
     * Finds entity that matches given id.
     *
     * @deprecated use `findOneBy` method instead in conjunction with `In` operator, for example:
     *
     * .findOneBy({
     *     id: 1 // where "id" is your primary column name
     * })
     */
    async findOneById(entityClassOrName, id) {
        return this.executeFindOne(entityClassOrName, id);
    }
    /**
     * Inserts a given entity into the database.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient INSERT query.
     * Does not check if entity exist in the database, so query will fail if duplicate entity is being inserted.
     * You can execute bulk inserts using this method.
     */
    async insert(target, entity) {
        // todo: convert entity to its database name
        const result = new InsertResult_1.InsertResult();
        if (Array.isArray(entity)) {
            result.raw = await this.insertMany(target, entity);
            Object.keys(result.raw.insertedIds).forEach((key) => {
                let insertedId = result.raw.insertedIds[key];
                result.generatedMaps.push(this.connection.driver.createGeneratedMap(this.connection.getMetadata(target), insertedId));
                result.identifiers.push(this.connection.driver.createGeneratedMap(this.connection.getMetadata(target), insertedId));
            });
        }
        else {
            result.raw = await this.insertOne(target, entity);
            result.generatedMaps.push(this.connection.driver.createGeneratedMap(this.connection.getMetadata(target), result.raw.insertedId));
            result.identifiers.push(this.connection.driver.createGeneratedMap(this.connection.getMetadata(target), result.raw.insertedId));
        }
        return result;
    }
    /**
     * Updates entity partially. Entity can be found by a given conditions.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient UPDATE query.
     * Does not check if entity exist in the database.
     */
    async update(target, criteria, partialEntity) {
        const result = new UpdateResult_1.UpdateResult();
        if (Array.isArray(criteria)) {
            const updateResults = await Promise.all(criteria.map((criteriaItem) => {
                return this.update(target, criteriaItem, partialEntity);
            }));
            result.raw = updateResults.map((r) => r.raw);
            result.affected = updateResults
                .map((r) => r.affected || 0)
                .reduce((c, r) => c + r, 0);
            result.generatedMaps = updateResults.reduce((c, r) => c.concat(r.generatedMaps), []);
        }
        else {
            const metadata = this.connection.getMetadata(target);
            const mongoResult = await this.updateMany(target, this.convertMixedCriteria(metadata, criteria), { $set: partialEntity });
            result.raw = mongoResult;
            result.affected = mongoResult.modifiedCount;
        }
        return result;
    }
    /**
     * Deletes entities by a given conditions.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient DELETE query.
     * Does not check if entity exist in the database.
     */
    async delete(target, criteria) {
        const result = new DeleteResult_1.DeleteResult();
        if (Array.isArray(criteria)) {
            const deleteResults = await Promise.all(criteria.map((criteriaItem) => {
                return this.delete(target, criteriaItem);
            }));
            result.raw = deleteResults.map((r) => r.raw);
            result.affected = deleteResults
                .map((r) => r.affected || 0)
                .reduce((c, r) => c + r, 0);
        }
        else {
            const mongoResult = await this.deleteMany(target, this.convertMixedCriteria(this.connection.getMetadata(target), criteria));
            result.raw = mongoResult;
            result.affected = mongoResult.deletedCount;
        }
        return result;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     */
    createCursor(entityClassOrName, query) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.cursor(metadata.tableName, query);
    }
    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     * This returns modified version of cursor that transforms each result into Entity model.
     */
    createEntityCursor(entityClassOrName, query) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        const cursor = this.createCursor(entityClassOrName, query);
        this.applyEntityTransformationToCursor(metadata, cursor);
        return cursor;
    }
    /**
     * Execute an aggregation framework pipeline against the collection.
     */
    aggregate(entityClassOrName, pipeline, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.aggregate(metadata.tableName, pipeline, options);
    }
    /**
     * Execute an aggregation framework pipeline against the collection.
     * This returns modified version of cursor that transforms each result into Entity model.
     */
    aggregateEntity(entityClassOrName, pipeline, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        const cursor = this.mongoQueryRunner.aggregate(metadata.tableName, pipeline, options);
        this.applyEntityTransformationToCursor(metadata, cursor);
        return cursor;
    }
    /**
     * Perform a bulkWrite operation without a fluent API.
     */
    bulkWrite(entityClassOrName, operations, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.bulkWrite(metadata.tableName, operations, options);
    }
    /**
     * Count number of matching documents in the db to a query.
     */
    count(entityClassOrName, query, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.count(metadata.tableName, query, options);
    }
    /**
     * Count number of matching documents in the db to a query.
     */
    countBy(entityClassOrName, query, options) {
        return this.count(entityClassOrName, query, options);
    }
    /**
     * Creates an index on the db and collection.
     */
    createCollectionIndex(entityClassOrName, fieldOrSpec, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.createCollectionIndex(metadata.tableName, fieldOrSpec, options);
    }
    /**
     * Creates multiple indexes in the collection, this method is only supported for MongoDB 2.6 or higher.
     * Earlier version of MongoDB will throw a command not supported error.
     * Index specifications are defined at http://docs.mongodb.org/manual/reference/command/createIndexes/.
     */
    createCollectionIndexes(entityClassOrName, indexSpecs) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.createCollectionIndexes(metadata.tableName, indexSpecs);
    }
    /**
     * Delete multiple documents on MongoDB.
     */
    deleteMany(entityClassOrName, query, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.deleteMany(metadata.tableName, query, options);
    }
    /**
     * Delete a document on MongoDB.
     */
    deleteOne(entityClassOrName, query, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.deleteOne(metadata.tableName, query, options);
    }
    /**
     * The distinct command returns returns a list of distinct values for the given key across a collection.
     */
    distinct(entityClassOrName, key, query, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.distinct(metadata.tableName, key, query, options);
    }
    /**
     * Drops an index from this collection.
     */
    dropCollectionIndex(entityClassOrName, indexName, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.dropCollectionIndex(metadata.tableName, indexName, options);
    }
    /**
     * Drops all indexes from the collection.
     */
    dropCollectionIndexes(entityClassOrName) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.dropCollectionIndexes(metadata.tableName);
    }
    /**
     * Find a document and delete it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndDelete(entityClassOrName, query, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.findOneAndDelete(metadata.tableName, query, options);
    }
    /**
     * Find a document and replace it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndReplace(entityClassOrName, query, replacement, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.findOneAndReplace(metadata.tableName, query, replacement, options);
    }
    /**
     * Find a document and update it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndUpdate(entityClassOrName, query, update, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.findOneAndUpdate(metadata.tableName, query, update, options);
    }
    /**
     * Execute a geo search using a geo haystack index on a collection.
     */
    geoHaystackSearch(entityClassOrName, x, y, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.geoHaystackSearch(metadata.tableName, x, y, options);
    }
    /**
     * Execute the geoNear command to search for items in the collection.
     */
    geoNear(entityClassOrName, x, y, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.geoNear(metadata.tableName, x, y, options);
    }
    /**
     * Run a group command across a collection.
     */
    group(entityClassOrName, keys, condition, initial, reduce, finalize, command, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.group(metadata.tableName, keys, condition, initial, reduce, finalize, command, options);
    }
    /**
     * Retrieve all the indexes on the collection.
     */
    collectionIndexes(entityClassOrName) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.collectionIndexes(metadata.tableName);
    }
    /**
     * Retrieve all the indexes on the collection.
     */
    collectionIndexExists(entityClassOrName, indexes) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.collectionIndexExists(metadata.tableName, indexes);
    }
    /**
     * Retrieves this collections index info.
     */
    collectionIndexInformation(entityClassOrName, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.collectionIndexInformation(metadata.tableName, options);
    }
    /**
     * Initiate an In order bulk write operation, operations will be serially executed in the order they are added, creating a new operation for each switch in types.
     */
    initializeOrderedBulkOp(entityClassOrName, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.initializeOrderedBulkOp(metadata.tableName, options);
    }
    /**
     * Initiate a Out of order batch write operation. All operations will be buffered into insert/update/remove commands executed out of order.
     */
    initializeUnorderedBulkOp(entityClassOrName, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.initializeUnorderedBulkOp(metadata.tableName, options);
    }
    /**
     * Inserts an array of documents into MongoDB.
     */
    insertMany(entityClassOrName, docs, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.insertMany(metadata.tableName, docs, options);
    }
    /**
     * Inserts a single document into MongoDB.
     */
    insertOne(entityClassOrName, doc, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.insertOne(metadata.tableName, doc, options);
    }
    /**
     * Returns if the collection is a capped collection.
     */
    isCapped(entityClassOrName) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.isCapped(metadata.tableName);
    }
    /**
     * Get the list of all indexes information for the collection.
     */
    listCollectionIndexes(entityClassOrName, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.listCollectionIndexes(metadata.tableName, options);
    }
    /**
     * Run Map Reduce across a collection. Be aware that the inline option for out will return an array of results not a collection.
     */
    mapReduce(entityClassOrName, map, reduce, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.mapReduce(metadata.tableName, map, reduce, options);
    }
    /**
     * Return N number of parallel cursors for a collection allowing parallel reading of entire collection.
     * There are no ordering guarantees for returned results.
     */
    parallelCollectionScan(entityClassOrName, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.parallelCollectionScan(metadata.tableName, options);
    }
    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    reIndex(entityClassOrName) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.reIndex(metadata.tableName);
    }
    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    rename(entityClassOrName, newName, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.rename(metadata.tableName, newName, options);
    }
    /**
     * Replace a document on MongoDB.
     */
    replaceOne(entityClassOrName, query, doc, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.replaceOne(metadata.tableName, query, doc, options);
    }
    /**
     * Get all the collection statistics.
     */
    stats(entityClassOrName, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.stats(metadata.tableName, options);
    }
    watch(entityClassOrName, pipeline, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.watch(metadata.tableName, pipeline, options);
    }
    /**
     * Update multiple documents on MongoDB.
     */
    updateMany(entityClassOrName, query, update, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.updateMany(metadata.tableName, query, update, options);
    }
    /**
     * Update a single document on MongoDB.
     */
    updateOne(entityClassOrName, query, update, options) {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.mongoQueryRunner.updateOne(metadata.tableName, query, update, options);
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Converts FindManyOptions to mongodb query.
     */
    convertFindManyOptionsOrConditionsToMongodbQuery(optionsOrConditions) {
        if (!optionsOrConditions)
            return undefined;
        if (FindOptionsUtils_1.FindOptionsUtils.isFindManyOptions(optionsOrConditions))
            // If where condition is passed as a string which contains sql we have to ignore
            // as mongo is not a sql database
            return typeof optionsOrConditions.where === "string"
                ? {}
                : optionsOrConditions.where;
        return optionsOrConditions;
    }
    /**
     * Converts FindOneOptions to mongodb query.
     */
    convertFindOneOptionsOrConditionsToMongodbQuery(optionsOrConditions) {
        if (!optionsOrConditions)
            return undefined;
        if (FindOptionsUtils_1.FindOptionsUtils.isFindOneOptions(optionsOrConditions))
            // If where condition is passed as a string which contains sql we have to ignore
            // as mongo is not a sql database
            return typeof optionsOrConditions.where === "string"
                ? {}
                : optionsOrConditions.where;
        return optionsOrConditions;
    }
    /**
     * Converts FindOptions into mongodb order by criteria.
     */
    convertFindOptionsOrderToOrderCriteria(order) {
        return Object.keys(order).reduce((orderCriteria, key) => {
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
    }
    /**
     * Converts FindOptions into mongodb select by criteria.
     */
    convertFindOptionsSelectToProjectCriteria(selects) {
        if (Array.isArray(selects)) {
            return selects.reduce((projectCriteria, key) => {
                projectCriteria[key] = 1;
                return projectCriteria;
            }, {});
        }
        else {
            // todo: implement
            return {};
        }
    }
    /**
     * Ensures given id is an id for query.
     */
    convertMixedCriteria(metadata, idMap) {
        const objectIdInstance = PlatformTools_1.PlatformTools.load("mongodb").ObjectID;
        // check first if it's ObjectId compatible:
        // string, number, Buffer, ObjectId or ObjectId-like
        if (objectIdInstance.isValid(idMap)) {
            return {
                _id: new objectIdInstance(idMap),
            };
        }
        // if it's some other type of object build a query from the columns
        // this check needs to be after the ObjectId check, because a valid ObjectId is also an Object instance
        if (ObjectUtils_1.ObjectUtils.isObject(idMap)) {
            return metadata.columns.reduce((query, column) => {
                const columnValue = column.getEntityValue(idMap);
                if (columnValue !== undefined)
                    query[column.databasePath] = columnValue;
                return query;
            }, {});
        }
        // last resort: try to convert it to an ObjectID anyway
        // most likely it will fail, but we want to be backwards compatible and keep the same thrown Errors.
        // it can still pass with null/undefined
        return {
            _id: new objectIdInstance(idMap),
        };
    }
    /**
     * Overrides cursor's toArray and next methods to convert results to entity automatically.
     */
    applyEntityTransformationToCursor(metadata, cursor) {
        // mongdb-3.7 exports Cursor, mongodb-4.2 exports FindCursor, provide support for both.
        const ParentCursor = PlatformTools_1.PlatformTools.load("mongodb").Cursor ||
            PlatformTools_1.PlatformTools.load("mongodb").FindCursor;
        const queryRunner = this.mongoQueryRunner;
        cursor.toArray = function (callback) {
            if (callback) {
                ParentCursor.prototype.toArray.call(this, (error, results) => {
                    if (error) {
                        callback(error, results);
                        return;
                    }
                    const transformer = new DocumentToEntityTransformer_1.DocumentToEntityTransformer();
                    const entities = transformer.transformAll(results, metadata);
                    // broadcast "load" events
                    queryRunner.broadcaster
                        .broadcast("Load", metadata, entities)
                        .then(() => callback(error, entities));
                });
            }
            else {
                return ParentCursor.prototype.toArray
                    .call(this)
                    .then((results) => {
                    const transformer = new DocumentToEntityTransformer_1.DocumentToEntityTransformer();
                    const entities = transformer.transformAll(results, metadata);
                    // broadcast "load" events
                    return queryRunner.broadcaster
                        .broadcast("Load", metadata, entities)
                        .then(() => entities);
                });
            }
        };
        cursor.next = function (callback) {
            if (callback) {
                ParentCursor.prototype.next.call(this, (error, result) => {
                    if (error || !result) {
                        callback(error, result);
                        return;
                    }
                    const transformer = new DocumentToEntityTransformer_1.DocumentToEntityTransformer();
                    const entity = transformer.transform(result, metadata);
                    // broadcast "load" events
                    queryRunner.broadcaster
                        .broadcast("Load", metadata, [entity])
                        .then(() => callback(error, entity));
                });
            }
            else {
                return ParentCursor.prototype.next
                    .call(this)
                    .then((result) => {
                    if (!result)
                        return result;
                    const transformer = new DocumentToEntityTransformer_1.DocumentToEntityTransformer();
                    const entity = transformer.transform(result, metadata);
                    // broadcast "load" events
                    return queryRunner.broadcaster
                        .broadcast("Load", metadata, [entity])
                        .then(() => entity);
                });
            }
        };
    }
    filterSoftDeleted(cursor, deleteDateColumn) {
        cursor.filter({ $where: `this.${deleteDateColumn.propertyName}==null` });
    }
    /**
     * Finds first entity that matches given conditions and/or find options.
     */
    async executeFindOne(entityClassOrName, optionsOrConditions, maybeOptions) {
        const objectIdInstance = PlatformTools_1.PlatformTools.load("mongodb").ObjectID;
        const id = optionsOrConditions instanceof objectIdInstance ||
            typeof optionsOrConditions === "string"
            ? optionsOrConditions
            : undefined;
        const findOneOptionsOrConditions = (id ? maybeOptions : optionsOrConditions);
        const query = this.convertFindOneOptionsOrConditionsToMongodbQuery(findOneOptionsOrConditions) || {};
        if (id) {
            query["_id"] =
                id instanceof objectIdInstance ? id : new objectIdInstance(id);
        }
        const cursor = await this.createEntityCursor(entityClassOrName, query);
        const deleteDateColumn = this.connection.getMetadata(entityClassOrName).deleteDateColumn;
        if (FindOptionsUtils_1.FindOptionsUtils.isFindOneOptions(findOneOptionsOrConditions)) {
            if (findOneOptionsOrConditions.select)
                cursor.project(this.convertFindOptionsSelectToProjectCriteria(findOneOptionsOrConditions.select));
            if (findOneOptionsOrConditions.order)
                cursor.sort(this.convertFindOptionsOrderToOrderCriteria(findOneOptionsOrConditions.order));
            if (deleteDateColumn && !findOneOptionsOrConditions.withDeleted) {
                this.filterSoftDeleted(cursor, deleteDateColumn);
            }
        }
        else if (deleteDateColumn) {
            this.filterSoftDeleted(cursor, deleteDateColumn);
        }
        // const result = await cursor.limit(1).next();
        const result = await cursor.limit(1).toArray();
        return result.length > 0 ? result[0] : null;
    }
    async executeFind(entityClassOrName, optionsOrConditions) {
        const query = this.convertFindManyOptionsOrConditionsToMongodbQuery(optionsOrConditions);
        const cursor = await this.createEntityCursor(entityClassOrName, query);
        const deleteDateColumn = this.connection.getMetadata(entityClassOrName).deleteDateColumn;
        if (FindOptionsUtils_1.FindOptionsUtils.isFindManyOptions(optionsOrConditions)) {
            if (optionsOrConditions.select)
                cursor.project(this.convertFindOptionsSelectToProjectCriteria(optionsOrConditions.select));
            if (optionsOrConditions.skip)
                cursor.skip(optionsOrConditions.skip);
            if (optionsOrConditions.take)
                cursor.limit(optionsOrConditions.take);
            if (optionsOrConditions.order)
                cursor.sort(this.convertFindOptionsOrderToOrderCriteria(optionsOrConditions.order));
            if (deleteDateColumn && !optionsOrConditions.withDeleted) {
                this.filterSoftDeleted(cursor, deleteDateColumn);
            }
        }
        else if (deleteDateColumn) {
            this.filterSoftDeleted(cursor, deleteDateColumn);
        }
        return cursor.toArray();
    }
    /**
     * Finds entities that match given find options or conditions.
     */
    async executeFindAndCount(entityClassOrName, optionsOrConditions) {
        const query = this.convertFindManyOptionsOrConditionsToMongodbQuery(optionsOrConditions);
        const cursor = await this.createEntityCursor(entityClassOrName, query);
        const deleteDateColumn = this.connection.getMetadata(entityClassOrName).deleteDateColumn;
        if (FindOptionsUtils_1.FindOptionsUtils.isFindManyOptions(optionsOrConditions)) {
            if (optionsOrConditions.select)
                cursor.project(this.convertFindOptionsSelectToProjectCriteria(optionsOrConditions.select));
            if (optionsOrConditions.skip)
                cursor.skip(optionsOrConditions.skip);
            if (optionsOrConditions.take)
                cursor.limit(optionsOrConditions.take);
            if (optionsOrConditions.order)
                cursor.sort(this.convertFindOptionsOrderToOrderCriteria(optionsOrConditions.order));
            if (deleteDateColumn && !optionsOrConditions.withDeleted) {
                this.filterSoftDeleted(cursor, deleteDateColumn);
            }
        }
        else if (deleteDateColumn) {
            this.filterSoftDeleted(cursor, deleteDateColumn);
        }
        const [results, count] = await Promise.all([
            cursor.toArray(),
            this.count(entityClassOrName, query),
        ]);
        return [results, parseInt(count)];
    }
}
exports.MongoEntityManager = MongoEntityManager;

//# sourceMappingURL=MongoEntityManager.js.map
