import {ObjectLiteral} from "../common/ObjectLiteral";
import {Repository} from "./Repository";
import {QueryRunnerProvider} from "../query-runner/QueryRunnerProvider";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {FindManyOptions} from "../find-options/FindManyOptions";
import {MongoDriver} from "../driver/mongodb/MongoDriver";
import {MongoQueryRunner} from "../driver/mongodb/MongoQueryRunner";
import {DocumentToEntityTransformer} from "../query-builder/transformer/DocumentToEntityTransformer";
import {FindOneOptions} from "../find-options/FindOneOptions";
import {FindOptionsUtils} from "../find-options/FindOptionsUtils";
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
    CollStats, MongoCallback, MongoError, CursorResult
} from "mongodb";
import {DeepPartial} from "../common/DeepPartial";

/**
 * Repository used to manage mongodb documents of a single entity type.
 */
export class MongoRepository<Entity extends ObjectLiteral> extends Repository<Entity> {

    // todo: implement join from find options too

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
     * Transactions are not supported by MongoDB.
     * Calling this method will return an error.
     */
    transaction(runInTransaction: (repository: Repository<Entity>) => Promise<any>|any): Promise<any> {
        throw new Error(`Transactions aren't supported by MongoDB.`);
    }

    /**
     * Using Query Builder with MongoDB is not supported yet.
     * Calling this method will return an error.
     */
    createQueryBuilder(alias: string, queryRunnerProvider?: QueryRunnerProvider): QueryBuilder<Entity> {
        throw new Error(`Query Builder is not supported by MongoDB.`);
    }

