import { __awaiter, __extends, __generator, __read } from "tslib";
import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError";
import { TransactionAlreadyStartedError } from "../../error/TransactionAlreadyStartedError";
import { TransactionNotStartedError } from "../../error/TransactionNotStartedError";
import { PostgresQueryRunner } from "../postgres/PostgresQueryRunner";
import { BroadcasterResult } from "../../subscriber/BroadcasterResult";
var PostgresQueryRunnerWrapper = /** @class */ (function (_super) {
    __extends(PostgresQueryRunnerWrapper, _super);
    function PostgresQueryRunnerWrapper(driver, mode) {
        return _super.call(this, driver, mode) || this;
    }
    return PostgresQueryRunnerWrapper;
}(PostgresQueryRunner));
/**
 * Runs queries on a single postgres database connection.
 */
var AuroraDataApiPostgresQueryRunner = /** @class */ (function (_super) {
    __extends(AuroraDataApiPostgresQueryRunner, _super);
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function AuroraDataApiPostgresQueryRunner(driver, client, mode) {
        var _this = _super.call(this, driver, mode) || this;
        _this.client = client;
        return _this;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates/uses database connection from the connection pool to perform further operations.
     * Returns obtained database connection.
     */
    AuroraDataApiPostgresQueryRunner.prototype.connect = function () {
        var _this = this;
        if (this.databaseConnection)
            return Promise.resolve(this.databaseConnection);
        if (this.databaseConnectionPromise)
            return this.databaseConnectionPromise;
        if (this.mode === "slave" && this.driver.isReplicated) {
            this.databaseConnectionPromise = this.driver.obtainSlaveConnection().then(function (_a) {
                var _b = __read(_a, 2), connection = _b[0], release = _b[1];
                _this.driver.connectedQueryRunners.push(_this);
                _this.databaseConnection = connection;
                _this.releaseCallback = release;
                return _this.databaseConnection;
            });
        }
        else { // master
            this.databaseConnectionPromise = this.driver.obtainMasterConnection().then(function (_a) {
                var _b = __read(_a, 2), connection = _b[0], release = _b[1];
                _this.driver.connectedQueryRunners.push(_this);
                _this.databaseConnection = connection;
                _this.releaseCallback = release;
                return _this.databaseConnection;
            });
        }
        return this.databaseConnectionPromise;
    };
    /**
     * Starts transaction on the current connection.
     */
    AuroraDataApiPostgresQueryRunner.prototype.startTransaction = function (isolationLevel) {
        return __awaiter(this, void 0, void 0, function () {
            var beforeBroadcastResult, afterBroadcastResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
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
                        return [4 /*yield*/, this.client.startTransaction()];
                    case 3:
                        _a.sent();
                        afterBroadcastResult = new BroadcasterResult();
                        this.broadcaster.broadcastAfterTransactionStartEvent(afterBroadcastResult);
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
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    AuroraDataApiPostgresQueryRunner.prototype.commitTransaction = function () {
        return __awaiter(this, void 0, void 0, function () {
            var beforeBroadcastResult, afterBroadcastResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isTransactionActive)
                            throw new TransactionNotStartedError();
                        beforeBroadcastResult = new BroadcasterResult();
                        this.broadcaster.broadcastBeforeTransactionCommitEvent(beforeBroadcastResult);
                        if (!(beforeBroadcastResult.promises.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.all(beforeBroadcastResult.promises)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.client.commitTransaction()];
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
    AuroraDataApiPostgresQueryRunner.prototype.rollbackTransaction = function () {
        return __awaiter(this, void 0, void 0, function () {
            var beforeBroadcastResult, afterBroadcastResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isTransactionActive)
                            throw new TransactionNotStartedError();
                        beforeBroadcastResult = new BroadcasterResult();
                        this.broadcaster.broadcastBeforeTransactionRollbackEvent(beforeBroadcastResult);
                        if (!(beforeBroadcastResult.promises.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.all(beforeBroadcastResult.promises)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.client.rollbackTransaction()];
                    case 3:
                        _a.sent();
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
    AuroraDataApiPostgresQueryRunner.prototype.query = function (query, parameters) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isReleased)
                            throw new QueryRunnerAlreadyReleasedError();
                        return [4 /*yield*/, this.client.query(query, parameters)];
                    case 1:
                        result = _a.sent();
                        if (result.records) {
                            return [2 /*return*/, result.records];
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    return AuroraDataApiPostgresQueryRunner;
}(PostgresQueryRunnerWrapper));
export { AuroraDataApiPostgresQueryRunner };

//# sourceMappingURL=AuroraDataApiPostgresQueryRunner.js.map
