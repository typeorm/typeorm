import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {ColumnSchema} from "../../schema-builder/schema/ColumnSchema";
import {TableSchema} from "../../schema-builder/schema/TableSchema";
import {ForeignKeySchema} from "../../schema-builder/schema/ForeignKeySchema";
import {IndexSchema} from "../../schema-builder/schema/IndexSchema";
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
    Db,
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
    OrderedBulkOperation,
    ParallelCollectionScanOptions,
    ReadPreference,
    ReplaceOneOptions,
    UnorderedBulkOperation,
    UpdateWriteOpResult
} from "./typings";
import {Connection} from "../../connection/Connection";
import {ReadStream} from "../../platform/PlatformTools";
import {MongoEntityManager} from "../../entity-manager/MongoEntityManager";

/**
 * Runs queries on a single MongoDB connection.
 */
export class MongoQueryRunner implements QueryRunner {

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Connection used by this query runner.
     */
    connection: Connection;

    /**
     * Isolated entity manager working only with current query runner.
     */
    manager: MongoEntityManager;

    /**
     * Indicates if connection for this query runner is released.
     * Once its released, query runner cannot run queries anymore.
     * Always false for mongodb since mongodb has a single query executor instance.
     */
    isReleased = false;

    /**
     * Indicates if transaction is active in this query executor.
     * Always false for mongodb since mongodb does not support transactions.
     */
    isTransactionActive = false;

    /**
     * Stores temporarily user data.
     * Useful for sharing data with subscribers.
     */
    data = {};

