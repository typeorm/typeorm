import { QueryRunner } from "../../query-runner/QueryRunner";
import { ObjectLiteral } from "../../common/ObjectLiteral";
import { TableColumn } from "../../schema-builder/table/TableColumn";
import { Table } from "../../schema-builder/table/Table";
import { TableForeignKey } from "../../schema-builder/table/TableForeignKey";
import { TableIndex } from "../../schema-builder/table/TableIndex";
import {View} from "../../schema-builder/view/View";
import { Connection } from "../../connection/Connection";
import { ReadStream } from "../../platform/PlatformTools";
import { ArangoEntityManager } from "../../entity-manager/ArangoEntityManager";
import { SqlInMemory } from "../SqlInMemory";
import { TableUnique } from "../../schema-builder/table/TableUnique";
import { Broadcaster } from "../../subscriber/Broadcaster";
import { TableCheck } from "../../schema-builder/table/TableCheck";
import { TableExclusion } from "../../schema-builder/table/TableExclusion";
import { Database, DocumentCollection } from 'arangojs';
import { ArrayCursor } from 'arangojs/lib/cjs/cursor';
import { AqlQuery } from 'arangojs/lib/cjs/aql-query';
import { ImportResult } from 'arangojs/lib/cjs/collection';
import { RemoveByExampleOptions, UpdateByExampleOptions, CollectionFigures } from 'arangojs/lib/cjs/util/types';

/**
 * Runs queries on a single MongoDB connection.
 */
export class ArangoQueryRunner implements QueryRunner {

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Connection used by this query runner.
     */
    connection: Connection;

    /**
     * Broadcaster used on this query runner to broadcast entity events.
     */
    broadcaster: Broadcaster;

    /**
     * Entity manager working only with current query runner.
     */
    manager: ArangoEntityManager;

    /**
     * Indicates if connection for this query runner is released.
     * Once its released, query runner cannot run queries anymore.
     * Always false for arangodb since arangodb has a single query executor instance.
     */
    isReleased = false;

    /**
     * Indicates if transaction is active in this query executor.
     * Always false for arangodb since arangodb does not support transactions.
     */
    isTransactionActive = false;

    /**
     * Stores temporarily user data.
     * Useful for sharing data with subscribers.
     */
    data = {};

    /**
     * All synchronized tables in the database.
     */
    loadedTables: Table[];

    /**
     * All synchronized views in the database.
     */
    loadedViews: View[];

