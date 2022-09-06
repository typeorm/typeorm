import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TableColumn} from "../../schema-builder/table/TableColumn";
import {Table} from "../../schema-builder/table/Table";
import {TableForeignKey} from "../../schema-builder/table/TableForeignKey";
import {TableIndex} from "../../schema-builder/table/TableIndex";
import {View} from "../../schema-builder/view/View";
import {PlatformTools, ReadStream} from "../../platform/PlatformTools";
import {SqlInMemory} from "../SqlInMemory";
import {TableUnique} from "../../schema-builder/table/TableUnique";
import {Broadcaster} from "../../subscriber/Broadcaster";
import {TableCheck} from "../../schema-builder/table/TableCheck";
import {TableExclusion} from "../../schema-builder/table/TableExclusion";
import {TypeORMError} from "../../error";
import {ReplicationMode} from "../types/ReplicationMode";
import {DynamoEntityManager} from "../../entity-manager/DynamoEntityManager";
import {batchHelper} from "./helpers/BatchHelper";
import asyncPool from "tiny-async-pool";
import { getDocumentClient } from "./DynamoClient";
import { DataSource } from "../../data-source/DataSource"

class DeleteManyOptions {
    maxConcurrency: number;
}

class PutManyOptions {
    maxConcurrency: number;
}

const batchDelete = async (tableName: string, batch: any[]) => {
    const RequestItems: any = {};
    RequestItems[tableName] = batch.map((Key: any) => {
        return {
            DeleteRequest: {
                Key
            }
        };
    });
    return getDocumentClient().batchWrite({
        RequestItems
    });
};

const batchWrite = async (tableName: string, batch: any[]) => {
    const RequestItems: any = {};
    RequestItems[tableName] = batch.map((Item: any) => {
        return {
            PutRequest: {
                Item
            }
        };
    });
    return getDocumentClient().batchWrite({
        RequestItems
    });
};

export class DynamoQueryRunner implements QueryRunner {
    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Connection used by this query runner.
     */
    connection: DataSource;

    /**
     * Entity manager working only with current query runner.
     */
    manager: DynamoEntityManager;

    /**
     * DynamoDB does not require to dynamically create query runner each time,
     * because it does not have a regular connection pool as RDBMS systems have.
     */
    queryRunner?: DynamoQueryRunner;

    /**
     * Indicates if connection for this query runner is released.
     * Once its released, query runner cannot run queries anymore.
     * Always false for DynamoDB since DynamoDB has a single query executor instance.
     */
    isReleased = false;

    /**
     * Indicates if transaction is active in this query executor.
     * Always false for DynamoDB since DynamoDB does not support transactions.
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
    loadedViews: any[];

    /**
     * Real database connection from a connection pool used to perform queries.
     */
    databaseConnection: undefined;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor (connection: DataSource, databaseConnection: any) {
        this.connection = connection;
        this.databaseConnection = databaseConnection;
        this.broadcaster = new Broadcaster(this)
    }

    /**
     * Broadcaster used on this query runner to broadcast entity events.
     */
    broadcaster: Broadcaster

    async clearDatabase (database?: string): Promise<void> {
        const AWS = PlatformTools.load("aws-sdk");
        const db = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
        const tables = await db.listTables();
        for (let i = 0; i < tables.length; i++) {
            const table = tables[i];
            const tableName = table.TableName;
            if (tableName.startsWith(database)) {
                await db.deleteTable({
                    TableName: table.TableName
                });
            }
        }
    }

