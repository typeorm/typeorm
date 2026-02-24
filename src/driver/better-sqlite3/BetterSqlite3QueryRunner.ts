import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError"
import { QueryFailedError } from "../../error/QueryFailedError"
import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner"
import { Broadcaster } from "../../subscriber/Broadcaster"
import type { BetterSqlite3Driver } from "./BetterSqlite3Driver"
import { QueryResult } from "../../query-runner/QueryResult"
import { BroadcasterResult } from "../../subscriber/BroadcasterResult"

/**
 * Runs queries on a single sqlite database connection.
 *
 * Does not support compose primary keys with autoincrement field.
 * todo: need to throw exception for this case.
 */
export class BetterSqlite3QueryRunner extends AbstractSqliteQueryRunner {
    /**
     * Database driver used by connection.
     */
    driver: BetterSqlite3Driver

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: BetterSqlite3Driver) {
        super()
        this.driver = driver
        this.connection = driver.connection
        this.broadcaster = new Broadcaster(this)
        if (typeof this.driver.options.statementCacheSize === "number") {
            this.cacheSize = this.driver.options.statementCacheSize
        } else {
            this.cacheSize = 100
        }
    }

    private cacheSize: number
    private stmtCache = new Map<string, any>()

    private async getStmt(query: string) {
        if (this.cacheSize > 0) {
            let stmt = this.stmtCache.get(query)
            if (!stmt) {
                const databaseConnection = await this.connect()
                stmt = databaseConnection.prepare(query)
                this.stmtCache.set(query, stmt)
                while (this.stmtCache.size > this.cacheSize) {
                    // since es6 map keeps the insertion order,
                    // it comes to be FIFO cache
                    const key = this.stmtCache.keys().next().value!
                    this.stmtCache.delete(key)
                }
            }
            return stmt
        } else {
            const databaseConnection = await this.connect()
            return databaseConnection.prepare(query)
        }
    }

    /**
     * Called before migrations are run.
     */
    async beforeMigration(): Promise<void> {
        const databaseConnection = await this.connect()
        databaseConnection.pragma("foreign_keys = OFF")
    }

    /**
     * Called after migrations are run.
     */
    async afterMigration(): Promise<void> {
        const databaseConnection = await this.connect()
        databaseConnection.pragma("foreign_keys = ON")
    }

    /**
     * Executes a given SQL query.
     * @param query
     * @param parameters
     * @param useStructuredResult
     */
    async query(
        query: string,
        parameters: any[] = [],
        useStructuredResult = false,
    ): Promise<any> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        const connection = this.driver.connection

        // better-sqlite3 cannot bind booleans, convert to 0/1
        const normalizedParameters = parameters.map((p) =>
            typeof p === "boolean" ? (p ? 1 : 0) : p,
        )

        const broadcasterResult = new BroadcasterResult()

        this.driver.connection.logger.logQuery(
            query,
            normalizedParameters,
            this,
        )
        this.broadcaster.broadcastBeforeQueryEvent(
            broadcasterResult,
            query,
            normalizedParameters,
        )
        const queryStartTime = Date.now()

        const stmt = await this.getStmt(query)

        try {
            const result = new QueryResult()

            if (stmt.reader) {
                const raw = stmt.all(...normalizedParameters)

                result.raw = raw

                if (Array.isArray(raw)) {
                    result.records = raw
                }
            } else {
                const raw = stmt.run(...normalizedParameters)
                result.affected = raw.changes
                result.raw = raw.lastInsertRowid
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
                connection.logger.logQuerySlow(
                    queryExecutionTime,
                    query,
                    normalizedParameters,
                    this,
                )

            this.broadcaster.broadcastAfterQueryEvent(
                broadcasterResult,
                query,
                normalizedParameters,
                true,
                queryExecutionTime,
                result.raw,
                undefined,
            )

            if (!useStructuredResult) {
                return result.raw
            }

            return result
        } catch (err) {
            connection.logger.logQueryError(
                err,
                query,
                normalizedParameters,
                this,
            )
            throw new QueryFailedError(query, normalizedParameters, err)
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected async loadTableRecords(
        tablePath: string,
        tableOrIndex: "table" | "index",
    ) {
        const [database, tableName] = this.splitTablePath(tablePath)
        const relativePath = database
            ? this.driver.getAttachedDatabasePathRelativeByHandle(database)
            : undefined
        const res = await this.query(
            `SELECT ${
                relativePath ? `'${relativePath}'` : null
            } as database, * FROM ${this.escapePath(
                `${database ? `${database}.` : ""}sqlite_master`,
            )} WHERE "type" = '${tableOrIndex}' AND "${
                tableOrIndex === "table" ? "name" : "tbl_name"
            }" IN ('${tableName}')`,
        )
        return res
    }
    protected async loadPragmaRecords(tablePath: string, pragma: string) {
        const [database, tableName] = this.splitTablePath(tablePath)
        const databaseConnection = await this.connect()
        const res = databaseConnection.pragma(
            `${database ? `"${database}".` : ""}${pragma}("${tableName}")`,
        )
        return res
    }
}