    /**
     * Finds entities that match given find options or conditions.
     */
    async find(optionsOrConditions?: FindManyOptions<Entity>|Partial<Entity>): Promise<Entity[]> {
        const query = this.convertFindManyOptionsOrConditionsToMongodbQuery(optionsOrConditions);
        const cursor = await this.createEntityCursor(query);
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
    async findAndCount(optionsOrConditions?: FindManyOptions<Entity>|Partial<Entity>): Promise<[ Entity[], number ]> {
        const query = this.convertFindManyOptionsOrConditionsToMongodbQuery(optionsOrConditions);
        const cursor = await this.createEntityCursor(query);
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
            this.queryRunner.count(this.metadata.table.name, query),
        ]);
        return [results, parseInt(count)];
    }

    /**
     * Finds entities by ids.
     * Optionally find options can be applied.
     */
    async findByIds(ids: any[], optionsOrConditions?: FindManyOptions<Entity>|Partial<Entity>): Promise<Entity[]> {
        const query = this.convertFindManyOptionsOrConditionsToMongodbQuery(optionsOrConditions) || {};
        query["_id"] = { $in: ids };

        const cursor = await this.createEntityCursor(query);
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
    async findOne(optionsOrConditions?: FindOneOptions<Entity>|Partial<Entity>): Promise<Entity|undefined> {
        const query = this.convertFindOneOptionsOrConditionsToMongodbQuery(optionsOrConditions);
        const cursor = await this.createEntityCursor(query);
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
    async findOneById(id: any, optionsOrConditions?: FindOneOptions<Entity>|Partial<Entity>): Promise<Entity|undefined> {
        const query = this.convertFindOneOptionsOrConditionsToMongodbQuery(optionsOrConditions) || {};
        query["_id"] = id;
        const cursor = await this.createEntityCursor(query);
        if (FindOptionsUtils.isFindOneOptions(optionsOrConditions)) {
            if (optionsOrConditions.order)
                cursor.sort(this.convertFindOptionsOrderToOrderCriteria(optionsOrConditions.order));
        }

        // const result = await cursor.limit(1).next();
        const result = await cursor.limit(1).toArray();
        return result.length > 0 ? result[0] : undefined;
    }

    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     */
    createCursor(query?: ObjectLiteral): Cursor<Entity> {
        return this.queryRunner.cursor(this.metadata.table.name, query);
    }

    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     * This returns modified version of cursor that transforms each result into Entity model.
     */
    createEntityCursor(query?: ObjectLiteral): Cursor<Entity> {
        const cursor = this.createCursor(query);
        const repository = this;
        cursor.toArray = function (callback?: MongoCallback<Entity[]>) {
            if (callback) {
                Cursor.prototype.toArray.call(this, (error: MongoError, results: Entity[]): void => {
                    if (error) {
                        callback(error, results);
                        return;
                    }

                    const transformer = new DocumentToEntityTransformer();
                    return callback(error, transformer.transformAll(results, repository.metadata));
                });
            } else {
                return Cursor.prototype.toArray.call(this).then((results: Entity[]) => {
                    const transformer = new DocumentToEntityTransformer();
                    return transformer.transformAll(results, repository.metadata);
                });
            }
        };
        cursor.next = function (callback?: MongoCallback<CursorResult>) {
            if (callback) {
                Cursor.prototype.next.call(this, (error: MongoError, result: CursorResult): void => {
                    if (error || !result) {
                        callback(error, result);
                        return;
                    }

                    const transformer = new DocumentToEntityTransformer();
                    return callback(error, transformer.transform(result, repository.metadata));
                });
            } else {
                return Cursor.prototype.next.call(this).then((result: Entity) => {
                    if (!result) return result;
                    const transformer = new DocumentToEntityTransformer();
                    return transformer.transform(result, repository.metadata);
                });
            }
        };
        return cursor;
    }

    /**
     * Execute an aggregation framework pipeline against the collection.
     */
    aggregate(pipeline: ObjectLiteral[], options?: CollectionAggregationOptions): AggregationCursor<Entity> {
        return this.queryRunner.aggregate(this.metadata.table.name, pipeline, options);
    }

    /**
     * Perform a bulkWrite operation without a fluent API.
     */
    async bulkWrite(operations: ObjectLiteral[], options?: CollectionBluckWriteOptions): Promise<BulkWriteOpResultObject> {
        return await this.queryRunner.bulkWrite(this.metadata.table.name, operations, options);
    }

    /**
     * Count number of matching documents in the db to a query.
     */
    async count(query?: ObjectLiteral, options?: MongoCountPreferences): Promise<any> {
        return await this.queryRunner.count(this.metadata.table.name, query || {}, options);
    }

    /**
     * Creates an index on the db and collection.
     */
    async createCollectionIndex(fieldOrSpec: string|any, options?: IndexOptions): Promise<string> {
        return await this.queryRunner.createCollectionIndex(this.metadata.table.name, fieldOrSpec, options);
    }

    /**
     * Creates multiple indexes in the collection, this method is only supported for MongoDB 2.6 or higher.
     * Earlier version of MongoDB will throw a command not supported error.
     * Index specifications are defined at http://docs.mongodb.org/manual/reference/command/createIndexes/.
     */
    async createCollectionIndexes(indexSpecs: ObjectLiteral[]): Promise<void> {
        return await this.queryRunner.createCollectionIndexes(this.metadata.table.name, indexSpecs);
    }

    /**
     * Delete multiple documents on MongoDB.
     */
    async deleteMany(query: ObjectLiteral, options?: CollectionOptions): Promise<DeleteWriteOpResultObject> {
        return await this.queryRunner.deleteMany(this.metadata.table.name, query, options);
    }

    /**
     * Delete a document on MongoDB.
     */
    async deleteOne(query: ObjectLiteral, options?: CollectionOptions): Promise<DeleteWriteOpResultObject> {
        return await this.queryRunner.deleteOne(this.metadata.table.name, query, options);
    }

    /**
     * The distinct command returns returns a list of distinct values for the given key across a collection.
     */
    async distinct(key: string, query: ObjectLiteral, options?: { readPreference?: ReadPreference|string }): Promise<any> {
        return await this.queryRunner.distinct(this.metadata.table.name, key, query, options);
    }

    /**
     * Drops an index from this collection.
     */
    async dropCollectionIndex(indexName: string, options?: CollectionOptions): Promise<any> {
        return await this.queryRunner.dropCollectionIndex(this.metadata.table.name, indexName, options);
    }

    /**
     * Drops all indexes from the collection.
     */
    async dropCollectionIndexes(): Promise<any> {
        return await this.queryRunner.dropCollectionIndexes(this.metadata.table.name);
    }

    /**
     * Find a document and delete it in one atomic operation, requires a write lock for the duration of the operation.
     */
    async findOneAndDelete(query: ObjectLiteral, options?: { projection?: Object, sort?: Object, maxTimeMS?: number }): Promise<FindAndModifyWriteOpResultObject> {
        return await this.queryRunner.findOneAndDelete(this.metadata.table.name, query, options);
    }

    /**
     * Find a document and replace it in one atomic operation, requires a write lock for the duration of the operation.
     */
    async findOneAndReplace(query: ObjectLiteral, replacement: Object, options?: FindOneAndReplaceOption): Promise<FindAndModifyWriteOpResultObject> {
        return await this.queryRunner.findOneAndReplace(this.metadata.table.name, query, replacement, options);
    }

    /**
     * Find a document and update it in one atomic operation, requires a write lock for the duration of the operation.
     */
    async findOneAndUpdate(query: ObjectLiteral, update: Object, options?: FindOneAndReplaceOption): Promise<FindAndModifyWriteOpResultObject> {
        return await this.queryRunner.findOneAndUpdate(this.metadata.table.name, query, update, options);
    }

    /**
     * Execute a geo search using a geo haystack index on a collection.
     */
    async geoHaystackSearch(x: number, y: number, options?: GeoHaystackSearchOptions): Promise<any> {
        return await this.queryRunner.geoHaystackSearch(this.metadata.table.name, x, y, options);
    }

    /**
     * Execute the geoNear command to search for items in the collection.
     */
    async geoNear(x: number, y: number, options?: GeoNearOptions): Promise<any> {
        return await this.queryRunner.geoNear(this.metadata.table.name, x, y, options);
    }

    /**
     * Run a group command across a collection.
     */
    async group(keys: Object|Array<any>|Function|Code, condition: Object, initial: Object, reduce: Function|Code, finalize: Function|Code, command: boolean, options?: { readPreference?: ReadPreference | string }): Promise<any> {
        return await this.queryRunner.group(this.metadata.table.name, keys, condition, initial, reduce, finalize, command, options);
    }

    /**
     * Retrieve all the indexes on the collection.
     */
    async collectionIndexes(): Promise<any> {
        return await this.queryRunner.collectionIndexes(this.metadata.table.name);
    }

    /**
     * Retrieve all the indexes on the collection.
     */
    async collectionIndexExists(indexes: string|string[]): Promise<boolean> {
        return await this.queryRunner.collectionIndexExists(this.metadata.table.name, indexes);
    }

    /**
     * Retrieves this collections index info.
     */
    async collectionIndexInformation(options?: { full: boolean }): Promise<any> {
        return await this.queryRunner.collectionIndexInformation(this.metadata.table.name, options);
    }

    /**
     * Initiate an In order bulk write operation, operations will be serially executed in the order they are added, creating a new operation for each switch in types.
     */
    initializeOrderedBulkOp(options?: CollectionOptions): OrderedBulkOperation {
        return this.queryRunner.initializeOrderedBulkOp(this.metadata.table.name, options);
    }

    /**
     * Initiate a Out of order batch write operation. All operations will be buffered into insert/update/remove commands executed out of order.
     */
    initializeUnorderedBulkOp(options?: CollectionOptions): UnorderedBulkOperation {
        return this.queryRunner.initializeUnorderedBulkOp(this.metadata.table.name, options);
    }

    /**
     * Inserts an array of documents into MongoDB.
     */
    async insertMany(docs: ObjectLiteral[], options?: CollectionInsertManyOptions): Promise<InsertWriteOpResult> {
        return await this.queryRunner.insertMany(this.metadata.table.name, docs, options);
    }

    /**
     * Inserts a single document into MongoDB.
     */
    async insertOne(doc: ObjectLiteral, options?: CollectionInsertOneOptions): Promise<InsertOneWriteOpResult> {
        return await this.queryRunner.insertOne(this.metadata.table.name, doc, options);
    }

    /**
     * Returns if the collection is a capped collection.
     */
    async isCapped(): Promise<any> {
        return await this.queryRunner.isCapped(this.metadata.table.name);
    }

    /**
     * Get the list of all indexes information for the collection.
     */
    listCollectionIndexes(options?: { batchSize?: number, readPreference?: ReadPreference|string }): CommandCursor {
        return this.queryRunner.listCollectionIndexes(this.metadata.table.name, options);
    }

    /**
     * Run Map Reduce across a collection. Be aware that the inline option for out will return an array of results not a collection.
     */
    async mapReduce(map: Function|string, reduce: Function|string, options?: MapReduceOptions): Promise<any> {
        return await this.queryRunner.mapReduce(this.metadata.table.name, map, reduce, options);
    }

    /**
     * Return N number of parallel cursors for a collection allowing parallel reading of entire collection.
     * There are no ordering guarantees for returned results.
     */
    async parallelCollectionScan(options?: ParallelCollectionScanOptions): Promise<Cursor<Entity>[]> {
        return await this.queryRunner.parallelCollectionScan(this.metadata.table.name, options);
    }

    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    async reIndex(): Promise<any> {
        return await this.queryRunner.reIndex(this.metadata.table.name);
    }

    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    async rename(newName: string, options?: { dropTarget?: boolean }): Promise<Collection> {
        return await this.queryRunner.rename(this.metadata.table.name, newName, options);
    }

    /**
     * Replace a document on MongoDB.
     */
    async replaceOne(query: ObjectLiteral, doc: ObjectLiteral, options?: ReplaceOneOptions): Promise<UpdateWriteOpResult> {
        return await this.queryRunner.replaceOne(this.metadata.table.name, query, doc, options);
    }

    /**
     * Get all the collection statistics.
     */
    async stats(options?: { scale: number }): Promise<CollStats> {
        return await this.queryRunner.stats(this.metadata.table.name, options);
    }

    /**
     * Update multiple documents on MongoDB.
     */
    async updateMany(query: ObjectLiteral, update: ObjectLiteral, options?: { upsert?: boolean, w?: any, wtimeout?: number, j?: boolean }): Promise<UpdateWriteOpResult> {
        return await this.queryRunner.updateMany(this.metadata.table.name, query, update, options);
    }

    /**
     * Update a single document on MongoDB.
     */
    async updateOne(query: ObjectLiteral, update: ObjectLiteral, options?: ReplaceOneOptions): Promise<UpdateWriteOpResult> {
        return await this.queryRunner.updateOne(this.metadata.table.name, query, update, options);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    // todo: extra these methods into separate class

    protected get queryRunner(): MongoQueryRunner {
        return (this.connection.driver as MongoDriver).queryRunner;
    }

    protected convertFindManyOptionsOrConditionsToMongodbQuery(optionsOrConditions: FindOneOptions<Entity>|Partial<Entity>|undefined): ObjectLiteral|undefined {
        if (!optionsOrConditions)
            return undefined;

        return FindOptionsUtils.isFindManyOptions(optionsOrConditions) ? optionsOrConditions.where : optionsOrConditions;
    }

    protected convertFindOneOptionsOrConditionsToMongodbQuery(optionsOrConditions: FindOneOptions<Entity>|Partial<Entity>|undefined): ObjectLiteral|undefined {
        if (!optionsOrConditions)
            return undefined;

        return FindOptionsUtils.isFindOneOptions(optionsOrConditions) ? optionsOrConditions.where : optionsOrConditions;
    }

    protected convertFindOptionsOrderToOrderCriteria<P>(order: { [P in keyof Entity]?: "ASC"|"DESC" }) {
        const orderCriteria: ObjectLiteral = {};
        Object.keys(order).forEach(key => orderCriteria[key] = [key, order[key]!.toLowerCase()]);
        return orderCriteria;
    }

}