import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError"
import { TransactionNotStartedError } from "../../error/TransactionNotStartedError"
import { QueryRunner } from "../../query-runner/QueryRunner"
import { IsolationLevel } from "../types/IsolationLevel"
import { AuroraPostgresDriver } from "./AuroraPostgresDriver"
import { PostgresQueryRunner } from "../postgres/PostgresQueryRunner"
import { ReplicationMode } from "../types/ReplicationMode"
import { QueryResult } from "../../query-runner/QueryResult"
import { Table } from "../../schema-builder/table/Table"
import { TypeORMError } from "../../error"

class PostgresQueryRunnerWrapper extends PostgresQueryRunner {
    driver: any

    constructor(driver: any, mode: ReplicationMode) {
        super(driver, mode)
    }
}

/**
 * Runs queries on a single postgres database connection.
 */
export class AuroraPostgresQueryRunner
    extends PostgresQueryRunnerWrapper
    implements QueryRunner
{
    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Database driver used by connection.
     */
    driver: AuroraPostgresDriver

    protected client: any

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Promise used to obtain a database connection for a first time.
     */
    protected databaseConnectionPromise: Promise<any>

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(
        driver: AuroraPostgresDriver,
        client: any,
        mode: ReplicationMode,
    ) {
        super(driver, mode)

        this.client = client
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates/uses database connection from the connection pool to perform further operations.
     * Returns obtained database connection.
     */
    connect(): Promise<any> {
        if (this.databaseConnection)
            return Promise.resolve(this.databaseConnection)

        if (this.databaseConnectionPromise)
            return this.databaseConnectionPromise

        if (this.mode === "slave" && this.driver.isReplicated) {
            this.databaseConnectionPromise = this.driver
                .obtainSlaveConnection()
                .then(([connection, release]: any[]) => {
                    this.driver.connectedQueryRunners.push(this)
                    this.databaseConnection = connection
                    this.releaseCallback = release
                    return this.databaseConnection
                })
        } else {
            // master
            this.databaseConnectionPromise = this.driver
                .obtainMasterConnection()
                .then(([connection, release]: any[]) => {
                    this.driver.connectedQueryRunners.push(this)
                    this.databaseConnection = connection
                    this.releaseCallback = release
                    return this.databaseConnection
                })
        }

        return this.databaseConnectionPromise
    }

    /**
     * Starts transaction on the current connection.
     */
    async startTransaction(isolationLevel?: IsolationLevel): Promise<void> {
        this.isTransactionActive = true
        try {
            await this.broadcaster.broadcast("BeforeTransactionStart")
        } catch (err) {
            this.isTransactionActive = false
            throw err
        }

        if (this.transactionDepth === 0) {
            this.transactionDepth += 1
            await this.client.startTransaction()
        } else {
            this.transactionDepth += 1
            await this.query(`SAVEPOINT typeorm_${this.transactionDepth} - 1`)
        }

        await this.broadcaster.broadcast("AfterTransactionStart")
    }

    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    async commitTransaction(): Promise<void> {
        if (!this.isTransactionActive) throw new TransactionNotStartedError()

        await this.broadcaster.broadcast("BeforeTransactionCommit")

        if (this.transactionDepth > 1) {
            this.transactionDepth -= 1
            await this.query(
                `RELEASE SAVEPOINT typeorm_${this.transactionDepth}`,
            )
        } else {
            this.transactionDepth -= 1
            await this.client.commitTransaction()
            this.isTransactionActive = false
        }

        await this.broadcaster.broadcast("AfterTransactionCommit")
    }

    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    async rollbackTransaction(): Promise<void> {
        if (!this.isTransactionActive) throw new TransactionNotStartedError()

        await this.broadcaster.broadcast("BeforeTransactionRollback")

        if (this.transactionDepth > 1) {
            this.transactionDepth -= 1
            await this.query(
                `ROLLBACK TO SAVEPOINT typeorm_${this.transactionDepth}`,
            )
        } else {
            this.transactionDepth -= 1
            await this.client.rollbackTransaction()
            this.isTransactionActive = false
        }

        await this.broadcaster.broadcast("AfterTransactionRollback")
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

        const raw = await this.client.query(query, parameters)

        const result = new QueryResult()

        result.raw = raw

        if (raw?.hasOwnProperty("records") && Array.isArray(raw.records)) {
            result.records = raw.records
        }

        if (raw?.hasOwnProperty("numberOfRecordsUpdated")) {
            result.affected = raw.numberOfRecordsUpdated
        }

        if (!useStructuredResult) {
            return result.raw
        }

        return result
    }

    /**
     * Change table comment.
     */
    changeTableComment(
        tableOrName: Table | string,
        comment?: string,
    ): Promise<void> {
        throw new TypeORMError(
            `aurora-postgres driver does not support change comment.`,
        )
    }
}
