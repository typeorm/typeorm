import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TransactionAlreadyStartedError} from "../../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {ColumnSchema} from "../../schema-builder/schema/ColumnSchema";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {TableSchema} from "../../schema-builder/schema/TableSchema";
import {ForeignKeySchema} from "../../schema-builder/schema/ForeignKeySchema";
import {PrimaryKeySchema} from "../../schema-builder/schema/PrimaryKeySchema";
import {IndexSchema} from "../../schema-builder/schema/IndexSchema";
import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {MysqlDriver} from "./MysqlDriver";
import {Connection} from "../../connection/Connection";
import {ReadStream} from "fs";

/**
 * Runs queries on a single mysql database connection.
 */
export class MysqlQueryRunner implements QueryRunner {

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Database driver used by connection.
     */
    driver: MysqlDriver;

    /**
     * Connection used by this query runner.
     */
    connection: Connection;

    /**
     * Indicates if connection for this query runner is released.
     * Once its released, query runner cannot run queries anymore.
     */
    isReleased = false;

    /**
     * Indicates if transaction is in progress.
     */
    isTransactionActive = false;

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Real database connection from a connection pool used to perform queries.
     */
    protected databaseConnection: any;

    /**
     * Promise used to obtain a database connection from a pool for a first time.
     */
    protected databaseConnectionPromise: Promise<any>;

    /**
     * Indicates if special query runner mode in which sql queries won't be executed is enabled.
     */
    protected sqlMemoryMode: boolean = false;

