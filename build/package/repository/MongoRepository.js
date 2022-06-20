"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoRepository = void 0;
const Repository_1 = require("./Repository");
const TypeORMError_1 = require("../error/TypeORMError");
/**
 * Repository used to manage mongodb documents of a single entity type.
 */
class MongoRepository extends Repository_1.Repository {
    // -------------------------------------------------------------------------
    // Overridden Methods
    // -------------------------------------------------------------------------
    /**
     * Raw SQL query execution is not supported by MongoDB.
     * Calling this method will return an error.
     */
    query(query, parameters) {
        throw new TypeORMError_1.TypeORMError(`Queries aren't supported by MongoDB.`);
    }
    /**
     * Using Query Builder with MongoDB is not supported yet.
     * Calling this method will return an error.
     */
    createQueryBuilder(alias, queryRunner) {
        throw new TypeORMError_1.TypeORMError(`Query Builder is not supported by MongoDB.`);
    }
    /**
     * Finds entities that match given find options or conditions.
     */
    find(options) {
        return this.manager.find(this.metadata.target, options);
    }
    /**
     * Finds entities that match given find options or conditions.
     */
    findBy(where) {
        return this.manager.findBy(this.metadata.target, where);
    }
    /**
     * Finds entities that match given find options or conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    findAndCount(options) {
        return this.manager.findAndCount(this.metadata.target, options);
    }
    /**
     * Finds entities that match given find options or conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    findAndCountBy(where) {
        return this.manager.findAndCountBy(this.metadata.target, where);
    }
    /**
     * Finds entities by ids.
     * Optionally find options can be applied.
     *
     * @deprecated use `findBy` method instead in conjunction with `In` operator, for example:
     *
     * .findBy({
     *     id: In([1, 2, 3])
     * })
     */
    findByIds(ids, options) {
        return this.manager.findByIds(this.metadata.target, ids, options);
    }
    /**
     * Finds first entity that matches given find options.
     */
    async findOne(options) {
        return this.manager.findOne(this.metadata.target, options);
    }
    /**
     * Finds first entity that matches given WHERE conditions.
     */
    async findOneBy(where) {
        return this.manager.findOneBy(this.metadata.target, where);
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
    async findOneById(id) {
        return this.manager.findOneById(this.metadata.target, id);
    }
    /**
     * Finds first entity by a given find options.
     * If entity was not found in the database - rejects with error.
     */
    async findOneOrFail(options) {
        return this.manager.findOneOrFail(this.metadata.target, options);
    }
    /**
     * Finds first entity that matches given where condition.
     * If entity was not found in the database - rejects with error.
     */
    async findOneByOrFail(where) {
        return this.manager.findOneByOrFail(this.metadata.target, where);
    }
    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     */
    createCursor(query) {
        return this.manager.createCursor(this.metadata.target, query);
    }
    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     * This returns modified version of cursor that transforms each result into Entity model.
     */
    createEntityCursor(query) {
        return this.manager.createEntityCursor(this.metadata.target, query);
    }
    /**
     * Execute an aggregation framework pipeline against the collection.
     */
    aggregate(pipeline, options) {
        return this.manager.aggregate(this.metadata.target, pipeline, options);
    }
    /**
     * Execute an aggregation framework pipeline against the collection.
     * This returns modified version of cursor that transforms each result into Entity model.
     */
    aggregateEntity(pipeline, options) {
        return this.manager.aggregateEntity(this.metadata.target, pipeline, options);
    }
    /**
     * Perform a bulkWrite operation without a fluent API.
     */
    bulkWrite(operations, options) {
        return this.manager.bulkWrite(this.metadata.target, operations, options);
    }
    /**
     * Count number of matching documents in the db to a query.
     */
    count(query, options) {
        return this.manager.count(this.metadata.target, query || {}, options);
    }
    /**
     * Count number of matching documents in the db to a query.
     */
    countBy(query, options) {
        return this.manager.countBy(this.metadata.target, query || {}, options);
    }
    /**
     * Creates an index on the db and collection.
     */
    createCollectionIndex(fieldOrSpec, options) {
        return this.manager.createCollectionIndex(this.metadata.target, fieldOrSpec, options);
    }
    /**
     * Creates multiple indexes in the collection, this method is only supported for MongoDB 2.6 or higher.
     * Earlier version of MongoDB will throw a command not supported error.
     * Index specifications are defined at http://docs.mongodb.org/manual/reference/command/createIndexes/.
     */
    createCollectionIndexes(indexSpecs) {
        return this.manager.createCollectionIndexes(this.metadata.target, indexSpecs);
    }
    /**
     * Delete multiple documents on MongoDB.
     */
    deleteMany(query, options) {
        return this.manager.deleteMany(this.metadata.tableName, query, options);
    }
    /**
     * Delete a document on MongoDB.
     */
    deleteOne(query, options) {
        return this.manager.deleteOne(this.metadata.tableName, query, options);
    }
    /**
     * The distinct command returns returns a list of distinct values for the given key across a collection.
     */
    distinct(key, query, options) {
        return this.manager.distinct(this.metadata.tableName, key, query, options);
    }
    /**
     * Drops an index from this collection.
     */
    dropCollectionIndex(indexName, options) {
        return this.manager.dropCollectionIndex(this.metadata.tableName, indexName, options);
    }
    /**
     * Drops all indexes from the collection.
     */
    dropCollectionIndexes() {
        return this.manager.dropCollectionIndexes(this.metadata.tableName);
    }
    /**
     * Find a document and delete it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndDelete(query, options) {
        return this.manager.findOneAndDelete(this.metadata.tableName, query, options);
    }
    /**
     * Find a document and replace it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndReplace(query, replacement, options) {
        return this.manager.findOneAndReplace(this.metadata.tableName, query, replacement, options);
    }
    /**
     * Find a document and update it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndUpdate(query, update, options) {
        return this.manager.findOneAndUpdate(this.metadata.tableName, query, update, options);
    }
    /**
     * Execute a geo search using a geo haystack index on a collection.
     */
    geoHaystackSearch(x, y, options) {
        return this.manager.geoHaystackSearch(this.metadata.tableName, x, y, options);
    }
    /**
     * Execute the geoNear command to search for items in the collection.
     */
    geoNear(x, y, options) {
        return this.manager.geoNear(this.metadata.tableName, x, y, options);
    }
    /**
     * Run a group command across a collection.
     */
    group(keys, condition, initial, reduce, finalize, command, options) {
        return this.manager.group(this.metadata.tableName, keys, condition, initial, reduce, finalize, command, options);
    }
    /**
     * Retrieve all the indexes on the collection.
     */
    collectionIndexes() {
        return this.manager.collectionIndexes(this.metadata.tableName);
    }
    /**
     * Retrieve all the indexes on the collection.
     */
    collectionIndexExists(indexes) {
        return this.manager.collectionIndexExists(this.metadata.tableName, indexes);
    }
    /**
     * Retrieves this collections index info.
     */
    collectionIndexInformation(options) {
        return this.manager.collectionIndexInformation(this.metadata.tableName, options);
    }
    /**
     * Initiate an In order bulk write operation, operations will be serially executed in the order they are added, creating a new operation for each switch in types.
     */
    initializeOrderedBulkOp(options) {
        return this.manager.initializeOrderedBulkOp(this.metadata.tableName, options);
    }
    /**
     * Initiate a Out of order batch write operation. All operations will be buffered into insert/update/remove commands executed out of order.
     */
    initializeUnorderedBulkOp(options) {
        return this.manager.initializeUnorderedBulkOp(this.metadata.tableName, options);
    }
    /**
     * Inserts an array of documents into MongoDB.
     */
    insertMany(docs, options) {
        return this.manager.insertMany(this.metadata.tableName, docs, options);
    }
    /**
     * Inserts a single document into MongoDB.
     */
    insertOne(doc, options) {
        return this.manager.insertOne(this.metadata.tableName, doc, options);
    }
    /**
     * Returns if the collection is a capped collection.
     */
    isCapped() {
        return this.manager.isCapped(this.metadata.tableName);
    }
    /**
     * Get the list of all indexes information for the collection.
     */
    listCollectionIndexes(options) {
        return this.manager.listCollectionIndexes(this.metadata.tableName, options);
    }
    /**
     * Run Map Reduce across a collection. Be aware that the inline option for out will return an array of results not a collection.
     */
    mapReduce(map, reduce, options) {
        return this.manager.mapReduce(this.metadata.tableName, map, reduce, options);
    }
    /**
     * Return N number of parallel cursors for a collection allowing parallel reading of entire collection.
     * There are no ordering guarantees for returned results.
     */
    parallelCollectionScan(options) {
        return this.manager.parallelCollectionScan(this.metadata.tableName, options);
    }
    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    reIndex() {
        return this.manager.reIndex(this.metadata.tableName);
    }
    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    rename(newName, options) {
        return this.manager.rename(this.metadata.tableName, newName, options);
    }
    /**
     * Replace a document on MongoDB.
     */
    replaceOne(query, doc, options) {
        return this.manager.replaceOne(this.metadata.tableName, query, doc, options);
    }
    /**
     * Get all the collection statistics.
     */
    stats(options) {
        return this.manager.stats(this.metadata.tableName, options);
    }
    /**
     * Update multiple documents on MongoDB.
     */
    updateMany(query, update, options) {
        return this.manager.updateMany(this.metadata.tableName, query, update, options);
    }
    /**
     * Update a single document on MongoDB.
     */
    updateOne(query, update, options) {
        return this.manager.updateOne(this.metadata.tableName, query, update, options);
    }
}
exports.MongoRepository = MongoRepository;

//# sourceMappingURL=MongoRepository.js.map
