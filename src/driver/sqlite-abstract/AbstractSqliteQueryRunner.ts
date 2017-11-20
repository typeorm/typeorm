import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TransactionAlreadyStartedError} from "../../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {TableColumn} from "../../schema-builder/schema/TableColumn";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {Table} from "../../schema-builder/schema/Table";
import {TableIndex} from "../../schema-builder/schema/TableIndex";
import {TableForeignKey} from "../../schema-builder/schema/TableForeignKey";
import {TablePrimaryKey} from "../../schema-builder/schema/TablePrimaryKey";
import {RandomGenerator} from "../../util/RandomGenerator";
import {AbstractSqliteDriver} from "./AbstractSqliteDriver";
import {Connection} from "../../connection/Connection";
import {ReadStream} from "../../platform/PlatformTools";
import {EntityManager} from "../../entity-manager/EntityManager";
import {Broadcaster} from "../../subscriber/Broadcaster";

/**
 * Runs queries on a single sqlite database connection.
 *
 * Does not support compose primary keys with autoincrement field.
 * todo: need to throw exception for this case.
 */
export class AbstractSqliteQueryRunner implements QueryRunner {

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Database driver used by connection.
     */
    driver: AbstractSqliteDriver;

    /**
     * Connection used by this query runner.
     */
    connection: Connection;

    /**
     * Broadcaster used on this query runner to broadcast entity events.
     */
    broadcaster: Broadcaster;

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

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Indicates if special query runner mode in which sql queries won't be executed is enabled.
     */
    protected sqlMemoryMode: boolean = false;

    /**
     * Sql-s stored if "sql in memory" mode is enabled.
     */
    protected sqlsInMemory: string[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: AbstractSqliteDriver) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates/uses database connection from the connection pool to perform further operations.
     * Returns obtained database connection.
     */
    connect(): Promise<any> {
        return Promise.resolve(this.driver.databaseConnection);
    }

