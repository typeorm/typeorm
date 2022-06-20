"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactNativeQueryRunner = void 0;
const QueryRunnerAlreadyReleasedError_1 = require("../../error/QueryRunnerAlreadyReleasedError");
const QueryFailedError_1 = require("../../error/QueryFailedError");
const AbstractSqliteQueryRunner_1 = require("../sqlite-abstract/AbstractSqliteQueryRunner");
const Broadcaster_1 = require("../../subscriber/Broadcaster");
const QueryResult_1 = require("../../query-runner/QueryResult");
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
     * Called before migrations are run.
     */
    async beforeMigration() {
        await this.query(`PRAGMA foreign_keys = OFF`);
    }
    /**
     * Called after migrations are run.
     */
    async afterMigration() {
        await this.query(`PRAGMA foreign_keys = ON`);
    }
    /**
     * Executes a given SQL query.
     */
    query(query, parameters, useStructuredResult = false) {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError_1.QueryRunnerAlreadyReleasedError();
        return new Promise(async (ok, fail) => {
            const databaseConnection = await this.connect();
            this.driver.connection.logger.logQuery(query, parameters, this);
            const queryStartTime = +new Date();
            databaseConnection.executeSql(query, parameters, (raw) => {
                // log slow queries if maxQueryExecution time is set
                const maxQueryExecutionTime = this.driver.options.maxQueryExecutionTime;
                const queryEndTime = +new Date();
                const queryExecutionTime = queryEndTime - queryStartTime;
                if (maxQueryExecutionTime &&
                    queryExecutionTime > maxQueryExecutionTime)
                    this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);
                const result = new QueryResult_1.QueryResult();
                // return id of inserted row, if query was insert statement.
                if (query.substr(0, 11) === "INSERT INTO") {
                    result.raw = raw.insertId;
                }
                if (raw === null || raw === void 0 ? void 0 : raw.hasOwnProperty("rowsAffected")) {
                    result.affected = raw.rowsAffected;
                }
                if (raw === null || raw === void 0 ? void 0 : raw.hasOwnProperty("rows")) {
                    let records = [];
                    for (let i = 0; i < raw.rows.length; i++) {
                        records.push(raw.rows.item(i));
                    }
                    result.raw = records;
                    result.records = records;
                }
                if (useStructuredResult) {
                    ok(result);
                }
                else {
                    ok(result.raw);
                }
            }, (err) => {
                this.driver.connection.logger.logQueryError(err, query, parameters, this);
                fail(new QueryFailedError_1.QueryFailedError(query, parameters, err));
            });
        });
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
