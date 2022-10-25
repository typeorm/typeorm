import { DataSource } from "../data-source/DataSource"
import { EntityManager } from "./EntityManager"
import { EntityTarget } from "../common/EntityTarget"
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
    UpdateWriteOpResult,
} from "../driver/mongodb/typings"
import { ObjectLiteral } from "../common/ObjectLiteral"
import { MongoQueryRunner } from "../driver/mongodb/MongoQueryRunner"
import { MongoDriver } from "../driver/mongodb/MongoDriver"
import { DocumentToEntityTransformer } from "../query-builder/transformer/DocumentToEntityTransformer"
import { FindOptionsUtils } from "../find-options/FindOptionsUtils"
import { PlatformTools } from "../platform/PlatformTools"
import { QueryDeepPartialEntity } from "../query-builder/QueryPartialEntity"
import { InsertResult } from "../query-builder/result/InsertResult"
import { UpdateResult } from "../query-builder/result/UpdateResult"
import { DeleteResult } from "../query-builder/result/DeleteResult"
import { EntityMetadata } from "../metadata/EntityMetadata"
import { FindOptionsWhere } from "../find-options/FindOptionsWhere"
import {
    FindOptionsSelect,
    FindOptionsSelectByString,
} from "../find-options/FindOptionsSelect"
import { MongoFindManyOptions } from "../find-options/mongodb/MongoFindManyOptions"
import { MongoFindOneOptions } from "../find-options/mongodb/MongoFindOneOptions"
import { ColumnMetadata } from "../metadata/ColumnMetadata"
import { ObjectUtils } from "../util/ObjectUtils"
import { isValidObjectId } from "../util/MongoUtils"

/**
 * Entity manager supposed to work with any entity, automatically find its repository and call its methods,
 * whatever entity type are you passing.
 *
 * This implementation is used for MongoDB driver which has some specifics in its EntityManager.
 */
export class MongoEntityManager extends EntityManager {
    readonly "@instanceof" = Symbol.for("MongoEntityManager")

    get mongoQueryRunner(): MongoQueryRunner {
        return (this.connection.driver as MongoDriver)
            .queryRunner as MongoQueryRunner
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: DataSource) {
        super(connection)
    }

    // -------------------------------------------------------------------------
    // Overridden Methods
    // -------------------------------------------------------------------------