    /**
     * Releases used database connection.
     * We don't do anything here because sqlite do not support multiple connections thus query runners.
     */
    release(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Starts transaction.
     */
    async startTransaction(): Promise<void> {
        if (this.isTransactionActive)
            throw new TransactionAlreadyStartedError();

        this.isTransactionActive = true;
        await this.query("BEGIN TRANSACTION");
    }

    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    async commitTransaction(): Promise<void> {
        if (!this.isTransactionActive)
            throw new TransactionNotStartedError();

        await this.query("COMMIT");
        this.isTransactionActive = false;
    }

    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    async rollbackTransaction(): Promise<void> {
        if (!this.isTransactionActive)
            throw new TransactionNotStartedError();

        await this.query("ROLLBACK");
        this.isTransactionActive = false;
    }

    /**
     * Executes a given SQL query.
     */
    query(query: string, parameters?: any[]): Promise<any> {
        throw new Error("Do not use AbstractSqlite directly, it has to be used with one of the sqlite drivers");
    }

    /**
     * Returns raw data stream.
     */
    stream(query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream> {
        throw new Error(`Stream is not supported by sqlite driver.`);
    }

    /**
     * Inserts rows into closure table.
     */
    async insertIntoClosureTable(tableName: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number> {
        let sql = "";
        if (hasLevel) {
            sql = `INSERT INTO "${tableName}"("ancestor", "descendant", "level") ` +
                `SELECT "ancestor", ${newEntityId}, "level" + 1 FROM "${tableName}" WHERE "descendant" = ${parentId} ` +
                `UNION ALL SELECT ${newEntityId}, ${newEntityId}, 1`;
        } else {
            sql = `INSERT INTO "${tableName}"("ancestor", "descendant") ` +
                `SELECT "ancestor", ${newEntityId} FROM "${tableName}" WHERE "descendant" = ${parentId} ` +
                `UNION ALL SELECT ${newEntityId}, ${newEntityId}`;
        }
        await this.query(sql);
        if (hasLevel) {
            const results: ObjectLiteral[] = await this.query(`SELECT MAX(level) as level FROM ${tableName} WHERE descendant = ${parentId}`);
            return results && results[0] && results[0]["level"] ? parseInt(results[0]["level"]) + 1 : 1;
        } else {
            return -1;
        }
    }

    /**
     * Loads given table's data from the database.
     */
    async getTable(tableName: string): Promise<Table|undefined> {
        const tables = await this.getTables([tableName]);
        return tables.length > 0 ? tables[0] : undefined;
    }

    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     */
    async getTables(tableNames: string[]): Promise<Table[]> {
        // if no tables given then no need to proceed
        if (!tableNames || !tableNames.length)
            return [];

        const tableNamesString = tableNames.map(tableName => `'${tableName}'`).join(", ");

        // load tables, columns, indices and foreign keys
        const dbTables: ObjectLiteral[] = await this.query(`SELECT * FROM sqlite_master WHERE type = 'table' AND name IN (${tableNamesString})`);

        // if tables were not found in the db, no need to proceed
        if (!dbTables || !dbTables.length)
            return [];

        // create table schemas for loaded tables
        return Promise.all(dbTables.map(async dbTable => {
            const table = new Table(dbTable["name"]);

            // load columns and indices
            const [dbColumns, dbIndices, dbForeignKeys]: ObjectLiteral[][] = await Promise.all([
                this.query(`PRAGMA table_info("${dbTable["name"]}")`),
                this.query(`PRAGMA index_list("${dbTable["name"]}")`),
                this.query(`PRAGMA foreign_key_list("${dbTable["name"]}")`),
            ]);

            // find column name with auto increment
            let autoIncrementColumnName: string|undefined = undefined;
            const tableSql: string = dbTable["sql"];
            if (tableSql.indexOf("AUTOINCREMENT") !== -1) {
                autoIncrementColumnName = tableSql.substr(0, tableSql.indexOf("AUTOINCREMENT"));
                const comma = autoIncrementColumnName.lastIndexOf(",");
                const bracket = autoIncrementColumnName.lastIndexOf("(");
                if (comma !== -1) {
                    autoIncrementColumnName = autoIncrementColumnName.substr(comma);
                    autoIncrementColumnName = autoIncrementColumnName.substr(0, autoIncrementColumnName.lastIndexOf("\""));
                    autoIncrementColumnName = autoIncrementColumnName.substr(autoIncrementColumnName.indexOf("\"") + 1);

                } else if (bracket !== -1) {
                    autoIncrementColumnName = autoIncrementColumnName.substr(bracket);
                    autoIncrementColumnName = autoIncrementColumnName.substr(0, autoIncrementColumnName.lastIndexOf("\""));
                    autoIncrementColumnName = autoIncrementColumnName.substr(autoIncrementColumnName.indexOf("\"") + 1);
                }
            }

            // create columns from the loaded columns
            table.columns = dbColumns.map(dbColumn => {
                const tableColumn = new TableColumn();
                tableColumn.name = dbColumn["name"];
                tableColumn.type = dbColumn["type"].toLowerCase();
                tableColumn.default = dbColumn["dflt_value"] !== null && dbColumn["dflt_value"] !== undefined ? dbColumn["dflt_value"] : undefined;
                tableColumn.isNullable = dbColumn["notnull"] === 0;
                // primary keys are numbered starting with 1, columns that aren't primary keys are marked with 0
                tableColumn.isPrimary = dbColumn["pk"] > 0;
                tableColumn.comment = ""; // todo later
                tableColumn.isGenerated = autoIncrementColumnName === dbColumn["name"];
                if (tableColumn.isGenerated) {
                    tableColumn.generationStrategy = "increment";
                }

                // parse datatype and attempt to retrieve length
                let pos = tableColumn.type.indexOf("(");
                if (pos !== -1) {
                    let dataType = tableColumn.type.substr(0, pos);
                    if (!!this.driver.withLengthColumnTypes.find(col => col === dataType)) {
                        let len = parseInt(tableColumn.type.substring(pos + 1, tableColumn.type.length - 1));
                        if (len) {
                            tableColumn.length = len.toString();
                            tableColumn.type = dataType; // remove the length part from the datatype
                        }
                    }
                }
                const columnForeignKeys = dbForeignKeys
                    .filter(foreignKey => foreignKey["from"] === dbColumn["name"])
                    .map(foreignKey => {
                        // const keyName = this.driver.namingStrategy.foreignKeyName(dbTable["name"], [foreignKey["from"]], foreignKey["table"], [foreignKey["to"]]);
                        // todo: figure out solution here, name should be same as naming strategy generates!
                        const key = `${dbTable["name"]}_${[foreignKey["from"]].join("_")}_${foreignKey["table"]}_${[foreignKey["to"]].join("_")}`;
                        const keyName = "fk_" + RandomGenerator.sha1(key).substr(0, 27);
                        return new TableForeignKey(keyName, [foreignKey["from"]], [foreignKey["to"]], foreignKey["table"], foreignKey["on_delete"]); // todo: how sqlite return from and to when they are arrays? (multiple column foreign keys)
                    });
                table.addForeignKeys(columnForeignKeys);
                return tableColumn;
            });

            // create primary key schema
            await Promise.all(dbIndices
                .filter(index => index["origin"] === "pk")
                .map(async index => {
                    const indexInfos: ObjectLiteral[] = await this.query(`PRAGMA index_info("${index["name"]}")`);
                    const indexColumns = indexInfos.map(indexInfo => indexInfo["name"]);
                    indexColumns.forEach(indexColumn => {
                        table.primaryKeys.push(new TablePrimaryKey(index["name"], indexColumn));
                    });
                }));

            // create index schemas from the loaded indices
            const indicesPromises = dbIndices
                .filter(dbIndex => {
                    return dbIndex["origin"] !== "pk" &&
                        (!table.foreignKeys.find(foreignKey => foreignKey.name === dbIndex["name"])) &&
                        (!table.primaryKeys.find(primaryKey => primaryKey.name === dbIndex["name"]));
                })
                .map(dbIndex => dbIndex["name"])
                .filter((value, index, self) => self.indexOf(value) === index) // unqiue
                .map(async dbIndexName => {
                    const dbIndex = dbIndices.find(dbIndex => dbIndex["name"] === dbIndexName);
                    const indexInfos: ObjectLiteral[] = await this.query(`PRAGMA index_info("${dbIndex!["name"]}")`);
                    const indexColumns = indexInfos
                        .sort((indexInfo1, indexInfo2) => parseInt(indexInfo1["seqno"]) - parseInt(indexInfo2["seqno"]))
                        .map(indexInfo => indexInfo["name"]);

                    // check if db index is generated by sqlite itself and has special use case
                    if (dbIndex!["name"].substr(0, "sqlite_autoindex".length) === "sqlite_autoindex") {
                        if (dbIndex!["unique"] === 1) { // this means we have a special index generated for a column
                            // so we find and update the column
                            indexColumns.forEach(columnName => {
                                const column = table.columns.find(column => column.name === columnName);
                                if (column)
                                    column.isUnique = true;
                            });
                        }

                        return Promise.resolve(undefined);

                    } else {
                        const isUnique = dbIndex!["unique"] === "1" || dbIndex!["unique"] === 1;
                        return new TableIndex(dbTable["name"], dbIndex!["name"], indexColumns, isUnique);
                    }
                });

            const indices = await Promise.all(indicesPromises);
            table.indices = indices.filter(index => !!index) as TableIndex[];

            return table;
        }));
    }

    /**
     * Checks if database with the given name exist.
     */
    async hasDatabase(database: string): Promise<boolean> {
        return Promise.resolve(false);
    }

    /**
     * Checks if table with the given name exist in the database.
     */
    async hasTable(tableName: string): Promise<boolean> {
        const sql = `SELECT * FROM sqlite_master WHERE type = 'table' AND name = '${tableName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a database if it's not created.
     */
    createDatabase(database: string): Promise<void[]> {
        return Promise.resolve([]);
    }

    /**
     * Creates a schema if it's not created.
     */
    createSchema(schemas: string[]): Promise<void[]> {
        return Promise.resolve([]);
    }

    /**
     * Creates a new table from the given table metadata and column metadatas.
     */
    async createTable(table: Table): Promise<void> {
        // skip columns with foreign keys, we will add them later
        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(column)).join(", ");
        let sql = `CREATE TABLE "${table.name}" (${columnDefinitions}`;
        const primaryKeyColumns = table.columns.filter(column => column.isPrimary && !column.isGenerated);
        if (primaryKeyColumns.length > 0)
            sql += `, PRIMARY KEY(${primaryKeyColumns.map(column => `${column.name}`).join(", ")})`; // for some reason column escaping here generates a wrong schema
        sql += `)`;
        await this.query(sql);
    }

    /**
     * Drops the table.
     */
    async dropTable(tableName: string): Promise<void> {
        let sql = `DROP TABLE "${tableName}"`;
        await this.query(sql);
    }

    /**
     * Checks if column with the given name exist in the given table.
     */
    async hasColumn(tableName: string, columnName: string): Promise<boolean> {
        const sql = `PRAGMA table_info("${tableName}")`;
        const columns: ObjectLiteral[] = await this.query(sql);
        return !!columns.find(column => column["name"] === columnName);
    }

    /**
     * Creates a new column from the column in the table.
     */
    async addColumn(tableOrName: Table|string, column: TableColumn): Promise<void> {
        const table = await this.getTableSchema(tableOrName);
        const newTableSchema = table.clone();
        newTableSchema.addColumns([column]);
        await this.recreateTable(newTableSchema, table);
    }

    /**
     * Creates a new columns from the column in the table.
     */
    async addColumns(tableOrName: Table|string, columns: TableColumn[]): Promise<void> {
        const table = await this.getTableSchema(tableOrName);
        const newTableSchema = table.clone();
        newTableSchema.addColumns(columns);
        await this.recreateTable(newTableSchema, table);
    }

    /**
     * Renames column in the given table.
     */
    async renameColumn(tableOrName: Table|string, oldTableColumnOrName: TableColumn|string, newTableColumnOrName: TableColumn|string): Promise<void> {

        let table: Table|undefined = undefined;
        if (tableOrName instanceof Table) {
            table = tableOrName;
        } else {
            table = await this.getTable(tableOrName);
        }

        if (!table)
            throw new Error(`Table ${tableOrName} was not found.`);

        let oldColumn: TableColumn|undefined = undefined;
        if (oldTableColumnOrName instanceof TableColumn) {
            oldColumn = oldTableColumnOrName;
        } else {
            oldColumn = table.columns.find(column => column.name === oldTableColumnOrName);
        }

        if (!oldColumn)
            throw new Error(`Column "${oldTableColumnOrName}" was not found in the "${tableOrName}" table.`);

        let newColumn: TableColumn|undefined = undefined;
        if (newTableColumnOrName instanceof TableColumn) {
            newColumn = newTableColumnOrName;
        } else {
            newColumn = oldColumn.clone();
            newColumn.name = newTableColumnOrName;
        }

        return this.changeColumn(table, oldColumn, newColumn);
    }

    /**
     * Changes a column in the table.
     */
    async changeColumn(tableOrName: Table|string, oldTableColumnOrName: TableColumn|string, newColumn: TableColumn): Promise<void> {
        let table: Table|undefined = undefined;
        if (tableOrName instanceof Table) {
            table = tableOrName;
        } else {
            table = await this.getTable(tableOrName);
        }

        if (!table)
            throw new Error(`Table ${tableOrName} was not found.`);

        let oldColumn: TableColumn|undefined = undefined;
        if (oldTableColumnOrName instanceof TableColumn) {
            oldColumn = oldTableColumnOrName;
        } else {
            oldColumn = table.columns.find(column => column.name === oldTableColumnOrName);
        }

        if (!oldColumn)
            throw new Error(`Column "${oldTableColumnOrName}" was not found in the "${tableOrName}" table.`);

        // todo: fix it. it should not depend on table
        return this.recreateTable(table);
    }

    /**
     * Changes a column in the table.
     * Changed column looses all its keys in the db.
     */
    async changeColumns(table: Table, changedColumns: { newColumn: TableColumn, oldColumn: TableColumn }[]): Promise<void> {
        // todo: fix it. it should not depend on table
        return this.recreateTable(table);
    }

    /**
     * Drops column in the table.
     */
    async dropColumn(table: Table, column: TableColumn): Promise<void> {
        return this.dropColumns(table, [column]);
    }

    /**
     * Drops the columns in the table.
     */
    async dropColumns(table: Table, columns: TableColumn[]): Promise<void> {
        const updatingTableSchema = table.clone();
        updatingTableSchema.removeColumns(columns);
        return this.recreateTable(updatingTableSchema);
    }

    /**
     * Updates table's primary keys.
     */
    async updatePrimaryKeys(dbTable: Table): Promise<void> {
        return this.recreateTable(dbTable);
    }

    /**
     * Creates a new foreign key.
     */
    async createForeignKey(tableOrName: Table|string, foreignKey: TableForeignKey): Promise<void> {
        return this.createForeignKeys(tableOrName as any, [foreignKey]);
    }

    /**
     * Creates a new foreign keys.
     */
    async createForeignKeys(tableOrName: Table|string, foreignKeys: TableForeignKey[]): Promise<void> {
        const table = await this.getTableSchema(tableOrName);
        const changedTableSchema = table.clone();
        changedTableSchema.addForeignKeys(foreignKeys);
        return this.recreateTable(changedTableSchema);
    }

    /**
     * Drops a foreign key from the table.
     */
    async dropForeignKey(tableOrName: Table|string, foreignKey: TableForeignKey): Promise<void> {
        return this.dropForeignKeys(tableOrName as any, [foreignKey]);
    }

    /**
     * Drops a foreign keys from the table.
     */
    async dropForeignKeys(tableOrName: Table|string, foreignKeys: TableForeignKey[]): Promise<void> {
        const table = await this.getTableSchema(tableOrName);
        const changedTableSchema = table.clone();
        changedTableSchema.removeForeignKeys(foreignKeys);
        return this.recreateTable(changedTableSchema);
    }

    /**
     * Creates a new index.
     */
    async createIndex(table: Table|string, index: TableIndex): Promise<void> {
        const columnNames = index.columnNames.map(columnName => `"${columnName}"`).join(",");
        const sql = `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX "${index.name}" ON "${table instanceof Table ? table.name : table}"(${columnNames})`;
        await this.query(sql);
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(tableSchemeOrName: Table|string, indexName: string): Promise<void> {
        const sql = `DROP INDEX "${indexName}"`;
        await this.query(sql);
    }

    /**
     * Truncates table.
     */
    async truncate(tableName: string): Promise<void> {
        await this.query(`DELETE FROM "${tableName}"`);
    }

    /**
     * Removes all tables from the currently connected database.
     */
    async clearDatabase(): Promise<void> {
        await this.query(`PRAGMA foreign_keys = OFF;`);
        await this.startTransaction();
        try {
            const selectDropsQuery = `select 'drop table "' || name || '";' as query from sqlite_master where type = 'table' and name != 'sqlite_sequence'`;
            const dropQueries: ObjectLiteral[] = await this.query(selectDropsQuery);
            await Promise.all(dropQueries.map(q => this.query(q["query"])));
            await this.commitTransaction();

        } catch (error) {
            try { // we throw original error even if rollback thrown an error
                await this.rollbackTransaction();
            } catch (rollbackError) { }
            throw error;

        } finally {
            await this.query(`PRAGMA foreign_keys = ON;`);
        }
    }

    /**
     * Enables special query runner mode in which sql queries won't be executed,
     * instead they will be memorized into a special variable inside query runner.
     * You can get memorized sql using getMemorySql() method.
     */
    enableSqlMemory(): void {
        this.sqlMemoryMode = true;
    }

    /**
     * Disables special query runner mode in which sql queries won't be executed
     * started by calling enableSqlMemory() method.
     *
     * Previously memorized sql will be flushed.
     */
    disableSqlMemory(): void {
        this.sqlsInMemory = [];
        this.sqlMemoryMode = false;
    }

    /**
     * Gets sql stored in the memory. Parameters in the sql are already replaced.
     */
    getMemorySql(): (string|{ up: string, down: string })[] {
        return this.sqlsInMemory;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    protected parametrize(objectLiteral: ObjectLiteral, startIndex: number = 0): string[] {
        return Object.keys(objectLiteral).map((key, index) => `"${key}"` + "=$" + (startIndex + index + 1));
    }

    /**
     * Builds a query for create column.
     */
    protected buildCreateColumnSql(column: TableColumn): string {
        let c = "\"" + column.name + "\"";
        if (column instanceof ColumnMetadata) {
            c += " " + this.driver.normalizeType(column);
        } else {
            c += " " + this.connection.driver.createFullType(column);
        }
        if (column.collation)
            c += " COLLATE " + column.collation;
        if (column.isNullable !== true)
            c += " NOT NULL";
        if (column.isUnique === true)
            c += " UNIQUE";
        if (column.isGenerated === true && column.generationStrategy === "increment") // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " PRIMARY KEY AUTOINCREMENT";

        if (column.default !== undefined && column.default !== null) { // todo: same code in all drivers. make it DRY
            c += " DEFAULT (" + column.default + ")";
        }

        return c;
    }

    protected async recreateTable(table: Table, oldTableSchema?: Table, migrateData = true): Promise<void> {
        // const withoutForeignKeyColumns = columns.filter(column => column.foreignKeys.length === 0);
        // const createForeignKeys = options && options.createForeignKeys;
        const columnDefinitions = table.columns.map(dbColumn => this.buildCreateColumnSql(dbColumn)).join(", ");
        const columnNames = table.columns.map(column => `"${column.name}"`).join(", ");

        let sql1 = `CREATE TABLE "temporary_${table.name}" (${columnDefinitions}`;
        // if (options && options.createForeignKeys) {
        table.foreignKeys.forEach(foreignKey => {
            const columnNames = foreignKey.columnNames.map(name => `"${name}"`).join(", ");
            const referencedColumnNames = foreignKey.referencedColumnNames.map(name => `"${name}"`).join(", ");
            sql1 += `, FOREIGN KEY(${columnNames}) REFERENCES "${foreignKey.referencedTableName}"(${referencedColumnNames})`;
            if (foreignKey.onDelete) sql1 += " ON DELETE " + foreignKey.onDelete;
        });

        const primaryKeyColumns = table.columns.filter(column => column.isPrimary && !column.isGenerated);
        if (primaryKeyColumns.length > 0)
            sql1 += `, PRIMARY KEY(${primaryKeyColumns.map(column => `${column.name}`).join(", ")})`; // for some reason column escaping here generate a wrong schema

        sql1 += ")";

        // todo: need also create uniques and indices?

        // recreate a table with a temporary name
        await this.query(sql1);

        // we need only select data from old columns
        const oldColumnNames = oldTableSchema ? oldTableSchema.columns.map(column => `"${column.name}"`).join(", ") : columnNames;

        // migrate all data from the table into temporary table
        if (migrateData) {
            const sql2 = `INSERT INTO "temporary_${table.name}"(${oldColumnNames}) SELECT ${oldColumnNames} FROM "${table.name}"`;
            await this.query(sql2);
        }

        // drop old table
        const sql3 = `DROP TABLE "${table.name}"`;
        await this.query(sql3);

        // rename temporary table
        const sql4 = `ALTER TABLE "temporary_${table.name}" RENAME TO "${table.name}"`;
        await this.query(sql4);

        // also re-create indices
        const indexPromises = table.indices.map(index => this.createIndex(table.name, index));
        // const uniquePromises = table.uniqueKeys.map(key => this.createIndex(key));
        await Promise.all(indexPromises/*.concat(uniquePromises)*/);
    }

    /**
     * If given value is a table name then it loads its table schema representation from the database.
     */
    protected async getTableSchema(tableOrName: Table|string): Promise<Table> {
        if (tableOrName instanceof Table) {
            return tableOrName;
        } else {
            const table = await this.getTable(tableOrName);
            if (!table)
                throw new Error(`Table named ${tableOrName} was not found in the database.`);

            return table;
        }
    }

}
