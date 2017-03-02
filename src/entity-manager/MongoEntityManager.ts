import {Connection} from "../connection/Connection";
import {QueryRunnerProvider} from "../query-runner/QueryRunnerProvider";
import {EntityManager} from "./EntityManager";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {ObjectType} from "../common/ObjectType";
import {
    Cursor,
    Collection,
    MongoCountPreferences,
    CollectionAggregationOptions,
    AggregationCursor,
    CollectionBluckWriteOptions,
    BulkWriteOpResultObject,
    IndexOptions,
    CollectionOptions,
    DeleteWriteOpResultObject,
    FindAndModifyWriteOpResultObject,
    FindOneAndReplaceOption,
    GeoHaystackSearchOptions,
    GeoNearOptions,
    ReadPreference,
    Code,
    OrderedBulkOperation,
    UnorderedBulkOperation,
    InsertWriteOpResult,
    CollectionInsertManyOptions,
    CollectionInsertOneOptions,
    InsertOneWriteOpResult,
    CommandCursor,
    MapReduceOptions,
    ParallelCollectionScanOptions,
    ReplaceOneOptions,
    UpdateWriteOpResult,
    CollStats
} from "mongodb";
import {ObjectLiteral} from "../common/ObjectLiteral";

/**
 * Entity manager supposed to work with any entity, automatically find its repository and call its methods,
 * whatever entity type are you passing.
 *
 * This implementation is used for MongoDB driver which has some specifics in its EntityManager.
 */
