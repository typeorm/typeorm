import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TransactionAlreadyStartedError} from "../../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {TableColumn} from "../../schema-builder/schema/TableColumn";
import {Table} from "../../schema-builder/schema/Table";
import {TableForeignKey} from "../../schema-builder/schema/TableForeignKey";
import {TablePrimaryKey} from "../../schema-builder/schema/TablePrimaryKey";
import {TableIndex} from "../../schema-builder/schema/TableIndex";
import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {MysqlDriver} from "./MysqlDriver";
import {Connection} from "../../connection/Connection";
import {ReadStream} from "../../platform/PlatformTools";
import {EntityManager} from "../../entity-manager/EntityManager";
import {OrmUtils} from "../../util/OrmUtils";
import {InsertResult} from "../InsertResult";
import {QueryFailedError} from "../../error/QueryFailedError";

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

    /**
     * Mode in which query runner executes.
     * Used for replication.
     * If replication is not setup its value is ignored.
     */
    protected mode: "master"|"slave";

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: MysqlDriver, mode: "master"|"slave" = "master") {
        this.driver = driver;
        this.connection = driver.connection;
        this.mode = mode;
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

        if (this.driver.isReplicated) {

            this.databaseConnectionPromise = this.driver.obtainSlaveConnection().then(connection => {
                this.databaseConnection = connection;
                return this.databaseConnection;
            });

        } else { // master
            this.databaseConnectionPromise = this.driver.obtainMasterConnection().then(connection => {
                this.databaseConnection = connection;
                return this.databaseConnection;
            });
        }

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
            try {
                const databaseConnection = await this.connect();
                this.driver.connection.logger.logQuery(query, parameters, this);
                const queryStartTime = +new Date();
                databaseConnection.query(query, parameters, (err: any, result: any) => {

                    // log slow queries if maxQueryExecution time is set
                    const maxQueryExecutionTime = this.driver.connection.options.maxQueryExecutionTime;
                    const queryEndTime = +new Date();
                    const queryExecutionTime = queryEndTime - queryStartTime;
                    if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                        this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);

                    if (err) {
                        this.driver.connection.logger.logQueryError(err, query, parameters, this);
                        return fail(new QueryFailedError(query, parameters, err));
                    }

                    ok(result);
                });

            } catch (err) {
                fail(err);
            }
        });
    }

    /**
     * Returns raw data stream.
     */
    stream(query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        return new Promise(async (ok, fail) => {
            try {
                const databaseConnection = await this.connect();
                this.driver.connection.logger.logQuery(query, parameters, this);
                const stream = databaseConnection.query(query, parameters);
                if (onEnd) stream.on("end", onEnd);
                if (onError) stream.on("error", onError);
                ok(stream);

            } catch (err) {
                fail(err);
            }
        });
    }

    /**
     * Insert a new row with given values into the given table.
     * Returns value of the generated column if given and generate column exist in the table.
     */
    async insert(tablePath: string, keyValues: ObjectLiteral): Promise<InsertResult> {
        const keys = Object.keys(keyValues);
        const columns = keys.map(key => `\`${key}\``).join(", ");
        const values = keys.map(key => "?").join(",");
        const parameters = keys.map(key => keyValues[key]);
        const generatedColumns = this.connection.hasMetadata(tablePath) ? this.connection.getMetadata(tablePath).generatedColumns : [];
        const sql = `INSERT INTO \`${this.escapeTablePath(tablePath)}\`(${columns}) VALUES (${values})`;
        const result = await this.query(sql, parameters);

        const generatedMap = generatedColumns.reduce((map, generatedColumn) => {
            const value = generatedColumn.isPrimary && result.insertId ? result.insertId : keyValues[generatedColumn.databaseName];
            if (!value) return map;
            return OrmUtils.mergeDeep(map, generatedColumn.createValueMap(value));
        }, {} as ObjectLiteral);

        return {
            result: result,
            generatedMap: Object.keys(generatedMap).length > 0 ? generatedMap : undefined
        };
    }

    /**
     * Updates rows that match given conditions in the given table.
     */
    async update(tablePath: string, valuesMap: ObjectLiteral, conditions: ObjectLiteral): Promise<void> {
        const updateValues = this.parametrize(valuesMap).join(", ");
        const conditionString = this.parametrize(conditions).join(" AND ");
        const sql = `UPDATE \`${this.escapeTablePath(tablePath)}\` SET ${updateValues} ${conditionString ? (" WHERE " + conditionString) : ""}`;
        const conditionParams = Object.keys(conditions).map(key => conditions[key]);
        const updateParams = Object.keys(valuesMap).map(key => valuesMap[key]);
        const allParameters = updateParams.concat(conditionParams);
        await this.query(sql, allParameters);
    }

    /**
     * Deletes from the given table by a given conditions.
     */
    async delete(tablePath: string, conditions: ObjectLiteral|string, maybeParameters?: any[]): Promise<void> {
        const conditionString = typeof conditions === "string" ? conditions : this.parametrize(conditions).join(" AND ");
        const parameters = conditions instanceof Object ? Object.keys(conditions).map(key => (conditions as ObjectLiteral)[key]) : maybeParameters;

        const sql = `DELETE FROM \`${this.escapeTablePath(tablePath)}\` WHERE ${conditionString}`;
        await this.query(sql, parameters);
    }

    /**
     * Inserts rows into the closure table.
     */
    async insertIntoClosureTable(tablePath: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number> {
        // todo: escape column names as well
        if (hasLevel) {
            await this.query(
                `INSERT INTO \`${this.escapeTablePath(tablePath)}\`(\`ancestor\`, \`descendant\`, \`level\`) ` +
                `SELECT \`ancestor\`, ${newEntityId}, \`level\` + 1 FROM \`${this.escapeTablePath(tablePath)}\` WHERE \`descendant\` = ${parentId} ` +
                `UNION ALL SELECT ${newEntityId}, ${newEntityId}, 1`
            );
        } else {
            await this.query(
                `INSERT INTO \`${this.escapeTablePath(tablePath)}\`(\`ancestor\`, \`descendant\`) ` +
                `SELECT \`ancestor\`, ${newEntityId} FROM \`${this.escapeTablePath(tablePath)}\` WHERE \`descendant\` = ${parentId} ` +
                `UNION ALL SELECT ${newEntityId}, ${newEntityId}`
            );
        }
        if (hasLevel) {
            const results: ObjectLiteral[] = await this.query(`SELECT MAX(\`level\`) as \`level\` FROM \`${this.escapeTablePath(tablePath)}\` WHERE \`descendant\` = ${parentId}`);
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
    async getTables(tablePaths: string[]): Promise<Table[]> {
        if (this.sqlMemoryMode)
            throw new Error(`Loading table is not supported in sql memory mode`);

        // if no tables given then no need to proceed
        if (!tablePaths || !tablePaths.length)
            return [];

        const tableNames = tablePaths.map(tablePath => {
            return tablePath.indexOf(".") === -1 ? tablePath : tablePath.split(".")[1];
        });
        const dbNames = tablePaths
            .filter(tablePath => tablePath.indexOf(".") !== -1)
            .map(tablePath => tablePath.split(".")[0]);
        if (this.driver.database && !dbNames.find(dbName => dbName === this.driver.database))
            dbNames.push(this.driver.database);

        // load tables, columns, indices and foreign keys
        const databaseNamesString = dbNames.map(dbName => `'${dbName}'`).join(", ");
        const tableNamesString = tableNames.map(tableName => `'${tableName}'`).join(", ");
        const tablesSql      = `SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA IN (${databaseNamesString}) AND TABLE_NAME IN (${tableNamesString})`;
        const columnsSql     = `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA IN (${databaseNamesString})`;
        const indicesSql     = `SELECT * FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA IN (${databaseNamesString}) AND INDEX_NAME != 'PRIMARY' ORDER BY SEQ_IN_INDEX`;
        const foreignKeysSql = `SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA IN (${databaseNamesString}) AND REFERENCED_COLUMN_NAME IS NOT NULL`;
        const [dbTables, dbColumns, dbIndices, dbForeignKeys]: ObjectLiteral[][] = await Promise.all([
            this.query(tablesSql),
            this.query(columnsSql),
            this.query(indicesSql),
            this.query(foreignKeysSql)
        ]);

        // if tables were not found in the db, no need to proceed
        if (!dbTables.length)
            return [];

        // create tables for loaded tables
        return Promise.all(dbTables.map(async dbTable => {
            const table = new Table(dbTable["TABLE_NAME"]);
            table.database = dbTable["TABLE_SCHEMA"];
            const primaryKeys: ObjectLiteral[] = await this.query(`SHOW INDEX FROM \`${dbTable["TABLE_SCHEMA"]}\`.\`${dbTable["TABLE_NAME"]}\` WHERE Key_name = 'PRIMARY'`);

            // create columns from the loaded columns
            table.columns = dbColumns
                .filter(dbColumn => dbColumn["TABLE_NAME"] === table.name)
                .map(dbColumn => {
                    const tableColumn = new TableColumn();
                    tableColumn.name = dbColumn["COLUMN_NAME"];

                    const columnType = dbColumn["COLUMN_TYPE"].toLowerCase();
                    const endIndex = columnType.indexOf("(");
                    tableColumn.type = endIndex !== -1 ? columnType.substring(0, endIndex) : columnType;

                    tableColumn.default = dbColumn["COLUMN_DEFAULT"] !== null && dbColumn["COLUMN_DEFAULT"] !== undefined ? dbColumn["COLUMN_DEFAULT"] : undefined;
                    tableColumn.isNullable = dbColumn["IS_NULLABLE"] === "YES";
                    tableColumn.isPrimary = dbColumn["COLUMN_KEY"].indexOf("PRI") !== -1;
                    tableColumn.isUnique = dbColumn["COLUMN_KEY"].indexOf("UNI") !== -1;
                    tableColumn.isGenerated = dbColumn["EXTRA"].indexOf("auto_increment") !== -1;
                    tableColumn.comment = dbColumn["COLUMN_COMMENT"];
                    tableColumn.precision = dbColumn["NUMERIC_PRECISION"];
                    tableColumn.scale = dbColumn["NUMERIC_SCALE"];
                    tableColumn.charset = dbColumn["CHARACTER_SET_NAME"];
                    tableColumn.collation = dbColumn["COLLATION_NAME"];

                    if (tableColumn.type === "int" || tableColumn.type === "tinyint"
                        ||  tableColumn.type === "smallint" || tableColumn.type === "mediumint"
                        || tableColumn.type === "bigint" || tableColumn.type === "year") {

                        const length = columnType.substring(columnType.indexOf("(") + 1, columnType.indexOf(")"));
                        tableColumn.length = length ? length.toString() : "";

                    } else {
                        tableColumn.length = dbColumn["CHARACTER_MAXIMUM_LENGTH"] ? dbColumn["CHARACTER_MAXIMUM_LENGTH"].toString() : "";
                    }

                    if (tableColumn.type === "enum") {
                        const colType = dbColumn["COLUMN_TYPE"];
                        const items = colType.substring(colType.indexOf("(") + 1, colType.indexOf(")")).split(",");
                        tableColumn.enum = (items as string[]).map(item => {
                            return item.substring(1, item.length - 1);
                        });
                    }

                    if (tableColumn.type === "datetime" || tableColumn.type === "time" || tableColumn.type === "timestamp") {
                        tableColumn.precision = dbColumn["DATETIME_PRECISION"];
                    }

                    return tableColumn;
                });

            // create primary keys
            table.primaryKeys = primaryKeys.map(primaryKey => {
                return new TablePrimaryKey(primaryKey["Key_name"], primaryKey["Column_name"]);
            });

            // create foreign key schemas from the loaded indices
            table.foreignKeys = dbForeignKeys
                .filter(dbForeignKey => dbForeignKey["TABLE_NAME"] === table.name)
                .map(dbForeignKey => new TableForeignKey(dbForeignKey["CONSTRAINT_NAME"], [], [], "", "")); // todo: fix missing params

            // create index schemas from the loaded indices
            table.indices = dbIndices
                .filter(dbIndex => {
                    return dbIndex["TABLE_NAME"] === table.name &&
                        (!table.foreignKeys.find(foreignKey => foreignKey.name === dbIndex["INDEX_NAME"])) &&
                        (!table.primaryKeys.find(primaryKey => primaryKey.name === dbIndex["INDEX_NAME"]));
                })
                .map(dbIndex => dbIndex["INDEX_NAME"])
                .filter((value, index, self) => self.indexOf(value) === index) // unqiue
                .map(dbIndexName => {
                    const currentDbIndices = dbIndices.filter(dbIndex => dbIndex["TABLE_NAME"] === table.name && dbIndex["INDEX_NAME"] === dbIndexName);
                    const columnNames = currentDbIndices.map(dbIndex => dbIndex["COLUMN_NAME"]);

                    // find a special index - unique index and
                    if (currentDbIndices.length === 1 && currentDbIndices[0]["NON_UNIQUE"] === 0) {
                        const column = table.columns.find(column => column.name === currentDbIndices[0]["INDEX_NAME"] && column.name === currentDbIndices[0]["COLUMN_NAME"]);
                        if (column) {
                            column.isUnique = true;
                            return;
                        }
                    }

                    return new TableIndex(dbTable["TABLE_NAME"], dbIndexName, columnNames, currentDbIndices[0]["NON_UNIQUE"] === 0);
                })
                .filter(index => !!index) as TableIndex[]; // remove empty returns

            return table;
        }));
    }

    /**
     * Checks if database with the given name exist.
     */
    async hasDatabase(database: string): Promise<boolean> {
        const result = await this.query(`SELECT * FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${database}'`);
        return result.length ? true : false;
    }

    /**
     * Checks if table with the given name exist in the database.
     */
    async hasTable(tableOrPath: Table|string): Promise<boolean> {
        const parsedTablePath = this.parseTablePath(tableOrPath);
        const sql = `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '${parsedTablePath.database}' AND TABLE_NAME = '${parsedTablePath.tableName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Checks if column with the given name exist in the given table.
     */
    async hasColumn(tableOrPath: Table|string, column: TableColumn|string): Promise<boolean> {
        const parsedTablePath = this.parseTablePath(tableOrPath);
        const columnName = column instanceof TableColumn ? column.name : column;
        const sql = `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '${parsedTablePath.database}' AND TABLE_NAME = '${parsedTablePath.tableName}' AND COLUMN_NAME = '${columnName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a database if it's not created.
     */
    createDatabase(database: string): Promise<void[]> {
        return this.query(`CREATE DATABASE IF NOT EXISTS ${database}`);
    }

    /**
     * Creates a schema if it's not created.
     */
    createSchema(schemas: string[]): Promise<void[]> {
        return Promise.resolve([]);
    }

    /**
     * Creates a new table from the given table and column inside it.
     */
    async createTable(table: Table): Promise<void> {
        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(column, false)).join(", ");
        let sql = `CREATE TABLE \`${this.escapeTablePath(table)}\` (${columnDefinitions}`;
        const primaryKeyColumns = table.columns.filter(column => column.isPrimary && !column.isGenerated);
        if (primaryKeyColumns.length > 0)
            sql += `, PRIMARY KEY(${primaryKeyColumns.map(column => `\`${column.name}\``).join(", ")})`;
        sql += `) ENGINE=${table.engine || "InnoDB"}`;

        const revertSql = `DROP TABLE \`${this.escapeTablePath(table)}\``;
        return this.schemaQuery(sql, revertSql);
    }

    /**
     * Drop the table.
     */
    async dropTable(tableOrPath: Table|string): Promise<void> {
        const sql = `DROP TABLE \`${this.escapeTablePath(tableOrPath)}\``;
        return this.query(sql);
    }

    /**
     * Creates a new column from the column in the table.
     */
    async addColumn(tableOrPath: Table|string, column: TableColumn): Promise<void> {
        const sql = `ALTER TABLE \`${this.escapeTablePath(tableOrPath)}\` ADD ${this.buildCreateColumnSql(column, false)}`;
        const revertSql = `ALTER TABLE \`${this.escapeTablePath(tableOrPath)}\` DROP \`${column.name}\``;
        return this.schemaQuery(sql, revertSql);
    }

    /**
     * Creates a new columns from the column in the table.
     */
    async addColumns(tableOrName: Table|string, columns: TableColumn[]): Promise<void> {
        const queries = columns.map(column => this.addColumn(tableOrName as any, column));
        await Promise.all(queries);
    }

    /**
     * Renames column in the given table.
     */
    async renameColumn(tableOrName: Table|string, oldTableColumnOrName: TableColumn|string, newTableColumnOrName: TableColumn|string): Promise<void> {

        let table: Table|undefined = undefined;
        if (tableOrName instanceof Table) {
            table = tableOrName;
        } else {
            table = await this.getTable(tableOrName); // todo: throw exception, this wont work because of sql memory enabled. remove support by table name
            if (!table)
                throw new Error(`Table ${tableOrName} was not found.`);
        }

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

        if (newColumn.isUnique === false && oldColumn.isUnique === true)
            await this.query(`ALTER TABLE \`${this.escapeTablePath(table)}\` DROP INDEX \`${oldColumn.name}\``); // todo: add revert code

        const sql = `ALTER TABLE \`${this.escapeTablePath(table)}\` CHANGE \`${oldColumn.name}\` ${this.buildCreateColumnSql(newColumn, oldColumn.isPrimary)}`;
        const revertSql = `ALTER TABLE \`${this.escapeTablePath(table)}\` CHANGE \`${oldColumn.name}\` ${this.buildCreateColumnSql(oldColumn, oldColumn.isPrimary)}`;
        return this.schemaQuery(sql, revertSql);
    }

    /**
     * Changes a column in the table.
     */
    async changeColumns(table: Table, changedColumns: { newColumn: TableColumn, oldColumn: TableColumn }[]): Promise<void> {
        const updatePromises = changedColumns.map(async changedColumn => {
            return this.changeColumn(table, changedColumn.oldColumn, changedColumn.newColumn);
        });

        await Promise.all(updatePromises);
    }

    /**
     * Drops column in the table.
     */
    async dropColumn(table: Table, column: TableColumn): Promise<void> {
        const sql = `ALTER TABLE \`${this.escapeTablePath(table)}\` DROP \`${column.name}\``;
        const revertSql = `ALTER TABLE \`${this.escapeTablePath(table)}\` ADD ${this.buildCreateColumnSql(column, false)}`;
        return this.schemaQuery(sql, revertSql);
    }

    /**
     * Drops the columns in the table.
     */
    async dropColumns(table: Table, columns: TableColumn[]): Promise<void> {
        const dropPromises = columns.map(column => this.dropColumn(table, column));
        await Promise.all(dropPromises);
    }

    /**
     * Updates table's primary keys.
     */
    async updatePrimaryKeys(table: Table): Promise<void> {
        if (!table.hasGeneratedColumn)
            await this.query(`ALTER TABLE \`${this.escapeTablePath(table)}\` DROP PRIMARY KEY`);

        const primaryColumnNames = table.columns
            .filter(column => column.isPrimary && !column.isGenerated)
            .map(column => "`" + column.name + "`");
        if (primaryColumnNames.length > 0) {
            const sql = `ALTER TABLE \`${this.escapeTablePath(table)}\` ADD PRIMARY KEY (${primaryColumnNames.join(", ")})`;
            const revertSql = `ALTER TABLE \`${this.escapeTablePath(table)}\` DROP PRIMARY KEY`;
            return this.schemaQuery(sql, revertSql);
        }
    }

    /**
     * Creates a new foreign key.
     */
    async createForeignKey(tableOrPath: Table|string, foreignKey: TableForeignKey): Promise<void> {
        const columnNames = foreignKey.columnNames.map(column => "`" + column + "`").join(", ");
        const referencedColumnNames = foreignKey.referencedColumnNames.map(column => "`" + column + "`").join(",");
        let sql = `ALTER TABLE \`${this.escapeTablePath(tableOrPath)}\` ADD CONSTRAINT \`${foreignKey.name}\` ` +
            `FOREIGN KEY (${columnNames}) ` +
            `REFERENCES \`${foreignKey.referencedTableName}\`(${referencedColumnNames})`;
        if (foreignKey.onDelete) sql += " ON DELETE " + foreignKey.onDelete;
        const revertSql = `ALTER TABLE \`${this.escapeTablePath(tableOrPath)}\` DROP FOREIGN KEY \`${foreignKey.name}\``;
        return this.schemaQuery(sql, revertSql);
    }

    /**
     * Creates a new foreign keys.
     */
    async createForeignKeys(tableOrName: Table|string, foreignKeys: TableForeignKey[]): Promise<void> {
        const promises = foreignKeys.map(foreignKey => this.createForeignKey(tableOrName as any, foreignKey));
        await Promise.all(promises);
    }

    /**
     * Drops a foreign key from the table.
     */
    async dropForeignKey(tableOrPath: Table|string, foreignKey: TableForeignKey): Promise<void> {
        const sql = `ALTER TABLE \`${this.escapeTablePath(tableOrPath)}\` DROP FOREIGN KEY \`${foreignKey.name}\``;

        const columnNames = foreignKey.columnNames.map(column => "`" + column + "`").join(", ");
        const referencedColumnNames = foreignKey.referencedColumnNames.map(column => "`" + column + "`").join(",");
        let revertSql = `ALTER TABLE \`${this.escapeTablePath(tableOrPath)}\` ADD CONSTRAINT \`${foreignKey.name}\` ` +
            `FOREIGN KEY (${columnNames}) ` +
            `REFERENCES \`${foreignKey.referencedTableName}\`(${referencedColumnNames})`;
        if (foreignKey.onDelete) revertSql += " ON DELETE " + foreignKey.onDelete;

        return this.schemaQuery(sql, revertSql);
    }

    /**
     * Drops a foreign keys from the table.
     */
    async dropForeignKeys(tableOrName: Table|string, foreignKeys: TableForeignKey[]): Promise<void> {
        const promises = foreignKeys.map(foreignKey => this.dropForeignKey(tableOrName as any, foreignKey));
        await Promise.all(promises);
    }

    /**
     * Creates a new index.
     */
    async createIndex(tableOrPath: Table|string, index: TableIndex): Promise<void> {
        const columns = index.columnNames.map(columnName => "`" + columnName + "`").join(", ");
        const sql = `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX \`${index.name}\` ON \`${this.escapeTablePath(tableOrPath)}\`(${columns})`;
        const revertSql = `ALTER TABLE \`${this.escapeTablePath(tableOrPath)}\` DROP INDEX \`${index.name}\``;
        await this.schemaQuery(sql, revertSql);
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(tableOrPath: Table|string, index: TableIndex|string): Promise<void> {
        const indexName = index instanceof TableIndex ? index.name : index;
        const sql = `ALTER TABLE \`${this.escapeTablePath(tableOrPath)}\` DROP INDEX \`${indexName}\``;

        if (index instanceof TableIndex) {
            const columns = index.columnNames.map(columnName => "`" + columnName + "`").join(", ");
            const revertSql = `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX \`${index.name}\` ON \`${this.escapeTablePath(tableOrPath)}\`(${columns})`;
            await this.schemaQuery(sql, revertSql);

        } else {
            await this.query(sql);
        }
    }

    /**
     * Truncates table.
     */
    async truncate(tableOrPath: Table|string): Promise<void> {
        await this.query(`TRUNCATE TABLE \`${this.escapeTablePath(tableOrPath)}\``);
    }

    /**
     * Removes all tables from the currently connected database.
     * Be careful using this method and avoid using it in production or migrations
     * (because it can clear all your database).
     */
    async clearDatabase(tables?: string[], database?: string): Promise<void> {
        await this.startTransaction();
        try {
            const disableForeignKeysCheckQuery = `SET FOREIGN_KEY_CHECKS = 0;`;
            const dropTablesQuery = `SELECT concat('DROP TABLE IF EXISTS \`', table_schema, '\`.\`', table_name, '\`;') AS query FROM information_schema.tables WHERE table_schema = '${database}'`;
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

    protected parseTablePath(tableOrPath: Table|string) {
        if (tableOrPath instanceof Table) {
            return {
                database: tableOrPath.database || this.driver.database,
                tableName: tableOrPath.name
            };
        } else {
            return {
                database: tableOrPath.indexOf(".") !== -1 ? tableOrPath.split(".")[0] : this.driver.database,
                tableName: tableOrPath.indexOf(".") !== -1 ? tableOrPath.split(".")[1] : tableOrPath
            };
        }
    }

    protected escapeTablePath(tableOrPath: Table|string): string {
        if (tableOrPath instanceof Table)
            return tableOrPath.database ? `${tableOrPath.database}\`.\`${tableOrPath.name}` : `${tableOrPath.name}`;

        return tableOrPath.split(".").map(i => `${i}`).join("\`.\`");
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
    protected buildCreateColumnSql(column: TableColumn, skipPrimary: boolean) {
        let c = "`" + column.name + "` " + this.connection.driver.createFullType(column);
        if (column.enum)
            c += "(" + column.enum.map(value => "'" + value + "'").join(", ") +  ")";
        if (column.charset)
            c += " CHARACTER SET " + column.charset;
        if (column.collation)
            c += " COLLATE " + column.collation;
        if (column.isNullable !== true)
            c += " NOT NULL";
        if (column.isUnique === true)
            c += " UNIQUE";
        if (column.isGenerated && column.isPrimary && !skipPrimary)
            c += " PRIMARY KEY";
        if (column.isGenerated === true && column.generationStrategy === "increment") // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " AUTO_INCREMENT";
        if (column.comment)
            c += " COMMENT '" + column.comment + "'";
        if (column.default !== undefined && column.default !== null)
            c += " DEFAULT " + column.default;

        return c;
    }

}