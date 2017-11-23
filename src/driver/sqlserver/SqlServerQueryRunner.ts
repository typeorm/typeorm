import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {TransactionAlreadyStartedError} from "../../error/TransactionAlreadyStartedError";
import {TransactionNotStartedError} from "../../error/TransactionNotStartedError";
import {TableColumn} from "../../schema-builder/table/TableColumn";
import {Table} from "../../schema-builder/table/Table";
import {TableForeignKey} from "../../schema-builder/table/TableForeignKey";
import {TableIndex} from "../../schema-builder/table/TableIndex";
import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {SqlServerDriver} from "./SqlServerDriver";
import {ReadStream} from "../../platform/PlatformTools";
import {MssqlParameter} from "./MssqlParameter";
import {OrmUtils} from "../../util/OrmUtils";
import {QueryFailedError} from "../../error/QueryFailedError";
import {TableIndexOptions} from "../../schema-builder/options/TableIndexOptions";
import {TableUnique} from "../../schema-builder/table/TableUnique";
import {TableCheck} from "../../schema-builder/table/TableCheck";
import {BaseQueryRunner} from "../../query-runner/BaseQueryRunner";
import {Broadcaster} from "../../subscriber/Broadcaster";

/**
 * Runs queries on a single mysql database connection.
 */
export class SqlServerQueryRunner extends BaseQueryRunner implements QueryRunner {

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Database driver used by connection.
     */
    driver: SqlServerDriver;

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Last executed query in a transaction.
     * This is needed because in transaction mode mssql cannot execute parallel queries,
     * that's why we store last executed query promise to wait it when we execute next query.
     *
     * @see https://github.com/patriksimek/node-mssql/issues/491
     */
    protected queryResponsibilityChain: Promise<any>[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: SqlServerDriver, mode: "master"|"slave" = "master") {
        super();
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
        return Promise.resolve();
    }

    /**
     * Releases used database connection.
     * You cannot use query runner methods once its released.
     */
    release(): Promise<void> {
        this.isReleased = true;
        return Promise.resolve();
    }

    /**
     * Starts transaction.
     */
    async startTransaction(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        if (this.isTransactionActive)
            throw new TransactionAlreadyStartedError();

        return new Promise<void>(async (ok, fail) => {
            this.isTransactionActive = true;

            const pool = await (this.mode === "slave" ? this.driver.obtainSlaveConnection() : this.driver.obtainMasterConnection());
            this.databaseConnection = pool.transaction();
            this.databaseConnection.begin((err: any) => {
                if (err) {
                    this.isTransactionActive = false;
                    return fail(err);
                }
                ok();
                this.connection.logger.logQuery("BEGIN TRANSACTION");
            });
        });
    }

    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    async commitTransaction(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        if (!this.isTransactionActive)
            throw new TransactionNotStartedError();

        return new Promise<void>((ok, fail) => {
            this.databaseConnection.commit((err: any) => {
                if (err) return fail(err);
                this.isTransactionActive = false;
                this.databaseConnection = null;
                ok();
                this.connection.logger.logQuery("COMMIT");
            });
        });
    }

    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    async rollbackTransaction(): Promise<void> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        if (!this.isTransactionActive)
            throw new TransactionNotStartedError();

