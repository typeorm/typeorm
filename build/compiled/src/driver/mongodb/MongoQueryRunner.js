"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoQueryRunner = void 0;
const tslib_1 = require("tslib");
const Broadcaster_1 = require("../../subscriber/Broadcaster");
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
    bulkWrite(collectionName, operations, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).bulkWrite(operations, options);
        });
    }
    /**
     * Count number of matching documents in the db to a query.
     */
    count(collectionName, query, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).countDocuments(query || {}, options);
        });
    }
    /**
     * Creates an index on the db and collection.
     */
    createCollectionIndex(collectionName, fieldOrSpec, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).createIndex(fieldOrSpec, options);
        });
    }
    /**
     * Creates multiple indexes in the collection, this method is only supported for MongoDB 2.6 or higher.
     * Earlier version of MongoDB will throw a command not supported error. Index specifications are defined at http://docs.mongodb.org/manual/reference/command/createIndexes/.
     */
    createCollectionIndexes(collectionName, indexSpecs) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).createIndexes(indexSpecs);
        });
    }
    /**
     * Delete multiple documents on MongoDB.
     */
    deleteMany(collectionName, query, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).deleteMany(query, options);
        });
    }
    /**
     * Delete a document on MongoDB.
     */
    deleteOne(collectionName, query, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).deleteOne(query, options);
        });
    }
    /**
     * The distinct command returns returns a list of distinct values for the given key across a collection.
     */
    distinct(collectionName, key, query, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).distinct(key, query, options);
        });
    }
    /**
     * Drops an index from this collection.
     */
    dropCollectionIndex(collectionName, indexName, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).dropIndex(indexName, options);
        });
    }
    /**
     * Drops all indexes from the collection.
     */
    dropCollectionIndexes(collectionName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).dropIndexes();
        });
    }
    /**
     * Find a document and delete it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndDelete(collectionName, query, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).findOneAndDelete(query, options);
        });
    }
    /**
     * Find a document and replace it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndReplace(collectionName, query, replacement, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).findOneAndReplace(query, replacement, options);
        });
    }
    /**
     * Find a document and update it in one atomic operation, requires a write lock for the duration of the operation.
     */
    findOneAndUpdate(collectionName, query, update, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).findOneAndUpdate(query, update, options);
        });
    }
    /**
     * Execute a geo search using a geo haystack index on a collection.
     */
    geoHaystackSearch(collectionName, x, y, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).geoHaystackSearch(x, y, options);
        });
    }
    /**
     * Execute the geoNear command to search for items in the collection.
     */
    geoNear(collectionName, x, y, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).geoNear(x, y, options);
        });
    }
    /**
     * Run a group command across a collection.
     */
    group(collectionName, keys, condition, initial, reduce, finalize, command, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).group(keys, condition, initial, reduce, finalize, command, options);
        });
    }
    /**
     * Retrieve all the indexes on the collection.
     */
    collectionIndexes(collectionName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).indexes();
        });
    }
    /**
     * Retrieve all the indexes on the collection.
     */
    collectionIndexExists(collectionName, indexes) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).indexExists(indexes);
        });
    }
    /**
     * Retrieves this collections index info.
     */
    collectionIndexInformation(collectionName, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).indexInformation(options);
        });
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
    insertMany(collectionName, docs, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).insertMany(docs, options);
        });
    }
    /**
     * Inserts a single document into MongoDB.
     */
    insertOne(collectionName, doc, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).insertOne(doc, options);
        });
    }
    /**
     * Returns if the collection is a capped collection.
     */
    isCapped(collectionName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).isCapped();
        });
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
    mapReduce(collectionName, map, reduce, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).mapReduce(map, reduce, options);
        });
    }
    /**
     * Return N number of parallel cursors for a collection allowing parallel reading of entire collection.
     * There are no ordering guarantees for returned results.
     */
    parallelCollectionScan(collectionName, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).parallelCollectionScan(options);
        });
    }
    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    reIndex(collectionName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).reIndex();
        });
    }
    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    rename(collectionName, newName, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).rename(newName, options);
        });
    }
    /**
     * Replace a document on MongoDB.
     */
    replaceOne(collectionName, query, doc, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).replaceOne(query, doc, options);
        });
    }
    /**
     * Get all the collection statistics.
     */
    stats(collectionName, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).stats(options);
        });
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
    updateMany(collectionName, query, update, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).updateMany(query, update, options);
        });
    }
    /**
     * Update a single document on MongoDB.
     */
    updateOne(collectionName, query, update, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield this.getCollection(collectionName).updateOne(query, update, options);
        });
    }
    // -------------------------------------------------------------------------
    // Public Implemented Methods (from QueryRunner)
    // -------------------------------------------------------------------------
    /**
     * Removes all collections from the currently connected database.
     * Be careful with using this method and avoid using it in production or migrations
     * (because it can clear all your database).
     */
    clearDatabase() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.databaseConnection.db(this.connection.driver.database).dropDatabase();
        });
    }
    /**
     * For MongoDB database we don't create connection, because its single connection already created by a driver.
     */
    connect() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
        });
    }
    /**
     * For MongoDB database we don't release connection, because its single connection.
     */
    release() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // releasing connection are not supported by mongodb driver, so simply don't do anything here
        });
    }
    /**
     * Starts transaction.
     */
    startTransaction() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // transactions are not supported by mongodb driver, so simply don't do anything here
        });
    }
    /**
     * Commits transaction.
     */
    commitTransaction() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // transactions are not supported by mongodb driver, so simply don't do anything here
        });
    }
    /**
     * Rollbacks transaction.
     */
    rollbackTransaction() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // transactions are not supported by mongodb driver, so simply don't do anything here
        });
    }
    /**
     * Executes a given SQL query.
     */
    query(query, parameters) {
        throw new Error(`Executing SQL query is not supported by MongoDB driver.`);
    }
    /**
     * Returns raw data stream.
     */
    stream(query, parameters, onEnd, onError) {
        throw new Error(`Stream is not supported by MongoDB driver. Use watch instead.`);
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
            throw new Error(`String condition is not supported by MongoDB driver.`);

        await this.databaseConnection
            .collection(collectionName)
            .deleteOne(conditions);
    }*/
    /**
     * Returns all available database names including system databases.
     */
    getDatabases() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Returns all available schema names including system schemas.
     * If database parameter specified, returns schemas of that database.
     */
    getSchemas(database) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Loads given table's data from the database.
     */
    getTable(collectionName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     */
    getTables(collectionNames) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Loads given views's data from the database.
     */
    getView(collectionName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Loads all views (with given names) from the database and creates a Table from them.
     */
    getViews(collectionNames) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Checks if database with the given name exist.
     */
    hasDatabase(database) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Check database queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Checks if schema with the given name exist.
     */
    hasSchema(schema) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Check schema queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Checks if table with the given name exist in the database.
     */
    hasTable(collectionName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Check schema queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Checks if column with the given name exist in the given table.
     */
    hasColumn(tableOrName, columnName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Creates a database if it's not created.
     */
    createDatabase(database) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Database create queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Drops database.
     */
    dropDatabase(database, ifExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Database drop queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Creates a new table schema.
     */
    createSchema(schema, ifNotExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema create queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Drops table schema.
     */
    dropSchema(schemaPath, ifExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema drop queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Creates a new table from the given table and columns inside it.
     */
    createTable(table) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Drops the table.
     */
    dropTable(tableName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Creates a new view.
     */
    createView(view) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Drops the view.
     */
    dropView(target) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Renames the given table.
     */
    renameTable(oldTableOrName, newTableOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Creates a new column from the column in the table.
     */
    addColumn(tableOrName, column) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Creates a new columns from the column in the table.
     */
    addColumns(tableOrName, columns) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Renames column in the given table.
     */
    renameColumn(tableOrName, oldTableColumnOrName, newTableColumnOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Changes a column in the table.
     */
    changeColumn(tableOrName, oldTableColumnOrName, newColumn) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Changes a column in the table.
     */
    changeColumns(tableOrName, changedColumns) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Drops column in the table.
     */
    dropColumn(tableOrName, columnOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Drops the columns in the table.
     */
    dropColumns(tableOrName, columns) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Creates a new primary key.
     */
    createPrimaryKey(tableOrName, columnNames) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Updates composite primary keys.
     */
    updatePrimaryKeys(tableOrName, columns) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Drops a primary key.
     */
    dropPrimaryKey(tableOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Creates a new unique constraint.
     */
    createUniqueConstraint(tableOrName, uniqueConstraint) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Creates a new unique constraints.
     */
    createUniqueConstraints(tableOrName, uniqueConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Drops an unique constraint.
     */
    dropUniqueConstraint(tableOrName, uniqueOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Drops an unique constraints.
     */
    dropUniqueConstraints(tableOrName, uniqueConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Creates a new check constraint.
     */
    createCheckConstraint(tableOrName, checkConstraint) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Creates a new check constraints.
     */
    createCheckConstraints(tableOrName, checkConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Drops check constraint.
     */
    dropCheckConstraint(tableOrName, checkOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Drops check constraints.
     */
    dropCheckConstraints(tableOrName, checkConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Creates a new exclusion constraint.
     */
    createExclusionConstraint(tableOrName, exclusionConstraint) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Creates a new exclusion constraints.
     */
    createExclusionConstraints(tableOrName, exclusionConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Drops exclusion constraint.
     */
    dropExclusionConstraint(tableOrName, exclusionOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Drops exclusion constraints.
     */
    dropExclusionConstraints(tableOrName, exclusionConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Creates a new foreign key.
     */
    createForeignKey(tableOrName, foreignKey) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Creates a new foreign keys.
     */
    createForeignKeys(tableOrName, foreignKeys) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Drops a foreign key from the table.
     */
    dropForeignKey(tableOrName, foreignKey) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Drops a foreign keys from the table.
     */
    dropForeignKeys(tableOrName, foreignKeys) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Creates a new index.
     */
    createIndex(tableOrName, index) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Creates a new indices
     */
    createIndices(tableOrName, indices) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Drops an index from the table.
     */
    dropIndex(collectionName, indexName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Drops an indices from the table.
     */
    dropIndices(tableOrName, indices) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema update queries are not supported by MongoDB driver.`);
        });
    }
    /**
     * Drops collection.
     */
    clearTable(collectionName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.databaseConnection
                .db(this.connection.driver.database)
                .dropCollection(collectionName);
        });
    }
    /**
     * Enables special query runner mode in which sql queries won't be executed,
     * instead they will be memorized into a special variable inside query runner.
     * You can get memorized sql using getMemorySql() method.
     */
    enableSqlMemory() {
        throw new Error(`This operation is not supported by MongoDB driver.`);
    }
    /**
     * Disables special query runner mode in which sql queries won't be executed
     * started by calling enableSqlMemory() method.
     *
     * Previously memorized sql will be flushed.
     */
    disableSqlMemory() {
        throw new Error(`This operation is not supported by MongoDB driver.`);
    }
    /**
     * Flushes all memorized sqls.
     */
    clearSqlMemory() {
        throw new Error(`This operation is not supported by MongoDB driver.`);
    }
    /**
     * Gets sql stored in the memory. Parameters in the sql are already replaced.
     */
    getMemorySql() {
        throw new Error(`This operation is not supported by MongoDB driver.`);
    }
    /**
     * Executes up sql queries.
     */
    executeMemoryUpSql() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`This operation is not supported by MongoDB driver.`);
        });
    }
    /**
     * Executes down sql queries.
     */
    executeMemoryDownSql() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`This operation is not supported by MongoDB driver.`);
        });
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Gets collection from the database with a given name.
     */
    getCollection(collectionName) {
        return this.databaseConnection.db(this.connection.driver.database).collection(collectionName);
    }
}
exports.MongoQueryRunner = MongoQueryRunner;
//# sourceMappingURL=MongoQueryRunner.js.map