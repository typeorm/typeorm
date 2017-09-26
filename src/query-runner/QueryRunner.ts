import {ColumnSchema} from "../schema-builder/schema/ColumnSchema";
import {TableSchema} from "../schema-builder/schema/TableSchema";
import {ForeignKeySchema} from "../schema-builder/schema/ForeignKeySchema";
import {IndexSchema} from "../schema-builder/schema/IndexSchema";
import {Connection} from "../connection/Connection";
import {ReadStream} from "../platform/PlatformTools";
import {InsertResult} from "../driver/InsertResult";
import {EntityManager} from "../entity-manager/EntityManager";
import {ObjectLiteral} from "../common/ObjectLiteral";

/**
 * Runs queries on a single database connection.
 *
 * todo: extract schema build operations out of query runner.
 *
 * todo: add following methods:
 * - renameTable
 */
export interface QueryRunner {

    /**
     * Connection used by this query runner.
     */
    readonly connection: Connection;

    /**
     * Isolated entity manager working only with current query runner.
     */
    readonly manager: EntityManager;

    /**
     * Indicates if connection for this query runner is released.
     * Once its released, query runner cannot run queries anymore.
     */
    readonly isReleased: boolean;

    /**
     * Indicates if transaction is in progress.
     */
    readonly isTransactionActive: boolean;

    /**
     * Stores temporarily user data.
     * Useful for sharing data with subscribers.
     */
    data: ObjectLiteral;

    /**
     * Creates/uses database connection from the connection pool to perform further operations.
     * Returns obtained database connection.
     */
    connect(): Promise<void>;

    /**
     * Releases used database connection.
     * You cannot use this query runner methods after connection is released.
     */
    release(): Promise<void>;

    /**
     * Removes all tables from the currently connected database.
     * Be careful with using this method and avoid using it in production or migrations
     * (because it can clear all your database).
     */
    clearDatabase(tableSchemas?: string[], database?: string): Promise<void>;

    /**
     * Starts transaction.
     */
    startTransaction(): Promise<void>;

    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    commitTransaction(): Promise<void>;

    /**
     * Ends transaction.
     * Error will be thrown if transaction was not started.
     */
    rollbackTransaction(): Promise<void>;

    /**
     * Executes a given SQL query and returns raw database results.
     */
    query(query: string, parameters?: any[]): Promise<any>;

