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
import {OracleDriver} from "./OracleDriver";
import {Connection} from "../../connection/Connection";
import {ReadStream} from "../../platform/PlatformTools";
import {EntityManager} from "../../entity-manager/EntityManager";
import {QueryFailedError} from "../../error/QueryFailedError";

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
    protected sqlsInMemory: string[] = [];

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
     */
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
    }

    /**
     * Updates rows that match given conditions in the given table.
     */
    async update(tableName: string, valuesMap: ObjectLiteral, conditions: ObjectLiteral): Promise<void> {
        const updateValues = this.parametrize(valuesMap).join(", ");
        const conditionString = this.parametrize(conditions).join(" AND ");
        const sql = `UPDATE "${tableName}" SET ${updateValues} ${conditionString ? (" WHERE " + conditionString) : ""}`;
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

        const sql = `DELETE FROM "${tableName}" WHERE ${conditionString}`;
        await this.query(sql, parameters);
    }

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
     * Loads given table's data from the database.
     */
    async getTable(tableName: string): Promise<TableSchema|undefined> {
        const tableSchemas = await this.getTables([tableName]);
        return tableSchemas.length > 0 ? tableSchemas[0] : undefined;
    }

    /**
     * Loads all tables (with given names) from the database and creates a TableSchema from them.
     */
    async getTables(tableNames: string[]): Promise<TableSchema[]> {
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

        // create table schemas for loaded tables
        return dbTables.map(dbTable => {
            const tableSchema = new TableSchema(dbTable["TABLE_NAME"]);

            // create column schemas from the loaded columns
            tableSchema.columns = dbColumns
                .filter(dbColumn => dbColumn["TABLE_NAME"] === tableSchema.name)
                .map(dbColumn => {
                    const isPrimary = !!constraints
                        .find(constraint => {
                            return  constraint["TABLE_NAME"] === tableSchema.name &&
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

                    const columnSchema = new ColumnSchema();
                    columnSchema.name = dbColumn["COLUMN_NAME"];
                    columnSchema.type = columnType;
                    columnSchema.default = dbColumn["COLUMN_DEFAULT"] !== null && dbColumn["COLUMN_DEFAULT"] !== undefined ? dbColumn["COLUMN_DEFAULT"] : undefined;
                    columnSchema.isNullable = dbColumn["NULLABLE"] !== "N";
                    columnSchema.isPrimary = isPrimary;
                    columnSchema.isGenerated = dbColumn["IDENTITY_COLUMN"] === "YES"; // todo
                    columnSchema.comment = ""; // todo
                    return columnSchema;
                });

            // create primary key schema
            tableSchema.primaryKeys = constraints
                .filter(constraint =>
                    constraint["TABLE_NAME"] === tableSchema.name && constraint["CONSTRAINT_TYPE"] === "P"
                )
                .map(constraint =>
                    new PrimaryKeySchema(constraint["CONSTRAINT_NAME"], constraint["COLUMN_NAME"])
                );

            // create foreign key schemas from the loaded indices
            tableSchema.foreignKeys = constraints
                .filter(constraint => constraint["TABLE_NAME"] === tableSchema.name && constraint["CONSTRAINT_TYPE"] === "R")
                .map(constraint => new ForeignKeySchema(constraint["CONSTRAINT_NAME"], [], [], "", "")); // todo: fix missing params

            // create index schemas from the loaded indices
            tableSchema.indices = dbIndices
                .filter(dbIndex => {
                    return  dbIndex["TABLE_NAME"] === tableSchema.name &&
                        (!tableSchema.foreignKeys.find(foreignKey => foreignKey.name === dbIndex["INDEX_NAME"])) &&
                        (!tableSchema.primaryKeys.find(primaryKey => primaryKey.name === dbIndex["INDEX_NAME"]));
                })
                .map(dbIndex => {
                    return new IndexSchema(dbTable["TABLE_NAME"], dbIndex["INDEX_NAME"], dbIndex["COLUMN_NAMES"], !!(dbIndex["COLUMN_NAMES"] === "UNIQUE"));
                });

            return tableSchema;
        });
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
        const sql = `SELECT TABLE_NAME FROM user_tables WHERE TABLE_NAME = '${tableName}'`;
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
     * Creates a new table from the given table metadata and column metadatas.
     */
    async createTable(table: TableSchema): Promise<void> {
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
    async dropTable(tableName: string): Promise<void> {
        let sql = `DROP TABLE "${tableName}"`;
        await this.query(sql);
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
     * Creates a new column from the column schema in the table.
     */
    async addColumn(tableSchemaOrName: TableSchema|string, column: ColumnSchema): Promise<void> {
        const tableName = tableSchemaOrName instanceof TableSchema ? tableSchemaOrName.name : tableSchemaOrName;
        const sql = `ALTER TABLE "${tableName}" ADD ${this.buildCreateColumnSql(column)}`;
        return this.query(sql);
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
            tableSchema = await this.getTable(tableSchemaOrName);
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
            tableSchema = await this.getTable(tableSchemaOrName);
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

        if (newColumn.isGenerated !== oldColumn.isGenerated) {

            if (newColumn.isGenerated) {
                if (tableSchema.primaryKeys.length > 0 && oldColumn.isPrimary) {
                    // console.log(tableSchema.primaryKeys);
                    const dropPrimarySql = `ALTER TABLE "${tableSchema.name}" DROP CONSTRAINT "${tableSchema.primaryKeys[0].name}"`;
                    await this.query(dropPrimarySql);
                }

                // since modifying identity column is not supported yet, we need to recreate this column
                const dropSql = `ALTER TABLE "${tableSchema.name}" DROP COLUMN "${newColumn.name}"`;
                await this.query(dropSql);

                const createSql = `ALTER TABLE "${tableSchema.name}" ADD ${this.buildCreateColumnSql(newColumn)}`;
                await this.query(createSql);

            } else {
                const sql = `ALTER TABLE "${tableSchema.name}" MODIFY "${newColumn.name}" DROP IDENTITY`;
                await this.query(sql);

            }
        }

        if (newColumn.isNullable !== oldColumn.isNullable) {
            const sql = `ALTER TABLE "${tableSchema.name}" MODIFY "${newColumn.name}" ${this.connection.driver.createFullType(newColumn)} ${newColumn.isNullable ? "NULL" : "NOT NULL"}`;
            await this.query(sql);

        } else if (this.connection.driver.createFullType(newColumn) !== this.connection.driver.createFullType(oldColumn)) { // elseif is used because
            const sql = `ALTER TABLE "${tableSchema.name}" MODIFY "${newColumn.name}" ${this.connection.driver.createFullType(newColumn)}`;
            await this.query(sql);
        }
    }

    /**
     * Changes a column in the table.
     */
    async changeColumns(tableSchema: TableSchema, changedColumns: { newColumn: ColumnSchema, oldColumn: ColumnSchema }[]): Promise<void> {
        const updatePromises = changedColumns.map(async changedColumn => {
            return this.changeColumn(tableSchema, changedColumn.oldColumn, changedColumn.newColumn);
        });
        await Promise.all(updatePromises);
    }

    /**
     * Drops column in the table.
     */
    async dropColumn(table: TableSchema, column: ColumnSchema): Promise<void> {
        return this.query(`ALTER TABLE "${table.name}" DROP COLUMN "${column.name}"`);
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
    async updatePrimaryKeys(dbTable: TableSchema): Promise<void> {
        const primaryColumnNames = dbTable.primaryKeys.map(primaryKey => "\"" + primaryKey.columnName + "\"");
        // console.log(dbTable.primaryKeys);
        if (dbTable.primaryKeys.length > 0 && dbTable.primaryKeys[0].name)
            await this.query(`ALTER TABLE "${dbTable.name}" DROP CONSTRAINT "${dbTable.primaryKeys[0].name}"`);
        if (primaryColumnNames.length > 0)
            await this.query(`ALTER TABLE "${dbTable.name}" ADD PRIMARY KEY (${primaryColumnNames.join(", ")})`);
    }

    /**
     * Creates a new foreign key.
     */
    async createForeignKey(tableSchemaOrName: TableSchema|string, foreignKey: ForeignKeySchema): Promise<void> {
        const tableName = tableSchemaOrName instanceof TableSchema ? tableSchemaOrName.name : tableSchemaOrName;
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
    async createForeignKeys(tableSchemaOrName: TableSchema|string, foreignKeys: ForeignKeySchema[]): Promise<void> {
        const promises = foreignKeys.map(foreignKey => this.createForeignKey(tableSchemaOrName as any, foreignKey));
        await Promise.all(promises);
    }

    /**
     * Drops a foreign key from the table.
     */
    async dropForeignKey(tableSchemaOrName: TableSchema|string, foreignKey: ForeignKeySchema): Promise<void> {
        const tableName = tableSchemaOrName instanceof TableSchema ? tableSchemaOrName.name : tableSchemaOrName;
        const sql = `ALTER TABLE "${tableName}" DROP CONSTRAINT "${foreignKey.name}"`;
        return this.query(sql);
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
    async createIndex(tableName: string, index: IndexSchema): Promise<void> {
        const columns = index.columnNames.map(columnName => "\"" + columnName + "\"").join(", ");
        const sql = `CREATE ${index.isUnique ? "UNIQUE" : ""} INDEX "${index.name}" ON "${tableName}"(${columns})`;
        await this.query(sql);
    }

    /**
     * Drops an index from the table.
     */
    async dropIndex(tableSchemeOrName: TableSchema|string, indexName: string): Promise<void> {
        const tableName = tableSchemeOrName instanceof TableSchema ? tableSchemeOrName.name : tableSchemeOrName;
        const sql = `ALTER TABLE "${tableName}" DROP INDEX "${indexName}"`;
        await this.query(sql);
    }

    /**
     * Truncates table.
     */
    async truncate(tableName: string): Promise<void> {
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
     * Database name shortcut.
     */
    protected get dbName(): string {
        return (this.driver.options.schema || this.driver.options.schemaName) as string;
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
    protected buildCreateColumnSql(column: ColumnSchema) {
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