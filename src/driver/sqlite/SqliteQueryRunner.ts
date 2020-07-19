import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {QueryFailedError} from "../../error/QueryFailedError";
import {AbstractSqliteQueryRunner} from "../sqlite-abstract/AbstractSqliteQueryRunner";
import {SqliteDriver} from "./SqliteDriver";

/**
 * Runs queries on a single sqlite database connection.
 *
 * Does not support compose primary keys with autoincrement field.
 * todo: need to throw exception for this case.
 */
export class SqliteQueryRunner extends AbstractSqliteQueryRunner {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: SqliteDriver) {
        super(driver);
    }

    /**
     * Executes a given SQL query.
     */
    query(query: string, parameters?: any[]): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const connection = this.driver.connection;
        const logger = this.logger;

        return new Promise<any[]>(async (ok, fail) => {

            const handler = function (err: any, result: any) {

                // log slow queries if maxQueryExecution time is set
                const maxQueryExecutionTime = connection.options.maxQueryExecutionTime;
                const queryEndTime = +new Date();
                const queryExecutionTime = queryEndTime - queryStartTime;
                if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                    logger.logQuerySlow(queryExecutionTime, query, parameters, this);

                if (err) {
                    logger.logQueryError(err, query, parameters, this);
                    fail(new QueryFailedError(query, parameters, err));
                } else {
                    ok(isInsertQuery ? this["lastID"] : result);
                }
            };

            const databaseConnection = await this.connect();
            this.logger.logQuery(query, parameters, this);
            const queryStartTime = +new Date();
            const isInsertQuery = query.substr(0, 11) === "INSERT INTO";
            if (isInsertQuery) {
                databaseConnection.run(query, parameters, handler);
            } else {
                databaseConnection.all(query, parameters, handler);
            }
        });
    }
}
