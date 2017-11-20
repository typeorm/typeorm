import {TableColumn} from "../schema-builder/schema/TableColumn";
import {Table} from "../schema-builder/schema/Table";
import {TableForeignKey} from "../schema-builder/schema/TableForeignKey";
import {TableIndex} from "../schema-builder/schema/TableIndex";
import {Connection} from "../connection/Connection";
import {ReadStream} from "../platform/PlatformTools";
import {EntityManager} from "../entity-manager/EntityManager";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {Broadcaster} from "../subscriber/Broadcaster";

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
     * Broadcaster used on this query runner to broadcast entity events.
     */
    readonly broadcaster: Broadcaster;

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
    clearDatabase(tables?: string[], database?: string): Promise<void>;

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
     * Inserts new values into closure table.
     */
    insertIntoClosureTable(tablePath: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number>;

    /**
     * Loads a table by a given given name from the database and creates a Table from them.
     */
    getTable(tablePath: string): Promise<Table|undefined>;

    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     *
     * todo: make tableNames optional
     */
    getTables(tablePaths: string[]): Promise<Table[]>;

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
    createTable(table: Table): Promise<void>;

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
    addColumn(tableName: string, column: TableColumn): Promise<void>;

    /**
     * Adds a new column in the table.
     */
    addColumn(table: Table, column: TableColumn): Promise<void>;

    /**
     * Adds new columns in the table.
     */
    addColumns(table: string, columns: TableColumn[]): Promise<void>;

    /**
     * Adds new columns in the table.
     */
    addColumns(table: Table, columns: TableColumn[]): Promise<void>;

    /**
     * Renames column in the given table.
     */
    renameColumn(table: Table, oldColumn: TableColumn, newColumn: TableColumn): Promise<void>;

    /**
     * Renames column in the given table.
     */
    renameColumn(tableName: string, oldColumnName: string, newColumnName: string): Promise<void>;

    /**
     * Changes a column in the table.
     */
    changeColumn(table: Table, oldColumn: TableColumn, newColumn: TableColumn): Promise<void>;

    /**
     * Changes a column in the table.
     */
    changeColumn(table: string, oldColumn: string, newColumn: TableColumn): Promise<void>;

    /**
     * Changes a columns in the table.
     */
    changeColumns(table: Table, changedColumns: { oldColumn: TableColumn, newColumn: TableColumn }[]): Promise<void>;

    /**
     * Drops the column in the table.
     */
    dropColumn(table: Table, column: TableColumn): Promise<void>;

    /**
     * Drops the columns in the table.
     */
    dropColumns(table: Table, columns: TableColumn[]): Promise<void>;

    /**
     * Updates primary keys in the table.
     */
    updatePrimaryKeys(table: Table): Promise<void>;

    /**
     * Creates a new foreign key.
     */
    createForeignKey(tableName: string, foreignKey: TableForeignKey): Promise<void>;

    /**
     * Creates a new foreign key.
     */
    createForeignKey(table: Table, foreignKey: TableForeignKey): Promise<void>;

    /**
     * Creates a new foreign keys.
     */
    createForeignKeys(table: Table, foreignKeys: TableForeignKey[]): Promise<void>;

    /**
     * Drops a foreign keys from the table.
     */
    dropForeignKey(table: string, foreignKey: TableForeignKey): Promise<void>;

    /**
     * Drops a foreign keys from the table.
     */
    dropForeignKey(table: Table, foreignKey: TableForeignKey): Promise<void>;

    /**
     * Drops a foreign keys from the table.
     */
    dropForeignKeys(table: string, foreignKeys: TableForeignKey[]): Promise<void>;

    /**
     * Drops a foreign keys from the table.
     */
    dropForeignKeys(table: Table, foreignKeys: TableForeignKey[]): Promise<void>;

    /**
     * Creates a new index.
     */
    createIndex(tableName: Table|string, index: TableIndex): Promise<void>;

    /**
     * Drops an index from the table.
     */
    dropIndex(tableSchemeOrPath: Table|string, index: TableIndex|string): Promise<void>;

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