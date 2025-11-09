import { ObjectLiteral } from "../common/ObjectLiteral"
import { Repository } from "./Repository"
import { MongoFindManyOptions } from "../find-options/mongodb/MongoFindManyOptions"
import { MongoEntityManager } from "../entity-manager/MongoEntityManager"
import { TypeORMError } from "../error/TypeORMError"
import { MongoFindOneOptions } from "../find-options/mongodb/MongoFindOneOptions"
import { FindOneOptions } from "../find-options/FindOneOptions"

import {
    CreateIndexesOptions,
    ObjectId,
    ReplaceOptions,
    AggregateOptions,
    AggregationCursor,
    AnyBulkWriteOperation,
    BulkWriteOptions,
    BulkWriteResult,
    Collection,
    CollStats,
    CollStatsOptions,
    CommandOperationOptions,
    CountOptions,
    DeleteOptions,
    DeleteResult,
    Document,
    Filter,
    FilterOperators,
    FindCursor,
    FindOneAndDeleteOptions,
    FindOneAndReplaceOptions,
    FindOneAndUpdateOptions,
    IndexDescription,
    InsertManyResult,
    InsertOneOptions,
    InsertOneResult,
    ListIndexesCursor,
    ListIndexesOptions,
    OrderedBulkOperation,
    UnorderedBulkOperation,
    UpdateFilter,
    UpdateOptions,
    UpdateResult,
    CountDocumentsOptions,
} from "../driver/mongodb/typings"
import { FindManyOptions } from "../find-options/FindManyOptions"

/**
 * Repository used to manage mongodb documents of a single entity type.
 */
export class MongoRepository<
    Entity extends ObjectLiteral,