    /**
     * Finds entities that match given find options.
     */
    async find<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        options?: MongoFindManyOptions<Entity>,
    ): Promise<Entity[]> {
        return this.executeFind(entityClassOrName, options)
    }

    /**
     * Finds entities that match given conditions.
     */
    async findBy<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        where: any,
    ): Promise<Entity[]> {
        return this.executeFind(entityClassOrName, where)
    }

    /**
     * Finds entities that match given find options.
     */
    async findAndCount<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        options?: MongoFindManyOptions<Entity>,
    ): Promise<[Entity[], number]> {
        return this.executeFindAndCount(entityClassOrName, options)
    }

    /**
     * Finds entities that match given where conditions.
     */
    async findAndCountBy<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        where: any,
    ): Promise<[Entity[], number]> {
        return this.executeFindAndCount(entityClassOrName, where)
    }

    /**
     * Finds entities by ids.
     * Optionally find options can be applied.
     *
     * @deprecated use `findBy` method instead.
     */
    async findByIds<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        ids: any[],
        optionsOrConditions?: any,
    ): Promise<Entity[]> {
        console.log(`[DEPRECATED] use "findBy" method instead`)
        const metadata = this.connection.getMetadata(entityClassOrName)
        const query =
            this.convertFindManyOptionsOrConditionsToMongodbQuery(
                optionsOrConditions,
            ) || {}

        const objectIdInstance = PlatformTools.load("mongodb").ObjectID
        query["_id"] = {
            $in: ids.map((id) => {
                if (typeof id === "string") {
                    return new objectIdInstance(id)
                }

                if (ObjectUtils.isObject(id)) {
                    if (id instanceof objectIdInstance) {
                        return id
                    }

                    const propertyName = metadata.objectIdColumn!.propertyName

                    if ((id as any)[propertyName] instanceof objectIdInstance) {
                        return (id as any)[propertyName]
                    }
                }
            }),
        }

        const results = await this.executeFind(entityClassOrName, {
            ...optionsOrConditions,
            where: query,
        })

        return results

        // const cursor = await this.createEntityCursor(entityClassOrName, query)
        // const deleteDateColumn =
        //     this.connection.getMetadata(entityClassOrName).deleteDateColumn
        // if (FindOptionsUtils.isFindManyOptions(optionsOrConditions)) {
        //     if (optionsOrConditions.select)
        //         cursor.project(
        //             this.convertFindOptionsSelectToProjectCriteria(
        //                 optionsOrConditions.select,
        //             ),
        //         )
        //     if (optionsOrConditions.skip) cursor.skip(optionsOrConditions.skip)
        //     if (optionsOrConditions.take) cursor.limit(optionsOrConditions.take)
        //     if (optionsOrConditions.order)
        //         cursor.sort(
        //             this.convertFindOptionsOrderToOrderCriteria(
        //                 optionsOrConditions.order,
        //             ),
        //         )
        //     if (deleteDateColumn && !optionsOrConditions.withDeleted) {
        //         this.filterSoftDeleted(cursor, deleteDateColumn, query)
        //     }
        // } else if (deleteDateColumn) {
        //     this.filterSoftDeleted(cursor, deleteDateColumn, query)
        // }
        // return await cursor.toArray()
    }

    /**
     * Finds first entity that matches given find options.
     */
    async findOne<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        options: MongoFindOneOptions<Entity>,
    ): Promise<Entity | null> {
        // return this.executeFindOne(entityClassOrName, options)
        const results = await this.executeFind(entityClassOrName, {
            ...options,
            take: 1,
        })
        return results.length > 0 ? results[0] : null
    }

    /**
     * Finds first entity that matches given WHERE conditions.
     */
    async findOneBy<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        where: any,
    ): Promise<Entity | null> {
        // return this.executeFindOne(entityClassOrName, where)

        const results = await this.executeFind(entityClassOrName, {
            where,
            take: 1,
        })
        return results.length > 0 ? results[0] : null
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
    async findOneById<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        id:
            | string
            | string[]
            | number
            | number[]
            | Date
            | Date[]
            | ObjectID
            | ObjectID[],
    ): Promise<Entity | null> {
        // return this.executeFindOne(entityClassOrName, id)
        console.log(`[DEPRECATED] use "findOneBy" method instead`)

        const objectIdInstance = PlatformTools.load("mongodb").ObjectID

        let _id
        if (id instanceof objectIdInstance) _id = id
        if (typeof id === "string" && isValidObjectId(id))
            _id = new objectIdInstance(id)

        if (typeof _id == "undefined") {
            console.log(`_id is invalid.`)
            return null
        }

        const results = await this.executeFind(entityClassOrName, {
            where: { _id },
            take: 1,
        })
        return results.length > 0 ? results[0] : null
    }

    /**
     * Inserts a given entity into the database.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient INSERT query.
     * Does not check if entity exist in the database, so query will fail if duplicate entity is being inserted.
     * You can execute bulk inserts using this method.
     */
    async insert<Entity>(
        target: EntityTarget<Entity>,
        entity:
            | QueryDeepPartialEntity<Entity>
            | QueryDeepPartialEntity<Entity>[],
    ): Promise<InsertResult> {
        // todo: convert entity to its database name
        const result = new InsertResult()
        if (Array.isArray(entity)) {
            result.raw = await this.insertMany(target, entity)
            Object.keys(result.raw.insertedIds).forEach((key: any) => {
                let insertedId = result.raw.insertedIds[key]
                result.generatedMaps.push(
                    this.connection.driver.createGeneratedMap(
                        this.connection.getMetadata(target),
                        insertedId,
                    )!,
                )
                result.identifiers.push(
                    this.connection.driver.createGeneratedMap(
                        this.connection.getMetadata(target),
                        insertedId,
                    )!,
                )
            })
        } else {
            result.raw = await this.insertOne(target, entity)
            result.generatedMaps.push(
                this.connection.driver.createGeneratedMap(
                    this.connection.getMetadata(target),
                    result.raw.insertedId,
                )!,
            )
            result.identifiers.push(
                this.connection.driver.createGeneratedMap(
                    this.connection.getMetadata(target),
                    result.raw.insertedId,
                )!,
            )
        }

        return result
    }

    /**
     * Updates entity partially. Entity can be found by a given conditions.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient UPDATE query.
     * Does not check if entity exist in the database.
     */
    async update<Entity>(
        target: EntityTarget<Entity>,
        criteria:
            | string
            | string[]
            | number
            | number[]
            | Date
            | Date[]
            | ObjectID
            | ObjectID[]
            | FindOptionsWhere<Entity>,
        partialEntity: QueryDeepPartialEntity<Entity>,
    ): Promise<UpdateResult> {
        const result = new UpdateResult()

        if (Array.isArray(criteria)) {
            const updateResults = await Promise.all(
                (criteria as any[]).map((criteriaItem) => {
                    return this.update(target, criteriaItem, partialEntity)
                }),
            )

            result.raw = updateResults.map((r) => r.raw)
            result.affected = updateResults
                .map((r) => r.affected || 0)
                .reduce((c, r) => c + r, 0)
            result.generatedMaps = updateResults.reduce(
                (c, r) => c.concat(r.generatedMaps),
                [] as ObjectLiteral[],
            )
        } else {
            const metadata = this.connection.getMetadata(target)
            const mongoResult = await this.updateMany(
                target,
                this.convertMixedCriteria(metadata, criteria),
                { $set: partialEntity },
            )

            result.raw = mongoResult
            result.affected = mongoResult.modifiedCount
        }

        return result
    }

    /**
     * Deletes entities by a given conditions.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient DELETE query.
     * Does not check if entity exist in the database.
     */
    async delete<Entity>(
        target: EntityTarget<Entity>,
        criteria:
            | string
            | string[]
            | number
            | number[]
            | Date
            | Date[]
            | ObjectID
            | ObjectID[]
            | FindOptionsWhere<Entity>,
    ): Promise<DeleteResult> {
        const result = new DeleteResult()

        if (Array.isArray(criteria)) {
            const deleteResults = await Promise.all(
                (criteria as any[]).map((criteriaItem) => {
                    return this.delete(target, criteriaItem)
                }),
            )

            result.raw = deleteResults.map((r) => r.raw)
            result.affected = deleteResults
                .map((r) => r.affected || 0)
                .reduce((c, r) => c + r, 0)
        } else {
            const mongoResult = await this.deleteMany(
                target,
                this.convertMixedCriteria(
                    this.connection.getMetadata(target),
                    criteria,
                ),
            )

            result.raw = mongoResult
            result.affected = mongoResult.deletedCount
        }

        return result
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     */
    createCursor<Entity, T = any>(
        entityClassOrName: EntityTarget<Entity>,
        query?: ObjectLiteral,
    ): Cursor<T> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.cursor(metadata.tableName, query)
    }

    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     * This returns modified version of cursor that transforms each result into Entity model.
     */
    createEntityCursor<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        query?: ObjectLiteral,
    ): Cursor<Entity> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        const cursor = this.createCursor(entityClassOrName, query)
        this.applyEntityTransformationToCursor(metadata, cursor)
        return cursor
    }

    /**
     * Execute an aggregation framework pipeline against the collection.
     */
    aggregate<Entity, R = any>(
        entityClassOrName: EntityTarget<Entity>,
        pipeline: ObjectLiteral[],
        options?: CollectionAggregationOptions,
    ): AggregationCursor<R> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.aggregate(
            metadata.tableName,
            pipeline,
            options,
        )
    }

    /**
     * Execute an aggregation framework pipeline against the collection.
     * This returns modified version of cursor that transforms each result into Entity model.
     */
    aggregateEntity<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        pipeline: ObjectLiteral[],
        options?: CollectionAggregationOptions,
    ): AggregationCursor<Entity> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        const cursor = this.mongoQueryRunner.aggregate(
            metadata.tableName,
            pipeline,
            options,
        )
        this.applyEntityTransformationToCursor(metadata, cursor)
        return cursor
    }

    /**
     * Perform a bulkWrite operation without a fluent API.
     */
    bulkWrite<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        operations: ObjectLiteral[],
        options?: CollectionBulkWriteOptions,
    ): Promise<BulkWriteOpResultObject> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.bulkWrite(
            metadata.tableName,
            operations,
            options,
        )
    }

    /**
     * Count number of matching documents in the db to a query.
     */
    count<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        query?: ObjectLiteral,
        options?: MongoCountPreferences,
    ): Promise<number> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.count(metadata.tableName, query, options)
    }

    /**
     * Count number of matching documents in the db to a query.
     */
    countBy<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        query?: ObjectLiteral,
        options?: MongoCountPreferences,
    ): Promise<number> {
        return this.count(entityClassOrName, query, options)
    }

    /**
     * Creates an index on the db and collection.
     */
    createCollectionIndex<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        fieldOrSpec: string | any,
        options?: MongodbIndexOptions,
    ): Promise<string> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.createCollectionIndex(
            metadata.tableName,
            fieldOrSpec,
            options,
        )
    }

    /**
     * Creates multiple indexes in the collection, this method is only supported for MongoDB 2.6 or higher.
     * Earlier version of MongoDB will throw a command not supported error.
     * Index specifications are defined at http://docs.mongodb.org/manual/reference/command/createIndexes/.
     */
    createCollectionIndexes<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        indexSpecs: ObjectLiteral[],
    ): Promise<void> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.createCollectionIndexes(
            metadata.tableName,
            indexSpecs,
        )
    }

    /**
     * Delete multiple documents on MongoDB.
     */
    deleteMany<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        query: ObjectLiteral,
        options?: CollectionOptions,
    ): Promise<DeleteWriteOpResultObject> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.deleteMany(
            metadata.tableName,
            query,
            options,
        )
    }

    /**
     * Delete a document on MongoDB.
     */
    deleteOne<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        query: ObjectLiteral,
        options?: CollectionOptions,
    ): Promise<DeleteWriteOpResultObject> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.deleteOne(
            metadata.tableName,
            query,
            options,
        )
    }

    /**
     * The distinct command returns returns a list of distinct values for the given key across a collection.
     */
    distinct<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        key: string,
        query: ObjectLiteral,
        options?: { readPreference?: ReadPreference | string },
    ): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.distinct(
            metadata.tableName,
            key,
            query,
            options,
        )
    }

    /**
     * Drops an index from this collection.
     */
    dropCollectionIndex<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        indexName: string,
        options?: CollectionOptions,
    ): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.dropCollectionIndex(
            metadata.tableName,
            indexName,
            options,
        )
    }

    /**
     * Drops all indexes from the collection.
     */
    dropCollectionIndexes<Entity>(
        entityClassOrName: EntityTarget<Entity>,
    ): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.dropCollectionIndexes(metadata.tableName)
    }

    /**
     * Find a document and delete it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndDelete<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        query: ObjectLiteral,
        options?: { projection?: Object; sort?: Object; maxTimeMS?: number },
    ): Promise<FindAndModifyWriteOpResultObject> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.findOneAndDelete(
            metadata.tableName,
            query,
            options,
        )
    }

    /**
     * Find a document and replace it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndReplace<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        query: ObjectLiteral,
        replacement: Object,
        options?: FindOneAndReplaceOption,
    ): Promise<FindAndModifyWriteOpResultObject> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.findOneAndReplace(
            metadata.tableName,
            query,
            replacement,
            options,
        )
    }

    /**
     * Find a document and update it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndUpdate<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        query: ObjectLiteral,
        update: Object,
        options?: FindOneAndReplaceOption,
    ): Promise<FindAndModifyWriteOpResultObject> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.findOneAndUpdate(
            metadata.tableName,
            query,
            update,
            options,
        )
    }

    /**
     * Execute a geo search using a geo haystack index on a collection.
     */
    geoHaystackSearch<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        x: number,
        y: number,
        options?: GeoHaystackSearchOptions,
    ): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.geoHaystackSearch(
            metadata.tableName,
            x,
            y,
            options,
        )
    }

    /**
     * Execute the geoNear command to search for items in the collection.
     */
    geoNear<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        x: number,
        y: number,
        options?: GeoNearOptions,
    ): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.geoNear(metadata.tableName, x, y, options)
    }

    /**
     * Run a group command across a collection.
     */
    group<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        keys: Object | Array<any> | Function | Code,
        condition: Object,
        initial: Object,
        reduce: Function | Code,
        finalize: Function | Code,
        command: boolean,
        options?: { readPreference?: ReadPreference | string },
    ): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.group(
            metadata.tableName,
            keys,
            condition,
            initial,
            reduce,
            finalize,
            command,
            options,
        )
    }

    /**
     * Retrieve all the indexes on the collection.
     */
    collectionIndexes<Entity>(
        entityClassOrName: EntityTarget<Entity>,
    ): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.collectionIndexes(metadata.tableName)
    }

    /**
     * Retrieve all the indexes on the collection.
     */
    collectionIndexExists<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        indexes: string | string[],
    ): Promise<boolean> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.collectionIndexExists(
            metadata.tableName,
            indexes,
        )
    }

    /**
     * Retrieves this collections index info.
     */
    collectionIndexInformation<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        options?: { full: boolean },
    ): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.collectionIndexInformation(
            metadata.tableName,
            options,
        )
    }

    /**
     * Initiate an In order bulk write operation, operations will be serially executed in the order they are added, creating a new operation for each switch in types.
     */
    initializeOrderedBulkOp<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        options?: CollectionOptions,
    ): OrderedBulkOperation {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.initializeOrderedBulkOp(
            metadata.tableName,
            options,
        )
    }

    /**
     * Initiate a Out of order batch write operation. All operations will be buffered into insert/update/remove commands executed out of order.
     */
    initializeUnorderedBulkOp<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        options?: CollectionOptions,
    ): UnorderedBulkOperation {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.initializeUnorderedBulkOp(
            metadata.tableName,
            options,
        )
    }

    /**
     * Inserts an array of documents into MongoDB.
     */
    insertMany<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        docs: ObjectLiteral[],
        options?: CollectionInsertManyOptions,
    ): Promise<InsertWriteOpResult> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.insertMany(
            metadata.tableName,
            docs,
            options,
        )
    }

    /**
     * Inserts a single document into MongoDB.
     */
    insertOne<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        doc: ObjectLiteral,
        options?: CollectionInsertOneOptions,
    ): Promise<InsertOneWriteOpResult> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.insertOne(metadata.tableName, doc, options)
    }

    /**
     * Returns if the collection is a capped collection.
     */
    isCapped<Entity>(entityClassOrName: EntityTarget<Entity>): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.isCapped(metadata.tableName)
    }

    /**
     * Get the list of all indexes information for the collection.
     */
    listCollectionIndexes<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        options?: {
            batchSize?: number
            readPreference?: ReadPreference | string
        },
    ): CommandCursor {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.listCollectionIndexes(
            metadata.tableName,
            options,
        )
    }

    /**
     * Run Map Reduce across a collection. Be aware that the inline option for out will return an array of results not a collection.
     */
    mapReduce<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        map: Function | string,
        reduce: Function | string,
        options?: MapReduceOptions,
    ): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.mapReduce(
            metadata.tableName,
            map,
            reduce,
            options,
        )
    }

    /**
     * Return N number of parallel cursors for a collection allowing parallel reading of entire collection.
     * There are no ordering guarantees for returned results.
     */
    parallelCollectionScan<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        options?: ParallelCollectionScanOptions,
    ): Promise<Cursor<Entity>[]> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.parallelCollectionScan(
            metadata.tableName,
            options,
        )
    }

    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    reIndex<Entity>(entityClassOrName: EntityTarget<Entity>): Promise<any> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.reIndex(metadata.tableName)
    }

    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    rename<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        newName: string,
        options?: { dropTarget?: boolean },
    ): Promise<Collection<any>> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.rename(
            metadata.tableName,
            newName,
            options,
        )
    }

    /**
     * Replace a document on MongoDB.
     */
    replaceOne<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        query: ObjectLiteral,
        doc: ObjectLiteral,
        options?: ReplaceOneOptions,
    ): Promise<UpdateWriteOpResult> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.replaceOne(
            metadata.tableName,
            query,
            doc,
            options,
        )
    }

    /**
     * Get all the collection statistics.
     */
    stats<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        options?: { scale: number },
    ): Promise<CollStats> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.stats(metadata.tableName, options)
    }

    watch<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        pipeline?: Object[],
        options?: ChangeStreamOptions,
    ): ChangeStream {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.watch(
            metadata.tableName,
            pipeline,
            options,
        )
    }

    /**
     * Update multiple documents on MongoDB.
     */
    updateMany<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        query: ObjectLiteral,
        update: ObjectLiteral,
        options?: { upsert?: boolean; w?: any; wtimeout?: number; j?: boolean },
    ): Promise<UpdateWriteOpResult> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.updateMany(
            metadata.tableName,
            query,
            update,
            options,
        )
    }

    /**
     * Update a single document on MongoDB.
     */
    updateOne<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        query: ObjectLiteral,
        update: ObjectLiteral,
        options?: ReplaceOneOptions,
    ): Promise<UpdateWriteOpResult> {
        const metadata = this.connection.getMetadata(entityClassOrName)
        return this.mongoQueryRunner.updateOne(
            metadata.tableName,
            query,
            update,
            options,
        )
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Converts FindManyOptions to mongodb query.
     */
    protected convertFindManyOptionsOrConditionsToMongodbQuery<Entity>(
        optionsOrConditions:
            | MongoFindManyOptions<Entity>
            | Partial<Entity>
            | any[]
            | undefined,
    ): ObjectLiteral | undefined {
        if (!optionsOrConditions) return undefined

        if (FindOptionsUtils.isFindManyOptions<Entity>(optionsOrConditions))
            // If where condition is passed as a string which contains sql we have to ignore
            // as mongo is not a sql database
            return typeof optionsOrConditions.where === "string"
                ? {}
                : optionsOrConditions.where

        return optionsOrConditions
    }

    /**
     * Converts FindOneOptions to mongodb query.
     */
    protected convertFindOneOptionsOrConditionsToMongodbQuery<Entity>(
        optionsOrConditions:
            | MongoFindOneOptions<Entity>
            | Partial<Entity>
            | undefined,
    ): ObjectLiteral | undefined {
        if (!optionsOrConditions) return undefined

        if (FindOptionsUtils.isFindOneOptions<Entity>(optionsOrConditions))
            // If where condition is passed as a string which contains sql we have to ignore
            // as mongo is not a sql database
            return typeof optionsOrConditions.where === "string"
                ? {}
                : optionsOrConditions.where

        return optionsOrConditions
    }

    /**
     * Converts FindOptions into mongodb order by criteria.
     */
    protected convertFindOptionsOrderToOrderCriteria(order: ObjectLiteral) {
        return Object.keys(order).reduce((orderCriteria, key) => {
            switch (order[key]) {
                case "DESC":
                    orderCriteria[key] = -1
                    break
                case "ASC":
                    orderCriteria[key] = 1
                    break
                default:
                    orderCriteria[key] = order[key]
            }
            return orderCriteria
        }, {} as ObjectLiteral)
    }

    /**
     * Converts FindOptions into mongodb select by criteria.
     */
    protected convertFindOptionsSelectToProjectCriteria(
        selects: FindOptionsSelect<any> | FindOptionsSelectByString<any>,
    ) {
        if (Array.isArray(selects)) {
            const options: { [key: string | number | symbol]: number } = {}
            selects.map((select) => (options[select] = 1))
            return options

            // return selects.reduce((projectCriteria, key) => {
            //     projectCriteria[key] = 1
            //     return projectCriteria
            // }, {} as any)
        } else {
            // todo: implement
            return selects
        }
    }

    /**
     * Ensures given id is an id for query.
     */
    protected convertMixedCriteria(
        metadata: EntityMetadata,
        idMap: any,
    ): ObjectLiteral {
        const objectIdInstance = PlatformTools.load("mongodb").ObjectID

        // check first if it's ObjectId compatible:
        // string, number, Buffer, ObjectId or ObjectId-like
        if (objectIdInstance.isValid(idMap)) {
            return {
                _id: new objectIdInstance(idMap),
            }
        }

        // if it's some other type of object build a query from the columns
        // this check needs to be after the ObjectId check, because a valid ObjectId is also an Object instance
        if (ObjectUtils.isObject(idMap)) {
            return metadata.columns.reduce((query, column) => {
                const columnValue = column.getEntityValue(idMap)
                if (columnValue !== undefined)
                    query[column.databasePath] = columnValue
                return query
            }, {} as any)
        }

        // last resort: try to convert it to an ObjectID anyway
        // most likely it will fail, but we want to be backwards compatible and keep the same thrown Errors.
        // it can still pass with null/undefined
        return {
            _id: new objectIdInstance(idMap),
        }
    }

    /**
     * Overrides cursor's toArray and next methods to convert results to entity automatically.
     */
    protected applyEntityTransformationToCursor<Entity extends ObjectLiteral>(
        metadata: EntityMetadata,
        cursor: Cursor<Entity> | AggregationCursor<Entity>,
    ) {
        // mongdb-3.7 exports Cursor, mongodb-4.2 exports FindCursor, provide support for both.
        const ParentCursor =
            PlatformTools.load("mongodb").Cursor ||
            PlatformTools.load("mongodb").FindCursor
        const queryRunner = this.mongoQueryRunner
        cursor.toArray = function (callback?: MongoCallback<Entity[]>) {
            if (callback) {
                ParentCursor.prototype.toArray.call(
                    this,
                    (error: MongoError, results: Entity[]): void => {
                        if (error) {
                            callback(error, results)
                            return
                        }

                        const transformer = new DocumentToEntityTransformer()
                        const entities = transformer.transformAll(
                            results,
                            metadata,
                        )

                        // broadcast "load" events
                        queryRunner.broadcaster
                            .broadcast("Load", metadata, entities)
                            .then(() => callback(error, entities))
                    },
                )
            } else {
                return ParentCursor.prototype.toArray
                    .call(this)
                    .then((results: Entity[]) => {
                        const transformer = new DocumentToEntityTransformer()
                        const entities = transformer.transformAll(
                            results,
                            metadata,
                        )

                        // broadcast "load" events
                        return queryRunner.broadcaster
                            .broadcast("Load", metadata, entities)
                            .then(() => entities)
                    })
            }
        }
        cursor.next = function (callback?: MongoCallback<CursorResult>) {
            if (callback) {
                ParentCursor.prototype.next.call(
                    this,
                    (error: MongoError, result: CursorResult): void => {
                        if (error || !result) {
                            callback(error, result)
                            return
                        }

                        const transformer = new DocumentToEntityTransformer()
                        const entity = transformer.transform(result, metadata)

                        // broadcast "load" events

                        queryRunner.broadcaster
                            .broadcast("Load", metadata, [entity])
                            .then(() => callback(error, entity))
                    },
                )
            } else {
                return ParentCursor.prototype.next
                    .call(this)
                    .then((result: Entity) => {
                        if (!result) return result

                        const transformer = new DocumentToEntityTransformer()
                        const entity = transformer.transform(result, metadata)

                        // broadcast "load" events
                        return queryRunner.broadcaster
                            .broadcast("Load", metadata, [entity])
                            .then(() => entity)
                    })
            }
        }
    }

    protected filterSoftDeleted<Entity>(
        cursor: Cursor<Entity>,
        deleteDateColumn: ColumnMetadata,
        query?: ObjectLiteral,
    ) {
        const { $or, ...restQuery } = query ?? {}
        cursor.filter({
            $or: [
                { [deleteDateColumn.propertyName]: { $eq: null } },
                ...(Array.isArray($or) ? $or : []),
            ],
            ...restQuery,
        })
    }

    /**
     * Finds first entity that matches given conditions and/or find options.
     */
    protected async executeFindOne<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        optionsOrConditions?: any,
        maybeOptions?: MongoFindOneOptions<Entity>,
    ): Promise<Entity | null> {
        const objectIdInstance = PlatformTools.load("mongodb").ObjectID
        const id =
            optionsOrConditions instanceof objectIdInstance ||
            typeof optionsOrConditions === "string"
                ? optionsOrConditions
                : undefined
        const findOneOptionsOrConditions = (
            id ? maybeOptions : optionsOrConditions
        ) as any
        const query =
            this.convertFindOneOptionsOrConditionsToMongodbQuery(
                findOneOptionsOrConditions,
            ) || {}
        if (id) {
            query["_id"] =
                id instanceof objectIdInstance ? id : new objectIdInstance(id)
        }
        const cursor = await this.createEntityCursor(entityClassOrName, query)
        const deleteDateColumn =
            this.connection.getMetadata(entityClassOrName).deleteDateColumn
        if (FindOptionsUtils.isFindOneOptions(findOneOptionsOrConditions)) {
            if (findOneOptionsOrConditions.select)
                cursor.project(
                    this.convertFindOptionsSelectToProjectCriteria(
                        findOneOptionsOrConditions.select,
                    ),
                )
            if (findOneOptionsOrConditions.order)
                cursor.sort(
                    this.convertFindOptionsOrderToOrderCriteria(
                        findOneOptionsOrConditions.order,
                    ),
                )
            if (deleteDateColumn && !findOneOptionsOrConditions.withDeleted) {
                this.filterSoftDeleted(cursor, deleteDateColumn, query)
            }
        } else if (deleteDateColumn) {
            this.filterSoftDeleted(cursor, deleteDateColumn, query)
        }

        // const result = await cursor.limit(1).next();
        const result = await cursor.limit(1).toArray()
        return result.length > 0 ? result[0] : null
    }

    protected async executeFind<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        optionsOrConditions?:
            | MongoFindManyOptions<Entity>
            | Partial<Entity>
            | any[],
    ): Promise<Entity[]> {
        const metadata = this.connection.getMetadata(entityClassOrName)

        const deleteDateColumn =
            this.connection.getMetadata(entityClassOrName).deleteDateColumn

        const pipeline: ObjectLiteral[] = []
        let populate: string[] = []
        let results: any

        const { referenceColumns } = this.parseColumns(metadata)
        const refColumnNames = referenceColumns.map((col) => col.propertyName)
        const refTables = referenceColumns.map((col) => {
            return {
                [`${col.propertyName}`]: {
                    name: col.databaseName,
                    isArray: col.isArray,
                },
            }
        })

        if (FindOptionsUtils.isFindManyOptions(optionsOrConditions)) {
            let firstPipeline
            if (optionsOrConditions.where) {
                firstPipeline = { $match: optionsOrConditions.where as any }
                pipeline.push(firstPipeline)
            }

            // relations / populate
            if (optionsOrConditions.relations) {
                let lookups = []
                for (const field in optionsOrConditions.relations) {
                    populate.push(field)

                    const fieldIndex = refColumnNames.findIndex(
                        (name) => name == field,
                    )
                    if (fieldIndex > -1) {
                        const refTable = refTables[fieldIndex][field].name
                        const populateLookup = {
                            $lookup: {
                                from: refTable,
                                localField: field,
                                foreignField: "_id",
                                as: field,
                            },
                        }
                        lookups.push(populateLookup)
                    } else {
                        console.log(`Populated field "${field}" is not valid.`)
                    }
                }
                lookups = lookups.filter(
                    (lookup) => lookup != undefined && lookup != null,
                )
                pipeline.push(...lookups)
                // TODO: populate and select specific fields to display only
            }

            if (optionsOrConditions.select) {
                const selectWithProjectPipeline = {
                    $project: this.convertFindOptionsSelectToProjectCriteria(
                        optionsOrConditions.select,
                    ),
                }
                pipeline.push(selectWithProjectPipeline)
                // console.log(selectWithProjectPipeline)
            }

            if (optionsOrConditions.skip)
                pipeline.push({ $skip: optionsOrConditions.skip })

            if (optionsOrConditions.take)
                pipeline.push({ $limit: optionsOrConditions.take })

            if (optionsOrConditions.order)
                pipeline.push({ $sort: optionsOrConditions.order })

            if (deleteDateColumn && !optionsOrConditions.withDeleted) {
                if (firstPipeline) {
                    if (firstPipeline.$match) {
                        const $or = firstPipeline.$match.$or || []
                        firstPipeline.$match.$or = [
                            { [deleteDateColumn.propertyName]: { $eq: null } },
                            ...(Array.isArray($or) ? $or : []),
                        ]
                    } else {
                        pipeline.unshift({
                            $match: {
                                $or: [
                                    {
                                        [deleteDateColumn.propertyName]: {
                                            $eq: null,
                                        },
                                    },
                                ],
                            },
                        })
                    }
                }
            }
        }

        results = await this.mongoQueryRunner
            .aggregate(metadata.tableName, pipeline)
            .toArray()

        // "aggregate" always returns array
        // if the relation column is not an array, should return an object
        results = results.map((result: any) => {
            populate.map((field, index) => {
                if (refTables[index][field].isArray == false)
                    result[field] = result[field][0]
            })
            return result
        })

        return results

        // const query =
        //     this.convertFindManyOptionsOrConditionsToMongodbQuery(
        //         optionsOrConditions,
        //     )
        // const cursor = await this.createEntityCursor(entityClassOrName, query)
        // const deleteDateColumn =
        //     this.connection.getMetadata(entityClassOrName).deleteDateColumn

        // if (FindOptionsUtils.isFindManyOptions(optionsOrConditions)) {
        //     if (optionsOrConditions.select)
        //         cursor.project(
        //             this.convertFindOptionsSelectToProjectCriteria(
        //                 optionsOrConditions.select,
        //             ),
        //         )
        //     if (optionsOrConditions.skip) cursor.skip(optionsOrConditions.skip)
        //     if (optionsOrConditions.take) cursor.limit(optionsOrConditions.take)
        //     if (optionsOrConditions.order)
        //         cursor.sort(
        //             this.convertFindOptionsOrderToOrderCriteria(
        //                 optionsOrConditions.order,
        //             ),
        //         )
        //     if (deleteDateColumn && !optionsOrConditions.withDeleted) {
        //         this.filterSoftDeleted(cursor, deleteDateColumn, query)
        //     }
        // } else if (deleteDateColumn) {
        //     this.filterSoftDeleted(cursor, deleteDateColumn, query)
        // }
        // return cursor.toArray()
    }

    /**
     * Read entity's metadata to parse columns that references to other table (collection)
     */
    parseColumns(metadata: EntityMetadata) {
        const _columns = metadata.columns.map(
            ({
                isObjectId,
                isArray,
                isVirtual,
                type,
                databaseName,
                databasePath,
                propertyName,
                propertyAliasName,
                propertyPath,
            }) => {
                return {
                    type,
                    isObjectId,
                    isArray,
                    isVirtual,
                    databaseName,
                    databasePath,
                    propertyName,
                    propertyPath,
                    propertyAliasName,
                }
            },
        )

        const normalColumns = _columns.filter(
            (col) => col.type || col.databaseName == "_id",
        )
        const referenceColumns = _columns.filter(
            (col) => col.isObjectId && col.databaseName != "_id",
        )
        const columns = [...normalColumns, ...referenceColumns]

        return { columns, normalColumns, referenceColumns }
    }

    /**
     * Finds entities that match given find options or conditions.
     */
    async executeFindAndCount<Entity>(
        entityClassOrName: EntityTarget<Entity>,
        optionsOrConditions?: MongoFindManyOptions<Entity> | Partial<Entity>,
    ): Promise<[Entity[], number]> {
        const query =
            this.convertFindManyOptionsOrConditionsToMongodbQuery(
                optionsOrConditions,
            )
        // const cursor = await this.createEntityCursor(entityClassOrName, query)
        // const deleteDateColumn =
        //     this.connection.getMetadata(entityClassOrName).deleteDateColumn

        // if (FindOptionsUtils.isFindManyOptions(optionsOrConditions)) {
        //     if (optionsOrConditions.select)
        //         cursor.project(
        //             this.convertFindOptionsSelectToProjectCriteria(
        //                 optionsOrConditions.select,
        //             ),
        //         )
        //     if (optionsOrConditions.skip) cursor.skip(optionsOrConditions.skip)
        //     if (optionsOrConditions.take) cursor.limit(optionsOrConditions.take)
        //     if (optionsOrConditions.order)
        //         cursor.sort(
        //             this.convertFindOptionsOrderToOrderCriteria(
        //                 optionsOrConditions.order,
        //             ),
        //         )
        //     if (deleteDateColumn && !optionsOrConditions.withDeleted) {
        //         this.filterSoftDeleted(cursor, deleteDateColumn, query)
        //     }
        // } else if (deleteDateColumn) {
        //     this.filterSoftDeleted(cursor, deleteDateColumn, query)
        // }

        const [results, count] = await Promise.all<any>([
            this.find(entityClassOrName, query),
            this.count(entityClassOrName, query),
        ])
        return [results, parseInt(count)]
    }
}
