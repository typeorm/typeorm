import {ObjectLiteral} from "../../common/ObjectLiteral";
import {QueryRunnerAlreadyReleasedError} from "../../error/QueryRunnerAlreadyReleasedError";
import {QueryFailedError} from "../../error/QueryFailedError";
import {AbstractSqliteQueryRunner} from "../sqlite-abstract/AbstractSqliteQueryRunner";
import {NativescriptDriver} from "./NativescriptDriver";
import {Logger} from "../../logger/Logger";

/**
 * Runs queries on a single sqlite database connection.
 */
export class NativescriptQueryRunner extends AbstractSqliteQueryRunner {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: NativescriptDriver, logger: Logger) {
        super(driver, logger);
    }

    /**
     * Executes a given SQL query.
     */
    query(query: string, parameters?: any[]): Promise<any> {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();

        const connection = this.driver.connection;
        const logger = this.logger;

        return new Promise<any[]>( (ok, fail) => {
            const isInsertQuery = query.substr(0, 11) === "INSERT INTO";

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
                    // when isInsertQuery == true, result is the id
                    ok(result);
                }
            };
            this.logger.logQuery(query, parameters, this);
            const queryStartTime = +new Date();
            this.connect().then(databaseConnection => {
                if (isInsertQuery) {
                    databaseConnection.execSQL(query, parameters, handler);
                } else {
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
    protected parametrize(objectLiteral: ObjectLiteral, startIndex: number = 0): string[] {
        return Object.keys(objectLiteral).map((key, index) => `"${key}"` + "=?");
    }
}
