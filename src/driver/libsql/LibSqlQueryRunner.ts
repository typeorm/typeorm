import type { Client as LibSqlClient } from "@libsql/client"
import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError"
import { QueryFailedError } from "../../error/QueryFailedError"
import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner"
import type { LibSqlConnectionOptions } from "./LibSqlConnectionOptions"
import type { LibSqlDriver } from "./LibSqlDriver"
import { Broadcaster } from "../../subscriber/Broadcaster"
import { ConnectionIsNotSetError } from "../../error/ConnectionIsNotSetError"
import { QueryResult } from "../../query-runner/QueryResult"
import { BroadcasterResult } from "../../subscriber/BroadcasterResult"

/**
 * Runs queries on a single libSQL database connection.
 */
export class LibSqlQueryRunner extends AbstractSqliteQueryRunner {
    /**
     * Database driver used by connection.
     */
    driver: LibSqlDriver

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: LibSqlDriver) {
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
        const options = connection.options as LibSqlConnectionOptions
        const maxQueryExecutionTime = options.maxQueryExecutionTime
        const broadcasterResult = new BroadcasterResult()
        const broadcaster = this.broadcaster

        broadcaster.broadcastBeforeQueryEvent(
            broadcasterResult,
            query,
            parameters,
        )

        if (!connection.isInitialized) {
            throw new ConnectionIsNotSetError("libsql")
        }
        try {
            const databaseConnection = (await this.connect()) as LibSqlClient
            this.driver.connection.logger.logQuery(query, parameters, this)

            const queryStartTime = Date.now()
            const args = (parameters ?? []).map((p) =>
                p === undefined ? null : p,
            )
            const resultSet = await databaseConnection.execute({
                sql: query,
                args,
            })

            // log slow queries if maxQueryExecution time is set
            const queryEndTime = Date.now()
            const queryExecutionTime = queryEndTime - queryStartTime
            if (maxQueryExecutionTime) {
                if (queryExecutionTime > maxQueryExecutionTime)
                    connection.logger.logQuerySlow(
                        queryExecutionTime,
                        query,
                        parameters,
                        this,
                    )
            }

            const result = new QueryResult()
            if (query.startsWith("INSERT ")) {
                result.raw = resultSet.lastInsertRowid
            } else {
                result.raw = resultSet.rows
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

            if (Array.isArray(resultSet.rows)) {
                result.records = resultSet.rows
            }

            result.affected = resultSet.rowsAffected

            return useStructuredResult ? result : result.raw
        } catch (error) {
            connection.logger.logQueryError(error, query, parameters, this)
            broadcaster.broadcastAfterQueryEvent(
                broadcasterResult,
                query,
                parameters,
                false,
                undefined,
                undefined,
                error,
            )
            throw new QueryFailedError(query, parameters, error)
        } finally {
            await broadcasterResult.wait()
        }
    }
}
