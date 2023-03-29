"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OracleQueryRunner = void 0;
var tslib_1 = require("tslib");
var TransactionAlreadyStartedError_1 = require("../../error/TransactionAlreadyStartedError");
var TransactionNotStartedError_1 = require("../../error/TransactionNotStartedError");
var TableColumn_1 = require("../../schema-builder/table/TableColumn");
var Table_1 = require("../../schema-builder/table/Table");
var TableForeignKey_1 = require("../../schema-builder/table/TableForeignKey");
var TableIndex_1 = require("../../schema-builder/table/TableIndex");
var QueryRunnerAlreadyReleasedError_1 = require("../../error/QueryRunnerAlreadyReleasedError");
var View_1 = require("../../schema-builder/view/View");
var Query_1 = require("../Query");
var QueryFailedError_1 = require("../../error/QueryFailedError");
var TableUnique_1 = require("../../schema-builder/table/TableUnique");
var Broadcaster_1 = require("../../subscriber/Broadcaster");
var BaseQueryRunner_1 = require("../../query-runner/BaseQueryRunner");
var OrmUtils_1 = require("../../util/OrmUtils");
var TableCheck_1 = require("../../schema-builder/table/TableCheck");
var BroadcasterResult_1 = require("../../subscriber/BroadcasterResult");
/**
 * Runs queries on a single oracle database connection.
 */
