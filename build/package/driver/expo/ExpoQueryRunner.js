"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpoQueryRunner = void 0;
const QueryRunnerAlreadyReleasedError_1 = require("../../error/QueryRunnerAlreadyReleasedError");
const QueryFailedError_1 = require("../../error/QueryFailedError");
const AbstractSqliteQueryRunner_1 = require("../sqlite-abstract/AbstractSqliteQueryRunner");
const TransactionNotStartedError_1 = require("../../error/TransactionNotStartedError");
const Broadcaster_1 = require("../../subscriber/Broadcaster");
const QueryResult_1 = require("../../query-runner/QueryResult");
/**
 * Runs queries on a single sqlite database connection.
 */
class ExpoQueryRunner extends AbstractSqliteQueryRunner_1.AbstractSqliteQueryRunner {
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
    async startTransaction() {
        this.isTransactionActive = true;
        try {
            await this.broadcaster.broadcast("BeforeTransactionStart");
        }
        catch (err) {
            this.isTransactionActive = false;
            throw err;
        }
        if (this.transactionDepth > 0) {
            await this.query(`SAVEPOINT typeorm_${this.transactionDepth}`);
        }
        this.transactionDepth += 1;
        await this.broadcaster.broadcast("AfterTransactionStart");
    }
    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     * Since Expo will automatically commit the transaction once all the
     * callbacks of the transaction object have been completed, "committing" a
     * transaction in this driver's context means that we delete the transaction
     * object and set the stage for the next transaction.
     */
    async commitTransaction() {
        if (!this.isTransactionActive &&
            typeof this.transaction === "undefined")
            throw new TransactionNotStartedError_1.TransactionNotStartedError();
        await this.broadcaster.broadcast("BeforeTransactionCommit");
        if (this.transactionDepth > 1) {
            await this.query(`RELEASE SAVEPOINT typeorm_${this.transactionDepth - 1}`);
        }
        else {
            this.transaction = undefined;
            this.isTransactionActive = false;
        }
        this.transactionDepth -= 1;
        await this.broadcaster.broadcast("AfterTransactionCommit");
    }
    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     * This method's functionality is identical to `commitTransaction()` because
     * the transaction lifecycle is handled within the Expo transaction object.
     * Issuing separate statements for `COMMIT` or `ROLLBACK` aren't necessary.
     */
    async rollbackTransaction() {
        if (!this.isTransactionActive &&
            typeof this.transaction === "undefined")
            throw new TransactionNotStartedError_1.TransactionNotStartedError();
        await this.broadcaster.broadcast("BeforeTransactionRollback");
        if (this.transactionDepth > 1) {
            await this.query(`ROLLBACK TO SAVEPOINT typeorm_${this.transactionDepth - 1}`);
        }
        else {
            this.transaction = undefined;
            this.isTransactionActive = false;
        }
        this.transactionDepth -= 1;
        await this.broadcaster.broadcast("AfterTransactionRollback");
    }
    /**
     * Called before migrations are run.
     */
    async beforeMigration() {
        const databaseConnection = await this.connect();
        return new Promise((ok, fail) => {
            databaseConnection.exec([{ sql: "PRAGMA foreign_keys = OFF", args: [] }], false, (err) => (err ? fail(err) : ok()));
        });
    }
    /**
     * Called after migrations are run.
     */
    async afterMigration() {
        const databaseConnection = await this.connect();
        return new Promise((ok, fail) => {
            databaseConnection.exec([{ sql: "PRAGMA foreign_keys = ON", args: [] }], false, (err) => (err ? fail(err) : ok()));
        });
    }
    /**
     * Executes a given SQL query.
     */
    async query(query, parameters, useStructuredResult = false) {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError_1.QueryRunnerAlreadyReleasedError();
        return new Promise(async (ok, fail) => {
            const databaseConnection = await this.connect();
            this.driver.connection.logger.logQuery(query, parameters, this);
            const queryStartTime = +new Date();
            // All Expo SQL queries are executed in a transaction context
            databaseConnection.transaction(async (transaction) => {
                if (typeof this.transaction === "undefined") {
                    await this.startTransaction();
                    this.transaction = transaction;
                }
                this.transaction.executeSql(query, parameters, (t, raw) => {
                    // log slow queries if maxQueryExecution time is set
                    const maxQueryExecutionTime = this.driver.options.maxQueryExecutionTime;
                    const queryEndTime = +new Date();
                    const queryExecutionTime = queryEndTime - queryStartTime;
                    if (maxQueryExecutionTime &&
                        queryExecutionTime > maxQueryExecutionTime) {
                        this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);
                    }
                    const result = new QueryResult_1.QueryResult();
                    // return id of inserted row, if query was insert statement.
                    if (query.substr(0, 11) === "INSERT INTO") {
                        result.raw = raw.insertId;
                    }
                    if (raw === null || raw === void 0 ? void 0 : raw.hasOwnProperty("rowsAffected")) {
                        result.affected = raw.rowsAffected;
                    }
                    if (raw === null || raw === void 0 ? void 0 : raw.hasOwnProperty("rows")) {
                        let resultSet = [];
                        for (let i = 0; i < raw.rows.length; i++) {
                            resultSet.push(raw.rows.item(i));
                        }
                        result.raw = resultSet;
                        result.records = resultSet;
                    }
                    if (useStructuredResult) {
                        ok(result);
                    }
                    else {
                        ok(result.raw);
                    }
                }, (t, err) => {
                    this.driver.connection.logger.logQueryError(err, query, parameters, this);
                    fail(new QueryFailedError_1.QueryFailedError(query, parameters, err));
                });
            }, async (err) => {
                await this.rollbackTransaction();
                fail(err);
            }, () => {
                this.isTransactionActive = false;
                this.transaction = undefined;
            });
        });
    }
}
exports.ExpoQueryRunner = ExpoQueryRunner;

//# sourceMappingURL=ExpoQueryRunner.js.map
