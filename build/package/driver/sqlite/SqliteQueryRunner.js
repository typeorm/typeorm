"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteQueryRunner = void 0;
var tslib_1 = require("tslib");
var QueryRunnerAlreadyReleasedError_1 = require("../../error/QueryRunnerAlreadyReleasedError");
var QueryFailedError_1 = require("../../error/QueryFailedError");
var AbstractSqliteQueryRunner_1 = require("../sqlite-abstract/AbstractSqliteQueryRunner");
var Broadcaster_1 = require("../../subscriber/Broadcaster");
var ConnectionIsNotSetError_1 = require("../../error/ConnectionIsNotSetError");
/**
 * Runs queries on a single sqlite database connection.
 *
 * Does not support compose primary keys with autoincrement field.
 * todo: need to throw exception for this case.
 */
var SqliteQueryRunner = /** @class */ (function (_super) {
    tslib_1.__extends(SqliteQueryRunner, _super);
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function SqliteQueryRunner(driver) {
        var _this = _super.call(this) || this;
        _this.driver = driver;
        _this.connection = driver.connection;
        _this.broadcaster = new Broadcaster_1.Broadcaster(_this);
        return _this;
    }
    /**
     * Executes a given SQL query.
     */
    SqliteQueryRunner.prototype.query = function (query, parameters) {
        var _this = this;
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError_1.QueryRunnerAlreadyReleasedError();
        var connection = this.driver.connection;
        var options = connection.options;
        if (!connection.isConnected) {
            throw new ConnectionIsNotSetError_1.ConnectionIsNotSetError('sqlite');
        }
        return new Promise(function (ok, fail) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var databaseConnection, queryStartTime, isInsertQuery, execute, handler;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connect()];
                    case 1:
                        databaseConnection = _a.sent();
                        this.driver.connection.logger.logQuery(query, parameters, this);
                        queryStartTime = +new Date();
                        isInsertQuery = query.substr(0, 11) === "INSERT INTO";
                        execute = function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            return tslib_1.__generator(this, function (_a) {
                                if (isInsertQuery) {
                                    databaseConnection.run(query, parameters, handler);
                                }
                                else {
                                    databaseConnection.all(query, parameters, handler);
                                }
                                return [2 /*return*/];
                            });
                        }); };
                        handler = function (err, result) {
                            if (err && err.toString().indexOf("SQLITE_BUSY:") !== -1) {
                                if (typeof options.busyErrorRetry === "number" && options.busyErrorRetry > 0) {
                                    setTimeout(execute, options.busyErrorRetry);
                                    return;
                                }
                            }
                            // log slow queries if maxQueryExecution time is set
                            var maxQueryExecutionTime = connection.options.maxQueryExecutionTime;
                            var queryEndTime = +new Date();
                            var queryExecutionTime = queryEndTime - queryStartTime;
                            if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                                connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);
                            if (err) {
                                connection.logger.logQueryError(err, query, parameters, this);
                                fail(new QueryFailedError_1.QueryFailedError(query, parameters, err));
                            }
                            else {
                                ok(isInsertQuery ? this["lastID"] : result);
                            }
                        };
                        return [4 /*yield*/, execute()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    };
    return SqliteQueryRunner;
}(AbstractSqliteQueryRunner_1.AbstractSqliteQueryRunner));
exports.SqliteQueryRunner = SqliteQueryRunner;

//# sourceMappingURL=SqliteQueryRunner.js.map
