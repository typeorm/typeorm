import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError";
import { QueryFailedError } from "../../error/QueryFailedError";
import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner";
import { BetterSqlite3Driver } from "./BetterSqlite3Driver";
import { Logger } from "../../logger/Logger";

/**
 * Runs queries on a single sqlite database connection.
 *
 * Does not support compose primary keys with autoincrement field.
 * todo: need to throw exception for this case.
 */
export class BetterSqlite3QueryRunner extends AbstractSqliteQueryRunner {
    private readonly cacheSize: number;

    private readonly statementCache: Map<string, any>;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: BetterSqlite3Driver, logger: Logger, statementCache: Map<string, any>) {
        super(driver, logger);

        this.statementCache = statementCache;

        if (typeof driver.options.statementCacheSize === "number") {
            this.cacheSize = driver.options.statementCacheSize;
        } else {
            this.cacheSize = 100;
        }
    }

    private async getStmt(query: string) {
        if (this.cacheSize > 0) {
            let stmt = this.statementCache.get(query);
            if (!stmt) {
                const databaseConnection = await this.connect();
                stmt = databaseConnection.prepare(query);
                this.statementCache.set(query, stmt);
                while (this.statementCache.size > this.cacheSize) {
                    // since es6 map keeps the insertion order,
                    // it comes to be FIFO cache
                    const key = this.statementCache.keys().next().value;
                    this.statementCache.delete(key);
                }
            }
            return stmt;
        } else {
            const databaseConnection = await this.connect();
            return databaseConnection.prepare(query);
        }
    }

    /**
     * Executes a given SQL query.
     */
    async query(query: string, parameters?: any[]): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        parameters = parameters || [];
        for (let i = 0; i < parameters.length; i++) {
            // in "where" clauses the parameters are not escaped by the driver
            if (typeof parameters[i] === "boolean")
                parameters[i] = +parameters[i];
        }

        this.logger.logQuery(query, parameters, this);
        const queryStartTime = +new Date();

        const stmt = await this.getStmt(query);

        try {

            let result: any;
            if (stmt.reader) {
                result = stmt.all.apply(stmt, parameters);
            } else {
                result = stmt.run.apply(stmt, parameters);
                if (query.substr(0, 6) === "INSERT") {
                    result = result.lastInsertRowid;
                }
            }

            // log slow queries if maxQueryExecution time is set
            const maxQueryExecutionTime = this.connection.options.maxQueryExecutionTime;
            const queryEndTime = +new Date();
            const queryExecutionTime = queryEndTime - queryStartTime;
            if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                this.logger.logQuerySlow(queryExecutionTime, query, parameters, this);

            return result;
        } catch (err) {
            this.logger.logQueryError(err, query, parameters, this);
            throw new QueryFailedError(query, parameters, err);
        }
    }
}
