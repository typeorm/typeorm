import { __awaiter } from "tslib";
import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError";
import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner";
import { Broadcaster } from "../../subscriber/Broadcaster";
import { QueryFailedError } from "../../error/QueryFailedError";
/**
 * Runs queries on a single sqlite database connection.
 */
export class SqljsQueryRunner extends AbstractSqliteQueryRunner {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(driver) {
        super();
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster(this);
    }
    // -------------------------------------------------------------------------
    // Public methods
    // -------------------------------------------------------------------------
    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    commitTransaction() {
        const _super = Object.create(null, {
            commitTransaction: { get: () => super.commitTransaction }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.commitTransaction.call(this);
            yield this.driver.autoSave();
        });
    }
    /**
     * Executes a given SQL query.
     */
    query(query, parameters = []) {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();
        return new Promise((ok, fail) => __awaiter(this, void 0, void 0, function* () {
            const databaseConnection = this.driver.databaseConnection;
            this.driver.connection.logger.logQuery(query, parameters, this);
            const queryStartTime = +new Date();
            let statement;
            try {
                statement = databaseConnection.prepare(query);
                if (parameters) {
                    parameters = parameters.map(p => typeof p !== 'undefined' ? p : null);
                    statement.bind(parameters);
                }
                // log slow queries if maxQueryExecution time is set
                const maxQueryExecutionTime = this.driver.connection.options.maxQueryExecutionTime;
                const queryEndTime = +new Date();
                const queryExecutionTime = queryEndTime - queryStartTime;
                if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                    this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);
                const result = [];
                while (statement.step()) {
                    result.push(statement.getAsObject());
                }
                statement.free();
                ok(result);
            }
            catch (e) {
                if (statement) {
                    statement.free();
                }
                this.driver.connection.logger.logQueryError(e, query, parameters, this);
                fail(new QueryFailedError(query, parameters, e));
            }
        }));
    }
}

//# sourceMappingURL=SqljsQueryRunner.js.map
