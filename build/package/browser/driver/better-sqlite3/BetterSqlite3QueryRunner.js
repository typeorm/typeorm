import { __awaiter } from "tslib";
import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError";
import { QueryFailedError } from "../../error/QueryFailedError";
import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner";
import { Broadcaster } from "../../subscriber/Broadcaster";
/**
 * Runs queries on a single sqlite database connection.
 *
 * Does not support compose primary keys with autoincrement field.
 * todo: need to throw exception for this case.
 */
export class BetterSqlite3QueryRunner extends AbstractSqliteQueryRunner {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(driver) {
        super();
        this.stmtCache = new Map();
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster(this);
        if (typeof this.driver.options.statementCacheSize === "number") {
            this.cacheSize = this.driver.options.statementCacheSize;
        }
        else {
            this.cacheSize = 100;
        }
    }
    getStmt(query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.cacheSize > 0) {
                let stmt = this.stmtCache.get(query);
                if (!stmt) {
                    const databaseConnection = yield this.connect();
                    stmt = databaseConnection.prepare(query);
                    this.stmtCache.set(query, stmt);
                    while (this.stmtCache.size > this.cacheSize) {
                        // since es6 map keeps the insertion order,
                        // it comes to be FIFO cache
                        const key = this.stmtCache.keys().next().value;
                        this.stmtCache.delete(key);
                    }
                }
                return stmt;
            }
            else {
                const databaseConnection = yield this.connect();
                return databaseConnection.prepare(query);
            }
        });
    }
    /**
     * Executes a given SQL query.
     */
    query(query, parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isReleased)
                throw new QueryRunnerAlreadyReleasedError();
            const connection = this.driver.connection;
            parameters = parameters || [];
            for (let i = 0; i < parameters.length; i++) {
                // in "where" clauses the parameters are not escaped by the driver
                if (typeof parameters[i] === "boolean")
                    parameters[i] = +parameters[i];
            }
            this.driver.connection.logger.logQuery(query, parameters, this);
            const queryStartTime = +new Date();
            const stmt = yield this.getStmt(query);
            try {
                let result;
                if (stmt.reader) {
                    result = stmt.all.apply(stmt, parameters);
                }
                else {
                    result = stmt.run.apply(stmt, parameters);
                    if (query.substr(0, 6) === "INSERT") {
                        result = result.lastInsertRowid;
                    }
                }
                // log slow queries if maxQueryExecution time is set
                const maxQueryExecutionTime = connection.options.maxQueryExecutionTime;
                const queryEndTime = +new Date();
                const queryExecutionTime = queryEndTime - queryStartTime;
                if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                    connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);
                return result;
            }
            catch (err) {
                connection.logger.logQueryError(err, query, parameters, this);
                throw new QueryFailedError(query, parameters, err);
            }
        });
    }
}

//# sourceMappingURL=BetterSqlite3QueryRunner.js.map
