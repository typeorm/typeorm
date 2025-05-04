import { QueryFailedError } from "../../error/QueryFailedError"
import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError"
import { QueryResult } from "../../query-runner/QueryResult"
import { Broadcaster } from "../../subscriber/Broadcaster"
import { BroadcasterResult } from "../../subscriber/BroadcasterResult"
import { buildSqlTag } from "../../util/SqlTagUtils"
import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner"
import { SqljsDriver } from "./SqljsDriver"

/**
 * Runs queries on a single sqlite database connection.
 */
export class SqljsQueryRunner extends AbstractSqliteQueryRunner {
    /**
     * Flag to determine if a modification has happened since the last time this query runner has requested a save.
     */
    private isDirty = false

    /**
     * Database driver used by connection.
     */
    driver: SqljsDriver

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: SqljsDriver) {
        super()
        this.driver = driver
        this.connection = driver.connection
        this.broadcaster = new Broadcaster(this)
    }

    // -------------------------------------------------------------------------
    // Public methods
    // -------------------------------------------------------------------------

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

    private async flush() {
        if (this.isDirty) {
            await this.driver.autoSave()
            this.isDirty = false
        }
    }

    async release(): Promise<void> {
        await this.flush()
        return super.release()
    }

    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    async commitTransaction(): Promise<void> {
        await super.commitTransaction()
        if (!this.isTransactionActive) {
            await this.flush()
        }
    }

    /**
     * Executes a given SQL query.
     */
    async query(
        query: string,
        parameters: any[] = [],
        useStructuredResult = false,
    ): Promise<any> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        const command = query.trim().split(" ", 1)[0]

        const databaseConnection = this.driver.databaseConnection

        this.driver.connection.logger.logQuery(query, parameters, this)
        await this.broadcaster.broadcast("BeforeQuery", query, parameters)

        const broadcasterResult = new BroadcasterResult()
        const queryStartTime = Date.now()
        let statement: any

        try {
            statement = databaseConnection.prepare(query)
            if (parameters) {
                parameters = parameters.map((p) =>
                    typeof p !== "undefined" ? p : null,
                )

                statement.bind(parameters)
            }

            // log slow queries if maxQueryExecution time is set
            const maxQueryExecutionTime =
                this.driver.options.maxQueryExecutionTime
            const queryEndTime = Date.now()
            const queryExecutionTime = queryEndTime - queryStartTime

            if (
                maxQueryExecutionTime &&
                queryExecutionTime > maxQueryExecutionTime
            )
                this.driver.connection.logger.logQuerySlow(
                    queryExecutionTime,
                    query,
                    parameters,
                    this,
                )

            const records: any[] = []

            while (statement.step()) {
                records.push(statement.getAsObject())
            }

            this.broadcaster.broadcastAfterQueryEvent(
                broadcasterResult,
                query,
                parameters,
                true,
                queryExecutionTime,
                records,
                undefined,
            )

            const result = new QueryResult()

            result.affected = databaseConnection.getRowsModified()
            result.records = records
            result.raw = records

            statement.free()

            if (command !== "SELECT") {
                this.isDirty = true
            }

            if (useStructuredResult) {
                return result
            } else {
                return result.raw
            }
        } catch (err) {
            if (statement) {
                statement.free()
            }

            this.driver.connection.logger.logQueryError(
                err,
                query,
                parameters,
                this,
            )
            this.broadcaster.broadcastAfterQueryEvent(
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

    /**
     * Executes a given SQL query using the sql-tag syntax.
     */
    async sql<T = any>(
        strings: TemplateStringsArray,
        ...parameters: any[]
    ): Promise<QueryResult<T> | any> {
        const sqlQuery = buildSqlTag({
            driver: this.driver,
            strings,
            expressions: parameters,
        })
        return this.query(sqlQuery.query, sqlQuery.parameters, false)
    }
}
