import type { ObjectLiteral } from "../../common/ObjectLiteral"
import { QueryFailedError } from "../../error/QueryFailedError"
import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError"
import { QueryResult } from "../../query-runner/QueryResult"
import { Broadcaster } from "../../subscriber/Broadcaster"
import { BroadcasterResult } from "../../subscriber/BroadcasterResult"
import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner"
import type { CapacitorDriver } from "./CapacitorDriver"
import { NamedPlaceholdersNotSupportedError } from "../../error/NamedPlaceholdersNotSupportedError"

/**
 * Runs queries on a single sqlite database connection.
 */
export class CapacitorQueryRunner extends AbstractSqliteQueryRunner {
    /**
     * Database driver used by connection.
     */
    driver: CapacitorDriver

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: CapacitorDriver) {
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

    async executeSet(set: { statement: string; values?: any[] }[]) {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        const databaseConnection = await this.connect()

        return databaseConnection.executeSet(set, false)
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
        parameters?: any[] | ObjectLiteral,
        useStructuredResult = false,
    ): Promise<any> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()
        if (parameters && !Array.isArray(parameters))
            throw new NamedPlaceholdersNotSupportedError()

        const databaseConnection = await this.connect()

        this.driver.dataSource.logger.logQuery(query, parameters, this)
        await this.broadcaster.broadcast("BeforeQuery", query, parameters)

        const broadcasterResult = new BroadcasterResult()
        const queryStartTime = Date.now()

        const spaceIndex = query.indexOf(" ")
        const command = spaceIndex === -1 ? query : query.slice(0, spaceIndex)

        let raw: any

        try {
            if (
                [
                    "BEGIN",
                    "ROLLBACK",
                    "COMMIT",
                    "CREATE",
                    "ALTER",
                    "DROP",
                ].indexOf(command) !== -1
            ) {
                raw = await databaseConnection.execute(query, false)
            } else if (["INSERT", "UPDATE", "DELETE"].indexOf(command) !== -1) {
                raw = await databaseConnection.run(query, parameters, false)
            } else {
                raw = await databaseConnection.query(query, parameters ?? [])
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
            try {
                await broadcasterResult.wait()
            } catch {
                // a subscriber failing must not hide the original query error
            }

            throw new QueryFailedError(query, parameters, err)
        }

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
        await broadcasterResult.wait()

        const result = new QueryResult()

        if (raw?.hasOwnProperty("values")) {
            result.raw = raw.values
            result.records = raw.values
        }

        if (raw?.hasOwnProperty("changes")) {
            result.affected = raw.changes.changes
            result.raw = raw.changes.lastId ?? raw.changes.changes
        }

        if (!useStructuredResult) {
            return result.raw
        }

        return result
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Parametrizes given object of values. Used to create column=value queries.
     *
     * @param objectLiteral
     */
    protected parametrize(objectLiteral: ObjectLiteral): string[] {
        return Object.keys(objectLiteral).map((key) => `"${key}"` + "=?")
    }
}
