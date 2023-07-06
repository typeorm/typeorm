"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlServerQueryRunner = void 0;
const tslib_1 = require("tslib");
const QueryFailedError_1 = require("../../error/QueryFailedError");
const QueryRunnerAlreadyReleasedError_1 = require("../../error/QueryRunnerAlreadyReleasedError");
const TransactionAlreadyStartedError_1 = require("../../error/TransactionAlreadyStartedError");
const TransactionNotStartedError_1 = require("../../error/TransactionNotStartedError");
const BaseQueryRunner_1 = require("../../query-runner/BaseQueryRunner");
const Table_1 = require("../../schema-builder/table/Table");
const TableCheck_1 = require("../../schema-builder/table/TableCheck");
const TableColumn_1 = require("../../schema-builder/table/TableColumn");
const TableForeignKey_1 = require("../../schema-builder/table/TableForeignKey");
const TableIndex_1 = require("../../schema-builder/table/TableIndex");
const TableUnique_1 = require("../../schema-builder/table/TableUnique");
const View_1 = require("../../schema-builder/view/View");
const Broadcaster_1 = require("../../subscriber/Broadcaster");
const OrmUtils_1 = require("../../util/OrmUtils");
const Query_1 = require("../Query");
const MssqlParameter_1 = require("./MssqlParameter");
const BroadcasterResult_1 = require("../../subscriber/BroadcasterResult");
/**
 * Runs queries on a single SQL Server database connection.
 */
