import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError"
import { QueryFailedError } from "../../error/QueryFailedError"
import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner"
import { CapacitorDriver } from "./CapacitorDriver"
import { Broadcaster } from "../../subscriber/Broadcaster"
import { ObjectLiteral } from "../../common/ObjectLiteral"
import { QueryResult } from "../../query-runner/QueryResult"
import { QueryOptions } from "../../query-runner/QueryOptions"

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

    async executeSet(set: { statement: string; values?: any[] }[]) {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        const databaseConnection = await this.connect()

        return databaseConnection.executeSet(set, false)
    }

    /**
     * Executes a given SQL query.
     */
    async query(
        query: string,
        parameters?: any[],
        optionsOrUseStructuredResult?: QueryOptions | boolean,
    ): Promise<any> {
        const useStructuredResult =
            typeof optionsOrUseStructuredResult === "boolean"
                ? optionsOrUseStructuredResult
                : optionsOrUseStructuredResult?.useStructuredResult === true
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        const databaseConnection = await this.connect()

        this.driver.connection.logger.logQuery(query, parameters, this)

        const command = query.substring(
            0,
            query.indexOf(" ") !== -1 ? query.indexOf(" ") : undefined,
        )

        try {
            let raw: any

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
                raw = await databaseConnection.query(query, parameters || [])
            }

            const result = new QueryResult()

            if (raw?.hasOwnProperty("values")) {
                result.raw = raw.values
                result.records = raw.values
            }

            if (raw?.hasOwnProperty("changes")) {
                result.affected = raw.changes.changes
                result.raw = raw.changes.lastId || raw.changes.changes
            }

            if (!useStructuredResult) {
                return result.raw
            }

            return result
        } catch (err) {
            this.driver.connection.logger.logQueryError(
                err,
                query,
                parameters,
                this,
            )

            throw new QueryFailedError(query, parameters, err)
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    protected parametrize(objectLiteral: ObjectLiteral): string[] {
        return Object.keys(objectLiteral).map((key) => `"${key}"` + "=?")
    }
}
