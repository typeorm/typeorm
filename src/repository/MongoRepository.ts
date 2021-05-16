import {ObjectLiteral} from "../common/ObjectLiteral";
import {Repository} from "./Repository";
import {FindManyOptions} from "../find-options/FindManyOptions";
import {FindOneOptions} from "../find-options/FindOneOptions";
import {
    AggregationCursor,
    BulkWriteOpResultObject,
    Code,
    Collection,
    CollectionAggregationOptions,
    CollectionBulkWriteOptions,
    CollectionInsertManyOptions,
    CollectionInsertOneOptions,
    CollectionOptions,
    CollStats,
    CommandCursor,
    Cursor,
    DeleteWriteOpResultObject,
    FindAndModifyWriteOpResultObject,
    FindOneAndReplaceOption,
    GeoHaystackSearchOptions,
    GeoNearOptions,
    InsertOneWriteOpResult,
    InsertWriteOpResult,
    MapReduceOptions,
    MongoCountPreferences,
    MongodbIndexOptions,
    ObjectID,
    OrderedBulkOperation,
    ParallelCollectionScanOptions,
    ReadPreference,
    ReplaceOneOptions,
    UnorderedBulkOperation,
    UpdateWriteOpResult
} from "../driver/mongodb/typings";
import {MongoEntityManager} from "../entity-manager/MongoEntityManager";
import {QueryRunner} from "../query-runner/QueryRunner";
import {SelectQueryBuilder} from "../query-builder/SelectQueryBuilder";

/**
 * Repository used to manage mongodb documents of a single entity type.
 */
export class MongoRepository<Entity extends ObjectLiteral> extends Repository<Entity> {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Entity Manager used by this repository.
     */
    readonly manager: MongoEntityManager;

    // -------------------------------------------------------------------------
    // Overridden Methods
    // -------------------------------------------------------------------------

    /**
     * Raw SQL query execution is not supported by MongoDB.
     * Calling this method will return an error.
     */
    query(query: string, parameters?: any[]): Promise<any> {
        throw new Error(`Queries aren't supported by MongoDB.`);
    }

    /**
     * Using Query Builder with MongoDB is not supported yet.
     * Calling this method will return an error.
     */
    createQueryBuilder(alias: string, queryRunner?: QueryRunner): SelectQueryBuilder<Entity> {
        throw new Error(`Query Builder is not supported by MongoDB.`);
    }

    /**
     * Finds entities that match given find options or conditions.
     */
    find(optionsOrConditions?: FindManyOptions<Entity>|Partial<Entity>): Promise<Entity[]> {
        return this.manager.find(this.metadata.target, optionsOrConditions);
    }

    /**
     * Finds entities that match given find options or conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    findAndCount(optionsOrConditions?: FindManyOptions<Entity>|Partial<Entity>): Promise<[ Entity[], number ]> {
        return this.manager.findAndCount(this.metadata.target, optionsOrConditions);
    }

    /**
     * Finds entities by ids.
     * Optionally find options can be applied.
     */
    findByIds(ids: any[], optionsOrConditions?: FindManyOptions<Entity>|Partial<Entity>): Promise<Entity[]> {
        return this.manager.findByIds(this.metadata.target, ids, optionsOrConditions);
    }

    /**
     * Finds first entity that matches given conditions and/or find options.
     */
    findOne(optionsOrConditions?: string|number|Date|ObjectID|FindOneOptions<Entity>|Partial<Entity>, maybeOptions?: FindOneOptions<Entity>): Promise<Entity|undefined> {
        return this.manager.findOne(this.metadata.target, optionsOrConditions as any, maybeOptions as any);
    }

    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     */
    createCursor<T = any>(query?: ObjectLiteral): Cursor<T> {
        return this.manager.createCursor(this.metadata.target, query);
    }

    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     * This returns modified version of cursor that transforms each result into Entity model.
     */
    createEntityCursor(query?: ObjectLiteral): Cursor<Entity> {
        return this.manager.createEntityCursor(this.metadata.target, query);
    }

    /**
     * Execute an aggregation framework pipeline against the collection.
     */
    aggregate<R = any>(pipeline: ObjectLiteral[], options?: CollectionAggregationOptions): AggregationCursor<R> {
        return this.manager.aggregate<R>(this.metadata.target, pipeline, options);
    }

