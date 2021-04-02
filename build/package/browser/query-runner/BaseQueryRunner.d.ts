import { Query } from "../driver/Query";
import { SqlInMemory } from "../driver/SqlInMemory";
import { View } from "../schema-builder/view/View";
import { Connection } from "../connection/Connection";
import { Table } from "../schema-builder/table/Table";
import { EntityManager } from "../entity-manager/EntityManager";
import { TableColumn } from "../schema-builder/table/TableColumn";
import { Broadcaster } from "../subscriber/Broadcaster";
import { ReplicationMode } from "../driver/types/ReplicationMode";
export declare abstract class BaseQueryRunner {
    /**
     * Connection used by this query runner.
     */
    connection: Connection;
    /**
     * Entity manager working only with current query runner.
     */
    manager: EntityManager;
    /**
     * Indicates if connection for this query runner is released.
     * Once its released, query runner cannot run queries anymore.
     */
    isReleased: boolean;
    /**
     * Indicates if transaction is in progress.
     */
    isTransactionActive: boolean;
    /**
     * Stores temporarily user data.
     * Useful for sharing data with subscribers.
     */
    data: {};
    /**
     * All synchronized tables in the database.
     */
    loadedTables: Table[];
    /**
     * All synchronized views in the database.
     */
    loadedViews: View[];
    /**
     * Broadcaster used on this query runner to broadcast entity events.
     */
    broadcaster: Broadcaster;
    /**
     * Real database connection from a connection pool used to perform queries.
     */
    protected databaseConnection: any;
    /**
     * Indicates if special query runner mode in which sql queries won't be executed is enabled.
     */
    protected sqlMemoryMode: boolean;
    /**
     * Sql-s stored if "sql in memory" mode is enabled.
     */
    protected sqlInMemory: SqlInMemory;
    /**
     * Mode in which query runner executes.
     * Used for replication.
     * If replication is not setup its value is ignored.
     */
    protected mode: ReplicationMode;
    /**
     * Executes a given SQL query.
     */
    abstract query(query: string, parameters?: any[]): Promise<any>;
    protected abstract loadTables(tablePaths: string[]): Promise<Table[]>;
    protected abstract loadViews(tablePaths: string[]): Promise<View[]>;
    /**
     * Loads given table's data from the database.
     */
    getTable(tablePath: string): Promise<Table | undefined>;
    /**
     * Loads all tables (with given names) from the database.
     */
    getTables(tableNames: string[]): Promise<Table[]>;
    /**
     * Loads given view's data from the database.
     */
    getView(viewPath: string): Promise<View | undefined>;
    /**
     * Loads given view's data from the database.
     */
    getViews(viewPaths: string[]): Promise<View[]>;
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
     * Flushes all memorized sqls.
     */
    clearSqlMemory(): void;
    /**
     * Gets sql stored in the memory. Parameters in the sql are already replaced.
     */
    getMemorySql(): SqlInMemory;
    /**
     * Executes up sql queries.
     */
    executeMemoryUpSql(): Promise<void>;
    /**
     * Executes down sql queries.
     */
    executeMemoryDownSql(): Promise<void>;
    /**
     * Gets view from previously loaded views, otherwise loads it from database.
     */
    protected getCachedView(viewName: string): Promise<View>;
    /**
     * Gets table from previously loaded tables, otherwise loads it from database.
     */
    protected getCachedTable(tableName: string): Promise<Table>;
    /**
     * Replaces loaded table with given changed table.
     */
    protected replaceCachedTable(table: Table, changedTable: Table): void;
    protected getTypeormMetadataTableName(): string;
    /**
     * Checks if at least one of column properties was changed.
     * Does not checks column type, length and autoincrement, because these properties changes separately.
     */
    protected isColumnChanged(oldColumn: TableColumn, newColumn: TableColumn, checkDefault?: boolean, checkComment?: boolean): boolean;
    /**
     * Checks if column length is by default.
     */
    protected isDefaultColumnLength(table: Table, column: TableColumn, length: string): boolean;
    /**
     * Checks if column precision is by default.
     */
    protected isDefaultColumnPrecision(table: Table, column: TableColumn, precision: number): boolean;
    /**
     * Checks if column scale is by default.
     */
    protected isDefaultColumnScale(table: Table, column: TableColumn, scale: number): boolean;
    /**
     * Executes sql used special for schema build.
     */
    protected executeQueries(upQueries: Query | Query[], downQueries: Query | Query[]): Promise<void>;
}