    stream (query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream> {
        throw new Error("Method not implemented.");
    }

    getView (viewPath: string): Promise<View | undefined> {
        throw new Error("Method not implemented.");
    }

    getViews (viewPaths?: string[]): Promise<View[]> {
        throw new Error("Method not implemented.");
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Delete multiple documents on DynamoDB.
     */
    async deleteMany (tableName: string, keys: ObjectLiteral[], options?: DeleteManyOptions): Promise<void> {
        if (keys.length > 0) {
            const batchOptions = options || { maxConcurrency: 8 };
            const batches = batchHelper.batch(keys);
            await asyncPool(batchOptions.maxConcurrency, batches, (batch: any[][]) => {
                return batchDelete(tableName, batch);
            });
        }
    }

    /**
     * Delete a document on DynamoDB.
     */
    async deleteOne (tableName: string, key: ObjectLiteral): Promise<void> {
        const params = {
            TableName: tableName,
            Key: key
        };
        await getDocumentClient().delete(params);
    }

    /**
     * Inserts an array of documents into DynamoDB.
     */
    async putMany (tableName: string, docs: ObjectLiteral[], options?: PutManyOptions): Promise<void> {
        if (docs.length > 0) {
            const batchOptions = options || { maxConcurrency: 8 };
            const batches = batchHelper.batch(docs);
            await asyncPool(batchOptions.maxConcurrency, batches, (batch: any[][]) => {
                return batchWrite(tableName, batch);
            });
        }
    }

    /**
     * Inserts a single document into DynamoDB.
     */
    async putOne (tableName: string, doc: ObjectLiteral): Promise<ObjectLiteral> {
        const params = {
            TableName: tableName,
            Item: doc
        };
        await getDocumentClient().put(params);
        return doc;
    }

    // /**
    //  * Returns if the collection is a capped collection.
    //  */
    // async isCapped (collectionName: string): Promise<any> {
    //     return await this.getCollection(collectionName).isCapped()
    // }
    //
    // /**
    //  * Update multiple documents on DynamoDB.
    //  */
    // async updateMany (collectionName: string, query: ObjectLiteral, update: ObjectLiteral, options?: { upsert?: boolean, w?: any, wtimeout?: number, j?: boolean }): Promise<UpdateWriteOpResult> {
    //     return await this.getCollection(collectionName).updateMany(query, update, options)
    // }
    //
    // /**
    //  * Update a single document on DynamoDB.
    //  */
    // async updateOne (collectionName: string, query: ObjectLiteral, update: ObjectLiteral, options?: ReplaceOneOptions): Promise<UpdateWriteOpResult> {
    //     return await this.getCollection(collectionName).updateOne(query, update, options)
    // }

    /**
     * For DynamoDB database we don't create connection, because its single connection already created by a driver.
     */
    async connect (): Promise<any> {
    }

    /**
     * For DynamoDB database we don't release connection, because its single connection.
     */
    async release (): Promise<void> {
        // releasing connection are not supported by DynamoDB driver, so simply don't do anything here
    }

    /**
     * Starts transaction.
     */
    async startTransaction (): Promise<void> {
        // transactions are not supported by DynamoDB driver, so simply don't do anything here
    }

    /**
     * Commits transaction.
     */
    async commitTransaction (): Promise<void> {
        // transactions are not supported by DynamoDB driver, so simply don't do anything here
    }

    /**
     * Rollbacks transaction.
     */
    async rollbackTransaction (): Promise<void> {
        // transactions are not supported by DynamoDB driver, so simply don't do anything here
    }

    /**
     * Executes a given SQL query.
     */
    query (query: string, parameters?: any[]): Promise<any> {
        throw new TypeORMError("Executing SQL query is not supported by DynamoDB driver.");
    }

    /**
     * Returns raw data stream.
     */
    // stream (query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream> {
    //     throw new TypeORMError('Stream is not supported yet. Use watch instead.')
    // }

    /**
     * Returns all available database names including system databases.
     */
    async getDatabases (): Promise<string[]> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Returns all available schema names including system schemas.
     * If database parameter specified, returns schemas of that database.
     */
    async getSchemas (database?: string): Promise<string[]> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Loads given table's data from the database.
     */
    async getTable (collectionName: string): Promise<Table | undefined> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     */
    async getTables (collectionNames: string[]): Promise<Table[]> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Checks if database with the given name exist.
     */
    async hasDatabase (database: string): Promise<boolean> {
        throw new TypeORMError("Check database queries are not supported by DynamoDB driver.");
    }

    /**
     * Loads currently using database
     */
    async getCurrentDatabase (): Promise<undefined> {
        throw new TypeORMError("Check database queries are not supported by DynamoDB driver.");
    }

    /**
     * Checks if schema with the given name exist.
     */
    async hasSchema (schema: string): Promise<boolean> {
        throw new TypeORMError("Check schema queries are not supported by DynamoDB driver.");
    }

    /**
     * Loads currently using database schema
     */
    async getCurrentSchema (): Promise<undefined> {
        throw new TypeORMError("Check schema queries are not supported by DynamoDB driver.");
    }

    /**
     * Checks if table with the given name exist in the database.
     */
    async hasTable (collectionName: string): Promise<boolean> {
        throw new TypeORMError("Check schema queries are not supported by DynamoDB driver.");
    }

    /**
     * Checks if column with the given name exist in the given table.
     */
    async hasColumn (tableOrName: Table | string, columnName: string): Promise<boolean> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Creates a database if it's not created.
     */
    async createDatabase (database: string): Promise<void> {
        throw new TypeORMError("Database create queries are not supported by DynamoDB driver.");
    }

    /**
     * Drops database.
     */
    async dropDatabase (database: string, ifExist?: boolean): Promise<void> {
        throw new TypeORMError("Database drop queries are not supported by DynamoDB driver.");
    }

    /**
     * Creates a new table schema.
     */
    async createSchema (schemaPath: string, ifNotExist?: boolean): Promise<void> {
        throw new TypeORMError("Schema create queries are not supported by DynamoDB driver.");
    }

    /**
     * Drops table schema.
     */
    async dropSchema (schemaPath: string, ifExist?: boolean): Promise<void> {
        throw new TypeORMError("Schema drop queries are not supported by DynamoDB driver.");
    }

    /**
     * Creates a new table from the given table and columns inside it.
     */
    async createTable (table: Table): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Drops the table.
     */
    async dropTable (tableName: Table | string): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Creates a new view.
     */
    async createView (view: View): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Drops the view.
     */
    async dropView (target: View | string): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Renames the given table.
     */
    async renameTable (oldTableOrName: Table | string, newTableOrName: Table | string): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Creates a new column from the column in the table.
     */
    async addColumn (tableOrName: Table | string, column: TableColumn): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Creates a new columns from the column in the table.
     */
    async addColumns (tableOrName: Table | string, columns: TableColumn[]): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Renames column in the given table.
     */
    async renameColumn (tableOrName: Table | string, oldTableColumnOrName: TableColumn | string, newTableColumnOrName: TableColumn | string): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Changes a column in the table.
     */
    async changeColumn (tableOrName: Table | string, oldTableColumnOrName: TableColumn | string, newColumn: TableColumn): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Changes a column in the table.
     */
    async changeColumns (tableOrName: Table | string, changedColumns: { newColumn: TableColumn, oldColumn: TableColumn }[]): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Drops column in the table.
     */
    async dropColumn (tableOrName: Table | string, columnOrName: TableColumn | string): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Drops the columns in the table.
     */
    async dropColumns (tableOrName: Table | string, columns: TableColumn[] | string[]): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Creates a new primary key.
     */
    async createPrimaryKey (tableOrName: Table | string, columnNames: string[]): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Updates composite primary keys.
     */
    async updatePrimaryKeys (tableOrName: Table | string, columns: TableColumn[]): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Drops a primary key.
     */
    async dropPrimaryKey (tableOrName: Table | string): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Creates a new unique constraint.
     */
    async createUniqueConstraint (tableOrName: Table | string, uniqueConstraint: TableUnique): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Creates a new unique constraints.
     */
    async createUniqueConstraints (tableOrName: Table | string, uniqueConstraints: TableUnique[]): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Drops an unique constraint.
     */
    async dropUniqueConstraint (tableOrName: Table | string, uniqueOrName: TableUnique | string): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Drops an unique constraints.
     */
    async dropUniqueConstraints (tableOrName: Table | string, uniqueConstraints: TableUnique[]): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Creates a new check constraint.
     */
    async createCheckConstraint (tableOrName: Table | string, checkConstraint: TableCheck): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Creates a new check constraints.
     */
    async createCheckConstraints (tableOrName: Table | string, checkConstraints: TableCheck[]): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Drops check constraint.
     */
    async dropCheckConstraint (tableOrName: Table | string, checkOrName: TableCheck | string): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Drops check constraints.
     */
    async dropCheckConstraints (tableOrName: Table | string, checkConstraints: TableCheck[]): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Creates a new exclusion constraint.
     */
    async createExclusionConstraint (tableOrName: Table | string, exclusionConstraint: TableExclusion): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Creates a new exclusion constraints.
     */
    async createExclusionConstraints (tableOrName: Table | string, exclusionConstraints: TableExclusion[]): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Drops exclusion constraint.
     */
    async dropExclusionConstraint (tableOrName: Table | string, exclusionOrName: TableExclusion | string): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Drops exclusion constraints.
     */
    async dropExclusionConstraints (tableOrName: Table | string, exclusionConstraints: TableExclusion[]): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Creates a new foreign key.
     */
    async createForeignKey (tableOrName: Table | string, foreignKey: TableForeignKey): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Creates a new foreign keys.
     */
    async createForeignKeys (tableOrName: Table | string, foreignKeys: TableForeignKey[]): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Drops a foreign key from the table.
     */
    async dropForeignKey (tableOrName: Table | string, foreignKey: TableForeignKey): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Drops a foreign keys from the table.
     */
    async dropForeignKeys (tableOrName: Table | string, foreignKeys: TableForeignKey[]): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Creates a new index.
     */
    async createIndex (tableOrName: Table | string, index: TableIndex): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Creates a new indices
     */
    async createIndices (tableOrName: Table | string, indices: TableIndex[]): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex (collectionName: string, indexName: string): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Drops an indices from the table.
     */
    async dropIndices (tableOrName: Table | string, indices: TableIndex[]): Promise<void> {
        throw new TypeORMError("Schema update queries are not supported by DynamoDB driver.");
    }

    /**
     * Drops collection.
     */
    clearTable (tableName: string): Promise<void> {
        return getDocumentClient().deleteTable({
            TableName: tableName
        });
    }

    /**
     * Enables special query runner mode in which sql queries won't be executed,
     * instead they will be memorized into a special variable inside query runner.
     * You can get memorized sql using getMemorySql() method.
     */
    enableSqlMemory (): void {
        throw new TypeORMError("This operation is not supported by DynamoDB driver.");
    }

    /**
     * Disables special query runner mode in which sql queries won't be executed
     * started by calling enableSqlMemory() method.
     *
     * Previously memorized sql will be flushed.
     */
    disableSqlMemory (): void {
        throw new TypeORMError("This operation is not supported by DynamoDB driver.");
    }

    /**
     * Flushes all memorized sqls.
     */
    clearSqlMemory (): void {
        throw new TypeORMError("This operation is not supported by DynamoDB driver.");
    }

    /**
     * Gets sql stored in the memory. Parameters in the sql are already replaced.
     */
    getMemorySql (): SqlInMemory {
        throw new TypeORMError("This operation is not supported by DynamoDB driver.");
    }

    /**
     * Executes up sql queries.
     */
    async executeMemoryUpSql (): Promise<void> {
        throw new TypeORMError("This operation is not supported by DynamoDB driver.");
    }

    /**
     * Executes down sql queries.
     */
    async executeMemoryDownSql (): Promise<void> {
        throw new TypeORMError("This operation is not supported by DynamoDB driver.");
    }

    getReplicationMode (): ReplicationMode {
        return "master";
    };

    /**
     * Called before migrations are run.
     */
    beforeMigration(): Promise<void> {
        return Promise.resolve();
    }


    /**
     * Called after migrations are run.
     */
    afterMigration(): Promise<void> {
        return Promise.resolve();
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
}
