import type { ObjectLiteral } from "../../common/ObjectLiteral"
import { TypeORMError } from "../../error"
import { QueryFailedError } from "../../error/QueryFailedError"
import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError"
import { QueryResult } from "../../query-runner/QueryResult"
import { Broadcaster } from "../../subscriber/Broadcaster"
import { BroadcasterResult } from "../../subscriber/BroadcasterResult"
import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner"
import type { CordovaDriver } from "./CordovaDriver"

/**
 * Runs queries on a single sqlite database connection.
 */
export class CordovaQueryRunner extends AbstractSqliteQueryRunner {
    /**
     * Database driver used by connection.
     */
    driver: CordovaDriver

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: CordovaDriver) {
        super()
        this.driver = driver
        this.dataSource = driver.dataSource
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
     *
     * @param query
     * @param parameters
     * @param useStructuredResult
     */
    async query(
        query: string,
        parameters?: any[],
        useStructuredResult = false,
    ): Promise<any> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        const databaseConnection = await this.connect()

        this.driver.dataSource.logger.logQuery(query, parameters, this)
        await this.broadcaster.broadcast("BeforeQuery", query, parameters)

        const broadcasterResult = new BroadcasterResult()
        const queryStartTime = Date.now()

        try {
            const raw = await new Promise<any>((ok, fail) => {
                databaseConnection.executeSql(
                    query,
                    parameters,
                    (raw: any) => ok(raw),
                    (err: any) => fail(err),
                )
            })

            // log slow queries if maxQueryExecution time is set
            const maxQueryExecutionTime =
                this.driver.options.maxQueryExecutionTime
            const queryEndTime = Date.now()
            const queryExecutionTime = queryEndTime - queryStartTime

            this.broadcaster.broadcastAfterQueryEvent(
                broadcasterResult,
                query,
                parameters,
                true,
                queryExecutionTime,
                raw,
                undefined,
            )

            if (
                maxQueryExecutionTime &&
                queryExecutionTime > maxQueryExecutionTime
            ) {
                this.driver.dataSource.logger.logQuerySlow(
                    queryExecutionTime,
                    query,
                    parameters,
                    this,
                )
            }

            const result = new QueryResult()

            if (query.startsWith("INSERT INTO")) {
                result.raw = raw.insertId
            } else {
                const resultSet = []
                for (let i = 0; i < raw.rows.length; i++) {
                    resultSet.push(raw.rows.item(i))
                }

                result.records = resultSet
                result.raw = resultSet
                result.affected = raw.rowsAffected
            }

            if (useStructuredResult) {
                return result
            } else {
                return result.raw
            }
        } catch (err) {
            this.driver.dataSource.logger.logQueryError(
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
     * Would start a transaction but this driver does not support transactions.
     */
    async startTransaction(): Promise<void> {
        throw new TypeORMError(
            "Transactions are not supported by the Cordova driver",
        )
    }

    /**
     * Would start a transaction but this driver does not support transactions.
     */
    async commitTransaction(): Promise<void> {
        throw new TypeORMError(
            "Transactions are not supported by the Cordova driver",
        )
    }

    /**
     * Would start a transaction but this driver does not support transactions.
     */
    async rollbackTransaction(): Promise<void> {
        throw new TypeORMError(
            "Transactions are not supported by the Cordova driver",
        )
    }

    /**
     * Removes all tables from the currently connected database.
     * Be careful with using this method and avoid using it in production or migrations
     * (because it can clear all your database).
     */
    async clearDatabase(): Promise<void> {
        await this.query(`PRAGMA foreign_keys = OFF`)
        try {
            const selectViewDropsQuery = `SELECT 'DROP VIEW "' || name || '";' as query FROM "sqlite_master" WHERE "type" = 'view'`
            const dropViewQueries: ObjectLiteral[] =
                await this.query(selectViewDropsQuery)

            const selectTableDropsQuery = `SELECT 'DROP TABLE "' || name || '";' as query FROM "sqlite_master" WHERE "type" = 'table' AND "name" != 'sqlite_sequence'`
            const dropTableQueries: ObjectLiteral[] = await this.query(
                selectTableDropsQuery,
            )

            await Promise.all(
                dropViewQueries.map((q) => this.query(q["query"])),
            )
            await Promise.all(
                dropTableQueries.map((q) => this.query(q["query"])),
            )
        } finally {
            await this.query(`PRAGMA foreign_keys = ON`)
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Parametrizes given object of values. Used to create column=value queries.
     *
     * @param objectLiteral
     * @param startIndex
     */
    protected parametrize(
        objectLiteral: ObjectLiteral,
        startIndex: number = 0,
    ): string[] {
        return Object.keys(objectLiteral).map((key, index) => `"${key}"` + "=?")
    }
}