    /**
     * Execute an aggregation framework pipeline against the collection.
     * This returns modified version of cursor that transforms each result into Entity model.
     */
    aggregateEntity(pipeline: ObjectLiteral[], options?: CollectionAggregationOptions): AggregationCursor<Entity> {
        return this.manager.aggregateEntity(this.metadata.target, pipeline, options);
    }
    /**
     * Perform a bulkWrite operation without a fluent API.
     */
    bulkWrite(operations: ObjectLiteral[], options?: CollectionBulkWriteOptions): Promise<BulkWriteOpResultObject> {
        return this.manager.bulkWrite(this.metadata.target, operations, options);
    }

    /**
     * Count number of matching documents in the db to a query.
     */
    count(query?: ObjectLiteral, options?: MongoCountPreferences): Promise<number> {
        return this.manager.count(this.metadata.target, query || {}, options);
    }

    /**
     * Creates an index on the db and collection.
     */
    createCollectionIndex(fieldOrSpec: string|any, options?: MongodbIndexOptions): Promise<string> {
        return this.manager.createCollectionIndex(this.metadata.target, fieldOrSpec, options);
    }

    /**
     * Creates multiple indexes in the collection, this method is only supported for MongoDB 2.6 or higher.
     * Earlier version of MongoDB will throw a command not supported error.
     * Index specifications are defined at http://docs.mongodb.org/manual/reference/command/createIndexes/.
     */
    createCollectionIndexes(indexSpecs: ObjectLiteral[]): Promise<void> {
        return this.manager.createCollectionIndexes(this.metadata.target, indexSpecs);
    }

    /**
     * Delete multiple documents on MongoDB.
     */
    deleteMany(query: ObjectLiteral, options?: CollectionOptions): Promise<DeleteWriteOpResultObject> {
        return this.manager.deleteMany(this.metadata.tableName, query, options);
    }

    /**
     * Delete a document on MongoDB.
     */
    deleteOne(query: ObjectLiteral, options?: CollectionOptions): Promise<DeleteWriteOpResultObject> {
        return this.manager.deleteOne(this.metadata.tableName, query, options);
    }

    /**
     * The distinct command returns returns a list of distinct values for the given key across a collection.
     */
    distinct(key: string, query: ObjectLiteral, options?: { readPreference?: ReadPreference|string }): Promise<any> {
        return this.manager.distinct(this.metadata.tableName, key, query, options);
    }

    /**
     * Drops an index from this collection.
     */
    dropCollectionIndex(indexName: string, options?: CollectionOptions): Promise<any> {
        return this.manager.dropCollectionIndex(this.metadata.tableName, indexName, options);
    }

    /**
     * Drops all indexes from the collection.
     */
    dropCollectionIndexes(): Promise<any> {
        return this.manager.dropCollectionIndexes(this.metadata.tableName);
    }

    /**
     * Find a document and delete it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndDelete(query: ObjectLiteral, options?: { projection?: Object, sort?: Object, maxTimeMS?: number }): Promise<FindAndModifyWriteOpResultObject> {
        return this.manager.findOneAndDelete(this.metadata.tableName, query, options);
    }

    /**
     * Find a document and replace it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndReplace(query: ObjectLiteral, replacement: Object, options?: FindOneAndReplaceOption): Promise<FindAndModifyWriteOpResultObject> {
        return this.manager.findOneAndReplace(this.metadata.tableName, query, replacement, options);
    }

    /**
     * Find a document and update it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndUpdate(query: ObjectLiteral, update: Object, options?: FindOneAndReplaceOption): Promise<FindAndModifyWriteOpResultObject> {
        return this.manager.findOneAndUpdate(this.metadata.tableName, query, update, options);
    }

    /**
     * Execute a geo search using a geo haystack index on a collection.
     */
    geoHaystackSearch(x: number, y: number, options?: GeoHaystackSearchOptions): Promise<any> {
        return this.manager.geoHaystackSearch(this.metadata.tableName, x, y, options);
    }

    /**
     * Execute the geoNear command to search for items in the collection.
     */
    geoNear(x: number, y: number, options?: GeoNearOptions): Promise<any> {
        return this.manager.geoNear(this.metadata.tableName, x, y, options);
    }

    /**
     * Run a group command across a collection.
     */
    group(keys: Object|Array<any>|Function|Code, condition: Object, initial: Object, reduce: Function|Code, finalize: Function|Code, command: boolean, options?: { readPreference?: ReadPreference | string }): Promise<any> {
        return this.manager.group(this.metadata.tableName, keys, condition, initial, reduce, finalize, command, options);
    }