class SqlServerQueryRunner extends BaseQueryRunner_1.BaseQueryRunner {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(driver, mode) {
        super();
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
        this.queryResponsibilityChain = [];
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster_1.Broadcaster(this);
        this.mode = mode;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates/uses database connection from the connection pool to perform further operations.
     * Returns obtained database connection.
     */
    connect() {
        return Promise.resolve();
    }
    /**
     * Releases used database connection.
     * You cannot use query runner methods once its released.
     */
    release() {
        this.isReleased = true;
        return Promise.resolve();
    }
    /**
     * Starts transaction.
     */
    startTransaction(isolationLevel) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.isReleased)
                throw new QueryRunnerAlreadyReleasedError_1.QueryRunnerAlreadyReleasedError();
            if (this.isTransactionActive)
                throw new TransactionAlreadyStartedError_1.TransactionAlreadyStartedError();
            const beforeBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
            this.broadcaster.broadcastBeforeTransactionStartEvent(beforeBroadcastResult);
            if (beforeBroadcastResult.promises.length > 0)
                yield Promise.all(beforeBroadcastResult.promises);
            return new Promise((ok, fail) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.isTransactionActive = true;
                const pool = yield (this.mode === "slave" ? this.driver.obtainSlaveConnection() : this.driver.obtainMasterConnection());
                this.databaseConnection = pool.transaction();
                const transactionCallback = (err) => {
                    if (err) {
                        this.isTransactionActive = false;
                        return fail(err);
                    }
                    ok();
                    this.connection.logger.logQuery("BEGIN TRANSACTION");
                    if (isolationLevel) {
                        this.connection.logger.logQuery("SET TRANSACTION ISOLATION LEVEL " + isolationLevel);
                    }
                };
                if (isolationLevel) {
                    this.databaseConnection.begin(this.convertIsolationLevel(isolationLevel), transactionCallback);
                }
                else {
                    this.databaseConnection.begin(transactionCallback);
                }
                const afterBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
                this.broadcaster.broadcastAfterTransactionStartEvent(afterBroadcastResult);
                if (afterBroadcastResult.promises.length > 0)
                    yield Promise.all(afterBroadcastResult.promises);
            }));
        });
    }
    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    commitTransaction() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.isReleased)
                throw new QueryRunnerAlreadyReleasedError_1.QueryRunnerAlreadyReleasedError();
            if (!this.isTransactionActive)
                throw new TransactionNotStartedError_1.TransactionNotStartedError();
            const beforeBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
            this.broadcaster.broadcastBeforeTransactionCommitEvent(beforeBroadcastResult);
            if (beforeBroadcastResult.promises.length > 0)
                yield Promise.all(beforeBroadcastResult.promises);
            return new Promise((ok, fail) => {
                this.databaseConnection.commit((err) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    if (err)
                        return fail(err);
                    this.isTransactionActive = false;
                    this.databaseConnection = null;
                    const afterBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
                    this.broadcaster.broadcastAfterTransactionCommitEvent(afterBroadcastResult);
                    if (afterBroadcastResult.promises.length > 0)
                        yield Promise.all(afterBroadcastResult.promises);
                    ok();
                    this.connection.logger.logQuery("COMMIT");
                }));
            });
        });
    }
    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    rollbackTransaction() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.isReleased)
                throw new QueryRunnerAlreadyReleasedError_1.QueryRunnerAlreadyReleasedError();
            if (!this.isTransactionActive)
                throw new TransactionNotStartedError_1.TransactionNotStartedError();
            const beforeBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
            this.broadcaster.broadcastBeforeTransactionRollbackEvent(beforeBroadcastResult);
            if (beforeBroadcastResult.promises.length > 0)
                yield Promise.all(beforeBroadcastResult.promises);
            return new Promise((ok, fail) => {
                this.databaseConnection.rollback((err) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    if (err)
                        return fail(err);
                    this.isTransactionActive = false;
                    this.databaseConnection = null;
                    const afterBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
                    this.broadcaster.broadcastAfterTransactionRollbackEvent(afterBroadcastResult);
                    if (afterBroadcastResult.promises.length > 0)
                        yield Promise.all(afterBroadcastResult.promises);
                    ok();
                    this.connection.logger.logQuery("ROLLBACK");
                }));
            });
        });
    }
    /**
     * Executes a given SQL query.
     */
    query(query, parameters) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.isReleased)
                throw new QueryRunnerAlreadyReleasedError_1.QueryRunnerAlreadyReleasedError();
            let waitingOkay;
            const waitingPromise = new Promise((ok) => waitingOkay = ok);
            if (this.queryResponsibilityChain.length) {
                const otherWaitingPromises = [...this.queryResponsibilityChain];
                this.queryResponsibilityChain.push(waitingPromise);
                yield Promise.all(otherWaitingPromises);
            }
            const promise = new Promise((ok, fail) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                try {
                    this.driver.connection.logger.logQuery(query, parameters, this);
                    const pool = yield (this.mode === "slave" ? this.driver.obtainSlaveConnection() : this.driver.obtainMasterConnection());
                    const request = new this.driver.mssql.Request(this.isTransactionActive ? this.databaseConnection : pool);
                    if (parameters && parameters.length) {
                        parameters.forEach((parameter, index) => {
                            const parameterName = index.toString();
                            if (parameter instanceof MssqlParameter_1.MssqlParameter) {
                                const mssqlParameter = this.mssqlParameterToNativeParameter(parameter);
                                if (mssqlParameter) {
                                    request.input(parameterName, mssqlParameter, parameter.value);
                                }
                                else {
                                    request.input(parameterName, parameter.value);
                                }
                            }
                            else {
                                request.input(parameterName, parameter);
                            }
                        });
                    }
                    const queryStartTime = +new Date();
                    request.query(query, (err, result) => {
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
                            return fail(new QueryFailedError_1.QueryFailedError(query, parameters, err));
                        }
                        const queryType = query.slice(0, query.indexOf(" "));
                        switch (queryType) {
                            case "DELETE":
                                // for DELETE query additionally return number of affected rows
                                ok([result.recordset, result.rowsAffected[0]]);
                                break;
                            default:
                                ok(result.recordset);
                        }
                        resolveChain();
                    });
                }
                catch (err) {
                    fail(err);
                }
            }));
            // with this condition, Promise.all causes unexpected behavior.
            // if (this.isTransactionActive)
            this.queryResponsibilityChain.push(promise);
            return promise;
        });
    }
    /**
     * Returns raw data stream.
     */
    stream(query, parameters, onEnd, onError) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.isReleased)
                throw new QueryRunnerAlreadyReleasedError_1.QueryRunnerAlreadyReleasedError();
            let waitingOkay;
            const waitingPromise = new Promise((ok) => waitingOkay = ok);
            if (this.queryResponsibilityChain.length) {
                const otherWaitingPromises = [...this.queryResponsibilityChain];
                this.queryResponsibilityChain.push(waitingPromise);
                yield Promise.all(otherWaitingPromises);
            }
            const promise = new Promise((ok, fail) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                this.driver.connection.logger.logQuery(query, parameters, this);
                const pool = yield (this.mode === "slave" ? this.driver.obtainSlaveConnection() : this.driver.obtainMasterConnection());
                const request = new this.driver.mssql.Request(this.isTransactionActive ? this.databaseConnection : pool);
                request.stream = true;
                if (parameters && parameters.length) {
                    parameters.forEach((parameter, index) => {
                        const parameterName = index.toString();
                        if (parameter instanceof MssqlParameter_1.MssqlParameter) {
                            request.input(parameterName, this.mssqlParameterToNativeParameter(parameter), parameter.value);
                        }
                        else {
                            request.input(parameterName, parameter);
                        }
                    });
                }
                request.query(query, (err, result) => {
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
                if (onEnd)
                    request.on("done", onEnd);
                if (onError)
                    request.on("error", onError);
                ok(request);
            }));
            if (this.isTransactionActive)
                this.queryResponsibilityChain.push(promise);
            return promise;
        });
    }
    /**
     * Returns all available database names including system databases.
     */
    getDatabases() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const results = yield this.query(`EXEC sp_databases`);
            return results.map(result => result["DATABASE_NAME"]);
        });
    }
    /**
     * Returns all available schema names including system schemas.
     * If database parameter specified, returns schemas of that database.
     */
    getSchemas(database) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const query = database ? `SELECT * FROM "${database}"."sys"."schema"` : `SELECT * FROM "sys"."schemas"`;
            const results = yield this.query(query);
            return results.map(result => result["name"]);
        });
    }
    /**
     * Checks if database with the given name exist.
     */
    hasDatabase(database) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const result = yield this.query(`SELECT DB_ID('${database}') as "db_id"`);
            const dbId = result[0]["db_id"];
            return !!dbId;
        });
    }
    /**
     * Checks if schema with the given name exist.
     */
    hasSchema(schema) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const result = yield this.query(`SELECT SCHEMA_ID('${schema}') as "schema_id"`);
            const schemaId = result[0]["schema_id"];
            return !!schemaId;
        });
    }
    /**
     * Checks if table with the given name exist in the database.
     */
    hasTable(tableOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const parsedTableName = this.parseTableName(tableOrName);
            const schema = parsedTableName.schema === "SCHEMA_NAME()" ? parsedTableName.schema : `'${parsedTableName.schema}'`;
            const sql = `SELECT * FROM "${parsedTableName.database}"."INFORMATION_SCHEMA"."TABLES" WHERE "TABLE_NAME" = '${parsedTableName.name}' AND "TABLE_SCHEMA" = ${schema}`;
            const result = yield this.query(sql);
            return result.length ? true : false;
        });
    }
    /**
     * Checks if column exist in the table.
     */
    hasColumn(tableOrName, columnName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const parsedTableName = this.parseTableName(tableOrName);
            const schema = parsedTableName.schema === "SCHEMA_NAME()" ? parsedTableName.schema : `'${parsedTableName.schema}'`;
            const sql = `SELECT * FROM "${parsedTableName.database}"."INFORMATION_SCHEMA"."COLUMNS" WHERE "TABLE_NAME" = '${parsedTableName.name}' AND "COLUMN_NAME" = '${columnName}' AND "TABLE_SCHEMA" = ${schema}`;
            const result = yield this.query(sql);
            return result.length ? true : false;
        });
    }
    /**
     * Creates a new database.
     */
    createDatabase(database, ifNotExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const up = ifNotExist ? `IF DB_ID('${database}') IS NULL CREATE DATABASE "${database}"` : `CREATE DATABASE "${database}"`;
            const down = `DROP DATABASE "${database}"`;
            yield this.executeQueries(new Query_1.Query(up), new Query_1.Query(down));
        });
    }
    /**
     * Drops database.
     */
    dropDatabase(database, ifExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const up = ifExist ? `IF DB_ID('${database}') IS NOT NULL DROP DATABASE "${database}"` : `DROP DATABASE "${database}"`;
            const down = `CREATE DATABASE "${database}"`;
            yield this.executeQueries(new Query_1.Query(up), new Query_1.Query(down));
        });
    }
    /**
     * Creates table schema.
     * If database name also specified (e.g. 'dbName.schemaName') schema will be created in specified database.
     */
    createSchema(schemaPath, ifNotExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const upQueries = [];
            const downQueries = [];
            if (schemaPath.indexOf(".") === -1) {
                const upQuery = ifNotExist ? `IF SCHEMA_ID('${schemaPath}') IS NULL BEGIN EXEC ('CREATE SCHEMA "${schemaPath}"') END` : `CREATE SCHEMA "${schemaPath}"`;
                upQueries.push(new Query_1.Query(upQuery));
                downQueries.push(new Query_1.Query(`DROP SCHEMA "${schemaPath}"`));
            }
            else {
                const dbName = schemaPath.split(".")[0];
                const schema = schemaPath.split(".")[1];
                const currentDB = yield this.getCurrentDatabase();
                upQueries.push(new Query_1.Query(`USE "${dbName}"`));
                downQueries.push(new Query_1.Query(`USE "${currentDB}"`));
                const upQuery = ifNotExist ? `IF SCHEMA_ID('${schema}') IS NULL BEGIN EXEC ('CREATE SCHEMA "${schema}"') END` : `CREATE SCHEMA "${schema}"`;
                upQueries.push(new Query_1.Query(upQuery));
                downQueries.push(new Query_1.Query(`DROP SCHEMA "${schema}"`));
                upQueries.push(new Query_1.Query(`USE "${currentDB}"`));
                downQueries.push(new Query_1.Query(`USE "${dbName}"`));
            }
            yield this.executeQueries(upQueries, downQueries);
        });
    }
    /**
     * Drops table schema.
     * If database name also specified (e.g. 'dbName.schemaName') schema will be dropped in specified database.
     */
    dropSchema(schemaPath, ifExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const upQueries = [];
            const downQueries = [];
            if (schemaPath.indexOf(".") === -1) {
                const upQuery = ifExist ? `IF SCHEMA_ID('${schemaPath}') IS NULL BEGIN EXEC ('DROP SCHEMA "${schemaPath}"') END` : `DROP SCHEMA "${schemaPath}"`;
                upQueries.push(new Query_1.Query(upQuery));
                downQueries.push(new Query_1.Query(`CREATE SCHEMA "${schemaPath}"`));
            }
            else {
                const dbName = schemaPath.split(".")[0];
                const schema = schemaPath.split(".")[1];
                const currentDB = yield this.getCurrentDatabase();
                upQueries.push(new Query_1.Query(`USE "${dbName}"`));
                downQueries.push(new Query_1.Query(`USE "${currentDB}"`));
                const upQuery = ifExist ? `IF SCHEMA_ID('${schema}') IS NULL BEGIN EXEC ('DROP SCHEMA "${schema}"') END` : `DROP SCHEMA "${schema}"`;
                upQueries.push(new Query_1.Query(upQuery));
                downQueries.push(new Query_1.Query(`CREATE SCHEMA "${schema}"`));
                upQueries.push(new Query_1.Query(`USE "${currentDB}"`));
                downQueries.push(new Query_1.Query(`USE "${dbName}"`));
            }
            yield this.executeQueries(upQueries, downQueries);
        });
    }
    /**
     * Creates a new table.
     */
    createTable(table, ifNotExist = false, createForeignKeys = true, createIndices = true) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (ifNotExist) {
                const isTableExist = yield this.hasTable(table);
                if (isTableExist)
                    return Promise.resolve();
            }
            const upQueries = [];
            const downQueries = [];
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
                        index.name = this.connection.namingStrategy.indexName(table.name, index.columnNames, index.where);
                    upQueries.push(this.createIndexSql(table, index));
                    downQueries.push(this.dropIndexSql(table, index));
                });
            }
            yield this.executeQueries(upQueries, downQueries);
        });
    }
    /**
     * Drops the table.
     */
    dropTable(tableOrName, ifExist, dropForeignKeys = true, dropIndices = true) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (ifExist) {
                const isTableExist = yield this.hasTable(tableOrName);
                if (!isTableExist)
                    return Promise.resolve();
            }
            // if dropTable called with dropForeignKeys = true, we must create foreign keys in down query.
            const createForeignKeys = dropForeignKeys;
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const upQueries = [];
            const downQueries = [];
            // It needs because if table does not exist and dropForeignKeys or dropIndices is true, we don't need
            // to perform drop queries for foreign keys and indices.
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
            yield this.executeQueries(upQueries, downQueries);
        });
    }
    /**
     * Creates a new view.
     */
    createView(view) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const upQueries = [];
            const downQueries = [];
            upQueries.push(this.createViewSql(view));
            upQueries.push(yield this.insertViewDefinitionSql(view));
            downQueries.push(this.dropViewSql(view));
            downQueries.push(yield this.deleteViewDefinitionSql(view));
            yield this.executeQueries(upQueries, downQueries);
        });
    }
    /**
     * Drops the view.
     */
    dropView(target) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const viewName = target instanceof View_1.View ? target.name : target;
            const view = yield this.getCachedView(viewName);
            const upQueries = [];
            const downQueries = [];
            upQueries.push(yield this.deleteViewDefinitionSql(view));
            upQueries.push(this.dropViewSql(view));
            downQueries.push(yield this.insertViewDefinitionSql(view));
            downQueries.push(this.createViewSql(view));
            yield this.executeQueries(upQueries, downQueries);
        });
    }
    /**
     * Renames a table.
     */
    renameTable(oldTableOrName, newTableName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const upQueries = [];
            const downQueries = [];
            const oldTable = oldTableOrName instanceof Table_1.Table ? oldTableOrName : yield this.getCachedTable(oldTableOrName);
            let newTable = oldTable.clone();
            // we need database name and schema name to rename FK constraints
            let dbName = undefined;
            let schemaName = undefined;
            let oldTableName = oldTable.name;
            const splittedName = oldTable.name.split(".");
            if (splittedName.length === 3) {
                dbName = splittedName[0];
                oldTableName = splittedName[2];
                if (splittedName[1] !== "")
                    schemaName = splittedName[1];
            }
            else if (splittedName.length === 2) {
                schemaName = splittedName[0];
                oldTableName = splittedName[1];
            }
            newTable.name = this.driver.buildTableName(newTableName, schemaName, dbName);
            // if we have tables with database which differs from database specified in config, we must change currently used database.
            // This need because we can not rename objects from another database.
            const currentDB = yield this.getCurrentDatabase();
            if (dbName && dbName !== currentDB) {
                upQueries.push(new Query_1.Query(`USE "${dbName}"`));
                downQueries.push(new Query_1.Query(`USE "${currentDB}"`));
            }
            // rename table
            upQueries.push(new Query_1.Query(`EXEC sp_rename "${this.escapePath(oldTable, true)}", "${newTableName}"`));
            downQueries.push(new Query_1.Query(`EXEC sp_rename "${this.escapePath(newTable, true)}", "${oldTableName}"`));
            // rename primary key constraint
            if (newTable.primaryColumns.length > 0) {
                const columnNames = newTable.primaryColumns.map(column => column.name);
                const oldPkName = this.connection.namingStrategy.primaryKeyName(oldTable, columnNames);
                const newPkName = this.connection.namingStrategy.primaryKeyName(newTable, columnNames);
                // rename primary constraint
                upQueries.push(new Query_1.Query(`EXEC sp_rename "${this.escapePath(newTable, true)}.${oldPkName}", "${newPkName}"`));
                downQueries.push(new Query_1.Query(`EXEC sp_rename "${this.escapePath(newTable, true)}.${newPkName}", "${oldPkName}"`));
            }
            // rename unique constraints
            newTable.uniques.forEach(unique => {
                // build new constraint name
                const newUniqueName = this.connection.namingStrategy.uniqueConstraintName(newTable, unique.columnNames);
                // build queries
                upQueries.push(new Query_1.Query(`EXEC sp_rename "${this.escapePath(newTable, true)}.${unique.name}", "${newUniqueName}"`));
                downQueries.push(new Query_1.Query(`EXEC sp_rename "${this.escapePath(newTable, true)}.${newUniqueName}", "${unique.name}"`));
                // replace constraint name
                unique.name = newUniqueName;
            });
            // rename index constraints
            newTable.indices.forEach(index => {
                // build new constraint name
                const newIndexName = this.connection.namingStrategy.indexName(newTable, index.columnNames, index.where);
                // build queries
                upQueries.push(new Query_1.Query(`EXEC sp_rename "${this.escapePath(newTable, true)}.${index.name}", "${newIndexName}", "INDEX"`));
                downQueries.push(new Query_1.Query(`EXEC sp_rename "${this.escapePath(newTable, true)}.${newIndexName}", "${index.name}", "INDEX"`));
                // replace constraint name
                index.name = newIndexName;
            });
            // rename foreign key constraints
            newTable.foreignKeys.forEach(foreignKey => {
                // build new constraint name
                const newForeignKeyName = this.connection.namingStrategy.foreignKeyName(newTable, foreignKey.columnNames, foreignKey.referencedTableName, foreignKey.referencedColumnNames);
                // build queries
                upQueries.push(new Query_1.Query(`EXEC sp_rename "${this.buildForeignKeyName(foreignKey.name, schemaName, dbName)}", "${newForeignKeyName}"`));
                downQueries.push(new Query_1.Query(`EXEC sp_rename "${this.buildForeignKeyName(newForeignKeyName, schemaName, dbName)}", "${foreignKey.name}"`));
                // replace constraint name
                foreignKey.name = newForeignKeyName;
            });
            // change currently used database back to default db.
            if (dbName && dbName !== currentDB) {
                upQueries.push(new Query_1.Query(`USE "${currentDB}"`));
                downQueries.push(new Query_1.Query(`USE "${dbName}"`));
            }
            yield this.executeQueries(upQueries, downQueries);
            // rename old table and replace it in cached tabled;
            oldTable.name = newTable.name;
            this.replaceCachedTable(oldTable, newTable);
        });
    }
    /**
     * Creates a new column from the column in the table.
     */
    addColumn(tableOrName, column) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const clonedTable = table.clone();
            const upQueries = [];
            const downQueries = [];
            upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD ${this.buildCreateColumnSql(table, column, false, true)}`));
            downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP COLUMN "${column.name}"`));
            // create or update primary key constraint
            if (column.isPrimary) {
                const primaryColumns = clonedTable.primaryColumns;
                // if table already have primary key, me must drop it and recreate again
                if (primaryColumns.length > 0) {
                    const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                    const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                    upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${pkName}"`));
                    downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                }
                primaryColumns.push(column);
                const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${pkName}"`));
            }
            // create column index
            const columnIndex = clonedTable.indices.find(index => index.columnNames.length === 1 && index.columnNames[0] === column.name);
            if (columnIndex) {
                upQueries.push(this.createIndexSql(table, columnIndex));
                downQueries.push(this.dropIndexSql(table, columnIndex));
            }
            // create unique constraint
            if (column.isUnique) {
                const uniqueConstraint = new TableUnique_1.TableUnique({
                    name: this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]),
                    columnNames: [column.name]
                });
                clonedTable.uniques.push(uniqueConstraint);
                upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE ("${column.name}")`));
                downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${uniqueConstraint.name}"`));
            }
            // remove default constraint
            if (column.default !== null && column.default !== undefined) {
                const defaultName = this.connection.namingStrategy.defaultConstraintName(table.name, column.name);
                downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${defaultName}"`));
            }
            yield this.executeQueries(upQueries, downQueries);
            clonedTable.addColumn(column);
            this.replaceCachedTable(table, clonedTable);
        });
    }
    /**
     * Creates a new columns from the column in the table.
     */
    addColumns(tableOrName, columns) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const column of columns) {
                yield this.addColumn(tableOrName, column);
            }
        });
    }
    /**
     * Renames column in the given table.
     */
    renameColumn(tableOrName, oldTableColumnOrName, newTableColumnOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const oldColumn = oldTableColumnOrName instanceof TableColumn_1.TableColumn ? oldTableColumnOrName : table.columns.find(c => c.name === oldTableColumnOrName);
            if (!oldColumn)
                throw new Error(`Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`);
            let newColumn = undefined;
            if (newTableColumnOrName instanceof TableColumn_1.TableColumn) {
                newColumn = newTableColumnOrName;
            }
            else {
                newColumn = oldColumn.clone();
                newColumn.name = newTableColumnOrName;
            }
            yield this.changeColumn(table, oldColumn, newColumn);
        });
    }
    /**
     * Changes a column in the table.
     */
    changeColumn(tableOrName, oldTableColumnOrName, newColumn) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            let clonedTable = table.clone();
            const upQueries = [];
            const downQueries = [];
            const oldColumn = oldTableColumnOrName instanceof TableColumn_1.TableColumn
                ? oldTableColumnOrName
                : table.columns.find(column => column.name === oldTableColumnOrName);
            if (!oldColumn)
                throw new Error(`Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`);
            if ((newColumn.isGenerated !== oldColumn.isGenerated && newColumn.generationStrategy !== "uuid") || newColumn.type !== oldColumn.type || newColumn.length !== oldColumn.length) {
                // SQL Server does not support changing of IDENTITY column, so we must drop column and recreate it again.
                // Also, we recreate column if column type changed
                yield this.dropColumn(table, oldColumn);
                yield this.addColumn(table, newColumn);
                // update cloned table
                clonedTable = table.clone();
            }
            else {
                if (newColumn.name !== oldColumn.name) {
                    // we need database name and schema name to rename FK constraints
                    let dbName = undefined;
                    let schemaName = undefined;
                    const splittedName = table.name.split(".");
                    if (splittedName.length === 3) {
                        dbName = splittedName[0];
                        if (splittedName[1] !== "")
                            schemaName = splittedName[1];
                    }
                    else if (splittedName.length === 2) {
                        schemaName = splittedName[0];
                    }
                    // if we have tables with database which differs from database specified in config, we must change currently used database.
                    // This need because we can not rename objects from another database.
                    const currentDB = yield this.getCurrentDatabase();
                    if (dbName && dbName !== currentDB) {
                        upQueries.push(new Query_1.Query(`USE "${dbName}"`));
                        downQueries.push(new Query_1.Query(`USE "${currentDB}"`));
                    }
                    // rename the column
                    upQueries.push(new Query_1.Query(`EXEC sp_rename "${this.escapePath(table, true)}.${oldColumn.name}", "${newColumn.name}"`));
                    downQueries.push(new Query_1.Query(`EXEC sp_rename "${this.escapePath(table, true)}.${newColumn.name}", "${oldColumn.name}"`));
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
                        upQueries.push(new Query_1.Query(`EXEC sp_rename "${this.escapePath(clonedTable, true)}.${oldPkName}", "${newPkName}"`));
                        downQueries.push(new Query_1.Query(`EXEC sp_rename "${this.escapePath(clonedTable, true)}.${newPkName}", "${oldPkName}"`));
                    }
                    // rename index constraints
                    clonedTable.findColumnIndices(oldColumn).forEach(index => {
                        // build new constraint name
                        index.columnNames.splice(index.columnNames.indexOf(oldColumn.name), 1);
                        index.columnNames.push(newColumn.name);
                        const newIndexName = this.connection.namingStrategy.indexName(clonedTable, index.columnNames, index.where);
                        // build queries
                        upQueries.push(new Query_1.Query(`EXEC sp_rename "${this.escapePath(clonedTable, true)}.${index.name}", "${newIndexName}", "INDEX"`));
                        downQueries.push(new Query_1.Query(`EXEC sp_rename "${this.escapePath(clonedTable, true)}.${newIndexName}", "${index.name}", "INDEX"`));
                        // replace constraint name
                        index.name = newIndexName;
                    });
                    // rename foreign key constraints
                    clonedTable.findColumnForeignKeys(oldColumn).forEach(foreignKey => {
                        // build new constraint name
                        foreignKey.columnNames.splice(foreignKey.columnNames.indexOf(oldColumn.name), 1);
                        foreignKey.columnNames.push(newColumn.name);
                        const newForeignKeyName = this.connection.namingStrategy.foreignKeyName(clonedTable, foreignKey.columnNames, foreignKey.referencedTableName, foreignKey.referencedColumnNames);
                        // build queries
                        upQueries.push(new Query_1.Query(`EXEC sp_rename "${this.buildForeignKeyName(foreignKey.name, schemaName, dbName)}", "${newForeignKeyName}"`));
                        downQueries.push(new Query_1.Query(`EXEC sp_rename "${this.buildForeignKeyName(newForeignKeyName, schemaName, dbName)}", "${foreignKey.name}"`));
                        // replace constraint name
                        foreignKey.name = newForeignKeyName;
                    });
                    // rename check constraints
                    clonedTable.findColumnChecks(oldColumn).forEach(check => {
                        // build new constraint name
                        check.columnNames.splice(check.columnNames.indexOf(oldColumn.name), 1);
                        check.columnNames.push(newColumn.name);
                        const newCheckName = this.connection.namingStrategy.checkConstraintName(clonedTable, check.expression);
                        // build queries
                        upQueries.push(new Query_1.Query(`EXEC sp_rename "${this.escapePath(clonedTable, true)}.${check.name}", "${newCheckName}"`));
                        downQueries.push(new Query_1.Query(`EXEC sp_rename "${this.escapePath(clonedTable, true)}.${newCheckName}", "${check.name}"`));
                        // replace constraint name
                        check.name = newCheckName;
                    });
                    // rename unique constraints
                    clonedTable.findColumnUniques(oldColumn).forEach(unique => {
                        // build new constraint name
                        unique.columnNames.splice(unique.columnNames.indexOf(oldColumn.name), 1);
                        unique.columnNames.push(newColumn.name);
                        const newUniqueName = this.connection.namingStrategy.uniqueConstraintName(clonedTable, unique.columnNames);
                        // build queries
                        upQueries.push(new Query_1.Query(`EXEC sp_rename "${this.escapePath(clonedTable, true)}.${unique.name}", "${newUniqueName}"`));
                        downQueries.push(new Query_1.Query(`EXEC sp_rename "${this.escapePath(clonedTable, true)}.${newUniqueName}", "${unique.name}"`));
                        // replace constraint name
                        unique.name = newUniqueName;
                    });
                    // rename default constraints
                    if (oldColumn.default !== null && oldColumn.default !== undefined) {
                        const oldDefaultName = this.connection.namingStrategy.defaultConstraintName(table.name, oldColumn.name);
                        const newDefaultName = this.connection.namingStrategy.defaultConstraintName(table.name, newColumn.name);
                        upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${oldDefaultName}"`));
                        downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${oldDefaultName}" DEFAULT ${oldColumn.default} FOR "${newColumn.name}"`));
                        upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${newDefaultName}" DEFAULT ${oldColumn.default} FOR "${newColumn.name}"`));
                        downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${newDefaultName}"`));
                    }
                    // change currently used database back to default db.
                    if (dbName && dbName !== currentDB) {
                        upQueries.push(new Query_1.Query(`USE "${currentDB}"`));
                        downQueries.push(new Query_1.Query(`USE "${dbName}"`));
                    }
                    // rename old column in the Table object
                    const oldTableColumn = clonedTable.columns.find(column => column.name === oldColumn.name);
                    clonedTable.columns[clonedTable.columns.indexOf(oldTableColumn)].name = newColumn.name;
                    oldColumn.name = newColumn.name;
                }
                if (this.isColumnChanged(oldColumn, newColumn, false)) {
                    upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ALTER COLUMN ${this.buildCreateColumnSql(table, newColumn, true, false)}`));
                    downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ALTER COLUMN ${this.buildCreateColumnSql(table, oldColumn, true, false)}`));
                }
                if (newColumn.isPrimary !== oldColumn.isPrimary) {
                    const primaryColumns = clonedTable.primaryColumns;
                    // if primary column state changed, we must always drop existed constraint.
                    if (primaryColumns.length > 0) {
                        const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                        const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                        upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${pkName}"`));
                        downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                    }
                    if (newColumn.isPrimary === true) {
                        primaryColumns.push(newColumn);
                        // update column in table
                        const column = clonedTable.columns.find(column => column.name === newColumn.name);
                        column.isPrimary = true;
                        const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                        const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                        upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                        downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${pkName}"`));
                    }
                    else {
                        const primaryColumn = primaryColumns.find(c => c.name === newColumn.name);
                        primaryColumns.splice(primaryColumns.indexOf(primaryColumn), 1);
                        // update column in table
                        const column = clonedTable.columns.find(column => column.name === newColumn.name);
                        column.isPrimary = false;
                        // if we have another primary keys, we must recreate constraint.
                        if (primaryColumns.length > 0) {
                            const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                            const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                            upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                            downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${pkName}"`));
                        }
                    }
                }
                if (newColumn.isUnique !== oldColumn.isUnique) {
                    if (newColumn.isUnique === true) {
                        const uniqueConstraint = new TableUnique_1.TableUnique({
                            name: this.connection.namingStrategy.uniqueConstraintName(table.name, [newColumn.name]),
                            columnNames: [newColumn.name]
                        });
                        clonedTable.uniques.push(uniqueConstraint);
                        upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE ("${newColumn.name}")`));
                        downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${uniqueConstraint.name}"`));
                    }
                    else {
                        const uniqueConstraint = clonedTable.uniques.find(unique => {
                            return unique.columnNames.length === 1 && !!unique.columnNames.find(columnName => columnName === newColumn.name);
                        });
                        clonedTable.uniques.splice(clonedTable.uniques.indexOf(uniqueConstraint), 1);
                        upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${uniqueConstraint.name}"`));
                        downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE ("${newColumn.name}")`));
                    }
                }
                if (newColumn.default !== oldColumn.default) {
                    // (note) if there is a previous default, we need to drop its constraint first
                    if (oldColumn.default !== null && oldColumn.default !== undefined) {
                        const defaultName = this.connection.namingStrategy.defaultConstraintName(table.name, oldColumn.name);
                        upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${defaultName}"`));
                        downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${defaultName}" DEFAULT ${oldColumn.default} FOR "${oldColumn.name}"`));
                    }
                    if (newColumn.default !== null && newColumn.default !== undefined) {
                        const defaultName = this.connection.namingStrategy.defaultConstraintName(table.name, newColumn.name);
                        upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${defaultName}" DEFAULT ${newColumn.default} FOR "${newColumn.name}"`));
                        downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${defaultName}"`));
                    }
                }
                yield this.executeQueries(upQueries, downQueries);
                this.replaceCachedTable(table, clonedTable);
            }
        });
    }
    /**
     * Changes a column in the table.
     */
    changeColumns(tableOrName, changedColumns) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const { oldColumn, newColumn } of changedColumns) {
                yield this.changeColumn(tableOrName, oldColumn, newColumn);
            }
        });
    }
    /**
     * Drops column in the table.
     */
    dropColumn(tableOrName, columnOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const column = columnOrName instanceof TableColumn_1.TableColumn ? columnOrName : table.findColumnByName(columnOrName);
            if (!column)
                throw new Error(`Column "${columnOrName}" was not found in table "${table.name}"`);
            const clonedTable = table.clone();
            const upQueries = [];
            const downQueries = [];
            // drop primary key constraint
            if (column.isPrimary) {
                const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, clonedTable.primaryColumns.map(column => column.name));
                const columnNames = clonedTable.primaryColumns.map(primaryColumn => `"${primaryColumn.name}"`).join(", ");
                upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(clonedTable)} DROP CONSTRAINT "${pkName}"`));
                downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(clonedTable)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                // update column in table
                const tableColumn = clonedTable.findColumnByName(column.name);
                tableColumn.isPrimary = false;
                // if primary key have multiple columns, we must recreate it without dropped column
                if (clonedTable.primaryColumns.length > 0) {
                    const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, clonedTable.primaryColumns.map(column => column.name));
                    const columnNames = clonedTable.primaryColumns.map(primaryColumn => `"${primaryColumn.name}"`).join(", ");
                    upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(clonedTable)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                    downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(clonedTable)} DROP CONSTRAINT "${pkName}"`));
                }
            }
            // drop column index
            const columnIndex = clonedTable.indices.find(index => index.columnNames.length === 1 && index.columnNames[0] === column.name);
            if (columnIndex) {
                clonedTable.indices.splice(clonedTable.indices.indexOf(columnIndex), 1);
                upQueries.push(this.dropIndexSql(table, columnIndex));
                downQueries.push(this.createIndexSql(table, columnIndex));
            }
            // drop column check
            const columnCheck = clonedTable.checks.find(check => !!check.columnNames && check.columnNames.length === 1 && check.columnNames[0] === column.name);
            if (columnCheck) {
                clonedTable.checks.splice(clonedTable.checks.indexOf(columnCheck), 1);
                upQueries.push(this.dropCheckConstraintSql(table, columnCheck));
                downQueries.push(this.createCheckConstraintSql(table, columnCheck));
            }
            // drop column unique
            const columnUnique = clonedTable.uniques.find(unique => unique.columnNames.length === 1 && unique.columnNames[0] === column.name);
            if (columnUnique) {
                clonedTable.uniques.splice(clonedTable.uniques.indexOf(columnUnique), 1);
                upQueries.push(this.dropUniqueConstraintSql(table, columnUnique));
                downQueries.push(this.createUniqueConstraintSql(table, columnUnique));
            }
            // drop default constraint
            if (column.default !== null && column.default !== undefined) {
                const defaultName = this.connection.namingStrategy.defaultConstraintName(table.name, column.name);
                upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${defaultName}"`));
                downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${defaultName}" DEFAULT ${column.default} FOR "${column.name}"`));
            }
            upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP COLUMN "${column.name}"`));
            downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD ${this.buildCreateColumnSql(table, column, false, false)}`));
            yield this.executeQueries(upQueries, downQueries);
            clonedTable.removeColumn(column);
            this.replaceCachedTable(table, clonedTable);
        });
    }
    /**
     * Drops the columns in the table.
     */
    dropColumns(tableOrName, columns) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const column of columns) {
                yield this.dropColumn(tableOrName, column);
            }
        });
    }
    /**
     * Creates a new primary key.
     */
    createPrimaryKey(tableOrName, columnNames) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const clonedTable = table.clone();
            const up = this.createPrimaryKeySql(table, columnNames);
            // mark columns as primary, because dropPrimaryKeySql build constraint name from table primary column names.
            clonedTable.columns.forEach(column => {
                if (columnNames.find(columnName => columnName === column.name))
                    column.isPrimary = true;
            });
            const down = this.dropPrimaryKeySql(clonedTable);
            yield this.executeQueries(up, down);
            this.replaceCachedTable(table, clonedTable);
        });
    }
    /**
     * Updates composite primary keys.
     */
    updatePrimaryKeys(tableOrName, columns) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const clonedTable = table.clone();
            const columnNames = columns.map(column => column.name);
            const upQueries = [];
            const downQueries = [];
            // if table already have primary columns, we must drop them.
            const primaryColumns = clonedTable.primaryColumns;
            if (primaryColumns.length > 0) {
                const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                const columnNamesString = primaryColumns.map(column => `"${column.name}"`).join(", ");
                upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${pkName}"`));
                downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNamesString})`));
            }
            // update columns in table.
            clonedTable.columns
                .filter(column => columnNames.indexOf(column.name) !== -1)
                .forEach(column => column.isPrimary = true);
            const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, columnNames);
            const columnNamesString = columnNames.map(columnName => `"${columnName}"`).join(", ");
            upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNamesString})`));
            downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${pkName}"`));
            yield this.executeQueries(upQueries, downQueries);
            this.replaceCachedTable(table, clonedTable);
        });
    }
    /**
     * Drops a primary key.
     */
    dropPrimaryKey(tableOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const up = this.dropPrimaryKeySql(table);
            const down = this.createPrimaryKeySql(table, table.primaryColumns.map(column => column.name));
            yield this.executeQueries(up, down);
            table.primaryColumns.forEach(column => {
                column.isPrimary = false;
            });
        });
    }
    /**
     * Creates a new unique constraint.
     */
    createUniqueConstraint(tableOrName, uniqueConstraint) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            // new unique constraint may be passed without name. In this case we generate unique name manually.
            if (!uniqueConstraint.name)
                uniqueConstraint.name = this.connection.namingStrategy.uniqueConstraintName(table.name, uniqueConstraint.columnNames);
            const up = this.createUniqueConstraintSql(table, uniqueConstraint);
            const down = this.dropUniqueConstraintSql(table, uniqueConstraint);
            yield this.executeQueries(up, down);
            table.addUniqueConstraint(uniqueConstraint);
        });
    }
    /**
     * Creates a new unique constraints.
     */
    createUniqueConstraints(tableOrName, uniqueConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const promises = uniqueConstraints.map(uniqueConstraint => this.createUniqueConstraint(tableOrName, uniqueConstraint));
            yield Promise.all(promises);
        });
    }
    /**
     * Drops unique constraint.
     */
    dropUniqueConstraint(tableOrName, uniqueOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const uniqueConstraint = uniqueOrName instanceof TableUnique_1.TableUnique ? uniqueOrName : table.uniques.find(u => u.name === uniqueOrName);
            if (!uniqueConstraint)
                throw new Error(`Supplied unique constraint was not found in table ${table.name}`);
            const up = this.dropUniqueConstraintSql(table, uniqueConstraint);
            const down = this.createUniqueConstraintSql(table, uniqueConstraint);
            yield this.executeQueries(up, down);
            table.removeUniqueConstraint(uniqueConstraint);
        });
    }
    /**
     * Drops an unique constraints.
     */
    dropUniqueConstraints(tableOrName, uniqueConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const promises = uniqueConstraints.map(uniqueConstraint => this.dropUniqueConstraint(tableOrName, uniqueConstraint));
            yield Promise.all(promises);
        });
    }
    /**
     * Creates a new check constraint.
     */
    createCheckConstraint(tableOrName, checkConstraint) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            // new unique constraint may be passed without name. In this case we generate unique name manually.
            if (!checkConstraint.name)
                checkConstraint.name = this.connection.namingStrategy.checkConstraintName(table.name, checkConstraint.expression);
            const up = this.createCheckConstraintSql(table, checkConstraint);
            const down = this.dropCheckConstraintSql(table, checkConstraint);
            yield this.executeQueries(up, down);
            table.addCheckConstraint(checkConstraint);
        });
    }
    /**
     * Creates a new check constraints.
     */
    createCheckConstraints(tableOrName, checkConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const promises = checkConstraints.map(checkConstraint => this.createCheckConstraint(tableOrName, checkConstraint));
            yield Promise.all(promises);
        });
    }
    /**
     * Drops check constraint.
     */
    dropCheckConstraint(tableOrName, checkOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const checkConstraint = checkOrName instanceof TableCheck_1.TableCheck ? checkOrName : table.checks.find(c => c.name === checkOrName);
            if (!checkConstraint)
                throw new Error(`Supplied check constraint was not found in table ${table.name}`);
            const up = this.dropCheckConstraintSql(table, checkConstraint);
            const down = this.createCheckConstraintSql(table, checkConstraint);
            yield this.executeQueries(up, down);
            table.removeCheckConstraint(checkConstraint);
        });
    }
    /**
     * Drops check constraints.
     */
    dropCheckConstraints(tableOrName, checkConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const promises = checkConstraints.map(checkConstraint => this.dropCheckConstraint(tableOrName, checkConstraint));
            yield Promise.all(promises);
        });
    }
    /**
     * Creates a new exclusion constraint.
     */
    createExclusionConstraint(tableOrName, exclusionConstraint) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`SqlServer does not support exclusion constraints.`);
        });
    }
    /**
     * Creates a new exclusion constraints.
     */
    createExclusionConstraints(tableOrName, exclusionConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`SqlServer does not support exclusion constraints.`);
        });
    }
    /**
     * Drops exclusion constraint.
     */
    dropExclusionConstraint(tableOrName, exclusionOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`SqlServer does not support exclusion constraints.`);
        });
    }
    /**
     * Drops exclusion constraints.
     */
    dropExclusionConstraints(tableOrName, exclusionConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`SqlServer does not support exclusion constraints.`);
        });
    }
    /**
     * Creates a new foreign key.
     */
    createForeignKey(tableOrName, foreignKey) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            // new FK may be passed without name. In this case we generate FK name manually.
            if (!foreignKey.name)
                foreignKey.name = this.connection.namingStrategy.foreignKeyName(table.name, foreignKey.columnNames, foreignKey.referencedTableName, foreignKey.referencedColumnNames);
            const up = this.createForeignKeySql(table, foreignKey);
            const down = this.dropForeignKeySql(table, foreignKey);
            yield this.executeQueries(up, down);
            table.addForeignKey(foreignKey);
        });
    }
    /**
     * Creates a new foreign keys.
     */
    createForeignKeys(tableOrName, foreignKeys) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const promises = foreignKeys.map(foreignKey => this.createForeignKey(tableOrName, foreignKey));
            yield Promise.all(promises);
        });
    }
    /**
     * Drops a foreign key from the table.
     */
    dropForeignKey(tableOrName, foreignKeyOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const foreignKey = foreignKeyOrName instanceof TableForeignKey_1.TableForeignKey ? foreignKeyOrName : table.foreignKeys.find(fk => fk.name === foreignKeyOrName);
            if (!foreignKey)
                throw new Error(`Supplied foreign key was not found in table ${table.name}`);
            const up = this.dropForeignKeySql(table, foreignKey);
            const down = this.createForeignKeySql(table, foreignKey);
            yield this.executeQueries(up, down);
            table.removeForeignKey(foreignKey);
        });
    }
    /**
     * Drops a foreign keys from the table.
     */
    dropForeignKeys(tableOrName, foreignKeys) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const promises = foreignKeys.map(foreignKey => this.dropForeignKey(tableOrName, foreignKey));
            yield Promise.all(promises);
        });
    }
    /**
     * Creates a new index.
     */
    createIndex(tableOrName, index) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            // new index may be passed without name. In this case we generate index name manually.
            if (!index.name)
                index.name = this.connection.namingStrategy.indexName(table.name, index.columnNames, index.where);
            const up = this.createIndexSql(table, index);
            const down = this.dropIndexSql(table, index);
            yield this.executeQueries(up, down);
            table.addIndex(index);
        });
    }
    /**
     * Creates a new indices
     */
    createIndices(tableOrName, indices) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const promises = indices.map(index => this.createIndex(tableOrName, index));
            yield Promise.all(promises);
        });
    }
    /**
     * Drops an index.
     */
    dropIndex(tableOrName, indexOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const index = indexOrName instanceof TableIndex_1.TableIndex ? indexOrName : table.indices.find(i => i.name === indexOrName);
            if (!index)
                throw new Error(`Supplied index was not found in table ${table.name}`);
            const up = this.dropIndexSql(table, index);
            const down = this.createIndexSql(table, index);
            yield this.executeQueries(up, down);
            table.removeIndex(index);
        });
    }
    /**
     * Drops an indices from the table.
     */
    dropIndices(tableOrName, indices) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const promises = indices.map(index => this.dropIndex(tableOrName, index));
            yield Promise.all(promises);
        });
    }
    /**
     * Clears all table contents.
     * Note: this operation uses SQL's TRUNCATE query which cannot be reverted in transactions.
     */
    clearTable(tablePath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.query(`TRUNCATE TABLE ${this.escapePath(tablePath)}`);
        });
    }
    /**
     * Removes all tables from the currently connected database.
     */
    clearDatabase(database) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (database) {
                const isDatabaseExist = yield this.hasDatabase(database);
                if (!isDatabaseExist)
                    return Promise.resolve();
            }
            yield this.startTransaction();
            try {
                let allViewsSql = database
                    ? `SELECT * FROM "${database}"."INFORMATION_SCHEMA"."VIEWS"`
                    : `SELECT * FROM "INFORMATION_SCHEMA"."VIEWS"`;
                const allViewsResults = yield this.query(allViewsSql);
                yield Promise.all(allViewsResults.map(viewResult => {
                    // 'DROP VIEW' does not allow specifying the database name as a prefix to the object name.
                    const dropTableSql = `DROP VIEW "${viewResult["TABLE_SCHEMA"]}"."${viewResult["TABLE_NAME"]}"`;
                    return this.query(dropTableSql);
                }));
                let allTablesSql = database
                    ? `SELECT * FROM "${database}"."INFORMATION_SCHEMA"."TABLES" WHERE "TABLE_TYPE" = 'BASE TABLE'`
                    : `SELECT * FROM "INFORMATION_SCHEMA"."TABLES" WHERE "TABLE_TYPE" = 'BASE TABLE'`;
                const allTablesResults = yield this.query(allTablesSql);
                yield Promise.all(allTablesResults.map((tablesResult) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    // const tableName = database ? `"${tablesResult["TABLE_CATALOG"]}"."sys"."foreign_keys"` : `"sys"."foreign_keys"`;
                    const dropForeignKeySql = `SELECT 'ALTER TABLE "${tablesResult["TABLE_CATALOG"]}"."' + OBJECT_SCHEMA_NAME("fk"."parent_object_id", DB_ID('${tablesResult["TABLE_CATALOG"]}')) + '"."' + OBJECT_NAME("fk"."parent_object_id", DB_ID('${tablesResult["TABLE_CATALOG"]}')) + '" ` +
                        `DROP CONSTRAINT "' + "fk"."name" + '"' as "query" FROM "${tablesResult["TABLE_CATALOG"]}"."sys"."foreign_keys" AS "fk" ` +
                        `WHERE "fk"."referenced_object_id" = OBJECT_ID('"${tablesResult["TABLE_CATALOG"]}"."${tablesResult["TABLE_SCHEMA"]}"."${tablesResult["TABLE_NAME"]}"')`;
                    const dropFkQueries = yield this.query(dropForeignKeySql);
                    return Promise.all(dropFkQueries.map(result => result["query"]).map(dropQuery => this.query(dropQuery)));
                })));
                yield Promise.all(allTablesResults.map(tablesResult => {
                    if (tablesResult["TABLE_NAME"].startsWith("#")) {
                        // don't try to drop temporary tables
                        return;
                    }
                    const dropTableSql = `DROP TABLE "${tablesResult["TABLE_CATALOG"]}"."${tablesResult["TABLE_SCHEMA"]}"."${tablesResult["TABLE_NAME"]}"`;
                    return this.query(dropTableSql);
                }));
                yield this.commitTransaction();
            }
            catch (error) {
                try { // we throw original error even if rollback thrown an error
                    yield this.rollbackTransaction();
                }
                catch (rollbackError) { }
                throw error;
            }
        });
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Return current database.
     */
    getCurrentDatabase() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const currentDBQuery = yield this.query(`SELECT DB_NAME() AS "db_name"`);
            return currentDBQuery[0]["db_name"];
        });
    }
    /**
     * Return current schema.
     */
    getCurrentSchema() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const currentSchemaQuery = yield this.query(`SELECT SCHEMA_NAME() AS "schema_name"`);
            return currentSchemaQuery[0]["schema_name"];
        });
    }
    loadViews(viewPaths) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const hasTable = yield this.hasTable(this.getTypeormMetadataTableName());
            if (!hasTable)
                return Promise.resolve([]);
            const currentSchema = yield this.getCurrentSchema();
            const currentDatabase = yield this.getCurrentDatabase();
            const extractTableSchemaAndName = (tableName) => {
                let [database, schema, name] = tableName.split(".");
                // if name is empty, it means that tableName have only schema name and table name or only table name
                if (!name) {
                    // if schema is empty, it means tableName have only name of a table. Otherwise it means that we have "schemaName"."tableName" string.
                    if (!schema) {
                        name = database;
                        schema = this.driver.options.schema || currentSchema;
                    }
                    else {
                        name = schema;
                        schema = database;
                    }
                }
                else if (schema === "") {
                    schema = this.driver.options.schema || currentSchema;
                }
                return [schema, name];
            };
            const dbNames = viewPaths
                .filter(viewPath => viewPath.split(".").length === 3)
                .map(viewPath => viewPath.split(".")[0]);
            if (this.driver.database && !dbNames.find(dbName => dbName === this.driver.database))
                dbNames.push(this.driver.database);
            const viewsCondition = viewPaths.map(viewPath => {
                const [schema, name] = extractTableSchemaAndName(viewPath);
                return `("T"."SCHEMA" = '${schema}' AND "T"."NAME" = '${name}')`;
            }).join(" OR ");
            const query = dbNames.map(dbName => {
                return `SELECT "T".*, "V"."CHECK_OPTION" FROM ${this.escapePath(this.getTypeormMetadataTableName())} "t" ` +
                    `INNER JOIN "${dbName}"."INFORMATION_SCHEMA"."VIEWS" "V" ON "V"."TABLE_SCHEMA" = "T"."SCHEMA" AND "v"."TABLE_NAME" = "T"."NAME" WHERE "T"."TYPE" = 'VIEW' ${viewsCondition ? `AND (${viewsCondition})` : ""}`;
            }).join(" UNION ALL ");
            const dbViews = yield this.query(query);
            return dbViews.map((dbView) => {
                const view = new View_1.View();
                const db = dbView["TABLE_CATALOG"] === currentDatabase ? undefined : dbView["TABLE_CATALOG"];
                const schema = dbView["schema"] === currentSchema && !this.driver.options.schema ? undefined : dbView["schema"];
                view.name = this.driver.buildTableName(dbView["name"], schema, db);
                view.expression = dbView["value"];
                return view;
            });
        });
    }
    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     */
    loadTables(tableNames) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // if no tables given then no need to proceed
            if (!tableNames || !tableNames.length)
                return [];
            const schemaNames = [];
            const currentSchema = yield this.getCurrentSchema();
            const currentDatabase = yield this.getCurrentDatabase();
            const extractTableSchemaAndName = (tableName) => {
                let [database, schema, name] = tableName.split(".");
                // if name is empty, it means that tableName have only schema name and table name or only table name
                if (!name) {
                    // if schema is empty, it means tableName have only name of a table. Otherwise it means that we have "schemaName"."tableName" string.
                    if (!schema) {
                        name = database;
                        schema = this.driver.options.schema || currentSchema;
                    }
                    else {
                        name = schema;
                        schema = database;
                    }
                }
                else if (schema === "") {
                    schema = this.driver.options.schema || currentSchema;
                }
                return [schema, name];
            };
            tableNames.filter(tablePath => tablePath.indexOf(".") !== -1)
                .forEach(tablePath => {
                if (tablePath.split(".").length === 3) {
                    if (tablePath.split(".")[1] !== "")
                        schemaNames.push(tablePath.split(".")[1]);
                }
                else {
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
                return `SELECT "columnUsages".*, "tableConstraints"."CONSTRAINT_TYPE", "chk"."definition" ` +
                    `FROM "${dbName}"."INFORMATION_SCHEMA"."CONSTRAINT_COLUMN_USAGE" "columnUsages" ` +
                    `INNER JOIN "${dbName}"."INFORMATION_SCHEMA"."TABLE_CONSTRAINTS" "tableConstraints" ON "tableConstraints"."CONSTRAINT_NAME" = "columnUsages"."CONSTRAINT_NAME" ` +
                    `LEFT JOIN "${dbName}"."sys"."check_constraints" "chk" ON "chk"."name" = "columnUsages"."CONSTRAINT_NAME" ` +
                    `WHERE (${constraintsCondition}) AND "tableConstraints"."CONSTRAINT_TYPE" IN ('PRIMARY KEY', 'UNIQUE', 'CHECK')`;
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
            const dbCollationsSql = `SELECT "NAME", "COLLATION_NAME" FROM "sys"."databases"`;
            const indicesSql = dbNames.map(dbName => {
                return `SELECT '${dbName}' AS "TABLE_CATALOG", "s"."name" AS "TABLE_SCHEMA", "t"."name" AS "TABLE_NAME", ` +
                    `"ind"."name" AS "INDEX_NAME", "col"."name" AS "COLUMN_NAME", "ind"."is_unique" AS "IS_UNIQUE", "ind"."filter_definition" as "CONDITION" ` +
                    `FROM "${dbName}"."sys"."indexes" "ind" ` +
                    `INNER JOIN "${dbName}"."sys"."index_columns" "ic" ON "ic"."object_id" = "ind"."object_id" AND "ic"."index_id" = "ind"."index_id" ` +
                    `INNER JOIN "${dbName}"."sys"."columns" "col" ON "col"."object_id" = "ic"."object_id" AND "col"."column_id" = "ic"."column_id" ` +
                    `INNER JOIN "${dbName}"."sys"."tables" "t" ON "t"."object_id" = "ind"."object_id" ` +
                    `INNER JOIN "${dbName}"."sys"."schemas" "s" ON "s"."schema_id" = "t"."schema_id" ` +
                    `WHERE "ind"."is_primary_key" = 0 AND "ind"."is_unique_constraint" = 0 AND "t"."is_ms_shipped" = 0`;
            }).join(" UNION ALL ");
            const [dbTables, dbColumns, dbConstraints, dbForeignKeys, dbIdentityColumns, dbCollations, dbIndices] = yield Promise.all([
                this.query(tablesSql),
                this.query(columnsSql),
                this.query(constraintsSql),
                this.query(foreignKeysSql),
                this.query(identityColumnsSql),
                this.query(dbCollationsSql),
                this.query(indicesSql),
            ]);
            // if tables were not found in the db, no need to proceed
            if (!dbTables.length)
                return [];
            // create table schemas for loaded tables
            return yield Promise.all(dbTables.map((dbTable) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const table = new Table_1.Table();
                // We do not need to join schema and database names, when db or schema is by default.
                // In this case we need local variable `tableFullName` for below comparision.
                const db = dbTable["TABLE_CATALOG"] === currentDatabase ? undefined : dbTable["TABLE_CATALOG"];
                const schema = dbTable["TABLE_SCHEMA"] === currentSchema && !this.driver.options.schema ? undefined : dbTable["TABLE_SCHEMA"];
                table.name = this.driver.buildTableName(dbTable["TABLE_NAME"], schema, db);
                const tableFullName = this.driver.buildTableName(dbTable["TABLE_NAME"], dbTable["TABLE_SCHEMA"], dbTable["TABLE_CATALOG"]);
                const defaultCollation = dbCollations.find(dbCollation => dbCollation["NAME"] === dbTable["TABLE_CATALOG"]);
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
                    const isPrimary = !!columnConstraints.find(constraint => constraint["CONSTRAINT_TYPE"] === "PRIMARY KEY");
                    const isGenerated = !!dbIdentityColumns.find(column => {
                        return this.driver.buildTableName(column["TABLE_NAME"], column["TABLE_SCHEMA"], column["TABLE_CATALOG"]) === tableFullName
                            && column["COLUMN_NAME"] === dbColumn["COLUMN_NAME"];
                    });
                    const tableColumn = new TableColumn_1.TableColumn();
                    tableColumn.name = dbColumn["COLUMN_NAME"];
                    tableColumn.type = dbColumn["DATA_TYPE"].toLowerCase();
                    // check only columns that have length property
                    if (this.driver.withLengthColumnTypes.indexOf(tableColumn.type) !== -1 && dbColumn["CHARACTER_MAXIMUM_LENGTH"]) {
                        const length = dbColumn["CHARACTER_MAXIMUM_LENGTH"].toString();
                        if (length === "-1") {
                            tableColumn.length = "MAX";
                        }
                        else {
                            tableColumn.length = !this.isDefaultColumnLength(table, tableColumn, length) ? length : "";
                        }
                    }
                    if (tableColumn.type === "decimal" || tableColumn.type === "numeric") {
                        if (dbColumn["NUMERIC_PRECISION"] !== null && !this.isDefaultColumnPrecision(table, tableColumn, dbColumn["NUMERIC_PRECISION"]))
                            tableColumn.precision = dbColumn["NUMERIC_PRECISION"];
                        if (dbColumn["NUMERIC_SCALE"] !== null && !this.isDefaultColumnScale(table, tableColumn, dbColumn["NUMERIC_SCALE"]))
                            tableColumn.scale = dbColumn["NUMERIC_SCALE"];
                    }
                    if (tableColumn.type === "nvarchar") {
                        // Check if this is an enum
                        const columnCheckConstraints = columnConstraints.filter(constraint => constraint["CONSTRAINT_TYPE"] === "CHECK");
                        if (columnCheckConstraints.length) {
                            // const isEnumRegexp = new RegExp("^\\(\\[" + tableColumn.name + "\\]='[^']+'(?: OR \\[" + tableColumn.name + "\\]='[^']+')*\\)$");
                            for (const checkConstraint of columnCheckConstraints) {
                                if (this.isEnumCheckConstraint(checkConstraint["CONSTRAINT_NAME"])) {
                                    // This is an enum constraint, make column into an enum
                                    tableColumn.enum = [];
                                    const enumValueRegexp = new RegExp("\\[" + tableColumn.name + "\\]='([^']+)'", "g");
                                    let result;
                                    while ((result = enumValueRegexp.exec(checkConstraint["definition"])) !== null) {
                                        tableColumn.enum.unshift(result[1]);
                                    }
                                    // Skip other column constraints
                                    break;
                                }
                            }
                        }
                    }
                    tableColumn.default = dbColumn["COLUMN_DEFAULT"] !== null && dbColumn["COLUMN_DEFAULT"] !== undefined
                        ? this.removeParenthesisFromDefault(dbColumn["COLUMN_DEFAULT"])
                        : undefined;
                    tableColumn.isNullable = dbColumn["IS_NULLABLE"] === "YES";
                    tableColumn.isPrimary = isPrimary;
                    tableColumn.isUnique = !!uniqueConstraint && !isConstraintComposite;
                    tableColumn.isGenerated = isGenerated;
                    if (isGenerated)
                        tableColumn.generationStrategy = "increment";
                    if (tableColumn.default === "newsequentialid()") {
                        tableColumn.isGenerated = true;
                        tableColumn.generationStrategy = "uuid";
                        tableColumn.default = undefined;
                    }
                    // todo: unable to get default charset
                    // tableColumn.charset = dbColumn["CHARACTER_SET_NAME"];
                    if (dbColumn["COLLATION_NAME"])
                        tableColumn.collation = dbColumn["COLLATION_NAME"] === defaultCollation["COLLATION_NAME"] ? undefined : dbColumn["COLLATION_NAME"];
                    if (tableColumn.type === "datetime2" || tableColumn.type === "time" || tableColumn.type === "datetimeoffset") {
                        tableColumn.precision = !this.isDefaultColumnPrecision(table, tableColumn, dbColumn["DATETIME_PRECISION"]) ? dbColumn["DATETIME_PRECISION"] : undefined;
                    }
                    return tableColumn;
                });
                // find unique constraints of table, group them by constraint name and build TableUnique.
                const tableUniqueConstraints = OrmUtils_1.OrmUtils.uniq(dbConstraints.filter(dbConstraint => {
                    return this.driver.buildTableName(dbConstraint["TABLE_NAME"], dbConstraint["CONSTRAINT_SCHEMA"], dbConstraint["CONSTRAINT_CATALOG"]) === tableFullName
                        && dbConstraint["CONSTRAINT_TYPE"] === "UNIQUE";
                }), dbConstraint => dbConstraint["CONSTRAINT_NAME"]);
                table.uniques = tableUniqueConstraints.map(constraint => {
                    const uniques = dbConstraints.filter(dbC => dbC["CONSTRAINT_NAME"] === constraint["CONSTRAINT_NAME"]);
                    return new TableUnique_1.TableUnique({
                        name: constraint["CONSTRAINT_NAME"],
                        columnNames: uniques.map(u => u["COLUMN_NAME"])
                    });
                });
                // find check constraints of table, group them by constraint name and build TableCheck.
                const tableCheckConstraints = OrmUtils_1.OrmUtils.uniq(dbConstraints.filter(dbConstraint => {
                    return this.driver.buildTableName(dbConstraint["TABLE_NAME"], dbConstraint["CONSTRAINT_SCHEMA"], dbConstraint["CONSTRAINT_CATALOG"]) === tableFullName
                        && dbConstraint["CONSTRAINT_TYPE"] === "CHECK";
                }), dbConstraint => dbConstraint["CONSTRAINT_NAME"]);
                table.checks = tableCheckConstraints
                    .filter(constraint => !this.isEnumCheckConstraint(constraint["CONSTRAINT_NAME"]))
                    .map(constraint => {
                    const checks = dbConstraints.filter(dbC => dbC["CONSTRAINT_NAME"] === constraint["CONSTRAINT_NAME"]);
                    return new TableCheck_1.TableCheck({
                        name: constraint["CONSTRAINT_NAME"],
                        columnNames: checks.map(c => c["COLUMN_NAME"]),
                        expression: constraint["definition"]
                    });
                });
                // find foreign key constraints of table, group them by constraint name and build TableForeignKey.
                const tableForeignKeyConstraints = OrmUtils_1.OrmUtils.uniq(dbForeignKeys.filter(dbForeignKey => {
                    return this.driver.buildTableName(dbForeignKey["TABLE_NAME"], dbForeignKey["TABLE_SCHEMA"], dbForeignKey["TABLE_CATALOG"]) === tableFullName;
                }), dbForeignKey => dbForeignKey["FK_NAME"]);
                table.foreignKeys = tableForeignKeyConstraints.map(dbForeignKey => {
                    const foreignKeys = dbForeignKeys.filter(dbFk => dbFk["FK_NAME"] === dbForeignKey["FK_NAME"]);
                    // if referenced table located in currently used db and schema, we don't need to concat db and schema names to table name.
                    const db = dbForeignKey["TABLE_CATALOG"] === currentDatabase ? undefined : dbForeignKey["TABLE_CATALOG"];
                    const schema = dbForeignKey["REF_SCHEMA"] === currentSchema ? undefined : dbForeignKey["REF_SCHEMA"];
                    const referencedTableName = this.driver.buildTableName(dbForeignKey["REF_TABLE"], schema, db);
                    return new TableForeignKey_1.TableForeignKey({
                        name: dbForeignKey["FK_NAME"],
                        columnNames: foreignKeys.map(dbFk => dbFk["COLUMN_NAME"]),
                        referencedTableName: referencedTableName,
                        referencedColumnNames: foreignKeys.map(dbFk => dbFk["REF_COLUMN"]),
                        onDelete: dbForeignKey["ON_DELETE"].replace("_", " "),
                        onUpdate: dbForeignKey["ON_UPDATE"].replace("_", " ") // SqlServer returns NO_ACTION, instead of NO ACTION
                    });
                });
                // find index constraints of table, group them by constraint name and build TableIndex.
                const tableIndexConstraints = OrmUtils_1.OrmUtils.uniq(dbIndices.filter(dbIndex => {
                    return this.driver.buildTableName(dbIndex["TABLE_NAME"], dbIndex["TABLE_SCHEMA"], dbIndex["TABLE_CATALOG"]) === tableFullName;
                }), dbIndex => dbIndex["INDEX_NAME"]);
                table.indices = tableIndexConstraints.map(constraint => {
                    const indices = dbIndices.filter(index => {
                        return index["TABLE_CATALOG"] === constraint["TABLE_CATALOG"]
                            && index["TABLE_SCHEMA"] === constraint["TABLE_SCHEMA"]
                            && index["TABLE_NAME"] === constraint["TABLE_NAME"]
                            && index["INDEX_NAME"] === constraint["INDEX_NAME"];
                    });
                    return new TableIndex_1.TableIndex({
                        table: table,
                        name: constraint["INDEX_NAME"],
                        columnNames: indices.map(i => i["COLUMN_NAME"]),
                        isUnique: constraint["IS_UNIQUE"],
                        where: constraint["CONDITION"]
                    });
                });
                return table;
            })));
        });
    }
    /**
     * Builds and returns SQL for create table.
     */
    createTableSql(table, createForeignKeys) {
        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(table, column, false, true)).join(", ");
        let sql = `CREATE TABLE ${this.escapePath(table)} (${columnDefinitions}`;
        table.columns
            .filter(column => column.isUnique)
            .forEach(column => {
            const isUniqueExist = table.uniques.some(unique => unique.columnNames.length === 1 && unique.columnNames[0] === column.name);
            if (!isUniqueExist)
                table.uniques.push(new TableUnique_1.TableUnique({
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
        if (table.checks.length > 0) {
            const checksSql = table.checks.map(check => {
                const checkName = check.name ? check.name : this.connection.namingStrategy.checkConstraintName(table.name, check.expression);
                return `CONSTRAINT "${checkName}" CHECK (${check.expression})`;
            }).join(", ");
            sql += `, ${checksSql}`;
        }
        if (table.foreignKeys.length > 0 && createForeignKeys) {
            const foreignKeysSql = table.foreignKeys.map(fk => {
                const columnNames = fk.columnNames.map(columnName => `"${columnName}"`).join(", ");
                if (!fk.name)
                    fk.name = this.connection.namingStrategy.foreignKeyName(table.name, fk.columnNames, fk.referencedTableName, fk.referencedColumnNames);
                const referencedColumnNames = fk.referencedColumnNames.map(columnName => `"${columnName}"`).join(", ");
                let constraint = `CONSTRAINT "${fk.name}" FOREIGN KEY (${columnNames}) REFERENCES ${this.escapePath(fk.referencedTableName)} (${referencedColumnNames})`;
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
        return new Query_1.Query(sql);
    }
    /**
     * Builds drop table sql.
     */
    dropTableSql(tableOrName, ifExist) {
        const query = ifExist ? `DROP TABLE IF EXISTS ${this.escapePath(tableOrName)}` : `DROP TABLE ${this.escapePath(tableOrName)}`;
        return new Query_1.Query(query);
    }
    createViewSql(view) {
        if (typeof view.expression === "string") {
            return new Query_1.Query(`CREATE VIEW ${this.escapePath(view)} AS ${view.expression}`);
        }
        else {
            return new Query_1.Query(`CREATE VIEW ${this.escapePath(view)} AS ${view.expression(this.connection).getQuery()}`);
        }
    }
    insertViewDefinitionSql(view) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const currentSchema = yield this.getCurrentSchema();
            const parsedTableName = this.parseTableName(view, currentSchema);
            const expression = typeof view.expression === "string" ? view.expression.trim() : view.expression(this.connection).getQuery();
            const [query, parameters] = this.connection.createQueryBuilder()
                .insert()
                .into(this.getTypeormMetadataTableName())
                .values({ type: "VIEW", database: parsedTableName.database, schema: parsedTableName.schema, name: parsedTableName.name, value: expression })
                .getQueryAndParameters();
            return new Query_1.Query(query, parameters);
        });
    }
    /**
     * Builds drop view sql.
     */
    dropViewSql(viewOrPath) {
        return new Query_1.Query(`DROP VIEW ${this.escapePath(viewOrPath)}`);
    }
    /**
     * Builds remove view sql.
     */
    deleteViewDefinitionSql(viewOrPath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const currentSchema = yield this.getCurrentSchema();
            const parsedTableName = this.parseTableName(viewOrPath, currentSchema);
            const qb = this.connection.createQueryBuilder();
            const [query, parameters] = qb.delete()
                .from(this.getTypeormMetadataTableName())
                .where(`${qb.escape("type")} = 'VIEW'`)
                .andWhere(`${qb.escape("database")} = :database`, { database: parsedTableName.database })
                .andWhere(`${qb.escape("schema")} = :schema`, { schema: parsedTableName.schema })
                .andWhere(`${qb.escape("name")} = :name`, { name: parsedTableName.name })
                .getQueryAndParameters();
            return new Query_1.Query(query, parameters);
        });
    }
    /**
     * Builds create index sql.
     */
    createIndexSql(table, index) {
        const columns = index.columnNames.map(columnName => `"${columnName}"`).join(", ");
        return new Query_1.Query(`CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX "${index.name}" ON ${this.escapePath(table)} (${columns}) ${index.where ? "WHERE " + index.where : ""}`);
    }
    /**
     * Builds drop index sql.
     */
    dropIndexSql(table, indexOrName) {
        let indexName = indexOrName instanceof TableIndex_1.TableIndex ? indexOrName.name : indexOrName;
        return new Query_1.Query(`DROP INDEX "${indexName}" ON ${this.escapePath(table)}`);
    }
    /**
     * Builds create primary key sql.
     */
    createPrimaryKeySql(table, columnNames) {
        const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, columnNames);
        const columnNamesString = columnNames.map(columnName => `"${columnName}"`).join(", ");
        return new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${primaryKeyName}" PRIMARY KEY (${columnNamesString})`);
    }
    /**
     * Builds drop primary key sql.
     */
    dropPrimaryKeySql(table) {
        const columnNames = table.primaryColumns.map(column => column.name);
        const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, columnNames);
        return new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${primaryKeyName}"`);
    }
    /**
     * Builds create unique constraint sql.
     */
    createUniqueConstraintSql(table, uniqueConstraint) {
        const columnNames = uniqueConstraint.columnNames.map(column => `"` + column + `"`).join(", ");
        return new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE (${columnNames})`);
    }
    /**
     * Builds drop unique constraint sql.
     */
    dropUniqueConstraintSql(table, uniqueOrName) {
        const uniqueName = uniqueOrName instanceof TableUnique_1.TableUnique ? uniqueOrName.name : uniqueOrName;
        return new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${uniqueName}"`);
    }
    /**
     * Builds create check constraint sql.
     */
    createCheckConstraintSql(table, checkConstraint) {
        return new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${checkConstraint.name}" CHECK (${checkConstraint.expression})`);
    }
    /**
     * Builds drop check constraint sql.
     */
    dropCheckConstraintSql(table, checkOrName) {
        const checkName = checkOrName instanceof TableCheck_1.TableCheck ? checkOrName.name : checkOrName;
        return new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${checkName}"`);
    }
    /**
     * Builds create foreign key sql.
     */
    createForeignKeySql(table, foreignKey) {
        const columnNames = foreignKey.columnNames.map(column => `"` + column + `"`).join(", ");
        const referencedColumnNames = foreignKey.referencedColumnNames.map(column => `"` + column + `"`).join(",");
        let sql = `ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${foreignKey.name}" FOREIGN KEY (${columnNames}) ` +
            `REFERENCES ${this.escapePath(foreignKey.referencedTableName)}(${referencedColumnNames})`;
        if (foreignKey.onDelete)
            sql += ` ON DELETE ${foreignKey.onDelete}`;
        if (foreignKey.onUpdate)
            sql += ` ON UPDATE ${foreignKey.onUpdate}`;
        return new Query_1.Query(sql);
    }
    /**
     * Builds drop foreign key sql.
     */
    dropForeignKeySql(table, foreignKeyOrName) {
        const foreignKeyName = foreignKeyOrName instanceof TableForeignKey_1.TableForeignKey ? foreignKeyOrName.name : foreignKeyOrName;
        return new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${foreignKeyName}"`);
    }
    /**
     * Escapes given table or View path.
     */
    escapePath(target, disableEscape) {
        let name = target instanceof Table_1.Table || target instanceof View_1.View ? target.name : target;
        if (this.driver.options.schema) {
            if (name.indexOf(".") === -1) {
                name = `${this.driver.options.schema}.${name}`;
            }
            else if (name.split(".").length === 3) {
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
    parseTableName(target, schema) {
        const tableName = (target instanceof Table_1.Table || target instanceof View_1.View) ? target.name : target;
        if (tableName.split(".").length === 3) {
            return {
                database: tableName.split(".")[0],
                schema: tableName.split(".")[1] === "" ? schema || "SCHEMA_NAME()" : tableName.split(".")[1],
                name: tableName.split(".")[2]
            };
        }
        else if (tableName.split(".").length === 2) {
            return {
                database: this.driver.database,
                schema: tableName.split(".")[0],
                name: tableName.split(".")[1]
            };
        }
        else {
            return {
                database: this.driver.database,
                schema: this.driver.options.schema ? this.driver.options.schema : schema || "SCHEMA_NAME()",
                name: tableName
            };
        }
    }
    /**
     * Concat database name and schema name to the foreign key name.
     * Needs because FK name is relevant to the schema and database.
     */
    buildForeignKeyName(fkName, schemaName, dbName) {
        let joinedFkName = fkName;
        if (schemaName)
            joinedFkName = schemaName + "." + joinedFkName;
        if (dbName)
            joinedFkName = dbName + "." + joinedFkName;
        return joinedFkName;
    }
    /**
     * Removes parenthesis around default value.
     * Sql server returns default value with parenthesis around, e.g.
     *  ('My text') - for string
     *  ((1)) - for number
     *  (newsequentialId()) - for function
     */
    removeParenthesisFromDefault(defaultValue) {
        if (defaultValue.substr(0, 1) !== "(")
            return defaultValue;
        const normalizedDefault = defaultValue.substr(1, defaultValue.lastIndexOf(")") - 1);
        return this.removeParenthesisFromDefault(normalizedDefault);
    }
    /**
     * Builds a query for create column.
     */
    buildCreateColumnSql(table, column, skipIdentity, createDefault) {
        let c = `"${column.name}" ${this.connection.driver.createFullType(column)}`;
        if (column.enum) {
            const expression = column.name + " IN (" + column.enum.map(val => "'" + val + "'").join(",") + ")";
            const checkName = this.connection.namingStrategy.checkConstraintName(table, expression, true);
            c += ` CONSTRAINT ${checkName} CHECK(${expression})`;
        }
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
    isEnumCheckConstraint(name) {
        return name.indexOf("CHK_") !== -1 && name.indexOf("_ENUM") !== -1;
    }
    /**
     * Converts MssqlParameter into real mssql parameter type.
     */
    mssqlParameterToNativeParameter(parameter) {
        switch (this.driver.normalizeType({ type: parameter.type })) {
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
            case "rowversion":
                return this.driver.mssql.RowVersion;
        }
    }
    /**
     * Converts string literal of isolation level to enum.
     * The underlying mssql driver requires an enum for the isolation level.
     */
    convertIsolationLevel(isolation) {
        const ISOLATION_LEVEL = this.driver.mssql.ISOLATION_LEVEL;
        switch (isolation) {
            case "READ UNCOMMITTED":
                return ISOLATION_LEVEL.READ_UNCOMMITTED;
            case "REPEATABLE READ":
                return ISOLATION_LEVEL.REPEATABLE_READ;
            case "SERIALIZABLE":
                return ISOLATION_LEVEL.SERIALIZABLE;
            case "READ COMMITTED":
            default:
                return ISOLATION_LEVEL.READ_COMMITTED;
        }
    }
}
exports.SqlServerQueryRunner = SqlServerQueryRunner;
//# sourceMappingURL=SqlServerQueryRunner.js.map