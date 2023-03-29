"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactNativeQueryRunner = void 0;
var tslib_1 = require("tslib");
var QueryRunnerAlreadyReleasedError_1 = require("../../error/QueryRunnerAlreadyReleasedError");
var QueryFailedError_1 = require("../../error/QueryFailedError");
var AbstractSqliteQueryRunner_1 = require("../sqlite-abstract/AbstractSqliteQueryRunner");
var Broadcaster_1 = require("../../subscriber/Broadcaster");
/**
 * Runs queries on a single sqlite database connection.
 */
var ReactNativeQueryRunner = /** @class */ (function (_super) {
    tslib_1.__extends(ReactNativeQueryRunner, _super);
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function ReactNativeQueryRunner(driver) {
        var _this = _super.call(this) || this;
        _this.driver = driver;
        _this.connection = driver.connection;
        _this.broadcaster = new Broadcaster_1.Broadcaster(_this);
        return _this;
    }
    /**
     * Executes a given SQL query.
     */
    ReactNativeQueryRunner.prototype.query = function (query, parameters) {
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
                        databaseConnection.executeSql(query, parameters, function (result) {
                            // log slow queries if maxQueryExecution time is set
                            var maxQueryExecutionTime = _this.driver.connection.options.maxQueryExecutionTime;
                            var queryEndTime = +new Date();
                            var queryExecutionTime = queryEndTime - queryStartTime;
                            if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                                _this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, _this);
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
                        }, function (err) {
                            _this.driver.connection.logger.logQueryError(err, query, parameters, _this);
                            fail(new QueryFailedError_1.QueryFailedError(query, parameters, err));
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    ReactNativeQueryRunner.prototype.parametrize = function (objectLiteral, startIndex) {
        if (startIndex === void 0) { startIndex = 0; }
        return Object.keys(objectLiteral).map(function (key, index) { return "\"" + key + "\"" + "=?"; });
    };
    return ReactNativeQueryRunner;
}(AbstractSqliteQueryRunner_1.AbstractSqliteQueryRunner));
exports.ReactNativeQueryRunner = ReactNativeQueryRunner;

//# sourceMappingURL=ReactNativeQueryRunner.js.map