export class MongoEntityManager extends EntityManager {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection, queryRunnerProvider?: QueryRunnerProvider) {
        super(connection, queryRunnerProvider);
    }

    // -------------------------------------------------------------------------
    // Overridden Methods
    // -------------------------------------------------------------------------

    /**
     * Executes raw SQL query and returns raw database results.
     */
    query(query: string, parameters?: any[]): Promise<any> {
        throw new Error(`Queries aren't supported by MongoDB.`);
    }

    /**
     * Wraps given function execution (and all operations made there) in a transaction.
     * All database operations must be executed using provided entity manager.
     */
    transaction(runInTransaction: (entityManger: EntityManager) => Promise<any>): Promise<any> {
        throw new Error(`Transactions aren't supported by MongoDB.`);
    }

    /**
     * Using Query Builder with MongoDB is not supported yet.
     * Calling this method will return an error.
     */
    createQueryBuilder<Entity>(entityClassOrName: ObjectType<Entity>|string, alias: string, queryRunnerProvider?: QueryRunnerProvider): QueryBuilder<Entity> {
        throw new Error(`Query Builder is not supported by MongoDB.`);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     */
    createCursor<Entity>(entityClassOrName: ObjectType<Entity>|string, query?: ObjectLiteral): Cursor<Entity> {
        return this.getMongoRepository(entityClassOrName as any).createCursor(query);
    }

    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     * This returns modified version of cursor that transforms each result into Entity model.
     */
    createEntityCursor<Entity>(entityClassOrName: ObjectType<Entity>|string, query?: ObjectLiteral): Cursor<Entity> {
        return this.getMongoRepository(entityClassOrName as any).createEntityCursor(query);
    }

    /**
     * Execute an aggregation framework pipeline against the collection.
     */
    aggregate<Entity>(entityClassOrName: ObjectType<Entity>|string, pipeline: ObjectLiteral[], options?: CollectionAggregationOptions): AggregationCursor<Entity> {
        return this.getMongoRepository(entityClassOrName as any).aggregate(pipeline, options);
    }

    /**
     * Perform a bulkWrite operation without a fluent API.
     */
    bulkWrite<Entity>(entityClassOrName: ObjectType<Entity>|string, operations: ObjectLiteral[], options?: CollectionBluckWriteOptions): Promise<BulkWriteOpResultObject> {
        return this.getMongoRepository(entityClassOrName as any).bulkWrite(operations, options);
    }

    /**
     * Count number of matching documents in the db to a query.
     */
    count<Entity>(entityClassOrName: ObjectType<Entity>|string, query?: ObjectLiteral, options?: MongoCountPreferences): Promise<any> {
        return this.getMongoRepository(entityClassOrName as any).count(query, options);
    }

    /**
     * Creates an index on the db and collection.
     */
    createCollectionIndex<Entity>(entityClassOrName: ObjectType<Entity>|string, fieldOrSpec: string|any, options?: IndexOptions): Promise<string> {
        return this.getMongoRepository(entityClassOrName as any).createCollectionIndex(fieldOrSpec, options);
    }

    /**
     * Creates multiple indexes in the collection, this method is only supported for MongoDB 2.6 or higher.
     * Earlier version of MongoDB will throw a command not supported error.
     * Index specifications are defined at http://docs.mongodb.org/manual/reference/command/createIndexes/.
     */
    createCollectionIndexes<Entity>(entityClassOrName: ObjectType<Entity>|string, indexSpecs: ObjectLiteral[]): Promise<void> {
        return this.getMongoRepository(entityClassOrName as any).createCollectionIndexes(indexSpecs);
    }

    /**
     * Delete multiple documents on MongoDB.
     */
    deleteMany<Entity>(entityClassOrName: ObjectType<Entity>|string, query: ObjectLiteral, options?: CollectionOptions): Promise<DeleteWriteOpResultObject> {
        return this.getMongoRepository(entityClassOrName as any).deleteMany(query, options);
    }

    /**
     * Delete a document on MongoDB.
     */
    deleteOne<Entity>(entityClassOrName: ObjectType<Entity>|string, query: ObjectLiteral, options?: CollectionOptions): Promise<DeleteWriteOpResultObject> {
        return this.getMongoRepository(entityClassOrName as any).deleteOne(query, options);
    }

    /**
     * The distinct command returns returns a list of distinct values for the given key across a collection.
     */
    distinct<Entity>(entityClassOrName: ObjectType<Entity>|string, key: string, query: ObjectLiteral, options?: { readPreference?: ReadPreference|string }): Promise<any> {
        return this.getMongoRepository(entityClassOrName as any).distinct(key, query, options);
    }

    /**
     * Drops an index from this collection.
     */
    dropCollectionIndex<Entity>(entityClassOrName: ObjectType<Entity>|string, indexName: string, options?: CollectionOptions): Promise<any> {
        return this.getMongoRepository(entityClassOrName as any).dropCollectionIndex(indexName, options);
    }

    /**
     * Drops all indexes from the collection.
     */
    dropCollectionIndexes<Entity>(entityClassOrName: ObjectType<Entity>|string): Promise<any> {
        return this.getMongoRepository(entityClassOrName as any).dropCollectionIndexes();
    }

    /**
     * Find a document and delete it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndDelete<Entity>(entityClassOrName: ObjectType<Entity>|string, query: ObjectLiteral, options?: { projection?: Object, sort?: Object, maxTimeMS?: number }): Promise<FindAndModifyWriteOpResultObject> {
        return this.getMongoRepository(entityClassOrName as any).findOneAndDelete(query, options);
    }

    /**
     * Find a document and replace it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndReplace<Entity>(entityClassOrName: ObjectType<Entity>|string, query: ObjectLiteral, replacement: Object, options?: FindOneAndReplaceOption): Promise<FindAndModifyWriteOpResultObject> {
        return this.getMongoRepository(entityClassOrName as any).findOneAndReplace(query, replacement, options);
    }

    /**
     * Find a document and update it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndUpdate<Entity>(entityClassOrName: ObjectType<Entity>|string, query: ObjectLiteral, update: Object, options?: FindOneAndReplaceOption): Promise<FindAndModifyWriteOpResultObject> {
        return this.getMongoRepository(entityClassOrName as any).findOneAndUpdate(query, update, options);
    }

    /**
     * Execute a geo search using a geo haystack index on a collection.
     */
    geoHaystackSearch<Entity>(entityClassOrName: ObjectType<Entity>|string, x: number, y: number, options?: GeoHaystackSearchOptions): Promise<any> {
        return this.getMongoRepository(entityClassOrName as any).geoHaystackSearch(x, y, options);
    }

    /**
     * Execute the geoNear command to search for items in the collection.
     */
    geoNear<Entity>(entityClassOrName: ObjectType<Entity>|string, x: number, y: number, options?: GeoNearOptions): Promise<any> {
        return this.getMongoRepository(entityClassOrName as any).geoNear(x, y, options);
    }

    /**
     * Run a group command across a collection.
     */
    group<Entity>(entityClassOrName: ObjectType<Entity>|string, keys: Object|Array<any>|Function|Code, condition: Object, initial: Object, reduce: Function|Code, finalize: Function|Code, command: boolean, options?: { readPreference?: ReadPreference | string }): Promise<any> {
        return this.getMongoRepository(entityClassOrName as any).group(keys, condition, initial, reduce, finalize, command, options);
    }

    /**
     * Retrieve all the indexes on the collection.
     */
    collectionIndexes<Entity>(entityClassOrName: ObjectType<Entity>|string): Promise<any> {
        return this.getMongoRepository(entityClassOrName as any).collectionIndexes();
    }

    /**
     * Retrieve all the indexes on the collection.
     */
    collectionIndexExists<Entity>(entityClassOrName: ObjectType<Entity>|string, indexes: string|string[]): Promise<boolean> {
        return this.getMongoRepository(entityClassOrName as any).collectionIndexExists(indexes);
    }

    /**
     * Retrieves this collections index info.
     */
    collectionIndexInformation<Entity>(entityClassOrName: ObjectType<Entity>|string, options?: { full: boolean }): Promise<any> {
        return this.getMongoRepository(entityClassOrName as any).collectionIndexInformation(options);
    }

    /**
     * Initiate an In order bulk write operation, operations will be serially executed in the order they are added, creating a new operation for each switch in types.
     */
    initializeOrderedBulkOp<Entity>(entityClassOrName: ObjectType<Entity>|string, options?: CollectionOptions): OrderedBulkOperation {
        return this.getMongoRepository(entityClassOrName as any).initializeOrderedBulkOp(options);
    }

    /**
     * Initiate a Out of order batch write operation. All operations will be buffered into insert/update/remove commands executed out of order.
     */
    initializeUnorderedBulkOp<Entity>(entityClassOrName: ObjectType<Entity>|string, options?: CollectionOptions): UnorderedBulkOperation {
        return this.getMongoRepository(entityClassOrName as any).initializeUnorderedBulkOp(options);
    }

    /**
     * Inserts an array of documents into MongoDB.
     */
    insertMany<Entity>(entityClassOrName: ObjectType<Entity>|string, docs: ObjectLiteral[], options?: CollectionInsertManyOptions): Promise<InsertWriteOpResult> {
        return this.getMongoRepository(entityClassOrName as any).insertMany(docs, options);
    }

    /**
     * Inserts a single document into MongoDB.
     */
    insertOne<Entity>(entityClassOrName: ObjectType<Entity>|string, doc: ObjectLiteral, options?: CollectionInsertOneOptions): Promise<InsertOneWriteOpResult> {
        return this.getMongoRepository(entityClassOrName as any).insertOne(doc, options);
    }

    /**
     * Returns if the collection is a capped collection.
     */
    isCapped<Entity>(entityClassOrName: ObjectType<Entity>|string): Promise<any> {
        return this.getMongoRepository(entityClassOrName as any).isCapped();
    }

    /**
     * Get the list of all indexes information for the collection.
     */
    listCollectionIndexes<Entity>(entityClassOrName: ObjectType<Entity>|string, options?: { batchSize?: number, readPreference?: ReadPreference|string }): CommandCursor {
        return this.getMongoRepository(entityClassOrName as any).listCollectionIndexes(options);
    }

    /**
     * Run Map Reduce across a collection. Be aware that the inline option for out will return an array of results not a collection.
     */
    mapReduce<Entity>(entityClassOrName: ObjectType<Entity>|string, map: Function|string, reduce: Function|string, options?: MapReduceOptions): Promise<any> {
        return this.getMongoRepository(entityClassOrName as any).mapReduce(map, reduce, options);
    }

    /**
     * Return N number of parallel cursors for a collection allowing parallel reading of entire collection.
     * There are no ordering guarantees for returned results.
     */
    parallelCollectionScan<Entity>(entityClassOrName: ObjectType<Entity>|string, options?: ParallelCollectionScanOptions): Promise<Cursor<Entity>[]> {
        return this.getMongoRepository(entityClassOrName as any).parallelCollectionScan(options);
    }

    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    reIndex<Entity>(entityClassOrName: ObjectType<Entity>|string): Promise<any> {
        return this.getMongoRepository(entityClassOrName as any).reIndex();
    }

    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    rename<Entity>(entityClassOrName: ObjectType<Entity>|string, newName: string, options?: { dropTarget?: boolean }): Promise<Collection> {
        return this.getMongoRepository(entityClassOrName as any).rename(newName, options);
    }

    /**
     * Replace a document on MongoDB.
     */
    replaceOne<Entity>(entityClassOrName: ObjectType<Entity>|string, query: ObjectLiteral, doc: ObjectLiteral, options?: ReplaceOneOptions): Promise<UpdateWriteOpResult> {
        return this.getMongoRepository(entityClassOrName as any).replaceOne(query, doc, options);
    }

    /**
     * Get all the collection statistics.
     */
    stats<Entity>(entityClassOrName: ObjectType<Entity>|string, options?: { scale: number }): Promise<CollStats> {
        return this.getMongoRepository(entityClassOrName as any).stats(options);
    }

    /**
     * Update multiple documents on MongoDB.
     */
    updateMany<Entity>(entityClassOrName: ObjectType<Entity>|string, query: ObjectLiteral, update: ObjectLiteral, options?: { upsert?: boolean, w?: any, wtimeout?: number, j?: boolean }): Promise<UpdateWriteOpResult> {
        return this.getMongoRepository(entityClassOrName as any).updateMany(query, update, options);
    }

    /**
     * Update a single document on MongoDB.
     */
    updateOne<Entity>(entityClassOrName: ObjectType<Entity>|string, query: ObjectLiteral, update: ObjectLiteral, options?: ReplaceOneOptions): Promise<UpdateWriteOpResult> {
        return this.getMongoRepository(entityClassOrName as any).updateOne(query, update, options);
    }

}