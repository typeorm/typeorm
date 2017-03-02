import {ColumnSchema} from "../schema-builder/schema/ColumnSchema";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {TableSchema} from "../schema-builder/schema/TableSchema";
import {ForeignKeySchema} from "../schema-builder/schema/ForeignKeySchema";
import {IndexSchema} from "../schema-builder/schema/IndexSchema";
import {ColumnType} from "../metadata/types/ColumnTypes";

/**
 * Runs queries on a single database connection.
 *
 * todo: extract schema build operations out of query runner.
 */
export interface QueryRunner {

    /**
     * Releases database connection. This is needed when using connection pooling.
     * If connection is not from a pool, it should not be released.
     * You cannot use this class's methods after its released.
     */
    release(): Promise<void>;

    /**
     * Removes all tables from the currently connected database.
     * Be careful with using this method and avoid using it in production or migrations
     * (because it can clear all your database).
     */
    clearDatabase(): Promise<void>;

    /**
     * Starts transaction.
     */
    beginTransaction(): Promise<void>;

    /**
     * Commits transaction.
     */
    commitTransaction(): Promise<void>;

    /**
     * Ends transaction.
     */
    rollbackTransaction(): Promise<void>;

    /**
     * Checks if transaction is in progress.
     */
    isTransactionActive(): boolean;

    /**
     * Executes a given SQL query and returns raw database results.
     */
    query(query: string, parameters?: any[]): Promise<any>;

    /**
     * Updates rows that match given simple conditions in the given table.
     */
    update(tableName: string, valuesMap: Object, conditions: Object): Promise<void>;

    /**
     * Inserts a new row into given table.
     */
    insert(tableName: string, valuesMap: Object, generatedColumn?: ColumnMetadata): Promise<any>;

    /**
     * Performs a simple DELETE query by a given conditions in a given table.
     */
    delete(tableName: string, condition: string, parameters?: any[]): Promise<void>;

    /**
     * Performs a simple DELETE query by a given conditions in a given table.
     */
    delete(tableName: string, conditions: Object): Promise<void>;

    /**
     * Inserts new values into closure table.
     */
    insertIntoClosureTable(tableName: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number>;

    /**
     * Converts a column type of the metadata to the database column's type.
     */
    normalizeType(typeOptions: { type: ColumnType, length?: string|number, precision?: number, scale?: number, timezone?: boolean }): any;

    /**
     * Checks if "DEFAULT" values in the column metadata and in the database schema are equal.
     */
    compareDefaultValues(columnMetadataValue: any, databaseValue: any): boolean;

    /**
     * Loads all tables (with given names) from the database and creates a TableSchema from them.
     */
    loadTableSchema(tableName: string): Promise<TableSchema|undefined>;

    /**
     * Loads all tables (with given names) from the database and creates a TableSchema from them.
     */
    loadTableSchemas(tableNames: string[]): Promise<TableSchema[]>;

    /**
     * Checks if table with the given name exist in the database.
     */
    hasTable(tableName: string): Promise<boolean>;

    /**
     * Creates a new table from the given table metadata and column metadatas.
     */
    createTable(table: TableSchema): Promise<void>;

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
    dropColumn(tableName: string, columnName: string): Promise<void>;

    /**
     * Drops the column in the table.
     */
    dropColumn(tableName: string, columnName: string): Promise<void>;

    /**
     * Drops the column in the table.
     */
    dropColumn(table: TableSchema, column: ColumnSchema): Promise<void>;

    /**
     * Drops the columns in the table.
     */
    dropColumns(tableName: string, columnNames: string[]): Promise<void>;

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
    dropIndex(tableName: string, indexName: string): Promise<void>;

    /**
     * Truncates table.
     *
     * todo: probably this should be renamed to drop or clear?
     */
    truncate(tableName: string): Promise<void>;

}