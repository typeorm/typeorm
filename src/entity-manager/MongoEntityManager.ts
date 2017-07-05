import {Connection} from "../connection/Connection";
import {EntityManager} from "./EntityManager";
import {ObjectType} from "../common/ObjectType";
import {
    AggregationCursor,
    BulkWriteOpResultObject,
    Code,
    Collection,
    CollectionAggregationOptions,
    CollectionBluckWriteOptions,
    CollectionInsertManyOptions,
    CollectionInsertOneOptions,
    CollectionOptions,
    CollStats,
    CommandCursor,
    Cursor,
    CursorResult,
    DeleteWriteOpResultObject,
    FindAndModifyWriteOpResultObject,
    FindOneAndReplaceOption,
    GeoHaystackSearchOptions,
    GeoNearOptions,
    InsertOneWriteOpResult,
    InsertWriteOpResult,
    MapReduceOptions,
    MongoCallback,
    MongoCountPreferences,
    MongodbIndexOptions,
    MongoError,
    OrderedBulkOperation,
    ParallelCollectionScanOptions,
    ReadPreference,
    ReplaceOneOptions,
    UnorderedBulkOperation,
    UpdateWriteOpResult
} from "../driver/mongodb/typings";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {MongoQueryRunner} from "../driver/mongodb/MongoQueryRunner";
import {MongoDriver} from "../driver/mongodb/MongoDriver";
import {DocumentToEntityTransformer} from "../query-builder/transformer/DocumentToEntityTransformer";
import {FindManyOptions} from "../find-options/FindManyOptions";
import {FindOptionsUtils} from "../find-options/FindOptionsUtils";
import {FindOneOptions} from "../find-options/FindOneOptions";

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

    constructor(connection: Connection) {
        super(connection);
    }

    // -------------------------------------------------------------------------
    // Overridden Properties
    // -------------------------------------------------------------------------

    /**
     * Gets query runner used to execute queries.
     */
    get queryRunner(): MongoQueryRunner {
        return (this.connection.driver as MongoDriver).queryRunner!;
    }

    // -------------------------------------------------------------------------
    // Overridden Methods
    // -------------------------------------------------------------------------

    /**
     * Finds entities that match given find options or conditions.
     */
    async find<Entity>(entityClassOrName: ObjectType<Entity>|string, optionsOrConditions?: FindManyOptions<Entity>|Partial<Entity>): Promise<Entity[]> {
        const query = this.convertFindManyOptionsOrConditionsToMongodbQuery(optionsOrConditions);
        const cursor = await this.createEntityCursor(entityClassOrName, query);
        if (FindOptionsUtils.isFindManyOptions(optionsOrConditions)) {
            if (optionsOrConditions.skip)
                cursor.skip(optionsOrConditions.skip);
            if (optionsOrConditions.take)
                cursor.limit(optionsOrConditions.take);
            if (optionsOrConditions.order)
                cursor.sort(this.convertFindOptionsOrderToOrderCriteria(optionsOrConditions.order));
        }
        return cursor.toArray();
    }

    /**
     * Finds entities that match given find options or conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    async findAndCount<Entity>(entityClassOrName: ObjectType<Entity>|string, optionsOrConditions?: FindManyOptions<Entity>|Partial<Entity>): Promise<[ Entity[], number ]> {
        const query = this.convertFindManyOptionsOrConditionsToMongodbQuery(optionsOrConditions);
        const cursor = await this.createEntityCursor(entityClassOrName, query);
        if (FindOptionsUtils.isFindManyOptions(optionsOrConditions)) {
            if (optionsOrConditions.skip)
                cursor.skip(optionsOrConditions.skip);
            if (optionsOrConditions.take)
                cursor.limit(optionsOrConditions.take);
            if (optionsOrConditions.order)
                cursor.sort(this.convertFindOptionsOrderToOrderCriteria(optionsOrConditions.order));
        }
        const [results, count] = await Promise.all<any>([
            cursor.toArray(),
            this.count(entityClassOrName, query),
        ]);
        return [results, parseInt(count)];
    }

    /**
     * Finds entities by ids.
     * Optionally find options can be applied.
     */
    async findByIds<Entity>(entityClassOrName: ObjectType<Entity>|string, ids: any[], optionsOrConditions?: FindManyOptions<Entity>|Partial<Entity>): Promise<Entity[]> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        const query = this.convertFindManyOptionsOrConditionsToMongodbQuery(optionsOrConditions) || {};
        const objectIdInstance = require("mongodb").ObjectID;
        query["_id"] = { $in: ids.map(id => {
            if (id instanceof objectIdInstance)
                return id;

            return id[metadata.objectIdColumn!.propertyName];
        }) };

        const cursor = await this.createEntityCursor(entityClassOrName, query);
        if (FindOptionsUtils.isFindManyOptions(optionsOrConditions)) {
            if (optionsOrConditions.skip)
                cursor.skip(optionsOrConditions.skip);
            if (optionsOrConditions.take)
                cursor.limit(optionsOrConditions.take);
            if (optionsOrConditions.order)
                cursor.sort(this.convertFindOptionsOrderToOrderCriteria(optionsOrConditions.order));
        }
        return await cursor.toArray();
    }

    /**
     * Finds first entity that matches given conditions and/or find options.
     */
    async findOne<Entity>(entityClassOrName: ObjectType<Entity>|string, optionsOrConditions?: FindOneOptions<Entity>|Partial<Entity>): Promise<Entity|undefined> {
        const query = this.convertFindOneOptionsOrConditionsToMongodbQuery(optionsOrConditions);
        const cursor = await this.createEntityCursor(entityClassOrName, query);
        if (FindOptionsUtils.isFindOneOptions(optionsOrConditions)) {
            if (optionsOrConditions.order)
                cursor.sort(this.convertFindOptionsOrderToOrderCriteria(optionsOrConditions.order));
        }

        // const result = await cursor.limit(1).next();
        const result = await cursor.limit(1).toArray();
        return result.length > 0 ? result[0] : undefined;
    }

    /**
     * Finds entity by given id.
     * Optionally find options or conditions can be applied.
     */
    async findOneById<Entity>(entityClassOrName: ObjectType<Entity>|string, id: any, optionsOrConditions?: FindOneOptions<Entity>|Partial<Entity>): Promise<Entity|undefined> {
        const query = this.convertFindOneOptionsOrConditionsToMongodbQuery(optionsOrConditions) || {};
        query["_id"] = id;
        const cursor = await this.createEntityCursor(entityClassOrName, query);
        if (FindOptionsUtils.isFindOneOptions(optionsOrConditions)) {
            if (optionsOrConditions.order)
                cursor.sort(this.convertFindOptionsOrderToOrderCriteria(optionsOrConditions.order));
        }

        // const result = await cursor.limit(1).next();
        const result = await cursor.limit(1).toArray();
        return result.length > 0 ? result[0] : undefined;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     */
    createCursor<Entity>(entityClassOrName: ObjectType<Entity>|string, query?: ObjectLiteral): Cursor<Entity> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.cursor(metadata.tableName, query);
    }

    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     * This returns modified version of cursor that transforms each result into Entity model.
     */
    createEntityCursor<Entity>(entityClassOrName: ObjectType<Entity>|string, query?: ObjectLiteral): Cursor<Entity> {

        const metadata = this.connection.getMetadata(entityClassOrName);
        const cursor = this.createCursor(entityClassOrName, query);
        const ParentCursor = require("mongodb").Cursor;
        cursor.toArray = function (callback?: MongoCallback<Entity[]>) {
            if (callback) {
                ParentCursor.prototype.toArray.call(this, (error: MongoError, results: Entity[]): void => {
                    if (error) {
                        callback(error, results);
                        return;
                    }

                    const transformer = new DocumentToEntityTransformer();
                    return callback(error, transformer.transformAll(results, metadata));
                });
            } else {
                return ParentCursor.prototype.toArray.call(this).then((results: Entity[]) => {
                    const transformer = new DocumentToEntityTransformer();
                    return transformer.transformAll(results, metadata);
                });
            }
        };
        cursor.next = function (callback?: MongoCallback<CursorResult>) {
            if (callback) {
                ParentCursor.prototype.next.call(this, (error: MongoError, result: CursorResult): void => {
                    if (error || !result) {
                        callback(error, result);
                        return;
                    }

                    const transformer = new DocumentToEntityTransformer();
                    return callback(error, transformer.transform(result, metadata));
                });
            } else {
                return ParentCursor.prototype.next.call(this).then((result: Entity) => {
                    if (!result) return result;
                    const transformer = new DocumentToEntityTransformer();
                    return transformer.transform(result, metadata);
                });
            }
        };
        return cursor;
    }

    /**
     * Execute an aggregation framework pipeline against the collection.
     */
    aggregate<Entity>(entityClassOrName: ObjectType<Entity>|string, pipeline: ObjectLiteral[], options?: CollectionAggregationOptions): AggregationCursor<Entity> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.aggregate(metadata.tableName, pipeline, options);
    }

    /**
     * Perform a bulkWrite operation without a fluent API.
     */
    bulkWrite<Entity>(entityClassOrName: ObjectType<Entity>|string, operations: ObjectLiteral[], options?: CollectionBluckWriteOptions): Promise<BulkWriteOpResultObject> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.bulkWrite(metadata.tableName, operations, options);
    }

    /**
     * Count number of matching documents in the db to a query.
     */
    count<Entity>(entityClassOrName: ObjectType<Entity>|string, query?: ObjectLiteral, options?: MongoCountPreferences): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.count(metadata.tableName, query, options);
    }

    /**
     * Creates an index on the db and collection.
     */
    createCollectionIndex<Entity>(entityClassOrName: ObjectType<Entity>|string, fieldOrSpec: string|any, options?: MongodbIndexOptions): Promise<string> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.createCollectionIndex(metadata.tableName, fieldOrSpec, options);
    }

    /**
     * Creates multiple indexes in the collection, this method is only supported for MongoDB 2.6 or higher.
     * Earlier version of MongoDB will throw a command not supported error.
     * Index specifications are defined at http://docs.mongodb.org/manual/reference/command/createIndexes/.
     */
    createCollectionIndexes<Entity>(entityClassOrName: ObjectType<Entity>|string, indexSpecs: ObjectLiteral[]): Promise<void> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.createCollectionIndexes(metadata.tableName, indexSpecs);
    }

    /**
     * Delete multiple documents on MongoDB.
     */
    deleteMany<Entity>(entityClassOrName: ObjectType<Entity>|string, query: ObjectLiteral, options?: CollectionOptions): Promise<DeleteWriteOpResultObject> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.deleteMany(metadata.tableName, query, options);
    }

    /**
     * Delete a document on MongoDB.
     */
    deleteOne<Entity>(entityClassOrName: ObjectType<Entity>|string, query: ObjectLiteral, options?: CollectionOptions): Promise<DeleteWriteOpResultObject> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.deleteOne(metadata.tableName, query, options);
    }

    /**
     * The distinct command returns returns a list of distinct values for the given key across a collection.
     */
    distinct<Entity>(entityClassOrName: ObjectType<Entity>|string, key: string, query: ObjectLiteral, options?: { readPreference?: ReadPreference|string }): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.distinct(metadata.tableName, key, query, options);
    }

    /**
     * Drops an index from this collection.
     */
    dropCollectionIndex<Entity>(entityClassOrName: ObjectType<Entity>|string, indexName: string, options?: CollectionOptions): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.dropCollectionIndex(metadata.tableName, indexName, options);
    }

    /**
     * Drops all indexes from the collection.
     */
    dropCollectionIndexes<Entity>(entityClassOrName: ObjectType<Entity>|string): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.dropCollectionIndexes(metadata.tableName);
    }

    /**
     * Find a document and delete it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndDelete<Entity>(entityClassOrName: ObjectType<Entity>|string, query: ObjectLiteral, options?: { projection?: Object, sort?: Object, maxTimeMS?: number }): Promise<FindAndModifyWriteOpResultObject> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.findOneAndDelete(metadata.tableName, query, options);
    }

    /**
     * Find a document and replace it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndReplace<Entity>(entityClassOrName: ObjectType<Entity>|string, query: ObjectLiteral, replacement: Object, options?: FindOneAndReplaceOption): Promise<FindAndModifyWriteOpResultObject> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.findOneAndReplace(metadata.tableName, query, replacement, options);
    }

    /**
     * Find a document and update it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndUpdate<Entity>(entityClassOrName: ObjectType<Entity>|string, query: ObjectLiteral, update: Object, options?: FindOneAndReplaceOption): Promise<FindAndModifyWriteOpResultObject> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.findOneAndUpdate(metadata.tableName, query, update, options);
    }

    /**
     * Execute a geo search using a geo haystack index on a collection.
     */
    geoHaystackSearch<Entity>(entityClassOrName: ObjectType<Entity>|string, x: number, y: number, options?: GeoHaystackSearchOptions): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.geoHaystackSearch(metadata.tableName, x, y, options);
    }

    /**
     * Execute the geoNear command to search for items in the collection.
     */
    geoNear<Entity>(entityClassOrName: ObjectType<Entity>|string, x: number, y: number, options?: GeoNearOptions): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.geoNear(metadata.tableName, x, y, options);
    }

    /**
     * Run a group command across a collection.
     */
    group<Entity>(entityClassOrName: ObjectType<Entity>|string, keys: Object|Array<any>|Function|Code, condition: Object, initial: Object, reduce: Function|Code, finalize: Function|Code, command: boolean, options?: { readPreference?: ReadPreference | string }): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.group(metadata.tableName, keys, condition, initial, reduce, finalize, command, options);
    }

    /**
     * Retrieve all the indexes on the collection.
     */
    collectionIndexes<Entity>(entityClassOrName: ObjectType<Entity>|string): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.collectionIndexes(metadata.tableName);
    }

    /**
     * Retrieve all the indexes on the collection.
     */
    collectionIndexExists<Entity>(entityClassOrName: ObjectType<Entity>|string, indexes: string|string[]): Promise<boolean> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.collectionIndexExists(metadata.tableName, indexes);
    }

    /**
     * Retrieves this collections index info.
     */
    collectionIndexInformation<Entity>(entityClassOrName: ObjectType<Entity>|string, options?: { full: boolean }): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.collectionIndexInformation(metadata.tableName, options);
    }

    /**
     * Initiate an In order bulk write operation, operations will be serially executed in the order they are added, creating a new operation for each switch in types.
     */
    initializeOrderedBulkOp<Entity>(entityClassOrName: ObjectType<Entity>|string, options?: CollectionOptions): OrderedBulkOperation {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.initializeOrderedBulkOp(metadata.tableName, options);
    }

    /**
     * Initiate a Out of order batch write operation. All operations will be buffered into insert/update/remove commands executed out of order.
     */
    initializeUnorderedBulkOp<Entity>(entityClassOrName: ObjectType<Entity>|string, options?: CollectionOptions): UnorderedBulkOperation {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.initializeUnorderedBulkOp(metadata.tableName, options);
    }

    /**
     * Inserts an array of documents into MongoDB.
     */
    insertMany<Entity>(entityClassOrName: ObjectType<Entity>|string, docs: ObjectLiteral[], options?: CollectionInsertManyOptions): Promise<InsertWriteOpResult> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.insertMany(metadata.tableName, docs, options);
    }

    /**
     * Inserts a single document into MongoDB.
     */
    insertOne<Entity>(entityClassOrName: ObjectType<Entity>|string, doc: ObjectLiteral, options?: CollectionInsertOneOptions): Promise<InsertOneWriteOpResult> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.insertOne(metadata.tableName, doc, options);
    }

    /**
     * Returns if the collection is a capped collection.
     */
    isCapped<Entity>(entityClassOrName: ObjectType<Entity>|string): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.isCapped(metadata.tableName);
    }

    /**
     * Get the list of all indexes information for the collection.
     */
    listCollectionIndexes<Entity>(entityClassOrName: ObjectType<Entity>|string, options?: { batchSize?: number, readPreference?: ReadPreference|string }): CommandCursor {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.listCollectionIndexes(metadata.tableName, options);
    }

    /**
     * Run Map Reduce across a collection. Be aware that the inline option for out will return an array of results not a collection.
     */
    mapReduce<Entity>(entityClassOrName: ObjectType<Entity>|string, map: Function|string, reduce: Function|string, options?: MapReduceOptions): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.mapReduce(metadata.tableName, map, reduce, options);
    }

    /**
     * Return N number of parallel cursors for a collection allowing parallel reading of entire collection.
     * There are no ordering guarantees for returned results.
     */
    parallelCollectionScan<Entity>(entityClassOrName: ObjectType<Entity>|string, options?: ParallelCollectionScanOptions): Promise<Cursor<Entity>[]> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.parallelCollectionScan(metadata.tableName, options);
    }

    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    reIndex<Entity>(entityClassOrName: ObjectType<Entity>|string): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.reIndex(metadata.tableName);
    }

    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    rename<Entity>(entityClassOrName: ObjectType<Entity>|string, newName: string, options?: { dropTarget?: boolean }): Promise<Collection> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.rename(metadata.tableName, newName, options);
    }

    /**
     * Replace a document on MongoDB.
     */
    replaceOne<Entity>(entityClassOrName: ObjectType<Entity>|string, query: ObjectLiteral, doc: ObjectLiteral, options?: ReplaceOneOptions): Promise<UpdateWriteOpResult> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.replaceOne(metadata.tableName, query, doc, options);
    }

    /**
     * Get all the collection statistics.
     */
    stats<Entity>(entityClassOrName: ObjectType<Entity>|string, options?: { scale: number }): Promise<CollStats> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.stats(metadata.tableName, options);
    }

    /**
     * Update multiple documents on MongoDB.
     */
    updateMany<Entity>(entityClassOrName: ObjectType<Entity>|string, query: ObjectLiteral, update: ObjectLiteral, options?: { upsert?: boolean, w?: any, wtimeout?: number, j?: boolean }): Promise<UpdateWriteOpResult> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.updateMany(metadata.tableName, query, update, options);
    }

    /**
     * Update a single document on MongoDB.
     */
    updateOne<Entity>(entityClassOrName: ObjectType<Entity>|string, query: ObjectLiteral, update: ObjectLiteral, options?: ReplaceOneOptions): Promise<UpdateWriteOpResult> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.updateOne(metadata.tableName, query, update, options);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Converts FindManyOptions to mongodb query.
     */
    protected convertFindManyOptionsOrConditionsToMongodbQuery<Entity>(optionsOrConditions: FindOneOptions<Entity>|Partial<Entity>|undefined): ObjectLiteral|undefined {
        if (!optionsOrConditions)
            return undefined;

        return FindOptionsUtils.isFindManyOptions(optionsOrConditions) ? optionsOrConditions.where : optionsOrConditions;
    }

    /**
     * Converts FindOneOptions to mongodb query.
     */
    protected convertFindOneOptionsOrConditionsToMongodbQuery<Entity>(optionsOrConditions: FindOneOptions<Entity>|Partial<Entity>|undefined): ObjectLiteral|undefined {
        if (!optionsOrConditions)
            return undefined;

        return FindOptionsUtils.isFindOneOptions(optionsOrConditions) ? optionsOrConditions.where : optionsOrConditions;
    }

    /**
     * Converts FindOptions into mongodb order by criteria.
     */
    protected convertFindOptionsOrderToOrderCriteria<Entity, P>(order: { [P in keyof Entity]?: "ASC"|"DESC" }) {
        const orderCriteria: ObjectLiteral = {};
        Object.keys(order).forEach(key => orderCriteria[key] = [key, order[key]!.toLowerCase()]);
        return orderCriteria;
    }

}