var OracleQueryRunner = /** @class */ (function (_super) {
    tslib_1.__extends(OracleQueryRunner, _super);
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function OracleQueryRunner(driver, mode) {
        var _this = _super.call(this) || this;
        _this.driver = driver;
        _this.connection = driver.connection;
        _this.broadcaster = new Broadcaster_1.Broadcaster(_this);
        _this.mode = mode;
        return _this;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates/uses database connection from the connection pool to perform further operations.
     * Returns obtained database connection.
     */
    OracleQueryRunner.prototype.connect = function () {
        var _this = this;
        if (this.databaseConnection)
            return Promise.resolve(this.databaseConnection);
        if (this.databaseConnectionPromise)
            return this.databaseConnectionPromise;
        if (this.mode === "slave" && this.driver.isReplicated) {
            this.databaseConnectionPromise = this.driver.obtainSlaveConnection().then(function (connection) {
                _this.databaseConnection = connection;
                return _this.databaseConnection;
            });
        }
        else { // master
            this.databaseConnectionPromise = this.driver.obtainMasterConnection().then(function (connection) {
                _this.databaseConnection = connection;
                return _this.databaseConnection;
            });
        }
        return this.databaseConnectionPromise;
    };
    /**
     * Releases used database connection.
     * You cannot use query runner methods once its released.
     */
    OracleQueryRunner.prototype.release = function () {
        var _this = this;
        return new Promise(function (ok, fail) {
            _this.isReleased = true;
            if (_this.databaseConnection) {
                _this.databaseConnection.close(function (err) {
                    if (err)
                        return fail(err);
                    ok();
                });
            }
            else {
                ok();
            }
        });
    };
    /**
     * Starts transaction.
     */
    OracleQueryRunner.prototype.startTransaction = function (isolationLevel) {
        if (isolationLevel === void 0) { isolationLevel = "READ COMMITTED"; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var beforeBroadcastResult, afterBroadcastResult;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isReleased)
                            throw new QueryRunnerAlreadyReleasedError_1.QueryRunnerAlreadyReleasedError();
                        if (this.isTransactionActive)
                            throw new TransactionAlreadyStartedError_1.TransactionAlreadyStartedError();
                        // await this.query("START TRANSACTION");
                        if (isolationLevel !== "SERIALIZABLE" && isolationLevel !== "READ COMMITTED") {
                            throw new Error("Oracle only supports SERIALIZABLE and READ COMMITTED isolation");
                        }
                        beforeBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
                        this.broadcaster.broadcastBeforeTransactionStartEvent(beforeBroadcastResult);
                        if (!(beforeBroadcastResult.promises.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.all(beforeBroadcastResult.promises)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.query("SET TRANSACTION ISOLATION LEVEL " + isolationLevel)];
                    case 3:
                        _a.sent();
                        this.isTransactionActive = true;
                        afterBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
                        this.broadcaster.broadcastAfterTransactionStartEvent(afterBroadcastResult);
                        if (!(afterBroadcastResult.promises.length > 0)) return [3 /*break*/, 5];
                        return [4 /*yield*/, Promise.all(afterBroadcastResult.promises)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    OracleQueryRunner.prototype.commitTransaction = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var beforeBroadcastResult, afterBroadcastResult;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isTransactionActive)
                            throw new TransactionNotStartedError_1.TransactionNotStartedError();
                        beforeBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
                        this.broadcaster.broadcastBeforeTransactionCommitEvent(beforeBroadcastResult);
                        if (!(beforeBroadcastResult.promises.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.all(beforeBroadcastResult.promises)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.query("COMMIT")];
                    case 3:
                        _a.sent();
                        this.isTransactionActive = false;
                        afterBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
                        this.broadcaster.broadcastAfterTransactionCommitEvent(afterBroadcastResult);
                        if (!(afterBroadcastResult.promises.length > 0)) return [3 /*break*/, 5];
                        return [4 /*yield*/, Promise.all(afterBroadcastResult.promises)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    OracleQueryRunner.prototype.rollbackTransaction = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var beforeBroadcastResult, afterBroadcastResult;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isTransactionActive)
                            throw new TransactionNotStartedError_1.TransactionNotStartedError();
                        beforeBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
                        this.broadcaster.broadcastBeforeTransactionRollbackEvent(beforeBroadcastResult);
                        if (!(beforeBroadcastResult.promises.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.all(beforeBroadcastResult.promises)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.query("ROLLBACK")];
                    case 3:
                        _a.sent();
                        this.isTransactionActive = false;
                        afterBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
                        this.broadcaster.broadcastAfterTransactionRollbackEvent(afterBroadcastResult);
                        if (!(afterBroadcastResult.promises.length > 0)) return [3 /*break*/, 5];
                        return [4 /*yield*/, Promise.all(afterBroadcastResult.promises)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Executes a given SQL query.
     */
    OracleQueryRunner.prototype.query = function (query, parameters) {
        var _this = this;
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError_1.QueryRunnerAlreadyReleasedError();
        return new Promise(function (ok, fail) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var queryStartTime_1, handler, executionOptions, databaseConnection, err_1;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.driver.connection.logger.logQuery(query, parameters, this);
                        queryStartTime_1 = +new Date();
                        handler = function (err, result) {
                            // log slow queries if maxQueryExecution time is set
                            var maxQueryExecutionTime = _this.driver.connection.options.maxQueryExecutionTime;
                            var queryEndTime = +new Date();
                            var queryExecutionTime = queryEndTime - queryStartTime_1;
                            if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                                _this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, _this);
                            if (err) {
                                _this.driver.connection.logger.logQueryError(err, query, parameters, _this);
                                return fail(new QueryFailedError_1.QueryFailedError(query, parameters, err));
                            }
                            // TODO: find better solution. Must return result instead of properties
                            ok(result.rows || result.outBinds || result.rowsAffected);
                        };
                        executionOptions = {
                            autoCommit: this.isTransactionActive ? false : true
                        };
                        return [4 /*yield*/, this.connect()];
                    case 1:
                        databaseConnection = _a.sent();
                        databaseConnection.execute(query, parameters || {}, executionOptions, handler);
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _a.sent();
                        fail(err_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * Returns raw data stream.
     */
    OracleQueryRunner.prototype.stream = function (query, parameters, onEnd, onError) {
        throw new Error("Stream is not supported by Oracle driver.");
    };
    /**
     * Returns all available database names including system databases.
     */
    OracleQueryRunner.prototype.getDatabases = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, Promise.resolve([])];
            });
        });
    };
    /**
     * Returns all available schema names including system schemas.
     * If database parameter specified, returns schemas of that database.
     */
    OracleQueryRunner.prototype.getSchemas = function (database) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, Promise.resolve([])];
            });
        });
    };
    /**
     * Checks if database with the given name exist.
     */
    OracleQueryRunner.prototype.hasDatabase = function (database) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, Promise.resolve(false)];
            });
        });
    };
    /**
     * Checks if schema with the given name exist.
     */
    OracleQueryRunner.prototype.hasSchema = function (schema) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, Promise.resolve(false)];
            });
        });
    };
    /**
     * Checks if table with the given name exist in the database.
     */
    OracleQueryRunner.prototype.hasTable = function (tableOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var tableName, sql, result;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tableName = tableOrName instanceof Table_1.Table ? tableOrName.name : tableOrName;
                        sql = "SELECT \"TABLE_NAME\" FROM \"USER_TABLES\" WHERE \"TABLE_NAME\" = '" + tableName + "'";
                        return [4 /*yield*/, this.query(sql)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.length ? true : false];
                }
            });
        });
    };
    /**
     * Checks if column with the given name exist in the given table.
     */
    OracleQueryRunner.prototype.hasColumn = function (tableOrName, columnName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var tableName, sql, result;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tableName = tableOrName instanceof Table_1.Table ? tableOrName.name : tableOrName;
                        sql = "SELECT \"COLUMN_NAME\" FROM \"USER_TAB_COLS\" WHERE \"TABLE_NAME\" = '" + tableName + "' AND \"COLUMN_NAME\" = '" + columnName + "'";
                        return [4 /*yield*/, this.query(sql)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.length ? true : false];
                }
            });
        });
    };
    /**
     * Creates a new database.
     */
    OracleQueryRunner.prototype.createDatabase = function (database, ifNotExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.query("CREATE DATABASE IF NOT EXISTS \"" + database + "\"")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops database.
     */
    OracleQueryRunner.prototype.dropDatabase = function (database, ifExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, Promise.resolve()];
            });
        });
    };
    /**
     * Creates a new table schema.
     */
    OracleQueryRunner.prototype.createSchema = function (schemas, ifNotExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema create queries are not supported by Oracle driver.");
            });
        });
    };
    /**
     * Drops table schema.
     */
    OracleQueryRunner.prototype.dropSchema = function (schemaPath, ifExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Schema drop queries are not supported by Oracle driver.");
            });
        });
    };
    /**
     * Creates a new table.
     */
    OracleQueryRunner.prototype.createTable = function (table, ifNotExist, createForeignKeys, createIndices) {
        if (ifNotExist === void 0) { ifNotExist = false; }
        if (createForeignKeys === void 0) { createForeignKeys = true; }
        if (createIndices === void 0) { createIndices = true; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var isTableExist, upQueries, downQueries;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!ifNotExist) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.hasTable(table)];
                    case 1:
                        isTableExist = _a.sent();
                        if (isTableExist)
                            return [2 /*return*/, Promise.resolve()];
                        _a.label = 2;
                    case 2:
                        upQueries = [];
                        downQueries = [];
                        upQueries.push(this.createTableSql(table, createForeignKeys));
                        downQueries.push(this.dropTableSql(table));
                        // if createForeignKeys is true, we must drop created foreign keys in down query.
                        // createTable does not need separate method to create foreign keys, because it create fk's in the same query with table creation.
                        if (createForeignKeys)
                            table.foreignKeys.forEach(function (foreignKey) { return downQueries.push(_this.dropForeignKeySql(table, foreignKey)); });
                        if (createIndices) {
                            table.indices.forEach(function (index) {
                                // new index may be passed without name. In this case we generate index name manually.
                                if (!index.name)
                                    index.name = _this.connection.namingStrategy.indexName(table.name, index.columnNames, index.where);
                                upQueries.push(_this.createIndexSql(table, index));
                                downQueries.push(_this.dropIndexSql(index));
                            });
                        }
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops the table.
     */
    OracleQueryRunner.prototype.dropTable = function (tableOrName, ifExist, dropForeignKeys, dropIndices) {
        if (dropForeignKeys === void 0) { dropForeignKeys = true; }
        if (dropIndices === void 0) { dropIndices = true; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var isTableExist, createForeignKeys, table, _a, upQueries, downQueries;
            var _this = this;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!ifExist) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.hasTable(tableOrName)];
                    case 1:
                        isTableExist = _b.sent();
                        if (!isTableExist)
                            return [2 /*return*/, Promise.resolve()];
                        _b.label = 2;
                    case 2:
                        createForeignKeys = dropForeignKeys;
                        if (!(tableOrName instanceof Table_1.Table)) return [3 /*break*/, 3];
                        _a = tableOrName;
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 4:
                        _a = _b.sent();
                        _b.label = 5;
                    case 5:
                        table = _a;
                        upQueries = [];
                        downQueries = [];
                        if (dropIndices) {
                            table.indices.forEach(function (index) {
                                upQueries.push(_this.dropIndexSql(index));
                                downQueries.push(_this.createIndexSql(table, index));
                            });
                        }
                        // if dropForeignKeys is true, we just drop the table, otherwise we also drop table foreign keys.
                        // createTable does not need separate method to create foreign keys, because it create fk's in the same query with table creation.
                        if (dropForeignKeys)
                            table.foreignKeys.forEach(function (foreignKey) { return upQueries.push(_this.dropForeignKeySql(table, foreignKey)); });
                        upQueries.push(this.dropTableSql(table));
                        downQueries.push(this.createTableSql(table, createForeignKeys));
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 6:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new view.
     */
    OracleQueryRunner.prototype.createView = function (view) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var upQueries, downQueries;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        upQueries = [];
                        downQueries = [];
                        upQueries.push(this.createViewSql(view));
                        upQueries.push(this.insertViewDefinitionSql(view));
                        downQueries.push(this.dropViewSql(view));
                        downQueries.push(this.deleteViewDefinitionSql(view));
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops the view.
     */
    OracleQueryRunner.prototype.dropView = function (target) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var viewName, view, upQueries, downQueries;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        viewName = target instanceof View_1.View ? target.name : target;
                        return [4 /*yield*/, this.getCachedView(viewName)];
                    case 1:
                        view = _a.sent();
                        upQueries = [];
                        downQueries = [];
                        upQueries.push(this.deleteViewDefinitionSql(view));
                        upQueries.push(this.dropViewSql(view));
                        downQueries.push(this.insertViewDefinitionSql(view));
                        downQueries.push(this.createViewSql(view));
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Renames the given table.
     */
    OracleQueryRunner.prototype.renameTable = function (oldTableOrName, newTableOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var upQueries, downQueries, oldTable, _a, newTable, columnNames, oldPkName, newPkName;
            var _this = this;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        upQueries = [];
                        downQueries = [];
                        if (!(oldTableOrName instanceof Table_1.Table)) return [3 /*break*/, 1];
                        _a = oldTableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(oldTableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        oldTable = _a;
                        newTable = oldTable.clone();
                        if (newTableOrName instanceof Table_1.Table) {
                            newTable = newTableOrName;
                        }
                        else {
                            newTable.name = newTableOrName;
                        }
                        // rename table
                        upQueries.push(new Query_1.Query("ALTER TABLE \"" + oldTable.name + "\" RENAME TO \"" + newTable.name + "\""));
                        downQueries.push(new Query_1.Query("ALTER TABLE \"" + newTable.name + "\" RENAME TO \"" + oldTable.name + "\""));
                        // rename primary key constraint
                        if (newTable.primaryColumns.length > 0) {
                            columnNames = newTable.primaryColumns.map(function (column) { return column.name; });
                            oldPkName = this.connection.namingStrategy.primaryKeyName(oldTable, columnNames);
                            newPkName = this.connection.namingStrategy.primaryKeyName(newTable, columnNames);
                            // build queries
                            upQueries.push(new Query_1.Query("ALTER TABLE \"" + newTable.name + "\" RENAME CONSTRAINT \"" + oldPkName + "\" TO \"" + newPkName + "\""));
                            downQueries.push(new Query_1.Query("ALTER TABLE \"" + newTable.name + "\" RENAME CONSTRAINT \"" + newPkName + "\" TO \"" + oldPkName + "\""));
                        }
                        // rename unique constraints
                        newTable.uniques.forEach(function (unique) {
                            // build new constraint name
                            var newUniqueName = _this.connection.namingStrategy.uniqueConstraintName(newTable, unique.columnNames);
                            // build queries
                            upQueries.push(new Query_1.Query("ALTER TABLE \"" + newTable.name + "\" RENAME CONSTRAINT \"" + unique.name + "\" TO \"" + newUniqueName + "\""));
                            downQueries.push(new Query_1.Query("ALTER TABLE \"" + newTable.name + "\" RENAME CONSTRAINT \"" + newUniqueName + "\" TO \"" + unique.name + "\""));
                            // replace constraint name
                            unique.name = newUniqueName;
                        });
                        // rename index constraints
                        newTable.indices.forEach(function (index) {
                            // build new constraint name
                            var newIndexName = _this.connection.namingStrategy.indexName(newTable, index.columnNames, index.where);
                            // build queries
                            upQueries.push(new Query_1.Query("ALTER INDEX \"" + index.name + "\" RENAME TO \"" + newIndexName + "\""));
                            downQueries.push(new Query_1.Query("ALTER INDEX \"" + newIndexName + "\" RENAME TO \"" + index.name + "\""));
                            // replace constraint name
                            index.name = newIndexName;
                        });
                        // rename foreign key constraints
                        newTable.foreignKeys.forEach(function (foreignKey) {
                            // build new constraint name
                            var newForeignKeyName = _this.connection.namingStrategy.foreignKeyName(newTable, foreignKey.columnNames, foreignKey.referencedTableName, foreignKey.referencedColumnNames);
                            // build queries
                            upQueries.push(new Query_1.Query("ALTER TABLE \"" + newTable.name + "\" RENAME CONSTRAINT \"" + foreignKey.name + "\" TO \"" + newForeignKeyName + "\""));
                            downQueries.push(new Query_1.Query("ALTER TABLE \"" + newTable.name + "\" RENAME CONSTRAINT \"" + newForeignKeyName + "\" TO \"" + foreignKey.name + "\""));
                            // replace constraint name
                            foreignKey.name = newForeignKeyName;
                        });
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 4:
                        _b.sent();
                        // rename old table and replace it in cached tabled;
                        oldTable.name = newTable.name;
                        this.replaceCachedTable(oldTable, newTable);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new column from the column in the table.
     */
    OracleQueryRunner.prototype.addColumn = function (tableOrName, column) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, _a, clonedTable, upQueries, downQueries, primaryColumns, pkName_1, columnNames_1, pkName, columnNames, columnIndex, uniqueConstraint;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table_1.Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        clonedTable = table.clone();
                        upQueries = [];
                        downQueries = [];
                        upQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" ADD " + this.buildCreateColumnSql(column)));
                        downQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" DROP COLUMN \"" + column.name + "\""));
                        // create or update primary key constraint
                        if (column.isPrimary) {
                            primaryColumns = clonedTable.primaryColumns;
                            // if table already have primary key, me must drop it and recreate again
                            if (primaryColumns.length > 0) {
                                pkName_1 = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(function (column) { return column.name; }));
                                columnNames_1 = primaryColumns.map(function (column) { return "\"" + column.name + "\""; }).join(", ");
                                upQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" DROP CONSTRAINT \"" + pkName_1 + "\""));
                                downQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" ADD CONSTRAINT \"" + pkName_1 + "\" PRIMARY KEY (" + columnNames_1 + ")"));
                            }
                            primaryColumns.push(column);
                            pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(function (column) { return column.name; }));
                            columnNames = primaryColumns.map(function (column) { return "\"" + column.name + "\""; }).join(", ");
                            upQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" ADD CONSTRAINT \"" + pkName + "\" PRIMARY KEY (" + columnNames + ")"));
                            downQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" DROP CONSTRAINT \"" + pkName + "\""));
                        }
                        columnIndex = clonedTable.indices.find(function (index) { return index.columnNames.length === 1 && index.columnNames[0] === column.name; });
                        if (columnIndex) {
                            clonedTable.indices.splice(clonedTable.indices.indexOf(columnIndex), 1);
                            upQueries.push(this.createIndexSql(table, columnIndex));
                            downQueries.push(this.dropIndexSql(columnIndex));
                        }
                        // create unique constraint
                        if (column.isUnique) {
                            uniqueConstraint = new TableUnique_1.TableUnique({
                                name: this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]),
                                columnNames: [column.name]
                            });
                            clonedTable.uniques.push(uniqueConstraint);
                            upQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" ADD CONSTRAINT \"" + uniqueConstraint.name + "\" UNIQUE (\"" + column.name + "\")"));
                            downQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" DROP CONSTRAINT \"" + uniqueConstraint.name + "\""));
                        }
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 4:
                        _b.sent();
                        clonedTable.addColumn(column);
                        this.replaceCachedTable(table, clonedTable);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new columns from the column in the table.
     */
    OracleQueryRunner.prototype.addColumns = function (tableOrName, columns) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var columns_1, columns_1_1, column, e_1_1;
            var e_1, _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, 6, 7]);
                        columns_1 = tslib_1.__values(columns), columns_1_1 = columns_1.next();
                        _b.label = 1;
                    case 1:
                        if (!!columns_1_1.done) return [3 /*break*/, 4];
                        column = columns_1_1.value;
                        return [4 /*yield*/, this.addColumn(tableOrName, column)];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        columns_1_1 = columns_1.next();
                        return [3 /*break*/, 1];
                    case 4: return [3 /*break*/, 7];
                    case 5:
                        e_1_1 = _b.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 7];
                    case 6:
                        try {
                            if (columns_1_1 && !columns_1_1.done && (_a = columns_1.return)) _a.call(columns_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Renames column in the given table.
     */
    OracleQueryRunner.prototype.renameColumn = function (tableOrName, oldTableColumnOrName, newTableColumnOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, _a, oldColumn, newColumn;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table_1.Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        oldColumn = oldTableColumnOrName instanceof TableColumn_1.TableColumn ? oldTableColumnOrName : table.columns.find(function (c) { return c.name === oldTableColumnOrName; });
                        if (!oldColumn)
                            throw new Error("Column \"" + oldTableColumnOrName + "\" was not found in the \"" + table.name + "\" table.");
                        newColumn = undefined;
                        if (newTableColumnOrName instanceof TableColumn_1.TableColumn) {
                            newColumn = newTableColumnOrName;
                        }
                        else {
                            newColumn = oldColumn.clone();
                            newColumn.name = newTableColumnOrName;
                        }
                        return [4 /*yield*/, this.changeColumn(table, oldColumn, newColumn)];
                    case 4:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Changes a column in the table.
     */
    OracleQueryRunner.prototype.changeColumn = function (tableOrName, oldTableColumnOrName, newColumn) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, _a, clonedTable, upQueries, downQueries, oldColumn, primaryColumns, columnNames, oldPkName, newPkName, oldTableColumn, defaultUp, defaultDown, nullableUp, nullableDown, primaryColumns, pkName, columnNames, column, pkName, columnNames, primaryColumn, column, pkName, columnNames, uniqueConstraint, uniqueConstraint;
            var _this = this;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table_1.Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        clonedTable = table.clone();
                        upQueries = [];
                        downQueries = [];
                        oldColumn = oldTableColumnOrName instanceof TableColumn_1.TableColumn
                            ? oldTableColumnOrName
                            : table.columns.find(function (column) { return column.name === oldTableColumnOrName; });
                        if (!oldColumn)
                            throw new Error("Column \"" + oldTableColumnOrName + "\" was not found in the \"" + table.name + "\" table.");
                        if (!((newColumn.isGenerated !== oldColumn.isGenerated && newColumn.generationStrategy !== "uuid") || oldColumn.type !== newColumn.type || oldColumn.length !== newColumn.length)) return [3 /*break*/, 6];
                        // Oracle does not support changing of IDENTITY column, so we must drop column and recreate it again.
                        // Also, we recreate column if column type changed
                        return [4 /*yield*/, this.dropColumn(table, oldColumn)];
                    case 4:
                        // Oracle does not support changing of IDENTITY column, so we must drop column and recreate it again.
                        // Also, we recreate column if column type changed
                        _b.sent();
                        return [4 /*yield*/, this.addColumn(table, newColumn)];
                    case 5:
                        _b.sent();
                        // update cloned table
                        clonedTable = table.clone();
                        return [3 /*break*/, 8];
                    case 6:
                        if (newColumn.name !== oldColumn.name) {
                            // rename column
                            upQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" RENAME COLUMN \"" + oldColumn.name + "\" TO \"" + newColumn.name + "\""));
                            downQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" RENAME COLUMN \"" + newColumn.name + "\" TO \"" + oldColumn.name + "\""));
                            // rename column primary key constraint
                            if (oldColumn.isPrimary === true) {
                                primaryColumns = clonedTable.primaryColumns;
                                columnNames = primaryColumns.map(function (column) { return column.name; });
                                oldPkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);
                                // replace old column name with new column name
                                columnNames.splice(columnNames.indexOf(oldColumn.name), 1);
                                columnNames.push(newColumn.name);
                                newPkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);
                                upQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" RENAME CONSTRAINT \"" + oldPkName + "\" TO \"" + newPkName + "\""));
                                downQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" RENAME CONSTRAINT \"" + newPkName + "\" TO \"" + oldPkName + "\""));
                            }
                            // rename unique constraints
                            clonedTable.findColumnUniques(oldColumn).forEach(function (unique) {
                                // build new constraint name
                                unique.columnNames.splice(unique.columnNames.indexOf(oldColumn.name), 1);
                                unique.columnNames.push(newColumn.name);
                                var newUniqueName = _this.connection.namingStrategy.uniqueConstraintName(clonedTable, unique.columnNames);
                                // build queries
                                upQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" RENAME CONSTRAINT \"" + unique.name + "\" TO \"" + newUniqueName + "\""));
                                downQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" RENAME CONSTRAINT \"" + newUniqueName + "\" TO \"" + unique.name + "\""));
                                // replace constraint name
                                unique.name = newUniqueName;
                            });
                            // rename index constraints
                            clonedTable.findColumnIndices(oldColumn).forEach(function (index) {
                                // build new constraint name
                                index.columnNames.splice(index.columnNames.indexOf(oldColumn.name), 1);
                                index.columnNames.push(newColumn.name);
                                var newIndexName = _this.connection.namingStrategy.indexName(clonedTable, index.columnNames, index.where);
                                // build queries
                                upQueries.push(new Query_1.Query("ALTER INDEX \"" + index.name + "\" RENAME TO \"" + newIndexName + "\""));
                                downQueries.push(new Query_1.Query("ALTER INDEX \"" + newIndexName + "\" RENAME TO \"" + index.name + "\""));
                                // replace constraint name
                                index.name = newIndexName;
                            });
                            // rename foreign key constraints
                            clonedTable.findColumnForeignKeys(oldColumn).forEach(function (foreignKey) {
                                // build new constraint name
                                foreignKey.columnNames.splice(foreignKey.columnNames.indexOf(oldColumn.name), 1);
                                foreignKey.columnNames.push(newColumn.name);
                                var newForeignKeyName = _this.connection.namingStrategy.foreignKeyName(clonedTable, foreignKey.columnNames, foreignKey.referencedTableName, foreignKey.referencedColumnNames);
                                // build queries
                                upQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" RENAME CONSTRAINT \"" + foreignKey.name + "\" TO \"" + newForeignKeyName + "\""));
                                downQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" RENAME CONSTRAINT \"" + newForeignKeyName + "\" TO \"" + foreignKey.name + "\""));
                                // replace constraint name
                                foreignKey.name = newForeignKeyName;
                            });
                            oldTableColumn = clonedTable.columns.find(function (column) { return column.name === oldColumn.name; });
                            clonedTable.columns[clonedTable.columns.indexOf(oldTableColumn)].name = newColumn.name;
                            oldColumn.name = newColumn.name;
                        }
                        if (this.isColumnChanged(oldColumn, newColumn, true)) {
                            defaultUp = "";
                            defaultDown = "";
                            nullableUp = "";
                            nullableDown = "";
                            // changing column default
                            if (newColumn.default !== null && newColumn.default !== undefined) {
                                defaultUp = "DEFAULT " + newColumn.default;
                                if (oldColumn.default !== null && oldColumn.default !== undefined) {
                                    defaultDown = "DEFAULT " + oldColumn.default;
                                }
                                else {
                                    defaultDown = "DEFAULT NULL";
                                }
                            }
                            else if (oldColumn.default !== null && oldColumn.default !== undefined) {
                                defaultUp = "DEFAULT NULL";
                                defaultDown = "DEFAULT " + oldColumn.default;
                            }
                            // changing column isNullable property
                            if (newColumn.isNullable !== oldColumn.isNullable) {
                                if (newColumn.isNullable === true) {
                                    nullableUp = "NULL";
                                    nullableDown = "NOT NULL";
                                }
                                else {
                                    nullableUp = "NOT NULL";
                                    nullableDown = "NULL";
                                }
                            }
                            upQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" MODIFY \"" + oldColumn.name + "\" " + this.connection.driver.createFullType(newColumn) + " " + defaultUp + " " + nullableUp));
                            downQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" MODIFY \"" + oldColumn.name + "\" " + this.connection.driver.createFullType(oldColumn) + " " + defaultDown + " " + nullableDown));
                        }
                        if (newColumn.isPrimary !== oldColumn.isPrimary) {
                            primaryColumns = clonedTable.primaryColumns;
                            // if primary column state changed, we must always drop existed constraint.
                            if (primaryColumns.length > 0) {
                                pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(function (column) { return column.name; }));
                                columnNames = primaryColumns.map(function (column) { return "\"" + column.name + "\""; }).join(", ");
                                upQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" DROP CONSTRAINT \"" + pkName + "\""));
                                downQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" ADD CONSTRAINT \"" + pkName + "\" PRIMARY KEY (" + columnNames + ")"));
                            }
                            if (newColumn.isPrimary === true) {
                                primaryColumns.push(newColumn);
                                column = clonedTable.columns.find(function (column) { return column.name === newColumn.name; });
                                column.isPrimary = true;
                                pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(function (column) { return column.name; }));
                                columnNames = primaryColumns.map(function (column) { return "\"" + column.name + "\""; }).join(", ");
                                upQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" ADD CONSTRAINT \"" + pkName + "\" PRIMARY KEY (" + columnNames + ")"));
                                downQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" DROP CONSTRAINT \"" + pkName + "\""));
                            }
                            else {
                                primaryColumn = primaryColumns.find(function (c) { return c.name === newColumn.name; });
                                primaryColumns.splice(primaryColumns.indexOf(primaryColumn), 1);
                                column = clonedTable.columns.find(function (column) { return column.name === newColumn.name; });
                                column.isPrimary = false;
                                // if we have another primary keys, we must recreate constraint.
                                if (primaryColumns.length > 0) {
                                    pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(function (column) { return column.name; }));
                                    columnNames = primaryColumns.map(function (column) { return "\"" + column.name + "\""; }).join(", ");
                                    upQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" ADD CONSTRAINT \"" + pkName + "\" PRIMARY KEY (" + columnNames + ")"));
                                    downQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" DROP CONSTRAINT \"" + pkName + "\""));
                                }
                            }
                        }
                        if (newColumn.isUnique !== oldColumn.isUnique) {
                            if (newColumn.isUnique === true) {
                                uniqueConstraint = new TableUnique_1.TableUnique({
                                    name: this.connection.namingStrategy.uniqueConstraintName(table.name, [newColumn.name]),
                                    columnNames: [newColumn.name]
                                });
                                clonedTable.uniques.push(uniqueConstraint);
                                upQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" ADD CONSTRAINT \"" + uniqueConstraint.name + "\" UNIQUE (\"" + newColumn.name + "\")"));
                                downQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" DROP CONSTRAINT \"" + uniqueConstraint.name + "\""));
                            }
                            else {
                                uniqueConstraint = clonedTable.uniques.find(function (unique) {
                                    return unique.columnNames.length === 1 && !!unique.columnNames.find(function (columnName) { return columnName === newColumn.name; });
                                });
                                clonedTable.uniques.splice(clonedTable.uniques.indexOf(uniqueConstraint), 1);
                                upQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" DROP CONSTRAINT \"" + uniqueConstraint.name + "\""));
                                downQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" ADD CONSTRAINT \"" + uniqueConstraint.name + "\" UNIQUE (\"" + newColumn.name + "\")"));
                            }
                        }
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 7:
                        _b.sent();
                        this.replaceCachedTable(table, clonedTable);
                        _b.label = 8;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Changes a column in the table.
     */
    OracleQueryRunner.prototype.changeColumns = function (tableOrName, changedColumns) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var changedColumns_1, changedColumns_1_1, _a, oldColumn, newColumn, e_2_1;
            var e_2, _b;
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 5, 6, 7]);
                        changedColumns_1 = tslib_1.__values(changedColumns), changedColumns_1_1 = changedColumns_1.next();
                        _c.label = 1;
                    case 1:
                        if (!!changedColumns_1_1.done) return [3 /*break*/, 4];
                        _a = changedColumns_1_1.value, oldColumn = _a.oldColumn, newColumn = _a.newColumn;
                        return [4 /*yield*/, this.changeColumn(tableOrName, oldColumn, newColumn)];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3:
                        changedColumns_1_1 = changedColumns_1.next();
                        return [3 /*break*/, 1];
                    case 4: return [3 /*break*/, 7];
                    case 5:
                        e_2_1 = _c.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 7];
                    case 6:
                        try {
                            if (changedColumns_1_1 && !changedColumns_1_1.done && (_b = changedColumns_1.return)) _b.call(changedColumns_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops column in the table.
     */
    OracleQueryRunner.prototype.dropColumn = function (tableOrName, columnOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, _a, column, clonedTable, upQueries, downQueries, pkName, columnNames, tableColumn, pkName_2, columnNames_2, columnIndex, columnCheck, columnUnique;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table_1.Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        column = columnOrName instanceof TableColumn_1.TableColumn ? columnOrName : table.findColumnByName(columnOrName);
                        if (!column)
                            throw new Error("Column \"" + columnOrName + "\" was not found in table \"" + table.name + "\"");
                        clonedTable = table.clone();
                        upQueries = [];
                        downQueries = [];
                        // drop primary key constraint
                        if (column.isPrimary) {
                            pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, clonedTable.primaryColumns.map(function (column) { return column.name; }));
                            columnNames = clonedTable.primaryColumns.map(function (primaryColumn) { return "\"" + primaryColumn.name + "\""; }).join(", ");
                            upQueries.push(new Query_1.Query("ALTER TABLE \"" + clonedTable.name + "\" DROP CONSTRAINT \"" + pkName + "\""));
                            downQueries.push(new Query_1.Query("ALTER TABLE \"" + clonedTable.name + "\" ADD CONSTRAINT \"" + pkName + "\" PRIMARY KEY (" + columnNames + ")"));
                            tableColumn = clonedTable.findColumnByName(column.name);
                            tableColumn.isPrimary = false;
                            // if primary key have multiple columns, we must recreate it without dropped column
                            if (clonedTable.primaryColumns.length > 0) {
                                pkName_2 = this.connection.namingStrategy.primaryKeyName(clonedTable.name, clonedTable.primaryColumns.map(function (column) { return column.name; }));
                                columnNames_2 = clonedTable.primaryColumns.map(function (primaryColumn) { return "\"" + primaryColumn.name + "\""; }).join(", ");
                                upQueries.push(new Query_1.Query("ALTER TABLE \"" + clonedTable.name + "\" ADD CONSTRAINT \"" + pkName_2 + "\" PRIMARY KEY (" + columnNames_2 + ")"));
                                downQueries.push(new Query_1.Query("ALTER TABLE \"" + clonedTable.name + "\" DROP CONSTRAINT \"" + pkName_2 + "\""));
                            }
                        }
                        columnIndex = clonedTable.indices.find(function (index) { return index.columnNames.length === 1 && index.columnNames[0] === column.name; });
                        if (columnIndex) {
                            upQueries.push(this.dropIndexSql(columnIndex));
                            downQueries.push(this.createIndexSql(table, columnIndex));
                        }
                        columnCheck = clonedTable.checks.find(function (check) { return !!check.columnNames && check.columnNames.length === 1 && check.columnNames[0] === column.name; });
                        if (columnCheck) {
                            clonedTable.checks.splice(clonedTable.checks.indexOf(columnCheck), 1);
                            upQueries.push(this.dropCheckConstraintSql(table, columnCheck));
                            downQueries.push(this.createCheckConstraintSql(table, columnCheck));
                        }
                        columnUnique = clonedTable.uniques.find(function (unique) { return unique.columnNames.length === 1 && unique.columnNames[0] === column.name; });
                        if (columnUnique) {
                            clonedTable.uniques.splice(clonedTable.uniques.indexOf(columnUnique), 1);
                            upQueries.push(this.dropUniqueConstraintSql(table, columnUnique));
                            downQueries.push(this.createUniqueConstraintSql(table, columnUnique));
                        }
                        upQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" DROP COLUMN \"" + column.name + "\""));
                        downQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" ADD " + this.buildCreateColumnSql(column)));
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 4:
                        _b.sent();
                        clonedTable.removeColumn(column);
                        this.replaceCachedTable(table, clonedTable);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops the columns in the table.
     */
    OracleQueryRunner.prototype.dropColumns = function (tableOrName, columns) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var columns_2, columns_2_1, column, e_3_1;
            var e_3, _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, 6, 7]);
                        columns_2 = tslib_1.__values(columns), columns_2_1 = columns_2.next();
                        _b.label = 1;
                    case 1:
                        if (!!columns_2_1.done) return [3 /*break*/, 4];
                        column = columns_2_1.value;
                        return [4 /*yield*/, this.dropColumn(tableOrName, column)];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        columns_2_1 = columns_2.next();
                        return [3 /*break*/, 1];
                    case 4: return [3 /*break*/, 7];
                    case 5:
                        e_3_1 = _b.sent();
                        e_3 = { error: e_3_1 };
                        return [3 /*break*/, 7];
                    case 6:
                        try {
                            if (columns_2_1 && !columns_2_1.done && (_a = columns_2.return)) _a.call(columns_2);
                        }
                        finally { if (e_3) throw e_3.error; }
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new primary key.
     */
    OracleQueryRunner.prototype.createPrimaryKey = function (tableOrName, columnNames) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, _a, clonedTable, up, down;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table_1.Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        clonedTable = table.clone();
                        up = this.createPrimaryKeySql(table, columnNames);
                        // mark columns as primary, because dropPrimaryKeySql build constraint name from table primary column names.
                        clonedTable.columns.forEach(function (column) {
                            if (columnNames.find(function (columnName) { return columnName === column.name; }))
                                column.isPrimary = true;
                        });
                        down = this.dropPrimaryKeySql(clonedTable);
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        this.replaceCachedTable(table, clonedTable);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Updates composite primary keys.
     */
    OracleQueryRunner.prototype.updatePrimaryKeys = function (tableOrName, columns) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, _a, columnNames, clonedTable, upQueries, downQueries, primaryColumns, pkName_3, columnNamesString_1, pkName, columnNamesString;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table_1.Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        columnNames = columns.map(function (column) { return column.name; });
                        clonedTable = table.clone();
                        upQueries = [];
                        downQueries = [];
                        primaryColumns = clonedTable.primaryColumns;
                        if (primaryColumns.length > 0) {
                            pkName_3 = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(function (column) { return column.name; }));
                            columnNamesString_1 = primaryColumns.map(function (column) { return "\"" + column.name + "\""; }).join(", ");
                            upQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" DROP CONSTRAINT \"" + pkName_3 + "\""));
                            downQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" ADD CONSTRAINT \"" + pkName_3 + "\" PRIMARY KEY (" + columnNamesString_1 + ")"));
                        }
                        // update columns in table.
                        clonedTable.columns
                            .filter(function (column) { return columnNames.indexOf(column.name) !== -1; })
                            .forEach(function (column) { return column.isPrimary = true; });
                        pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, columnNames);
                        columnNamesString = columnNames.map(function (columnName) { return "\"" + columnName + "\""; }).join(", ");
                        upQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" ADD CONSTRAINT \"" + pkName + "\" PRIMARY KEY (" + columnNamesString + ")"));
                        downQueries.push(new Query_1.Query("ALTER TABLE \"" + table.name + "\" DROP CONSTRAINT \"" + pkName + "\""));
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 4:
                        _b.sent();
                        this.replaceCachedTable(table, clonedTable);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops a primary key.
     */
    OracleQueryRunner.prototype.dropPrimaryKey = function (tableOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, _a, up, down;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table_1.Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        up = this.dropPrimaryKeySql(table);
                        down = this.createPrimaryKeySql(table, table.primaryColumns.map(function (column) { return column.name; }));
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        table.primaryColumns.forEach(function (column) {
                            column.isPrimary = false;
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new unique constraint.
     */
    OracleQueryRunner.prototype.createUniqueConstraint = function (tableOrName, uniqueConstraint) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, _a, up, down;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table_1.Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        // new unique constraint may be passed without name. In this case we generate unique name manually.
                        if (!uniqueConstraint.name)
                            uniqueConstraint.name = this.connection.namingStrategy.uniqueConstraintName(table.name, uniqueConstraint.columnNames);
                        up = this.createUniqueConstraintSql(table, uniqueConstraint);
                        down = this.dropUniqueConstraintSql(table, uniqueConstraint);
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        table.addUniqueConstraint(uniqueConstraint);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new unique constraints.
     */
    OracleQueryRunner.prototype.createUniqueConstraints = function (tableOrName, uniqueConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = uniqueConstraints.map(function (uniqueConstraint) { return _this.createUniqueConstraint(tableOrName, uniqueConstraint); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops an unique constraint.
     */
    OracleQueryRunner.prototype.dropUniqueConstraint = function (tableOrName, uniqueOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, _a, uniqueConstraint, up, down;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table_1.Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        uniqueConstraint = uniqueOrName instanceof TableUnique_1.TableUnique ? uniqueOrName : table.uniques.find(function (u) { return u.name === uniqueOrName; });
                        if (!uniqueConstraint)
                            throw new Error("Supplied unique constraint was not found in table " + table.name);
                        up = this.dropUniqueConstraintSql(table, uniqueConstraint);
                        down = this.createUniqueConstraintSql(table, uniqueConstraint);
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        table.removeUniqueConstraint(uniqueConstraint);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates an unique constraints.
     */
    OracleQueryRunner.prototype.dropUniqueConstraints = function (tableOrName, uniqueConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = uniqueConstraints.map(function (uniqueConstraint) { return _this.dropUniqueConstraint(tableOrName, uniqueConstraint); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates new check constraint.
     */
    OracleQueryRunner.prototype.createCheckConstraint = function (tableOrName, checkConstraint) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, _a, up, down;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table_1.Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        // new unique constraint may be passed without name. In this case we generate unique name manually.
                        if (!checkConstraint.name)
                            checkConstraint.name = this.connection.namingStrategy.checkConstraintName(table.name, checkConstraint.expression);
                        up = this.createCheckConstraintSql(table, checkConstraint);
                        down = this.dropCheckConstraintSql(table, checkConstraint);
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        table.addCheckConstraint(checkConstraint);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates new check constraints.
     */
    OracleQueryRunner.prototype.createCheckConstraints = function (tableOrName, checkConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = checkConstraints.map(function (checkConstraint) { return _this.createCheckConstraint(tableOrName, checkConstraint); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops check constraint.
     */
    OracleQueryRunner.prototype.dropCheckConstraint = function (tableOrName, checkOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, _a, checkConstraint, up, down;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table_1.Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        checkConstraint = checkOrName instanceof TableCheck_1.TableCheck ? checkOrName : table.checks.find(function (c) { return c.name === checkOrName; });
                        if (!checkConstraint)
                            throw new Error("Supplied check constraint was not found in table " + table.name);
                        up = this.dropCheckConstraintSql(table, checkConstraint);
                        down = this.createCheckConstraintSql(table, checkConstraint);
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        table.removeCheckConstraint(checkConstraint);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops check constraints.
     */
    OracleQueryRunner.prototype.dropCheckConstraints = function (tableOrName, checkConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = checkConstraints.map(function (checkConstraint) { return _this.dropCheckConstraint(tableOrName, checkConstraint); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new exclusion constraint.
     */
    OracleQueryRunner.prototype.createExclusionConstraint = function (tableOrName, exclusionConstraint) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Oracle does not support exclusion constraints.");
            });
        });
    };
    /**
     * Creates a new exclusion constraints.
     */
    OracleQueryRunner.prototype.createExclusionConstraints = function (tableOrName, exclusionConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Oracle does not support exclusion constraints.");
            });
        });
    };
    /**
     * Drops exclusion constraint.
     */
    OracleQueryRunner.prototype.dropExclusionConstraint = function (tableOrName, exclusionOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Oracle does not support exclusion constraints.");
            });
        });
    };
    /**
     * Drops exclusion constraints.
     */
    OracleQueryRunner.prototype.dropExclusionConstraints = function (tableOrName, exclusionConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                throw new Error("Oracle does not support exclusion constraints.");
            });
        });
    };
    /**
     * Creates a new foreign key.
     */
    OracleQueryRunner.prototype.createForeignKey = function (tableOrName, foreignKey) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, _a, up, down;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table_1.Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        // new FK may be passed without name. In this case we generate FK name manually.
                        if (!foreignKey.name)
                            foreignKey.name = this.connection.namingStrategy.foreignKeyName(table.name, foreignKey.columnNames, foreignKey.referencedTableName, foreignKey.referencedColumnNames);
                        up = this.createForeignKeySql(table, foreignKey);
                        down = this.dropForeignKeySql(table, foreignKey);
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        table.addForeignKey(foreignKey);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new foreign keys.
     */
    OracleQueryRunner.prototype.createForeignKeys = function (tableOrName, foreignKeys) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = foreignKeys.map(function (foreignKey) { return _this.createForeignKey(tableOrName, foreignKey); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops a foreign key from the table.
     */
    OracleQueryRunner.prototype.dropForeignKey = function (tableOrName, foreignKeyOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, _a, foreignKey, up, down;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table_1.Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        foreignKey = foreignKeyOrName instanceof TableForeignKey_1.TableForeignKey ? foreignKeyOrName : table.foreignKeys.find(function (fk) { return fk.name === foreignKeyOrName; });
                        if (!foreignKey)
                            throw new Error("Supplied foreign key was not found in table " + table.name);
                        up = this.dropForeignKeySql(table, foreignKey);
                        down = this.createForeignKeySql(table, foreignKey);
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        table.removeForeignKey(foreignKey);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops a foreign keys from the table.
     */
    OracleQueryRunner.prototype.dropForeignKeys = function (tableOrName, foreignKeys) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = foreignKeys.map(function (foreignKey) { return _this.dropForeignKey(tableOrName, foreignKey); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new index.
     */
    OracleQueryRunner.prototype.createIndex = function (tableOrName, index) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, _a, up, down;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table_1.Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        // new index may be passed without name. In this case we generate index name manually.
                        if (!index.name)
                            index.name = this.connection.namingStrategy.indexName(table.name, index.columnNames, index.where);
                        up = this.createIndexSql(table, index);
                        down = this.dropIndexSql(index);
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        table.addIndex(index);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new indices
     */
    OracleQueryRunner.prototype.createIndices = function (tableOrName, indices) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = indices.map(function (index) { return _this.createIndex(tableOrName, index); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops an index from the table.
     */
    OracleQueryRunner.prototype.dropIndex = function (tableOrName, indexOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, _a, index, up, down;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table_1.Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        index = indexOrName instanceof TableIndex_1.TableIndex ? indexOrName : table.indices.find(function (i) { return i.name === indexOrName; });
                        if (!index)
                            throw new Error("Supplied index was not found in table " + table.name);
                        up = this.dropIndexSql(index);
                        down = this.createIndexSql(table, index);
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        table.removeIndex(index);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops an indices from the table.
     */
    OracleQueryRunner.prototype.dropIndices = function (tableOrName, indices) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = indices.map(function (index) { return _this.dropIndex(tableOrName, index); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clears all table contents.
     * Note: this operation uses SQL's TRUNCATE query which cannot be reverted in transactions.
     */
    OracleQueryRunner.prototype.clearTable = function (tableName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.query("TRUNCATE TABLE \"" + tableName + "\"")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Removes all tables from the currently connected database.
     */
    OracleQueryRunner.prototype.clearDatabase = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var dropViewsQuery, dropViewQueries, dropTablesQuery, dropTableQueries, error_1, rollbackError_1;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.startTransaction()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 8, , 13]);
                        dropViewsQuery = "SELECT 'DROP VIEW \"' || VIEW_NAME || '\"' AS \"query\" FROM \"USER_VIEWS\"";
                        return [4 /*yield*/, this.query(dropViewsQuery)];
                    case 3:
                        dropViewQueries = _a.sent();
                        return [4 /*yield*/, Promise.all(dropViewQueries.map(function (query) { return _this.query(query["query"]); }))];
                    case 4:
                        _a.sent();
                        dropTablesQuery = "SELECT 'DROP TABLE \"' || TABLE_NAME || '\" CASCADE CONSTRAINTS' AS \"query\" FROM \"USER_TABLES\"";
                        return [4 /*yield*/, this.query(dropTablesQuery)];
                    case 5:
                        dropTableQueries = _a.sent();
                        return [4 /*yield*/, Promise.all(dropTableQueries.map(function (query) { return _this.query(query["query"]); }))];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, this.commitTransaction()];
                    case 7:
                        _a.sent();
                        return [3 /*break*/, 13];
                    case 8:
                        error_1 = _a.sent();
                        _a.label = 9;
                    case 9:
                        _a.trys.push([9, 11, , 12]);
                        return [4 /*yield*/, this.rollbackTransaction()];
                    case 10:
                        _a.sent();
                        return [3 /*break*/, 12];
                    case 11:
                        rollbackError_1 = _a.sent();
                        return [3 /*break*/, 12];
                    case 12: throw error_1;
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    OracleQueryRunner.prototype.loadViews = function (viewNames) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var hasTable, viewNamesString, query, dbViews;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.hasTable(this.getTypeormMetadataTableName())];
                    case 1:
                        hasTable = _a.sent();
                        if (!hasTable)
                            return [2 /*return*/, Promise.resolve([])];
                        viewNamesString = viewNames.map(function (name) { return "'" + name + "'"; }).join(", ");
                        query = "SELECT \"T\".* FROM \"" + this.getTypeormMetadataTableName() + "\" \"T\" INNER JOIN \"USER_VIEWS\" \"V\" ON \"V\".\"VIEW_NAME\" = \"T\".\"name\" WHERE \"T\".\"type\" = 'VIEW'";
                        if (viewNamesString.length > 0)
                            query += " AND \"T\".\"name\" IN (" + viewNamesString + ")";
                        return [4 /*yield*/, this.query(query)];
                    case 2:
                        dbViews = _a.sent();
                        return [2 /*return*/, dbViews.map(function (dbView) {
                                var view = new View_1.View();
                                view.name = dbView["name"];
                                view.expression = dbView["value"];
                                return view;
                            })];
                }
            });
        });
    };
    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     */
    OracleQueryRunner.prototype.loadTables = function (tableNames) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var tableNamesString, tablesSql, columnsSql, indicesSql, foreignKeysSql, constraintsSql, _a, dbTables, dbColumns, dbIndices, dbForeignKeys, dbConstraints;
            var _this = this;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // if no tables given then no need to proceed
                        if (!tableNames || !tableNames.length)
                            return [2 /*return*/, []];
                        tableNamesString = tableNames.map(function (name) { return "'" + name + "'"; }).join(", ");
                        tablesSql = "SELECT * FROM \"USER_TABLES\" WHERE \"TABLE_NAME\" IN (" + tableNamesString + ")";
                        columnsSql = "SELECT * FROM \"USER_TAB_COLS\" WHERE \"TABLE_NAME\" IN (" + tableNamesString + ")";
                        indicesSql = "SELECT \"IND\".\"INDEX_NAME\", \"IND\".\"TABLE_NAME\", \"IND\".\"UNIQUENESS\", " +
                            "LISTAGG (\"COL\".\"COLUMN_NAME\", ',') WITHIN GROUP (ORDER BY \"COL\".\"COLUMN_NAME\") AS \"COLUMN_NAMES\" " +
                            "FROM \"USER_INDEXES\" \"IND\" " +
                            "INNER JOIN \"USER_IND_COLUMNS\" \"COL\" ON \"COL\".\"INDEX_NAME\" = \"IND\".\"INDEX_NAME\" " +
                            "LEFT JOIN \"USER_CONSTRAINTS\" \"CON\" ON \"CON\".\"CONSTRAINT_NAME\" = \"IND\".\"INDEX_NAME\" " +
                            ("WHERE \"IND\".\"TABLE_NAME\" IN (" + tableNamesString + ") AND \"CON\".\"CONSTRAINT_NAME\" IS NULL ") +
                            "GROUP BY \"IND\".\"INDEX_NAME\", \"IND\".\"TABLE_NAME\", \"IND\".\"UNIQUENESS\"";
                        foreignKeysSql = "SELECT \"C\".\"CONSTRAINT_NAME\", \"C\".\"TABLE_NAME\", \"COL\".\"COLUMN_NAME\", \"REF_COL\".\"TABLE_NAME\" AS \"REFERENCED_TABLE_NAME\", " +
                            "\"REF_COL\".\"COLUMN_NAME\" AS \"REFERENCED_COLUMN_NAME\", \"C\".\"DELETE_RULE\" AS \"ON_DELETE\" " +
                            "FROM \"USER_CONSTRAINTS\" \"C\" " +
                            "INNER JOIN \"USER_CONS_COLUMNS\" \"COL\" ON \"COL\".\"OWNER\" = \"C\".\"OWNER\" AND \"COL\".\"CONSTRAINT_NAME\" = \"C\".\"CONSTRAINT_NAME\" " +
                            "INNER JOIN \"USER_CONS_COLUMNS\" \"REF_COL\" ON \"REF_COL\".\"OWNER\" = \"C\".\"R_OWNER\" AND \"REF_COL\".\"CONSTRAINT_NAME\" = \"C\".\"R_CONSTRAINT_NAME\" AND \"REF_COL\".\"POSITION\" = \"COL\".\"POSITION\" " +
                            ("WHERE \"C\".\"TABLE_NAME\" IN (" + tableNamesString + ") AND \"C\".\"CONSTRAINT_TYPE\" = 'R'");
                        constraintsSql = "SELECT \"C\".\"CONSTRAINT_NAME\", \"C\".\"CONSTRAINT_TYPE\", \"C\".\"TABLE_NAME\", \"COL\".\"COLUMN_NAME\", \"C\".\"SEARCH_CONDITION\" " +
                            "FROM \"USER_CONSTRAINTS\" \"C\" " +
                            "INNER JOIN \"USER_CONS_COLUMNS\" \"COL\" ON \"COL\".\"OWNER\" = \"C\".\"OWNER\" AND \"COL\".\"CONSTRAINT_NAME\" = \"C\".\"CONSTRAINT_NAME\" " +
                            ("WHERE \"C\".\"TABLE_NAME\" IN (" + tableNamesString + ") AND \"C\".\"CONSTRAINT_TYPE\" IN ('C', 'U', 'P') AND \"C\".\"GENERATED\" = 'USER NAME'");
                        return [4 /*yield*/, Promise.all([
                                this.query(tablesSql),
                                this.query(columnsSql),
                                this.query(indicesSql),
                                this.query(foreignKeysSql),
                                this.query(constraintsSql),
                            ])];
                    case 1:
                        _a = tslib_1.__read.apply(void 0, [_b.sent(), 5]), dbTables = _a[0], dbColumns = _a[1], dbIndices = _a[2], dbForeignKeys = _a[3], dbConstraints = _a[4];
                        // if tables were not found in the db, no need to proceed
                        if (!dbTables.length)
                            return [2 /*return*/, []];
                        // create tables for loaded tables
                        return [2 /*return*/, dbTables.map(function (dbTable) {
                                var table = new Table_1.Table();
                                table.name = dbTable["TABLE_NAME"];
                                // create columns from the loaded columns
                                table.columns = dbColumns
                                    .filter(function (dbColumn) { return dbColumn["TABLE_NAME"] === table.name; })
                                    .map(function (dbColumn) {
                                    var columnConstraints = dbConstraints.filter(function (dbConstraint) { return dbConstraint["TABLE_NAME"] === table.name && dbConstraint["COLUMN_NAME"] === dbColumn["COLUMN_NAME"]; });
                                    var uniqueConstraint = columnConstraints.find(function (constraint) { return constraint["CONSTRAINT_TYPE"] === "U"; });
                                    var isConstraintComposite = uniqueConstraint
                                        ? !!dbConstraints.find(function (dbConstraint) { return dbConstraint["CONSTRAINT_TYPE"] === "U"
                                            && dbConstraint["CONSTRAINT_NAME"] === uniqueConstraint["CONSTRAINT_NAME"]
                                            && dbConstraint["COLUMN_NAME"] !== dbColumn["COLUMN_NAME"]; })
                                        : false;
                                    var isUnique = !!uniqueConstraint && !isConstraintComposite;
                                    var isPrimary = !!columnConstraints.find(function (constraint) { return constraint["CONSTRAINT_TYPE"] === "P"; });
                                    var tableColumn = new TableColumn_1.TableColumn();
                                    tableColumn.name = dbColumn["COLUMN_NAME"];
                                    tableColumn.type = dbColumn["DATA_TYPE"].toLowerCase();
                                    if (tableColumn.type.indexOf("(") !== -1)
                                        tableColumn.type = tableColumn.type.replace(/\([0-9]*\)/, "");
                                    // check only columns that have length property
                                    if (_this.driver.withLengthColumnTypes.indexOf(tableColumn.type) !== -1) {
                                        var length = tableColumn.type === "raw" ? dbColumn["DATA_LENGTH"] : dbColumn["CHAR_COL_DECL_LENGTH"];
                                        tableColumn.length = length && !_this.isDefaultColumnLength(table, tableColumn, length) ? length.toString() : "";
                                    }
                                    if (tableColumn.type === "number" || tableColumn.type === "float") {
                                        if (dbColumn["DATA_PRECISION"] !== null && !_this.isDefaultColumnPrecision(table, tableColumn, dbColumn["DATA_PRECISION"]))
                                            tableColumn.precision = dbColumn["DATA_PRECISION"];
                                        if (dbColumn["DATA_SCALE"] !== null && !_this.isDefaultColumnScale(table, tableColumn, dbColumn["DATA_SCALE"]))
                                            tableColumn.scale = dbColumn["DATA_SCALE"];
                                    }
                                    else if ((tableColumn.type === "timestamp"
                                        || tableColumn.type === "timestamp with time zone"
                                        || tableColumn.type === "timestamp with local time zone") && dbColumn["DATA_SCALE"] !== null) {
                                        tableColumn.precision = !_this.isDefaultColumnPrecision(table, tableColumn, dbColumn["DATA_SCALE"]) ? dbColumn["DATA_SCALE"] : undefined;
                                    }
                                    tableColumn.default = dbColumn["DATA_DEFAULT"] !== null
                                        && dbColumn["DATA_DEFAULT"] !== undefined
                                        && dbColumn["DATA_DEFAULT"].trim() !== "NULL" ? tableColumn.default = dbColumn["DATA_DEFAULT"].trim() : undefined;
                                    tableColumn.isNullable = dbColumn["NULLABLE"] === "Y";
                                    tableColumn.isUnique = isUnique;
                                    tableColumn.isPrimary = isPrimary;
                                    tableColumn.isGenerated = dbColumn["IDENTITY_COLUMN"] === "YES";
                                    if (tableColumn.isGenerated) {
                                        tableColumn.generationStrategy = "increment";
                                        tableColumn.default = undefined;
                                    }
                                    tableColumn.comment = ""; // todo
                                    return tableColumn;
                                });
                                // find unique constraints of table, group them by constraint name and build TableUnique.
                                var tableUniqueConstraints = OrmUtils_1.OrmUtils.uniq(dbConstraints.filter(function (dbConstraint) {
                                    return dbConstraint["TABLE_NAME"] === table.name && dbConstraint["CONSTRAINT_TYPE"] === "U";
                                }), function (dbConstraint) { return dbConstraint["CONSTRAINT_NAME"]; });
                                table.uniques = tableUniqueConstraints.map(function (constraint) {
                                    var uniques = dbConstraints.filter(function (dbC) { return dbC["CONSTRAINT_NAME"] === constraint["CONSTRAINT_NAME"]; });
                                    return new TableUnique_1.TableUnique({
                                        name: constraint["CONSTRAINT_NAME"],
                                        columnNames: uniques.map(function (u) { return u["COLUMN_NAME"]; })
                                    });
                                });
                                // find check constraints of table, group them by constraint name and build TableCheck.
                                var tableCheckConstraints = OrmUtils_1.OrmUtils.uniq(dbConstraints.filter(function (dbConstraint) {
                                    return dbConstraint["TABLE_NAME"] === table.name && dbConstraint["CONSTRAINT_TYPE"] === "C";
                                }), function (dbConstraint) { return dbConstraint["CONSTRAINT_NAME"]; });
                                table.checks = tableCheckConstraints.map(function (constraint) {
                                    var checks = dbConstraints.filter(function (dbC) { return dbC["CONSTRAINT_NAME"] === constraint["CONSTRAINT_NAME"]; });
                                    return new TableCheck_1.TableCheck({
                                        name: constraint["CONSTRAINT_NAME"],
                                        columnNames: checks.map(function (c) { return c["COLUMN_NAME"]; }),
                                        expression: constraint["SEARCH_CONDITION"]
                                    });
                                });
                                // find foreign key constraints of table, group them by constraint name and build TableForeignKey.
                                var tableForeignKeyConstraints = OrmUtils_1.OrmUtils.uniq(dbForeignKeys.filter(function (dbForeignKey) {
                                    return dbForeignKey["TABLE_NAME"] === table.name;
                                }), function (dbForeignKey) { return dbForeignKey["CONSTRAINT_NAME"]; });
                                table.foreignKeys = tableForeignKeyConstraints.map(function (dbForeignKey) {
                                    var foreignKeys = dbForeignKeys.filter(function (dbFk) { return dbFk["CONSTRAINT_NAME"] === dbForeignKey["CONSTRAINT_NAME"]; });
                                    return new TableForeignKey_1.TableForeignKey({
                                        name: dbForeignKey["CONSTRAINT_NAME"],
                                        columnNames: foreignKeys.map(function (dbFk) { return dbFk["COLUMN_NAME"]; }),
                                        referencedTableName: dbForeignKey["REFERENCED_TABLE_NAME"],
                                        referencedColumnNames: foreignKeys.map(function (dbFk) { return dbFk["REFERENCED_COLUMN_NAME"]; }),
                                        onDelete: dbForeignKey["ON_DELETE"],
                                        onUpdate: "NO ACTION", // Oracle does not have onUpdate option in FK's, but we need it for proper synchronization
                                    });
                                });
                                // create TableIndex objects from the loaded indices
                                table.indices = dbIndices
                                    .filter(function (dbIndex) { return dbIndex["TABLE_NAME"] === table.name; })
                                    .map(function (dbIndex) {
                                    return new TableIndex_1.TableIndex({
                                        name: dbIndex["INDEX_NAME"],
                                        columnNames: dbIndex["COLUMN_NAMES"].split(","),
                                        isUnique: dbIndex["UNIQUENESS"] === "UNIQUE"
                                    });
                                });
                                return table;
                            })];
                }
            });
        });
    };
    /**
     * Builds and returns SQL for create table.
     */
    OracleQueryRunner.prototype.createTableSql = function (table, createForeignKeys) {
        var _this = this;
        var columnDefinitions = table.columns.map(function (column) { return _this.buildCreateColumnSql(column); }).join(", ");
        var sql = "CREATE TABLE \"" + table.name + "\" (" + columnDefinitions;
        table.columns
            .filter(function (column) { return column.isUnique; })
            .forEach(function (column) {
            var isUniqueExist = table.uniques.some(function (unique) { return unique.columnNames.length === 1 && unique.columnNames[0] === column.name; });
            if (!isUniqueExist)
                table.uniques.push(new TableUnique_1.TableUnique({
                    name: _this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]),
                    columnNames: [column.name]
                }));
        });
        if (table.uniques.length > 0) {
            var uniquesSql = table.uniques.map(function (unique) {
                var uniqueName = unique.name ? unique.name : _this.connection.namingStrategy.uniqueConstraintName(table.name, unique.columnNames);
                var columnNames = unique.columnNames.map(function (columnName) { return "\"" + columnName + "\""; }).join(", ");
                return "CONSTRAINT \"" + uniqueName + "\" UNIQUE (" + columnNames + ")";
            }).join(", ");
            sql += ", " + uniquesSql;
        }
        if (table.checks.length > 0) {
            var checksSql = table.checks.map(function (check) {
                var checkName = check.name ? check.name : _this.connection.namingStrategy.checkConstraintName(table.name, check.expression);
                return "CONSTRAINT \"" + checkName + "\" CHECK (" + check.expression + ")";
            }).join(", ");
            sql += ", " + checksSql;
        }
        if (table.foreignKeys.length > 0 && createForeignKeys) {
            var foreignKeysSql = table.foreignKeys.map(function (fk) {
                var columnNames = fk.columnNames.map(function (columnName) { return "\"" + columnName + "\""; }).join(", ");
                if (!fk.name)
                    fk.name = _this.connection.namingStrategy.foreignKeyName(table.name, fk.columnNames, fk.referencedTableName, fk.referencedColumnNames);
                var referencedColumnNames = fk.referencedColumnNames.map(function (columnName) { return "\"" + columnName + "\""; }).join(", ");
                var constraint = "CONSTRAINT \"" + fk.name + "\" FOREIGN KEY (" + columnNames + ") REFERENCES \"" + fk.referencedTableName + "\" (" + referencedColumnNames + ")";
                if (fk.onDelete && fk.onDelete !== "NO ACTION") // Oracle does not support NO ACTION, but we set NO ACTION by default in EntityMetadata
                    constraint += " ON DELETE " + fk.onDelete;
                return constraint;
            }).join(", ");
            sql += ", " + foreignKeysSql;
        }
        var primaryColumns = table.columns.filter(function (column) { return column.isPrimary; });
        if (primaryColumns.length > 0) {
            var primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, primaryColumns.map(function (column) { return column.name; }));
            var columnNames = primaryColumns.map(function (column) { return "\"" + column.name + "\""; }).join(", ");
            sql += ", CONSTRAINT \"" + primaryKeyName + "\" PRIMARY KEY (" + columnNames + ")";
        }
        sql += ")";
        return new Query_1.Query(sql);
    };
    /**
     * Builds drop table sql.
     */
    OracleQueryRunner.prototype.dropTableSql = function (tableOrName, ifExist) {
        var tableName = tableOrName instanceof Table_1.Table ? tableOrName.name : tableOrName;
        var query = ifExist ? "DROP TABLE IF EXISTS \"" + tableName + "\"" : "DROP TABLE \"" + tableName + "\"";
        return new Query_1.Query(query);
    };
    OracleQueryRunner.prototype.createViewSql = function (view) {
        var materializedClause = view.materialized ? "MATERIALIZED " : "";
        if (typeof view.expression === "string") {
            return new Query_1.Query("CREATE " + materializedClause + "VIEW \"" + view.name + "\" AS " + view.expression);
        }
        else {
            return new Query_1.Query("CREATE " + materializedClause + "VIEW \"" + view.name + "\" AS " + view.expression(this.connection).getQuery());
        }
    };
    OracleQueryRunner.prototype.insertViewDefinitionSql = function (view) {
        var expression = typeof view.expression === "string" ? view.expression.trim() : view.expression(this.connection).getQuery();
        var _a = tslib_1.__read(this.connection.createQueryBuilder()
            .insert()
            .into(this.getTypeormMetadataTableName())
            .values({ type: "VIEW", name: view.name, value: expression })
            .getQueryAndParameters(), 2), query = _a[0], parameters = _a[1];
        return new Query_1.Query(query, parameters);
    };
    /**
     * Builds drop view sql.
     */
    OracleQueryRunner.prototype.dropViewSql = function (viewOrPath) {
        var viewName = viewOrPath instanceof View_1.View ? viewOrPath.name : viewOrPath;
        return new Query_1.Query("DROP VIEW \"" + viewName + "\"");
    };
    /**
     * Builds remove view sql.
     */
    OracleQueryRunner.prototype.deleteViewDefinitionSql = function (viewOrPath) {
        var viewName = viewOrPath instanceof View_1.View ? viewOrPath.name : viewOrPath;
        var qb = this.connection.createQueryBuilder();
        var _a = tslib_1.__read(qb.delete()
            .from(this.getTypeormMetadataTableName())
            .where(qb.escape("type") + " = 'VIEW'")
            .andWhere(qb.escape("name") + " = :name", { name: viewName })
            .getQueryAndParameters(), 2), query = _a[0], parameters = _a[1];
        return new Query_1.Query(query, parameters);
    };
    /**
     * Builds create index sql.
     */
    OracleQueryRunner.prototype.createIndexSql = function (table, index) {
        var columns = index.columnNames.map(function (columnName) { return "\"" + columnName + "\""; }).join(", ");
        return new Query_1.Query("CREATE " + (index.isUnique ? "UNIQUE " : "") + "INDEX \"" + index.name + "\" ON \"" + table.name + "\" (" + columns + ")");
    };
    /**
     * Builds drop index sql.
     */
    OracleQueryRunner.prototype.dropIndexSql = function (indexOrName) {
        var indexName = indexOrName instanceof TableIndex_1.TableIndex ? indexOrName.name : indexOrName;
        return new Query_1.Query("DROP INDEX \"" + indexName + "\"");
    };
    /**
     * Builds create primary key sql.
     */
    OracleQueryRunner.prototype.createPrimaryKeySql = function (table, columnNames) {
        var primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, columnNames);
        var columnNamesString = columnNames.map(function (columnName) { return "\"" + columnName + "\""; }).join(", ");
        return new Query_1.Query("ALTER TABLE \"" + table.name + "\" ADD CONSTRAINT \"" + primaryKeyName + "\" PRIMARY KEY (" + columnNamesString + ")");
    };
    /**
     * Builds drop primary key sql.
     */
    OracleQueryRunner.prototype.dropPrimaryKeySql = function (table) {
        var columnNames = table.primaryColumns.map(function (column) { return column.name; });
        var primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, columnNames);
        return new Query_1.Query("ALTER TABLE \"" + table.name + "\" DROP CONSTRAINT \"" + primaryKeyName + "\"");
    };
    /**
     * Builds create unique constraint sql.
     */
    OracleQueryRunner.prototype.createUniqueConstraintSql = function (table, uniqueConstraint) {
        var columnNames = uniqueConstraint.columnNames.map(function (column) { return "\"" + column + "\""; }).join(", ");
        return new Query_1.Query("ALTER TABLE \"" + table.name + "\" ADD CONSTRAINT \"" + uniqueConstraint.name + "\" UNIQUE (" + columnNames + ")");
    };
    /**
     * Builds drop unique constraint sql.
     */
    OracleQueryRunner.prototype.dropUniqueConstraintSql = function (table, uniqueOrName) {
        var uniqueName = uniqueOrName instanceof TableUnique_1.TableUnique ? uniqueOrName.name : uniqueOrName;
        return new Query_1.Query("ALTER TABLE \"" + table.name + "\" DROP CONSTRAINT \"" + uniqueName + "\"");
    };
    /**
     * Builds create check constraint sql.
     */
    OracleQueryRunner.prototype.createCheckConstraintSql = function (table, checkConstraint) {
        return new Query_1.Query("ALTER TABLE \"" + table.name + "\" ADD CONSTRAINT \"" + checkConstraint.name + "\" CHECK (" + checkConstraint.expression + ")");
    };
    /**
     * Builds drop check constraint sql.
     */
    OracleQueryRunner.prototype.dropCheckConstraintSql = function (table, checkOrName) {
        var checkName = checkOrName instanceof TableCheck_1.TableCheck ? checkOrName.name : checkOrName;
        return new Query_1.Query("ALTER TABLE \"" + table.name + "\" DROP CONSTRAINT \"" + checkName + "\"");
    };
    /**
     * Builds create foreign key sql.
     */
    OracleQueryRunner.prototype.createForeignKeySql = function (table, foreignKey) {
        var columnNames = foreignKey.columnNames.map(function (column) { return "\"" + column + "\""; }).join(", ");
        var referencedColumnNames = foreignKey.referencedColumnNames.map(function (column) { return "\"" + column + "\""; }).join(",");
        var sql = "ALTER TABLE \"" + table.name + "\" ADD CONSTRAINT \"" + foreignKey.name + "\" FOREIGN KEY (" + columnNames + ") " +
            ("REFERENCES \"" + foreignKey.referencedTableName + "\" (" + referencedColumnNames + ")");
        // Oracle does not support NO ACTION, but we set NO ACTION by default in EntityMetadata
        if (foreignKey.onDelete && foreignKey.onDelete !== "NO ACTION")
            sql += " ON DELETE " + foreignKey.onDelete;
        return new Query_1.Query(sql);
    };
    /**
     * Builds drop foreign key sql.
     */
    OracleQueryRunner.prototype.dropForeignKeySql = function (table, foreignKeyOrName) {
        var foreignKeyName = foreignKeyOrName instanceof TableForeignKey_1.TableForeignKey ? foreignKeyOrName.name : foreignKeyOrName;
        return new Query_1.Query("ALTER TABLE \"" + table.name + "\" DROP CONSTRAINT \"" + foreignKeyName + "\"");
    };
    /**
     * Builds a query for create column.
     */
    OracleQueryRunner.prototype.buildCreateColumnSql = function (column) {
        var c = "\"" + column.name + "\" " + this.connection.driver.createFullType(column);
        if (column.charset)
            c += " CHARACTER SET " + column.charset;
        if (column.collation)
            c += " COLLATE " + column.collation;
        if (column.default !== undefined && column.default !== null) // DEFAULT must be placed before NOT NULL
            c += " DEFAULT " + column.default;
        if (column.isNullable !== true && !column.isGenerated) // NOT NULL is not supported with GENERATED
            c += " NOT NULL";
        if (column.isGenerated === true && column.generationStrategy === "increment")
            c += " GENERATED BY DEFAULT AS IDENTITY";
        return c;
    };
    return OracleQueryRunner;
}(BaseQueryRunner_1.BaseQueryRunner));
exports.OracleQueryRunner = OracleQueryRunner;

//# sourceMappingURL=OracleQueryRunner.js.map
