import { __extends } from "tslib";
import { Repository } from "./Repository";
/**
 * Repository used to manage mongodb documents of a single entity type.
 */
var MongoRepository = /** @class */ (function (_super) {
    __extends(MongoRepository, _super);
    function MongoRepository() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // -------------------------------------------------------------------------
    // Overridden Methods
    // -------------------------------------------------------------------------
    /**
     * Raw SQL query execution is not supported by MongoDB.
     * Calling this method will return an error.
     */
    MongoRepository.prototype.query = function (query, parameters) {
        throw new Error("Queries aren't supported by MongoDB.");
    };
    /**
     * Using Query Builder with MongoDB is not supported yet.
     * Calling this method will return an error.
     */
    MongoRepository.prototype.createQueryBuilder = function (alias, queryRunner) {
        throw new Error("Query Builder is not supported by MongoDB.");
    };
    /**
     * Finds entities that match given find options or conditions.
     */
    MongoRepository.prototype.find = function (optionsOrConditions) {
        return this.manager.find(this.metadata.target, optionsOrConditions);
    };
    /**
     * Finds entities that match given find options or conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    MongoRepository.prototype.findAndCount = function (optionsOrConditions) {
        return this.manager.findAndCount(this.metadata.target, optionsOrConditions);
    };
    /**
     * Finds entities by ids.
     * Optionally find options can be applied.
     */
    MongoRepository.prototype.findByIds = function (ids, optionsOrConditions) {
        return this.manager.findByIds(this.metadata.target, ids, optionsOrConditions);
    };
    /**
     * Finds first entity that matches given conditions and/or find options.
     */
    MongoRepository.prototype.findOne = function (optionsOrConditions, maybeOptions) {
        return this.manager.findOne(this.metadata.target, optionsOrConditions, maybeOptions);
    };
    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     */
    MongoRepository.prototype.createCursor = function (query) {
        return this.manager.createCursor(this.metadata.target, query);
    };
    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     * This returns modified version of cursor that transforms each result into Entity model.
     */
    MongoRepository.prototype.createEntityCursor = function (query) {
        return this.manager.createEntityCursor(this.metadata.target, query);
    };
    /**
     * Execute an aggregation framework pipeline against the collection.
     */
    MongoRepository.prototype.aggregate = function (pipeline, options) {
        return this.manager.aggregate(this.metadata.target, pipeline, options);
    };
    /**
     * Execute an aggregation framework pipeline against the collection.
     * This returns modified version of cursor that transforms each result into Entity model.
     */
    MongoRepository.prototype.aggregateEntity = function (pipeline, options) {
        return this.manager.aggregateEntity(this.metadata.target, pipeline, options);
    };
    /**
     * Perform a bulkWrite operation without a fluent API.
     */
    MongoRepository.prototype.bulkWrite = function (operations, options) {
        return this.manager.bulkWrite(this.metadata.target, operations, options);
    };
    /**
     * Count number of matching documents in the db to a query.
     */
    MongoRepository.prototype.count = function (query, options) {
        return this.manager.count(this.metadata.target, query || {}, options);
    };
    /**
     * Creates an index on the db and collection.
     */
    MongoRepository.prototype.createCollectionIndex = function (fieldOrSpec, options) {
        return this.manager.createCollectionIndex(this.metadata.target, fieldOrSpec, options);
    };
    /**
     * Creates multiple indexes in the collection, this method is only supported for MongoDB 2.6 or higher.
     * Earlier version of MongoDB will throw a command not supported error.
     * Index specifications are defined at http://docs.mongodb.org/manual/reference/command/createIndexes/.
     */
    MongoRepository.prototype.createCollectionIndexes = function (indexSpecs) {
        return this.manager.createCollectionIndexes(this.metadata.target, indexSpecs);
    };
    /**
     * Delete multiple documents on MongoDB.
     */
    MongoRepository.prototype.deleteMany = function (query, options) {
        return this.manager.deleteMany(this.metadata.tableName, query, options);
    };
    /**
     * Delete a document on MongoDB.
     */
    MongoRepository.prototype.deleteOne = function (query, options) {
        return this.manager.deleteOne(this.metadata.tableName, query, options);
    };
    /**
     * The distinct command returns returns a list of distinct values for the given key across a collection.
     */
    MongoRepository.prototype.distinct = function (key, query, options) {
        return this.manager.distinct(this.metadata.tableName, key, query, options);
    };
    /**
     * Drops an index from this collection.
     */
    MongoRepository.prototype.dropCollectionIndex = function (indexName, options) {
        return this.manager.dropCollectionIndex(this.metadata.tableName, indexName, options);
    };
    /**
     * Drops all indexes from the collection.
     */
    MongoRepository.prototype.dropCollectionIndexes = function () {
        return this.manager.dropCollectionIndexes(this.metadata.tableName);
    };
    /**
     * Find a document and delete it in one atomic operation, requires a write lock for the duration of the operation.
     */
    MongoRepository.prototype.findOneAndDelete = function (query, options) {
        return this.manager.findOneAndDelete(this.metadata.tableName, query, options);
    };
    /**
     * Find a document and replace it in one atomic operation, requires a write lock for the duration of the operation.
     */
    MongoRepository.prototype.findOneAndReplace = function (query, replacement, options) {
        return this.manager.findOneAndReplace(this.metadata.tableName, query, replacement, options);
    };
    /**
     * Find a document and update it in one atomic operation, requires a write lock for the duration of the operation.
     */
    MongoRepository.prototype.findOneAndUpdate = function (query, update, options) {
        return this.manager.findOneAndUpdate(this.metadata.tableName, query, update, options);
    };
    /**
     * Execute a geo search using a geo haystack index on a collection.
     */
    MongoRepository.prototype.geoHaystackSearch = function (x, y, options) {
        return this.manager.geoHaystackSearch(this.metadata.tableName, x, y, options);
    };
    /**
     * Execute the geoNear command to search for items in the collection.
     */
    MongoRepository.prototype.geoNear = function (x, y, options) {
        return this.manager.geoNear(this.metadata.tableName, x, y, options);
    };
    /**
     * Run a group command across a collection.
     */
    MongoRepository.prototype.group = function (keys, condition, initial, reduce, finalize, command, options) {
        return this.manager.group(this.metadata.tableName, keys, condition, initial, reduce, finalize, command, options);
    };
    /**
     * Retrieve all the indexes on the collection.
     */
    MongoRepository.prototype.collectionIndexes = function () {
        return this.manager.collectionIndexes(this.metadata.tableName);
    };
    /**
     * Retrieve all the indexes on the collection.
     */
    MongoRepository.prototype.collectionIndexExists = function (indexes) {
        return this.manager.collectionIndexExists(this.metadata.tableName, indexes);
    };
    /**
     * Retrieves this collections index info.
     */
    MongoRepository.prototype.collectionIndexInformation = function (options) {
        return this.manager.collectionIndexInformation(this.metadata.tableName, options);
    };
    /**
     * Initiate an In order bulk write operation, operations will be serially executed in the order they are added, creating a new operation for each switch in types.
     */
    MongoRepository.prototype.initializeOrderedBulkOp = function (options) {
        return this.manager.initializeOrderedBulkOp(this.metadata.tableName, options);
    };
    /**
     * Initiate a Out of order batch write operation. All operations will be buffered into insert/update/remove commands executed out of order.
     */
    MongoRepository.prototype.initializeUnorderedBulkOp = function (options) {
        return this.manager.initializeUnorderedBulkOp(this.metadata.tableName, options);
    };
    /**
     * Inserts an array of documents into MongoDB.
     */
    MongoRepository.prototype.insertMany = function (docs, options) {
        return this.manager.insertMany(this.metadata.tableName, docs, options);
    };
    /**
     * Inserts a single document into MongoDB.
     */
    MongoRepository.prototype.insertOne = function (doc, options) {
        return this.manager.insertOne(this.metadata.tableName, doc, options);
    };
    /**
     * Returns if the collection is a capped collection.
     */
    MongoRepository.prototype.isCapped = function () {
        return this.manager.isCapped(this.metadata.tableName);
    };
    /**
     * Get the list of all indexes information for the collection.
     */
    MongoRepository.prototype.listCollectionIndexes = function (options) {
        return this.manager.listCollectionIndexes(this.metadata.tableName, options);
    };
    /**
     * Run Map Reduce across a collection. Be aware that the inline option for out will return an array of results not a collection.
     */
    MongoRepository.prototype.mapReduce = function (map, reduce, options) {
        return this.manager.mapReduce(this.metadata.tableName, map, reduce, options);
    };
    /**
     * Return N number of parallel cursors for a collection allowing parallel reading of entire collection.
     * There are no ordering guarantees for returned results.
     */
    MongoRepository.prototype.parallelCollectionScan = function (options) {
        return this.manager.parallelCollectionScan(this.metadata.tableName, options);
    };
    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    MongoRepository.prototype.reIndex = function () {
        return this.manager.reIndex(this.metadata.tableName);
    };
    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    MongoRepository.prototype.rename = function (newName, options) {
        return this.manager.rename(this.metadata.tableName, newName, options);
    };
    /**
     * Replace a document on MongoDB.
     */
    MongoRepository.prototype.replaceOne = function (query, doc, options) {
        return this.manager.replaceOne(this.metadata.tableName, query, doc, options);
    };
    /**
     * Get all the collection statistics.
     */
    MongoRepository.prototype.stats = function (options) {
        return this.manager.stats(this.metadata.tableName, options);
    };
    /**
     * Update multiple documents on MongoDB.
     */
    MongoRepository.prototype.updateMany = function (query, update, options) {
        return this.manager.updateMany(this.metadata.tableName, query, update, options);
    };
    /**
     * Update a single document on MongoDB.
     */
    MongoRepository.prototype.updateOne = function (query, update, options) {
        return this.manager.updateOne(this.metadata.tableName, query, update, options);
    };
    return MongoRepository;
}(Repository));
export { MongoRepository };

//# sourceMappingURL=MongoRepository.js.map
