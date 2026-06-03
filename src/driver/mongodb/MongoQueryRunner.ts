import type { DataSource } from "../../data-source/DataSource"
import type {
    AggregateOptions,
    AggregationCursor,
    AnyBulkWriteOperation,
    BulkWriteOptions,
    BulkWriteResult,
    ChangeStream,
    ChangeStreamOptions,
    Collection,
    CommandOperationOptions,
    CountDocumentsOptions,
    CountOptions,
    CreateIndexesOptions,
    DeleteOptions,
    DeleteResult,
    Document,
    Filter,
    FindCursor,
    FindOneAndDeleteOptions,
    FindOneAndReplaceOptions,
    FindOneAndUpdateOptions,
    IndexDescription,
    IndexInformationOptions,
    IndexSpecification,
    InsertManyResult,
    InsertOneOptions,
    InsertOneResult,
    ListIndexesCursor,
    ListIndexesOptions,
    DropIndexesOptions,
    ClientSession,
    MongoClient,
    OperationOptions,
    OptionalId,
    OrderedBulkOperation,
    RenameOptions,
    ReplaceOptions,
    TransactionOptions,
    UnorderedBulkOperation,
    UpdateFilter,
    UpdateOptions,
    UpdateResult,
} from "../../driver/mongodb/typings"
import type { MongoEntityManager } from "../../entity-manager/MongoEntityManager"
import { TypeORMError } from "../../error"
import type { ReadStream } from "../../platform/PlatformTools"
import type { QueryRunner } from "../../query-runner/QueryRunner"
import type { Table } from "../../schema-builder/table/Table"
import type { TableCheck } from "../../schema-builder/table/TableCheck"
import type { TableColumn } from "../../schema-builder/table/TableColumn"
import type { TableExclusion } from "../../schema-builder/table/TableExclusion"
import type { TableForeignKey } from "../../schema-builder/table/TableForeignKey"
import type { TableIndex } from "../../schema-builder/table/TableIndex"
import type { TableUnique } from "../../schema-builder/table/TableUnique"
import type { View } from "../../schema-builder/view/View"
import { Broadcaster } from "../../subscriber/Broadcaster"
import type { SqlInMemory } from "../SqlInMemory"
import type { ReplicationMode } from "../types/ReplicationMode"
import type { IsolationLevel } from "../types/IsolationLevel"
import { QueryRunnerAlreadyReleasedError } from "../../error"
import { TransactionAlreadyStartedError } from "../../error"
import { TransactionNotStartedError } from "../../error"

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
    dataSource: DataSource

    /**
     * DataSource used by the driver.
     *
     * @deprecated since 1.0.0. Use {@link dataSource} instance instead.
     */
    get connection(): DataSource {
        return this.dataSource
    }

    /**
     * Broadcaster used on this query runner to broadcast entity events.
     */
    broadcaster: Broadcaster

    /**
     * Entity manager working only with current query runner.
     */
    manager: MongoEntityManager

    /**
     * Indicates if connection for this query runner is released.
     * Once released, query runner cannot run queries anymore.
     */
    isReleased = false

    /**
     * Indicates if transaction is active in this query executor.
     */
    isTransactionActive = false

    /**
     * Active mongodb session used by the current transaction.
     */
    protected session?: ClientSession

    /**
     * Stores temporarily user data.
     * Useful for sharing data with subscribers.
     */
    data = {}

    /**
     * Real database connection from a connection pool used to perform queries.
     */
    databaseConnection: MongoClient

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(dataSource: DataSource, databaseConnection: MongoClient) {
        this.dataSource = dataSource
        this.databaseConnection = databaseConnection
        this.broadcaster = new Broadcaster(this)
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Called before migrations are run.
     */
    async beforeMigration(): Promise<void> {
        // Do nothing
    }

    /**
     * Called after migrations are run.
     */
    async afterMigration(): Promise<void> {
        // Do nothing
    }

    /**
     * Creates a cursor for a query that can be used to iterate over results from MongoDB.
     *
     * @param collectionName
     * @param filter
     */
    cursor(collectionName: string, filter: Filter<Document>): FindCursor<any> {
        return this.getCollection(collectionName).find(
            filter || {},
            this.getSessionOptions(),
        )
    }

    /**
     * Execute an aggregation framework pipeline against the collection.
     *
     * @param collectionName
     * @param pipeline
     * @param options
     */
    aggregate(
        collectionName: string,
        pipeline: Document[],
        options?: AggregateOptions,
    ): AggregationCursor<any> {
        return this.getCollection(collectionName).aggregate(
            pipeline,
            this.getSessionOptions(options),
        )
    }

    /**
     * Perform a bulkWrite operation without a fluent API.
     *
     * @param collectionName
     * @param operations
     * @param options
     */
    async bulkWrite(
        collectionName: string,
        operations: AnyBulkWriteOperation<Document>[],
        options?: BulkWriteOptions,
    ): Promise<BulkWriteResult> {
        return await this.getCollection(collectionName).bulkWrite(
            operations,
            this.getSessionOptions(options),
        )
    }

    /**
     * Count number of matching documents in the db to a query.
     *
     * @param collectionName
     * @param filter
     * @param options
     */
    async count(
        collectionName: string,
        filter: Filter<Document>,
        options?: CountOptions,
    ): Promise<number> {
        return this.getCollection(collectionName).count(
            filter || {},
            this.getSessionOptions(options),
        )
    }

    /**
     * Count number of matching documents in the db to a query.
     *
     * @param collectionName
     * @param filter
     * @param options
     */
    async countDocuments(
        collectionName: string,
        filter: Filter<Document>,
        options?: CountDocumentsOptions,
    ): Promise<any> {
        return this.getCollection(collectionName).countDocuments(
            filter || {},
            this.getSessionOptions(options),
        )
    }

    /**
     * Creates an index on the db and collection.
     *
     * @param collectionName
     * @param indexSpec
     * @param options
     */
    async createCollectionIndex(
        collectionName: string,
        indexSpec: IndexSpecification,
        options?: CreateIndexesOptions,
    ): Promise<string> {
        return this.getCollection(collectionName).createIndex(
            indexSpec,
            this.getSessionOptions(options),
        )
    }

    /**
     * Creates multiple indexes in the collection.
     * Index specifications are defined at http://docs.mongodb.org/manual/reference/command/createIndexes/.
     *
     * @param collectionName
     * @param indexSpecs
     * @param options
     */
    async createCollectionIndexes(
        collectionName: string,
        indexSpecs: IndexDescription[],
        options?: CreateIndexesOptions,
    ): Promise<string[]> {
        return this.getCollection(collectionName).createIndexes(
            indexSpecs,
            this.getSessionOptions(options),
        )
    }

    /**
     * Delete multiple documents on MongoDB.
     *
     * @param collectionName
     * @param filter
     * @param options
     */
    async deleteMany(
        collectionName: string,
        filter: Filter<Document>,
        options: DeleteOptions,
    ): Promise<DeleteResult> {
        return this.getCollection(collectionName).deleteMany(
            filter,
            this.getSessionOptions(options),
        )
    }

    /**
     * Delete a document on MongoDB.
     *
     * @param collectionName
     * @param filter
     * @param options
     */
    async deleteOne(
        collectionName: string,
        filter: Filter<Document>,
        options?: DeleteOptions,
    ): Promise<DeleteResult> {
        return this.getCollection(collectionName).deleteOne(
            filter,
            this.getSessionOptions(options),
        )
    }

    /**
     * The distinct command returns returns a list of distinct values for the given key across a collection.
     *
     * @param collectionName
     * @param key
     * @param filter
     * @param options
     */
    async distinct(
        collectionName: string,
        key: any,
        filter: Filter<Document>,
        options?: CommandOperationOptions,
    ): Promise<any> {
        return this.getCollection(collectionName).distinct(
            key,
            filter,
            this.getSessionOptions(options),
        )
    }

    /**
     * Drops an index from this collection.
     *
     * @param collectionName
     * @param indexName
     * @param options
     */
    async dropCollectionIndex(
        collectionName: string,
        indexName: string,
        options?: CommandOperationOptions,
    ): Promise<Document> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()
        return this.getCollection(collectionName).dropIndex(
            indexName,
            this.getSessionOptions(options),
        )
    }

    /**
     * Drops all indexes from the collection.
     *
     * @param collectionName
     * @param options
     */
    async dropCollectionIndexes(
        collectionName: string,
        options?: DropIndexesOptions,
    ): Promise<boolean> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()
        return this.getCollection(collectionName).dropIndexes(
            this.getSessionOptions(options),
        )
    }

    /**
     * Find a document and delete it in one atomic operation, requires a write lock for the duration of the operation.
     *
     * @param collectionName
     * @param filter
     * @param options
     */
    async findOneAndDelete(
        collectionName: string,
        filter: Filter<Document>,
        options?: FindOneAndDeleteOptions,
    ): Promise<Document | null> {
        return this.getCollection(collectionName).findOneAndDelete(
            filter,
            this.getSessionOptions(options),
        )
    }

    /**
     * Find a document and replace it in one atomic operation, requires a write lock for the duration of the operation.
     *
     * @param collectionName
     * @param filter
     * @param replacement
     * @param options
     */
    async findOneAndReplace(
        collectionName: string,
        filter: Filter<Document>,
        replacement: Document,
        options?: FindOneAndReplaceOptions,
    ): Promise<Document | null> {
        return this.getCollection(collectionName).findOneAndReplace(
            filter,
            replacement,
            this.getSessionOptions(options),
        )
    }

    /**
     * Find a document and update it in one atomic operation, requires a write lock for the duration of the operation.
     *
     * @param collectionName
     * @param filter
     * @param update
     * @param options
     */
    async findOneAndUpdate(
        collectionName: string,
        filter: Filter<Document>,
        update: UpdateFilter<Document>,
        options?: FindOneAndUpdateOptions,
    ): Promise<Document | null> {
        const opts = this.getSessionOptions(options)
        return this.getCollection(collectionName).findOneAndUpdate(
            filter,
            update,
            opts,
        )
    }

    /**
     * Retrieve all the indexes on the collection.
     *
     * @param collectionName
     * @param options
     */
    async collectionIndexes(
        collectionName: string,
        options?: ListIndexesOptions,
    ): Promise<Document> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()
        const opts = this.getSessionOptions(options)
        return this.getCollection(collectionName).indexes(opts)
    }

    /**
     * Retrieve all the indexes on the collection.
     *
     * @param collectionName
     * @param indexes
     * @param options
     */
    async collectionIndexExists(
        collectionName: string,
        indexes: string | string[],
        options?: ListIndexesOptions,
    ): Promise<boolean> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()
        const opts = this.getSessionOptions(options)
        return this.getCollection(collectionName).indexExists(indexes, opts)
    }

    /**
     * Retrieves this collections index info.
     *
     * @param collectionName
     * @param options
     */
    async collectionIndexInformation(
        collectionName: string,
        options?: IndexInformationOptions,
    ): Promise<any> {
        const opts = this.getSessionOptions(options)
        return this.getCollection(collectionName).indexInformation(opts)
    }

    /**
     * Initiate an In order bulk write operation, operations will be serially executed in the order they are added, creating a new operation for each switch in types.
     *
     * @param collectionName
     * @param options
     */
    initializeOrderedBulkOp(
        collectionName: string,
        options?: BulkWriteOptions,
    ): OrderedBulkOperation {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()
        const opts = this.getSessionOptions(options)
        return this.getCollection(collectionName).initializeOrderedBulkOp(opts)
    }

    /**
     * Initiate a Out of order batch write operation. All operations will be buffered into insert/update/remove commands executed out of order.
     *
     * @param collectionName
     * @param options
     */
    initializeUnorderedBulkOp(
        collectionName: string,
        options?: BulkWriteOptions,
    ): UnorderedBulkOperation {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()
        const opts = this.getSessionOptions(options)
        return this.getCollection(collectionName).initializeUnorderedBulkOp(
            opts,
        )
    }

    /**
     * Inserts an array of documents into MongoDB.
     *
     * @param collectionName
     * @param docs
     * @param options
     */
    async insertMany(
        collectionName: string,
        docs: OptionalId<Document>[],
        options?: BulkWriteOptions,
    ): Promise<InsertManyResult> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()
        return this.getCollection(collectionName).insertMany(
            docs,
            this.getSessionOptions(options),
        )
    }

    /**
     * Inserts a single document into MongoDB.
     *
     * @param collectionName
     * @param doc
     * @param options
     */
    async insertOne(
        collectionName: string,
        doc: OptionalId<Document>,
        options?: InsertOneOptions,
    ): Promise<InsertOneResult> {
        return this.getCollection(collectionName).insertOne(
            doc,
            this.getSessionOptions(options),
        )
    }

    /**
     * Returns if the collection is a capped collection.
     *
     * @param collectionName
     * @param options
     */
    async isCapped(
        collectionName: string,
        options?: OperationOptions,
    ): Promise<boolean> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()
        return this.getCollection(collectionName).isCapped(
            this.getSessionOptions(options),
        )
    }

    /**
     * Get the list of all indexes information for the collection.
     *
     * @param collectionName
     * @param options
     */
    listCollectionIndexes(
        collectionName: string,
        options?: ListIndexesOptions,
    ): ListIndexesCursor {
        return this.getCollection(collectionName).listIndexes(
            this.getSessionOptions(options),
        )
    }

    /**
     * Reindex all indexes on the collection Warning: reIndex is a blocking operation (indexes are rebuilt in the foreground) and will be slow for large collections.
     *
     * @param collectionName
     * @param newName
     * @param options
     */
    async rename(
        collectionName: string,
        newName: string,
        options?: RenameOptions,
    ): Promise<Collection<Document>> {
        return this.getCollection(collectionName).rename(
            newName,
            this.getSessionOptions(options),
        )
    }

    /**
     * Replace a document on MongoDB.
     *
     * @param collectionName
     * @param filter
     * @param replacement
     * @param options
     */
    async replaceOne(
        collectionName: string,
        filter: Filter<Document>,
        replacement: Document,
        options?: ReplaceOptions,
    ): Promise<Document | UpdateResult> {
        return this.getCollection(collectionName).replaceOne(
            filter,
            replacement,
            this.getSessionOptions(options),
        )
    }

    /**
     * Watching new changes as stream.
     *
     * @param collectionName
     * @param pipeline
     * @param options
     */
    watch(
        collectionName: string,
        pipeline?: Document[],
        options?: ChangeStreamOptions,
    ): ChangeStream {
        return this.getCollection(collectionName).watch(
            pipeline,
            this.getSessionOptions(options),
        )
    }

    /**
     * Update multiple documents on MongoDB.
     *
     * @param collectionName
     * @param filter
     * @param update
     * @param options
     */
    async updateMany(
        collectionName: string,
        filter: Filter<Document>,
        update: UpdateFilter<Document>,
        options?: UpdateOptions,
    ): Promise<Document | UpdateResult> {
        return this.getCollection(collectionName).updateMany(
            filter,
            update,
            this.getSessionOptions(options),
        )
    }

    /**
     * Update a single document on MongoDB.
     *
     * @param collectionName
     * @param filter
     * @param update
     * @param options
     */
    async updateOne(
        collectionName: string,
        filter: Filter<Document>,
        update: UpdateFilter<Document>,
        options?: UpdateOptions,
    ): Promise<Document | UpdateResult> {
        return await this.getCollection(collectionName).updateOne(
            filter,
            update,
            this.getSessionOptions(options),
        )
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
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()
        await this.databaseConnection
            .db(this.dataSource.driver.database!)
            .dropDatabase()
    }

    /**
     * For MongoDB database we don't create a connection because its single connection already created by a driver.
     */
    async connect(): Promise<any> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()
        return this.databaseConnection
    }

    /**
     * For MongoDB database we don't release the connection because it is a single connection.
     */
    async release(): Promise<void> {
        this.isReleased = true

        if (this.isTransactionActive && this.session) {
            await this.session.abortTransaction()
        }

        this.isTransactionActive = false
        await this.releaseSession()
    }

    async [Symbol.asyncDispose](): Promise<void> {
        await this.release()
    }

    /**
     * Starts transaction.
     *
     * @param isolationLevel
     * @param transactionOptions
     */
    async startTransaction(
        isolationLevel?: IsolationLevel,
        transactionOptions?: TransactionOptions,
    ): Promise<void> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()
        if (this.isTransactionActive) throw new TransactionAlreadyStartedError()
        if (isolationLevel !== undefined) {
            throw new TypeORMError(
                `MongoDB driver does not support transaction isolation levels.`,
            )
        }

        this.isTransactionActive = true

        try {
            await this.broadcaster.broadcast("BeforeTransactionStart")
        } catch (err) {
            this.isTransactionActive = false
            throw err
        }

        try {
            this.session = this.databaseConnection.startSession()
            this.session.startTransaction(transactionOptions)
        } catch (err) {
            this.isTransactionActive = false
            await this.releaseSession()
            throw err
        }

        await this.broadcaster.broadcast("AfterTransactionStart")
    }

    /**
     * Commits transaction.
     */
    async commitTransaction(): Promise<void> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()
        if (!this.isTransactionActive || !this.session)
            throw new TransactionNotStartedError()

        await this.broadcaster.broadcast("BeforeTransactionCommit")

        await this.session.commitTransaction()
        this.isTransactionActive = false
        await this.releaseSession()

        await this.broadcaster.broadcast("AfterTransactionCommit")
    }

    /**
     * Rollbacks transaction.
     */
    async rollbackTransaction(): Promise<void> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()
        if (!this.isTransactionActive || !this.session)
            throw new TransactionNotStartedError()

        await this.broadcaster.broadcast("BeforeTransactionRollback")

        try {
            await this.session.abortTransaction()
        } catch (err) {
            this.isTransactionActive = false
            await this.releaseSession()
            throw err
        }

        this.isTransactionActive = false
        await this.releaseSession()

        await this.broadcaster.broadcast("AfterTransactionRollback")
    }

    /**
     * Executes a given SQL query.
     *
     * @param query
     * @param parameters
     */
    query(query: string, parameters?: any[]): Promise<any> {
        throw new TypeORMError(
            `Executing SQL query is not supported by MongoDB driver.`,
        )
    }

    /**
     * Unsupported - Executing SQL query is not supported by MongoDB driver.
     *
     * @param strings
     * @param values
     */
    async sql(
        strings: TemplateStringsArray,
        ...values: unknown[]
    ): Promise<any> {
        throw new TypeORMError(
            `Executing SQL query is not supported by MongoDB driver.`,
        )
    }

    /**
     * Returns raw data stream.
     *
     * @param query
     * @param parameters
     * @param onEnd
     * @param onError
     */
    stream(
        query: string,
        parameters?: any[],
        onEnd?: Function,
        onError?: Function,
    ): Promise<ReadStream> {
        throw new TypeORMError(
            `Stream is not supported by MongoDB driver. Use watch instead.`,
        )
    }

    /**
     * Returns all available database names including system databases.
     */
    async getDatabases(): Promise<string[]> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Returns all available schema names including system schemas.
     * If database parameter specified, returns schemas of that database.
     *
     * @param database
     */
    async getSchemas(database?: string): Promise<string[]> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Loads given table's data from the database.
     *
     * @param collectionName
     */
    async getTable(collectionName: string): Promise<Table | undefined> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     *
     * @param collectionNames
     */
    async getTables(collectionNames: string[]): Promise<Table[]> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Loads given views's data from the database.
     *
     * @param collectionName
     */
    async getView(collectionName: string): Promise<View | undefined> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Loads all views (with given names) from the database and creates a Table from them.
     *
     * @param collectionNames
     */
    async getViews(collectionNames: string[]): Promise<View[]> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    getReplicationMode(): ReplicationMode {
        return "master"
    }

    /**
     * Checks if database with the given name exist.
     *
     * @param database
     */
    async hasDatabase(database: string): Promise<boolean> {
        throw new TypeORMError(
            `Check database queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Loads currently using database
     */
    async getCurrentDatabase(): Promise<undefined> {
        throw new TypeORMError(
            `Check database queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Checks if schema with the given name exist.
     *
     * @param schema
     */
    async hasSchema(schema: string): Promise<boolean> {
        throw new TypeORMError(
            `Check schema queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Loads currently using database schema
     */
    async getCurrentSchema(): Promise<undefined> {
        throw new TypeORMError(
            `Check schema queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Checks if table with the given name exist in the database.
     *
     * @param collectionName
     */
    async hasTable(collectionName: string): Promise<boolean> {
        throw new TypeORMError(
            `Check schema queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Checks if column with the given name exist in the given table.
     *
     * @param tableOrName
     * @param columnName
     */
    async hasColumn(
        tableOrName: Table | string,
        columnName: string,
    ): Promise<boolean> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Creates a database if it's not created.
     *
     * @param database
     */
    async createDatabase(database: string): Promise<void> {
        throw new TypeORMError(
            `Database create queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Drops database.
     *
     * @param database
     * @param ifExists
     */
    async dropDatabase(database: string, ifExists?: boolean): Promise<void> {
        throw new TypeORMError(
            `Database drop queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Creates a new table schema.
     *
     * @param schemaPath
     * @param ifNotExists
     */
    async createSchema(
        schemaPath: string,
        ifNotExists?: boolean,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema create queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Drops table schema.
     *
     * @param schemaPath
     * @param ifExists
     */
    async dropSchema(schemaPath: string, ifExists?: boolean): Promise<void> {
        throw new TypeORMError(
            `Schema drop queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Creates a new table from the given table and columns inside it.
     *
     * @param table
     */
    async createTable(table: Table): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Drops the table.
     *
     * @param tableName
     */
    async dropTable(tableName: Table | string): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Creates a new view.
     *
     * @param view
     */
    async createView(view: View): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Drops the view.
     *
     * @param target
     * @param ifExists
     */
    async dropView(target: View | string, ifExists?: boolean): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Renames the given table.
     *
     * @param oldTableOrName
     * @param newTableOrName
     */
    async renameTable(
        oldTableOrName: Table | string,
        newTableOrName: Table | string,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Creates a new column from the column in the table.
     *
     * @param tableOrName
     * @param column
     */
    async addColumn(
        tableOrName: Table | string,
        column: TableColumn,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Creates a new columns from the column in the table.
     *
     * @param tableOrName
     * @param columns
     */
    async addColumns(
        tableOrName: Table | string,
        columns: TableColumn[],
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Renames column in the given table.
     *
     * @param tableOrName
     * @param oldTableColumnOrName
     * @param newTableColumnOrName
     */
    async renameColumn(
        tableOrName: Table | string,
        oldTableColumnOrName: TableColumn | string,
        newTableColumnOrName: TableColumn | string,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Changes a column in the table.
     *
     * @param tableOrName
     * @param oldTableColumnOrName
     * @param newColumn
     */
    async changeColumn(
        tableOrName: Table | string,
        oldTableColumnOrName: TableColumn | string,
        newColumn: TableColumn,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Changes a column in the table.
     *
     * @param tableOrName
     * @param changedColumns
     */
    async changeColumns(
        tableOrName: Table | string,
        changedColumns: { newColumn: TableColumn; oldColumn: TableColumn }[],
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Drops column in the table.
     *
     * @param tableOrName
     * @param columnOrName
     * @param ifExists
     */
    async dropColumn(
        tableOrName: Table | string,
        columnOrName: TableColumn | string,
        ifExists?: boolean,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Drops the columns in the table.
     *
     * @param tableOrName
     * @param columns
     * @param ifExists
     */
    async dropColumns(
        tableOrName: Table | string,
        columns: TableColumn[] | string[],
        ifExists?: boolean,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Creates a new primary key.
     *
     * @param tableOrName
     * @param columnNames
     */
    async createPrimaryKey(
        tableOrName: Table | string,
        columnNames: string[],
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Updates composite primary keys.
     *
     * @param tableOrName
     * @param columns
     */
    async updatePrimaryKeys(
        tableOrName: Table | string,
        columns: TableColumn[],
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Drops a primary key.
     *
     * @param tableOrName
     * @param constraintName
     * @param ifExists
     */
    async dropPrimaryKey(
        tableOrName: Table | string,
        constraintName?: string,
        ifExists?: boolean,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Creates a new unique constraint.
     *
     * @param tableOrName
     * @param uniqueConstraint
     */
    async createUniqueConstraint(
        tableOrName: Table | string,
        uniqueConstraint: TableUnique,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Creates a new unique constraints.
     *
     * @param tableOrName
     * @param uniqueConstraints
     */
    async createUniqueConstraints(
        tableOrName: Table | string,
        uniqueConstraints: TableUnique[],
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Drops a unique constraint.
     *
     * @param tableOrName
     * @param uniqueOrName
     * @param ifExists
     */
    async dropUniqueConstraint(
        tableOrName: Table | string,
        uniqueOrName: TableUnique | string,
        ifExists?: boolean,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Drops unique constraints.
     *
     * @param tableOrName
     * @param uniqueConstraints
     * @param ifExists
     */
    async dropUniqueConstraints(
        tableOrName: Table | string,
        uniqueConstraints: TableUnique[],
        ifExists?: boolean,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Creates a new check constraint.
     *
     * @param tableOrName
     * @param checkConstraint
     */
    async createCheckConstraint(
        tableOrName: Table | string,
        checkConstraint: TableCheck,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Creates a new check constraints.
     *
     * @param tableOrName
     * @param checkConstraints
     */
    async createCheckConstraints(
        tableOrName: Table | string,
        checkConstraints: TableCheck[],
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Drops check constraint.
     *
     * @param tableOrName
     * @param checkOrName
     * @param ifExists
     */
    async dropCheckConstraint(
        tableOrName: Table | string,
        checkOrName: TableCheck | string,
        ifExists?: boolean,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Drops check constraints.
     *
     * @param tableOrName
     * @param checkConstraints
     * @param ifExists
     */
    async dropCheckConstraints(
        tableOrName: Table | string,
        checkConstraints: TableCheck[],
        ifExists?: boolean,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Creates a new exclusion constraint.
     *
     * @param tableOrName
     * @param exclusionConstraint
     */
    async createExclusionConstraint(
        tableOrName: Table | string,
        exclusionConstraint: TableExclusion,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Creates a new exclusion constraints.
     *
     * @param tableOrName
     * @param exclusionConstraints
     */
    async createExclusionConstraints(
        tableOrName: Table | string,
        exclusionConstraints: TableExclusion[],
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Drops exclusion constraint.
     *
     * @param tableOrName
     * @param exclusionOrName
     * @param ifExists
     */
    async dropExclusionConstraint(
        tableOrName: Table | string,
        exclusionOrName: TableExclusion | string,
        ifExists?: boolean,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Drops exclusion constraints.
     *
     * @param tableOrName
     * @param exclusionConstraints
     * @param ifExists
     */
    async dropExclusionConstraints(
        tableOrName: Table | string,
        exclusionConstraints: TableExclusion[],
        ifExists?: boolean,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Creates a new foreign key.
     *
     * @param tableOrName
     * @param foreignKey
     */
    async createForeignKey(
        tableOrName: Table | string,
        foreignKey: TableForeignKey,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Creates a new foreign keys.
     *
     * @param tableOrName
     * @param foreignKeys
     */
    async createForeignKeys(
        tableOrName: Table | string,
        foreignKeys: TableForeignKey[],
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Drops a foreign key from the table.
     *
     * @param tableOrName
     * @param foreignKey
     * @param ifExists
     */
    async dropForeignKey(
        tableOrName: Table | string,
        foreignKey: TableForeignKey,
        ifExists?: boolean,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Drops a foreign keys from the table.
     *
     * @param tableOrName
     * @param foreignKeys
     * @param ifExists
     */
    async dropForeignKeys(
        tableOrName: Table | string,
        foreignKeys: TableForeignKey[],
        ifExists?: boolean,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Creates a new index.
     *
     * @param tableOrName
     * @param index
     */
    async createIndex(
        tableOrName: Table | string,
        index: TableIndex,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Creates a new indices
     *
     * @param tableOrName
     * @param indices
     */
    async createIndices(
        tableOrName: Table | string,
        indices: TableIndex[],
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Drops an index from the table.
     *
     * @param collectionName
     * @param indexName
     * @param ifExists
     */
    async dropIndex(
        collectionName: string,
        indexName: string,
        ifExists?: boolean,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Drops an indices from the table.
     *
     * @param tableOrName
     * @param indices
     * @param ifExists
     */
    async dropIndices(
        tableOrName: Table | string,
        indices: TableIndex[],
        ifExists?: boolean,
    ): Promise<void> {
        throw new TypeORMError(
            `Schema update queries are not supported by MongoDB driver.`,
        )
    }

    /**
     * Drops collection.
     *
     * @param collectionName
     * @param options
     * @param options.cascade
     */
    async clearTable(
        collectionName: string,
        options?: { cascade?: boolean },
    ): Promise<void> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()
        if (options?.cascade) {
            throw new TypeORMError(
                `MongoDB driver does not support clearing table with cascade option`,
            )
        }
        await this.databaseConnection
            .db(this.dataSource.driver.database!)
            .dropCollection(collectionName)
    }

    /**
     * Enables special query runner mode in which sql queries won't be executed,
     * instead they will be memorized into a special variable inside query runner.
     * You can get memorized sql using getMemorySql() method.
     */
    enableSqlMemory(): void {
        throw new TypeORMError(
            `This operation is not supported by MongoDB driver.`,
        )
    }

    /**
     * Disables special query runner mode in which sql queries won't be executed
     * started by calling enableSqlMemory() method.
     *
     * Previously memorized sql will be flushed.
     */
    disableSqlMemory(): void {
        throw new TypeORMError(
            `This operation is not supported by MongoDB driver.`,
        )
    }

    /**
     * Flushes all memorized sqls.
     */
    clearSqlMemory(): void {
        throw new TypeORMError(
            `This operation is not supported by MongoDB driver.`,
        )
    }

    /**
     * Gets sql stored in the memory. Parameters in the sql are already replaced.
     */
    getMemorySql(): SqlInMemory {
        throw new TypeORMError(
            `This operation is not supported by MongoDB driver.`,
        )
    }

    /**
     * Executes up sql queries.
     */
    async executeMemoryUpSql(): Promise<void> {
        throw new TypeORMError(
            `This operation is not supported by MongoDB driver.`,
        )
    }

    /**
     * Executes down sql queries.
     */
    async executeMemoryDownSql(): Promise<void> {
        throw new TypeORMError(
            `This operation is not supported by MongoDB driver.`,
        )
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Gets collection from the database with a given name.
     *
     * @param collectionName
     */
    protected getCollection(collectionName: string): Collection<any> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()
        return this.databaseConnection
            .db(this.dataSource.driver.database!)
            .collection(collectionName)
    }

    /**
     * Adds currently active session to collection operation options.
     *
     * @param options
     */
    protected getSessionOptions<T extends object = object>(options?: T): T {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()
        if (!this.session) {
            return (options ?? {}) as T
        }

        return {
            ...(options ?? {}),
            session: this.session,
        } as T
    }

    /**
     * Ends and clears current session.
     */
    protected async releaseSession(): Promise<void> {
        if (!this.session) return

        const session = this.session
        this.session = undefined
        await session.endSession()
    }

    /**
     * Change table comment.
     *
     * @param tableOrName
     * @param comment
     */
    changeTableComment(
        tableOrName: Table | string,
        comment?: string,
    ): Promise<void> {
        throw new TypeORMError(
            `mongodb driver does not support change table comment.`,
        )
    }
}