    /**
     * Returns raw data stream.
     */
    stream(query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream>; // todo: ReadStream gonna bring problems in websql driver

    /**
     * Insert a new row with given values into the given table.
     * Returns value of the generated column if given and generate column exist in the table.
     */
    insert(tablePath: string, valuesMap: Object): Promise<InsertResult>;

    /**
     * Updates rows that match given simple conditions in the given table.
     */
    update(tablePath: string, valuesMap: Object, conditions: Object): Promise<void>;

    /**
     * Performs a simple DELETE query by a given conditions in a given table.
     */
    delete(tablePath: string, condition: string, parameters?: any[]): Promise<void>;

    /**
     * Performs a simple DELETE query by a given conditions in a given table.
     */
    delete(tablePath: string, conditions: Object): Promise<void>;

    /**
     * Inserts new values into closure table.
     */
    insertIntoClosureTable(tablePath: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number>;

    /**
     * Loads a table by a given given name from the database and creates a TableSchema from them.
     */
    getTable(tablePath: string): Promise<TableSchema|undefined>;

    /**
     * Loads all tables (with given names) from the database and creates a TableSchema from them.
     *
     * todo: make tableNames optional
     */
    getTables(tablePaths: string[]): Promise<TableSchema[]>;

    /**
     * Checks if database with the given name exist.
     */
    hasDatabase(database: string): Promise<boolean>;

    /**
     * Checks if table with the given name exist in the database.
     */
    hasTable(tablePath: string): Promise<boolean>;

    /**
     * Creates a database if it's not created.
     */
    createDatabase(database: string): Promise<void[]>;

    /**
     * Creates a schema if it's not created.
     */
    createSchema(schemas: string[]): Promise<void[]>;

    /**
     * Creates a new table from the given table metadata and column metadatas.
     */
    createTable(table: TableSchema): Promise<void>;

    // todo: create createTableIfNotExist method

    /**
     * Drops the table.
     */
    dropTable(tablePath: string): Promise<void>;

    /**
     * Checks if column with the given name exist in the given table.
     */
    hasColumn(tableName: string, columnName: string): Promise<boolean>;

    /**
     * Adds a new column in the table.
     */
    addColumn(tableName: string, column: ColumnSchema): Promise<void>;

    /**
     * Adds a new column in the table.
     */
    addColumn(table: TableSchema, column: ColumnSchema): Promise<void>;

    /**
     * Adds new columns in the table.
     */
    addColumns(tableSchema: string, columns: ColumnSchema[]): Promise<void>;

    /**
     * Adds new columns in the table.
     */
    addColumns(table: TableSchema, columns: ColumnSchema[]): Promise<void>;

    /**
     * Renames column in the given table.
     */
    renameColumn(table: TableSchema, oldColumn: ColumnSchema, newColumn: ColumnSchema): Promise<void>;

    /**
     * Renames column in the given table.
     */
    renameColumn(tableName: string, oldColumnName: string, newColumnName: string): Promise<void>;

    /**
     * Changes a column in the table.
     */
    changeColumn(table: TableSchema, oldColumn: ColumnSchema, newColumn: ColumnSchema): Promise<void>;

    /**
     * Changes a column in the table.
     */
    changeColumn(table: string, oldColumn: string, newColumn: ColumnSchema): Promise<void>;

    /**
     * Changes a columns in the table.
     */
    changeColumns(table: TableSchema, changedColumns: { oldColumn: ColumnSchema, newColumn: ColumnSchema }[]): Promise<void>;

    /**
     * Drops the column in the table.
     */
    dropColumn(table: TableSchema, column: ColumnSchema): Promise<void>;

    /**
     * Drops the columns in the table.
     */
    dropColumns(table: TableSchema, columns: ColumnSchema[]): Promise<void>;

    /**
     * Updates primary keys in the table.
     */
    updatePrimaryKeys(table: TableSchema): Promise<void>;

    /**
     * Creates a new foreign key.
     */
    createForeignKey(tableName: string, foreignKey: ForeignKeySchema): Promise<void>;

    /**
     * Creates a new foreign key.
     */
    createForeignKey(tableSchema: TableSchema, foreignKey: ForeignKeySchema): Promise<void>;

    /**
     * Creates a new foreign keys.
     */
    createForeignKeys(table: TableSchema, foreignKeys: ForeignKeySchema[]): Promise<void>;

    /**
     * Drops a foreign keys from the table.
     */
    dropForeignKey(table: string, foreignKey: ForeignKeySchema): Promise<void>;

    /**
     * Drops a foreign keys from the table.
     */
    dropForeignKey(table: TableSchema, foreignKey: ForeignKeySchema): Promise<void>;

    /**
     * Drops a foreign keys from the table.
     */
    dropForeignKeys(table: string, foreignKeys: ForeignKeySchema[]): Promise<void>;

    /**
     * Drops a foreign keys from the table.
     */
    dropForeignKeys(table: TableSchema, foreignKeys: ForeignKeySchema[]): Promise<void>;

    /**
     * Creates a new index.
     */
    createIndex(tableName: string, index: IndexSchema): Promise<void>;

    /**
     * Drops an index from the table.
     */
    dropIndex(tableSchemeOrPath: TableSchema|string, index: IndexSchema|string): Promise<void>;

    /**
     * Truncates table.
     *
     * todo: probably this should be renamed to drop or clear?
     */
    truncate(tableName: string): Promise<void>;

    /**
     * Enables special query runner mode in which sql queries won't be executed,
     * instead they will be memorized into a special variable inside query runner.
     * You can get memorized sql using getMemorySql() method.
     */
    enableSqlMemory(): void;

    /**
     * Disables special query runner mode in which sql queries won't be executed
     * started by calling enableSqlMemory() method.
     *
     * Previously memorized sql will be flushed.
     */
    disableSqlMemory(): void;

    /**
     * Gets sql stored in the memory. Parameters in the sql are already replaced.
     */
    getMemorySql(): (string|{ up: string, down: string })[];

}