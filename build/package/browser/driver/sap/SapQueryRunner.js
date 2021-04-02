import { __awaiter, __extends, __generator, __read, __spreadArray, __values } from "tslib";
import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError";
import { TransactionAlreadyStartedError } from "../../error/TransactionAlreadyStartedError";
import { TransactionNotStartedError } from "../../error/TransactionNotStartedError";
import { QueryFailedError } from "../../index";
import { BaseQueryRunner } from "../../query-runner/BaseQueryRunner";
import { Table } from "../../schema-builder/table/Table";
import { TableCheck } from "../../schema-builder/table/TableCheck";
import { TableColumn } from "../../schema-builder/table/TableColumn";
import { TableForeignKey } from "../../schema-builder/table/TableForeignKey";
import { TableIndex } from "../../schema-builder/table/TableIndex";
import { TableUnique } from "../../schema-builder/table/TableUnique";
import { View } from "../../schema-builder/view/View";
import { Broadcaster } from "../../subscriber/Broadcaster";
import { OrmUtils } from "../../util/OrmUtils";
import { Query } from "../Query";
import { BroadcasterResult } from "../../subscriber/BroadcasterResult";
/**
 * Runs queries on a single SQL Server database connection.
 */
var SapQueryRunner = /** @class */ (function (_super) {
    __extends(SapQueryRunner, _super);
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function SapQueryRunner(driver, mode) {
        var _this = _super.call(this) || this;
        // -------------------------------------------------------------------------
        // Protected Properties
        // -------------------------------------------------------------------------
        /**
         * Last executed query in a transaction.
         * This is needed because we cannot rely on parallel queries because we use second query
         * to select CURRENT_IDENTITY_VALUE()
         */
        _this.queryResponsibilityChain = [];
        _this.driver = driver;
        _this.connection = driver.connection;
        _this.broadcaster = new Broadcaster(_this);
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
    SapQueryRunner.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.databaseConnection)
                            return [2 /*return*/, this.databaseConnection];
                        _a = this;
                        return [4 /*yield*/, this.driver.obtainMasterConnection()];
                    case 1:
                        _a.databaseConnection = _b.sent();
                        return [2 /*return*/, this.databaseConnection];
                }
            });
        });
    };
    /**
     * Releases used database connection.
     * You cannot use query runner methods once its released.
     */
    SapQueryRunner.prototype.release = function () {
        this.isReleased = true;
        if (this.databaseConnection) {
            return this.driver.master.release(this.databaseConnection);
        }
        return Promise.resolve();
    };
    /**
     * Starts transaction.
     */
    SapQueryRunner.prototype.startTransaction = function (isolationLevel) {
        return __awaiter(this, void 0, void 0, function () {
            var beforeBroadcastResult, afterBroadcastResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isReleased)
                            throw new QueryRunnerAlreadyReleasedError();
                        if (this.isTransactionActive)
                            throw new TransactionAlreadyStartedError();
                        beforeBroadcastResult = new BroadcasterResult();
                        this.broadcaster.broadcastBeforeTransactionStartEvent(beforeBroadcastResult);
                        if (!(beforeBroadcastResult.promises.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.all(beforeBroadcastResult.promises)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        this.isTransactionActive = true;
                        if (!isolationLevel) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.query("SET TRANSACTION ISOLATION LEVEL " + (isolationLevel || ""))];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        afterBroadcastResult = new BroadcasterResult();
                        this.broadcaster.broadcastAfterTransactionStartEvent(afterBroadcastResult);
                        if (!(afterBroadcastResult.promises.length > 0)) return [3 /*break*/, 6];
                        return [4 /*yield*/, Promise.all(afterBroadcastResult.promises)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    SapQueryRunner.prototype.commitTransaction = function () {
        return __awaiter(this, void 0, void 0, function () {
            var beforeBroadcastResult, afterBroadcastResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isReleased)
                            throw new QueryRunnerAlreadyReleasedError();
                        if (!this.isTransactionActive)
                            throw new TransactionNotStartedError();
                        beforeBroadcastResult = new BroadcasterResult();
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
                        afterBroadcastResult = new BroadcasterResult();
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
    SapQueryRunner.prototype.rollbackTransaction = function () {
        return __awaiter(this, void 0, void 0, function () {
            var beforeBroadcastResult, afterBroadcastResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isReleased)
                            throw new QueryRunnerAlreadyReleasedError();
                        if (!this.isTransactionActive)
                            throw new TransactionNotStartedError();
                        beforeBroadcastResult = new BroadcasterResult();
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
                        afterBroadcastResult = new BroadcasterResult();
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
    SapQueryRunner.prototype.query = function (query, parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var waitingOkay, waitingPromise, otherWaitingPromises, promise;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isReleased)
                            throw new QueryRunnerAlreadyReleasedError();
                        waitingPromise = new Promise(function (ok) { return waitingOkay = ok; });
                        if (!this.queryResponsibilityChain.length) return [3 /*break*/, 2];
                        otherWaitingPromises = __spreadArray([], __read(this.queryResponsibilityChain));
                        this.queryResponsibilityChain.push(waitingPromise);
                        return [4 /*yield*/, Promise.all(otherWaitingPromises)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        promise = new Promise(function (ok, fail) { return __awaiter(_this, void 0, void 0, function () {
                            var databaseConnection_1, queryStartTime_1, isInsertQuery_1, statement, err_1;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, this.connect()];
                                    case 1:
                                        databaseConnection_1 = _a.sent();
                                        // we disable autocommit because ROLLBACK does not work in autocommit mode
                                        databaseConnection_1.setAutoCommit(!this.isTransactionActive);
                                        this.driver.connection.logger.logQuery(query, parameters, this);
                                        queryStartTime_1 = +new Date();
                                        isInsertQuery_1 = query.substr(0, 11) === "INSERT INTO";
                                        statement = databaseConnection_1.prepare(query);
                                        statement.exec(parameters, function (err, result) {
                                            // log slow queries if maxQueryExecution time is set
                                            var maxQueryExecutionTime = _this.driver.connection.options.maxQueryExecutionTime;
                                            var queryEndTime = +new Date();
                                            var queryExecutionTime = queryEndTime - queryStartTime_1;
                                            if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                                                _this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, _this);
                                            var resolveChain = function () {
                                                if (promiseIndex !== -1)
                                                    _this.queryResponsibilityChain.splice(promiseIndex, 1);
                                                if (waitingPromiseIndex !== -1)
                                                    _this.queryResponsibilityChain.splice(waitingPromiseIndex, 1);
                                                waitingOkay();
                                            };
                                            var promiseIndex = _this.queryResponsibilityChain.indexOf(promise);
                                            var waitingPromiseIndex = _this.queryResponsibilityChain.indexOf(waitingPromise);
                                            if (err) {
                                                _this.driver.connection.logger.logQueryError(err, query, parameters, _this);
                                                resolveChain();
                                                return fail(new QueryFailedError(query, parameters, err));
                                            }
                                            else {
                                                if (isInsertQuery_1) {
                                                    var lastIdQuery_1 = "SELECT CURRENT_IDENTITY_VALUE() FROM \"SYS\".\"DUMMY\"";
                                                    _this.driver.connection.logger.logQuery(lastIdQuery_1, [], _this);
                                                    databaseConnection_1.exec(lastIdQuery_1, function (err, result) {
                                                        if (err) {
                                                            _this.driver.connection.logger.logQueryError(err, lastIdQuery_1, [], _this);
                                                            resolveChain();
                                                            fail(new QueryFailedError(lastIdQuery_1, [], err));
                                                            return;
                                                        }
                                                        ok(result[0]["CURRENT_IDENTITY_VALUE()"]);
                                                        resolveChain();
                                                    });
                                                }
                                                else {
                                                    ok(result);
                                                    resolveChain();
                                                }
                                            }
                                        });
                                        return [3 /*break*/, 3];
                                    case 2:
                                        err_1 = _a.sent();
                                        fail(err_1);
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); });
                        // with this condition, Promise.all causes unexpected behavior.
                        // if (this.isTransactionActive)
                        this.queryResponsibilityChain.push(promise);
                        return [2 /*return*/, promise];
                }
            });
        });
    };
    /**
     * Returns raw data stream.
     */
    SapQueryRunner.prototype.stream = function (query, parameters, onEnd, onError) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Stream is not supported by SAP driver.");
            });
        });
    };
    /**
     * Returns all available database names including system databases.
     */
    SapQueryRunner.prototype.getDatabases = function () {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.query("SELECT DATABASE_NAME FROM \"SYS\".\"M_DATABASES\"")];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results.map(function (result) { return result["DATABASE_NAME"]; })];
                }
            });
        });
    };
    /**
     * Returns all available schema names including system schemas.
     * If database parameter specified, returns schemas of that database.
     */
    SapQueryRunner.prototype.getSchemas = function (database) {
        return __awaiter(this, void 0, void 0, function () {
            var query, results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = database ? "SELECT * FROM \"" + database + "\".\"SYS\".\"SCHEMAS\"" : "SELECT * FROM \"SYS\".\"SCHEMAS\"";
                        return [4 /*yield*/, this.query(query)];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results.map(function (result) { return result["SCHEMA_NAME"]; })];
                }
            });
        });
    };
    /**
     * Checks if database with the given name exist.
     */
    SapQueryRunner.prototype.hasDatabase = function (database) {
        return __awaiter(this, void 0, void 0, function () {
            var databases;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getDatabases()];
                    case 1:
                        databases = _a.sent();
                        return [2 /*return*/, databases.indexOf(database) !== -1];
                }
            });
        });
    };
    /**
     * Checks if schema with the given name exist.
     */
    SapQueryRunner.prototype.hasSchema = function (schema) {
        return __awaiter(this, void 0, void 0, function () {
            var schemas;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getSchemas()];
                    case 1:
                        schemas = _a.sent();
                        return [2 /*return*/, schemas.indexOf(schema) !== -1];
                }
            });
        });
    };
    /**
     * Checks if table with the given name exist in the database.
     */
    SapQueryRunner.prototype.hasTable = function (tableOrName) {
        return __awaiter(this, void 0, void 0, function () {
            var parsedTableName, sql, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        parsedTableName = this.parseTableName(tableOrName);
                        sql = "SELECT * FROM \"SYS\".\"TABLES\" WHERE \"SCHEMA_NAME\" = " + parsedTableName.schema + " AND \"TABLE_NAME\" = " + parsedTableName.tableName;
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
    SapQueryRunner.prototype.hasColumn = function (tableOrName, columnName) {
        return __awaiter(this, void 0, void 0, function () {
            var parsedTableName, sql, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        parsedTableName = this.parseTableName(tableOrName);
                        sql = "SELECT * FROM \"SYS\".\"TABLE_COLUMNS\" WHERE \"SCHEMA_NAME\" = " + parsedTableName.schema + " AND \"TABLE_NAME\" = " + parsedTableName.tableName + " AND \"COLUMN_NAME\" = '" + columnName + "'";
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
    SapQueryRunner.prototype.createDatabase = function (database, ifNotExist) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.resolve()];
            });
        });
    };
    /**
     * Drops database.
     */
    SapQueryRunner.prototype.dropDatabase = function (database, ifExist) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.resolve()];
            });
        });
    };
    /**
     * Creates a new table schema.
     */
    SapQueryRunner.prototype.createSchema = function (schema, ifNotExist) {
        return __awaiter(this, void 0, void 0, function () {
            var exist, result, up, down;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        exist = false;
                        if (!ifNotExist) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.query("SELECT * FROM \"SYS\".\"SCHEMAS\" WHERE \"SCHEMA_NAME\" = '" + schema + "'")];
                    case 1:
                        result = _a.sent();
                        exist = !!result.length;
                        _a.label = 2;
                    case 2:
                        if (!(!ifNotExist || (ifNotExist && !exist))) return [3 /*break*/, 4];
                        up = "CREATE SCHEMA \"" + schema + "\"";
                        down = "DROP SCHEMA \"" + schema + "\" CASCADE";
                        return [4 /*yield*/, this.executeQueries(new Query(up), new Query(down))];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops table schema
     */
    SapQueryRunner.prototype.dropSchema = function (schemaPath, ifExist, isCascade) {
        return __awaiter(this, void 0, void 0, function () {
            var schema, exist, result, up, down;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        schema = schemaPath.indexOf(".") === -1 ? schemaPath : schemaPath.split(".")[0];
                        exist = false;
                        if (!ifExist) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.query("SELECT * FROM \"SYS\".\"SCHEMAS\" WHERE \"SCHEMA_NAME\" = '" + schema + "'")];
                    case 1:
                        result = _a.sent();
                        exist = !!result.length;
                        _a.label = 2;
                    case 2:
                        if (!(!ifExist || (ifExist && exist))) return [3 /*break*/, 4];
                        up = "DROP SCHEMA \"" + schema + "\" " + (isCascade ? "CASCADE" : "");
                        down = "CREATE SCHEMA \"" + schema + "\"";
                        return [4 /*yield*/, this.executeQueries(new Query(up), new Query(down))];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new table.
     */
    SapQueryRunner.prototype.createTable = function (table, ifNotExist, createForeignKeys, createIndices) {
        if (ifNotExist === void 0) { ifNotExist = false; }
        if (createForeignKeys === void 0) { createForeignKeys = true; }
        if (createIndices === void 0) { createIndices = true; }
        return __awaiter(this, void 0, void 0, function () {
            var isTableExist, upQueries, downQueries;
            var _this = this;
            return __generator(this, function (_a) {
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
                                downQueries.push(_this.dropIndexSql(table, index));
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
    SapQueryRunner.prototype.dropTable = function (tableOrName, ifExist, dropForeignKeys, dropIndices) {
        if (dropForeignKeys === void 0) { dropForeignKeys = true; }
        if (dropIndices === void 0) { dropIndices = true; }
        return __awaiter(this, void 0, void 0, function () {
            var isTableExist, createForeignKeys, table, _a, upQueries, downQueries;
            var _this = this;
            return __generator(this, function (_b) {
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
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 3];
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
                        // It needs because if table does not exist and dropForeignKeys or dropIndices is true, we don't need
                        // to perform drop queries for foreign keys and indices.
                        if (dropIndices) {
                            table.indices.forEach(function (index) {
                                upQueries.push(_this.dropIndexSql(table, index));
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
    SapQueryRunner.prototype.createView = function (view) {
        return __awaiter(this, void 0, void 0, function () {
            var upQueries, downQueries, _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        upQueries = [];
                        downQueries = [];
                        upQueries.push(this.createViewSql(view));
                        _b = (_a = upQueries).push;
                        return [4 /*yield*/, this.insertViewDefinitionSql(view)];
                    case 1:
                        _b.apply(_a, [_e.sent()]);
                        downQueries.push(this.dropViewSql(view));
                        _d = (_c = downQueries).push;
                        return [4 /*yield*/, this.deleteViewDefinitionSql(view)];
                    case 2:
                        _d.apply(_c, [_e.sent()]);
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 3:
                        _e.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops the view.
     */
    SapQueryRunner.prototype.dropView = function (target) {
        return __awaiter(this, void 0, void 0, function () {
            var viewName, view, upQueries, downQueries, _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        viewName = target instanceof View ? target.name : target;
                        return [4 /*yield*/, this.getCachedView(viewName)];
                    case 1:
                        view = _e.sent();
                        upQueries = [];
                        downQueries = [];
                        _b = (_a = upQueries).push;
                        return [4 /*yield*/, this.deleteViewDefinitionSql(view)];
                    case 2:
                        _b.apply(_a, [_e.sent()]);
                        upQueries.push(this.dropViewSql(view));
                        _d = (_c = downQueries).push;
                        return [4 /*yield*/, this.insertViewDefinitionSql(view)];
                    case 3:
                        _d.apply(_c, [_e.sent()]);
                        downQueries.push(this.createViewSql(view));
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 4:
                        _e.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Renames a table.
     */
    SapQueryRunner.prototype.renameTable = function (oldTableOrName, newTableName) {
        return __awaiter(this, void 0, void 0, function () {
            var upQueries, downQueries, oldTable, _a, newTable, oldTableName, schemaName, referencedForeignKeySql, dbForeignKeys, referencedForeignKeys, referencedForeignKeyTableMapping, columnNames, columnNamesString, oldPkName, newPkName;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        upQueries = [];
                        downQueries = [];
                        if (!(oldTableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = oldTableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(oldTableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        oldTable = _a;
                        newTable = oldTable.clone();
                        oldTableName = oldTable.name.indexOf(".") === -1 ? oldTable.name : oldTable.name.split(".")[1];
                        schemaName = oldTable.name.indexOf(".") === -1 ? undefined : oldTable.name.split(".")[0];
                        newTable.name = schemaName ? schemaName + "." + newTableName : newTableName;
                        // rename table
                        upQueries.push(new Query("RENAME TABLE " + this.escapePath(oldTable.name) + " TO " + this.escapePath(newTableName)));
                        downQueries.push(new Query("RENAME TABLE " + this.escapePath(newTable.name) + " TO " + this.escapePath(oldTableName)));
                        // drop old FK's. Foreign keys must be dropped before the primary keys are dropped
                        newTable.foreignKeys.forEach(function (foreignKey) {
                            upQueries.push(_this.dropForeignKeySql(newTable, foreignKey));
                            downQueries.push(_this.createForeignKeySql(newTable, foreignKey));
                        });
                        referencedForeignKeySql = "SELECT * FROM \"SYS\".\"REFERENTIAL_CONSTRAINTS\" WHERE \"REFERENCED_SCHEMA_NAME\" = '" + schemaName + "' AND \"REFERENCED_TABLE_NAME\" = '" + oldTableName + "'";
                        return [4 /*yield*/, this.query(referencedForeignKeySql)];
                    case 4:
                        dbForeignKeys = _b.sent();
                        referencedForeignKeys = [];
                        referencedForeignKeyTableMapping = [];
                        if (dbForeignKeys.length > 0) {
                            referencedForeignKeys = dbForeignKeys.map(function (dbForeignKey) {
                                var foreignKeys = dbForeignKeys.filter(function (dbFk) { return dbFk["CONSTRAINT_NAME"] === dbForeignKey["CONSTRAINT_NAME"]; });
                                referencedForeignKeyTableMapping.push({ tableName: dbForeignKey["SCHEMA_NAME"] + "." + dbForeignKey["TABLE_NAME"], fkName: dbForeignKey["CONSTRAINT_NAME"] });
                                return new TableForeignKey({
                                    name: dbForeignKey["CONSTRAINT_NAME"],
                                    columnNames: foreignKeys.map(function (dbFk) { return dbFk["COLUMN_NAME"]; }),
                                    referencedTableName: newTable.name,
                                    referencedColumnNames: foreignKeys.map(function (dbFk) { return dbFk["REFERENCED_COLUMN_NAME"]; }),
                                    onDelete: dbForeignKey["DELETE_RULE"] === "RESTRICT" ? "NO ACTION" : dbForeignKey["DELETE_RULE"],
                                    onUpdate: dbForeignKey["UPDATE_RULE"] === "RESTRICT" ? "NO ACTION" : dbForeignKey["UPDATE_RULE"],
                                });
                            });
                            // drop referenced foreign keys
                            referencedForeignKeys.forEach(function (foreignKey) {
                                var mapping = referencedForeignKeyTableMapping.find(function (it) { return it.fkName === foreignKey.name; });
                                upQueries.push(_this.dropForeignKeySql(mapping.tableName, foreignKey));
                                downQueries.push(_this.createForeignKeySql(mapping.tableName, foreignKey));
                            });
                        }
                        // rename primary key constraint
                        if (newTable.primaryColumns.length > 0) {
                            columnNames = newTable.primaryColumns.map(function (column) { return column.name; });
                            columnNamesString = columnNames.map(function (columnName) { return "\"" + columnName + "\""; }).join(", ");
                            oldPkName = this.connection.namingStrategy.primaryKeyName(oldTable, columnNames);
                            newPkName = this.connection.namingStrategy.primaryKeyName(newTable, columnNames);
                            // drop old PK
                            upQueries.push(new Query("ALTER TABLE " + this.escapePath(newTable) + " DROP CONSTRAINT \"" + oldPkName + "\""));
                            downQueries.push(new Query("ALTER TABLE " + this.escapePath(newTable) + " ADD CONSTRAINT \"" + oldPkName + "\" PRIMARY KEY (" + columnNamesString + ")"));
                            // create new PK
                            upQueries.push(new Query("ALTER TABLE " + this.escapePath(newTable) + " ADD CONSTRAINT \"" + newPkName + "\" PRIMARY KEY (" + columnNamesString + ")"));
                            downQueries.push(new Query("ALTER TABLE " + this.escapePath(newTable) + " DROP CONSTRAINT \"" + newPkName + "\""));
                        }
                        // recreate foreign keys with new constraint names
                        newTable.foreignKeys.forEach(function (foreignKey) {
                            // replace constraint name
                            foreignKey.name = _this.connection.namingStrategy.foreignKeyName(newTable, foreignKey.columnNames, foreignKey.referencedTableName, foreignKey.referencedColumnNames);
                            // create new FK's
                            upQueries.push(_this.createForeignKeySql(newTable, foreignKey));
                            downQueries.push(_this.dropForeignKeySql(newTable, foreignKey));
                        });
                        // restore referenced foreign keys
                        referencedForeignKeys.forEach(function (foreignKey) {
                            var mapping = referencedForeignKeyTableMapping.find(function (it) { return it.fkName === foreignKey.name; });
                            upQueries.push(_this.createForeignKeySql(mapping.tableName, foreignKey));
                            downQueries.push(_this.dropForeignKeySql(mapping.tableName, foreignKey));
                        });
                        // rename index constraints
                        newTable.indices.forEach(function (index) {
                            // build new constraint name
                            var newIndexName = _this.connection.namingStrategy.indexName(newTable, index.columnNames, index.where);
                            // drop old index
                            upQueries.push(_this.dropIndexSql(newTable, index));
                            downQueries.push(_this.createIndexSql(newTable, index));
                            // replace constraint name
                            index.name = newIndexName;
                            // create new index
                            upQueries.push(_this.createIndexSql(newTable, index));
                            downQueries.push(_this.dropIndexSql(newTable, index));
                        });
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 5:
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
    SapQueryRunner.prototype.addColumn = function (tableOrName, column) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, parsedTableName, clonedTable, upQueries, downQueries, primaryColumns, referencedForeignKeySql, dbForeignKeys_1, referencedForeignKeys, referencedForeignKeyTableMapping_1, pkName_1, columnNames_1, pkName, columnNames, columnIndex, uniqueIndex;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        parsedTableName = this.parseTableName(table);
                        clonedTable = table.clone();
                        upQueries = [];
                        downQueries = [];
                        upQueries.push(new Query(this.addColumnSql(table, column)));
                        downQueries.push(new Query(this.dropColumnSql(table, column)));
                        if (!column.isPrimary) return [3 /*break*/, 6];
                        primaryColumns = clonedTable.primaryColumns;
                        if (!(primaryColumns.length > 0)) return [3 /*break*/, 5];
                        referencedForeignKeySql = "SELECT * FROM \"SYS\".\"REFERENTIAL_CONSTRAINTS\" WHERE \"REFERENCED_SCHEMA_NAME\" = " + parsedTableName.schema + " AND \"REFERENCED_TABLE_NAME\" = " + parsedTableName.tableName;
                        return [4 /*yield*/, this.query(referencedForeignKeySql)];
                    case 4:
                        dbForeignKeys_1 = _b.sent();
                        referencedForeignKeys = [];
                        referencedForeignKeyTableMapping_1 = [];
                        if (dbForeignKeys_1.length > 0) {
                            referencedForeignKeys = dbForeignKeys_1.map(function (dbForeignKey) {
                                var foreignKeys = dbForeignKeys_1.filter(function (dbFk) { return dbFk["CONSTRAINT_NAME"] === dbForeignKey["CONSTRAINT_NAME"]; });
                                referencedForeignKeyTableMapping_1.push({ tableName: dbForeignKey["SCHEMA_NAME"] + "." + dbForeignKey["TABLE_NAME"], fkName: dbForeignKey["CONSTRAINT_NAME"] });
                                return new TableForeignKey({
                                    name: dbForeignKey["CONSTRAINT_NAME"],
                                    columnNames: foreignKeys.map(function (dbFk) { return dbFk["COLUMN_NAME"]; }),
                                    referencedTableName: table.name,
                                    referencedColumnNames: foreignKeys.map(function (dbFk) { return dbFk["REFERENCED_COLUMN_NAME"]; }),
                                    onDelete: dbForeignKey["DELETE_RULE"] === "RESTRICT" ? "NO ACTION" : dbForeignKey["DELETE_RULE"],
                                    onUpdate: dbForeignKey["UPDATE_RULE"] === "RESTRICT" ? "NO ACTION" : dbForeignKey["UPDATE_RULE"],
                                });
                            });
                            // drop referenced foreign keys
                            referencedForeignKeys.forEach(function (foreignKey) {
                                var mapping = referencedForeignKeyTableMapping_1.find(function (it) { return it.fkName === foreignKey.name; });
                                upQueries.push(_this.dropForeignKeySql(mapping.tableName, foreignKey));
                                downQueries.push(_this.createForeignKeySql(mapping.tableName, foreignKey));
                            });
                        }
                        pkName_1 = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(function (column) { return column.name; }));
                        columnNames_1 = primaryColumns.map(function (column) { return "\"" + column.name + "\""; }).join(", ");
                        upQueries.push(new Query("ALTER TABLE " + this.escapePath(table) + " DROP CONSTRAINT \"" + pkName_1 + "\""));
                        downQueries.push(new Query("ALTER TABLE " + this.escapePath(table) + " ADD CONSTRAINT \"" + pkName_1 + "\" PRIMARY KEY (" + columnNames_1 + ")"));
                        // restore referenced foreign keys
                        referencedForeignKeys.forEach(function (foreignKey) {
                            var mapping = referencedForeignKeyTableMapping_1.find(function (it) { return it.fkName === foreignKey.name; });
                            upQueries.push(_this.createForeignKeySql(mapping.tableName, foreignKey));
                            downQueries.push(_this.dropForeignKeySql(mapping.tableName, foreignKey));
                        });
                        _b.label = 5;
                    case 5:
                        primaryColumns.push(column);
                        pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(function (column) { return column.name; }));
                        columnNames = primaryColumns.map(function (column) { return "\"" + column.name + "\""; }).join(", ");
                        upQueries.push(new Query("ALTER TABLE " + this.escapePath(table) + " ADD CONSTRAINT \"" + pkName + "\" PRIMARY KEY (" + columnNames + ")"));
                        downQueries.push(new Query("ALTER TABLE " + this.escapePath(table) + " DROP CONSTRAINT \"" + pkName + "\""));
                        _b.label = 6;
                    case 6:
                        columnIndex = clonedTable.indices.find(function (index) { return index.columnNames.length === 1 && index.columnNames[0] === column.name; });
                        if (columnIndex) {
                            upQueries.push(this.createIndexSql(table, columnIndex));
                            downQueries.push(this.dropIndexSql(table, columnIndex));
                        }
                        else if (column.isUnique) {
                            uniqueIndex = new TableIndex({
                                name: this.connection.namingStrategy.indexName(table.name, [column.name]),
                                columnNames: [column.name],
                                isUnique: true
                            });
                            clonedTable.indices.push(uniqueIndex);
                            clonedTable.uniques.push(new TableUnique({
                                name: uniqueIndex.name,
                                columnNames: uniqueIndex.columnNames
                            }));
                            upQueries.push(this.createIndexSql(table, uniqueIndex));
                            downQueries.push(this.dropIndexSql(table, uniqueIndex));
                        }
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 7:
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
    SapQueryRunner.prototype.addColumns = function (tableOrName, columns) {
        return __awaiter(this, void 0, void 0, function () {
            var columns_1, columns_1_1, column, e_1_1;
            var e_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, 6, 7]);
                        columns_1 = __values(columns), columns_1_1 = columns_1.next();
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
    SapQueryRunner.prototype.renameColumn = function (tableOrName, oldTableColumnOrName, newTableColumnOrName) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, oldColumn, newColumn;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        oldColumn = oldTableColumnOrName instanceof TableColumn ? oldTableColumnOrName : table.columns.find(function (c) { return c.name === oldTableColumnOrName; });
                        if (!oldColumn)
                            throw new Error("Column \"" + oldTableColumnOrName + "\" was not found in the \"" + table.name + "\" table.");
                        newColumn = undefined;
                        if (newTableColumnOrName instanceof TableColumn) {
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
    SapQueryRunner.prototype.changeColumn = function (tableOrName, oldTableColumnOrName, newColumn) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, clonedTable, upQueries, downQueries, oldColumn, primaryColumns, columnNames, oldPkName, columnNamesString, newPkName, oldTableColumn, primaryColumns, pkName, columnNames, column, pkName, columnNames, primaryColumn, column, pkName, columnNames, uniqueIndex, uniqueIndex_1, tableUnique;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
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
                        oldColumn = oldTableColumnOrName instanceof TableColumn
                            ? oldTableColumnOrName
                            : table.columns.find(function (column) { return column.name === oldTableColumnOrName; });
                        if (!oldColumn)
                            throw new Error("Column \"" + oldTableColumnOrName + "\" was not found in the \"" + table.name + "\" table.");
                        if (!((newColumn.isGenerated !== oldColumn.isGenerated && newColumn.generationStrategy !== "uuid") || newColumn.type !== oldColumn.type || newColumn.length !== oldColumn.length)) return [3 /*break*/, 6];
                        // SQL Server does not support changing of IDENTITY column, so we must drop column and recreate it again.
                        // Also, we recreate column if column type changed
                        return [4 /*yield*/, this.dropColumn(table, oldColumn)];
                    case 4:
                        // SQL Server does not support changing of IDENTITY column, so we must drop column and recreate it again.
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
                            upQueries.push(new Query("RENAME COLUMN " + this.escapePath(table) + ".\"" + oldColumn.name + "\" TO \"" + newColumn.name + "\""));
                            downQueries.push(new Query("RENAME COLUMN " + this.escapePath(table) + ".\"" + newColumn.name + "\" TO \"" + oldColumn.name + "\""));
                            if (oldColumn.isPrimary === true) {
                                primaryColumns = clonedTable.primaryColumns;
                                columnNames = primaryColumns.map(function (column) { return column.name; });
                                oldPkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);
                                // replace old column name with new column name
                                columnNames.splice(columnNames.indexOf(oldColumn.name), 1);
                                columnNames.push(newColumn.name);
                                columnNamesString = columnNames.map(function (columnName) { return "\"" + columnName + "\""; }).join(", ");
                                // drop old PK
                                upQueries.push(new Query("ALTER TABLE " + this.escapePath(clonedTable) + " DROP CONSTRAINT \"" + oldPkName + "\""));
                                downQueries.push(new Query("ALTER TABLE " + this.escapePath(clonedTable) + " ADD CONSTRAINT \"" + oldPkName + "\" PRIMARY KEY (" + columnNamesString + ")"));
                                newPkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);
                                // create new PK
                                upQueries.push(new Query("ALTER TABLE " + this.escapePath(clonedTable) + " ADD CONSTRAINT \"" + newPkName + "\" PRIMARY KEY (" + columnNamesString + ")"));
                                downQueries.push(new Query("ALTER TABLE " + this.escapePath(clonedTable) + " DROP CONSTRAINT \"" + newPkName + "\""));
                            }
                            // rename index constraints
                            clonedTable.findColumnIndices(oldColumn).forEach(function (index) {
                                // build new constraint name
                                index.columnNames.splice(index.columnNames.indexOf(oldColumn.name), 1);
                                index.columnNames.push(newColumn.name);
                                var newIndexName = _this.connection.namingStrategy.indexName(clonedTable, index.columnNames, index.where);
                                // drop old index
                                upQueries.push(_this.dropIndexSql(clonedTable, index));
                                downQueries.push(_this.createIndexSql(clonedTable, index));
                                // replace constraint name
                                index.name = newIndexName;
                                // create new index
                                upQueries.push(_this.createIndexSql(clonedTable, index));
                                downQueries.push(_this.dropIndexSql(clonedTable, index));
                            });
                            // rename foreign key constraints
                            clonedTable.findColumnForeignKeys(oldColumn).forEach(function (foreignKey) {
                                // build new constraint name
                                foreignKey.columnNames.splice(foreignKey.columnNames.indexOf(oldColumn.name), 1);
                                foreignKey.columnNames.push(newColumn.name);
                                var newForeignKeyName = _this.connection.namingStrategy.foreignKeyName(clonedTable, foreignKey.columnNames, foreignKey.referencedTableName, foreignKey.referencedColumnNames);
                                upQueries.push(_this.dropForeignKeySql(clonedTable, foreignKey));
                                downQueries.push(_this.createForeignKeySql(clonedTable, foreignKey));
                                // replace constraint name
                                foreignKey.name = newForeignKeyName;
                                // create new FK's
                                upQueries.push(_this.createForeignKeySql(clonedTable, foreignKey));
                                downQueries.push(_this.dropForeignKeySql(clonedTable, foreignKey));
                            });
                            // rename check constraints
                            clonedTable.findColumnChecks(oldColumn).forEach(function (check) {
                                // build new constraint name
                                check.columnNames.splice(check.columnNames.indexOf(oldColumn.name), 1);
                                check.columnNames.push(newColumn.name);
                                var newCheckName = _this.connection.namingStrategy.checkConstraintName(clonedTable, check.expression);
                                upQueries.push(_this.dropCheckConstraintSql(clonedTable, check));
                                downQueries.push(_this.createCheckConstraintSql(clonedTable, check));
                                // replace constraint name
                                check.name = newCheckName;
                                upQueries.push(_this.createCheckConstraintSql(clonedTable, check));
                                downQueries.push(_this.dropCheckConstraintSql(clonedTable, check));
                            });
                            oldTableColumn = clonedTable.columns.find(function (column) { return column.name === oldColumn.name; });
                            clonedTable.columns[clonedTable.columns.indexOf(oldTableColumn)].name = newColumn.name;
                            oldColumn.name = newColumn.name;
                        }
                        if (this.isColumnChanged(oldColumn, newColumn)) {
                            upQueries.push(new Query("ALTER TABLE " + this.escapePath(table) + " ALTER (" + this.buildCreateColumnSql(newColumn) + ")"));
                            downQueries.push(new Query("ALTER TABLE " + this.escapePath(table) + " ALTER (" + this.buildCreateColumnSql(oldColumn) + ")"));
                        }
                        if (newColumn.isPrimary !== oldColumn.isPrimary) {
                            primaryColumns = clonedTable.primaryColumns;
                            // if primary column state changed, we must always drop existed constraint.
                            if (primaryColumns.length > 0) {
                                pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(function (column) { return column.name; }));
                                columnNames = primaryColumns.map(function (column) { return "\"" + column.name + "\""; }).join(", ");
                                upQueries.push(new Query("ALTER TABLE " + this.escapePath(table) + " DROP CONSTRAINT \"" + pkName + "\""));
                                downQueries.push(new Query("ALTER TABLE " + this.escapePath(table) + " ADD CONSTRAINT \"" + pkName + "\" PRIMARY KEY (" + columnNames + ")"));
                            }
                            if (newColumn.isPrimary === true) {
                                primaryColumns.push(newColumn);
                                column = clonedTable.columns.find(function (column) { return column.name === newColumn.name; });
                                column.isPrimary = true;
                                pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(function (column) { return column.name; }));
                                columnNames = primaryColumns.map(function (column) { return "\"" + column.name + "\""; }).join(", ");
                                upQueries.push(new Query("ALTER TABLE " + this.escapePath(table) + " ADD CONSTRAINT \"" + pkName + "\" PRIMARY KEY (" + columnNames + ")"));
                                downQueries.push(new Query("ALTER TABLE " + this.escapePath(table) + " DROP CONSTRAINT \"" + pkName + "\""));
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
                                    upQueries.push(new Query("ALTER TABLE " + this.escapePath(table) + " ADD CONSTRAINT \"" + pkName + "\" PRIMARY KEY (" + columnNames + ")"));
                                    downQueries.push(new Query("ALTER TABLE " + this.escapePath(table) + " DROP CONSTRAINT \"" + pkName + "\""));
                                }
                            }
                        }
                        if (newColumn.isUnique !== oldColumn.isUnique) {
                            if (newColumn.isUnique === true) {
                                uniqueIndex = new TableIndex({
                                    name: this.connection.namingStrategy.indexName(table.name, [newColumn.name]),
                                    columnNames: [newColumn.name],
                                    isUnique: true
                                });
                                clonedTable.indices.push(uniqueIndex);
                                clonedTable.uniques.push(new TableUnique({
                                    name: uniqueIndex.name,
                                    columnNames: uniqueIndex.columnNames
                                }));
                                upQueries.push(this.createIndexSql(table, uniqueIndex));
                                downQueries.push(this.dropIndexSql(table, uniqueIndex));
                            }
                            else {
                                uniqueIndex_1 = clonedTable.indices.find(function (index) {
                                    return index.columnNames.length === 1 && index.isUnique === true && !!index.columnNames.find(function (columnName) { return columnName === newColumn.name; });
                                });
                                clonedTable.indices.splice(clonedTable.indices.indexOf(uniqueIndex_1), 1);
                                tableUnique = clonedTable.uniques.find(function (unique) { return unique.name === uniqueIndex_1.name; });
                                clonedTable.uniques.splice(clonedTable.uniques.indexOf(tableUnique), 1);
                                upQueries.push(this.dropIndexSql(table, uniqueIndex_1));
                                downQueries.push(this.createIndexSql(table, uniqueIndex_1));
                            }
                        }
                        if (newColumn.default !== oldColumn.default) {
                            if (newColumn.default !== null && newColumn.default !== undefined) {
                                upQueries.push(new Query("ALTER TABLE " + this.escapePath(table) + " ALTER (\"" + newColumn.name + "\" " + this.connection.driver.createFullType(newColumn) + " DEFAULT " + newColumn.default + ")"));
                                if (oldColumn.default !== null && oldColumn.default !== undefined) {
                                    downQueries.push(new Query("ALTER TABLE " + this.escapePath(table) + " ALTER (\"" + oldColumn.name + "\" " + this.connection.driver.createFullType(oldColumn) + " DEFAULT " + oldColumn.default + ")"));
                                }
                                else {
                                    downQueries.push(new Query("ALTER TABLE " + this.escapePath(table) + " ALTER (\"" + oldColumn.name + "\" " + this.connection.driver.createFullType(oldColumn) + " DEFAULT NULL)"));
                                }
                            }
                            else if (oldColumn.default !== null && oldColumn.default !== undefined) {
                                upQueries.push(new Query("ALTER TABLE " + this.escapePath(table) + " ALTER (\"" + newColumn.name + "\" " + this.connection.driver.createFullType(newColumn) + " DEFAULT NULL)"));
                                downQueries.push(new Query("ALTER TABLE " + this.escapePath(table) + " ALTER (\"" + oldColumn.name + "\" " + this.connection.driver.createFullType(oldColumn) + " DEFAULT " + oldColumn.default + ")"));
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
    SapQueryRunner.prototype.changeColumns = function (tableOrName, changedColumns) {
        return __awaiter(this, void 0, void 0, function () {
            var changedColumns_1, changedColumns_1_1, _a, oldColumn, newColumn, e_2_1;
            var e_2, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 5, 6, 7]);
                        changedColumns_1 = __values(changedColumns), changedColumns_1_1 = changedColumns_1.next();
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
    SapQueryRunner.prototype.dropColumn = function (tableOrName, columnOrName) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, parsedTableName, column, clonedTable, upQueries, downQueries, referencedForeignKeySql, dbForeignKeys_2, referencedForeignKeys, referencedForeignKeyTableMapping_2, pkName, columnNames, tableColumn, pkName_2, columnNames_2, columnIndex, uniqueName_1, foundUnique, indexName_1, foundIndex, columnCheck;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        parsedTableName = this.parseTableName(table);
                        column = columnOrName instanceof TableColumn ? columnOrName : table.findColumnByName(columnOrName);
                        if (!column)
                            throw new Error("Column \"" + columnOrName + "\" was not found in table \"" + table.name + "\"");
                        clonedTable = table.clone();
                        upQueries = [];
                        downQueries = [];
                        if (!column.isPrimary) return [3 /*break*/, 5];
                        referencedForeignKeySql = "SELECT * FROM \"SYS\".\"REFERENTIAL_CONSTRAINTS\" WHERE \"REFERENCED_SCHEMA_NAME\" = " + parsedTableName.schema + " AND \"REFERENCED_TABLE_NAME\" = " + parsedTableName.tableName;
                        return [4 /*yield*/, this.query(referencedForeignKeySql)];
                    case 4:
                        dbForeignKeys_2 = _b.sent();
                        referencedForeignKeys = [];
                        referencedForeignKeyTableMapping_2 = [];
                        if (dbForeignKeys_2.length > 0) {
                            referencedForeignKeys = dbForeignKeys_2.map(function (dbForeignKey) {
                                var foreignKeys = dbForeignKeys_2.filter(function (dbFk) { return dbFk["CONSTRAINT_NAME"] === dbForeignKey["CONSTRAINT_NAME"]; });
                                referencedForeignKeyTableMapping_2.push({ tableName: dbForeignKey["SCHEMA_NAME"] + "." + dbForeignKey["TABLE_NAME"], fkName: dbForeignKey["CONSTRAINT_NAME"] });
                                return new TableForeignKey({
                                    name: dbForeignKey["CONSTRAINT_NAME"],
                                    columnNames: foreignKeys.map(function (dbFk) { return dbFk["COLUMN_NAME"]; }),
                                    referencedTableName: table.name,
                                    referencedColumnNames: foreignKeys.map(function (dbFk) { return dbFk["REFERENCED_COLUMN_NAME"]; }),
                                    onDelete: dbForeignKey["DELETE_RULE"] === "RESTRICT" ? "NO ACTION" : dbForeignKey["DELETE_RULE"],
                                    onUpdate: dbForeignKey["UPDATE_RULE"] === "RESTRICT" ? "NO ACTION" : dbForeignKey["UPDATE_RULE"],
                                });
                            });
                            // drop referenced foreign keys
                            referencedForeignKeys.forEach(function (foreignKey) {
                                var mapping = referencedForeignKeyTableMapping_2.find(function (it) { return it.fkName === foreignKey.name; });
                                upQueries.push(_this.dropForeignKeySql(mapping.tableName, foreignKey));
                                downQueries.push(_this.createForeignKeySql(mapping.tableName, foreignKey));
                            });
                        }
                        pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, clonedTable.primaryColumns.map(function (column) { return column.name; }));
                        columnNames = clonedTable.primaryColumns.map(function (primaryColumn) { return "\"" + primaryColumn.name + "\""; }).join(", ");
                        upQueries.push(new Query("ALTER TABLE " + this.escapePath(clonedTable) + " DROP CONSTRAINT \"" + pkName + "\""));
                        downQueries.push(new Query("ALTER TABLE " + this.escapePath(clonedTable) + " ADD CONSTRAINT \"" + pkName + "\" PRIMARY KEY (" + columnNames + ")"));
                        tableColumn = clonedTable.findColumnByName(column.name);
                        tableColumn.isPrimary = false;
                        // if primary key have multiple columns, we must recreate it without dropped column
                        if (clonedTable.primaryColumns.length > 0) {
                            pkName_2 = this.connection.namingStrategy.primaryKeyName(clonedTable.name, clonedTable.primaryColumns.map(function (column) { return column.name; }));
                            columnNames_2 = clonedTable.primaryColumns.map(function (primaryColumn) { return "\"" + primaryColumn.name + "\""; }).join(", ");
                            upQueries.push(new Query("ALTER TABLE " + this.escapePath(clonedTable) + " ADD CONSTRAINT \"" + pkName_2 + "\" PRIMARY KEY (" + columnNames_2 + ")"));
                            downQueries.push(new Query("ALTER TABLE " + this.escapePath(clonedTable) + " DROP CONSTRAINT \"" + pkName_2 + "\""));
                        }
                        // restore referenced foreign keys
                        referencedForeignKeys.forEach(function (foreignKey) {
                            var mapping = referencedForeignKeyTableMapping_2.find(function (it) { return it.fkName === foreignKey.name; });
                            upQueries.push(_this.createForeignKeySql(mapping.tableName, foreignKey));
                            downQueries.push(_this.dropForeignKeySql(mapping.tableName, foreignKey));
                        });
                        _b.label = 5;
                    case 5:
                        columnIndex = clonedTable.indices.find(function (index) { return index.columnNames.length === 1 && index.columnNames[0] === column.name; });
                        if (columnIndex) {
                            clonedTable.indices.splice(clonedTable.indices.indexOf(columnIndex), 1);
                            upQueries.push(this.dropIndexSql(table, columnIndex));
                            downQueries.push(this.createIndexSql(table, columnIndex));
                        }
                        else if (column.isUnique) {
                            uniqueName_1 = this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]);
                            foundUnique = clonedTable.uniques.find(function (unique) { return unique.name === uniqueName_1; });
                            if (foundUnique) {
                                clonedTable.uniques.splice(clonedTable.uniques.indexOf(foundUnique), 1);
                                upQueries.push(this.dropIndexSql(table, uniqueName_1));
                                downQueries.push(new Query("CREATE UNIQUE INDEX \"" + uniqueName_1 + "\" ON " + this.escapePath(table) + " (\"" + column.name + "\")"));
                            }
                            indexName_1 = this.connection.namingStrategy.indexName(table.name, [column.name]);
                            foundIndex = clonedTable.indices.find(function (index) { return index.name === indexName_1; });
                            if (foundIndex) {
                                clonedTable.indices.splice(clonedTable.indices.indexOf(foundIndex), 1);
                                upQueries.push(this.dropIndexSql(table, indexName_1));
                                downQueries.push(new Query("CREATE UNIQUE INDEX \"" + indexName_1 + "\" ON " + this.escapePath(table) + " (\"" + column.name + "\")"));
                            }
                        }
                        columnCheck = clonedTable.checks.find(function (check) { return !!check.columnNames && check.columnNames.length === 1 && check.columnNames[0] === column.name; });
                        if (columnCheck) {
                            clonedTable.checks.splice(clonedTable.checks.indexOf(columnCheck), 1);
                            upQueries.push(this.dropCheckConstraintSql(table, columnCheck));
                            downQueries.push(this.createCheckConstraintSql(table, columnCheck));
                        }
                        upQueries.push(new Query(this.dropColumnSql(table, column)));
                        downQueries.push(new Query(this.addColumnSql(table, column)));
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 6:
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
    SapQueryRunner.prototype.dropColumns = function (tableOrName, columns) {
        return __awaiter(this, void 0, void 0, function () {
            var columns_2, columns_2_1, column, e_3_1;
            var e_3, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, 6, 7]);
                        columns_2 = __values(columns), columns_2_1 = columns_2.next();
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
    SapQueryRunner.prototype.createPrimaryKey = function (tableOrName, columnNames) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, clonedTable, up, down;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
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
    SapQueryRunner.prototype.updatePrimaryKeys = function (tableOrName, columns) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, parsedTableName, clonedTable, columnNames, upQueries, downQueries, referencedForeignKeySql, dbForeignKeys, referencedForeignKeys, referencedForeignKeyTableMapping, primaryColumns, pkName_3, columnNamesString_1, pkName, columnNamesString;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        parsedTableName = this.parseTableName(table);
                        clonedTable = table.clone();
                        columnNames = columns.map(function (column) { return column.name; });
                        upQueries = [];
                        downQueries = [];
                        referencedForeignKeySql = "SELECT * FROM \"SYS\".\"REFERENTIAL_CONSTRAINTS\" WHERE \"REFERENCED_SCHEMA_NAME\" = " + parsedTableName.schema + " AND \"REFERENCED_TABLE_NAME\" = " + parsedTableName.tableName;
                        return [4 /*yield*/, this.query(referencedForeignKeySql)];
                    case 4:
                        dbForeignKeys = _b.sent();
                        referencedForeignKeys = [];
                        referencedForeignKeyTableMapping = [];
                        if (dbForeignKeys.length > 0) {
                            referencedForeignKeys = dbForeignKeys.map(function (dbForeignKey) {
                                var foreignKeys = dbForeignKeys.filter(function (dbFk) { return dbFk["CONSTRAINT_NAME"] === dbForeignKey["CONSTRAINT_NAME"]; });
                                referencedForeignKeyTableMapping.push({ tableName: dbForeignKey["SCHEMA_NAME"] + "." + dbForeignKey["TABLE_NAME"], fkName: dbForeignKey["CONSTRAINT_NAME"] });
                                return new TableForeignKey({
                                    name: dbForeignKey["CONSTRAINT_NAME"],
                                    columnNames: foreignKeys.map(function (dbFk) { return dbFk["COLUMN_NAME"]; }),
                                    referencedTableName: table.name,
                                    referencedColumnNames: foreignKeys.map(function (dbFk) { return dbFk["REFERENCED_COLUMN_NAME"]; }),
                                    onDelete: dbForeignKey["DELETE_RULE"] === "RESTRICT" ? "NO ACTION" : dbForeignKey["DELETE_RULE"],
                                    onUpdate: dbForeignKey["UPDATE_RULE"] === "RESTRICT" ? "NO ACTION" : dbForeignKey["UPDATE_RULE"],
                                });
                            });
                            // drop referenced foreign keys
                            referencedForeignKeys.forEach(function (foreignKey) {
                                var mapping = referencedForeignKeyTableMapping.find(function (it) { return it.fkName === foreignKey.name; });
                                upQueries.push(_this.dropForeignKeySql(mapping.tableName, foreignKey));
                                downQueries.push(_this.createForeignKeySql(mapping.tableName, foreignKey));
                            });
                        }
                        primaryColumns = clonedTable.primaryColumns;
                        if (primaryColumns.length > 0) {
                            pkName_3 = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(function (column) { return column.name; }));
                            columnNamesString_1 = primaryColumns.map(function (column) { return "\"" + column.name + "\""; }).join(", ");
                            upQueries.push(new Query("ALTER TABLE " + this.escapePath(table) + " DROP CONSTRAINT \"" + pkName_3 + "\""));
                            downQueries.push(new Query("ALTER TABLE " + this.escapePath(table) + " ADD CONSTRAINT \"" + pkName_3 + "\" PRIMARY KEY (" + columnNamesString_1 + ")"));
                        }
                        // update columns in table.
                        clonedTable.columns
                            .filter(function (column) { return columnNames.indexOf(column.name) !== -1; })
                            .forEach(function (column) { return column.isPrimary = true; });
                        pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, columnNames);
                        columnNamesString = columnNames.map(function (columnName) { return "\"" + columnName + "\""; }).join(", ");
                        upQueries.push(new Query("ALTER TABLE " + this.escapePath(table) + " ADD CONSTRAINT \"" + pkName + "\" PRIMARY KEY (" + columnNamesString + ")"));
                        downQueries.push(new Query("ALTER TABLE " + this.escapePath(table) + " DROP CONSTRAINT \"" + pkName + "\""));
                        // restore referenced foreign keys
                        referencedForeignKeys.forEach(function (foreignKey) {
                            var mapping = referencedForeignKeyTableMapping.find(function (it) { return it.fkName === foreignKey.name; });
                            upQueries.push(_this.createForeignKeySql(mapping.tableName, foreignKey));
                            downQueries.push(_this.dropForeignKeySql(mapping.tableName, foreignKey));
                        });
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 5:
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
    SapQueryRunner.prototype.dropPrimaryKey = function (tableOrName) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, parsedTableName, upQueries, downQueries, referencedForeignKeySql, dbForeignKeys, referencedForeignKeys, referencedForeignKeyTableMapping;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        parsedTableName = this.parseTableName(table);
                        upQueries = [];
                        downQueries = [];
                        referencedForeignKeySql = "SELECT * FROM \"SYS\".\"REFERENTIAL_CONSTRAINTS\" WHERE \"REFERENCED_SCHEMA_NAME\" = " + parsedTableName.schema + " AND \"REFERENCED_TABLE_NAME\" = " + parsedTableName.tableName;
                        return [4 /*yield*/, this.query(referencedForeignKeySql)];
                    case 4:
                        dbForeignKeys = _b.sent();
                        referencedForeignKeys = [];
                        referencedForeignKeyTableMapping = [];
                        if (dbForeignKeys.length > 0) {
                            referencedForeignKeys = dbForeignKeys.map(function (dbForeignKey) {
                                var foreignKeys = dbForeignKeys.filter(function (dbFk) { return dbFk["CONSTRAINT_NAME"] === dbForeignKey["CONSTRAINT_NAME"]; });
                                referencedForeignKeyTableMapping.push({ tableName: dbForeignKey["SCHEMA_NAME"] + "." + dbForeignKey["TABLE_NAME"], fkName: dbForeignKey["CONSTRAINT_NAME"] });
                                return new TableForeignKey({
                                    name: dbForeignKey["CONSTRAINT_NAME"],
                                    columnNames: foreignKeys.map(function (dbFk) { return dbFk["COLUMN_NAME"]; }),
                                    referencedTableName: table.name,
                                    referencedColumnNames: foreignKeys.map(function (dbFk) { return dbFk["REFERENCED_COLUMN_NAME"]; }),
                                    onDelete: dbForeignKey["DELETE_RULE"] === "RESTRICT" ? "NO ACTION" : dbForeignKey["DELETE_RULE"],
                                    onUpdate: dbForeignKey["UPDATE_RULE"] === "RESTRICT" ? "NO ACTION" : dbForeignKey["UPDATE_RULE"],
                                });
                            });
                            // drop referenced foreign keys
                            referencedForeignKeys.forEach(function (foreignKey) {
                                var mapping = referencedForeignKeyTableMapping.find(function (it) { return it.fkName === foreignKey.name; });
                                upQueries.push(_this.dropForeignKeySql(mapping.tableName, foreignKey));
                                downQueries.push(_this.createForeignKeySql(mapping.tableName, foreignKey));
                            });
                        }
                        upQueries.push(this.dropPrimaryKeySql(table));
                        downQueries.push(this.createPrimaryKeySql(table, table.primaryColumns.map(function (column) { return column.name; })));
                        // restore referenced foreign keys
                        referencedForeignKeys.forEach(function (foreignKey) {
                            var mapping = referencedForeignKeyTableMapping.find(function (it) { return it.fkName === foreignKey.name; });
                            upQueries.push(_this.createForeignKeySql(mapping.tableName, foreignKey));
                            downQueries.push(_this.dropForeignKeySql(mapping.tableName, foreignKey));
                        });
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 5:
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
    SapQueryRunner.prototype.createUniqueConstraint = function (tableOrName, uniqueConstraint) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("SAP HANA does not support unique constraints. Use unique index instead.");
            });
        });
    };
    /**
     * Creates a new unique constraints.
     */
    SapQueryRunner.prototype.createUniqueConstraints = function (tableOrName, uniqueConstraints) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("SAP HANA does not support unique constraints. Use unique index instead.");
            });
        });
    };
    /**
     * Drops unique constraint.
     */
    SapQueryRunner.prototype.dropUniqueConstraint = function (tableOrName, uniqueOrName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("SAP HANA does not support unique constraints. Use unique index instead.");
            });
        });
    };
    /**
     * Drops an unique constraints.
     */
    SapQueryRunner.prototype.dropUniqueConstraints = function (tableOrName, uniqueConstraints) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("SAP HANA does not support unique constraints. Use unique index instead.");
            });
        });
    };
    /**
     * Creates a new check constraint.
     */
    SapQueryRunner.prototype.createCheckConstraint = function (tableOrName, checkConstraint) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, up, down;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
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
     * Creates a new check constraints.
     */
    SapQueryRunner.prototype.createCheckConstraints = function (tableOrName, checkConstraints) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
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
    SapQueryRunner.prototype.dropCheckConstraint = function (tableOrName, checkOrName) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, checkConstraint, up, down;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        checkConstraint = checkOrName instanceof TableCheck ? checkOrName : table.checks.find(function (c) { return c.name === checkOrName; });
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
    SapQueryRunner.prototype.dropCheckConstraints = function (tableOrName, checkConstraints) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
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
    SapQueryRunner.prototype.createExclusionConstraint = function (tableOrName, exclusionConstraint) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("SAP HANA does not support exclusion constraints.");
            });
        });
    };
    /**
     * Creates a new exclusion constraints.
     */
    SapQueryRunner.prototype.createExclusionConstraints = function (tableOrName, exclusionConstraints) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("SAP HANA does not support exclusion constraints.");
            });
        });
    };
    /**
     * Drops exclusion constraint.
     */
    SapQueryRunner.prototype.dropExclusionConstraint = function (tableOrName, exclusionOrName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("SAP HANA does not support exclusion constraints.");
            });
        });
    };
    /**
     * Drops exclusion constraints.
     */
    SapQueryRunner.prototype.dropExclusionConstraints = function (tableOrName, exclusionConstraints) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("SAP HANA does not support exclusion constraints.");
            });
        });
    };
    /**
     * Creates a new foreign key.
     */
    SapQueryRunner.prototype.createForeignKey = function (tableOrName, foreignKey) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, up, down;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
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
    SapQueryRunner.prototype.createForeignKeys = function (tableOrName, foreignKeys) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
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
    SapQueryRunner.prototype.dropForeignKey = function (tableOrName, foreignKeyOrName) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, foreignKey, up, down;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        foreignKey = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName : table.foreignKeys.find(function (fk) { return fk.name === foreignKeyOrName; });
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
    SapQueryRunner.prototype.dropForeignKeys = function (tableOrName, foreignKeys) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
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
    SapQueryRunner.prototype.createIndex = function (tableOrName, index) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, up, down;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
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
                        down = this.dropIndexSql(table, index);
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
    SapQueryRunner.prototype.createIndices = function (tableOrName, indices) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
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
     * Drops an index.
     */
    SapQueryRunner.prototype.dropIndex = function (tableOrName, indexOrName) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, index, up, down;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        index = indexOrName instanceof TableIndex ? indexOrName : table.indices.find(function (i) { return i.name === indexOrName; });
                        if (!index)
                            throw new Error("Supplied index was not found in table " + table.name);
                        up = this.dropIndexSql(table, index);
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
    SapQueryRunner.prototype.dropIndices = function (tableOrName, indices) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
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
    SapQueryRunner.prototype.clearTable = function (tablePath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.query("TRUNCATE TABLE " + this.escapePath(tablePath))];
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
    SapQueryRunner.prototype.clearDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var schemas, schemaNamesString, selectTableDropsQuery, dropTableQueries, error_1, rollbackError_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        schemas = [];
                        this.connection.entityMetadatas
                            .filter(function (metadata) { return metadata.schema; })
                            .forEach(function (metadata) {
                            var isSchemaExist = !!schemas.find(function (schema) { return schema === metadata.schema; });
                            if (!isSchemaExist)
                                schemas.push(metadata.schema);
                        });
                        schemas.push(this.driver.options.schema || "current_schema");
                        schemaNamesString = schemas.map(function (name) {
                            return name === "current_schema" ? name : "'" + name + "'";
                        }).join(", ");
                        return [4 /*yield*/, this.startTransaction()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 6, , 11]);
                        selectTableDropsQuery = "SELECT 'DROP TABLE \"' || schema_name || '\".\"' || table_name || '\" CASCADE;' as \"query\" FROM \"SYS\".\"TABLES\" WHERE \"SCHEMA_NAME\" IN (" + schemaNamesString + ") AND \"TABLE_NAME\" NOT IN ('SYS_AFL_GENERATOR_PARAMETERS') AND \"IS_COLUMN_TABLE\" = 'TRUE'";
                        return [4 /*yield*/, this.query(selectTableDropsQuery)];
                    case 3:
                        dropTableQueries = _a.sent();
                        return [4 /*yield*/, Promise.all(dropTableQueries.map(function (q) { return _this.query(q["query"]); }))];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, this.commitTransaction()];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 11];
                    case 6:
                        error_1 = _a.sent();
                        _a.label = 7;
                    case 7:
                        _a.trys.push([7, 9, , 10]);
                        return [4 /*yield*/, this.rollbackTransaction()];
                    case 8:
                        _a.sent();
                        return [3 /*break*/, 10];
                    case 9:
                        rollbackError_1 = _a.sent();
                        return [3 /*break*/, 10];
                    case 10: throw error_1;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Return current database.
     */
    SapQueryRunner.prototype.getCurrentDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var currentDBQuery;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.query("SELECT \"VALUE\" AS \"db_name\" FROM \"SYS\".\"M_SYSTEM_OVERVIEW\" WHERE \"SECTION\" = 'System' and \"NAME\" = 'Instance ID'")];
                    case 1:
                        currentDBQuery = _a.sent();
                        return [2 /*return*/, currentDBQuery[0]["db_name"]];
                }
            });
        });
    };
    /**
     * Return current schema.
     */
    SapQueryRunner.prototype.getCurrentSchema = function () {
        return __awaiter(this, void 0, void 0, function () {
            var currentSchemaQuery;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.query("SELECT CURRENT_SCHEMA AS \"schema_name\" FROM \"SYS\".\"DUMMY\"")];
                    case 1:
                        currentSchemaQuery = _a.sent();
                        return [2 /*return*/, currentSchemaQuery[0]["schema_name"]];
                }
            });
        });
    };
    SapQueryRunner.prototype.loadViews = function (viewNames) {
        return __awaiter(this, void 0, void 0, function () {
            var hasTable, currentSchema, viewsCondition, query, dbViews;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.hasTable(this.getTypeormMetadataTableName())];
                    case 1:
                        hasTable = _a.sent();
                        if (!hasTable)
                            return [2 /*return*/, Promise.resolve([])];
                        return [4 /*yield*/, this.getCurrentSchema()];
                    case 2:
                        currentSchema = _a.sent();
                        viewsCondition = viewNames.map(function (viewName) {
                            var _a = __read(viewName.split("."), 2), schema = _a[0], name = _a[1];
                            if (!name) {
                                name = schema;
                                schema = _this.driver.options.schema || currentSchema;
                            }
                            return "(\"t\".\"schema\" = '" + schema + "' AND \"t\".\"name\" = '" + name + "')";
                        }).join(" OR ");
                        query = "SELECT \"t\".* FROM " + this.escapePath(this.getTypeormMetadataTableName()) + " \"t\" WHERE \"t\".\"type\" = 'VIEW' " + (viewsCondition ? "AND (" + viewsCondition + ")" : "");
                        return [4 /*yield*/, this.query(query)];
                    case 3:
                        dbViews = _a.sent();
                        return [2 /*return*/, dbViews.map(function (dbView) {
                                var view = new View();
                                var schema = dbView["schema"] === currentSchema && !_this.driver.options.schema ? undefined : dbView["schema"];
                                view.name = _this.driver.buildTableName(dbView["name"], schema);
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
    SapQueryRunner.prototype.loadTables = function (tableNames) {
        return __awaiter(this, void 0, void 0, function () {
            var currentSchema, tablesCondition, tablesSql, columnsSql, constraintsCondition, constraintsSql, indicesCondition, indicesSql, foreignKeysCondition, foreignKeysSql, _a, dbTables, dbColumns, dbConstraints, dbIndices, dbForeignKeys;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // if no tables given then no need to proceed
                        if (!tableNames || !tableNames.length)
                            return [2 /*return*/, []];
                        return [4 /*yield*/, this.getCurrentSchema()];
                    case 1:
                        currentSchema = _b.sent();
                        tablesCondition = tableNames.map(function (tableName) {
                            var _a = __read(tableName.split("."), 2), schema = _a[0], name = _a[1];
                            if (!name) {
                                name = schema;
                                schema = _this.driver.options.schema || currentSchema;
                            }
                            return "(\"SCHEMA_NAME\" = '" + schema + "' AND \"TABLE_NAME\" = '" + name + "')";
                        }).join(" OR ");
                        tablesSql = "SELECT * FROM \"SYS\".\"TABLES\" WHERE " + tablesCondition;
                        columnsSql = "SELECT * FROM \"SYS\".\"TABLE_COLUMNS\" WHERE " + tablesCondition + " ORDER BY \"POSITION\"";
                        constraintsCondition = tableNames.map(function (tableName) {
                            var _a = __read(tableName.split("."), 2), schema = _a[0], name = _a[1];
                            if (!name) {
                                name = schema;
                                schema = _this.driver.options.schema || currentSchema;
                            }
                            return "(\"SCHEMA_NAME\" = '" + schema + "' AND \"TABLE_NAME\" = '" + name + "')";
                        }).join(" OR ");
                        constraintsSql = "SELECT * FROM \"SYS\".\"CONSTRAINTS\" WHERE (" + constraintsCondition + ") ORDER BY \"POSITION\"";
                        indicesCondition = tableNames.map(function (tableName) {
                            var _a = __read(tableName.split("."), 2), schema = _a[0], name = _a[1];
                            if (!name) {
                                name = schema;
                                schema = _this.driver.options.schema || currentSchema;
                            }
                            return "(\"I\".\"SCHEMA_NAME\" = '" + schema + "' AND \"I\".\"TABLE_NAME\" = '" + name + "')";
                        }).join(" OR ");
                        indicesSql = "SELECT \"I\".\"INDEX_TYPE\", \"I\".\"SCHEMA_NAME\", \"I\".\"TABLE_NAME\", \"I\".\"INDEX_NAME\", \"IC\".\"COLUMN_NAME\", \"I\".\"CONSTRAINT\" " +
                            "FROM \"SYS\".\"INDEXES\" \"I\" INNER JOIN \"SYS\".\"INDEX_COLUMNS\" \"IC\" ON \"IC\".\"INDEX_OID\" = \"I\".\"INDEX_OID\" " +
                            ("WHERE (" + indicesCondition + ") AND (\"I\".\"CONSTRAINT\" IS NULL OR \"I\".\"CONSTRAINT\" != 'PRIMARY KEY') AND \"I\".\"INDEX_NAME\" NOT LIKE '%_SYS_FULLTEXT_%' ORDER BY \"IC\".\"POSITION\"");
                        foreignKeysCondition = tableNames.map(function (tableName) {
                            var _a = __read(tableName.split("."), 2), schema = _a[0], name = _a[1];
                            if (!name) {
                                name = schema;
                                schema = _this.driver.options.schema || currentSchema;
                            }
                            return "(\"SCHEMA_NAME\" = '" + schema + "' AND \"TABLE_NAME\" = '" + name + "')";
                        }).join(" OR ");
                        foreignKeysSql = "SELECT * FROM \"SYS\".\"REFERENTIAL_CONSTRAINTS\" WHERE (" + foreignKeysCondition + ") ORDER BY \"POSITION\"";
                        return [4 /*yield*/, Promise.all([
                                this.query(tablesSql),
                                this.query(columnsSql),
                                this.query(constraintsSql),
                                this.query(indicesSql),
                                this.query(foreignKeysSql),
                            ])];
                    case 2:
                        _a = __read.apply(void 0, [_b.sent(), 5]), dbTables = _a[0], dbColumns = _a[1], dbConstraints = _a[2], dbIndices = _a[3], dbForeignKeys = _a[4];
                        // if tables were not found in the db, no need to proceed
                        if (!dbTables.length)
                            return [2 /*return*/, []];
                        // create tables for loaded tables
                        return [2 /*return*/, Promise.all(dbTables.map(function (dbTable) { return __awaiter(_this, void 0, void 0, function () {
                                var table, schema, tableFullName, _a, tableCheckConstraints, tableForeignKeyConstraints, tableIndexConstraints;
                                var _this = this;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            table = new Table();
                                            schema = dbTable["SCHEMA_NAME"] === currentSchema && !this.driver.options.schema ? undefined : dbTable["SCHEMA_NAME"];
                                            table.name = this.driver.buildTableName(dbTable["TABLE_NAME"], schema);
                                            tableFullName = this.driver.buildTableName(dbTable["TABLE_NAME"], dbTable["SCHEMA_NAME"]);
                                            // create columns from the loaded columns
                                            _a = table;
                                            return [4 /*yield*/, Promise.all(dbColumns
                                                    .filter(function (dbColumn) { return _this.driver.buildTableName(dbColumn["TABLE_NAME"], dbColumn["SCHEMA_NAME"]) === tableFullName; })
                                                    .map(function (dbColumn) { return __awaiter(_this, void 0, void 0, function () {
                                                    var columnConstraints, columnUniqueIndex, tableMetadata, hasIgnoredIndex, isConstraintComposite, tableColumn, length_1;
                                                    var _this = this;
                                                    return __generator(this, function (_a) {
                                                        columnConstraints = dbConstraints.filter(function (dbConstraint) {
                                                            return _this.driver.buildTableName(dbConstraint["TABLE_NAME"], dbConstraint["SCHEMA_NAME"]) === tableFullName && dbConstraint["COLUMN_NAME"] === dbColumn["COLUMN_NAME"];
                                                        });
                                                        columnUniqueIndex = dbIndices.find(function (dbIndex) {
                                                            var indexTableFullName = _this.driver.buildTableName(dbIndex["TABLE_NAME"], dbIndex["SCHEMA_NAME"]);
                                                            if (indexTableFullName !== tableFullName) {
                                                                return false;
                                                            }
                                                            // Index is not for this column
                                                            if (dbIndex["COLUMN_NAME"] !== dbColumn["COLUMN_NAME"]) {
                                                                return false;
                                                            }
                                                            return dbIndex["CONSTRAINT"] && dbIndex["CONSTRAINT"].indexOf("UNIQUE") !== -1;
                                                        });
                                                        tableMetadata = this.connection.entityMetadatas.find(function (metadata) { return metadata.tablePath === table.name; });
                                                        hasIgnoredIndex = columnUniqueIndex && tableMetadata && tableMetadata.indices
                                                            .some(function (index) { return index.name === columnUniqueIndex["INDEX_NAME"] && index.synchronize === false; });
                                                        isConstraintComposite = columnUniqueIndex
                                                            ? !!dbIndices.find(function (dbIndex) { return dbIndex["INDEX_NAME"] === columnUniqueIndex["INDEX_NAME"] && dbIndex["COLUMN_NAME"] !== dbColumn["COLUMN_NAME"]; })
                                                            : false;
                                                        tableColumn = new TableColumn();
                                                        tableColumn.name = dbColumn["COLUMN_NAME"];
                                                        tableColumn.type = dbColumn["DATA_TYPE_NAME"].toLowerCase();
                                                        if (tableColumn.type === "dec" || tableColumn.type === "decimal") {
                                                            // If one of these properties was set, and another was not, Postgres sets '0' in to unspecified property
                                                            // we set 'undefined' in to unspecified property to avoid changing column on sync
                                                            if (dbColumn["LENGTH"] !== null && !this.isDefaultColumnPrecision(table, tableColumn, dbColumn["LENGTH"])) {
                                                                tableColumn.precision = dbColumn["LENGTH"];
                                                            }
                                                            else if (dbColumn["SCALE"] !== null && !this.isDefaultColumnScale(table, tableColumn, dbColumn["SCALE"])) {
                                                                tableColumn.precision = undefined;
                                                            }
                                                            if (dbColumn["SCALE"] !== null && !this.isDefaultColumnScale(table, tableColumn, dbColumn["SCALE"])) {
                                                                tableColumn.scale = dbColumn["SCALE"];
                                                            }
                                                            else if (dbColumn["LENGTH"] !== null && !this.isDefaultColumnPrecision(table, tableColumn, dbColumn["LENGTH"])) {
                                                                tableColumn.scale = undefined;
                                                            }
                                                        }
                                                        if (dbColumn["DATA_TYPE_NAME"].toLowerCase() === "array") {
                                                            tableColumn.isArray = true;
                                                            tableColumn.type = dbColumn["CS_DATA_TYPE_NAME"].toLowerCase();
                                                        }
                                                        // check only columns that have length property
                                                        if (this.driver.withLengthColumnTypes.indexOf(tableColumn.type) !== -1 && dbColumn["LENGTH"]) {
                                                            length_1 = dbColumn["LENGTH"].toString();
                                                            tableColumn.length = !this.isDefaultColumnLength(table, tableColumn, length_1) ? length_1 : "";
                                                        }
                                                        tableColumn.isUnique = !!columnUniqueIndex && !hasIgnoredIndex && !isConstraintComposite;
                                                        tableColumn.isNullable = dbColumn["IS_NULLABLE"] === "TRUE";
                                                        tableColumn.isPrimary = !!columnConstraints.find(function (constraint) { return constraint["IS_PRIMARY_KEY"] === "TRUE"; });
                                                        tableColumn.isGenerated = dbColumn["GENERATION_TYPE"] === "ALWAYS AS IDENTITY";
                                                        if (tableColumn.isGenerated)
                                                            tableColumn.generationStrategy = "increment";
                                                        if (dbColumn["DEFAULT_VALUE"] === null
                                                            || dbColumn["DEFAULT_VALUE"] === undefined) {
                                                            tableColumn.default = undefined;
                                                        }
                                                        else {
                                                            if (tableColumn.type === "char" || tableColumn.type === "nchar" || tableColumn.type === "varchar" ||
                                                                tableColumn.type === "nvarchar" || tableColumn.type === "alphanum" || tableColumn.type === "shorttext") {
                                                                tableColumn.default = "'" + dbColumn["DEFAULT_VALUE"] + "'";
                                                            }
                                                            else if (tableColumn.type === "boolean") {
                                                                tableColumn.default = dbColumn["DEFAULT_VALUE"] === "1" ? "true" : "false";
                                                            }
                                                            else {
                                                                tableColumn.default = dbColumn["DEFAULT_VALUE"];
                                                            }
                                                        }
                                                        tableColumn.comment = ""; // dbColumn["COLUMN_COMMENT"];
                                                        if (dbColumn["character_set_name"])
                                                            tableColumn.charset = dbColumn["character_set_name"];
                                                        if (dbColumn["collation_name"])
                                                            tableColumn.collation = dbColumn["collation_name"];
                                                        return [2 /*return*/, tableColumn];
                                                    });
                                                }); }))];
                                        case 1:
                                            // create columns from the loaded columns
                                            _a.columns = _b.sent();
                                            tableCheckConstraints = OrmUtils.uniq(dbConstraints.filter(function (dbConstraint) {
                                                return _this.driver.buildTableName(dbConstraint["TABLE_NAME"], dbConstraint["SCHEMA_NAME"]) === tableFullName
                                                    && dbConstraint["CHECK_CONDITION"] !== null && dbConstraint["CHECK_CONDITION"] !== undefined;
                                            }), function (dbConstraint) { return dbConstraint["CONSTRAINT_NAME"]; });
                                            table.checks = tableCheckConstraints.map(function (constraint) {
                                                var checks = dbConstraints.filter(function (dbC) { return dbC["CONSTRAINT_NAME"] === constraint["CONSTRAINT_NAME"]; });
                                                return new TableCheck({
                                                    name: constraint["CONSTRAINT_NAME"],
                                                    columnNames: checks.map(function (c) { return c["COLUMN_NAME"]; }),
                                                    expression: constraint["CHECK_CONDITION"],
                                                });
                                            });
                                            tableForeignKeyConstraints = OrmUtils.uniq(dbForeignKeys.filter(function (dbForeignKey) {
                                                return _this.driver.buildTableName(dbForeignKey["TABLE_NAME"], dbForeignKey["SCHEMA_NAME"]) === tableFullName;
                                            }), function (dbForeignKey) { return dbForeignKey["CONSTRAINT_NAME"]; });
                                            table.foreignKeys = tableForeignKeyConstraints.map(function (dbForeignKey) {
                                                var foreignKeys = dbForeignKeys.filter(function (dbFk) { return dbFk["CONSTRAINT_NAME"] === dbForeignKey["CONSTRAINT_NAME"]; });
                                                // if referenced table located in currently used schema, we don't need to concat schema name to table name.
                                                var schema = dbForeignKey["REFERENCED_SCHEMA_NAME"] === currentSchema ? undefined : dbForeignKey["REFERENCED_SCHEMA_NAME"];
                                                var referencedTableName = _this.driver.buildTableName(dbForeignKey["REFERENCED_TABLE_NAME"], schema);
                                                return new TableForeignKey({
                                                    name: dbForeignKey["CONSTRAINT_NAME"],
                                                    columnNames: foreignKeys.map(function (dbFk) { return dbFk["COLUMN_NAME"]; }),
                                                    referencedTableName: referencedTableName,
                                                    referencedColumnNames: foreignKeys.map(function (dbFk) { return dbFk["REFERENCED_COLUMN_NAME"]; }),
                                                    onDelete: dbForeignKey["DELETE_RULE"] === "RESTRICT" ? "NO ACTION" : dbForeignKey["DELETE_RULE"],
                                                    onUpdate: dbForeignKey["UPDATE_RULE"] === "RESTRICT" ? "NO ACTION" : dbForeignKey["UPDATE_RULE"],
                                                });
                                            });
                                            tableIndexConstraints = OrmUtils.uniq(dbIndices.filter(function (dbIndex) {
                                                return _this.driver.buildTableName(dbIndex["TABLE_NAME"], dbIndex["SCHEMA_NAME"]) === tableFullName;
                                            }), function (dbIndex) { return dbIndex["INDEX_NAME"]; });
                                            table.indices = tableIndexConstraints.map(function (constraint) {
                                                var indices = dbIndices.filter(function (index) {
                                                    return index["SCHEMA_NAME"] === constraint["SCHEMA_NAME"]
                                                        && index["TABLE_NAME"] === constraint["TABLE_NAME"]
                                                        && index["INDEX_NAME"] === constraint["INDEX_NAME"];
                                                });
                                                return new TableIndex({
                                                    table: table,
                                                    name: constraint["INDEX_NAME"],
                                                    columnNames: indices.map(function (i) { return i["COLUMN_NAME"]; }),
                                                    isUnique: constraint["CONSTRAINT"] && constraint["CONSTRAINT"].indexOf("UNIQUE") !== -1,
                                                    isFulltext: constraint["INDEX_TYPE"] === "FULLTEXT"
                                                });
                                            });
                                            return [2 /*return*/, table];
                                    }
                                });
                            }); }))];
                }
            });
        });
    };
    /**
     * Builds and returns SQL for create table.
     */
    SapQueryRunner.prototype.createTableSql = function (table, createForeignKeys) {
        var _this = this;
        var columnDefinitions = table.columns.map(function (column) { return _this.buildCreateColumnSql(column); }).join(", ");
        var sql = "CREATE TABLE " + this.escapePath(table) + " (" + columnDefinitions;
        // we create unique indexes instead of unique constraints, because SAP HANA does not have unique constraints.
        // if we mark column as Unique, it means that we create UNIQUE INDEX.
        table.columns
            .filter(function (column) { return column.isUnique; })
            .forEach(function (column) {
            var isUniqueIndexExist = table.indices.some(function (index) {
                return index.columnNames.length === 1 && !!index.isUnique && index.columnNames.indexOf(column.name) !== -1;
            });
            var isUniqueConstraintExist = table.uniques.some(function (unique) {
                return unique.columnNames.length === 1 && unique.columnNames.indexOf(column.name) !== -1;
            });
            if (!isUniqueIndexExist && !isUniqueConstraintExist)
                table.indices.push(new TableIndex({
                    name: _this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]),
                    columnNames: [column.name],
                    isUnique: true
                }));
        });
        // as SAP HANA does not have unique constraints, we must create table indices from table uniques and mark them as unique.
        if (table.uniques.length > 0) {
            table.uniques.forEach(function (unique) {
                var uniqueExist = table.indices.some(function (index) { return index.name === unique.name; });
                if (!uniqueExist) {
                    table.indices.push(new TableIndex({
                        name: unique.name,
                        columnNames: unique.columnNames,
                        isUnique: true
                    }));
                }
            });
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
                var constraint = "CONSTRAINT \"" + fk.name + "\" FOREIGN KEY (" + columnNames + ") REFERENCES " + _this.escapePath(fk.referencedTableName) + " (" + referencedColumnNames + ")";
                // SAP HANA does not have "NO ACTION" option for FK's
                if (fk.onDelete) {
                    var onDelete = fk.onDelete === "NO ACTION" ? "RESTRICT" : fk.onDelete;
                    constraint += " ON DELETE " + onDelete;
                }
                if (fk.onUpdate) {
                    var onUpdate = fk.onUpdate === "NO ACTION" ? "RESTRICT" : fk.onUpdate;
                    constraint += " ON UPDATE " + onUpdate;
                }
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
        return new Query(sql);
    };
    /**
     * Builds drop table sql.
     */
    SapQueryRunner.prototype.dropTableSql = function (tableOrName, ifExist) {
        var query = ifExist ? "DROP TABLE IF EXISTS " + this.escapePath(tableOrName) : "DROP TABLE " + this.escapePath(tableOrName);
        return new Query(query);
    };
    SapQueryRunner.prototype.createViewSql = function (view) {
        if (typeof view.expression === "string") {
            return new Query("CREATE VIEW " + this.escapePath(view) + " AS " + view.expression);
        }
        else {
            return new Query("CREATE VIEW " + this.escapePath(view) + " AS " + view.expression(this.connection).getQuery());
        }
    };
    SapQueryRunner.prototype.insertViewDefinitionSql = function (view) {
        return __awaiter(this, void 0, void 0, function () {
            var currentSchema, splittedName, schema, name, expression, _a, query, parameters;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getCurrentSchema()];
                    case 1:
                        currentSchema = _b.sent();
                        splittedName = view.name.split(".");
                        schema = this.driver.options.schema || currentSchema;
                        name = view.name;
                        if (splittedName.length === 2) {
                            schema = splittedName[0];
                            name = splittedName[1];
                        }
                        expression = typeof view.expression === "string" ? view.expression.trim() : view.expression(this.connection).getQuery();
                        _a = __read(this.connection.createQueryBuilder()
                            .insert()
                            .into(this.getTypeormMetadataTableName())
                            .values({ type: "VIEW", schema: schema, name: name, value: expression })
                            .getQueryAndParameters(), 2), query = _a[0], parameters = _a[1];
                        return [2 /*return*/, new Query(query, parameters)];
                }
            });
        });
    };
    /**
     * Builds drop view sql.
     */
    SapQueryRunner.prototype.dropViewSql = function (viewOrPath) {
        return new Query("DROP VIEW " + this.escapePath(viewOrPath));
    };
    /**
     * Builds remove view sql.
     */
    SapQueryRunner.prototype.deleteViewDefinitionSql = function (viewOrPath) {
        return __awaiter(this, void 0, void 0, function () {
            var currentSchema, viewName, splittedName, schema, name, qb, _a, query, parameters;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getCurrentSchema()];
                    case 1:
                        currentSchema = _b.sent();
                        viewName = viewOrPath instanceof View ? viewOrPath.name : viewOrPath;
                        splittedName = viewName.split(".");
                        schema = this.driver.options.schema || currentSchema;
                        name = viewName;
                        if (splittedName.length === 2) {
                            schema = splittedName[0];
                            name = splittedName[1];
                        }
                        qb = this.connection.createQueryBuilder();
                        _a = __read(qb.delete()
                            .from(this.getTypeormMetadataTableName())
                            .where(qb.escape("type") + " = 'VIEW'")
                            .andWhere(qb.escape("schema") + " = :schema", { schema: schema })
                            .andWhere(qb.escape("name") + " = :name", { name: name })
                            .getQueryAndParameters(), 2), query = _a[0], parameters = _a[1];
                        return [2 /*return*/, new Query(query, parameters)];
                }
            });
        });
    };
    SapQueryRunner.prototype.addColumnSql = function (table, column) {
        return "ALTER TABLE " + this.escapePath(table) + " ADD (" + this.buildCreateColumnSql(column) + ")";
    };
    SapQueryRunner.prototype.dropColumnSql = function (table, column) {
        return "ALTER TABLE " + this.escapePath(table) + " DROP (\"" + column.name + "\")";
    };
    /**
     * Builds create index sql.
     */
    SapQueryRunner.prototype.createIndexSql = function (table, index) {
        var columns = index.columnNames.map(function (columnName) { return "\"" + columnName + "\""; }).join(", ");
        var indexType = "";
        if (index.isUnique) {
            indexType += "UNIQUE ";
        }
        if (index.isFulltext) {
            indexType += "FULLTEXT ";
        }
        return new Query("CREATE " + indexType + "INDEX \"" + index.name + "\" ON " + this.escapePath(table) + " (" + columns + ") " + (index.where ? "WHERE " + index.where : ""));
    };
    /**
     * Builds drop index sql.
     */
    SapQueryRunner.prototype.dropIndexSql = function (table, indexOrName) {
        var indexName = indexOrName instanceof TableIndex ? indexOrName.name : indexOrName;
        var parsedTableName = this.parseTableName(table);
        if (parsedTableName.schema === "current_schema") {
            return new Query("DROP INDEX \"" + indexName + "\"");
        }
        else {
            return new Query("DROP INDEX \"" + parsedTableName.schema.replace(/'/g, "") + "\".\"" + indexName + "\"");
        }
    };
    /**
     * Builds create primary key sql.
     */
    SapQueryRunner.prototype.createPrimaryKeySql = function (table, columnNames) {
        var primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, columnNames);
        var columnNamesString = columnNames.map(function (columnName) { return "\"" + columnName + "\""; }).join(", ");
        return new Query("ALTER TABLE " + this.escapePath(table) + " ADD CONSTRAINT \"" + primaryKeyName + "\" PRIMARY KEY (" + columnNamesString + ")");
    };
    /**
     * Builds drop primary key sql.
     */
    SapQueryRunner.prototype.dropPrimaryKeySql = function (table) {
        var columnNames = table.primaryColumns.map(function (column) { return column.name; });
        var primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, columnNames);
        return new Query("ALTER TABLE " + this.escapePath(table) + " DROP CONSTRAINT \"" + primaryKeyName + "\"");
    };
    /**
     * Builds create check constraint sql.
     */
    SapQueryRunner.prototype.createCheckConstraintSql = function (table, checkConstraint) {
        return new Query("ALTER TABLE " + this.escapePath(table) + " ADD CONSTRAINT \"" + checkConstraint.name + "\" CHECK (" + checkConstraint.expression + ")");
    };
    /**
     * Builds drop check constraint sql.
     */
    SapQueryRunner.prototype.dropCheckConstraintSql = function (table, checkOrName) {
        var checkName = checkOrName instanceof TableCheck ? checkOrName.name : checkOrName;
        return new Query("ALTER TABLE " + this.escapePath(table) + " DROP CONSTRAINT \"" + checkName + "\"");
    };
    /**
     * Builds create foreign key sql.
     */
    SapQueryRunner.prototype.createForeignKeySql = function (tableOrName, foreignKey) {
        var columnNames = foreignKey.columnNames.map(function (column) { return "\"" + column + "\""; }).join(", ");
        var referencedColumnNames = foreignKey.referencedColumnNames.map(function (column) { return "\"" + column + "\""; }).join(",");
        var sql = "ALTER TABLE " + this.escapePath(tableOrName) + " ADD CONSTRAINT \"" + foreignKey.name + "\" FOREIGN KEY (" + columnNames + ") " +
            ("REFERENCES " + this.escapePath(foreignKey.referencedTableName) + "(" + referencedColumnNames + ")");
        // SAP HANA does not have "NO ACTION" option for FK's
        if (foreignKey.onDelete) {
            var onDelete = foreignKey.onDelete === "NO ACTION" ? "RESTRICT" : foreignKey.onDelete;
            sql += " ON DELETE " + onDelete;
        }
        if (foreignKey.onUpdate) {
            var onUpdate = foreignKey.onUpdate === "NO ACTION" ? "RESTRICT" : foreignKey.onUpdate;
            sql += " ON UPDATE " + onUpdate;
        }
        return new Query(sql);
    };
    /**
     * Builds drop foreign key sql.
     */
    SapQueryRunner.prototype.dropForeignKeySql = function (tableOrName, foreignKeyOrName) {
        var foreignKeyName = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName.name : foreignKeyOrName;
        return new Query("ALTER TABLE " + this.escapePath(tableOrName) + " DROP CONSTRAINT \"" + foreignKeyName + "\"");
    };
    /**
     * Escapes given table or view path.
     */
    SapQueryRunner.prototype.escapePath = function (target, disableEscape) {
        var tableName = target instanceof Table || target instanceof View ? target.name : target;
        tableName = tableName.indexOf(".") === -1 && this.driver.options.schema ? this.driver.options.schema + "." + tableName : tableName;
        return tableName.split(".").map(function (i) {
            return disableEscape ? i : "\"" + i + "\"";
        }).join(".");
    };
    /**
     * Returns object with table schema and table name.
     */
    SapQueryRunner.prototype.parseTableName = function (target) {
        var tableName = target instanceof Table ? target.name : target;
        if (tableName.indexOf(".") === -1) {
            return {
                schema: this.driver.options.schema ? "'" + this.driver.options.schema + "'" : "current_schema",
                tableName: "'" + tableName + "'"
            };
        }
        else {
            return {
                schema: "'" + tableName.split(".")[0] + "'",
                tableName: "'" + tableName.split(".")[1] + "'"
            };
        }
    };
    /**
     * Concat database name and schema name to the foreign key name.
     * Needs because FK name is relevant to the schema and database.
     */
    SapQueryRunner.prototype.buildForeignKeyName = function (fkName, schemaName, dbName) {
        var joinedFkName = fkName;
        if (schemaName)
            joinedFkName = schemaName + "." + joinedFkName;
        if (dbName)
            joinedFkName = dbName + "." + joinedFkName;
        return joinedFkName;
    };
    /**
     * Removes parenthesis around default value.
     * Sql server returns default value with parenthesis around, e.g.
     *  ('My text') - for string
     *  ((1)) - for number
     *  (newsequentialId()) - for function
     */
    SapQueryRunner.prototype.removeParenthesisFromDefault = function (defaultValue) {
        if (defaultValue.substr(0, 1) !== "(")
            return defaultValue;
        var normalizedDefault = defaultValue.substr(1, defaultValue.lastIndexOf(")") - 1);
        return this.removeParenthesisFromDefault(normalizedDefault);
    };
    /**
     * Builds a query for create column.
     */
    SapQueryRunner.prototype.buildCreateColumnSql = function (column) {
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
            c += " GENERATED ALWAYS AS IDENTITY";
        return c;
    };
    return SapQueryRunner;
}(BaseQueryRunner));
export { SapQueryRunner };

//# sourceMappingURL=SapQueryRunner.js.map
