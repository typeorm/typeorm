"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoQueryRunner = void 0;
const Broadcaster_1 = require("../../subscriber/Broadcaster");
const error_1 = require("../../error");
/**
 * Runs queries on a single MongoDB connection.
 */
class MongoQueryRunner {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(connection, databaseConnection) {
        /**
         * Indicates if connection for this query runner is released.
         * Once its released, query runner cannot run queries anymore.
         * Always false for mongodb since mongodb has a single query executor instance.
         */
        this.isReleased = false;
        /**
         * Indicates if transaction is active in this query executor.
         * Always false for mongodb since mongodb does not support transactions.
         */
        this.isTransactionActive = false;
        /**
         * Stores temporarily user data.
         * Useful for sharing data with subscribers.
         */
        this.data = {};
        this.connection = connection;
        this.databaseConnection = databaseConnection;
        this.broadcaster = new Broadcaster_1.Broadcaster(this);
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Called before migrations are run.
     */
    async beforeMigration() {
        // Do nothing
    }
    /**
     * Called after migrations are run.
     */
    async afterMigration() {
        // Do nothing
    }
    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     */
    cursor(collectionName, query) {
        return this.getCollection(collectionName).find(query || {});
    }
    /**
     * Execute an aggregation framework pipeline against the collection.
     */
    aggregate(collectionName, pipeline, options) {
        return this.getCollection(collectionName).aggregate(pipeline, options);
    }
    /**
     * Perform a bulkWrite operation without a fluent API.
     */
    async bulkWrite(collectionName, operations, options) {
        return await this.getCollection(collectionName).bulkWrite(operations, options);
    }
    /**
     * Count number of matching documents in the db to a query.
     */
    async count(collectionName, query, options) {
        return await this.getCollection(collectionName).countDocuments(query || {}, options);
    }
    /**
     * Creates an index on the db and collection.
     */
    async createCollectionIndex(collectionName, fieldOrSpec, options) {
        return await this.getCollection(collectionName).createIndex(fieldOrSpec, options);
    }
    /**
     * Creates multiple indexes in the collection, this method is only supported for MongoDB 2.6 or higher.
     * Earlier version of MongoDB will throw a command not supported error. Index specifications are defined at http://docs.mongodb.org/manual/reference/command/createIndexes/.
     */
    async createCollectionIndexes(collectionName, indexSpecs) {
        return await this.getCollection(collectionName).createIndexes(indexSpecs);
    }
    /**
     * Delete multiple documents on MongoDB.
     */
    async deleteMany(collectionName, query, options) {
        return await this.getCollection(collectionName).deleteMany(query, options);
    }
    /**
     * Delete a document on MongoDB.
     */
    async deleteOne(collectionName, query, options) {
        return await this.getCollection(collectionName).deleteOne(query, options);
    }
    /**
     * The distinct command returns returns a list of distinct values for the given key across a collection.
     */
    async distinct(collectionName, key, query, options) {
        return await this.getCollection(collectionName).distinct(key, query, options);
    }
    /**
     * Drops an index from this collection.
     */
    async dropCollectionIndex(collectionName, indexName, options) {
        return await this.getCollection(collectionName).dropIndex(indexName, options);
    }
    /**
     * Drops all indexes from the collection.
     */
    async dropCollectionIndexes(collectionName) {
        return await this.getCollection(collectionName).dropIndexes();
    }
    /**
     * Find a document and delete it in one atomic operation, requires a write lock for the duration of the operation.
     */
    async findOneAndDelete(collectionName, query, options) {
        return await this.getCollection(collectionName).findOneAndDelete(query, options);
    }
    /**
     * Find a document and replace it in one atomic operation, requires a write lock for the duration of the operation.
     */
    async findOneAndReplace(collectionName, query, replacement, options) {
        return await this.getCollection(collectionName).findOneAndReplace(query, replacement, options);
    }
    /**
     * Find a document and update it in one atomic operation, requires a write lock for the duration of the operation.
     */
    async findOneAndUpdate(collectionName, query, update, options) {
        return await this.getCollection(collectionName).findOneAndUpdate(query, update, options);
    }
    /**
     * Execute a geo search using a geo haystack index on a collection.
     */
    async geoHaystackSearch(collectionName, x, y, options) {
        return await this.getCollection(collectionName).geoHaystackSearch(x, y, options);
    }
    /**
     * Execute the geoNear command to search for items in the collection.
     */
    async geoNear(collectionName, x, y, options) {
        return await this.getCollection(collectionName).geoNear(x, y, options);
    }
    /**
     * Run a group command across a collection.
     */
    async group(collectionName, keys, condition, initial, reduce, finalize, command, options) {
        return await this.getCollection(collectionName).group(keys, condition, initial, reduce, finalize, command, options);
    }
    /**
     * Retrieve all the indexes on the collection.
     */
    async collectionIndexes(collectionName) {
        return await this.getCollection(collectionName).indexes();
    }
    /**
     * Retrieve all the indexes on the collection.
     */
    async collectionIndexExists(collectionName, indexes) {
        return await this.getCollection(collectionName).indexExists(indexes);
    }
    /**
     * Retrieves this collections index info.
     */
    async collectionIndexInformation(collectionName, options) {
        return await this.getCollection(collectionName).indexInformation(options);
    }
    /**
     * Initiate an In order bulk write operation, operations will be serially executed in the order they are added, creating a new operation for each switch in types.
     */
    initializeOrderedBulkOp(collectionName, options) {
        return this.getCollection(collectionName).initializeOrderedBulkOp(options);
    }
    /**
     * Initiate a Out of order batch write operation. All operations will be buffered into insert/update/remove commands executed out of order.
     */
    initializeUnorderedBulkOp(collectionName, options) {
        return this.getCollection(collectionName).initializeUnorderedBulkOp(options);
    }
    /**
     * Inserts an array of documents into MongoDB.
     */
    async insertMany(collectionName, docs, options) {
        return await this.getCollection(collectionName).insertMany(docs, options);
    }
    /**
     * Inserts a single document into MongoDB.
     */
    async insertOne(collectionName, doc, options) {
        return await this.getCollection(collectionName).insertOne(doc, options);
    }
    /**
     * Returns if the collection is a capped collection.
     */
    async isCapped(collectionName) {
        return await this.getCollection(collectionName).isCapped();
    }
    /**
     * Get the list of all indexes information for the collection.
     */
    listCollectionIndexes(collectionName, options) {
        return this.getCollection(collectionName).listIndexes(options);
    }
    /**
     * Run Map Reduce across a collection. Be aware that the inline option for out will return an array of results not a collection.
     */
    async mapReduce(collectionName, map, reduce, options) {
        return await this.getCollection(collectionName).mapReduce(map, reduce, options);
    }
    /**
     * Return N number of parallel cursors for a collection allowing parallel reading of entire collection.
     * There are no ordering guarantees for returned results.
     */
    async parallelCollectionScan(collectionName, options) {
        return await this.getCollection(collectionName).parallelCollectionScan(options);
    }
    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    async reIndex(collectionName) {
        return await this.getCollection(collectionName).reIndex();
    }
    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    async rename(collectionName, newName, options) {
        return await this.getCollection(collectionName).rename(newName, options);
    }
    /**
     * Replace a document on MongoDB.
     */
    async replaceOne(collectionName, query, doc, options) {
        return await this.getCollection(collectionName).replaceOne(query, doc, options);
    }
    /**
     * Get all the collection statistics.
     */
    async stats(collectionName, options) {
        return await this.getCollection(collectionName).stats(options);
    }
    /**
     * Watching new changes as stream.
     */
    watch(collectionName, pipeline, options) {
        return this.getCollection(collectionName).watch(pipeline, options);
    }
    /**
     * Update multiple documents on MongoDB.
     */
    async updateMany(collectionName, query, update, options) {
        return await this.getCollection(collectionName).updateMany(query, update, options);
    }
    /**
     * Update a single document on MongoDB.
     */
    async updateOne(collectionName, query, update, options) {
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
    async clearDatabase() {
        await this.databaseConnection
            .db(this.connection.driver.database)
            .dropDatabase();
    }
    /**
     * For MongoDB database we don't create connection, because its single connection already created by a driver.
     */
    async connect() { }
    /**
     * For MongoDB database we don't release connection, because its single connection.
     */
    async release() {
        // releasing connection are not supported by mongodb driver, so simply don't do anything here
    }
    /**
     * Starts transaction.
     */
    async startTransaction() {
        // transactions are not supported by mongodb driver, so simply don't do anything here
    }
    /**
     * Commits transaction.
     */
    async commitTransaction() {
        // transactions are not supported by mongodb driver, so simply don't do anything here
    }
    /**
     * Rollbacks transaction.
     */
    async rollbackTransaction() {
        // transactions are not supported by mongodb driver, so simply don't do anything here
    }
    /**
     * Executes a given SQL query.
     */
    query(query, parameters) {
        throw new error_1.TypeORMError(`Executing SQL query is not supported by MongoDB driver.`);
    }
    /**
     * Returns raw data stream.
     */
    stream(query, parameters, onEnd, onError) {
        throw new error_1.TypeORMError(`Stream is not supported by MongoDB driver. Use watch instead.`);
    }
    /**
     * Insert a new row with given values into the given table.
     * Returns value of inserted object id.

    async insert(collectionName: string, keyValues: ObjectLiteral): Promise<any> { // todo: fix any
        const results = await this.databaseConnection
            .collection(collectionName)
            .insertOne(keyValues);
        const generatedMap = this.connection.getMetadata(collectionName).objectIdColumn!.createValueMap(results.insertedId);
        return {
            result: results,
            generatedMap: generatedMap
        };
    }*/
    /**
     * Updates rows that match given conditions in the given table.

    async update(collectionName: string, valuesMap: ObjectLiteral, conditions: ObjectLiteral): Promise<any> { // todo: fix any
        await this.databaseConnection
            .collection(collectionName)
            .updateOne(conditions, valuesMap);
    }*/
    /**
     * Deletes from the given table by a given conditions.

    async delete(collectionName: string, conditions: ObjectLiteral|ObjectLiteral[]|string, maybeParameters?: any[]): Promise<any> { // todo: fix any
        if (typeof conditions === "string")
            throw new TypeORMError(`String condition is not supported by MongoDB driver.`);

        await this.databaseConnection
            .collection(collectionName)
            .deleteOne(conditions);
    }*/
    /**
     * Returns all available database names including system databases.
     */
    async getDatabases() {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Returns all available schema names including system schemas.
     * If database parameter specified, returns schemas of that database.
     */
    async getSchemas(database) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Loads given table's data from the database.
     */
    async getTable(collectionName) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     */
    async getTables(collectionNames) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Loads given views's data from the database.
     */
    async getView(collectionName) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Loads all views (with given names) from the database and creates a Table from them.
     */
    async getViews(collectionNames) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    getReplicationMode() {
        return "master";
    }
    /**
     * Checks if database with the given name exist.
     */
    async hasDatabase(database) {
        throw new error_1.TypeORMError(`Check database queries are not supported by MongoDB driver.`);
    }
    /**
     * Loads currently using database
     */
    async getCurrentDatabase() {
        throw new error_1.TypeORMError(`Check database queries are not supported by MongoDB driver.`);
    }
    /**
     * Checks if schema with the given name exist.
     */
    async hasSchema(schema) {
        throw new error_1.TypeORMError(`Check schema queries are not supported by MongoDB driver.`);
    }
    /**
     * Loads currently using database schema
     */
    async getCurrentSchema() {
        throw new error_1.TypeORMError(`Check schema queries are not supported by MongoDB driver.`);
    }
    /**
     * Checks if table with the given name exist in the database.
     */
    async hasTable(collectionName) {
        throw new error_1.TypeORMError(`Check schema queries are not supported by MongoDB driver.`);
    }
    /**
     * Checks if column with the given name exist in the given table.
     */
    async hasColumn(tableOrName, columnName) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Creates a database if it's not created.
     */
    async createDatabase(database) {
        throw new error_1.TypeORMError(`Database create queries are not supported by MongoDB driver.`);
    }
    /**
     * Drops database.
     */
    async dropDatabase(database, ifExist) {
        throw new error_1.TypeORMError(`Database drop queries are not supported by MongoDB driver.`);
    }
    /**
     * Creates a new table schema.
     */
    async createSchema(schemaPath, ifNotExist) {
        throw new error_1.TypeORMError(`Schema create queries are not supported by MongoDB driver.`);
    }
    /**
     * Drops table schema.
     */
    async dropSchema(schemaPath, ifExist) {
        throw new error_1.TypeORMError(`Schema drop queries are not supported by MongoDB driver.`);
    }
    /**
     * Creates a new table from the given table and columns inside it.
     */
    async createTable(table) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Drops the table.
     */
    async dropTable(tableName) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Creates a new view.
     */
    async createView(view) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Drops the view.
     */
    async dropView(target) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Renames the given table.
     */
    async renameTable(oldTableOrName, newTableOrName) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Creates a new column from the column in the table.
     */
    async addColumn(tableOrName, column) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Creates a new columns from the column in the table.
     */
    async addColumns(tableOrName, columns) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Renames column in the given table.
     */
    async renameColumn(tableOrName, oldTableColumnOrName, newTableColumnOrName) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Changes a column in the table.
     */
    async changeColumn(tableOrName, oldTableColumnOrName, newColumn) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Changes a column in the table.
     */
    async changeColumns(tableOrName, changedColumns) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Drops column in the table.
     */
    async dropColumn(tableOrName, columnOrName) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Drops the columns in the table.
     */
    async dropColumns(tableOrName, columns) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Creates a new primary key.
     */
    async createPrimaryKey(tableOrName, columnNames) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Updates composite primary keys.
     */
    async updatePrimaryKeys(tableOrName, columns) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Drops a primary key.
     */
    async dropPrimaryKey(tableOrName) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Creates a new unique constraint.
     */
    async createUniqueConstraint(tableOrName, uniqueConstraint) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Creates a new unique constraints.
     */
    async createUniqueConstraints(tableOrName, uniqueConstraints) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Drops an unique constraint.
     */
    async dropUniqueConstraint(tableOrName, uniqueOrName) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Drops an unique constraints.
     */
    async dropUniqueConstraints(tableOrName, uniqueConstraints) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Creates a new check constraint.
     */
    async createCheckConstraint(tableOrName, checkConstraint) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Creates a new check constraints.
     */
    async createCheckConstraints(tableOrName, checkConstraints) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Drops check constraint.
     */
    async dropCheckConstraint(tableOrName, checkOrName) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Drops check constraints.
     */
    async dropCheckConstraints(tableOrName, checkConstraints) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Creates a new exclusion constraint.
     */
    async createExclusionConstraint(tableOrName, exclusionConstraint) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Creates a new exclusion constraints.
     */
    async createExclusionConstraints(tableOrName, exclusionConstraints) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Drops exclusion constraint.
     */
    async dropExclusionConstraint(tableOrName, exclusionOrName) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Drops exclusion constraints.
     */
    async dropExclusionConstraints(tableOrName, exclusionConstraints) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Creates a new foreign key.
     */
    async createForeignKey(tableOrName, foreignKey) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Creates a new foreign keys.
     */
    async createForeignKeys(tableOrName, foreignKeys) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Drops a foreign key from the table.
     */
    async dropForeignKey(tableOrName, foreignKey) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Drops a foreign keys from the table.
     */
    async dropForeignKeys(tableOrName, foreignKeys) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Creates a new index.
     */
    async createIndex(tableOrName, index) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Creates a new indices
     */
    async createIndices(tableOrName, indices) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Drops an index from the table.
     */
    async dropIndex(collectionName, indexName) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Drops an indices from the table.
     */
    async dropIndices(tableOrName, indices) {
        throw new error_1.TypeORMError(`Schema update queries are not supported by MongoDB driver.`);
    }
    /**
     * Drops collection.
     */
    async clearTable(collectionName) {
        await this.databaseConnection
            .db(this.connection.driver.database)
            .dropCollection(collectionName);
    }
    /**
     * Enables special query runner mode in which sql queries won't be executed,
     * instead they will be memorized into a special variable inside query runner.
     * You can get memorized sql using getMemorySql() method.
     */
    enableSqlMemory() {
        throw new error_1.TypeORMError(`This operation is not supported by MongoDB driver.`);
    }
    /**
     * Disables special query runner mode in which sql queries won't be executed
     * started by calling enableSqlMemory() method.
     *
     * Previously memorized sql will be flushed.
     */
    disableSqlMemory() {
        throw new error_1.TypeORMError(`This operation is not supported by MongoDB driver.`);
    }
    /**
     * Flushes all memorized sqls.
     */
    clearSqlMemory() {
        throw new error_1.TypeORMError(`This operation is not supported by MongoDB driver.`);
    }
    /**
     * Gets sql stored in the memory. Parameters in the sql are already replaced.
     */
    getMemorySql() {
        throw new error_1.TypeORMError(`This operation is not supported by MongoDB driver.`);
    }
    /**
     * Executes up sql queries.
     */
    async executeMemoryUpSql() {
        throw new error_1.TypeORMError(`This operation is not supported by MongoDB driver.`);
    }
    /**
     * Executes down sql queries.
     */
    async executeMemoryDownSql() {
        throw new error_1.TypeORMError(`This operation is not supported by MongoDB driver.`);
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Gets collection from the database with a given name.
     */
    getCollection(collectionName) {
        return this.databaseConnection
            .db(this.connection.driver.database)
            .collection(collectionName);
    }
}
exports.MongoQueryRunner = MongoQueryRunner;

//# sourceMappingURL=MongoQueryRunner.js.map
