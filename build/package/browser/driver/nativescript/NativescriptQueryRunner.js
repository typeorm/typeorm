import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError";
import { QueryFailedError } from "../../error/QueryFailedError";
import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner";
import { Broadcaster } from "../../subscriber/Broadcaster";
/**
 * Runs queries on a single sqlite database connection.
 */
export class NativescriptQueryRunner extends AbstractSqliteQueryRunner {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(driver) {
        super();
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster(this);
    }
    /**
     * Executes a given SQL query.
     */
    query(query, parameters) {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();
        const connection = this.driver.connection;
        return new Promise((ok, fail) => {
            const isInsertQuery = query.substr(0, 11) === "INSERT INTO";
            const handler = function (err, result) {
                // log slow queries if maxQueryExecution time is set
                const maxQueryExecutionTime = connection.options.maxQueryExecutionTime;
                const queryEndTime = +new Date();
                const queryExecutionTime = queryEndTime - queryStartTime;
                if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                    connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);
                if (err) {
                    connection.logger.logQueryError(err, query, parameters, this);
                    fail(new QueryFailedError(query, parameters, err));
                }
                else {
                    // when isInsertQuery == true, result is the id
                    ok(result);
                }
            };
            this.driver.connection.logger.logQuery(query, parameters, this);
            const queryStartTime = +new Date();
            this.connect().then(databaseConnection => {
                if (isInsertQuery) {
                    databaseConnection.execSQL(query, parameters, handler);
                }
                else {
                    databaseConnection.all(query, parameters, handler);
                }
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

//# sourceMappingURL=NativescriptQueryRunner.js.map
