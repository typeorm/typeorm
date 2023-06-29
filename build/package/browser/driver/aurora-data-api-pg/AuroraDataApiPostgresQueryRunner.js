import { __awaiter } from "tslib";
import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError";
import { TransactionAlreadyStartedError } from "../../error/TransactionAlreadyStartedError";
import { TransactionNotStartedError } from "../../error/TransactionNotStartedError";
import { PostgresQueryRunner } from "../postgres/PostgresQueryRunner";
import { BroadcasterResult } from "../../subscriber/BroadcasterResult";
class PostgresQueryRunnerWrapper extends PostgresQueryRunner {
    constructor(driver, mode) {
        super(driver, mode);
    }
}
/**
 * Runs queries on a single postgres database connection.
 */
export class AuroraDataApiPostgresQueryRunner extends PostgresQueryRunnerWrapper {
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
            this.databaseConnectionPromise = this.driver.obtainSlaveConnection().then(([connection, release]) => {
                this.driver.connectedQueryRunners.push(this);
                this.databaseConnection = connection;
                this.releaseCallback = release;
                return this.databaseConnection;
            });
        }
        else { // master
            this.databaseConnectionPromise = this.driver.obtainMasterConnection().then(([connection, release]) => {
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
    startTransaction(isolationLevel) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isTransactionActive)
                throw new TransactionAlreadyStartedError();
            const beforeBroadcastResult = new BroadcasterResult();
            this.broadcaster.broadcastBeforeTransactionStartEvent(beforeBroadcastResult);
            if (beforeBroadcastResult.promises.length > 0)
                yield Promise.all(beforeBroadcastResult.promises);
            this.isTransactionActive = true;
            yield this.client.startTransaction();
            const afterBroadcastResult = new BroadcasterResult();
            this.broadcaster.broadcastAfterTransactionStartEvent(afterBroadcastResult);
            if (afterBroadcastResult.promises.length > 0)
                yield Promise.all(afterBroadcastResult.promises);
        });
    }
    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    commitTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isTransactionActive)
                throw new TransactionNotStartedError();
            const beforeBroadcastResult = new BroadcasterResult();
            this.broadcaster.broadcastBeforeTransactionCommitEvent(beforeBroadcastResult);
            if (beforeBroadcastResult.promises.length > 0)
                yield Promise.all(beforeBroadcastResult.promises);
            yield this.client.commitTransaction();
            this.isTransactionActive = false;
            const afterBroadcastResult = new BroadcasterResult();
            this.broadcaster.broadcastAfterTransactionCommitEvent(afterBroadcastResult);
            if (afterBroadcastResult.promises.length > 0)
                yield Promise.all(afterBroadcastResult.promises);
        });
    }
    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    rollbackTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isTransactionActive)
                throw new TransactionNotStartedError();
            const beforeBroadcastResult = new BroadcasterResult();
            this.broadcaster.broadcastBeforeTransactionRollbackEvent(beforeBroadcastResult);
            if (beforeBroadcastResult.promises.length > 0)
                yield Promise.all(beforeBroadcastResult.promises);
            yield this.client.rollbackTransaction();
            const afterBroadcastResult = new BroadcasterResult();
            this.broadcaster.broadcastAfterTransactionRollbackEvent(afterBroadcastResult);
            if (afterBroadcastResult.promises.length > 0)
                yield Promise.all(afterBroadcastResult.promises);
        });
    }
    /**
     * Executes a given SQL query.
     */
    query(query, parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isReleased)
                throw new QueryRunnerAlreadyReleasedError();
            const result = yield this.client.query(query, parameters);
            if (result.records) {
                return result.records;
            }
            return result;
        });
    }
}

//# sourceMappingURL=AuroraDataApiPostgresQueryRunner.js.map
