import pRetry, { Options as RetryOptions } from "@n8n/p-retry"
import { captureException } from "@sentry/node"
import type { Database as Sqlite3Database } from "sqlite3"
import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError"
import { IsolationLevel } from "../types/IsolationLevel"
import { QueryResult } from "../../query-runner/QueryResult"
import {
    QueryFailedError,
    TransactionNotStartedError,
    TransactionAlreadyStartedError,
    TypeORMError,
} from "../../error"
import { TransactionRollbackFailedError } from "../../error/TransactionRollbackFailedError"
import { TransactionCommitFailedError } from "../../error/TransactionCommitFailedError"
import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner"
import { Broadcaster } from "../../subscriber/Broadcaster"
import { BroadcasterResult } from "../../subscriber/BroadcasterResult"
import { ConnectionIsNotSetError } from "../../error/ConnectionIsNotSetError"
import { SqlitePooledDriver } from "./SqlitePooledDriver"

function shouldRetry(err: Error) {
    return err.message.includes("SQLITE_BUSY")
}

export class SqlitePooledQueryRunner extends AbstractSqliteQueryRunner {
    public abortController = new AbortController()

    /**
     * Database driver used by connection.
     */
    driver: SqlitePooledDriver

    /**
     * Promise used to obtain a database connection for a first time.
     */
    protected databaseConnectionPromise: Promise<Sqlite3Database>

