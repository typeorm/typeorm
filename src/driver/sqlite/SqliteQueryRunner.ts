import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError"
import { QueryFailedError } from "../../error/QueryFailedError"
import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner"
import { SqliteConnectionOptions } from "./SqliteConnectionOptions"
import { SqliteDriver } from "./SqliteDriver"
import { Broadcaster } from "../../subscriber/Broadcaster"
import { ConnectionIsNotSetError } from "../../error/ConnectionIsNotSetError"
import { QueryResult } from "../../query-runner/QueryResult"

/**
 * Runs queries on a single sqlite database connection.
 *
 * Does not support compose primary keys with autoincrement field.
 * todo: need to throw exception for this case.
 */
export class SqliteQueryRunner extends AbstractSqliteQueryRunner {
    /**
     * Database driver used by connection.
     */
    driver: SqliteDriver

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: SqliteDriver) {
        super()
        this.driver = driver
        this.connection = driver.connection
        this.broadcaster = new Broadcaster(this)
    }

    /**
     * Called before migrations are run.
     */
    async beforeMigration(): Promise<void> {
        await this.query(`PRAGMA foreign_keys = OFF`)
    }

    /**
     * Called after migrations are run.
     */
    async afterMigration(): Promise<void> {
        await this.query(`PRAGMA foreign_keys = ON`)
    }

    /**
     * Executes a given SQL query.
     */
    query(
        query: string,
        parameters?: any[],
        useStructuredResult = false,
    ): Promise<any> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        const connection = this.driver.connection
        const options = connection.options as SqliteConnectionOptions
        const maxQueryExecutionTime = this.driver.options.maxQueryExecutionTime

        if (!connection.isInitialized) {
            throw new ConnectionIsNotSetError("sqlite")
        }

        return new Promise(async (ok, fail) => {
            const databaseConnection = await this.connect()
            this.driver.connection.logger.logQuery(query, parameters, this)
            const queryStartTime = +new Date()
            const isInsertQuery = query.startsWith("INSERT ")
            const isDeleteQuery = query.startsWith("DELETE ")
            const isUpdateQuery = query.startsWith("UPDATE ")

            const execute = async () => {
                if (isInsertQuery || isDeleteQuery || isUpdateQuery) {
                    await databaseConnection.run(query, parameters, handler)
                } else {
                    await databaseConnection.all(query, parameters, handler)
                }
            }

            const handler = function (err: any, rows: any) {
                if (err && err.toString().indexOf("SQLITE_BUSY:") !== -1) {
                    if (
                        typeof options.busyErrorRetry === "number" &&
                        options.busyErrorRetry > 0
                    ) {
                        setTimeout(execute, options.busyErrorRetry)
                        return
                    }
                }

                // log slow queries if maxQueryExecution time is set
                const queryEndTime = +new Date()
                const queryExecutionTime = queryEndTime - queryStartTime
                if (
                    maxQueryExecutionTime &&
                    queryExecutionTime > maxQueryExecutionTime
                )
                    connection.logger.logQuerySlow(
                        queryExecutionTime,
                        query,
                        parameters,
                        this,
                    )

                if (err) {
                    connection.logger.logQueryError(
                        err,
                        query,
                        parameters,
                        this,
                    )
                    fail(new QueryFailedError(query, parameters, err))
                } else {
                    const result = new QueryResult()

                    if (isInsertQuery) {
                        result.raw = this["lastID"]
                    } else {
                        result.raw = rows
                    }

                    if (Array.isArray(rows)) {
                        result.records = rows
                    }

                    result.affected = this["changes"]

                    if (useStructuredResult) {
                        ok(result)
                    } else {
                        ok(result.raw)
                    }
                }
            }

            await execute()
        })
    }
}