> extends Repository<Entity> {
    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Entity Manager used by this repository.
     */
    readonly manager: MongoEntityManager

    // -------------------------------------------------------------------------
    // Overridden Methods
    // -------------------------------------------------------------------------

    /**
     * Raw SQL query execution is not supported by MongoDB.
     * Calling this method will return an error.
     */
    query(): never {
        throw new TypeORMError(`Queries aren't supported by MongoDB.`)
    }

    /**
     * Using Query Builder with MongoDB is not supported yet.
     * Calling this method will return an error.
     */
    createQueryBuilder(): never {
        throw new TypeORMError(`Query Builder is not supported by MongoDB.`)
    }

    /**
     * Finds entities that match given find options or conditions.
     */
    find(
        options?:
            | FindManyOptions<Entity>
            | Partial<Entity>
            | FilterOperators<Entity>,
    ): Promise<Entity[]> {
        return this.manager.find(this.metadata.target, options)
    }

    /**
     * Finds entities that match given find options or conditions.
     */
    findBy(where: any): Promise<Entity[]> {
        return this.manager.findBy(this.metadata.target, where)
    }

    /**
     * Finds entities that match given find options or conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    findAndCount(
        options?: MongoFindManyOptions<Entity>,
    ): Promise<[Entity[], number]> {
        return this.manager.findAndCount(this.metadata.target, options)
    }

    /**
     * Finds entities that match given find options or conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    findAndCountBy(where: any): Promise<[Entity[], number]> {
        return this.manager.findAndCountBy(this.metadata.target, where)
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
    findByIds(ids: any[], options?: any): Promise<Entity[]> {
        return this.manager.findByIds(this.metadata.target, ids, options)
    }

    /**
     * Finds first entity that matches given find options.
     */
    async findOne(
        options: MongoFindOneOptions<Entity>,
    ): Promise<Entity | null> {
        return this.manager.findOne(this.metadata.target, options)
    }

    /**
     * Finds first entity that matches given WHERE conditions.
     */
    async findOneBy(where: any): Promise<Entity | null> {
        return this.manager.findOneBy(this.metadata.target, where)
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
    async findOneById(
        id: string | number | Date | ObjectId,
    ): Promise<Entity | null> {
        return this.manager.findOneById(this.metadata.target, id)
    }

    /**
     * Finds first entity by a given find options.
     * If entity was not found in the database - rejects with error.
     */
    async findOneOrFail(options: FindOneOptions<Entity>): Promise<Entity> {
        return this.manager.findOneOrFail(this.metadata.target, options)
    }

    /**
     * Finds first entity that matches given where condition.
     * If entity was not found in the database - rejects with error.
     */
    async findOneByOrFail(where: any): Promise<Entity> {
        return this.manager.findOneByOrFail(this.metadata.target, where)
    }

    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     */
    createCursor<T = any>(query?: Filter<Entity>): FindCursor<T> {
        return this.manager.createCursor(this.metadata.target, query)
    }

    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     * This returns modified version of cursor that transforms each result into Entity model.
     */
    createEntityCursor(query?: Filter<Entity>): FindCursor<Entity> {
        return this.manager.createEntityCursor(this.metadata.target, query)
    }

    /**
     * Execute an aggregation framework pipeline against the collection.
     */
    aggregate<R = any>(
        pipeline: ObjectLiteral[],
        options?: AggregateOptions,
    ): AggregationCursor<R> {
        return this.manager.aggregate<R>(
            this.metadata.target,
            pipeline,
            options,
        )
    }

    /**
     * Execute an aggregation framework pipeline against the collection.
     * This returns modified version of cursor that transforms each result into Entity model.
     */
    aggregateEntity(
        pipeline: ObjectLiteral[],
        options?: AggregateOptions,
    ): AggregationCursor<Entity> {
        return this.manager.aggregateEntity(
            this.metadata.target,
            pipeline,
            options,
        )
    }
    /**
     * Perform a bulkWrite operation without a fluent API.
     */
    bulkWrite(
        operations: AnyBulkWriteOperation[],
        options?: BulkWriteOptions,
    ): Promise<BulkWriteResult> {
        return this.manager.bulkWrite(this.metadata.target, operations, options)
    }

    /**
     * Count number of matching documents in the db to a query.
     */
    count(query?: ObjectLiteral, options?: CountOptions): Promise<number> {
        return this.manager.count(this.metadata.target, query || {}, options)
    }

    /**
     * Count number of matching documents in the db to a query.
     */
    countDocuments(
        query?: ObjectLiteral,
        options?: CountDocumentsOptions,
    ): Promise<number> {
        return this.manager.countDocuments(
            this.metadata.target,
            query || {},
            options,
        )
    }

    /**
     * Count number of matching documents in the db to a query.
     */
    countBy(query?: ObjectLiteral, options?: CountOptions): Promise<number> {
        return this.manager.countBy(this.metadata.target, query, options)
    }

    /**
     * Creates an index on the db and collection.
     */
    createCollectionIndex(
        fieldOrSpec: string | any,
        options?: CreateIndexesOptions,
    ): Promise<string> {
        return this.manager.createCollectionIndex(
            this.metadata.target,
            fieldOrSpec,
            options,
        )
    }

    /**
     * Creates multiple indexes in the collection, this method is only supported for MongoDB 2.6 or higher.
     * Earlier version of MongoDB will throw a command not supported error.
     * Index specifications are defined at http://docs.mongodb.org/manual/reference/command/createIndexes/.
     */
    createCollectionIndexes(indexSpecs: IndexDescription[]): Promise<string[]> {
        return this.manager.createCollectionIndexes(
            this.metadata.target,
            indexSpecs,
        )
    }

    /**
     * Delete multiple documents on MongoDB.
     */
    deleteMany(
        query: ObjectLiteral,
        options?: DeleteOptions,
    ): Promise<DeleteResult> {
        return this.manager.deleteMany(this.metadata.tableName, query, options)
    }

    /**
     * Delete a document on MongoDB.
     */
    deleteOne(
        query: ObjectLiteral,
        options?: DeleteOptions,
    ): Promise<DeleteResult> {
        return this.manager.deleteOne(this.metadata.tableName, query, options)
    }

    /**
     * The distinct command returns returns a list of distinct values for the given key across a collection.
     */
    distinct(
        key: string,
        query: ObjectLiteral,
        options?: CommandOperationOptions,
    ): Promise<any> {
        return this.manager.distinct(
            this.metadata.tableName,
            key,
            query,
            options,
        )
    }

    /**
     * Drops an index from this collection.
     */
    dropCollectionIndex(
        indexName: string,
        options?: CommandOperationOptions,
    ): Promise<any> {
        return this.manager.dropCollectionIndex(
            this.metadata.tableName,
            indexName,
            options,
        )
    }

    /**
     * Drops all indexes from the collection.
     */
    dropCollectionIndexes(): Promise<any> {
        return this.manager.dropCollectionIndexes(this.metadata.tableName)
    }

    /**
     * Find a document and delete it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndDelete(
        query: ObjectLiteral,
        options?: FindOneAndDeleteOptions,
    ): Promise<Document | null> {
        return this.manager.findOneAndDelete(
            this.metadata.tableName,
            query,
            options,
        )
    }

    /**
     * Find a document and replace it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndReplace(
        query: ObjectLiteral,
        replacement: Object,
        options?: FindOneAndReplaceOptions,
    ): Promise<Document | null> {
        return this.manager.findOneAndReplace(
            this.metadata.tableName,
            query,
            replacement,
            options,
        )
    }

    /**
     * Find a document and update it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndUpdate(
        query: ObjectLiteral,
        update: Object,
        options?: FindOneAndUpdateOptions,
    ): Promise<Document | null> {
        return this.manager.findOneAndUpdate(
            this.metadata.tableName,
            query,
            update,
            options,
        )
    }

    /**
     * Retrieve all the indexes on the collection.
     */
    collectionIndexes(): Promise<any> {
        return this.manager.collectionIndexes(this.metadata.tableName)
    }

    /**
     * Retrieve all the indexes on the collection.
     */
    collectionIndexExists(indexes: string | string[]): Promise<boolean> {
        return this.manager.collectionIndexExists(
            this.metadata.tableName,
            indexes,
        )
    }

    /**
     * Retrieves this collections index info.
     */
    collectionIndexInformation(options?: { full: boolean }): Promise<any> {
        return this.manager.collectionIndexInformation(
            this.metadata.tableName,
            options,
        )
    }

    /**
     * Initiate an In order bulk write operation, operations will be serially executed in the order they are added, creating a new operation for each switch in types.
     */
    initializeOrderedBulkOp(options?: BulkWriteOptions): OrderedBulkOperation {
        return this.manager.initializeOrderedBulkOp(
            this.metadata.tableName,
            options,
        )
    }

    /**
     * Initiate a Out of order batch write operation. All operations will be buffered into insert/update/remove commands executed out of order.
     */
    initializeUnorderedBulkOp(
        options?: BulkWriteOptions,
    ): UnorderedBulkOperation {
        return this.manager.initializeUnorderedBulkOp(
            this.metadata.tableName,
            options,
        )
    }

    /**
     * Inserts an array of documents into MongoDB.
     */
    insertMany(
        docs: ObjectLiteral[],
        options?: BulkWriteOptions,
    ): Promise<InsertManyResult<Document>> {
        return this.manager.insertMany(this.metadata.tableName, docs, options)
    }

    /**
     * Inserts a single document into MongoDB.
     */
    insertOne(
        doc: ObjectLiteral,
        options?: InsertOneOptions,
    ): Promise<InsertOneResult> {
        return this.manager.insertOne(this.metadata.tableName, doc, options)
    }

    /**
     * Returns if the collection is a capped collection.
     */
    isCapped(): Promise<any> {
        return this.manager.isCapped(this.metadata.tableName)
    }

    /**
     * Get the list of all indexes information for the collection.
     */
    listCollectionIndexes(options?: ListIndexesOptions): ListIndexesCursor {
        return this.manager.listCollectionIndexes(
            this.metadata.tableName,
            options,
        )
    }

    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    rename(
        newName: string,
        options?: { dropTarget?: boolean },
    ): Promise<Collection<Document>> {
        return this.manager.rename(this.metadata.tableName, newName, options)
    }

    /**
     * Replace a document on MongoDB.
     */
    replaceOne(
        query: ObjectLiteral,
        doc: ObjectLiteral,
        options?: ReplaceOptions,
    ): Promise<Document | UpdateResult> {
        return this.manager.replaceOne(
            this.metadata.tableName,
            query,
            doc,
            options,
        )
    }

    /**
     * Get all the collection statistics.
     */
    stats(options?: CollStatsOptions): Promise<CollStats> {
        return this.manager.stats(this.metadata.tableName, options)
    }

    /**
     * Update multiple documents on MongoDB.
     */
    updateMany(
        query: ObjectLiteral,
        update: UpdateFilter<Document>,
        options?: UpdateOptions,
    ): Promise<Document | UpdateResult> {
        return this.manager.updateMany(
            this.metadata.tableName,
            query,
            update,
            options,
        )
    }

    /**
     * Update a single document on MongoDB.
     */
    updateOne(
        query: ObjectLiteral,
        update: UpdateFilter<Document>,
        options?: UpdateOptions,
    ): Promise<Document | UpdateResult> {
        return this.manager.updateOne(
            this.metadata.tableName,
            query,
            update,
            options,
        )
    }
}
