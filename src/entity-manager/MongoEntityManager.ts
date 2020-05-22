import { Connection } from "../connection/Connection";
import { EntityManager } from "./EntityManager";
import { ObjectType } from "../common/ObjectType";
import {
    AggregationCursor,
    BulkWriteOpResultObject,
    ChangeStream,
    ChangeStreamOptions,
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
    ObjectID,
    OrderedBulkOperation,
    ParallelCollectionScanOptions,
    ReadPreference,
    ReplaceOneOptions,
    UnorderedBulkOperation,
    UpdateWriteOpResult
} from "../driver/mongodb/typings";
import { ObjectLiteral } from "../common/ObjectLiteral";
import { MongoQueryRunner } from "../driver/mongodb/MongoQueryRunner";
import { MongoDriver } from "../driver/mongodb/MongoDriver";
import { DocumentToEntityTransformer } from "../query-builder/transformer/DocumentToEntityTransformer";
import { FindManyOptions } from "../find-options/FindManyOptions";
import { FindOptionsUtils } from "../find-options/FindOptionsUtils";
import { FindOneOptions } from "../find-options/FindOneOptions";
import { PlatformTools } from "../platform/PlatformTools";
import { DeepPartial } from "../common/DeepPartial";
import { QueryDeepPartialEntity } from "../query-builder/QueryPartialEntity";
import { InsertResult } from "../query-builder/result/InsertResult";
import { UpdateResult } from "../query-builder/result/UpdateResult";
import { DeleteResult } from "../query-builder/result/DeleteResult";
import { EntityMetadata } from "../metadata/EntityMetadata";
import { EntitySchema, FindConditions } from "../index";
import { BroadcasterResult } from "../subscriber/BroadcasterResult";

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
    async find<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, optionsOrConditions?: FindManyOptions<Entity> | Partial<Entity>): Promise<Entity[]> {
        const query = this.convertFindManyOptionsOrConditionsToMongodbQuery(optionsOrConditions);
        const cursor = await this.createEntityCursor(entityClassOrName, query);
        if (FindOptionsUtils.isFindManyOptions(optionsOrConditions)) {
            if (optionsOrConditions.select)
                cursor.project(this.convertFindOptionsSelectToProjectCriteria(optionsOrConditions.select));
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
    async findAndCount<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, optionsOrConditions?: FindManyOptions<Entity> | Partial<Entity>): Promise<[Entity[], number]> {
        const query = this.convertFindManyOptionsOrConditionsToMongodbQuery(optionsOrConditions);
        const cursor = await this.createEntityCursor(entityClassOrName, query);
        if (FindOptionsUtils.isFindManyOptions(optionsOrConditions)) {
            if (optionsOrConditions.select)
                cursor.project(this.convertFindOptionsSelectToProjectCriteria(optionsOrConditions.select));
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
    async findByIds<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, ids: any[], optionsOrConditions?: FindManyOptions<Entity> | Partial<Entity>): Promise<Entity[]> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        const query = this.convertFindManyOptionsOrConditionsToMongodbQuery(optionsOrConditions) || {};
        const objectIdInstance = PlatformTools.load("mongodb").ObjectID;
        query["_id"] = {
            $in: ids.map(id => {
                if (id instanceof objectIdInstance)
                    return id;

                return id[metadata.objectIdColumn!.propertyName];
            })
        };

        const cursor = await this.createEntityCursor(entityClassOrName, query);
        if (FindOptionsUtils.isFindManyOptions(optionsOrConditions)) {
            if (optionsOrConditions.select)
                cursor.project(this.convertFindOptionsSelectToProjectCriteria(optionsOrConditions.select));
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
    async findOne<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string,
                          optionsOrConditions?: string | string[] | number | number[] | Date | Date[] | ObjectID | ObjectID[] | FindOneOptions<Entity> | DeepPartial<Entity>,
                          maybeOptions?: FindOneOptions<Entity>): Promise<Entity | undefined> {
        const objectIdInstance = PlatformTools.load("mongodb").ObjectID;
        const id = (optionsOrConditions instanceof objectIdInstance) || typeof optionsOrConditions === "string" ? optionsOrConditions : undefined;
        const findOneOptionsOrConditions = (id ? maybeOptions : optionsOrConditions) as any;
        const query = this.convertFindOneOptionsOrConditionsToMongodbQuery(findOneOptionsOrConditions) || {};
        if (id) {
            query["_id"] = (id instanceof objectIdInstance) ? id : new objectIdInstance(id);
        }
        const cursor = await this.createEntityCursor(entityClassOrName, query);
        if (FindOptionsUtils.isFindOneOptions(findOneOptionsOrConditions)) {
            if (findOneOptionsOrConditions.select)
                cursor.project(this.convertFindOptionsSelectToProjectCriteria(findOneOptionsOrConditions.select));
            if (findOneOptionsOrConditions.order)
                cursor.sort(this.convertFindOptionsOrderToOrderCriteria(findOneOptionsOrConditions.order));
        }

        // const result = await cursor.limit(1).next();
        const result = await cursor.limit(1).toArray();
        return result.length > 0 ? result[0] : undefined;
    }

    /**
     * Inserts a given entity into the database.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient INSERT query.
     * Does not check if entity exist in the database, so query will fail if duplicate entity is being inserted.
     * You can execute bulk inserts using this method.
     */
    async insert<Entity>(target: ObjectType<Entity> | EntitySchema<Entity> | string, entity: QueryDeepPartialEntity<Entity> | QueryDeepPartialEntity<Entity>[]): Promise<InsertResult> {
        // todo: convert entity to its database name
        const result = new InsertResult();
        if (Array.isArray(entity)) {
            result.raw = await this.insertMany(target, entity);
            Object.keys(result.raw.insertedIds).forEach((key: any) => {
                let insertedId = result.raw.insertedIds[key];
                result.generatedMaps.push(this.connection.driver.createGeneratedMap(this.connection.getMetadata(target), insertedId)!);
                result.identifiers.push(this.connection.driver.createGeneratedMap(this.connection.getMetadata(target), insertedId)!);
            });

        } else {
            result.raw = await this.insertOne(target, entity);
            result.generatedMaps.push(this.connection.driver.createGeneratedMap(this.connection.getMetadata(target), result.raw.insertedId)!);
            result.identifiers.push(this.connection.driver.createGeneratedMap(this.connection.getMetadata(target), result.raw.insertedId)!);
        }

        return result;
    }

    /**
     * Updates entity partially. Entity can be found by a given conditions.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient UPDATE query.
     * Does not check if entity exist in the database.
     */
    async update<Entity>(target: ObjectType<Entity> | EntitySchema<Entity> | string, criteria: string | string[] | number | number[] | Date | Date[] | ObjectID | ObjectID[] | FindConditions<Entity>, partialEntity: QueryDeepPartialEntity<Entity>): Promise<UpdateResult> {
        if (Array.isArray(criteria)) {
            await Promise.all((criteria as any[]).map(criteriaItem => {
                return this.update(target, criteriaItem, partialEntity);
            }));

        } else {
            const metadata = this.connection.getMetadata(target);
            await this.updateOne(target, this.convertMixedCriteria(metadata, criteria), { $set: partialEntity });
        }

        return new UpdateResult();
    }

    /**
     * Deletes entities by a given conditions.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient DELETE query.
     * Does not check if entity exist in the database.
     */
    async delete<Entity>(target: ObjectType<Entity> | EntitySchema<Entity> | string, criteria: string | string[] | number | number[] | Date | Date[] | ObjectID | ObjectID[] | FindConditions<Entity>): Promise<DeleteResult> {
        if (Array.isArray(criteria)) {
            await Promise.all((criteria as any[]).map(criteriaItem => {
                return this.delete(target, criteriaItem);
            }));

        } else {
            await this.deleteOne(target, this.convertMixedCriteria(this.connection.getMetadata(target), criteria));
        }

        return new DeleteResult();
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     */
    createCursor<Entity, T = any>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, query?: ObjectLiteral): Cursor<T> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.cursor(metadata.tableName, query);
    }

    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     * This returns modified version of cursor that transforms each result into Entity model.
     */
    createEntityCursor<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, query?: ObjectLiteral): Cursor<Entity> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        const cursor = this.createCursor(entityClassOrName, query);
        this.applyEntityTransformationToCursor(metadata, cursor);
        return cursor;
    }

    /**
     * Execute an aggregation framework pipeline against the collection.
     */
    aggregate<Entity, R = any>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, pipeline: ObjectLiteral[], options?: CollectionAggregationOptions): AggregationCursor<R> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.aggregate(metadata.tableName, pipeline, options);
    }

    /**
     * Execute an aggregation framework pipeline against the collection.
     * This returns modified version of cursor that transforms each result into Entity model.
     */
    aggregateEntity<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, pipeline: ObjectLiteral[], options?: CollectionAggregationOptions): AggregationCursor<Entity> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        const cursor = this.queryRunner.aggregate(metadata.tableName, pipeline, options);
        this.applyEntityTransformationToCursor(metadata, cursor);
        return cursor;
    }

    /**
     * Perform a bulkWrite operation without a fluent API.
     */
    bulkWrite<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, operations: ObjectLiteral[], options?: CollectionBulkWriteOptions): Promise<BulkWriteOpResultObject> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.bulkWrite(metadata.tableName, operations, options);
    }

    /**
     * Count number of matching documents in the db to a query.
     */
    count<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, query?: ObjectLiteral, options?: MongoCountPreferences): Promise<number> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.count(metadata.tableName, query, options);
    }

    /**
     * Creates an index on the db and collection.
     */
    createCollectionIndex<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, fieldOrSpec: string | any, options?: MongodbIndexOptions): Promise<string> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.createCollectionIndex(metadata.tableName, fieldOrSpec, options);
    }

    /**
     * Creates multiple indexes in the collection, this method is only supported for MongoDB 2.6 or higher.
     * Earlier version of MongoDB will throw a command not supported error.
     * Index specifications are defined at http://docs.mongodb.org/manual/reference/command/createIndexes/.
     */
    createCollectionIndexes<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, indexSpecs: ObjectLiteral[]): Promise<void> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.createCollectionIndexes(metadata.tableName, indexSpecs);
    }

    /**
     * Delete multiple documents on MongoDB.
     */
    deleteMany<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, query: ObjectLiteral, options?: CollectionOptions): Promise<DeleteWriteOpResultObject> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.deleteMany(metadata.tableName, query, options);
    }

    /**
     * Delete a document on MongoDB.
     */
    deleteOne<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, query: ObjectLiteral, options?: CollectionOptions): Promise<DeleteWriteOpResultObject> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.deleteOne(metadata.tableName, query, options);
    }

    /**
     * The distinct command returns returns a list of distinct values for the given key across a collection.
     */
    distinct<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, key: string, query: ObjectLiteral, options?: { readPreference?: ReadPreference | string }): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.distinct(metadata.tableName, key, query, options);
    }

    /**
     * Drops an index from this collection.
     */
    dropCollectionIndex<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, indexName: string, options?: CollectionOptions): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.dropCollectionIndex(metadata.tableName, indexName, options);
    }

    /**
     * Drops all indexes from the collection.
     */
    dropCollectionIndexes<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.dropCollectionIndexes(metadata.tableName);
    }

    /**
     * Find a document and delete it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndDelete<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, query: ObjectLiteral, options?: { projection?: Object, sort?: Object, maxTimeMS?: number }): Promise<FindAndModifyWriteOpResultObject> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.findOneAndDelete(metadata.tableName, query, options);
    }

    /**
     * Find a document and replace it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndReplace<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, query: ObjectLiteral, replacement: Object, options?: FindOneAndReplaceOption): Promise<FindAndModifyWriteOpResultObject> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.findOneAndReplace(metadata.tableName, query, replacement, options);
    }

    /**
     * Find a document and update it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndUpdate<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, query: ObjectLiteral, update: Object, options?: FindOneAndReplaceOption): Promise<FindAndModifyWriteOpResultObject> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.findOneAndUpdate(metadata.tableName, query, update, options);
    }

    /**
     * Execute a geo search using a geo haystack index on a collection.
     */
    geoHaystackSearch<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, x: number, y: number, options?: GeoHaystackSearchOptions): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.geoHaystackSearch(metadata.tableName, x, y, options);
    }

    /**
     * Execute the geoNear command to search for items in the collection.
     */
    geoNear<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, x: number, y: number, options?: GeoNearOptions): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.geoNear(metadata.tableName, x, y, options);
    }

    /**
     * Run a group command across a collection.
     */
    group<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, keys: Object | Array<any> | Function | Code, condition: Object, initial: Object, reduce: Function | Code, finalize: Function | Code, command: boolean, options?: { readPreference?: ReadPreference | string }): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.group(metadata.tableName, keys, condition, initial, reduce, finalize, command, options);
    }

    /**
     * Retrieve all the indexes on the collection.
     */
    collectionIndexes<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.collectionIndexes(metadata.tableName);
    }

    /**
     * Retrieve all the indexes on the collection.
     */
    collectionIndexExists<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, indexes: string | string[]): Promise<boolean> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.collectionIndexExists(metadata.tableName, indexes);
    }

    /**
     * Retrieves this collections index info.
     */
    collectionIndexInformation<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, options?: { full: boolean }): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.collectionIndexInformation(metadata.tableName, options);
    }

    /**
     * Initiate an In order bulk write operation, operations will be serially executed in the order they are added, creating a new operation for each switch in types.
     */
    initializeOrderedBulkOp<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, options?: CollectionOptions): OrderedBulkOperation {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.initializeOrderedBulkOp(metadata.tableName, options);
    }

    /**
     * Initiate a Out of order batch write operation. All operations will be buffered into insert/update/remove commands executed out of order.
     */
    initializeUnorderedBulkOp<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, options?: CollectionOptions): UnorderedBulkOperation {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.initializeUnorderedBulkOp(metadata.tableName, options);
    }

    /**
     * Inserts an array of documents into MongoDB.
     */
    insertMany<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, docs: ObjectLiteral[], options?: CollectionInsertManyOptions): Promise<InsertWriteOpResult> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.insertMany(metadata.tableName, docs, options);
    }

    /**
     * Inserts a single document into MongoDB.
     */
    insertOne<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, doc: ObjectLiteral, options?: CollectionInsertOneOptions): Promise<InsertOneWriteOpResult> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.insertOne(metadata.tableName, doc, options);
    }

    /**
     * Returns if the collection is a capped collection.
     */
    isCapped<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.isCapped(metadata.tableName);
    }

    /**
     * Get the list of all indexes information for the collection.
     */
    listCollectionIndexes<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, options?: { batchSize?: number, readPreference?: ReadPreference | string }): CommandCursor {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.listCollectionIndexes(metadata.tableName, options);
    }

    /**
     * Run Map Reduce across a collection. Be aware that the inline option for out will return an array of results not a collection.
     */
    mapReduce<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, map: Function | string, reduce: Function | string, options?: MapReduceOptions): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.mapReduce(metadata.tableName, map, reduce, options);
    }

    /**
     * Return N number of parallel cursors for a collection allowing parallel reading of entire collection.
     * There are no ordering guarantees for returned results.
     */
    parallelCollectionScan<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, options?: ParallelCollectionScanOptions): Promise<Cursor<Entity>[]> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.parallelCollectionScan(metadata.tableName, options);
    }

    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    reIndex<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.reIndex(metadata.tableName);
    }

    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    rename<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, newName: string, options?: { dropTarget?: boolean }): Promise<Collection<any>> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.rename(metadata.tableName, newName, options);
    }

    /**
     * Replace a document on MongoDB.
     */
    replaceOne<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, query: ObjectLiteral, doc: ObjectLiteral, options?: ReplaceOneOptions): Promise<UpdateWriteOpResult> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.replaceOne(metadata.tableName, query, doc, options);
    }

    /**
     * Get all the collection statistics.
     */
    stats<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, options?: { scale: number }): Promise<CollStats> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.stats(metadata.tableName, options);
    }

    watch<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, pipeline?: Object[], options?: ChangeStreamOptions): ChangeStream {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.watch(metadata.tableName, pipeline, options);
    }

    /**
     * Update multiple documents on MongoDB.
     */
    updateMany<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, query: ObjectLiteral, update: ObjectLiteral, options?: { upsert?: boolean, w?: any, wtimeout?: number, j?: boolean }): Promise<UpdateWriteOpResult> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.updateMany(metadata.tableName, query, update, options);
    }

    /**
     * Update a single document on MongoDB.
     */
    updateOne<Entity>(entityClassOrName: ObjectType<Entity> | EntitySchema<Entity> | string, query: ObjectLiteral, update: ObjectLiteral, options?: ReplaceOneOptions): Promise<UpdateWriteOpResult> {
        const metadata = this.connection.getMetadata(entityClassOrName);
        return this.queryRunner.updateOne(metadata.tableName, query, update, options);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Converts FindManyOptions to mongodb query.
     */
    protected convertFindManyOptionsOrConditionsToMongodbQuery<Entity>(optionsOrConditions: FindManyOptions<Entity> | Partial<Entity> | undefined): ObjectLiteral | undefined {
        if (!optionsOrConditions)
            return undefined;

        if (FindOptionsUtils.isFindManyOptions(optionsOrConditions))
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
    protected convertFindOneOptionsOrConditionsToMongodbQuery<Entity>(optionsOrConditions: FindOneOptions<Entity> | Partial<Entity> | undefined): ObjectLiteral | undefined {
        if (!optionsOrConditions)
            return undefined;

        if (FindOptionsUtils.isFindOneOptions(optionsOrConditions))
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
    protected convertFindOptionsOrderToOrderCriteria(order: ObjectLiteral) {
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
        }, {} as ObjectLiteral);
    }

    /**
     * Converts FindOptions into mongodb select by criteria.
     */
    protected convertFindOptionsSelectToProjectCriteria(selects: (keyof any)[]) {
        return selects.reduce((projectCriteria, key) => {
            projectCriteria[key] = 1;
            return projectCriteria;
        }, {} as any);
    }

    /**
     * Ensures given id is an id for query.
     */
    protected convertMixedCriteria(metadata: EntityMetadata, idMap: any): ObjectLiteral {
        if (idMap instanceof Object) {
            return metadata.columns.reduce((query, column) => {
                const columnValue = column.getEntityValue(idMap);
                if (columnValue !== undefined)
                    query[column.databasePath] = columnValue;
                return query;
            }, {} as any);
        }

        // means idMap is just object id
        const objectIdInstance = PlatformTools.load("mongodb").ObjectID;
        return {
            "_id": (idMap instanceof objectIdInstance) ? idMap : new objectIdInstance(idMap)
        };
    }

    /**
     * Overrides cursor's toArray and next methods to convert results to entity automatically.
     */
    protected applyEntityTransformationToCursor<Entity>(metadata: EntityMetadata, cursor: Cursor<Entity> | AggregationCursor<Entity>) {
        const ParentCursor = PlatformTools.load("mongodb").Cursor;
        const queryRunner = this.queryRunner;
        cursor.toArray = function (callback?: MongoCallback<Entity[]>) {
            if (callback) {
                ParentCursor.prototype.toArray.call(this, (error: MongoError, results: Entity[]): void => {
                    if (error) {
                        callback(error, results);
                        return;
                    }

                    const transformer = new DocumentToEntityTransformer();
                    const entities = transformer.transformAll(results, metadata);

                    // broadcast "load" events
                    const broadcastResult = new BroadcasterResult();
                    queryRunner.broadcaster.broadcastLoadEventsForAll(broadcastResult, metadata, entities);

                    Promise.all(broadcastResult.promises).then(() => callback(error, entities));
                });
            } else {
                return ParentCursor.prototype.toArray.call(this).then((results: Entity[]) => {
                    const transformer = new DocumentToEntityTransformer();
                    const entities = transformer.transformAll(results, metadata);

                    // broadcast "load" events
                    const broadcastResult = new BroadcasterResult();
                    queryRunner.broadcaster.broadcastLoadEventsForAll(broadcastResult, metadata, entities);

                    return Promise.all(broadcastResult.promises).then(() => entities);
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
                    const entity = transformer.transform(result, metadata);

                    // broadcast "load" events
                    const broadcastResult = new BroadcasterResult();
                    queryRunner.broadcaster.broadcastLoadEventsForAll(broadcastResult, metadata, [entity]);

                    Promise.all(broadcastResult.promises).then(() => callback(error, entity));
                });
            } else {
                return ParentCursor.prototype.next.call(this).then((result: Entity) => {
                    if (!result) return result;

                    const transformer = new DocumentToEntityTransformer();
                    const entity = transformer.transform(result, metadata);

                    // broadcast "load" events
                    const broadcastResult = new BroadcasterResult();
                    queryRunner.broadcaster.broadcastLoadEventsForAll(broadcastResult, metadata, [entity]);

                    return Promise.all(broadcastResult.promises).then(() => entity);
                });
            }
        };
    }

}
