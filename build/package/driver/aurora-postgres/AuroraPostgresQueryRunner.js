"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuroraPostgresQueryRunner = void 0;
const QueryRunnerAlreadyReleasedError_1 = require("../../error/QueryRunnerAlreadyReleasedError");
const TransactionNotStartedError_1 = require("../../error/TransactionNotStartedError");
const PostgresQueryRunner_1 = require("../postgres/PostgresQueryRunner");
const QueryResult_1 = require("../../query-runner/QueryResult");
class PostgresQueryRunnerWrapper extends PostgresQueryRunner_1.PostgresQueryRunner {
    constructor(driver, mode) {
        super(driver, mode);
    }
}
/**
 * Runs queries on a single postgres database connection.
 */
class AuroraPostgresQueryRunner extends PostgresQueryRunnerWrapper {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(driver, client, mode) {
        super(driver, mode);
        this.client = client;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates/uses database connection from the connection pool to perform further operations.
     * Returns obtained database connection.
     */
    connect() {
        if (this.databaseConnection)
            return Promise.resolve(this.databaseConnection);
        if (this.databaseConnectionPromise)
            return this.databaseConnectionPromise;
        if (this.mode === "slave" && this.driver.isReplicated) {
            this.databaseConnectionPromise = this.driver
                .obtainSlaveConnection()
                .then(([connection, release]) => {
                this.driver.connectedQueryRunners.push(this);
                this.databaseConnection = connection;
                this.releaseCallback = release;
                return this.databaseConnection;
            });
        }
        else {
            // master
            this.databaseConnectionPromise = this.driver
                .obtainMasterConnection()
                .then(([connection, release]) => {
                this.driver.connectedQueryRunners.push(this);
                this.databaseConnection = connection;
                this.releaseCallback = release;
                return this.databaseConnection;
            });
        }
        return this.databaseConnectionPromise;
    }
    /**
     * Starts transaction on the current connection.
     */
    async startTransaction(isolationLevel) {
        this.isTransactionActive = true;
        try {
            await this.broadcaster.broadcast("BeforeTransactionStart");
        }
        catch (err) {
            this.isTransactionActive = false;
            throw err;
        }
        if (this.transactionDepth === 0) {
            await this.client.startTransaction();
        }
        else {
            await this.query(`SAVEPOINT typeorm_${this.transactionDepth}`);
        }
        this.transactionDepth += 1;
        await this.broadcaster.broadcast("AfterTransactionStart");
    }
    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    async commitTransaction() {
        if (!this.isTransactionActive)
            throw new TransactionNotStartedError_1.TransactionNotStartedError();
        await this.broadcaster.broadcast("BeforeTransactionCommit");
        if (this.transactionDepth > 1) {
            await this.query(`RELEASE SAVEPOINT typeorm_${this.transactionDepth - 1}`);
        }
        else {
            await this.client.commitTransaction();
            this.isTransactionActive = false;
        }
        this.transactionDepth -= 1;
        await this.broadcaster.broadcast("AfterTransactionCommit");
    }
    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    async rollbackTransaction() {
        if (!this.isTransactionActive)
            throw new TransactionNotStartedError_1.TransactionNotStartedError();
        await this.broadcaster.broadcast("BeforeTransactionRollback");
        if (this.transactionDepth > 1) {
            await this.query(`ROLLBACK TO SAVEPOINT typeorm_${this.transactionDepth - 1}`);
        }
        else {
            await this.client.rollbackTransaction();
            this.isTransactionActive = false;
        }
        this.transactionDepth -= 1;
        await this.broadcaster.broadcast("AfterTransactionRollback");
    }
    /**
     * Executes a given SQL query.
     */
    async query(query, parameters, useStructuredResult = false) {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError_1.QueryRunnerAlreadyReleasedError();
        const raw = await this.client.query(query, parameters);
        const result = new QueryResult_1.QueryResult();
        result.raw = raw;
        if ((raw === null || raw === void 0 ? void 0 : raw.hasOwnProperty("records")) && Array.isArray(raw.records)) {
            result.records = raw.records;
        }
        if (raw === null || raw === void 0 ? void 0 : raw.hasOwnProperty("numberOfRecordsUpdated")) {
            result.affected = raw.numberOfRecordsUpdated;
        }
        if (!useStructuredResult) {
            return result.raw;
        }
        return result;
    }
}
exports.AuroraPostgresQueryRunner = AuroraPostgresQueryRunner;

//# sourceMappingURL=AuroraPostgresQueryRunner.js.map