    /**
     * Sql-s stored if "sql in memory" mode is enabled.
     */
    protected sqlsInMemory: (string|{ up: string, down: string })[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: MysqlDriver) {
        this.driver = driver;
        this.connection = driver.connection;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates/uses database connection from the connection pool to perform further operations.
     * Returns obtained database connection.
     */
    connect(): Promise<any> {
        if (this.databaseConnection)
            return Promise.resolve(this.databaseConnection);

        if (this.databaseConnectionPromise)
            return this.databaseConnectionPromise;

        this.databaseConnectionPromise = new Promise((ok, fail) => {
            this.driver.pool.getConnection((err: any, dbConnection: any) => {
                this.databaseConnection = dbConnection;
                err ? fail(err) : ok(dbConnection);
            });
        });

        return this.databaseConnectionPromise;
    }

    /**
     * Releases used database connection.
     * You cannot use query runner methods once its released.
     */
    release(): Promise<void> {
        this.isReleased = true;
        if (this.databaseConnection)
            this.databaseConnection.release();
        return Promise.resolve();
    }

    /**
     * Starts transaction on the current connection.
     */
    async startTransaction(): Promise<void> {
        if (this.isTransactionActive)
            throw new TransactionAlreadyStartedError();

        this.isTransactionActive = true;
        await this.query("START TRANSACTION");
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
     * Executes a raw SQL query.
     */
    query(query: string, parameters?: any[]): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        return new Promise(async (ok, fail) => {
            const databaseConnection = await this.connect();
            this.driver.connection.logger.logQuery(query, parameters, this);
            databaseConnection.query(query, parameters, (err: any, result: any) => {
                if (err) {
                    this.driver.connection.logger.logFailedQuery(query, parameters, this);
                    this.driver.connection.logger.logQueryError(err, this);
                    return fail(err);
                }

                ok(result);
            });
        });
    }

    /**
     * Returns raw data stream.
     */
    stream(query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        return new Promise(async (ok, fail) => {
            const databaseConnection = await this.connect();
            this.driver.connection.logger.logQuery(query, parameters, this);
            const stream = databaseConnection.query(query, parameters);
            if (onEnd) stream.on("end", onEnd);
            if (onError) stream.on("error", onError);
            ok(stream);
        });
    }

    /**
     * Insert a new row with given values into the given table.
     * Returns value of the generated column if given and generate column exist in the table.
     */
    async insert(tableName: string, keyValues: ObjectLiteral, generatedColumn?: ColumnMetadata): Promise<any> {
        const keys = Object.keys(keyValues);
        const columns = keys.map(key => `\`${key}\``).join(", ");
        const values = keys.map(key => "?").join(",");
        const parameters = keys.map(key => keyValues[key]);
        const sql = `INSERT INTO \`${tableName}\`(${columns}) VALUES (${values})`;
        const result = await this.query(sql, parameters);
        return generatedColumn ? result.insertId : undefined;
    }

    /**
     * Updates rows that match given conditions in the given table.
     */
    async update(tableName: string, valuesMap: ObjectLiteral, conditions: ObjectLiteral): Promise<void> {
        const updateValues = this.parametrize(valuesMap).join(", ");
        const conditionString = this.parametrize(conditions).join(" AND ");
        const sql = `UPDATE \`${tableName}\` SET ${updateValues} ${conditionString ? (" WHERE " + conditionString) : ""}`;
        const conditionParams = Object.keys(conditions).map(key => conditions[key]);
        const updateParams = Object.keys(valuesMap).map(key => valuesMap[key]);
        const allParameters = updateParams.concat(conditionParams);
        await this.query(sql, allParameters);
    }

    /**
     * Deletes from the given table by a given conditions.
     */
    async delete(tableName: string, conditions: ObjectLiteral|string, maybeParameters?: any[]): Promise<void> {
        const conditionString = typeof conditions === "string" ? conditions : this.parametrize(conditions).join(" AND ");
        const parameters = conditions instanceof Object ? Object.keys(conditions).map(key => (conditions as ObjectLiteral)[key]) : maybeParameters;

        const sql = `DELETE FROM \`${tableName}\` WHERE ${conditionString}`;
        await this.query(sql, parameters);
    }

    /**
     * Inserts rows into the closure table.
     */
    async insertIntoClosureTable(tableName: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number> {
        // todo: escape column names as well
        if (hasLevel) {
            await this.query(
                `INSERT INTO \`${tableName}\`(\`ancestor\`, \`descendant\`, \`level\`) ` +
                `SELECT \`ancestor\`, ${newEntityId}, \`level\` + 1 FROM \`${tableName}\` WHERE \`descendant\` = ${parentId} ` +
                `UNION ALL SELECT ${newEntityId}, ${newEntityId}, 1`
            );
        } else {
            await this.query(
                `INSERT INTO \`${tableName}\`(\`ancestor\`, \`descendant\`) ` +
                `SELECT \`ancestor\`, ${newEntityId} FROM \`${tableName}\` WHERE \`descendant\` = ${parentId} ` +
                `UNION ALL SELECT ${newEntityId}, ${newEntityId}`
            );
        }
        const results: ObjectLiteral[] = await this.query(`SELECT MAX(\`level\`) as \`level\` FROM \`${tableName}\` WHERE \`descendant\` = ${parentId}`);
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
        if (this.sqlMemoryMode)
            throw new Error(`Loading table schema is not supported in sql memory mode`);

        // if no tables given then no need to proceed
        if (!tableNames || !tableNames.length)
            return [];

        // load tables, columns, indices and foreign keys
        const tableNamesString = tableNames.map(tableName => `'${tableName}'`).join(", ");
        const tablesSql      = `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${this.dbName}' AND TABLE_NAME IN (${tableNamesString})`;
        const columnsSql     = `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '${this.dbName}'`;
        const indicesSql     = `SELECT * FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = '${this.dbName}' AND INDEX_NAME != 'PRIMARY'`;
        const foreignKeysSql = `SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = '${this.dbName}' AND REFERENCED_COLUMN_NAME IS NOT NULL`;
        const [dbTables, dbColumns, dbIndices, dbForeignKeys]: ObjectLiteral[][] = await Promise.all([
            this.query(tablesSql),
            this.query(columnsSql),
            this.query(indicesSql),
            this.query(foreignKeysSql)
        ]);

        // if tables were not found in the db, no need to proceed
        if (!dbTables.length)
            return [];

        // create table schemas for loaded tables
        return Promise.all(dbTables.map(async dbTable => {
            const tableSchema = new TableSchema(dbTable["TABLE_NAME"]);
            const primaryKeys: ObjectLiteral[] = await this.query(`SHOW INDEX FROM \`${dbTable["TABLE_NAME"]}\` WHERE Key_name = 'PRIMARY'`);

            // create column schemas from the loaded columns
            tableSchema.columns = dbColumns
                .filter(dbColumn => dbColumn["TABLE_NAME"] === tableSchema.name)
                .map(dbColumn => {
                    const columnSchema = new ColumnSchema();
                    columnSchema.name = dbColumn["COLUMN_NAME"];

                    const columnType = dbColumn["COLUMN_TYPE"].toLowerCase();
                    const endIndex = columnType.indexOf("(");
                    columnSchema.type = endIndex !== -1 ? columnType.substring(0, endIndex) : columnType;

                    columnSchema.default = dbColumn["COLUMN_DEFAULT"] !== null && dbColumn["COLUMN_DEFAULT"] !== undefined ? dbColumn["COLUMN_DEFAULT"] : undefined;
                    columnSchema.isNullable = dbColumn["IS_NULLABLE"] === "YES";
                    columnSchema.isPrimary = dbColumn["COLUMN_KEY"].indexOf("PRI") !== -1;
                    columnSchema.isUnique = dbColumn["COLUMN_KEY"].indexOf("UNI") !== -1;
                    columnSchema.isGenerated = dbColumn["EXTRA"].indexOf("auto_increment") !== -1;
                    columnSchema.comment = dbColumn["COLUMN_COMMENT"];
                    columnSchema.precision = dbColumn["NUMERIC_PRECISION"];
                    columnSchema.scale = dbColumn["NUMERIC_SCALE"];

                    if (columnSchema.type === "int" || columnSchema.type === "tinyint"
                        ||  columnSchema.type === "smallint" || columnSchema.type === "mediumint"
                        || columnSchema.type === "bigint" || columnSchema.type === "year") {

                        const length = columnType.substring(columnType.indexOf("(") + 1, columnType.indexOf(")"));
                        columnSchema.length = parseInt(length);

                    } else {
                        columnSchema.length = dbColumn["CHARACTER_MAXIMUM_LENGTH"];
                    }

                    if (columnSchema.type === "enum") {
                        const colType = dbColumn["COLUMN_TYPE"];
                        const items = colType.substring(colType.indexOf("(") + 1, colType.indexOf(")")).split(",");
                        columnSchema.enum = (items as string[]).map(item => {
                            return item.substring(1, item.length - 1);
                        });
                    }

                    if (columnSchema.type === "datetime" || columnSchema.type === "time" || columnSchema.type === "timestamp") {
                        columnSchema.precision = dbColumn["DATETIME_PRECISION"];
                    }

                    return columnSchema;
                });

            // create primary keys
            tableSchema.primaryKeys = primaryKeys.map(primaryKey => {
                return new PrimaryKeySchema(primaryKey["Key_name"], primaryKey["Column_name"]);
            });

            // create foreign key schemas from the loaded indices
            tableSchema.foreignKeys = dbForeignKeys
                .filter(dbForeignKey => dbForeignKey["TABLE_NAME"] === tableSchema.name)
                .map(dbForeignKey => new ForeignKeySchema(dbForeignKey["CONSTRAINT_NAME"], [], [], "", "")); // todo: fix missing params

            // create index schemas from the loaded indices
            tableSchema.indices = dbIndices
                .filter(dbIndex => {
                    return dbIndex["TABLE_NAME"] === tableSchema.name &&
                        (!tableSchema.foreignKeys.find(foreignKey => foreignKey.name === dbIndex["INDEX_NAME"])) &&
                        (!tableSchema.primaryKeys.find(primaryKey => primaryKey.name === dbIndex["INDEX_NAME"]));
                })
                .map(dbIndex => dbIndex["INDEX_NAME"])
                .filter((value, index, self) => self.indexOf(value) === index) // unqiue
                .map(dbIndexName => {
                    const currentDbIndices = dbIndices.filter(dbIndex => dbIndex["TABLE_NAME"] === tableSchema.name && dbIndex["INDEX_NAME"] === dbIndexName);
                    const columnNames = currentDbIndices.map(dbIndex => dbIndex["COLUMN_NAME"]);

                    // find a special index - unique index and
                    if (currentDbIndices.length === 1 && currentDbIndices[0]["NON_UNIQUE"] === 0) {
                        const column = tableSchema.columns.find(column => column.name === currentDbIndices[0]["INDEX_NAME"] && column.name === currentDbIndices[0]["COLUMN_NAME"]);
                        if (column) {
                            column.isUnique = true;
                            return;
                        }
                    }

                    return new IndexSchema(dbTable["TABLE_NAME"], dbIndexName, columnNames, false /* todo: uniqueness */);
                })
                .filter(index => !!index) as IndexSchema[]; // remove empty returns

            return tableSchema;
        }));
    }

    /**
     * Checks if table with the given name exist in the database.
     */
    async hasTable(table: TableSchema|string): Promise<boolean> {
        const tableName = table instanceof TableSchema ? table.name : table;
        const sql = `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '${this.dbName}' AND TABLE_NAME = '${tableName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Checks if column with the given name exist in the given table.
     */
    async hasColumn(table: TableSchema|string, column: ColumnSchema|string): Promise<boolean> {
        const tableName = table instanceof TableSchema ? table.name : table;
        const columnName = column instanceof ColumnSchema ? column.name : column;
        const sql = `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '${this.dbName}' AND TABLE_NAME = '${tableName}' AND COLUMN_NAME = '${columnName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a new table from the given table schema and column schemas inside it.
     */
    async createTable(table: TableSchema): Promise<void> {
        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(column, false)).join(", ");
        let sql = `CREATE TABLE \`${table.name}\` (${columnDefinitions}`;
        const primaryKeyColumns = table.columns.filter(column => column.isPrimary && !column.isGenerated);
        if (primaryKeyColumns.length > 0)
            sql += `, PRIMARY KEY(${primaryKeyColumns.map(column => `\`${column.name}\``).join(", ")})`;
        sql += `) ENGINE=${table.engine || "InnoDB"}`;

        const revertSql = `DROP TABLE \`${table.name}\``;
        return this.schemaQuery(sql, revertSql);
    }

    /**
     * Drop the table.
     */
    async dropTable(table: TableSchema|string): Promise<void> {
        const tableName = table instanceof TableSchema ? table.name : table;
        const sql = `DROP TABLE \`${tableName}\``;
        return this.query(sql);
    }

    /**
     * Creates a new column from the column schema in the table.
     */
    async addColumn(tableSchemaOrName: TableSchema|string, column: ColumnSchema): Promise<void> {
        const tableName = tableSchemaOrName instanceof TableSchema ? tableSchemaOrName.name : tableSchemaOrName;
        const sql = `ALTER TABLE \`${tableName}\` ADD ${this.buildCreateColumnSql(column, false)}`;
        const revertSql = `ALTER TABLE \`${tableName}\` DROP \`${column.name}\``;
        return this.schemaQuery(sql, revertSql);
    }

    /**
     * Creates a new columns from the column schema in the table.
     */
    async addColumns(tableSchemaOrName: TableSchema|string, columns: ColumnSchema[]): Promise<void> {
        const queries = columns.map(column => this.addColumn(tableSchemaOrName as any, column));
        await Promise.all(queries);
    }

    /**
     * Renames column in the given table.
     */
    async renameColumn(tableSchemaOrName: TableSchema|string, oldColumnSchemaOrName: ColumnSchema|string, newColumnSchemaOrName: ColumnSchema|string): Promise<void> {

        let tableSchema: TableSchema|undefined = undefined;
        if (tableSchemaOrName instanceof TableSchema) {
            tableSchema = tableSchemaOrName;
        } else {
            tableSchema = await this.loadTableSchema(tableSchemaOrName); // todo: throw exception, this wont work because of sql memory enabled. remove support by table name
            if (!tableSchema)
                throw new Error(`Table ${tableSchemaOrName} was not found.`);
        }

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

        if (newColumn.isUnique === false && oldColumn.isUnique === true)
            await this.query(`ALTER TABLE \`${tableSchema.name}\` DROP INDEX \`${oldColumn.name}\``); // todo: add revert code

        const sql = `ALTER TABLE \`${tableSchema.name}\` CHANGE \`${oldColumn.name}\` ${this.buildCreateColumnSql(newColumn, oldColumn.isPrimary)}`;
        const revertSql = `ALTER TABLE \`${tableSchema.name}\` CHANGE \`${oldColumn.name}\` ${this.buildCreateColumnSql(oldColumn, oldColumn.isPrimary)}`;
        return this.schemaQuery(sql, revertSql);
    }

    /**
     * Changes a column in the table.
     */
    async changeColumns(table: TableSchema, changedColumns: { newColumn: ColumnSchema, oldColumn: ColumnSchema }[]): Promise<void> {
        const updatePromises = changedColumns.map(async changedColumn => {
            return this.changeColumn(table, changedColumn.oldColumn, changedColumn.newColumn);
        });

        await Promise.all(updatePromises);
    }

    /**
     * Drops column in the table.
     */
    async dropColumn(table: TableSchema, column: ColumnSchema): Promise<void> {
        const sql = `ALTER TABLE \`${table.name}\` DROP \`${column.name}\``;
        const revertSql = `ALTER TABLE \`${table.name}\` ADD ${this.buildCreateColumnSql(column, false)}`;
        return this.schemaQuery(sql, revertSql);
    }

    /**
     * Drops the columns in the table.
     */
    async dropColumns(table: TableSchema, columns: ColumnSchema[]): Promise<void> {
        const dropPromises = columns.map(column => this.dropColumn(table, column));
        await Promise.all(dropPromises);
    }

    /**
     * Updates table's primary keys.
     */
    async updatePrimaryKeys(tableSchema: TableSchema): Promise<void> {
        if (!tableSchema.hasGeneratedColumn)
            await this.query(`ALTER TABLE \`${tableSchema.name}\` DROP PRIMARY KEY`);

        const primaryColumnNames = tableSchema.columns
            .filter(column => column.isPrimary && !column.isGenerated)
            .map(column => "`" + column.name + "`");
        if (primaryColumnNames.length > 0) {
            const sql = `ALTER TABLE \`${tableSchema.name}\` ADD PRIMARY KEY (${primaryColumnNames.join(", ")})`;
            const revertSql = `ALTER TABLE \`${tableSchema.name}\` DROP PRIMARY KEY`;
            return this.schemaQuery(sql, revertSql);
        }
    }

    /**
     * Creates a new foreign key.
     */
    async createForeignKey(tableSchemaOrName: TableSchema|string, foreignKey: ForeignKeySchema): Promise<void> {
        const tableName = tableSchemaOrName instanceof TableSchema ? tableSchemaOrName.name : tableSchemaOrName;
        const columnNames = foreignKey.columnNames.map(column => "`" + column + "`").join(", ");
        const referencedColumnNames = foreignKey.referencedColumnNames.map(column => "`" + column + "`").join(",");
        let sql = `ALTER TABLE \`${tableName}\` ADD CONSTRAINT \`${foreignKey.name}\` ` +
            `FOREIGN KEY (${columnNames}) ` +
            `REFERENCES \`${foreignKey.referencedTableName}\`(${referencedColumnNames})`;
        if (foreignKey.onDelete) sql += " ON DELETE " + foreignKey.onDelete;
        const revertSql = `ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${foreignKey.name}\``;
        return this.schemaQuery(sql, revertSql);
    }

    /**
     * Creates a new foreign keys.
     */
    async createForeignKeys(tableSchemaOrName: TableSchema|string, foreignKeys: ForeignKeySchema[]): Promise<void> {
        const promises = foreignKeys.map(foreignKey => this.createForeignKey(tableSchemaOrName as any, foreignKey));
        await Promise.all(promises);
    }

    /**
     * Drops a foreign key from the table.
     */
    async dropForeignKey(tableSchemaOrName: TableSchema|string, foreignKey: ForeignKeySchema): Promise<void> {
        const tableName = tableSchemaOrName instanceof TableSchema ? tableSchemaOrName.name : tableSchemaOrName;
        const sql = `ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${foreignKey.name}\``;

        const columnNames = foreignKey.columnNames.map(column => "`" + column + "`").join(", ");
        const referencedColumnNames = foreignKey.referencedColumnNames.map(column => "`" + column + "`").join(",");
        let revertSql = `ALTER TABLE \`${tableName}\` ADD CONSTRAINT \`${foreignKey.name}\` ` +
            `FOREIGN KEY (${columnNames}) ` +
            `REFERENCES \`${foreignKey.referencedTableName}\`(${referencedColumnNames})`;
        if (foreignKey.onDelete) revertSql += " ON DELETE " + foreignKey.onDelete;

        return this.schemaQuery(sql, revertSql);
    }

    /**
     * Drops a foreign keys from the table.
     */
    async dropForeignKeys(tableSchemaOrName: TableSchema|string, foreignKeys: ForeignKeySchema[]): Promise<void> {
        const promises = foreignKeys.map(foreignKey => this.dropForeignKey(tableSchemaOrName as any, foreignKey));
        await Promise.all(promises);
    }

    /**
     * Creates a new index.
     */
    async createIndex(table: TableSchema|string, index: IndexSchema): Promise<void> {
        const tableName = table instanceof TableSchema ? table.name : table;
        const columns = index.columnNames.map(columnName => "`" + columnName + "`").join(", ");
        const sql = `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX \`${index.name}\` ON \`${tableName}\`(${columns})`;
        const revertSql = `ALTER TABLE \`${tableName}\` DROP INDEX \`${index.name}\``;
        await this.schemaQuery(sql, revertSql);
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(table: TableSchema|string, index: IndexSchema|string): Promise<void> {
        const tableName = table instanceof TableSchema ? table.name : table;
        const indexName = index instanceof IndexSchema ? index.name : index;
        const sql = `ALTER TABLE \`${tableName}\` DROP INDEX \`${indexName}\``;

        if (index instanceof IndexSchema) {
            const columns = index.columnNames.map(columnName => "`" + columnName + "`").join(", ");
            const revertSql = `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX \`${index.name}\` ON \`${tableName}\`(${columns})`;
            await this.schemaQuery(sql, revertSql);

        } else {
            await this.query(sql);
        }
    }

    /**
     * Truncates table.
     */
    async truncate(table: TableSchema|string): Promise<void> {
        const tableName = table instanceof TableSchema ? table.name : table;
        await this.query(`TRUNCATE TABLE \`${tableName}\``);
    }

    /**
     * Removes all tables from the currently connected database.
     * Be careful using this method and avoid using it in production or migrations
     * (because it can clear all your database).
     */
    async clearDatabase(): Promise<void> {
        await this.startTransaction();
        try {
            const disableForeignKeysCheckQuery = `SET FOREIGN_KEY_CHECKS = 0;`;
            const dropTablesQuery = `SELECT concat('DROP TABLE IF EXISTS \`', table_name, '\`;') AS query FROM information_schema.tables WHERE table_schema = '${this.dbName}'`;
            const enableForeignKeysCheckQuery = `SET FOREIGN_KEY_CHECKS = 1;`;

            await this.query(disableForeignKeysCheckQuery);
            const dropQueries: ObjectLiteral[] = await this.query(dropTablesQuery);
            await Promise.all(dropQueries.map(query => this.query(query["query"])));
            await this.query(enableForeignKeysCheckQuery);

            await this.commitTransaction();

        } catch (error) {
            try { // we throw original error even if rollback thrown an error
                await this.rollbackTransaction();
            } catch (rollbackError) { }
            throw error;
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
     * Executes sql used special for schema build.
     */
    protected async schemaQuery(upQuery: string, downQuery: string): Promise<void> {

        // if sql-in-memory mode is enabled then simply store sql in memory and return
        if (this.sqlMemoryMode === true) {
            this.sqlsInMemory.push({ up: upQuery, down: downQuery });
            return Promise.resolve() as Promise<any>;
        }

        await this.query(upQuery);
    }

    /**
     * Database name shortcut.
     */
    protected get dbName(): string {
        return this.driver.options.database!;
    }

    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    protected parametrize(objectLiteral: ObjectLiteral): string[] {
        return Object.keys(objectLiteral).map(key => `\`${key}\`=?`);
    }

    /**
     * Builds a part of query to create/change a column.
     */
    protected buildCreateColumnSql(column: ColumnSchema, skipPrimary: boolean) {
        let c = "`" + column.name + "` " + column.getFullType(this.connection.driver);
        if (column.enum)
            c += "(" + column.enum.map(value => "'" + value + "'").join(", ") +  ")";
        if (column.isNullable !== true)
            c += " NOT NULL";
        if (column.isUnique === true)
            c += " UNIQUE";
        if (column.isGenerated && column.isPrimary && !skipPrimary)
            c += " PRIMARY KEY";
        if (column.isGenerated === true) // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " AUTO_INCREMENT";
        if (column.comment)
            c += " COMMENT '" + column.comment + "'";
        if (column.default !== undefined && column.default !== null)
            c += " DEFAULT " + column.default;

        return c;
    }

}