    /**
     * Real database connection from a connection pool used to perform queries.
     */
    databaseConnection: Db;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection, databaseConnection: Db) {
        this.connection = connection;
        this.databaseConnection = databaseConnection;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     */
    cursor(collectionName: string, query?: ObjectLiteral): Cursor<any> {
        return this.getCollection(collectionName).find(query || {});
    }

    /**
     * Execute an aggregation framework pipeline against the collection.
     */
    aggregate(collectionName: string, pipeline: ObjectLiteral[], options?: CollectionAggregationOptions): AggregationCursor<any> {
        return this.getCollection(collectionName).aggregate(pipeline, options);
    }

    /**
     * Perform a bulkWrite operation without a fluent API.
     */
    async bulkWrite(collectionName: string, operations: ObjectLiteral[], options?: CollectionBluckWriteOptions): Promise<BulkWriteOpResultObject> {
        return await this.getCollection(collectionName).bulkWrite(operations, options);
    }

    /**
     * Count number of matching documents in the db to a query.
     */
    async count(collectionName: string, query?: ObjectLiteral, options?: MongoCountPreferences): Promise<any> {
        return await this.getCollection(collectionName).count(query || {}, options);
    }

    /**
     * Creates an index on the db and collection.
     */
    async createCollectionIndex(collectionName: string, fieldOrSpec: string|any, options?: MongodbIndexOptions): Promise<string> {
        return await this.getCollection(collectionName).createIndex(fieldOrSpec, options);
    }

    /**
     * Creates multiple indexes in the collection, this method is only supported for MongoDB 2.6 or higher.
     * Earlier version of MongoDB will throw a command not supported error. Index specifications are defined at http://docs.mongodb.org/manual/reference/command/createIndexes/.
     */
    async createCollectionIndexes(collectionName: string, indexSpecs: ObjectLiteral[]): Promise<void> {
        return await this.getCollection(collectionName).createIndexes(indexSpecs);
    }

    /**
     * Delete multiple documents on MongoDB.
     */
    async deleteMany(collectionName: string, query: ObjectLiteral, options?: CollectionOptions): Promise<DeleteWriteOpResultObject> {
        return await this.getCollection(collectionName).deleteMany(query, options);
    }

    /**
     * Delete a document on MongoDB.
     */
    async deleteOne(collectionName: string, query: ObjectLiteral, options?: CollectionOptions): Promise<DeleteWriteOpResultObject> {
        return await this.getCollection(collectionName).deleteOne(query, options);
    }

    /**
     * The distinct command returns returns a list of distinct values for the given key across a collection.
     */
    async distinct(collectionName: string, key: string, query: ObjectLiteral, options?: { readPreference?: ReadPreference|string }): Promise<any> {
        return await this.getCollection(collectionName).distinct(key, query, options);
    }

    /**
     * Drops an index from this collection.
     */
    async dropCollectionIndex(collectionName: string, indexName: string, options?: CollectionOptions): Promise<any> {
        return await this.getCollection(collectionName).dropIndex(indexName, options);
    }

    /**
     * Drops all indexes from the collection.
     */
    async dropCollectionIndexes(collectionName: string): Promise<any> {
        return await this.getCollection(collectionName).dropIndexes();
    }

    /**
     * Find a document and delete it in one atomic operation, requires a write lock for the duration of the operation.
     */
    async findOneAndDelete(collectionName: string, query: ObjectLiteral, options?: { projection?: Object, sort?: Object, maxTimeMS?: number }): Promise<FindAndModifyWriteOpResultObject> {
        return await this.getCollection(collectionName).findOneAndDelete(query, options);
    }

    /**
     * Find a document and replace it in one atomic operation, requires a write lock for the duration of the operation.
     */
    async findOneAndReplace(collectionName: string, query: ObjectLiteral, replacement: Object, options?: FindOneAndReplaceOption): Promise<FindAndModifyWriteOpResultObject> {
        return await this.getCollection(collectionName).findOneAndReplace(query, replacement, options);
    }

    /**
     * Find a document and update it in one atomic operation, requires a write lock for the duration of the operation.
     */
    async findOneAndUpdate(collectionName: string, query: ObjectLiteral, update: Object, options?: FindOneAndReplaceOption): Promise<FindAndModifyWriteOpResultObject> {
        return await this.getCollection(collectionName).findOneAndUpdate(query, update, options);
    }

    /**
     * Execute a geo search using a geo haystack index on a collection.
     */
    async geoHaystackSearch(collectionName: string, x: number, y: number, options?: GeoHaystackSearchOptions): Promise<any> {
        return await this.getCollection(collectionName).geoHaystackSearch(x, y, options);
    }

    /**
     * Execute the geoNear command to search for items in the collection.
     */
    async geoNear(collectionName: string, x: number, y: number, options?: GeoNearOptions): Promise<any> {
        return await this.getCollection(collectionName).geoNear(x, y, options);
    }

    /**
     * Run a group command across a collection.
     */
    async group(collectionName: string, keys: Object|Array<any>|Function|Code, condition: Object, initial: Object, reduce: Function|Code, finalize: Function|Code, command: boolean, options?: { readPreference?: ReadPreference | string }): Promise<any> {
        return await this.getCollection(collectionName).group(keys, condition, initial, reduce, finalize, command, options);
    }

    /**
     * Retrieve all the indexes on the collection.
     */
    async collectionIndexes(collectionName: string): Promise<any> {
        return await this.getCollection(collectionName).indexes();
    }

    /**
     * Retrieve all the indexes on the collection.
     */
    async collectionIndexExists(collectionName: string, indexes: string|string[]): Promise<boolean> {
        return await this.getCollection(collectionName).indexExists(indexes);
    }

    /**
     * Retrieves this collections index info.
     */
    async collectionIndexInformation(collectionName: string, options?: { full: boolean }): Promise<any> {
        return await this.getCollection(collectionName).indexInformation(options);
    }

    /**
     * Initiate an In order bulk write operation, operations will be serially executed in the order they are added, creating a new operation for each switch in types.
     */
    initializeOrderedBulkOp(collectionName: string, options?: CollectionOptions): OrderedBulkOperation {
        return this.getCollection(collectionName).initializeOrderedBulkOp(options);
    }

    /**
     * Initiate a Out of order batch write operation. All operations will be buffered into insert/update/remove commands executed out of order.
     */
    initializeUnorderedBulkOp(collectionName: string, options?: CollectionOptions): UnorderedBulkOperation {
        return this.getCollection(collectionName).initializeUnorderedBulkOp(options);
    }

    /**
     * Inserts an array of documents into MongoDB.
     */
    async insertMany(collectionName: string, docs: ObjectLiteral[], options?: CollectionInsertManyOptions): Promise<InsertWriteOpResult> {
        return await this.getCollection(collectionName).insertMany(docs, options);
    }

    /**
     * Inserts a single document into MongoDB.
     */
    async insertOne(collectionName: string, doc: ObjectLiteral, options?: CollectionInsertOneOptions): Promise<InsertOneWriteOpResult> {
        return await this.getCollection(collectionName).insertOne(doc, options);
    }

    /**
     * Returns if the collection is a capped collection.
     */
    async isCapped(collectionName: string): Promise<any> {
        return await this.getCollection(collectionName).isCapped();
    }

    /**
     * Get the list of all indexes information for the collection.
     */
    listCollectionIndexes(collectionName: string, options?: { batchSize?: number, readPreference?: ReadPreference|string }): CommandCursor {
        return this.getCollection(collectionName).listIndexes(options);
    }

    /**
     * Run Map Reduce across a collection. Be aware that the inline option for out will return an array of results not a collection.
     */
    async mapReduce(collectionName: string, map: Function|string, reduce: Function|string, options?: MapReduceOptions): Promise<any> {
        return await this.getCollection(collectionName).mapReduce(map, reduce, options);
    }

    /**
     * Return N number of parallel cursors for a collection allowing parallel reading of entire collection.
     * There are no ordering guarantees for returned results.
     */
    async parallelCollectionScan(collectionName: string, options?: ParallelCollectionScanOptions): Promise<Cursor<any>[]> {
        return await this.getCollection(collectionName).parallelCollectionScan(options);
    }

    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    async reIndex(collectionName: string): Promise<any> {
        return await this.getCollection(collectionName).reIndex();
    }

    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    async rename(collectionName: string, newName: string, options?: { dropTarget?: boolean }): Promise<Collection> {
        return await this.getCollection(collectionName).rename(newName, options);
    }

    /**
     * Replace a document on MongoDB.
     */
    async replaceOne(collectionName: string, query: ObjectLiteral, doc: ObjectLiteral, options?: ReplaceOneOptions): Promise<UpdateWriteOpResult> {
        return await this.getCollection(collectionName).replaceOne(query, doc, options);
    }

    /**
     * Get all the collection statistics.
     */
    async stats(collectionName: string, options?: { scale: number }): Promise<CollStats> {
        return await this.getCollection(collectionName).stats(options);
    }

    /**
     * Update multiple documents on MongoDB.
     */
    async updateMany(collectionName: string, query: ObjectLiteral, update: ObjectLiteral, options?: { upsert?: boolean, w?: any, wtimeout?: number, j?: boolean }): Promise<UpdateWriteOpResult> {
        return await this.getCollection(collectionName).updateMany(query, update, options);
    }

    /**
     * Update a single document on MongoDB.
     */
    async updateOne(collectionName: string, query: ObjectLiteral, update: ObjectLiteral, options?: ReplaceOneOptions): Promise<UpdateWriteOpResult> {
        return await this.getCollection(collectionName).updateOne(query, update, options);
    }

    // -------------------------------------------------------------------------
    // Public Implemented Methods (from QueryRunner)
    // -------------------------------------------------------------------------

    /**
     * Removes all collections from the currently connected database.
     * Be careful with using this method and avoid using it in production or migrations
     * (because it can clear all your database).
     */
    async clearDatabase(): Promise<void> {
        await this.databaseConnection.dropDatabase();
    }

    /**
     * For MongoDB database we don't create connection, because its single connection already created by a driver.
     */
    async connect(): Promise<any> {
    }

    /**
     * For MongoDB database we don't release connection, because its single connection.
     */
    async release(): Promise<void> {
        // releasing connection are not supported by mongodb driver, so simply don't do anything here
    }

    /**
     * Starts transaction.
     */
    async startTransaction(): Promise<void> {
        // transactions are not supported by mongodb driver, so simply don't do anything here
    }

    /**
     * Commits transaction.
     */
    async commitTransaction(): Promise<void> {
        // transactions are not supported by mongodb driver, so simply don't do anything here
    }

    /**
     * Rollbacks transaction.
     */
    async rollbackTransaction(): Promise<void> {
        // transactions are not supported by mongodb driver, so simply don't do anything here
    }

    /**
     * Executes a given SQL query.
     */
    query(query: string, parameters?: any[]): Promise<any> {
        throw new Error(`Executing SQL query is not supported by MongoDB driver.`);
    }

    /**
     * Returns raw data stream.
     */
    stream(query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream> {
        throw new Error(`Stream is not supported by MongoDB driver.`);
    }

    /**
     * Insert a new row with given values into the given table.
     * Returns value of inserted object id.
     */
    async insert(collectionName: string, keyValues: ObjectLiteral): Promise<any> {
        const results = await this.databaseConnection
            .collection(collectionName)
            .insertOne(keyValues);
        const generatedMap = this.connection.getMetadata(collectionName).objectIdColumn!.createValueMap(results.insertedId);
        return {
            result: results,
            generatedMap: generatedMap
        };
    }

    /**
     * Updates rows that match given conditions in the given table.
     */
    async update(collectionName: string, valuesMap: ObjectLiteral, conditions: ObjectLiteral): Promise<void> {
        await this.databaseConnection
            .collection(collectionName)
            .updateOne(conditions, valuesMap);
    }

    /**
     * Deletes from the given table by a given conditions.
     */
    async delete(collectionName: string, conditions: ObjectLiteral|string, maybeParameters?: any[]): Promise<void> {
        if (typeof conditions === "string")
            throw new Error(`String condition is not supported by MongoDB driver.`);

        await this.databaseConnection
            .collection(collectionName)
            .deleteOne(conditions);
    }

    /**
     * Inserts rows into the closure table.
     */
    async insertIntoClosureTable(collectionName: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    /**
     * Loads given table's data from the database.
     */
    async getTable(collectionName: string): Promise<TableSchema|undefined> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    /**
     * Loads all tables (with given names) from the database and creates a TableSchema from them.
     */
    async getTables(collectionNames: string[]): Promise<TableSchema[]> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        // так я от тебя не слышу что ты получаешь удовольствие. все что я слышу это как ты делаешь холодные расчеты для вы
    }

    /**
     * Checks if database with the given name exist.
     */
    async hasDatabase(database: string): Promise<boolean> {
        throw new Error(`Check database queries are not supported by MongoDB driver.`);
    }

    /**
     * Checks if table with the given name exist in the database.
     */
    async hasTable(collectionName: string): Promise<boolean> {
        throw new Error(`Check schema queries are not supported by MongoDB driver.`);
    }

    /**
     * Creates a database if it's not created.
     */
    createDatabase(database: string): Promise<void[]> {
        throw new Error(`Database create queries are not supported by MongoDB driver.`);
    }

    /**
     * Creates a schema if it's not created.
     */
    createSchema(schemas: string[]): Promise<void[]> {
        throw new Error(`Schema create queries are not supported by MongoDB driver.`);
    }

    /**
     * Creates a new table from the given table schema and column schemas inside it.
     */
    async createTable(table: TableSchema): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    /**
     * Drops the table.
     */
    async dropTable(tableName: string): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    /**
     * Checks if column with the given name exist in the given table.
     */
    async hasColumn(collectionName: string, columnName: string): Promise<boolean> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    /**
     * Creates a new column from the column schema in the table.
     */
    async addColumn(tableSchemaOrName: TableSchema|string, column: ColumnSchema): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    /**
     * Creates a new columns from the column schema in the table.
     */
    async addColumns(tableSchemaOrName: TableSchema|string, columns: ColumnSchema[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    /**
     * Renames column in the given table.
     */
    async renameColumn(tableSchemaOrName: TableSchema|string, oldColumnSchemaOrName: ColumnSchema|string, newColumnSchemaOrName: ColumnSchema|string): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    /**
     * Changes a column in the table.
     */
    async changeColumn(tableSchemaOrName: TableSchema|string, oldColumnSchemaOrName: ColumnSchema|string, newColumn: ColumnSchema): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    /**
     * Changes a column in the table.
     */
    async changeColumns(tableSchema: TableSchema, changedColumns: { newColumn: ColumnSchema, oldColumn: ColumnSchema }[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    /**
     * Drops column in the table.
     */
    async dropColumn(table: TableSchema, column: ColumnSchema): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    /**
     * Drops the columns in the table.
     */
    async dropColumns(table: TableSchema, columns: ColumnSchema[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    /**
     * Updates table's primary keys.
     */
    async updatePrimaryKeys(tableSchema: TableSchema): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    /**
     * Creates a new foreign key.
     */
    async createForeignKey(tableSchemaOrName: TableSchema|string, foreignKey: ForeignKeySchema): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    /**
     * Creates a new foreign keys.
     */
    async createForeignKeys(tableSchemaOrName: TableSchema|string, foreignKeys: ForeignKeySchema[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    /**
     * Drops a foreign key from the table.
     */
    async dropForeignKey(tableSchemaOrName: TableSchema|string, foreignKey: ForeignKeySchema): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    /**
     * Drops a foreign keys from the table.
     */
    async dropForeignKeys(tableSchemaOrName: TableSchema|string, foreignKeys: ForeignKeySchema[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    /**
     * Creates a new index.
     */
    async createIndex(collectionName: string, index: IndexSchema): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(collectionName: string, indexName: string): Promise<void> {
        throw new Error(`Schema update queries are not supported by MongoDB driver.`);
    }

    /**
     * Drops collection.
     */
    async truncate(collectionName: string): Promise<void> {
        await this.databaseConnection
            .dropCollection(collectionName);
    }

    /**
     * Enables special query runner mode in which sql queries won't be executed,
     * instead they will be memorized into a special variable inside query runner.
     * You can get memorized sql using getMemorySql() method.
     */
    enableSqlMemory(): void {
        throw new Error(`This operation is not supported by MongoDB driver.`);
    }

    /**
     * Disables special query runner mode in which sql queries won't be executed
     * started by calling enableSqlMemory() method.
     *
     * Previously memorized sql will be flushed.
     */
    disableSqlMemory(): void {
        throw new Error(`This operation is not supported by MongoDB driver.`);
    }

    /**
     * Gets sql stored in the memory. Parameters in the sql are already replaced.
     */
    getMemorySql():  (string|{ up: string, down: string })[] {
        throw new Error(`This operation is not supported by MongoDB driver.`);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Gets collection from the database with a given name.
     */
    protected getCollection(collectionName: string): Collection {
        return this.databaseConnection.collection(collectionName);
    }

}