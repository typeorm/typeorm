"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactNativeQueryRunner = void 0;
const tslib_1 = require("tslib");
const QueryRunnerAlreadyReleasedError_1 = require("../../error/QueryRunnerAlreadyReleasedError");
const QueryFailedError_1 = require("../../error/QueryFailedError");
const AbstractSqliteQueryRunner_1 = require("../sqlite-abstract/AbstractSqliteQueryRunner");
const Broadcaster_1 = require("../../subscriber/Broadcaster");
/**
 * Runs queries on a single sqlite database connection.
 */
class ReactNativeQueryRunner extends AbstractSqliteQueryRunner_1.AbstractSqliteQueryRunner {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(driver) {
        super();
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster_1.Broadcaster(this);
    }
    /**
     * Executes a given SQL query.
     */
    query(query, parameters) {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError_1.QueryRunnerAlreadyReleasedError();
        return new Promise((ok, fail) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            const databaseConnection = yield this.connect();
            this.driver.connection.logger.logQuery(query, parameters, this);
            const queryStartTime = +new Date();
            databaseConnection.executeSql(query, parameters, (result) => {
                // log slow queries if maxQueryExecution time is set
                const maxQueryExecutionTime = this.driver.connection.options.maxQueryExecutionTime;
                const queryEndTime = +new Date();
                const queryExecutionTime = queryEndTime - queryStartTime;
                if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                    this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);
                // return id of inserted row, if query was insert statement.
                if (query.substr(0, 11) === "INSERT INTO") {
                    ok(result.insertId);
                }
                else {
                    let resultSet = [];
                    for (let i = 0; i < result.rows.length; i++) {
                        resultSet.push(result.rows.item(i));
                    }
                    ok(resultSet);
                }
            }, (err) => {
                this.driver.connection.logger.logQueryError(err, query, parameters, this);
                fail(new QueryFailedError_1.QueryFailedError(query, parameters, err));
            });
        }));
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    parametrize(objectLiteral, startIndex = 0) {
        return Object.keys(objectLiteral).map((key, index) => `"${key}"` + "=?");
    }
}
exports.ReactNativeQueryRunner = ReactNativeQueryRunner;

//# sourceMappingURL=ReactNativeQueryRunner.js.map