    /**
     * Real database connection from a connection pool used to perform queries.
     */
    databaseConnection: Database;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection, databaseConnection: Database) {
        this.connection = connection;
        this.databaseConnection = databaseConnection;
        this.broadcaster = new Broadcaster(this);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a cursor for a query that can be used to iterate over results from ArangoDB.
     */
    async cursor(collectionName: string, query?: AqlQuery): Promise<ArrayCursor> {
        // if (query) {
        //     return await this.databaseConnection.query(query)
        // }
        // const collection = this.getCollection(collectionName)
        // return await this.databaseConnection.query(aql`for i in ${collection} return i`)
        throw new Error('Not defined.')
    }

    /**
     * Execute an aggregation framework pipeline against the collection.
     */
    aggregate(collectionName: string, pipeline: ObjectLiteral[], options?: ObjectLiteral): Promise<ArrayCursor> {
        throw new Error('Not defined.')
    }

    /**
     * Perform a bulkWrite operation without a fluent API.
     * Not supported in arangojs
     */
    async bulkWrite(collectionName: string, operations: ObjectLiteral[], options?: any): Promise<any> {
        throw new Error('Not defined.')
    }

    /**
     * Count number of matching documents in the db to a query.
     */
    async count(collectionName: string, query?: AqlQuery): Promise<number> {
        // const cur = await this.cursor(collectionName, query);
        // return cur.count
        throw new Error('Not defined.')
    }

    /**
     * Creates an index on the db and collection.
     */
    async createCollectionIndex(collectionName: string, details: ObjectLiteral): Promise<string> {
        // return await this.getCollection(collectionName).ensurevIndex(details);
        throw new Error('Not defined.')
    }

    /**
     * Creates multiple indexes in the collection.
     */
    async createCollectionIndexes(collectionName: string, indexSpecs: ObjectLiteral[]): Promise<any> {
        // return await Promise.all(indexSpecs.map(async (i) => await this.getCollection(collectionName).createIndex(i) ))
        throw new Error('Not defined.')
    }

    /**
     * Delete multiple documents.
     */
    async deleteMany(collectionName: string, example: ObjectLiteral, options?: RemoveByExampleOptions): Promise<any> {
        // return await this.getCollection(collectionName).removeByExample(example, options);
        throw new Error('Not defined.')
    }

    /**
     * Delete a document on ArangoDB.
     */
    async deleteOne(collectionName: string, example: Object, options?: RemoveByExampleOptions): Promise<any> {
        // return await this.getCollection(collectionName).removeByExample(example, Object.assign(options, {limit: 1}));
        throw new Error('Not defined.')
    }

    /**
     * The distinct command returns a list of distinct values for the given key across a collection.
     * Not supported in arango
     */
    async distinct(collectionName: string, key: string, query: AqlQuery): Promise<any> {
        throw new Error('Not defined.')
    }
    /**
     * Drops an index from this collection.
     */
    async dropCollectionIndex(collectionName: string, indexName: string): Promise<any> {
        // return await this.getCollection(collectionName).dropIndex(indexName);
        throw new Error('Not defined.')
    }

    /**
     * Drops all indexes from the collection.
     */
    async dropCollectionIndexes(collectionName: string): Promise<any> {
        // const indexes: any[] = await this.getCollection(collectionName).indexes()
        // return Promise.all(indexes.map(i => await this.getCollection(collectionName).dropIndex(i))
        throw new Error('Not defined.')
    }

    /**
     * Find a document and delete it in one atomic operation, requires a write lock for the duration of the operation.
     */
    async findOneAndDelete(collectionName: string, example: Object, options?: RemoveByExampleOptions): Promise<any> {
        // return await this.getCollection(collectionName).removeByExample(example, Object.assign(options, {limit: 1}))
        throw new Error('Not defined.')
    }

    /**
     * Find a document and replace it in one atomic operation, requires a write lock for the duration of the operation.
     */
    async findOneAndReplace(collectionName: string, example: any, replacement: any, options?: {
        waitForSync?: boolean;
        limit?: number;
    }): Promise<any> {
        // return await this.getCollection(collectionName).replaceByExample(example, Object.assign(options, {limit: 1}));
        throw new Error('Not defined.')
    }

    /**
     * Find a document and update it in one atomic operation, requires a write lock for the duration of the operation.
     */
    async findOneAndUpdate(collectionName: string, example: ObjectLiteral, update: Object, options?: UpdateByExampleOptions): Promise<any> {
        // return await this.getCollection(collectionName).updateByExample(example, update, Object.assign(options, {limit: 1}));
        throw new Error('Not defined.')
    }

    /**
     * Execute a geo search using a geo haystack index on a collection.
     */
    async geoHaystackSearch(collectionName: string, x: number, y: number, options?: any): Promise<any> {
        throw new Error('Not defined.')
    }

    /**
     * Execute the geoNear command to search for items in the collection.
     */
    async geoNear(collectionName: string, x: number, y: number, options?: any): Promise<any> {
        throw new Error('Not defined.')
    }

    /**
     * Run a group command across a collection.
     */
    async group(collectionName: string, keys: Object | Array<any> | Function, condition: Object, initial: Object, reduce: Function , finalize: Function , command: boolean, options?: any): Promise<any> {
        throw new Error('Not defined.')
    }

    /**
     * Retrieve all the indexes on the collection.
     */
    async collectionIndexes(collectionName: string): Promise<any> {
        // return await this.getCollection(collectionName).indexes();
        throw new Error('Not defined.')
    }

    /**
     * Retrieve all the indexes on the collection.
     */
    async collectionIndexExists(collectionName: string, indexes: string | string[]): Promise<boolean> {
        throw new Error('Not defined.')
    }

    /**
     * Retrieves this collections index info.
     */
    async collectionIndexInformation(collectionName: string, options?: { full: boolean }): Promise<any> {
        throw new Error('Not defined.')
    }

    /**
     * Initiate an In order bulk write operation, operations will be serially executed in the order they are added, creating a new operation for each switch in types.
     * ArangoDB does not have such a concept.
     */
    initializeOrderedBulkOp(collectionName: string, options?: any): any {
        throw new Error('Not defined.')
    }

    /**
     * Initiate a Out of order batch write operation. All operations will be buffered into insert/update/remove commands executed out of order.
     * ArangoDB does not have such a concept.
     */
    initializeUnorderedBulkOp(collectionName: string, options?: any): any {
        throw new Error('Not defined.')
    }

    /**
     * Inserts an array of documents into MongoDB.
     */
    async insertMany(collectionName: string, docs: ObjectLiteral[], options?: {
        type?: 'auto' | 'documents' | 'array'
        fromPrefix?: string
        toPrefix?: string
        overwrite?: boolean
        waitForSync?: boolean
        onDuplicate?: 'error' | 'replace' | 'update' | 'ignore'
        complete?: boolean
        details?: boolean
    }): Promise<ImportResult> {
        // return await this.getCollection(collectionName).import(docs, options);
        throw new Error('Not defined.')
    }

    /**
     * Inserts a single document into MongoDB.
     */
    async insertOne(collectionName: string, doc: ObjectLiteral, options?: {
        waitForSync?: boolean
        returnNew?: boolean
        returnOld?: boolean
        silent?: boolean
        overwrite?: boolean
    }): Promise<any> {
        // return await this.getCollection(collectionName).save(doc, options);
        throw new Error('Not defined.')
    }

    /**
     * Returns if the collection is a capped collection.
     */
    async isCapped(collectionName: string): Promise<any> {
        throw new Error('Not defined.')
    }

    /**
     * Get the list of all indexes information for the collection.
     */
    async listCollectionIndexes(collectionName: string): Promise<any> {
        // return await this.getCollection(collectionName).indexes();
        throw new Error('Not defined.')
    }

    /**
     * Run Map Reduce across a collection. Be aware that the inline option for out will return an array of results not a collection.
     * No such concept in Arangodb
     */
    async mapReduce(collectionName: string, map: Function | string, reduce: Function | string, options?: any): Promise<any> {
        // return await this.getCollection(collectionName).mapReduce(map, reduce, options);
        throw new Error('Not defined.')
    }

    /**
     * Return N number of parallel cursors for a collection allowing parallel reading of entire collection.
     * There are no ordering guarantees for returned results.
     * No such concept in Arangodb
     */
    async parallelCollectionScan(collectionName: string, options?: any): Promise<any> {
        throw new Error('Not defined.')
    }

    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     * No such concept in Arangodb
     */
    async reIndex(collectionName: string): Promise<any> {
        throw new Error('Not defined.')
    }

    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     */
    async rename(collectionName: string, newName: string): Promise<any> {
        // return await this.getCollection(collectionName).rename(newName);
        throw new Error('Not defined.')
    }

    /**
     * Replace a document on MongoDB.
     */
    async replaceOne(collectionName: string, handle: string, doc: ObjectLiteral, options?: {
        waitForSync?: boolean
        rev?: string
        policy?: 'last' | 'error'
    }): Promise<any> {
        // return await this.getCollection(collectionName).replace(handle, doc, options);
        throw new Error('Not defined.')
    }

    /**
     * Get all the collection statistics.
     */
    async stats(collectionName: string): Promise<CollectionFigures> {
        // return await this.getCollection(collectionName).figures();
        throw new Error('Not defined.')
    }

    /**
     * Watching new changes as stream.
     * No such concept in Arangodb
     */
    watch(collectionName: string, pipeline?: Object[], options?: any): any {
        throw new Error('Not defined.')
    }

    /**
     * Update multiple documents on MongoDB.
     */
    async updateMany(collectionName: string, update: ObjectLiteral, options?: { 
        waitForSync?: boolean
        keepNull?: boolean
        mergeObjects?: boolean
        returnOld?: boolean
        returnNew?: boolean
        ignoreRevs?: boolean
    }): Promise<any> {
        // return await this.getCollection(collectionName).bulkUpdate( update, options);
        throw new Error('Not defined.')
    }

    /**
     * Update a single document on MongoDB.
     */
    async updateOne(collectionName: string, example: ObjectLiteral, update: ObjectLiteral, options?: {
        keepNull?: boolean
        waitForSync?: boolean
        mergeObjects?: boolean
    }): Promise<any> {
        // return await this.getCollection(collectionName).updateByExample(example, update, Object.assign(options, {limit: 1}));
        throw new Error('Not defined.')
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
        // await this.databaseConnection.truncate()
        // return
        throw new Error('Not defined.')
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
        // releasing connection are not supported by Arangodb driver, so simply don't do anything here
    }

    /**
     * Starts transaction.
     */
    async startTransaction(): Promise<void> {
        // return this.databaseConnection.beginTransaction()
        // transactions are not supported by Arangodb driver, so simply don't do anything here
    }

    /**
     * Commits transaction.
     */
    async commitTransaction(): Promise<void> {
        // const transaction = this.databaseConnection.transaction()
        // await transaction.commit()
        // return

        // transactions are not supported by Arangodb driver, so simply don't do anything here
    }

    /**
     * Rollbacks transaction.
     */
    async rollbackTransaction(): Promise<void> {
        // transactions are not supported by Arangodb driver, so simply don't do anything here
    }

    /**
     * Executes a given SQL query.
     */
    query(query: string, parameters?: any[]): Promise<any> {
        throw new Error(`Executing SQL query is not supported by ArangoDB driver.`);
    }

    /**
     * Returns raw data stream.
     */
    stream(query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream> {
        throw new Error(`Stream is not supported by ArangoDB driver. Use watch instead.`);
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
            throw new Error(`String condition is not supported by ArangoDB driver.`);

        await this.databaseConnection
            .collection(collectionName)
            .deleteOne(conditions);
    }*/

    /**
     * Returns all available database names including system databases.
     */
    async getDatabases(): Promise<string[]> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Returns all available schema names including system schemas.
     * If database parameter specified, returns schemas of that database.
     */
    async getSchemas(database?: string): Promise<string[]> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Loads given table's data from the database.
     */
    async getTable(collectionName: string): Promise<Table | undefined> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     */
    async getTables(collectionNames: string[]): Promise<Table[]> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Loads given views's data from the database.
     */
    async getView(collectionName: string): Promise<View | undefined> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Loads all views (with given names) from the database and creates a Table from them.
     */
    async getViews(collectionNames: string[]): Promise<View[]> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Checks if database with the given name exist.
     */
    async hasDatabase(database: string): Promise<boolean> {
        throw new Error(`Check database queries are not supported by ArangoDB driver.`);
    }

    /**
     * Checks if schema with the given name exist.
     */
    async hasSchema(schema: string): Promise<boolean> {
        throw new Error(`Check schema queries are not supported by ArangoDB driver.`);
    }

    /**
     * Checks if table with the given name exist in the database.
     */
    async hasTable(collectionName: string): Promise<boolean> {
        throw new Error(`Check schema queries are not supported by ArangoDB driver.`);
    }

    /**
     * Checks if column with the given name exist in the given table.
     */
    async hasColumn(tableOrName: Table | string, columnName: string): Promise<boolean> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Creates a database if it's not created.
     */
    async createDatabase(database: string): Promise<void> {
        throw new Error(`Database create queries are not supported by ArangoDB driver.`);
    }

    /**
     * Drops database.
     */
    async dropDatabase(database: string, ifExist?: boolean): Promise<void> {
        throw new Error(`Database drop queries are not supported by ArangoDB driver.`);
    }

    /**
     * Creates a new table schema.
     */
    async createSchema(schema: string, ifNotExist?: boolean): Promise<void> {
        throw new Error(`Schema create queries are not supported by ArangoDB driver.`);
    }

    /**
     * Drops table schema.
     */
    async dropSchema(schemaPath: string, ifExist?: boolean): Promise<void> {
        throw new Error(`Schema drop queries are not supported by ArangoDB driver.`);
    }

    /**
     * Creates a new table from the given table and columns inside it.
     */
    async createTable(table: Table): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Drops the table.
     */
    async dropTable(tableName: Table | string): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Creates a new view.
     */
    async createView(view: View): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Drops the view.
     */
    async dropView(target: View|string): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Renames the given table.
     */
    async renameTable(oldTableOrName: Table | string, newTableOrName: Table | string): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Creates a new column from the column in the table.
     */
    async addColumn(tableOrName: Table | string, column: TableColumn): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Creates a new columns from the column in the table.
     */
    async addColumns(tableOrName: Table | string, columns: TableColumn[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Renames column in the given table.
     */
    async renameColumn(tableOrName: Table | string, oldTableColumnOrName: TableColumn | string, newTableColumnOrName: TableColumn | string): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Changes a column in the table.
     */
    async changeColumn(tableOrName: Table | string, oldTableColumnOrName: TableColumn | string, newColumn: TableColumn): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Changes a column in the table.
     */
    async changeColumns(tableOrName: Table | string, changedColumns: { newColumn: TableColumn, oldColumn: TableColumn }[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Drops column in the table.
     */
    async dropColumn(tableOrName: Table | string, columnOrName: TableColumn | string): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Drops the columns in the table.
     */
    async dropColumns(tableOrName: Table | string, columns: TableColumn[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Creates a new primary key.
     */
    async createPrimaryKey(tableOrName: Table | string, columnNames: string[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Updates composite primary keys.
     */
    async updatePrimaryKeys(tableOrName: Table | string, columns: TableColumn[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Drops a primary key.
     */
    async dropPrimaryKey(tableOrName: Table | string): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Creates a new unique constraint.
     */
    async createUniqueConstraint(tableOrName: Table | string, uniqueConstraint: TableUnique): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Creates a new unique constraints.
     */
    async createUniqueConstraints(tableOrName: Table | string, uniqueConstraints: TableUnique[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Drops an unique constraint.
     */
    async dropUniqueConstraint(tableOrName: Table | string, uniqueOrName: TableUnique | string): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Drops an unique constraints.
     */
    async dropUniqueConstraints(tableOrName: Table | string, uniqueConstraints: TableUnique[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Creates a new check constraint.
     */
    async createCheckConstraint(tableOrName: Table | string, checkConstraint: TableCheck): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Creates a new check constraints.
     */
    async createCheckConstraints(tableOrName: Table | string, checkConstraints: TableCheck[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Drops check constraint.
     */
    async dropCheckConstraint(tableOrName: Table | string, checkOrName: TableCheck | string): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Drops check constraints.
     */
    async dropCheckConstraints(tableOrName: Table | string, checkConstraints: TableCheck[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Creates a new exclusion constraint.
     */
    async createExclusionConstraint(tableOrName: Table | string, exclusionConstraint: TableExclusion): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Creates a new exclusion constraints.
     */
    async createExclusionConstraints(tableOrName: Table | string, exclusionConstraints: TableExclusion[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Drops exclusion constraint.
     */
    async dropExclusionConstraint(tableOrName: Table | string, exclusionOrName: TableExclusion | string): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Drops exclusion constraints.
     */
    async dropExclusionConstraints(tableOrName: Table | string, exclusionConstraints: TableExclusion[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Creates a new foreign key.
     */
    async createForeignKey(tableOrName: Table | string, foreignKey: TableForeignKey): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Creates a new foreign keys.
     */
    async createForeignKeys(tableOrName: Table | string, foreignKeys: TableForeignKey[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Drops a foreign key from the table.
     */
    async dropForeignKey(tableOrName: Table | string, foreignKey: TableForeignKey): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Drops a foreign keys from the table.
     */
    async dropForeignKeys(tableOrName: Table | string, foreignKeys: TableForeignKey[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Creates a new index.
     */
    async createIndex(tableOrName: Table | string, index: TableIndex): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Creates a new indices
     */
    async createIndices(tableOrName: Table | string, indices: TableIndex[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(collectionName: string, indexName: string): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Drops an indices from the table.
     */
    async dropIndices(tableOrName: Table | string, indices: TableIndex[]): Promise<void> {
        throw new Error(`Schema update queries are not supported by ArangoDB driver.`);
    }

    /**
     * Drops collection.
     */
    async clearTable(collectionName: string): Promise<void> {
        await this.getCollection(collectionName).drop()
        return
    }

    /**
     * Enables special query runner mode in which sql queries won't be executed,
     * instead they will be memorized into a special variable inside query runner.
     * You can get memorized sql using getMemorySql() method.
     */
    enableSqlMemory(): void {
        throw new Error(`This operation is not supported by ArangoDB driver.`);
    }

    /**
     * Disables special query runner mode in which sql queries won't be executed
     * started by calling enableSqlMemory() method.
     *
     * Previously memorized sql will be flushed.
     */
    disableSqlMemory(): void {
        throw new Error(`This operation is not supported by ArangoDB driver.`);
    }

    /**
     * Flushes all memorized sqls.
     */
    clearSqlMemory(): void {
        throw new Error(`This operation is not supported by ArangoDB driver.`);
    }

    /**
     * Gets sql stored in the memory. Parameters in the sql are already replaced.
     */
    getMemorySql(): SqlInMemory {
        throw new Error(`This operation is not supported by ArangoDB driver.`);
    }

    /**
     * Executes up sql queries.
     */
    async executeMemoryUpSql(): Promise<void> {
        throw new Error(`This operation is not supported by ArangoDB driver.`);
    }

    /**
     * Executes down sql queries.
     */
    async executeMemoryDownSql(): Promise<void> {
        throw new Error(`This operation is not supported by ArangoDB driver.`);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Gets collection from the database with a given name.
     */
    protected getCollection(collectionName: string): DocumentCollection<any> {
        return this.databaseConnection.collection(collectionName)
    }

}