    constructor(driver: SqlitePooledDriver) {
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
     * Creates/uses database connection from the connection pool to perform further operations.
     * Returns obtained database connection.
     */
    connect(): Promise<Sqlite3Database> {
        if (this.databaseConnectionPromise)
            return this.databaseConnectionPromise

        this.databaseConnectionPromise = this.driver
            .obtainDatabaseConnection()
            .then((dbConnection) => {
                this.driver.connectedQueryRunners.push(this)
                this.databaseConnection = dbConnection
                return dbConnection
            })

        return this.databaseConnectionPromise
    }

    /**
     * Releases used database connection
     */
    async release(): Promise<void> {
        if (this.isReleased || !this.databaseConnectionPromise) {
            return
        }

        // Handle the case where the connection is still being made
        const dbConnection = await this.databaseConnectionPromise

        // Abort any ongoing retry operations
        this.abortController.abort()

        this.driver.releaseDatabaseConnection(dbConnection)
        this.driver.connectedQueryRunners =
            this.driver.connectedQueryRunners.filter(
                (runner) => runner !== this,
            )
        this.isReleased = true
    }

    /**
     * Starts transaction.
     */
    async startTransaction(isolationLevel?: IsolationLevel): Promise<void> {
        if (this.driver.transactionSupport === "none")
            throw new TypeORMError(
                `Transactions aren't supported by ${this.connection.driver.options.type}.`,
            )

        if (
            this.isTransactionActive &&
            this.driver.transactionSupport === "simple"
        )
            throw new TransactionAlreadyStartedError()

        if (
            isolationLevel &&
            isolationLevel !== "READ UNCOMMITTED" &&
            isolationLevel !== "SERIALIZABLE"
        )
            throw new TypeORMError(
                `SQLite only supports SERIALIZABLE and READ UNCOMMITTED isolation`,
            )

        this.isTransactionActive = true
        try {
            await this.broadcaster.broadcast("BeforeTransactionStart")
        } catch (err) {
            this.isTransactionActive = false
            throw err
        }

        if (isolationLevel) {
            if (isolationLevel === "READ UNCOMMITTED") {
                await this.query("PRAGMA read_uncommitted = true")
            } else {
                await this.query("PRAGMA read_uncommitted = false")
            }
        }

        await this.query("BEGIN TRANSACTION")

        await this.broadcaster.broadcast("AfterTransactionStart")
    }

    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    async commitTransaction(): Promise<void> {
        try {
            if (!this.isTransactionActive)
                throw new TransactionNotStartedError()

            await this.broadcaster.broadcast("BeforeTransactionCommit")

            await this.query("COMMIT")
            this.isTransactionActive = false

            await this.broadcaster.broadcast("AfterTransactionCommit")
        } catch (commitError) {
            this.driver.invalidateDatabaseConnection(this.databaseConnection)
            captureException(new TransactionCommitFailedError(commitError))
            throw commitError
        }
    }

    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    async rollbackTransaction(): Promise<void> {
        try {
            if (!this.isTransactionActive)
                throw new TransactionNotStartedError()

            await this.broadcaster.broadcast("BeforeTransactionRollback")

            await this.query("ROLLBACK")
            this.isTransactionActive = false

            await this.broadcaster.broadcast("AfterTransactionRollback")
        } catch (rollbackError) {
            this.driver.invalidateDatabaseConnection(this.databaseConnection)
            captureException(new TransactionRollbackFailedError(rollbackError))
            throw rollbackError
        }
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
        const broadcasterResult = new BroadcasterResult()
        const broadcaster = this.broadcaster

        broadcaster.broadcastBeforeQueryEvent(
            broadcasterResult,
            query,
            parameters,
        )

        if (!connection.isInitialized) {
            throw new ConnectionIsNotSetError("sqlite")
        }

        try {
            const databaseConnection = await this.connect()

            return await this.runQueryWithRetry(
                databaseConnection,
                broadcasterResult,
                query,
                parameters,
                useStructuredResult,
            )
        } finally {
            await broadcasterResult.wait()
        }
    }

    private async runQueryWithRetry(
        databaseConnection: Sqlite3Database,
        broadcasterResult: BroadcasterResult,
        query: string,
        parameters?: any[],
        useStructuredResult = false,
    ): Promise<QueryResult | any> {
        const broadcaster = this.broadcaster
        const connection = this.driver.connection
        const maxQueryExecutionTime = this.driver.options.maxQueryExecutionTime

        try {
            this.driver.connection.logger.logQuery(query, parameters, this)
            const queryStartTime = +new Date()

            const retryOptions: RetryOptions = {
                // Max 10 retries, starting with 20ms and 1.71x factor and
                // using randomize (multiply each retry with random number
                // between 1 and 2).
                // Total delay with 10 retries: between 6000ms and 12000ms
                factor: 1.71,
                minTimeout: 20,
                retries: 10,
                randomize: true,
                signal: this.abortController.signal,
                shouldRetry,
            }

            const result = await pRetry(
                () =>
                    this.runQuery(
                        databaseConnection,
                        query,
                        parameters,
                        useStructuredResult,
                    ),
                retryOptions,
            )

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

            broadcaster.broadcastAfterQueryEvent(
                broadcasterResult,
                query,
                parameters,
                true,
                queryExecutionTime,
                useStructuredResult ? result.raw : result,
                undefined,
            )

            return result
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
            throw err
        }
    }

    private async runQuery(
        databaseConnection: Sqlite3Database,
        query: string,
        parameters?: any[],
        useStructuredResult = false,
    ): Promise<QueryResult | any> {
        return await new Promise((resolve, reject) => {
            try {
                const isInsertQuery = query.startsWith("INSERT ")
                const isDeleteQuery = query.startsWith("DELETE ")
                const isUpdateQuery = query.startsWith("UPDATE ")

                const handler = function (this: any, err: any, rows: any) {
                    if (err) {
                        return reject(
                            new QueryFailedError(query, parameters, err),
                        )
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
                            resolve(result)
                        } else {
                            resolve(result.raw)
                        }
                    }
                }

                if (isInsertQuery || isDeleteQuery || isUpdateQuery) {
                    databaseConnection.run(query, parameters, handler)
                } else {
                    databaseConnection.all(query, parameters, handler)
                }
            } catch (err) {
                reject(err)
            }
        })
    }
}
