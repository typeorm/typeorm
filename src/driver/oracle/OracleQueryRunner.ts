import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TransactionAlreadyStartedError} from "../../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {TableColumn} from "../../schema-builder/table/TableColumn";
import {Table} from "../../schema-builder/table/Table";
import {TableForeignKey} from "../../schema-builder/table/TableForeignKey";
import {TableIndex} from "../../schema-builder/table/TableIndex";
import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {OracleDriver} from "./OracleDriver";
import {Connection} from "../../connection/Connection";
import {ReadStream} from "../../platform/PlatformTools";
import {EntityManager} from "../../entity-manager/EntityManager";
import {QueryFailedError} from "../../error/QueryFailedError";
import {SqlInMemory} from "../SqlInMemory";
import {TableIndexOptions} from "../../schema-builder/options/TableIndexOptions";
import {TableForeignKeyOptions} from "../../schema-builder/options/TableForeignKeyOptions";
import {PromiseUtils} from "../../util/PromiseUtils";
import {TableUnique} from "../../schema-builder/table/TableUnique";
import {Broadcaster} from "../../subscriber/Broadcaster";

/**
 * Runs queries on a single oracle database connection.
 *
 * todo: this driver is not 100% finished yet, need to fix all issues that are left
 */
export class OracleQueryRunner implements QueryRunner {

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Database driver used by connection.
     */
    driver: OracleDriver;

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

    /**
     * All synchronized tables in the database.
     */
    loadedTables: Table[];

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Real database connection from a connection pool used to perform queries.
     */
    protected databaseConnection: any;

    /**
     * Promise used to obtain a database connection for a first time.
     */
    protected databaseConnectionPromise: Promise<any>;

    /**
     * Indicates if special query runner mode in which sql queries won't be executed is enabled.
     */
    protected sqlMemoryMode: boolean = false;

    /**
     * Sql-s stored if "sql in memory" mode is enabled.
     */
    protected sqlInMemory: SqlInMemory;

