import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError"
import { QueryFailedError } from "../../error/QueryFailedError"
import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner"
import { Broadcaster } from "../../subscriber/Broadcaster"
import { LibsqlDriver } from "./LibsqlDriver"
import { QueryResult } from "../../query-runner/QueryResult"
import { ObjectLiteral } from "../../common/ObjectLiteral"

/**
 * Runs queries on a single libsql database connection.
 */
export class LibsqlQueryRunner extends AbstractSqliteQueryRunner {
    /**
     * Database driver used by connection.
     */
    driver: LibsqlDriver

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: LibsqlDriver) {
        super()
        this.driver = driver
        this.connection = driver.connection
        this.broadcaster = new Broadcaster(this)
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Executes a given SQL query.
     */
    async query(
        query: string,
        parameters?: any[],
        useStructuredResult = false,
    ): Promise<any> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        const databaseConnection = await this.connect()
        const queryStartTime = +new Date()

        try {
            this.driver.connection.logger.logQuery(query, parameters, this)

            const result = await databaseConnection.execute({
                sql: query,
                args: parameters || [],
            })

            // libsql execute returns { rows: [], columns: [], rowsAffected: number, lastInsertRowId: number }
            const maxQueryExecutionTime =
                this.driver.options.maxQueryExecutionTime
            const queryEndTime = +new Date()
            const queryExecutionTime = queryEndTime - queryStartTime
            if (
                maxQueryExecutionTime &&
                queryExecutionTime > maxQueryExecutionTime
            ) {
                this.driver.connection.logger.logQuerySlow(
                    queryExecutionTime,
                    query,
                    parameters,
                    this,
                )
            }

            const queryResult = new QueryResult()
            queryResult.affected = result.rowsAffected
            queryResult.records = result.rows
            queryResult.raw = result.rows

            if (!useStructuredResult) {
                return queryResult.raw
            }

            return queryResult
        } catch (err: any) {
            this.driver.connection.logger.logQueryError(
                err,
                query,
                parameters,
                this,
            )

            const failedError = new QueryFailedError(query, parameters, err)
            Object.assign(failedError, {
                errno: err.errno,
                code: err.code,
                sqliteErrorCode: err.code,
            })
            throw failedError
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    protected parametrize(
        objectLiteral: ObjectLiteral,
        startIndex: number = 0,
    ): string[] {
        return Object.keys(objectLiteral).map((key, index) => {
            return `"${key}"` + "=?"
        })
    }
}
