import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TransactionAlreadyStartedError} from "../../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {ColumnSchema} from "../../schema-builder/schema/ColumnSchema";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {TableSchema} from "../../schema-builder/schema/TableSchema";
import {IndexSchema} from "../../schema-builder/schema/IndexSchema";
import {ForeignKeySchema} from "../../schema-builder/schema/ForeignKeySchema";
import {PrimaryKeySchema} from "../../schema-builder/schema/PrimaryKeySchema";
import {RandomGenerator} from "../../util/RandomGenerator";
import {AbstractSqliteDriver} from "./AbstractSqliteDriver";
import {Connection} from "../../connection/Connection";
import {ReadStream} from "../../platform/PlatformTools";
import {EntityManager} from "../../entity-manager/EntityManager";
import {InsertResult} from "../InsertResult";

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

    constructor(driver: AbstractSqliteDriver) {}

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
     * Insert a new row with given values into the given table.
     * Returns value of the generated column if given and generate column exist in the table.
     */
    async insert(tableName: string, keyValues: ObjectLiteral): Promise<InsertResult> {
        throw new Error("Do not use AbstractSqlite directly, it has to be used with one of the sqlite drivers");
    }

    /**
     * Updates rows that match given conditions in the given table.
     */
    async update(tableName: string, valuesMap: ObjectLiteral, conditions: ObjectLiteral): Promise<void> {
        const updateValues = this.parametrize(valuesMap).join(", ");
        const conditionString = this.parametrize(conditions, Object.keys(valuesMap).length).join(" AND ");
        const query = `UPDATE "${tableName}" SET ${updateValues} ${conditionString ? (" WHERE " + conditionString) : ""}`;
        const updateParams = Object.keys(valuesMap).map(key => valuesMap[key]);
        const conditionParams = Object.keys(conditions).map(key => conditions[key]);
        const allParameters = updateParams.concat(conditionParams);
        await this.query(query, allParameters);
    }

    /**
     * Deletes from the given table by a given conditions.
     */
    async delete(tableName: string, conditions: ObjectLiteral|string, maybeParameters?: any[]): Promise<void> {
        const conditionString = typeof conditions === "string" ? conditions : this.parametrize(conditions).join(" AND ");
        const parameters = conditions instanceof Object ? Object.keys(conditions).map(key => (conditions as ObjectLiteral)[key]) : maybeParameters;

        const sql = `DELETE FROM "${tableName}" WHERE ${conditionString}`;
        await this.query(sql, parameters);
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
        const results: ObjectLiteral[] = await this.query(`SELECT MAX(level) as level FROM ${tableName} WHERE descendant = ${parentId}`);
        return results && results[0] && results[0]["level"] ? parseInt(results[0]["level"]) + 1 : 1;
    }

    /**
     * Loads given table's data from the database.
     */
    async loadTableSchema(tableName: string): Promise<TableSchema|undefined> {
        const tableSchemas = await this.loadTableSchemas([tableName]);
        return tableSchemas.length > 0 ? tableSchemas[0] : undefined;
    }

    /**
     * Loads all tables (with given names) from the database and creates a TableSchema from them.
     */
    async loadTableSchemas(tableNames: string[]): Promise<TableSchema[]> {
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
            const tableSchema = new TableSchema(dbTable["name"]);

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

            // create column schemas from the loaded columns
            tableSchema.columns = dbColumns.map(dbColumn => {
                const columnSchema = new ColumnSchema();
                columnSchema.name = dbColumn["name"];
                columnSchema.type = dbColumn["type"].toLowerCase();
                columnSchema.default = dbColumn["dflt_value"] !== null && dbColumn["dflt_value"] !== undefined ? dbColumn["dflt_value"] : undefined;
                columnSchema.isNullable = dbColumn["notnull"] === 0;
                columnSchema.isPrimary = dbColumn["pk"] === 1;
                columnSchema.comment = ""; // todo later
                columnSchema.isGenerated = autoIncrementColumnName === dbColumn["name"];
                const columnForeignKeys = dbForeignKeys
                    .filter(foreignKey => foreignKey["from"] === dbColumn["name"])
                    .map(foreignKey => {
                        // const keyName = this.driver.namingStrategy.foreignKeyName(dbTable["name"], [foreignKey["from"]], foreignKey["table"], [foreignKey["to"]]);
                        // todo: figure out solution here, name should be same as naming strategy generates!
                        const key = `${dbTable["name"]}_${[foreignKey["from"]].join("_")}_${foreignKey["table"]}_${[foreignKey["to"]].join("_")}`;
                        const keyName = "fk_" + RandomGenerator.sha1(key).substr(0, 27);
                        return new ForeignKeySchema(keyName, [foreignKey["from"]], [foreignKey["to"]], foreignKey["table"], foreignKey["on_delete"]); // todo: how sqlite return from and to when they are arrays? (multiple column foreign keys)
                    });
                tableSchema.addForeignKeys(columnForeignKeys);
                return columnSchema;
            });

            // create primary key schema
            await Promise.all(dbIndices
                .filter(index => index["origin"] === "pk")
                .map(async index => {
                    const indexInfos: ObjectLiteral[] = await this.query(`PRAGMA index_info("${index["name"]}")`);
                    const indexColumns = indexInfos.map(indexInfo => indexInfo["name"]);
                    indexColumns.forEach(indexColumn => {
                        tableSchema.primaryKeys.push(new PrimaryKeySchema(index["name"], indexColumn));
                    });
                }));

            // create index schemas from the loaded indices
            const indicesPromises = dbIndices
                .filter(dbIndex => {
                    return dbIndex["origin"] !== "pk" &&
                        (!tableSchema.foreignKeys.find(foreignKey => foreignKey.name === dbIndex["name"])) &&
                        (!tableSchema.primaryKeys.find(primaryKey => primaryKey.name === dbIndex["name"]));
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
                                const column = tableSchema.columns.find(column => column.name === columnName);
                                if (column)
                                    column.isUnique = true;
                            });
                        }

                        return Promise.resolve(undefined);

                    } else {
                        const isUnique = dbIndex!["unique"] === "1" || dbIndex!["unique"] === 1;
                        return new IndexSchema(dbTable["name"], dbIndex!["name"], indexColumns, isUnique);
                    }
                });

            const indices = await Promise.all(indicesPromises);
            tableSchema.indices = indices.filter(index => !!index) as IndexSchema[];

            return tableSchema;
        }));
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
     * Creates a schema if it's not created.
     */
    createSchema(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Creates a new table from the given table metadata and column metadatas.
     */
    async createTable(table: TableSchema): Promise<void> {
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
     * Creates a new column from the column schema in the table.
     */
    async addColumn(tableSchemaOrName: TableSchema|string, column: ColumnSchema): Promise<void> {
        const tableSchema = await this.getTableSchema(tableSchemaOrName);
        const newTableSchema = tableSchema.clone();
        newTableSchema.addColumns([column]);
        await this.recreateTable(newTableSchema, tableSchema);
    }

    /**
     * Creates a new columns from the column schema in the table.
     */
    async addColumns(tableSchemaOrName: TableSchema|string, columns: ColumnSchema[]): Promise<void> {
        const tableSchema = await this.getTableSchema(tableSchemaOrName);
        const newTableSchema = tableSchema.clone();
        newTableSchema.addColumns(columns);
        await this.recreateTable(newTableSchema, tableSchema);
    }

    /**
     * Renames column in the given table.
     */
    async renameColumn(tableSchemaOrName: TableSchema|string, oldColumnSchemaOrName: ColumnSchema|string, newColumnSchemaOrName: ColumnSchema|string): Promise<void> {

        let tableSchema: TableSchema|undefined = undefined;
        if (tableSchemaOrName instanceof TableSchema) {
            tableSchema = tableSchemaOrName;
        } else {
            tableSchema = await this.loadTableSchema(tableSchemaOrName);
        }

        if (!tableSchema)
            throw new Error(`Table ${tableSchemaOrName} was not found.`);

        let oldColumn: ColumnSchema|undefined = undefined;
        if (oldColumnSchemaOrName instanceof ColumnSchema) {
            oldColumn = oldColumnSchemaOrName;
        } else {
            oldColumn = tableSchema.columns.find(column => column.name === oldColumnSchemaOrName);
        }

        if (!oldColumn)
            throw new Error(`Column "${oldColumnSchemaOrName}" was not found in the "${tableSchemaOrName}" table.`);

        let newColumn: ColumnSchema|undefined = undefined;
        if (newColumnSchemaOrName instanceof ColumnSchema) {
            newColumn = newColumnSchemaOrName;
        } else {
            newColumn = oldColumn.clone();
            newColumn.name = newColumnSchemaOrName;
        }

        return this.changeColumn(tableSchema, oldColumn, newColumn);
    }

    /**
     * Changes a column in the table.
     */
    async changeColumn(tableSchemaOrName: TableSchema|string, oldColumnSchemaOrName: ColumnSchema|string, newColumn: ColumnSchema): Promise<void> {
        let tableSchema: TableSchema|undefined = undefined;
        if (tableSchemaOrName instanceof TableSchema) {
            tableSchema = tableSchemaOrName;
        } else {
            tableSchema = await this.loadTableSchema(tableSchemaOrName);
        }

        if (!tableSchema)
            throw new Error(`Table ${tableSchemaOrName} was not found.`);

        let oldColumn: ColumnSchema|undefined = undefined;
        if (oldColumnSchemaOrName instanceof ColumnSchema) {
            oldColumn = oldColumnSchemaOrName;
        } else {
            oldColumn = tableSchema.columns.find(column => column.name === oldColumnSchemaOrName);
        }

        if (!oldColumn)
            throw new Error(`Column "${oldColumnSchemaOrName}" was not found in the "${tableSchemaOrName}" table.`);

        // todo: fix it. it should not depend on tableSchema
        return this.recreateTable(tableSchema);
    }

    /**
     * Changes a column in the table.
     * Changed column looses all its keys in the db.
     */
    async changeColumns(tableSchema: TableSchema, changedColumns: { newColumn: ColumnSchema, oldColumn: ColumnSchema }[]): Promise<void> {
        // todo: fix it. it should not depend on tableSchema
        return this.recreateTable(tableSchema);
    }

    /**
     * Drops column in the table.
     */
    async dropColumn(table: TableSchema, column: ColumnSchema): Promise<void> {
        return this.dropColumns(table, [column]);
    }

    /**
     * Drops the columns in the table.
     */
    async dropColumns(table: TableSchema, columns: ColumnSchema[]): Promise<void> {
        const updatingTableSchema = table.clone();
        updatingTableSchema.removeColumns(columns);
        return this.recreateTable(updatingTableSchema);
    }

    /**
     * Updates table's primary keys.
     */
    async updatePrimaryKeys(dbTable: TableSchema): Promise<void> {
        return this.recreateTable(dbTable);
    }

    /**
     * Creates a new foreign key.
     */
    async createForeignKey(tableSchemaOrName: TableSchema|string, foreignKey: ForeignKeySchema): Promise<void> {
        return this.createForeignKeys(tableSchemaOrName as any, [foreignKey]);
    }

    /**
     * Creates a new foreign keys.
     */
    async createForeignKeys(tableSchemaOrName: TableSchema|string, foreignKeys: ForeignKeySchema[]): Promise<void> {
        const tableSchema = await this.getTableSchema(tableSchemaOrName);
        const changedTableSchema = tableSchema.clone();
        changedTableSchema.addForeignKeys(foreignKeys);
        return this.recreateTable(changedTableSchema);
    }

    /**
     * Drops a foreign key from the table.
     */
    async dropForeignKey(tableSchemaOrName: TableSchema|string, foreignKey: ForeignKeySchema): Promise<void> {
        return this.dropForeignKeys(tableSchemaOrName as any, [foreignKey]);
    }

    /**
     * Drops a foreign keys from the table.
     */
    async dropForeignKeys(tableSchemaOrName: TableSchema|string, foreignKeys: ForeignKeySchema[]): Promise<void> {
        const tableSchema = await this.getTableSchema(tableSchemaOrName);
        const changedTableSchema = tableSchema.clone();
        changedTableSchema.removeForeignKeys(foreignKeys);
        return this.recreateTable(changedTableSchema);
    }

    /**
     * Creates a new index.
     */
    async createIndex(tableName: string, index: IndexSchema): Promise<void> {
        const columnNames = index.columnNames.map(columnName => `"${columnName}"`).join(",");
        const sql = `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX "${index.name}" ON "${tableName}"(${columnNames})`;
        await this.query(sql);
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(tableName: string, indexName: string): Promise<void> {
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
    protected buildCreateColumnSql(column: ColumnSchema): string {
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

    protected async recreateTable(tableSchema: TableSchema, oldTableSchema?: TableSchema, migrateData = true): Promise<void> {
        // const withoutForeignKeyColumns = columns.filter(column => column.foreignKeys.length === 0);
        // const createForeignKeys = options && options.createForeignKeys;
        const columnDefinitions = tableSchema.columns.map(dbColumn => this.buildCreateColumnSql(dbColumn)).join(", ");
        const columnNames = tableSchema.columns.map(column => `"${column.name}"`).join(", ");

        let sql1 = `CREATE TABLE "temporary_${tableSchema.name}" (${columnDefinitions}`;
        // if (options && options.createForeignKeys) {
        tableSchema.foreignKeys.forEach(foreignKey => {
            const columnNames = foreignKey.columnNames.map(name => `"${name}"`).join(", ");
            const referencedColumnNames = foreignKey.referencedColumnNames.map(name => `"${name}"`).join(", ");
            sql1 += `, FOREIGN KEY(${columnNames}) REFERENCES "${foreignKey.referencedTableName}"(${referencedColumnNames})`;
            if (foreignKey.onDelete) sql1 += " ON DELETE " + foreignKey.onDelete;
        });

        const primaryKeyColumns = tableSchema.columns.filter(column => column.isPrimary && !column.isGenerated);
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
            const sql2 = `INSERT INTO "temporary_${tableSchema.name}"(${oldColumnNames}) SELECT ${oldColumnNames} FROM "${tableSchema.name}"`;
            await this.query(sql2);
        }

        // drop old table
        const sql3 = `DROP TABLE "${tableSchema.name}"`;
        await this.query(sql3);

        // rename temporary table
        const sql4 = `ALTER TABLE "temporary_${tableSchema.name}" RENAME TO "${tableSchema.name}"`;
        await this.query(sql4);

        // also re-create indices
        const indexPromises = tableSchema.indices.map(index => this.createIndex(tableSchema.name, index));
        // const uniquePromises = tableSchema.uniqueKeys.map(key => this.createIndex(key));
        await Promise.all(indexPromises/*.concat(uniquePromises)*/);
    }

    /**
     * If given value is a table name then it loads its table schema representation from the database.
     */
    protected async getTableSchema(tableSchemaOrName: TableSchema|string): Promise<TableSchema> {
        if (tableSchemaOrName instanceof TableSchema) {
            return tableSchemaOrName;
        } else {
            const tableSchema = await this.loadTableSchema(tableSchemaOrName);
            if (!tableSchema)
                throw new Error(`Table named ${tableSchemaOrName} was not found in the database.`);

            return tableSchema;
        }
    }

}