    /**
     * Mode in which query runner executes.
     * Used for replication.
     * If replication is not setup its value is ignored.
     */
    protected mode: "master"|"slave";

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: OracleDriver, mode: "master"|"slave" = "master") {
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster(this);
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

        if (this.mode === "slave" && this.driver.isReplicated) {
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
        return new Promise<void>((ok, fail) => {
            this.isReleased = true;
            if (this.databaseConnection) {
                this.databaseConnection.close((err: any) => {
                    if (err)
                        return fail(err);

                    ok();
                });
            }
        });
    }

    /**
     * Starts transaction.
     */
    async startTransaction(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        if (this.isTransactionActive)
            throw new TransactionAlreadyStartedError();

        // await this.query("START TRANSACTION");
        this.isTransactionActive = true;
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
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        return new Promise(async (ok, fail) => {
            try {
                this.driver.connection.logger.logQuery(query, parameters, this);
                const queryStartTime = +new Date();

                const handler = (err: any, result: any) => {

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

                    ok(result.rows || result.outBinds);
                };
                const executionOptions = {
                    autoCommit: this.isTransactionActive ? false : true
                };

                const databaseConnection = await this.connect();
                databaseConnection.execute(query, parameters || {}, executionOptions, handler);

            } catch (err) {
                fail(err);
            }
        });
    }

    /**
     * Returns raw data stream.
     */
    stream(query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream> {
        throw new Error(`Stream is not supported by Oracle driver.`);
    }

    /**
     * Insert a new row with given values into the given table.
     * Returns value of the generated column if given and generate column exist in the table.
     *
     * todo: reimplement, use QueryBuilder

    async insert(tableName: string, keyValues: ObjectLiteral): Promise<any> {
        // todo: fix generated columns
        let generatedColumn: ColumnMetadata|undefined;
        const keys = Object.keys(keyValues);
        const columns = keys.map(key => `"${key}"`).join(", ");
        const values = keys.map(key => ":" + key).join(", ");
        const parameters = keys.map(key => keyValues[key]);
        const generatedColumns = this.connection.hasMetadata(tableName) ? this.connection.getMetadata(tableName).generatedColumns : [];
        if (generatedColumns.length > 0)
            generatedColumn = generatedColumns.find(column => column.isPrimary && column.isGenerated);

        const insertSql = columns.length > 0
            ? `INSERT INTO "${tableName}" (${columns}) VALUES (${values})`
            : `INSERT INTO "${tableName}" DEFAULT VALUES`;
        if (generatedColumn) {
            const sql2 = `declare lastId number; begin ${insertSql} returning "${generatedColumn.databaseName}" into lastId; dbms_output.enable; dbms_output.put_line(lastId); dbms_output.get_line(:ln, :st); end;`;
            const saveResult = await this.query(sql2, parameters.concat([
                { dir: this.driver.oracle.BIND_OUT, type: this.driver.oracle.STRING, maxSize: 32767 },
                { dir: this.driver.oracle.BIND_OUT, type: this.driver.oracle.NUMBER }
            ]));
            return parseInt(saveResult[0]);
        } else {
            return this.query(insertSql, parameters);
        }
    } */

    /**
     * Updates rows that match given conditions in the given table.
     *
     * todo: reimplement, use QueryBuilder

    async update(tableName: string, valuesMap: ObjectLiteral, conditions: ObjectLiteral): Promise<any> {
        const updateValues = this.parametrize(valuesMap).join(", ");
        const conditionString = this.parametrize(conditions).join(" AND ");
        const sql = `UPDATE "${tableName}" SET ${updateValues} ${conditionString ? (" WHERE " + conditionString) : ""}`;
        const conditionParams = Object.keys(conditions).map(key => conditions[key]);
        const updateParams = Object.keys(valuesMap).map(key => valuesMap[key]);
        const allParameters = updateParams.concat(conditionParams);
        await this.query(sql, allParameters);
    }*/

    /**
     * Deletes from the given table by a given conditions.
     *
     * todo: reimplement, use QueryBuilder

    async delete(tableName: string, conditions: ObjectLiteral|ObjectLiteral[]|string, maybeParameters?: any[]): Promise<any> {
        const conditionString = typeof conditions === "string" ? conditions : this.parametrize(conditions).join(" AND ");
        const parameters = conditions instanceof Object ? Object.keys(conditions).map(key => (conditions as ObjectLiteral)[key]) : maybeParameters;

        const sql = `DELETE FROM "${tableName}" WHERE ${conditionString}`;
        await this.query(sql, parameters);
    }*/

    /**
     * Inserts rows into the closure table.
     */
    async insertIntoClosureTable(tableName: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number> {
        let sql = "";
        if (hasLevel) {
            sql =   `INSERT INTO "${tableName}"("ancestor", "descendant", "level") ` +
                    `SELECT "ancestor", ${newEntityId}, "level" + 1 FROM "${tableName}" WHERE "descendant" = ${parentId} ` +
                    `UNION ALL SELECT ${newEntityId}, ${newEntityId}, 1`;
        } else {
            sql =   `INSERT INTO "${tableName}" ("ancestor", "descendant") ` +
                    `SELECT "ancestor", ${newEntityId} FROM "${tableName}" WHERE "descendant" = ${parentId} ` +
                    `UNION ALL SELECT ${newEntityId}, ${newEntityId}`;
        }
        await this.query(sql);
        const results: ObjectLiteral[] = await this.query(`SELECT MAX("level") as "level" FROM "${tableName}" WHERE "descendant" = ${parentId}`);
        return results && results[0] && results[0]["level"] ? parseInt(results[0]["level"]) + 1 : 1;
    }

    /**
     * Returns all available database names including system databases.
     */
    async getDatabases(): Promise<string[]> {
        return Promise.resolve([]);
    }

    /**
     * Returns all available schema names including system schemas.
     * If database parameter specified, returns schemas of that database.
     */
    async getSchemas(database?: string): Promise<string[]> {
        return Promise.resolve([]);
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

        // load tables, columns, indices and foreign keys
        const tableNamesString = tableNames.map(name => "'" + name + "'").join(", ");
        const tablesSql      = `SELECT TABLE_NAME FROM user_tables WHERE TABLE_NAME IN (${tableNamesString})`;
        const columnsSql     = `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, DATA_LENGTH, DATA_PRECISION, DATA_SCALE, NULLABLE, IDENTITY_COLUMN FROM all_tab_cols WHERE TABLE_NAME IN (${tableNamesString})`;
        const indicesSql     = `SELECT ind.INDEX_NAME, ind.TABLE_NAME, ind.UNIQUENESS, LISTAGG(cols.COLUMN_NAME, ',') WITHIN GROUP (ORDER BY cols.COLUMN_NAME) AS COLUMN_NAMES
                                FROM USER_INDEXES ind, USER_IND_COLUMNS cols 
                                WHERE ind.INDEX_NAME = cols.INDEX_NAME AND ind.TABLE_NAME IN (${tableNamesString})
                                GROUP BY ind.INDEX_NAME, ind.TABLE_NAME, ind.UNIQUENESS`;
        // const foreignKeysSql = `SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = '${this.dbName}' AND REFERENCED_COLUMN_NAME IS NOT NULL`;
        // const uniqueKeysSql  = `SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = '${this.dbName}' AND CONSTRAINT_TYPE = 'UNIQUE'`;
        const constraintsSql = `SELECT cols.table_name, cols.column_name, cols.position, cons.constraint_type, cons.constraint_name
FROM all_constraints cons, all_cons_columns cols WHERE cols.table_name IN (${tableNamesString}) 
AND cons.constraint_name = cols.constraint_name AND cons.owner = cols.owner ORDER BY cols.table_name, cols.position`;
        const [dbTables, dbColumns, dbIndices, /*dbForeignKeys, dbUniqueKeys, */constraints]: ObjectLiteral[][] = await Promise.all([
            this.query(tablesSql),
            this.query(columnsSql),
            this.query(indicesSql),
            // this.query(foreignKeysSql),
            // this.query(uniqueKeysSql),
            this.query(constraintsSql),
        ]);

        // if tables were not found in the db, no need to proceed
        if (!dbTables.length)
            return [];

        // create tables for loaded tables
        return dbTables.map(dbTable => {
            const table = new Table();
            table.name = this.driver.buildTableName(dbTable["TABLE_NAME"], dbTable["TABLE_SCHEMA"], dbTable["TABLE_CATALOG"]);

            // create columns from the loaded columns
            table.columns = dbColumns
                .filter(dbColumn => dbColumn["TABLE_NAME"] === table.name)
                .map(dbColumn => {
                    const isPrimary = !!constraints
                        .find(constraint => {
                            return  constraint["TABLE_NAME"] === table.name &&
                                    constraint["CONSTRAINT_TYPE"] === "P" &&
                                    constraint["COLUMN_NAME"] === dbColumn["COLUMN_NAME"];
                        });
                    // TODO fix
                    let columnType = dbColumn["DATA_TYPE"].toLowerCase();
                    if (dbColumn["DATA_TYPE"].toLowerCase() === "varchar2" && dbColumn["DATA_LENGTH"] !== null) {
                        columnType += "(" + dbColumn["DATA_LENGTH"] + ")";
                    } else if (dbColumn["DATA_PRECISION"] !== null && dbColumn["DATA_SCALE"] !== null) {
                        columnType += "(" + dbColumn["DATA_PRECISION"] + "," + dbColumn["DATA_SCALE"] + ")";
                    } else if (dbColumn["DATA_SCALE"] !== null) {
                        columnType += "(0," + dbColumn["DATA_SCALE"] + ")";
                    } else if (dbColumn["DATA_PRECISION"] !== null) {
                        columnType += "(" + dbColumn["DATA_PRECISION"] + ")";
                    }

                    const tableColumn = new TableColumn();
                    tableColumn.name = dbColumn["COLUMN_NAME"];
                    tableColumn.type = columnType;
                    tableColumn.default = dbColumn["COLUMN_DEFAULT"] !== null && dbColumn["COLUMN_DEFAULT"] !== undefined ? dbColumn["COLUMN_DEFAULT"] : undefined;
                    tableColumn.isNullable = dbColumn["NULLABLE"] !== "N";
                    tableColumn.isPrimary = isPrimary;
                    tableColumn.isGenerated = dbColumn["IDENTITY_COLUMN"] === "YES"; // todo
                    tableColumn.comment = ""; // todo
                    return tableColumn;
                });

            // create foreign key schemas from the loaded indices
            table.foreignKeys = constraints
                .filter(constraint => constraint["TABLE_NAME"] === table.name && constraint["CONSTRAINT_TYPE"] === "R")
                .map(dbForeignKey => {
                    return new TableForeignKey(<TableForeignKeyOptions>{
                        table: table,
                        name: dbForeignKey["CONSTRAINT_NAME"],
                        columnNames: [],
                        referencedTableName: "",
                        referencedColumnNames: []
                    });
                }); // todo: fix missing params

            // create index schemas from the loaded indices
            table.indices = dbIndices
                .filter(dbIndex => {
                    return  dbIndex["TABLE_NAME"] === table.name &&
                        (!table.foreignKeys.find(foreignKey => foreignKey.name === dbIndex["INDEX_NAME"]));
                        // && (!table.primaryKey === dbIndex["INDEX_NAME"]); TODO: check and fix
                })
                .map(dbIndex => {
                    return new TableIndex(<TableIndexOptions>{
                        table: table,
                        name: dbIndex["INDEX_NAME"],
                        columnNames: dbIndex["COLUMN_NAMES"],
                        isUnique: (dbIndex["COLUMN_NAMES"] === "UNIQUE")
                    });
                });

            return table;
        });
    }

    /**
     * Checks if database with the given name exist.
     */
    async hasDatabase(database: string): Promise<boolean> {
        return Promise.resolve(false);
    }

    /**
     * Checks if schema with the given name exist.
     */
    async hasSchema(schema: string): Promise<boolean> {
        return Promise.resolve(false);
    }

    /**
     * Checks if table with the given name exist in the database.
     */
    async hasTable(tableName: string): Promise<boolean> {
        const sql = `SELECT TABLE_NAME FROM user_tables WHERE TABLE_NAME = '${tableName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a new database.
     */
    async createDatabase(database: string, ifNotExist?: boolean): Promise<void> {
        await this.query(`CREATE DATABASE IF NOT EXISTS ${database}`);
    }

    /**
     * Drops database.
     */
    async dropDatabase(database: string, ifExist?: boolean): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Creates a new table schema.
     */
    async createSchema(schemas: string, ifNotExist?: boolean): Promise<void> {
        throw new Error(`Schema create queries are not supported by Oracle driver.`);
    }

    /**
     * Drops table schema.
     */
    async dropSchema(schemaPath: string, ifExist?: boolean): Promise<void> {
        throw new Error(`Schema drop queries are not supported by Oracle driver.`);
    }

    /**
     * Creates a new table from the given table metadata and column metadatas.
     */
    async createTable(table: Table): Promise<void> {
        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(column)).join(", ");
        let sql = `CREATE TABLE "${table.name}" (${columnDefinitions}`;
        const primaryKeyColumns = table.columns.filter(column => column.isPrimary);
        if (primaryKeyColumns.length > 0)
            sql += `, PRIMARY KEY(${primaryKeyColumns.map(column => `"${column.name}"`).join(", ")})`;
        sql += `)`;
        await this.query(sql);
    }

    /**
     * Drops the table.
     */
    async dropTable(tableName: Table|string): Promise<void> {
        let sql = `DROP TABLE "${tableName}"`;
        await this.query(sql);
    }

    /**
     * Renames the given table.
     */
    async renameTable(oldTableOrName: Table|string, newTableOrName: Table|string): Promise<void> {
        // TODO
    }

    /**
     * Checks if column with the given name exist in the given table.
     */
    async hasColumn(tableName: string, columnName: string): Promise<boolean> {
        const sql = `SELECT COLUMN_NAME FROM all_tab_cols WHERE TABLE_NAME = '${tableName}' AND COLUMN_NAME = '${columnName}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a new column from the column in the table.
     */
    async addColumn(tableOrName: Table|string, column: TableColumn): Promise<void> {
        const tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
        const sql = `ALTER TABLE "${tableName}" ADD ${this.buildCreateColumnSql(column)}`;
        return this.query(sql);
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

        if (newColumn.isGenerated !== oldColumn.isGenerated) {

            if (newColumn.isGenerated) {
               /* if (table.primaryKey && oldColumn.isPrimary) {
                    // console.log(table.primaryKeys);
                    const dropPrimarySql = `ALTER TABLE "${table.name}" DROP CONSTRAINT "${table.primaryKey.name}"`;
                    await this.query(dropPrimarySql);
                }*/ // TODO: fix

                // since modifying identity column is not supported yet, we need to recreate this column
                const dropSql = `ALTER TABLE "${table.name}" DROP COLUMN "${newColumn.name}"`;
                await this.query(dropSql);

                const createSql = `ALTER TABLE "${table.name}" ADD ${this.buildCreateColumnSql(newColumn)}`;
                await this.query(createSql);

            } else {
                const sql = `ALTER TABLE "${table.name}" MODIFY "${newColumn.name}" DROP IDENTITY`;
                await this.query(sql);

            }
        }

        if (newColumn.isNullable !== oldColumn.isNullable) {
            const sql = `ALTER TABLE "${table.name}" MODIFY "${newColumn.name}" ${this.connection.driver.createFullType(newColumn)} ${newColumn.isNullable ? "NULL" : "NOT NULL"}`;
            await this.query(sql);

        } else if (this.connection.driver.createFullType(newColumn) !== this.connection.driver.createFullType(oldColumn)) { // elseif is used because
            const sql = `ALTER TABLE "${table.name}" MODIFY "${newColumn.name}" ${this.connection.driver.createFullType(newColumn)}`;
            await this.query(sql);
        }
    }

    /**
     * Changes a column in the table.
     */
    async changeColumns(tableOrName: Table|string, changedColumns: { newColumn: TableColumn, oldColumn: TableColumn }[]): Promise<void> {
        const updatePromises = changedColumns.map(async changedColumn => {
            return this.changeColumn(tableOrName, changedColumn.oldColumn, changedColumn.newColumn);
        });
        await Promise.all(updatePromises);
    }

    /**
     * Drops column in the table.
     */
    async dropColumn(tableOrName: Table|string, column: TableColumn): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getTable(tableOrName);
        return this.query(`ALTER TABLE "${table!.name}" DROP COLUMN "${column.name}"`);
    }

    /**
     * Drops the columns in the table.
     */
    async dropColumns(tableOrName: Table|string, columns: TableColumn[]): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getTable(tableOrName);
        const dropPromises = columns.map(column => this.dropColumn(table!, column));
        await Promise.all(dropPromises);
    }

    /**
     * Updates table's primary keys.
     * TODO: fix or remove
     */
    async updatePrimaryKeys(dbTable: Table): Promise<void> {
        /*if (!dbTable.primaryKey)
            return Promise.resolve();

        await this.query(`ALTER TABLE "${dbTable.name}" DROP CONSTRAINT "${dbTable.primaryKey.name}"`);
        const primaryColumnNames = dbTable.primaryKey.columnNames.map(columnName => "\"" + columnName + "\"");
        if (primaryColumnNames.length > 0)
            await this.query(`ALTER TABLE "${dbTable.name}" ADD PRIMARY KEY (${primaryColumnNames.join(", ")})`);*/
    }

    /**
     * Creates a new primary key.
     */
    async createPrimaryKey(tableOrName: Table|string, columnNames: string[]): Promise<void> {
        // todo
    }

    /**
     * Drops a primary key.
     */
    async dropPrimaryKey(tableOrName: Table|string): Promise<void> {
        // todo
    }

    /**
     * Creates a new unique constraint.
     */
    async createUniqueConstraint(tableOrName: Table|string, uniqueConstraint: TableUnique): Promise<void> {
        // todo
    }

    /**
     * Drops an unique constraint.
     */
    async dropUniqueConstraint(tableOrName: Table|string, uniqueOrName: TableUnique|string): Promise<void> {
        // todo
    }

    /**
     * Creates a new foreign key.
     */
    async createForeignKey(tableOrName: Table|string, foreignKey: TableForeignKey): Promise<void> {
        const tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
        const columnNames = foreignKey.columnNames.map(column => "\"" + column + "\"").join(", ");
        const referencedColumnNames = foreignKey.referencedColumnNames.map(column => "\"" + column + "\"").join(",");
        let sql = `ALTER TABLE "${tableName}" ADD CONSTRAINT "${foreignKey.name}" ` +
            `FOREIGN KEY (${columnNames}) ` +
            `REFERENCES "${foreignKey.referencedTableName}"(${referencedColumnNames})`;
        if (foreignKey.onDelete) sql += " ON DELETE " + foreignKey.onDelete;
        return this.query(sql);
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
    async dropForeignKey(tableOrName: Table|string, foreignKey: TableForeignKey): Promise<void> {
        const tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
        const sql = `ALTER TABLE "${tableName}" DROP CONSTRAINT "${foreignKey.name}"`;
        return this.query(sql);
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
    async createIndex(tableOrName: Table|string, index: TableIndex): Promise<void> {
        const tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
        const columns = index.columnNames.map(columnName => "\"" + columnName + "\"").join(", ");
        const sql = `CREATE ${index.isUnique ? "UNIQUE" : ""} INDEX "${index.name}" ON "${tableName}"(${columns})`;
        await this.query(sql);
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(tableSchemeOrName: Table|string, indexName: string): Promise<void> {
        const tableName = tableSchemeOrName instanceof Table ? tableSchemeOrName.name : tableSchemeOrName;
        const sql = `ALTER TABLE "${tableName}" DROP INDEX "${indexName}"`;
        await this.query(sql);
    }

    /**
     * Clears all table contents.
     * Note: this operation uses SQL's TRUNCATE query which cannot be reverted in transactions.
     */
    async clearTable(tableName: string): Promise<void> {
        await this.query(`TRUNCATE TABLE "${tableName}"`);
    }

    /**
     * Removes all tables from the currently connected database.
     */
    async clearDatabase(): Promise<void> {
        await this.startTransaction();
        try {
            const disableForeignKeysCheckQuery = `SET FOREIGN_KEY_CHECKS = 0;`;
            const dropTablesQuery = `SELECT concat('DROP TABLE IF EXISTS "', table_name, '";') AS query FROM information_schema.tables WHERE table_schema = '${this.dbName}'`;
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
        await PromiseUtils.runInSequence(this.sqlInMemory.downQueries, downQuery => this.query(downQuery));
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Database name shortcut.
     */
    protected get dbName(): string {
        return this.driver.options.schema as string;
    }

    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    protected parametrize(objectLiteral: ObjectLiteral): string[] {
        return Object.keys(objectLiteral).map(key => `"${key}"=:${key}`);
    }

    /**
     * Builds a query for create column.
     */
    protected buildCreateColumnSql(column: TableColumn) {
        let c = `"${column.name}" ` + this.connection.driver.createFullType(column);
        if (column.charset)
            c += " CHARACTER SET " + column.charset;
        if (column.collation)
            c += " COLLATE " + column.collation;
        if (column.isNullable !== true && !column.isGenerated) // NOT NULL is not supported with GENERATED
            c += " NOT NULL";
        // if (column.isPrimary === true && addPrimary)
        //     c += " PRIMARY KEY";
        if (column.isGenerated === true) // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " GENERATED BY DEFAULT ON NULL AS IDENTITY";
        // if (column.comment) // todo: less priority, fix it later
        //     c += " COMMENT '" + column.comment + "'";
        if (column.default !== undefined && column.default !== null) { // todo: same code in all drivers. make it DRY
            c += " DEFAULT " + column.default;
        }

        return c;
    }


}