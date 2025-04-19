import { ConnectionIsNotSetError } from "../../error/ConnectionIsNotSetError"
import { QueryFailedError } from "../../error/QueryFailedError"
import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError"
import { QueryResult } from "../../query-runner/QueryResult"
import { Broadcaster } from "../../subscriber/Broadcaster"
import { BroadcasterResult } from "../../subscriber/BroadcasterResult"
import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner"
import { SqliteConnectionOptions } from "./SqliteConnectionOptions"
import { SqliteDriver } from "./SqliteDriver"

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
    async query(
        query: string,
        parameters?: any[],
        useStructuredResult = false,
    ): Promise<any> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        const connection = this.driver.connection
        const options = connection.options as SqliteConnectionOptions
        const maxQueryExecutionTime = this.driver.options.maxQueryExecutionTime
        const broadcaster = this.broadcaster

        if (!connection.isInitialized) {
            throw new ConnectionIsNotSetError("sqlite")
        }

        const databaseConnection = await this.connect()

        this.driver.connection.logger.logQuery(query, parameters, this)
        await broadcaster.broadcast("BeforeQuery", query, parameters)

        const broadcasterResult = new BroadcasterResult()

        try {
            const queryStartTime = Date.now()
            const isInsertQuery = query.startsWith("INSERT ")
            const isDeleteQuery = query.startsWith("DELETE ")
            const isUpdateQuery = query.startsWith("UPDATE ")

            const execute = async () => {
                if (isInsertQuery || isDeleteQuery || isUpdateQuery) {
                    return await databaseConnection.run(query, parameters)
                } else {
                    return await databaseConnection.all(query, parameters)
                }
            }

            let raw

            try {
                raw = await execute()
            } catch (err) {
                if (err && err.toString().indexOf("SQLITE_BUSY:") !== -1) {
                    if (
                        typeof options.busyErrorRetry === "number" &&
                        options.busyErrorRetry > 0
                    ) {
                        return setTimeout(execute, options.busyErrorRetry)
                    }
                }
                throw err
            }

            // log slow queries if maxQueryExecution time is set
            const queryEndTime = Date.now()
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

            const result = new QueryResult()

            if (isInsertQuery) {
                result.raw = raw.lastID
            } else {
                result.raw = raw
            }

            broadcaster.broadcastAfterQueryEvent(
                broadcasterResult,
                query,
                parameters,
                true,
                queryExecutionTime,
                result.raw,
                undefined,
            )

            if (Array.isArray(raw)) {
                result.records = raw
            }

            result.affected = raw.changes

            if (useStructuredResult) {
                return result
            } else {
                return result.raw
            }
        } catch (err) {
            connection.logger.logQueryError(err, query, parameters, this)
            broadcaster.broadcastAfterQueryEvent(
                broadcasterResult,
                query,
                parameters,
                false,
                undefined,
                undefined,
                err,
            )

            throw new QueryFailedError(query, parameters, err)
        } finally {
            await broadcasterResult.wait()
        }
    }
}
