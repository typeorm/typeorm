"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpoQueryRunner = void 0;
var tslib_1 = require("tslib");
var QueryRunnerAlreadyReleasedError_1 = require("../../error/QueryRunnerAlreadyReleasedError");
var QueryFailedError_1 = require("../../error/QueryFailedError");
var AbstractSqliteQueryRunner_1 = require("../sqlite-abstract/AbstractSqliteQueryRunner");
var TransactionAlreadyStartedError_1 = require("../../error/TransactionAlreadyStartedError");
var TransactionNotStartedError_1 = require("../../error/TransactionNotStartedError");
var Broadcaster_1 = require("../../subscriber/Broadcaster");
var BroadcasterResult_1 = require("../../subscriber/BroadcasterResult");
/**
 * Runs queries on a single sqlite database connection.
 */
var ExpoQueryRunner = /** @class */ (function (_super) {
    tslib_1.__extends(ExpoQueryRunner, _super);
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function ExpoQueryRunner(driver) {
        var _this = _super.call(this) || this;
        _this.driver = driver;
        _this.connection = driver.connection;
        _this.broadcaster = new Broadcaster_1.Broadcaster(_this);
        return _this;
    }
    /**
     * Starts transaction. Within Expo, all database operations happen in a
     * transaction context, so issuing a `BEGIN TRANSACTION` command is
     * redundant and will result in the following error:
     *
     * `Error: Error code 1: cannot start a transaction within a transaction`
     *
     * Instead, we keep track of a `Transaction` object in `this.transaction`
     * and continue using the same object until we wish to commit the
     * transaction.
     */
    ExpoQueryRunner.prototype.startTransaction = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var beforeBroadcastResult, afterBroadcastResult;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isTransactionActive && typeof this.transaction !== "undefined")
                            throw new TransactionAlreadyStartedError_1.TransactionAlreadyStartedError();
                        beforeBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
                        this.broadcaster.broadcastBeforeTransactionStartEvent(beforeBroadcastResult);
                        if (!(beforeBroadcastResult.promises.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.all(beforeBroadcastResult.promises)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        this.isTransactionActive = true;
                        afterBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
                        this.broadcaster.broadcastAfterTransactionStartEvent(afterBroadcastResult);
                        if (!(afterBroadcastResult.promises.length > 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, Promise.all(afterBroadcastResult.promises)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     * Since Expo will automatically commit the transaction once all the
     * callbacks of the transaction object have been completed, "committing" a
     * transaction in this driver's context means that we delete the transaction
     * object and set the stage for the next transaction.
     */
    ExpoQueryRunner.prototype.commitTransaction = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var beforeBroadcastResult, afterBroadcastResult;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isTransactionActive && typeof this.transaction === "undefined")
                            throw new TransactionNotStartedError_1.TransactionNotStartedError();
                        beforeBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
                        this.broadcaster.broadcastBeforeTransactionCommitEvent(beforeBroadcastResult);
                        if (!(beforeBroadcastResult.promises.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.all(beforeBroadcastResult.promises)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        this.isTransactionActive = false;
                        this.transaction = undefined;
                        afterBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
                        this.broadcaster.broadcastAfterTransactionCommitEvent(afterBroadcastResult);
                        if (!(afterBroadcastResult.promises.length > 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, Promise.all(afterBroadcastResult.promises)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     * This method's functionality is identical to `commitTransaction()` because
     * the transaction lifecycle is handled within the Expo transaction object.
     * Issuing separate statements for `COMMIT` or `ROLLBACK` aren't necessary.
     */
    ExpoQueryRunner.prototype.rollbackTransaction = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var beforeBroadcastResult, afterBroadcastResult;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isTransactionActive && typeof this.transaction === "undefined")
                            throw new TransactionNotStartedError_1.TransactionNotStartedError();
                        beforeBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
                        this.broadcaster.broadcastBeforeTransactionRollbackEvent(beforeBroadcastResult);
                        if (!(beforeBroadcastResult.promises.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.all(beforeBroadcastResult.promises)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        this.isTransactionActive = false;
                        this.transaction = undefined;
                        afterBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
                        this.broadcaster.broadcastAfterTransactionRollbackEvent(afterBroadcastResult);
                        if (!(afterBroadcastResult.promises.length > 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, Promise.all(afterBroadcastResult.promises)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Executes a given SQL query.
     */
    ExpoQueryRunner.prototype.query = function (query, parameters) {
        var _this = this;
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError_1.QueryRunnerAlreadyReleasedError();
        return new Promise(function (ok, fail) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var databaseConnection, queryStartTime;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connect()];
                    case 1:
                        databaseConnection = _a.sent();
                        this.driver.connection.logger.logQuery(query, parameters, this);
                        queryStartTime = +new Date();
                        // All Expo SQL queries are executed in a transaction context
                        databaseConnection.transaction(function (transaction) {
                            if (typeof _this.transaction === "undefined") {
                                _this.startTransaction();
                                _this.transaction = transaction;
                            }
                            _this.transaction.executeSql(query, parameters, function (t, result) {
                                // log slow queries if maxQueryExecution time is set
                                var maxQueryExecutionTime = _this.driver.connection.options.maxQueryExecutionTime;
                                var queryEndTime = +new Date();
                                var queryExecutionTime = queryEndTime - queryStartTime;
                                if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime) {
                                    _this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, _this);
                                }
                                // return id of inserted row, if query was insert statement.
                                if (query.substr(0, 11) === "INSERT INTO") {
                                    ok(result.insertId);
                                }
                                else {
                                    var resultSet = [];
                                    for (var i = 0; i < result.rows.length; i++) {
                                        resultSet.push(result.rows.item(i));
                                    }
                                    ok(resultSet);
                                }
                            }, function (t, err) {
                                _this.driver.connection.logger.logQueryError(err, query, parameters, _this);
                                fail(new QueryFailedError_1.QueryFailedError(query, parameters, err));
                            });
                        }, function (err) {
                            _this.rollbackTransaction();
                        }, function () {
                            _this.isTransactionActive = false;
                            _this.transaction = undefined;
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    };
    return ExpoQueryRunner;
}(AbstractSqliteQueryRunner_1.AbstractSqliteQueryRunner));
exports.ExpoQueryRunner = ExpoQueryRunner;

//# sourceMappingURL=ExpoQueryRunner.js.map