        return new Promise<void>((ok, fail) => {
            this.databaseConnection.rollback((err: any) => {
                if (err) return fail(err);
                this.isTransactionActive = false;
                this.databaseConnection = null;
                ok();
                this.connection.logger.logQuery("ROLLBACK");
            });
        });
    }

    /**
     * Executes a given SQL query.
     */
    async query(query: string, parameters?: any[]): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        let waitingOkay: Function;
        const waitingPromise = new Promise((ok) => waitingOkay = ok);
        if (this.queryResponsibilityChain.length) {
            const otherWaitingPromises = [...this.queryResponsibilityChain];
            this.queryResponsibilityChain.push(waitingPromise);
            await Promise.all(otherWaitingPromises);
        }

        const promise = new Promise(async (ok, fail) => {
            try {
                this.driver.connection.logger.logQuery(query, parameters, this);
                const pool = await (this.mode === "slave" ? this.driver.obtainSlaveConnection() : this.driver.obtainMasterConnection());
                const request = new this.driver.mssql.Request(this.isTransactionActive ? this.databaseConnection : pool);
                if (parameters && parameters.length) {
                    parameters.forEach((parameter, index) => {
                        if (parameter instanceof MssqlParameter) {
                            const mssqlParameter = this.mssqlParameterToNativeParameter(parameter);
                            if (mssqlParameter) {
                                request.input(index, mssqlParameter, parameter.value);
                            } else {
                                request.input(index, parameter.value);
                            }
                        } else {
                            request.input(index, parameter);
                        }
                    });
                }
                const queryStartTime = +new Date();
                request.query(query, (err: any, result: any) => {

                    // log slow queries if maxQueryExecution time is set
                    const maxQueryExecutionTime = this.driver.connection.options.maxQueryExecutionTime;
                    const queryEndTime = +new Date();
                    const queryExecutionTime = queryEndTime - queryStartTime;
                    if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                        this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);

                    const resolveChain = () => {
                        if (promiseIndex !== -1)
                            this.queryResponsibilityChain.splice(promiseIndex, 1);
                        if (waitingPromiseIndex !== -1)
                            this.queryResponsibilityChain.splice(waitingPromiseIndex, 1);
                        waitingOkay();
                    };

                    let promiseIndex = this.queryResponsibilityChain.indexOf(promise);
                    let waitingPromiseIndex = this.queryResponsibilityChain.indexOf(waitingPromise);
                    if (err) {
                        this.driver.connection.logger.logQueryError(err, query, parameters, this);
                        resolveChain();
                        return fail(new QueryFailedError(query, parameters, err));
                    }

                    ok(result.recordset);
                    resolveChain();
                });

            } catch (err) {
                fail(err);
            }
        });
        // with this condition, Promise.all causes unexpected behavior.
        // if (this.isTransactionActive)
        this.queryResponsibilityChain.push(promise);
        return promise;
    }

    /**
     * Returns raw data stream.
     */
    async stream(query: string, parameters?: any[], onEnd?: Function, onError?: Function): Promise<ReadStream> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        let waitingOkay: Function;
        const waitingPromise = new Promise((ok) => waitingOkay = ok);
        if (this.queryResponsibilityChain.length) {
            const otherWaitingPromises = [...this.queryResponsibilityChain];
            this.queryResponsibilityChain.push(waitingPromise);
            await Promise.all(otherWaitingPromises);
        }

        const promise = new Promise<ReadStream>(async (ok, fail) => {

            this.driver.connection.logger.logQuery(query, parameters, this);
            const pool = await (this.mode === "slave" ? this.driver.obtainSlaveConnection() : this.driver.obtainMasterConnection());
            const request = new this.driver.mssql.Request(this.isTransactionActive ? this.databaseConnection : pool);
            request.stream = true;
            if (parameters && parameters.length) {
                parameters.forEach((parameter, index) => {
                    if (parameter instanceof MssqlParameter) {
                        request.input(index, this.mssqlParameterToNativeParameter(parameter), parameter.value);
                    } else {
                        request.input(index, parameter);
                    }
                });
            }
            request.query(query, (err: any, result: any) => {

                const resolveChain = () => {
                    if (promiseIndex !== -1)
                        this.queryResponsibilityChain.splice(promiseIndex, 1);
                    if (waitingPromiseIndex !== -1)
                        this.queryResponsibilityChain.splice(waitingPromiseIndex, 1);
                    waitingOkay();
                };

                let promiseIndex = this.queryResponsibilityChain.indexOf(promise);
                let waitingPromiseIndex = this.queryResponsibilityChain.indexOf(waitingPromise);
                if (err) {
                    this.driver.connection.logger.logQueryError(err, query, parameters, this);
                    resolveChain();
                    return fail(err);
                }

                ok(result.recordset);
                resolveChain();
            });
            if (onEnd) request.on("done", onEnd);
            if (onError) request.on("error", onError);
            ok(request as ReadStream);
        });
        if (this.isTransactionActive)
            this.queryResponsibilityChain.push(promise);

        return promise;
    }

    /**
     * Inserts rows into the closure table.
     */
    async insertIntoClosureTable(tablePath: string, newEntityId: any, parentId: any, hasLevel: boolean): Promise<number> {
        let sql = "";
        if (hasLevel) {
            sql = `INSERT INTO ${this.escapeTableName(tablePath)}("ancestor", "descendant", "level") ` +
                `SELECT "ancestor", "${newEntityId}", "level" + 1 FROM ${this.escapeTableName(tablePath)} WHERE "descendant" = ${parentId} ` +
                `UNION ALL SELECT "${newEntityId}", "${newEntityId}", 1`;
        } else {
            sql = `INSERT INTO ${this.escapeTableName(tablePath)}("ancestor", "descendant") ` +
                `SELECT "ancestor", "${newEntityId}" FROM ${this.escapeTableName(tablePath)} WHERE "descendant" = ${parentId} ` +
                `UNION ALL SELECT "${newEntityId}", "${newEntityId}"`;
        }
        await this.query(sql);
        if (hasLevel) {
            const results: ObjectLiteral[] = await this.query(`SELECT MAX(level) as level FROM ${this.escapeTableName(tablePath)} WHERE descendant = ${parentId}`);
            return results && results[0] && results[0]["level"] ? parseInt(results[0]["level"]) + 1 : 1;
        } else {
            return -1;
        }
    }

    /**
     * Returns all available database names including system databases.
     */
    async getDatabases(): Promise<string[]> {
        const result = await this.query(`EXEC sp_databases`) as any[];
        return result.map(db => db["DATABASE_NAME"]);
    }

    /**
     * Returns all available schema names including system schemas.
     * If database parameter specified, returns schemas of that database.
     */
    async getSchemas(database?: string): Promise<string[]> {
        const query = database ? `SELECT * FROM "${database}"."sys"."schema"` : `SELECT * FROM "sys"."schemas"`;
        const result = await this.query(query) as any[];
        return result.map(schema => schema["name"]);
    }

    /**
     * Checks if database with the given name exist.
     */
    async hasDatabase(database: string): Promise<boolean> {
        const result = await this.query(`SELECT DB_ID('${database}') as "db_id"`);
        const dbId = result[0]["db_id"];
        return !!dbId;
    }

    /**
     * Checks if schema with the given name exist.
     */
    async hasSchema(schema: string): Promise<boolean> {
        const result = await this.query(`SELECT SCHEMA_ID('${schema}') as "schema_id"`);
        const schemaId = result[0]["schema_id"];
        return !!schemaId;
    }

    /**
     * Checks if table with the given name exist in the database.
     */
    async hasTable(tableOrName: Table|string): Promise<boolean> {
        const parsedTableName = this.parseTableName(tableOrName);
        const sql = `SELECT * FROM "${parsedTableName.database}"."INFORMATION_SCHEMA"."TABLES" WHERE "TABLE_NAME" = '${parsedTableName.tableName}' AND "TABLE_SCHEMA" = '${parsedTableName.schema}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a new database.
     */
    async createDatabase(database: string, ifNotExist?: boolean): Promise<void> {
        const up = ifNotExist ? `IF DB_ID('${database}') IS NULL CREATE DATABASE "${database}"` : `CREATE DATABASE "${database}"`;
        const down = `DROP DATABASE "${database}"`;
        await this.executeQueries(up, down);
    }

    /**
     * Drops database.
     */
    async dropDatabase(database: string, ifExist?: boolean): Promise<void> {
        const up = ifExist ? `IF DB_ID('${database}') IS NOT NULL DROP DATABASE "${database}"` : `DROP DATABASE "${database}"`;
        const down = `CREATE DATABASE "${database}"`;
        await this.executeQueries(up, down);
    }

    /**
     * Creates table schema.
     * If database name also specified (e.g. 'dbName.schemaName') schema will be created in specified database.
     */
    async createSchema(schemaPath: string, ifNotExist?: boolean): Promise<void> {
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        if (schemaPath.indexOf(".") === -1) {
            const upQuery = ifNotExist ? `IF SCHEMA_ID('${schemaPath}') IS NULL BEGIN EXEC ('CREATE SCHEMA "${schemaPath}"') END` : `CREATE SCHEMA "${schemaPath}"`;
            upQueries.push(upQuery);
            downQueries.push(`DROP SCHEMA "${schemaPath}"`);

        } else {
            const dbName = schemaPath.split(".")[0];
            const schema = schemaPath.split(".")[1];
            const currentDB = await this.getCurrentDatabase();
            upQueries.push(`USE "${dbName}"`);
            downQueries.push(`USE "${currentDB}"`);

            const upQuery = ifNotExist ? `IF SCHEMA_ID('${schema}') IS NULL BEGIN EXEC ('CREATE SCHEMA "${schema}"') END` : `CREATE SCHEMA "${schema}"`;
            upQueries.push(upQuery);
            downQueries.push(`DROP SCHEMA "${schema}"`);

            upQueries.push(`USE "${currentDB}"`);
            downQueries.push(`USE "${dbName}"`);
        }

        await this.executeQueries(upQueries, downQueries);
    }

    /**
     * Drops table schema.
     * If database name also specified (e.g. 'dbName.schemaName') schema will be dropped in specified database.
     */
    async dropSchema(schemaPath: string, ifExist?: boolean): Promise<void> {
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        if (schemaPath.indexOf(".") === -1) {
            const upQuery = ifExist ? `IF SCHEMA_ID('${schemaPath}') IS NULL BEGIN EXEC ('DROP SCHEMA "${schemaPath}"') END` : `DROP SCHEMA "${schemaPath}"`;
            upQueries.push(upQuery);
            downQueries.push(`CREATE SCHEMA "${schemaPath}"`);

        } else {
            const dbName = schemaPath.split(".")[0];
            const schema = schemaPath.split(".")[1];
            const currentDB = await this.getCurrentDatabase();
            upQueries.push(`USE "${dbName}"`);
            downQueries.push(`USE "${currentDB}"`);

            const upQuery = ifExist ? `IF SCHEMA_ID('${schema}') IS NULL BEGIN EXEC ('DROP SCHEMA "${schema}"') END` : `DROP SCHEMA "${schema}"`;
            upQueries.push(upQuery);
            downQueries.push(`CREATE SCHEMA "${schema}"`);

            upQueries.push(`USE "${currentDB}"`);
            downQueries.push(`USE "${dbName}"`);
        }

        await this.executeQueries(upQueries, downQueries);
    }

    /**
     * Creates a new table.
     */
    async createTable(table: Table, ifNotExist: boolean = false, createForeignKeys: boolean = true, createIndices: boolean = true): Promise<void> {
        if (ifNotExist) {
            const isTableExist = await this.hasTable(table);
            if (isTableExist) return Promise.resolve();
        }
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        upQueries.push(this.createTableSql(table, createForeignKeys));
        downQueries.push(this.dropTableSql(table));

        // if createForeignKeys is true, we must drop created foreign keys in down query.
        // createTable does not need separate method to create foreign keys, because it create fk's in the same query with table creation.
        if (createForeignKeys)
            table.foreignKeys.forEach(foreignKey => downQueries.push(this.dropForeignKeySql(table, foreignKey)));

        if (createIndices) {
            table.indices.forEach(index => {

                // new index may be passed without name. In this case we generate index name manually.
                if (!index.name)
                    index.name = this.connection.namingStrategy.indexName(table.name, index.columnNames);
                upQueries.push(this.createIndexSql(table, index));
                downQueries.push(this.dropIndexSql(table, index));
            });
        }

        await this.executeQueries(upQueries, downQueries);
    }

    /**
     * Drops the table.
     */
    async dropTable(tableOrName: Table|string, ifExist?: boolean, dropForeignKeys: boolean = true, dropIndices: boolean = true): Promise<void> {
        // if dropTable called with dropForeignKeys = true, we must create foreign keys in down query.
        const createForeignKeys: boolean = dropForeignKeys;
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        // It needs because if table does not exist and dropForeignKeys or dropIndices is true, we don't need
        // to perform drop queries for foreign keys and indices.
        if (ifExist) {
            const isTableExist = await this.hasTable(table);
            if (!isTableExist) return Promise.resolve();
        }

        if (dropIndices) {
            table.indices.forEach(index => {
                upQueries.push(this.dropIndexSql(table, index));
                downQueries.push(this.createIndexSql(table, index));
            });
        }

        // if dropForeignKeys is true, we just drop the table, otherwise we also drop table foreign keys.
        // createTable does not need separate method to create foreign keys, because it create fk's in the same query with table creation.
        if (dropForeignKeys)
            table.foreignKeys.forEach(foreignKey => upQueries.push(this.dropForeignKeySql(table, foreignKey)));

        upQueries.push(this.dropTableSql(table));
        downQueries.push(this.createTableSql(table, createForeignKeys));

        await this.executeQueries(upQueries, downQueries);
    }

    /**
     * Renames a table.
     */
    async renameTable(oldTableOrName: Table|string, newTableOrName: Table|string): Promise<void> {
        const oldTableName = oldTableOrName instanceof Table ? oldTableOrName.name : oldTableOrName;
        const newTableName = newTableOrName instanceof Table ? newTableOrName.name : newTableOrName;

        const up = `EXEC sp_rename '${this.escapeTableName(oldTableName, true)}', '${newTableName}'`;
        const down = `EXEC sp_rename '${this.escapeTableName(newTableName, true)}', '${oldTableName}'`;

        await this.executeQueries(up, down);
    }

    /**
     * Checks if column exist in the table.
     */
    async hasColumn(tablePath: string, columnName: string): Promise<boolean> {
        const parsedTablePath = this.parseTableName(tablePath);
        const sql = `SELECT * FROM "${parsedTablePath.database}"."INFORMATION_SCHEMA"."TABLES" WHERE "TABLE_NAME" = '${parsedTablePath.tableName}' AND "COLUMN_NAME" = '${columnName}' AND "TABLE_SCHEMA" = '${parsedTablePath.schema}'`;
        const result = await this.query(sql);
        return result.length ? true : false;
    }

    /**
     * Creates a new column from the column in the table.
     */
    async addColumn(tableOrName: Table|string, column: TableColumn): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const clonedTable = table.clone();
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD ${this.buildCreateColumnSql(table, column, false, false)}`);
        downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP COLUMN "${column.name}"`);

        if (column.isPrimary) {
            const primaryColumns = clonedTable.primaryColumns;
            // if table already have primary key, me must drop it and recreate again
            if (primaryColumns.length > 0) {
                const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${pkName}"`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
            }

            primaryColumns.push(column);
            const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
            const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${pkName}"`);
        }

        if (column.isUnique) {
            const uniqueConstraint = new TableUnique({
               name: this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]),
               columnNames: [column.name]
            });
            clonedTable.uniques.push(uniqueConstraint);
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE ("${column.name}")`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${uniqueConstraint.name}"`);
        }

        if (column.default !== null && column.default !== undefined) {
            const defaultName = this.connection.namingStrategy.defaultConstraintName(table.name, column.name);
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${defaultName}" DEFAULT ${column.default} FOR "${column.name}"`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${defaultName}"`);
        }

        await this.executeQueries(upQueries, downQueries);

        clonedTable.addColumn(column);
        this.replaceCachedTable(table, clonedTable);
    }

    /**
     * Creates a new columns from the column in the table.
     */
    async addColumns(tableOrName: Table|string, columns: TableColumn[]): Promise<void> {
        const queries = columns.map(column => this.addColumn(tableOrName, column));
        await Promise.all(queries);
    }

    /**
     * Renames column in the given table.
     */
    async renameColumn(tableOrName: Table|string, oldTableColumnOrName: TableColumn|string, newTableColumnOrName: TableColumn|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const oldColumn = oldTableColumnOrName instanceof TableColumn ? oldTableColumnOrName : table.columns.find(c => c.name === oldTableColumnOrName);
        if (!oldColumn)
            throw new Error(`Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`);

        let newColumn: TableColumn|undefined = undefined;
        if (newTableColumnOrName instanceof TableColumn) {
            newColumn = newTableColumnOrName;
        } else {
            newColumn = oldColumn.clone();
            newColumn.name = newTableColumnOrName;
        }

        await this.changeColumn(table, oldColumn, newColumn);
    }

    /**
     * Changes a column in the table.
     */
    async changeColumn(tableOrName: Table|string, oldTableColumnOrName: TableColumn|string, newColumn: TableColumn): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const clonedTable = table.clone();
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        const oldColumn = oldTableColumnOrName instanceof TableColumn
            ? oldTableColumnOrName
            : table.columns.find(column => column.name === oldTableColumnOrName);
        if (!oldColumn)
            throw new Error(`Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`);

        if (newColumn.isGenerated !== oldColumn.isGenerated) {
            throw new Error(`Changing column's "isGenerated" property is not supported in SqlServer driver. Drop column and recreate it with a new "isGenerated" property instead.`);

        } else {
            if (newColumn.name !== oldColumn.name) {

                // we need database name and schema name to rename FK constraints
                let dbName: string|undefined = undefined;
                let schemaName: string|undefined = undefined;
                const splittedName = table.name.split(".");
                if (splittedName.length === 3) {
                    dbName = splittedName[0];
                    if (splittedName[1] !== "")
                        schemaName = splittedName[1];

                } else if (splittedName.length === 2) {
                    schemaName = splittedName[0];
                }

                // if we have tables with database which differs from database specified in config, we must change currently used database.
                // This need because we can not rename objects from another database.
                const currentDB = await this.getCurrentDatabase();
                if (dbName && dbName !== currentDB) {
                    upQueries.push(`USE "${dbName}"`);
                    downQueries.push(`USE "${currentDB}"`);
                }

                // rename the column
                upQueries.push(`EXEC sp_rename "${this.escapeTableName(table, true)}.${oldColumn.name}", "${newColumn.name}"`);
                downQueries.push(`EXEC sp_rename "${this.escapeTableName(table, true)}.${newColumn.name}", "${oldColumn.name}"`);

                if (oldColumn.isPrimary === true) {
                    const primaryColumns = clonedTable.primaryColumns;

                    // build old primary constraint name
                    const columnNames = primaryColumns.map(column => column.name);
                    const oldPkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);

                    // replace old column name with new column name
                    columnNames.splice(columnNames.indexOf(oldColumn.name), 1);
                    columnNames.push(newColumn.name);

                    // build new primary constraint name
                    const newPkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);

                    // rename primary constraint
                    upQueries.push(`EXEC sp_rename "${this.escapeTableName(clonedTable, true)}.${oldPkName}", "${newPkName}"`);
                    downQueries.push(`EXEC sp_rename "${this.escapeTableName(clonedTable, true)}.${newPkName}", "${oldPkName}"`);
                }

                // rename index constraints
                clonedTable.findColumnIndices(oldColumn).forEach(index => {
                    index.columnNames.splice(index.columnNames.indexOf(oldColumn.name), 1);
                    index.columnNames.push(newColumn.name);
                    const newIndexName = this.connection.namingStrategy.indexName(clonedTable, index.columnNames);
                    upQueries.push(`EXEC sp_rename "${this.escapeTableName(clonedTable, true)}.${index.name}", "${newIndexName}", "INDEX"`);
                    downQueries.push(`EXEC sp_rename "${this.escapeTableName(clonedTable, true)}.${newIndexName}", "${index.name}", "INDEX"`);
                });

                // this function concat database name and schema name to the foreign key.
                // needs because FK name is relevant to the schema and database.
                const buildForeignKeyName = (fkName: string): string => {
                    let joinedFkName = fkName;
                    if (schemaName)
                        joinedFkName = schemaName + "." + joinedFkName;
                    if (dbName)
                        joinedFkName = dbName + "." + joinedFkName;

                    return joinedFkName;
                };

                // rename foreign key constraints
                clonedTable.findColumnForeignKeys(oldColumn).forEach(foreignKey => {
                    foreignKey.columnNames.splice(foreignKey.columnNames.indexOf(oldColumn.name), 1);
                    foreignKey.columnNames.push(newColumn.name);
                    const newForeignKeyName = this.connection.namingStrategy.foreignKeyName(clonedTable, foreignKey.columnNames);
                    upQueries.push(`EXEC sp_rename "${buildForeignKeyName(foreignKey.name!)}", "${newForeignKeyName}"`);
                    downQueries.push(`EXEC sp_rename "${buildForeignKeyName(newForeignKeyName)}", "${foreignKey.name}"`);
                });

                // rename check constraints
                clonedTable.findColumnChecks(oldColumn).forEach(check => {
                    check.columnNames.splice(check.columnNames.indexOf(oldColumn.name), 1);
                    check.columnNames.push(newColumn.name);
                    const newCheckName = this.connection.namingStrategy.checkConstraintName(clonedTable, check.columnNames);
                    upQueries.push(`EXEC sp_rename "${this.escapeTableName(clonedTable, true)}.${check.name}", "${newCheckName}"`);
                    downQueries.push(`EXEC sp_rename "${this.escapeTableName(clonedTable, true)}.${newCheckName}", "${check.name}"`);
                });

                // rename unique constraints
                clonedTable.findColumnUniques(oldColumn).forEach(unique => {
                    unique.columnNames.splice(unique.columnNames.indexOf(oldColumn.name), 1);
                    unique.columnNames.push(newColumn.name);
                    const newUniqueName = this.connection.namingStrategy.uniqueConstraintName(clonedTable, unique.columnNames);
                    upQueries.push(`EXEC sp_rename "${this.escapeTableName(clonedTable, true)}.${unique.name}", "${newUniqueName}"`);
                    downQueries.push(`EXEC sp_rename "${this.escapeTableName(clonedTable, true)}.${newUniqueName}", "${unique.name}"`);
                });

                // change currently used database back to default db.
                if (dbName && dbName !== currentDB) {
                    upQueries.push(`USE "${currentDB}"`);
                    downQueries.push(`USE "${dbName}"`);
                }

                // rename old column in the Table object
                const oldTableColumn = clonedTable.columns.find(column => column.name === oldColumn.name);
                clonedTable.columns[clonedTable.columns.indexOf(oldTableColumn!)].name = newColumn.name;
                oldColumn.name = newColumn.name;
            }

            if (this.isColumnChanged(newColumn, oldColumn)) {
                upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN ${this.buildCreateColumnSql(table, newColumn, true, false)}`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ALTER COLUMN ${this.buildCreateColumnSql(table, oldColumn, true, false)}`);
            }

            if (newColumn.isPrimary !== oldColumn.isPrimary) {
                const primaryColumns = clonedTable.primaryColumns;

                // if primary column state changed, we must always drop existed constraint.
                if (primaryColumns.length > 0) {
                    const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                    const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${pkName}"`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
                }

                if (newColumn.isPrimary === true) {
                    primaryColumns.push(newColumn);
                    const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                    const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${pkName}"`);

                } else if (newColumn.isPrimary === false) {
                    const primaryColumn = primaryColumns.find(c => c.name === newColumn.name);
                    primaryColumns.splice(primaryColumns.indexOf(primaryColumn!), 1);

                    // if we have another primary keys, we must recreate constraint.
                    if (primaryColumns.length > 0) {
                        const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                        const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                        upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
                        downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${pkName}"`);
                    }
                }
            }

            if (newColumn.isUnique !== oldColumn.isUnique) {
                if (newColumn.isUnique === true) {
                    const uniqueConstraint = new TableUnique({
                        name: this.connection.namingStrategy.uniqueConstraintName(table.name, [newColumn.name]),
                        columnNames: [newColumn.name]
                    });
                    clonedTable.uniques.push(uniqueConstraint);
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE ("${newColumn.name}")`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${uniqueConstraint.name}"`);

                } else if (newColumn.isUnique === false) {
                    const uniqueConstraint = table.uniques.find(unique => {
                        return unique.columnNames.length === 1 && !!unique.columnNames.find(columnName => columnName === newColumn.name);
                    });
                    clonedTable.uniques.splice(clonedTable.uniques.indexOf(uniqueConstraint!), 1);
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${uniqueConstraint!.name}"`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${uniqueConstraint!.name}" UNIQUE ("${newColumn.name}")`);
                }
            }

            if (newColumn.default !== oldColumn.default) {
                if (newColumn.default !== null && newColumn.default !== undefined) {
                    const defaultName = this.connection.namingStrategy.defaultConstraintName(table.name, newColumn.name);
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${defaultName}" DEFAULT ${newColumn.default} FOR "${newColumn.name}"`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${defaultName}"`);

                } else if (oldColumn.default !== null && oldColumn.default !== undefined) {
                    const defaultName = this.connection.namingStrategy.defaultConstraintName(table.name, oldColumn.name);
                    upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${defaultName}"`);
                    downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${defaultName}" DEFAULT ${oldColumn.default} FOR "${oldColumn.name}"`);
                }
            }
        }

        await this.executeQueries(upQueries, downQueries);
        this.replaceCachedTable(table, clonedTable);
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
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const clonedTable = table.clone();
        const upQueries: string[] = [];
        const downQueries: string[] = [];

        const primaryColumns = clonedTable.primaryColumns;
        if (primaryColumns.length > 0 && primaryColumns.find(primaryColumn => primaryColumn.name === column.name)) {
            const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
            const columnNames = primaryColumns.map(primaryColumn => `"${primaryColumn.name}"`).join(", ");
            upQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} DROP CONSTRAINT "${pkName}"`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
            primaryColumns.splice(primaryColumns.indexOf(column), 1);

            // if primary key have multiple columns, we must recreate it without dropped column
            if (primaryColumns.length > 0) {
                const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                const columnNames = primaryColumns.map(primaryColumn => `"${primaryColumn.name}"`).join(", ");
                upQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`);
                downQueries.push(`ALTER TABLE ${this.escapeTableName(clonedTable)} DROP CONSTRAINT "${pkName}"`);
            }
        }

        if (column.isUnique) {
            const uniqueName = this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]);
            const foundUnique = clonedTable.uniques.find(unique => unique.name === uniqueName);
            if (foundUnique)
                clonedTable.uniques.splice(clonedTable.uniques.indexOf(foundUnique), 1);
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${uniqueName}"`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${uniqueName}" UNIQUE ("${column.name}")`);
        }

        if (column.default !== null && column.default !== undefined) {
            const defaultName = this.connection.namingStrategy.defaultConstraintName(table.name, column.name);
            upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${defaultName}"`);
            downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${defaultName}" DEFAULT ${column.default} FOR "${column.name}"`);
        }

        upQueries.push(`ALTER TABLE ${this.escapeTableName(table)} DROP COLUMN "${column.name}"`);
        downQueries.push(`ALTER TABLE ${this.escapeTableName(table)} ADD ${this.buildCreateColumnSql(table, column, false, false)}`);

        await this.executeQueries(upQueries, downQueries);

        table.removeColumn(column);
        this.replaceCachedTable(table, clonedTable);
    }

    /**
     * Drops the columns in the table.
     */
    async dropColumns(tableOrName: Table|string, columns: TableColumn[]): Promise<void> {
        const dropPromises = columns.map(column => this.dropColumn(tableOrName, column));
        await Promise.all(dropPromises);
    }

    /**
     * Updates table's primary keys.
     * TODO: maybe deleted
     */
    async updatePrimaryKeys(table: Table): Promise<void> {
       /* const parsedTableName = this.parseTableName(table); // todo: selects must only be executed in getTables
        const oldPrimaryKeySql = `SELECT columnUsages.*, tableConstraints.CONSTRAINT_TYPE FROM "${parsedTableName.database}"."INFORMATION_SCHEMA"."KEY_COLUMN_USAGE" columnUsages
LEFT JOIN "${parsedTableName.database}"."INFORMATION_SCHEMA"."TABLE_CONSTRAINTS" tableConstraints ON tableConstraints.CONSTRAINT_NAME = columnUsages.CONSTRAINT_NAME AND tableConstraints.CONSTRAINT_TYPE = 'PRIMARY KEY'
WHERE tableConstraints.TABLE_CATALOG = '${parsedTableName.database}' AND columnUsages.TABLE_SCHEMA = '${parsedTableName.schema}' AND tableConstraints.TABLE_SCHEMA = '${parsedTableName.schema}'`;

        const oldPrimaryKey = await this.query(oldPrimaryKeySql);
        if (oldPrimaryKey.length > 0) {
            // const up = `ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${oldPrimaryKey[0]["CONSTRAINT_NAME"]}"`;
            // const down = ``;
            await this.query(`ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${oldPrimaryKey[0]["CONSTRAINT_NAME"]}"`);
        }

        if (!table.primaryKey)
            return Promise.resolve();
        const primaryColumnNames = table.primaryKey.columnNames.map(columnName => `"` + columnName + `"`);
        if (primaryColumnNames.length > 0)
            await this.query(`ALTER TABLE ${this.escapeTableName(table)} ADD PRIMARY KEY (${primaryColumnNames.join(", ")})`);*/
    }

    /**
     * Creates a new primary key.
     */
    async createPrimaryKey(tableOrName: Table|string, columnNames: string[]): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const clonedTable = table.clone();

        const up = this.createPrimaryKeySql(table, columnNames);

        // mark columns as primary, because dropPrimaryKeySql build constraint name from table primary column names.
        clonedTable.columns.forEach(column => {
            if (columnNames.find(columnName => columnName === column.name))
                column.isPrimary = true;
        });
        const down = this.dropPrimaryKeySql(clonedTable);

        await this.executeQueries(up, down);
        this.replaceCachedTable(table, clonedTable);
    }

    /**
     * Drops a primary key.
     */
    async dropPrimaryKey(tableOrName: Table|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const up = this.dropPrimaryKeySql(table);
        const down = this.createPrimaryKeySql(table, table.primaryColumns.map(column => column.name));
        await this.executeQueries(up, down);
        table.primaryColumns.forEach(column => {
            column.isPrimary = false;
        });
    }

    async createUniqueConstraint(tableOrName: Table|string, uniqueConstraint: TableUnique): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        // new unique constraint may be passed without name. In this case we generate unique name manually.
        if (!uniqueConstraint.name)
            uniqueConstraint.name = this.connection.namingStrategy.uniqueConstraintName(table.name, uniqueConstraint.columnNames);

        const up = this.createUniqueConstraintSql(table, uniqueConstraint);
        const down = this.dropUniqueConstraintSql(table, uniqueConstraint);
        await this.executeQueries(up, down);
        table.addUniqueConstraint(uniqueConstraint);
    }

    async dropUniqueConstraint(tableOrName: Table|string, uniqueOrName: TableUnique|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const uniqueConstraint = uniqueOrName instanceof TableUnique ? uniqueOrName : table.uniques.find(u => u.name === uniqueOrName);
        if (!uniqueConstraint)
            throw new Error(`Supplied unique constraint does not found in table ${table.name}`);

        const up = this.dropUniqueConstraintSql(table, uniqueConstraint);
        const down = this.createUniqueConstraintSql(table, uniqueConstraint);
        await this.executeQueries(up, down);
        table.removeUniqueConstraint(uniqueConstraint);
    }

    /**
     * Creates a new foreign key.
     */
    async createForeignKey(tableOrName: Table|string, foreignKey: TableForeignKey): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        // new FK may be passed without name. In this case we generate FK name manually.
        if (!foreignKey.name)
            foreignKey.name = this.connection.namingStrategy.foreignKeyName(table.name, foreignKey.columnNames);

        const up = this.createForeignKeySql(table, foreignKey);
        const down = this.dropForeignKeySql(table, foreignKey);
        await this.executeQueries(up, down);
        table.addForeignKey(foreignKey);
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
    async dropForeignKey(tableOrName: Table|string, foreignKeyOrName: TableForeignKey|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const foreignKey = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName : table.foreignKeys.find(fk => fk.name === foreignKeyOrName);
        if (!foreignKey)
            throw new Error(`Supplied foreign key does not found in table ${table.name}`);

        const up = this.dropForeignKeySql(table, foreignKey);
        const down = this.createForeignKeySql(table, foreignKey);
        await this.executeQueries(up, down);
        table.removeForeignKey(foreignKey);
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
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);

        // new index may be passed without name. In this case we generate index name manually.
        if (!index.name)
            index.name = this.connection.namingStrategy.indexName(table.name, index.columnNames);

        const up = this.createIndexSql(table, index);
        const down = this.dropIndexSql(table, index);
        await this.executeQueries(up, down);
        table.addIndex(index);
    }

    /**
     * Drops an index.
     */
    async dropIndex(tableOrName: Table|string, indexOrName: TableIndex|string): Promise<void> {
        const table = tableOrName instanceof Table ? tableOrName : await this.getCachedTable(tableOrName);
        const index = indexOrName instanceof TableIndex ? indexOrName : table.indices.find(i => i.name === indexOrName);
        if (!index)
            throw new Error(`Supplied index does not found in table ${table.name}`);

        const up = this.dropIndexSql(table, index);
        const down = this.createIndexSql(table, index);
        await this.executeQueries(up, down);
        table.removeIndex(index);
    }

    /**
     * Clears all table contents.
     * Note: this operation uses SQL's TRUNCATE query which cannot be reverted in transactions.
     */
    async clearTable(tablePath: string): Promise<void> {
        await this.query(`TRUNCATE TABLE ${this.escapeTableName(tablePath)}`);
    }

    /**
     * Removes all tables from the currently connected database.
     */
    async clearDatabase(): Promise<void> {
        await this.startTransaction();
        try {
            let allTablesSql = `SELECT * FROM "INFORMATION_SCHEMA"."TABLES" WHERE TABLE_TYPE = 'BASE TABLE'`;
            const allTablesResults: ObjectLiteral[] = await this.query(allTablesSql);
            await Promise.all(allTablesResults.map(async tablesResult => {
                const dropForeignKeySql = `SELECT 'ALTER TABLE "' + OBJECT_SCHEMA_NAME(fk.parent_object_id) + '"."' + OBJECT_NAME(fk.parent_object_id) + '" DROP CONSTRAINT "' + fk.name + '"' as query FROM "sys"."foreign_keys" AS fk WHERE fk.referenced_object_id = object_id('"${tablesResult["TABLE_SCHEMA"]}"."${tablesResult["TABLE_NAME"]}"')`;
                const dropFkQueries: ObjectLiteral[] = await this.query(dropForeignKeySql);
                return Promise.all(dropFkQueries.map(result => result["query"]).map(dropQuery => {
                    return this.query(dropQuery);
                }));
            }));
            await Promise.all(allTablesResults.map(tablesResult => {
                const dropTableSql = `DROP TABLE "${tablesResult["TABLE_SCHEMA"]}"."${tablesResult["TABLE_NAME"]}"`;
                return this.query(dropTableSql);
            }));

            await this.commitTransaction();

        } catch (error) {
            try { // we throw original error even if rollback thrown an error
                await this.rollbackTransaction();
            } catch (rollbackError) { }
            throw error;
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Return current database.
     */
    protected async getCurrentDatabase(): Promise<string> {
        const currentDBQuery = await this.query(`SELECT DB_NAME() AS "db_name"`);
        return currentDBQuery[0]["db_name"];
    }

    /**
     * Return current schema.
     */
    protected async getCurrentSchema(): Promise<string> {
        const currentSchemaQuery = await this.query(`SELECT SCHEMA_NAME() AS "schema_name"`);
        return currentSchemaQuery[0]["schema_name"];
    }

    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     */
    protected async loadTables(tableNames: string[]): Promise<Table[]> {

        // if no tables given then no need to proceed
        if (!tableNames || !tableNames.length)
            return [];

        const schemaNames: string[] = [];
        const currentSchema = await this.getCurrentSchema();
        const currentDatabase = await this.getCurrentDatabase();

        const extractTableSchemaAndName = (tableName: string): string[] => {
            let [database, schema, name] = tableName.split(".");
            // if name is empty, it means that tableName have only schema name and table name or only table name
            if (!name) {
                // if schema is empty, it means tableName have only name of a table. Otherwise it means that we have "schemaName"."tableName" string.
                if (!schema) {
                    name = database;
                    schema = this.driver.options.schema || currentSchema;

                } else {
                    name = schema;
                    schema = database;
                }
            } else if (schema === "") {
                schema = this.driver.options.schema || currentSchema;
            }

            return [schema, name];
        };

        tableNames.filter(tablePath => tablePath.indexOf(".") !== -1)
            .forEach(tablePath => {
                if (tablePath.split(".").length === 3) {
                    if (tablePath.split(".")[1] !== "")
                        schemaNames.push(tablePath.split(".")[1]);
                } else {
                    schemaNames.push(tablePath.split(".")[0]);
                }
            });
        schemaNames.push(this.driver.options.schema || currentSchema);

        const dbNames = tableNames
            .filter(tablePath => tablePath.split(".").length === 3)
            .map(tablePath => tablePath.split(".")[0]);
        if (this.driver.database && !dbNames.find(dbName => dbName === this.driver.database))
            dbNames.push(this.driver.database);

        // load tables, columns, indices and foreign keys
        const schemaNamesString = schemaNames.map(name => "'" + name + "'").join(", ");

        const tablesCondition = tableNames.map(tableName => {
            const [schema, name] = extractTableSchemaAndName(tableName);
            return `("TABLE_SCHEMA" = '${schema}' AND "TABLE_NAME" = '${name}')`;
        }).join(" OR ");

        const tablesSql = dbNames.map(dbName => {
            return `SELECT * FROM "${dbName}"."INFORMATION_SCHEMA"."TABLES" WHERE ` + tablesCondition;
        }).join(" UNION ALL ");

        const columnsSql = dbNames.map(dbName => {
            return `SELECT * FROM "${dbName}"."INFORMATION_SCHEMA"."COLUMNS" WHERE ` + tablesCondition;
        }).join(" UNION ALL ");

        const constraintsCondition = tableNames.map(tableName => {
            const [schema, name] = extractTableSchemaAndName(tableName);
            return `("columnUsages"."TABLE_SCHEMA" = '${schema}' AND "columnUsages"."TABLE_NAME" = '${name}' ` +
             `AND "tableConstraints"."TABLE_SCHEMA" = '${schema}' AND "tableConstraints"."TABLE_NAME" = '${name}')`;
        }).join(" OR ");

        const constraintsSql = dbNames.map(dbName => {
            return `SELECT "columnUsages".*, "tableConstraints"."CONSTRAINT_TYPE" FROM "${dbName}"."INFORMATION_SCHEMA"."CONSTRAINT_COLUMN_USAGE" "columnUsages" ` +
                `INNER JOIN "${dbName}"."INFORMATION_SCHEMA"."TABLE_CONSTRAINTS" "tableConstraints" ON "tableConstraints"."CONSTRAINT_NAME" = "columnUsages"."CONSTRAINT_NAME" ` +
                `WHERE (${constraintsCondition}) AND "tableConstraints"."CONSTRAINT_TYPE" IN ('PRIMARY KEY', 'UNIQUE')`;
        }).join(" UNION ALL ");

        const foreignKeysSql = dbNames.map(dbName => {
            return `SELECT "fk"."name" AS "FK_NAME", '${dbName}' AS "TABLE_CATALOG", "s1"."name" AS "TABLE_SCHEMA", "t1"."name" AS "TABLE_NAME", ` +
                `"col1"."name" AS "COLUMN_NAME", "s2"."name" AS "REF_SCHEMA", "t2"."name" AS "REF_TABLE", "col2"."name" AS "REF_COLUMN", ` +
                `"fk"."delete_referential_action_desc" AS "ON_DELETE", "fk"."update_referential_action_desc" AS "ON_UPDATE" ` +
                `FROM "${dbName}"."sys"."foreign_keys" "fk" ` +
                `INNER JOIN "${dbName}"."sys"."foreign_key_columns" "fkc" ON "fkc"."constraint_object_id" = "fk"."object_id" ` +
                `INNER JOIN "${dbName}"."sys"."tables" "t1" ON "t1"."object_id" = "fk"."parent_object_id" ` +
                `INNER JOIN "${dbName}"."sys"."schemas" "s1" ON "s1"."schema_id" = "t1"."schema_id" ` +
                `INNER JOIN "${dbName}"."sys"."tables" "t2" ON "t2"."object_id" = "fk"."referenced_object_id" ` +
                `INNER JOIN "${dbName}"."sys"."schemas" "s2" ON "s2"."schema_id" = "t2"."schema_id" ` +
                `INNER JOIN "${dbName}"."sys"."columns" "col1" ON "col1"."column_id" = "fkc"."parent_column_id" AND "col1"."object_id" = "fk"."parent_object_id" ` +
                `INNER JOIN "${dbName}"."sys"."columns" "col2" ON "col2"."column_id" = "fkc"."referenced_column_id" AND "col2"."object_id" = "fk"."referenced_object_id"`;
        }).join(" UNION ALL ");

        const identityColumnsSql = dbNames.map(dbName => {
            return `SELECT "TABLE_CATALOG", "TABLE_SCHEMA", "COLUMN_NAME", "TABLE_NAME" ` +
                `FROM "${dbName}"."INFORMATION_SCHEMA"."COLUMNS" ` +
                `WHERE COLUMNPROPERTY(object_id("TABLE_CATALOG" + '.' + "TABLE_SCHEMA" + '.' + "TABLE_NAME"), "COLUMN_NAME", 'IsIdentity') = 1 AND "TABLE_SCHEMA" IN (${schemaNamesString})`;
        }).join(" UNION ALL ");

        const indicesSql = dbNames.map(dbName => {
            return `SELECT '${dbName}' AS "TABLE_CATALOG", "s"."name" AS "TABLE_SCHEMA", "t"."name" AS "TABLE_NAME", ` +
                `"ind"."name" AS "INDEX_NAME", "col"."name" AS "COLUMN_NAME", "ind"."is_unique" AS "IS_UNIQUE" ` +
                `FROM "${dbName}"."sys"."indexes" "ind" ` +
                `INNER JOIN "${dbName}"."sys"."index_columns" "ic" ON "ic"."object_id" = "ind"."object_id" AND "ic"."index_id" = "ind"."index_id" ` +
                `INNER JOIN "${dbName}"."sys"."columns" "col" ON "col"."object_id" = "ic"."object_id" AND "col"."column_id" = "ic"."column_id" ` +
                `INNER JOIN "${dbName}"."sys"."tables" "t" ON "t"."object_id" = "ind"."object_id" ` +
                `INNER JOIN "${dbName}"."sys"."schemas" "s" ON "s"."schema_id" = "t"."schema_id" ` +
                `WHERE "ind"."is_primary_key" = 0 AND "ind"."is_unique_constraint" = 0 AND "t"."is_ms_shipped" = 0`;
        }).join(" UNION ALL ");

        const [
            dbTables,
            dbColumns,
            dbConstraints,
            dbForeignKeys,
            dbIdentityColumns,
            dbIndices
        ]: ObjectLiteral[][] = await Promise.all([
            this.query(tablesSql),
            this.query(columnsSql),
            this.query(constraintsSql),
            this.query(foreignKeysSql),
            this.query(identityColumnsSql),
            this.query(indicesSql),
        ]);

        // if tables were not found in the db, no need to proceed
        if (!dbTables.length)
            return [];

        // create table schemas for loaded tables
        return await Promise.all(dbTables.map(async dbTable => {
            const table = new Table();

            // We do not need to join schema and database names, when db or schema is by default.
            // In this case we need local variable `tableFullName` for below comparision.
            const db = dbTable["TABLE_CATALOG"] === currentDatabase ? undefined : dbTable["TABLE_CATALOG"];
            const schema = dbTable["TABLE_SCHEMA"] === currentSchema ? undefined : dbTable["TABLE_SCHEMA"];
            table.name = this.driver.buildTableName(dbTable["TABLE_NAME"], schema, db);
            const tableFullName = this.driver.buildTableName(dbTable["TABLE_NAME"], dbTable["TABLE_SCHEMA"], dbTable["TABLE_CATALOG"]);

            // create columns from the loaded columns
            table.columns = dbColumns
                .filter(dbColumn => this.driver.buildTableName(dbColumn["TABLE_NAME"], dbColumn["TABLE_SCHEMA"], dbColumn["TABLE_CATALOG"]) === tableFullName)
                .map(dbColumn => {
                    const columnConstraints = dbConstraints.filter(dbConstraint => {
                        return this.driver.buildTableName(dbConstraint["TABLE_NAME"], dbConstraint["CONSTRAINT_SCHEMA"], dbConstraint["CONSTRAINT_CATALOG"]) === tableFullName
                            && dbConstraint["COLUMN_NAME"] === dbColumn["COLUMN_NAME"];
                    });

                    const uniqueConstraint = columnConstraints.find(constraint => constraint["CONSTRAINT_TYPE"] === "UNIQUE");
                    const isConstraintComposite = uniqueConstraint
                        ? !!dbConstraints.find(dbConstraint => dbConstraint["CONSTRAINT_TYPE"] === "UNIQUE"
                            && dbConstraint["CONSTRAINT_NAME"] === uniqueConstraint["CONSTRAINT_NAME"]
                            && dbConstraint["COLUMN_NAME"] !== dbColumn["COLUMN_NAME"])
                        : false;
                    const isUnique = !!uniqueConstraint && !isConstraintComposite;

                    const isPrimary = !!columnConstraints.find(constraint =>  constraint["CONSTRAINT_TYPE"] === "PRIMARY KEY");
                    const isGenerated = !!dbIdentityColumns.find(column => {
                        return this.driver.buildTableName(column["TABLE_NAME"], column["TABLE_SCHEMA"], column["TABLE_CATALOG"]) === tableFullName
                            && column["COLUMN_NAME"] === dbColumn["COLUMN_NAME"];
                    });

                    const tableColumn = new TableColumn();
                    tableColumn.name = dbColumn["COLUMN_NAME"];
                    tableColumn.type = dbColumn["DATA_TYPE"].toLowerCase();

                    tableColumn.length = dbColumn["CHARACTER_MAXIMUM_LENGTH"] ? dbColumn["CHARACTER_MAXIMUM_LENGTH"].toString() : "";
                    if (tableColumn.length === "-1")
                        tableColumn.length = "MAX";

                    if (tableColumn.type !== "int") {
                        tableColumn.precision = dbColumn["NUMERIC_PRECISION"];
                        tableColumn.scale = dbColumn["NUMERIC_SCALE"];
                    }

                    tableColumn.default = dbColumn["COLUMN_DEFAULT"] !== null && dbColumn["COLUMN_DEFAULT"] !== undefined ? dbColumn["COLUMN_DEFAULT"] : undefined;
                    tableColumn.isNullable = dbColumn["IS_NULLABLE"] === "YES";
                    tableColumn.isPrimary = isPrimary;
                    tableColumn.isGenerated = isGenerated;
                    if (isGenerated)
                        tableColumn.generationStrategy = "increment";
                    if (tableColumn.default === "(newsequentialid())") {
                        tableColumn.isGenerated = true;
                        tableColumn.generationStrategy = "uuid";
                        tableColumn.default = undefined;
                    }

                    tableColumn.isUnique = isUnique;
                    tableColumn.charset = dbColumn["CHARACTER_SET_NAME"];
                    tableColumn.collation = dbColumn["COLLATION_NAME"];

                    if (tableColumn.type === "datetime2" || tableColumn.type === "time" || tableColumn.type === "datetimeoffset") {
                        tableColumn.precision = dbColumn["DATETIME_PRECISION"];
                    }

                    return tableColumn;
                });

            // find unique constraints of table, group them by constraint name and build TableUnique.
            const tableUniqueConstraints = OrmUtils.uniq(dbConstraints.filter(dbConstraint => {
                return this.driver.buildTableName(dbConstraint["TABLE_NAME"], dbConstraint["CONSTRAINT_SCHEMA"], dbConstraint["CONSTRAINT_CATALOG"]) === tableFullName
                    && dbConstraint["CONSTRAINT_TYPE"] === "UNIQUE";
            }), dbConstraint => dbConstraint["CONSTRAINT_NAME"]);

            table.uniques = tableUniqueConstraints.map(constraint => {
                const uniques = dbConstraints.filter(dbC => dbC["CONSTRAINT_NAME"] === constraint["CONSTRAINT_NAME"]);
                return new TableUnique({
                    name: constraint["CONSTRAINT_NAME"],
                    columnNames: uniques.map(u => u["COLUMN_NAME"])
                });
            });

            // find check constraints of table, group them by constraint name and build TableCheck.
            const tableCheckConstraints = OrmUtils.uniq(dbConstraints.filter(dbConstraint => {
                return this.driver.buildTableName(dbConstraint["TABLE_NAME"], dbConstraint["CONSTRAINT_SCHEMA"], dbConstraint["CONSTRAINT_CATALOG"]) === tableFullName
                    && dbConstraint["CONSTRAINT_TYPE"] === "CHECK";
            }), dbConstraint => dbConstraint["CONSTRAINT_NAME"]);

            table.checks = tableCheckConstraints.map(constraint => {
                const checks = dbConstraints.filter(dbC => dbC["CONSTRAINT_NAME"] === constraint["CONSTRAINT_NAME"]);
                return new TableCheck({
                    name: constraint["CONSTRAINT_NAME"],
                    columnNames: checks.map(c => c["COLUMN_NAME"])
                });
            });

            // find foreign key constraints of table, group them by constraint name and build TableForeignKey.
            const tableForeignKeyConstraints = OrmUtils.uniq(dbForeignKeys.filter(dbForeignKey => {
                return this.driver.buildTableName(dbForeignKey["TABLE_NAME"], dbForeignKey["TABLE_SCHEMA"], dbForeignKey["TABLE_CATALOG"]) === tableFullName;
            }), dbForeignKey => dbForeignKey["FK_NAME"]);

            table.foreignKeys = tableForeignKeyConstraints.map(dbForeignKey => {
                const foreignKeys = dbForeignKeys.filter(dbFk => dbFk["FK_NAME"] === dbForeignKey["FK_NAME"]);
                return new TableForeignKey({
                    name: dbForeignKey["FK_NAME"],
                    columnNames: foreignKeys.map(dbFk => dbFk["COLUMN_NAME"]),
                    referencedTableName: this.driver.buildTableName(dbForeignKey["REF_TABLE"], dbForeignKey["REF_SCHEMA"], dbForeignKey["TABLE_CATALOG"]),
                    referencedColumnNames: foreignKeys.map(dbFk => dbFk["REF_COLUMN"]),
                    onDelete: dbForeignKey["ON_DELETE"].replace("_", " "), // SqlServer returns NO_ACTION, instead of NO ACTION
                    onUpdate: dbForeignKey["ON_UPDATE"].replace("_", " ") // SqlServer returns NO_ACTION, instead of NO ACTION
                });
            });

            // find index constraints of table, group them by constraint name and build TableIndex.
            const tableIndexConstraints = OrmUtils.uniq(dbIndices.filter(dbIndex => {
                return this.driver.buildTableName(dbIndex["TABLE_NAME"], dbIndex["TABLE_SCHEMA"], dbIndex["TABLE_CATALOG"]) === tableFullName;
            }), dbIndex => dbIndex["INDEX_NAME"]);

            table.indices = tableIndexConstraints.map(constraint => {
                const indices = dbIndices.filter(index => index["INDEX_NAME"] === constraint["INDEX_NAME"]);
                return new TableIndex(<TableIndexOptions>{
                    table: table,
                    name: constraint["INDEX_NAME"],
                    columnNames: indices.map(i => i["COLUMN_NAME"]),
                    isUnique: constraint["IS_UNIQUE"]
                });
            });

            return table;
        }));
    }

    /**
     * Builds and returns SQL for create table.
     */
    protected createTableSql(table: Table, createForeignKeys?: boolean): string {
        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(table, column, false, true)).join(", ");
        let sql = `CREATE TABLE ${this.escapeTableName(table)} (${columnDefinitions}`;

        table.columns
            .filter(column => column.isUnique)
            .forEach(column => {
                const isUniqueExist = !!table.uniques.find(unique => {
                    return !!(unique.columnNames.length === 1 && unique.columnNames.find(columnName => columnName === column.name));
                });
                if (!isUniqueExist)
                    table.uniques.push(new TableUnique({
                        name: this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]),
                        columnNames: [column.name]
                    }));
            });

        if (table.uniques.length > 0) {
            const uniquesSql = table.uniques.map(unique => {
                const uniqueName = unique.name ? unique.name : this.connection.namingStrategy.uniqueConstraintName(table.name, unique.columnNames);
                const columnNames = unique.columnNames.map(columnName => `"${columnName}"`).join(", ");
                return `CONSTRAINT "${uniqueName}" UNIQUE (${columnNames})`;
            }).join(", ");

            sql += `, ${uniquesSql}`;
        }

        if (table.foreignKeys.length > 0 && createForeignKeys) {
            const foreignKeysSql = table.foreignKeys.map(fk => {
                const columnNames = fk.columnNames.map(columnName => `"${columnName}"`).join(", ");
                if (!fk.name)
                    fk.name = this.connection.namingStrategy.foreignKeyName(table.name, fk.columnNames);
                const referencedColumnNames = fk.referencedColumnNames.map(columnName => `"${columnName}"`).join(", ");

                let constraint = `CONSTRAINT "${fk.name}" FOREIGN KEY (${columnNames}) REFERENCES ${this.escapeTableName(fk.referencedTableName)} (${referencedColumnNames})`;
                if (fk.onDelete)
                    constraint += ` ON DELETE ${fk.onDelete}`;
                if (fk.onUpdate)
                    constraint += ` ON UPDATE ${fk.onUpdate}`;

                return constraint;
            }).join(", ");

            sql += `, ${foreignKeysSql}`;
        }

        const primaryColumns = table.columns.filter(column => column.isPrimary);
        if (primaryColumns.length > 0) {
            const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, primaryColumns.map(column => column.name));
            const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
            sql += `, CONSTRAINT "${primaryKeyName}" PRIMARY KEY (${columnNames})`;
        }

        sql += `)`;

        return sql;
    }

    /**
     * Builds drop table sql.
     */
    protected dropTableSql(tableOrName: Table|string, ifExist?: boolean): string {
        return ifExist ? `DROP TABLE IF EXISTS ${this.escapeTableName(tableOrName)}` : `DROP TABLE ${this.escapeTableName(tableOrName)}`;
    }

    /**
     * Builds create index sql.
     */
    protected createIndexSql(table: Table, index: TableIndex): string {
        const columns = index.columnNames.map(columnName => `"${columnName}"`).join(", ");
        return `CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX "${index.name}" ON ${this.escapeTableName(table)}(${columns})`;
    }

    /**
     * Builds drop index sql.
     */
    protected dropIndexSql(table: Table, indexOrName: TableIndex|string): string {
        let indexName = indexOrName instanceof TableIndex ? indexOrName.name : indexOrName;
        return `DROP INDEX "${indexName}" ON ${this.escapeTableName(table)}`;
    }

    /**
     * Builds create primary key sql.
     */
    protected createPrimaryKeySql(table: Table, columnNames: string[]): string {
        const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, columnNames);
        const columnNamesString = columnNames.map(columnName => `"${columnName}"`).join(", ");
        return `ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${primaryKeyName}" PRIMARY KEY (${columnNamesString})`;
    }

    /**
     * Builds drop primary key sql.
     */
    protected dropPrimaryKeySql(table: Table): string {
        const columnNames = table.primaryColumns.map(column => column.name);
        const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, columnNames);
        return `ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${primaryKeyName}"`;
    }

    /**
     * Builds create unique constraint sql.
     */
    protected createUniqueConstraintSql(table: Table, uniqueConstraint: TableUnique): string {
        const columnNames = uniqueConstraint.columnNames.map(column => `"` + column + `"`).join(", ");
        return `ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE (${columnNames})`;
    }

    /**
     * Builds drop unique constraint sql.
     */
    protected dropUniqueConstraintSql(table: Table, uniqueOrName: TableUnique|string): string {
        const uniqueName = uniqueOrName instanceof TableUnique ? uniqueOrName.name : uniqueOrName;
        return `ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${uniqueName}"`;
    }

    /**
     * Builds create foreign key sql.
     */
    protected createForeignKeySql(table: Table, foreignKey: TableForeignKey): string {
        const columnNames = foreignKey.columnNames.map(column => `"` + column + `"`).join(", ");
        const referencedColumnNames = foreignKey.referencedColumnNames.map(column => `"` + column + `"`).join(",");
        let sql = `ALTER TABLE ${this.escapeTableName(table)} ADD CONSTRAINT "${foreignKey.name}" FOREIGN KEY (${columnNames}) ` +
            `REFERENCES ${this.escapeTableName(foreignKey.referencedTableName)}(${referencedColumnNames})`;
        if (foreignKey.onDelete)
            sql += ` ON DELETE ${foreignKey.onDelete}`;
        if (foreignKey.onUpdate)
            sql += ` ON UPDATE ${foreignKey.onUpdate}`;

        return sql;
    }

    /**
     * Builds drop foreign key sql.
     */
    protected dropForeignKeySql(table: Table, foreignKeyOrName: TableForeignKey|string): string {
        const foreignKeyName = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName.name : foreignKeyOrName;
        return `ALTER TABLE ${this.escapeTableName(table)} DROP CONSTRAINT "${foreignKeyName}"`;
    }

    /**
     * Escapes given table path.
     */
    protected escapeTableName(tableOrName: Table|string, disableEscape?: boolean): string {
        let name = tableOrName instanceof Table ? tableOrName.name : tableOrName;
        if (this.driver.options.schema) {
            if (name.indexOf(".") === -1) {
                name = `${this.driver.options.schema}.${name}`;
            } else if (name.split(".").length === 3) {
                const splittedName = name.split(".");
                const dbName = splittedName[0];
                const tableName = splittedName[2];
                name = `${dbName}.${this.driver.options.schema}.${tableName}`;
            }
        }

        return name.split(".").map(i => {
            // this condition need because when custom database name was specified and schema name was not, we got `dbName..tableName` string, and doesn't need to escape middle empty string
            if (i === "")
                return i;
            return disableEscape ? i : `"${i}"`;
        }).join(".");
    }

    protected parseTableName(target: Table|string): any {
        const tableName = target instanceof Table ? target.name : target;
        if (tableName.split(".").length === 3) {
            return {
                database:  tableName.split(".")[0],
                schema:  tableName.split(".")[1] === "" ? "SCHEMA_NAME()" : tableName.split(".")[1],
                tableName: tableName.split(".")[2]
            };
        } else if (tableName.split(".").length === 2) {
            return {
                database:  this.driver.database,
                schema: tableName.split(".")[0],
                tableName: tableName.split(".")[1]
            };
        } else {
            return {
                database:  this.driver.database,
                schema: this.driver.options.schema ? this.driver.options.schema : "SCHEMA_NAME()",
                tableName: tableName
            };
        }
    }

    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    protected parametrize(objectLiteral: ObjectLiteral, startFrom: number = 0): string[] {
        return Object.keys(objectLiteral).map((key, index) => {
            return `"${key}"` + "=@" + (startFrom + index);
        });
    }

    /**
     * Builds a query for create column.
     */
    protected buildCreateColumnSql(table: Table, column: TableColumn, skipIdentity: boolean, createDefault: boolean) {
        let c = `"${column.name}" ${this.connection.driver.createFullType(column)}`;
        if (column.collation)
            c += " COLLATE " + column.collation;

        if (column.isNullable !== true)
            c += " NOT NULL";

        if (column.isGenerated === true && column.generationStrategy === "increment" && !skipIdentity) // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " IDENTITY(1,1)";

        if (column.default !== undefined && column.default !== null && createDefault) {
            // we create named constraint to be able to delete this constraint when column been dropped
            const defaultName = this.connection.namingStrategy.defaultConstraintName(table.name, column.name);
            c += ` CONSTRAINT "${defaultName}" DEFAULT ${column.default}`;
        }

        if (column.isGenerated && column.generationStrategy === "uuid" && !column.default) {
            // we create named constraint to be able to delete this constraint when column been dropped
            const defaultName = this.connection.namingStrategy.defaultConstraintName(table.name, column.name);
            c += ` CONSTRAINT "${defaultName}" DEFAULT NEWSEQUENTIALID()`;
        }
        return c;
    }

    /**
     * Converts MssqlParameter into real mssql parameter type.
     */
    protected mssqlParameterToNativeParameter(parameter: MssqlParameter): any {
        switch (this.driver.normalizeType({ type: parameter.type as any })) {
            case "bit":
                return this.driver.mssql.Bit;
            case "bigint":
                return this.driver.mssql.BigInt;
            case "decimal":
                return this.driver.mssql.Decimal(...parameter.params);
            case "float":
                return this.driver.mssql.Float;
            case "int":
                return this.driver.mssql.Int;
            case "money":
                return this.driver.mssql.Money;
            case "numeric":
                return this.driver.mssql.Numeric(...parameter.params);
            case "smallint":
                return this.driver.mssql.SmallInt;
            case "smallmoney":
                return this.driver.mssql.SmallMoney;
            case "real":
                return this.driver.mssql.Real;
            case "tinyint":
                return this.driver.mssql.TinyInt;
            case "char":
                return this.driver.mssql.Char(...parameter.params);
            case "nchar":
                return this.driver.mssql.NChar(...parameter.params);
            case "text":
                return this.driver.mssql.Text;
            case "ntext":
                return this.driver.mssql.Ntext;
            case "varchar":
                return this.driver.mssql.VarChar(...parameter.params);
            case "nvarchar":
                return this.driver.mssql.NVarChar(...parameter.params);
            case "xml":
                return this.driver.mssql.Xml;
            case "time":
                return this.driver.mssql.Time(...parameter.params);
            case "date":
                return this.driver.mssql.Date;
            case "datetime":
                return this.driver.mssql.DateTime;
            case "datetime2":
                return this.driver.mssql.DateTime2(...parameter.params);
            case "datetimeoffset":
                return this.driver.mssql.DateTimeOffset(...parameter.params);
            case "smalldatetime":
                return this.driver.mssql.SmallDateTime;
            case "uniqueidentifier":
                return this.driver.mssql.UniqueIdentifier;
            case "variant":
                return this.driver.mssql.Variant;
            case "binary":
                return this.driver.mssql.Binary;
            case "varbinary":
                return this.driver.mssql.VarBinary(...parameter.params);
            case "image":
                return this.driver.mssql.Image;
            case "udt":
                return this.driver.mssql.UDT;
            case "geography":
                return this.driver.mssql.Geography;
            case "geometry":
                return this.driver.mssql.Geometry;
        }
    }

}