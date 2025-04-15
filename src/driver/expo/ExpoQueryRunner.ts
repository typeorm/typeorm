import { QueryFailedError } from "../../error/QueryFailedError"
import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError"
import { QueryResult } from "../../query-runner/QueryResult"
import { Broadcaster } from "../../subscriber/Broadcaster"
import { BroadcasterResult } from "../../subscriber/BroadcasterResult"
import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner"
import { ExpoDriver } from "./ExpoDriver"

export class ExpoQueryRunner extends AbstractSqliteQueryRunner {
    driver: ExpoDriver

    constructor(driver: ExpoDriver) {
        super()
        this.driver = driver
        this.connection = driver.connection
        this.broadcaster = new Broadcaster(this)
    }

    async beforeMigration(): Promise<void> {
        await this.query("PRAGMA foreign_keys = OFF")
    }

    async afterMigration(): Promise<void> {
        await this.query("PRAGMA foreign_keys = ON")
    }

    async query(
        query: string,
        parameters?: any[],
        useStructuredResult = false,
    ): Promise<any> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        const databaseConnection = await this.connect()
        const broadcasterResult = new BroadcasterResult()

        this.driver.connection.logger.logQuery(query, parameters, this)
        await this.broadcaster.broadcast("BeforeQuery", query, parameters)

        const queryStartTime = +new Date()

        const statement = await databaseConnection.prepareAsync(query)
        try {
            const rawResult = await statement.executeAsync(parameters)

            const maxQueryExecutionTime =
                this.driver.options.maxQueryExecutionTime
            const queryEndTime = +new Date()
            const queryExecutionTime = queryEndTime - queryStartTime

            this.broadcaster.broadcastAfterQueryEvent(
                broadcasterResult,
                query,
                parameters,
                true,
                queryExecutionTime,
                rawResult,
                undefined,
            )
            await broadcasterResult.wait()

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

            const result = new QueryResult()
            result.affected = rawResult.changes
            result.records = await rawResult.getAllAsync()
            result.raw = query.startsWith("INSERT INTO")
                ? rawResult.lastInsertRowId
                : result.records

            return useStructuredResult ? result : result.raw
        } catch (err) {
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
                0,
                undefined,
                err,
            )
            await broadcasterResult.wait()

            throw new QueryFailedError(query, parameters, err)
        } finally {
            await broadcasterResult.wait()
            await statement.finalizeAsync()
        }
    }
}
