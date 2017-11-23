import {SqlInMemory} from "../driver/SqlInMemory";
import {PromiseUtils} from "../util/PromiseUtils";
import {Connection} from "../connection/Connection";
import {Table} from "../schema-builder/table/Table";
import {EntityManager} from "../entity-manager/EntityManager";
import {TableColumn} from "../schema-builder/table/TableColumn";
import {Broadcaster} from "../subscriber/Broadcaster";

export abstract class BaseQueryRunner {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Connection used by this query runner.
     */
    connection: Connection;

    /**
     * Isolated entity manager working only with current query runner.
     */
    manager: EntityManager;

    /**
     * Indicates if connection for this query runner is released.
     * Once its released, query runner cannot run queries anymore.
     */
    isReleased = false;

    /**
     * Indicates if transaction is in progress.
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
    loadedTables: Table[] = [];

    /**
     * Broadcaster used on this query runner to broadcast entity events.
     */
    broadcaster: Broadcaster;

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Real database connection from a connection pool used to perform queries.
     */
    protected databaseConnection: any;

    /**
     * Indicates if special query runner mode in which sql queries won't be executed is enabled.
     */
    protected sqlMemoryMode: boolean = false;

    /**
     * Sql-s stored if "sql in memory" mode is enabled.
     */
    protected sqlInMemory: SqlInMemory = new SqlInMemory();

    /**
     * Mode in which query runner executes.
     * Used for replication.
     * If replication is not setup its value is ignored.
     */
    protected mode: "master"|"slave";

    // -------------------------------------------------------------------------
    // Public Abstract Methods
    // -------------------------------------------------------------------------

    /**
     * Executes a given SQL query.
     */
    abstract query(query: string, parameters?: any[]): Promise<any>;

    // -------------------------------------------------------------------------
    // Protected Abstract Methods
    // -------------------------------------------------------------------------

    protected abstract async loadTables(tablePaths: string[]): Promise<Table[]>;

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Loads given table's data from the database.
     */
    async getTable(tablePath: string): Promise<Table|undefined> {
        this.loadedTables = await this.loadTables([tablePath]);
        return this.loadedTables.length > 0 ? this.loadedTables[0] : undefined;
    }

    /**
     * Loads all tables (with given names) from the database.
     */
    async getTables(tableNames: string[]): Promise<Table[]> {
        this.loadedTables = await this.loadTables(tableNames);
        return this.loadedTables;
    }

    /**
     * Enables special query runner mode in which sql queries won't be executed,
     * instead they will be memorized into a special variable inside query runner.
     * You can get memorized sql using getMemorySql() method.
     */
    enableSqlMemory(): void {
        this.sqlInMemory = new SqlInMemory();
        this.sqlMemoryMode = true;
    }

    /**
     * Disables special query runner mode in which sql queries won't be executed
     * started by calling enableSqlMemory() method.
     *
     * Previously memorized sql will be flushed.
     */
    disableSqlMemory(): void {
        this.sqlInMemory = new SqlInMemory();
        this.sqlMemoryMode = false;
    }

    /**
     * Flushes all memorized sqls.
     */
    clearSqlMemory(): void {
        this.sqlInMemory = new SqlInMemory();
    }

    /**
     * Gets sql stored in the memory. Parameters in the sql are already replaced.
     */
    getMemorySql(): SqlInMemory {
        return this.sqlInMemory;
    }

    /**
     * Executes up sql queries.
     */
    async executeMemoryUpSql(): Promise<void> {
        await PromiseUtils.runInSequence(this.sqlInMemory.upQueries, downQuery => this.query(downQuery));
    }

    /**
     * Executes down sql queries.
     */
    async executeMemoryDownSql(): Promise<void> {
        await PromiseUtils.runInSequence(this.sqlInMemory.downQueries.reverse(), downQuery => this.query(downQuery));
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Gets table from previously loaded tables, otherwise loads it from database.
     */
    protected async getCachedTable(tableName: string): Promise<Table> {
        const table = this.loadedTables.find(table => table.name === tableName);
        if (table) return table;

        const foundTables = await this.loadTables([tableName]);
        if (foundTables.length > 0) {
            this.loadedTables.push(foundTables[0]);
            return foundTables[0];
        } else {
            throw new Error(`Table "${tableName}" does not exist.`);
        }
    }

    /**
     * Replaces loaded table with given changed table.
     */
    protected replaceCachedTable(table: Table, changedTable: Table): void {
        const foundTable = this.loadedTables.find(loadedTable => loadedTable.name === table.name);
        if (foundTable)
            this.loadedTables[this.loadedTables.indexOf(foundTable)] = changedTable;
    }

    /**
     * Checks if at least one of column properties was changed.
     */
    protected isColumnChanged(oldColumn: TableColumn, newColumn: TableColumn, checkDefault?: boolean, checkComment?: boolean): boolean {
        return oldColumn.type !== newColumn.type
            || oldColumn.length !== newColumn.length
            || oldColumn.charset !== newColumn.charset
            || oldColumn.collation !== newColumn.collation
            || oldColumn.precision !== newColumn.precision
            || oldColumn.scale !== newColumn.scale
            || (checkDefault && oldColumn.default !== newColumn.default)
            || oldColumn.isNullable !== newColumn.isNullable
            || (checkComment && oldColumn.comment !== newColumn.comment)
            || oldColumn.enum !== newColumn.enum;
    }

    /**
     * Executes sql used special for schema build.
     */
    protected async executeQueries(upQueries: string|string[], downQueries: string|string[]): Promise<void> {
        if (typeof upQueries === "string")
            upQueries = [upQueries];
        if (typeof downQueries === "string")
            downQueries = [downQueries];

        this.sqlInMemory.upQueries.push(...upQueries);
        this.sqlInMemory.downQueries.push(...downQueries);

        // if sql-in-memory mode is enabled then simply store sql in memory and return
        if (this.sqlMemoryMode === true)
            return Promise.resolve() as Promise<any>;

        await PromiseUtils.runInSequence(upQueries, upQuery => this.query(upQuery));
    }

}