    /**
     * Retrieve all the indexes on the collection.
     */
    collectionIndexes(): Promise<any> {
        return this.manager.collectionIndexes(this.metadata.tableName);
    }

    /**
     * Retrieve all the indexes on the collection.
     */
    collectionIndexExists(indexes: string|string[]): Promise<boolean> {
        return this.manager.collectionIndexExists(this.metadata.tableName, indexes);
    }

    /**
     * Retrieves this collections index info.
     */
    collectionIndexInformation(options?: { full: boolean }): Promise<any> {
        return this.manager.collectionIndexInformation(this.metadata.tableName, options);
    }

    /**
     * Initiate an In order bulk write operation, operations will be serially executed in the order they are added, creating a new operation for each switch in types.
     */
    initializeOrderedBulkOp(options?: CollectionOptions): OrderedBulkOperation {
        return this.manager.initializeOrderedBulkOp(this.metadata.tableName, options);
    }

    /**
     * Initiate a Out of order batch write operation. All operations will be buffered into insert/update/remove commands executed out of order.
     */
    initializeUnorderedBulkOp(options?: CollectionOptions): UnorderedBulkOperation {
        return this.manager.initializeUnorderedBulkOp(this.metadata.tableName, options);
    }

    /**
     * Inserts an array of documents into MongoDB.
     */
    insertMany(docs: ObjectLiteral[], options?: CollectionInsertManyOptions): Promise<InsertWriteOpResult> {
        return this.manager.insertMany(this.metadata.tableName, docs, options);
    }

    /**
     * Inserts a single document into MongoDB.
     */
    insertOne(doc: ObjectLiteral, options?: CollectionInsertOneOptions): Promise<InsertOneWriteOpResult> {
        return this.manager.insertOne(this.metadata.tableName, doc, options);
    }

    /**
     * Returns if the collection is a capped collection.
     */
    isCapped(): Promise<any> {
        return this.manager.isCapped(this.metadata.tableName);
    }

    /**
     * Get the list of all indexes information for the collection.
     */
    listCollectionIndexes(options?: { batchSize?: number, readPreference?: ReadPreference|string }): CommandCursor {
        return this.manager.listCollectionIndexes(this.metadata.tableName, options);
    }

    /**
     * Run Map Reduce across a collection. Be aware that the inline option for out will return an array of results not a collection.
     */
    mapReduce(map: Function|string, reduce: Function|string, options?: MapReduceOptions): Promise<any> {
        return this.manager.mapReduce(this.metadata.tableName, map, reduce, options);
    }

    /**
     * Return N number of parallel cursors for a collection allowing parallel reading of entire collection.
     * There are no ordering guarantees for returned results.
     */
    parallelCollectionScan(options?: ParallelCollectionScanOptions): Promise<Cursor<Entity>[]> {
        return this.manager.parallelCollectionScan(this.metadata.tableName, options);
    }

    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    reIndex(): Promise<any> {
        return this.manager.reIndex(this.metadata.tableName);
    }

    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    rename(newName: string, options?: { dropTarget?: boolean }): Promise<Collection<any>> {
        return this.manager.rename(this.metadata.tableName, newName, options);
    }

    /**
     * Replace a document on MongoDB.
     */
    replaceOne(query: ObjectLiteral, doc: ObjectLiteral, options?: ReplaceOneOptions): Promise<UpdateWriteOpResult> {
        return this.manager.replaceOne(this.metadata.tableName, query, doc, options);
    }

    /**
     * Get all the collection statistics.
     */
    stats(options?: { scale: number }): Promise<CollStats> {
        return this.manager.stats(this.metadata.tableName, options);
    }

    /**
     * Update multiple documents on MongoDB.
     */
    updateMany(query: ObjectLiteral, update: ObjectLiteral, options?: { upsert?: boolean, w?: any, wtimeout?: number, j?: boolean }): Promise<UpdateWriteOpResult> {
        return this.manager.updateMany(this.metadata.tableName, query, update, options);
    }

    /**
     * Update a single document on MongoDB.
     */
    updateOne(query: ObjectLiteral, update: ObjectLiteral, options?: ReplaceOneOptions): Promise<UpdateWriteOpResult> {
        return this.manager.updateOne(this.metadata.tableName, query, update, options);
    }

}
