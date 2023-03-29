"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativescriptQueryRunner = void 0;
var tslib_1 = require("tslib");
var QueryRunnerAlreadyReleasedError_1 = require("../../error/QueryRunnerAlreadyReleasedError");
var QueryFailedError_1 = require("../../error/QueryFailedError");
var AbstractSqliteQueryRunner_1 = require("../sqlite-abstract/AbstractSqliteQueryRunner");
var Broadcaster_1 = require("../../subscriber/Broadcaster");
/**
 * Runs queries on a single sqlite database connection.
 */
var NativescriptQueryRunner = /** @class */ (function (_super) {
    tslib_1.__extends(NativescriptQueryRunner, _super);
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function NativescriptQueryRunner(driver) {
        var _this = _super.call(this) || this;
        _this.driver = driver;
        _this.connection = driver.connection;
        _this.broadcaster = new Broadcaster_1.Broadcaster(_this);
        return _this;
    }
    /**
     * Executes a given SQL query.
     */
    NativescriptQueryRunner.prototype.query = function (query, parameters) {
        var _this = this;
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError_1.QueryRunnerAlreadyReleasedError();
        var connection = this.driver.connection;
        return new Promise(function (ok, fail) {
            var isInsertQuery = query.substr(0, 11) === "INSERT INTO";
            var handler = function (err, result) {
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
                    // when isInsertQuery == true, result is the id
                    ok(result);
                }
            };
            _this.driver.connection.logger.logQuery(query, parameters, _this);
            var queryStartTime = +new Date();
            _this.connect().then(function (databaseConnection) {
                if (isInsertQuery) {
                    databaseConnection.execSQL(query, parameters, handler);
                }
                else {
                    databaseConnection.all(query, parameters, handler);
                }
            });
        });
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    NativescriptQueryRunner.prototype.parametrize = function (objectLiteral, startIndex) {
        if (startIndex === void 0) { startIndex = 0; }
        return Object.keys(objectLiteral).map(function (key, index) { return "\"" + key + "\"" + "=?"; });
    };
    return NativescriptQueryRunner;
}(AbstractSqliteQueryRunner_1.AbstractSqliteQueryRunner));
exports.NativescriptQueryRunner = NativescriptQueryRunner;

//# sourceMappingURL=NativescriptQueryRunner.js.map
