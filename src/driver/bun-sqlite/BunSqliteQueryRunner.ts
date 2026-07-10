import { QueryFailedError } from "../../error/QueryFailedError"
import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError"
import { QueryResult } from "../../query-runner/QueryResult"
import { Broadcaster } from "../../subscriber/Broadcaster"
import { BroadcasterResult } from "../../subscriber/BroadcasterResult"
import { NamedPlaceholdersNotSupportedError } from "../../error/NamedPlaceholdersNotSupportedError"
import type { ObjectLiteral } from "../../common/ObjectLiteral"
import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner"
import type { BunSqliteDriver } from "./BunSqliteDriver"

/**
 * Runs queries on a single bun:sqlite database connection.
 *
 * Does not support composite primary keys with autoincrement field.
 */
export class BunSqliteQueryRunner extends AbstractSqliteQueryRunner {
    /**
     * Database driver used by connection.
     */
    driver: BunSqliteDriver

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: BunSqliteDriver) {
        super()
        this.driver = driver
        this.dataSource = driver.dataSource
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
                    // FIFO eviction — Map preserves insertion order
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
        databaseConnection.prepare("PRAGMA foreign_keys = OFF").run()
    }

    /**
     * Called after migrations are run.
     */
    async afterMigration(): Promise<void> {
        const databaseConnection = await this.connect()
        databaseConnection.prepare("PRAGMA foreign_keys = ON").run()
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
        parameters: any[] | ObjectLiteral = [],
        useStructuredResult = false,
    ): Promise<any> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()
        if (parameters && !Array.isArray(parameters))
            throw new NamedPlaceholdersNotSupportedError()

        const dataSource = this.driver.dataSource

        // bun:sqlite cannot bind booleans, convert to 0/1
        const normalizedParameters = parameters.map((p) =>
            typeof p === "boolean" ? (p ? 1 : 0) : p,
        )

        const broadcasterResult = new BroadcasterResult()

        this.driver.dataSource.logger.logQuery(
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

            // bun:sqlite has no stmt.reader — use columnNames as indicator instead.
            if (stmt.columnNames.length > 0) {
                const raw = stmt
                    .all(...normalizedParameters)
                    .map((row: any) =>
                        Object.fromEntries(
                            Object.entries(row).map(([key, value]) => [
                                key,
                                value instanceof Uint8Array
                                    ? Buffer.from(value)
                                    : value,
                            ]),
                        ),
                    )

                result.raw = raw

                if (Array.isArray(raw)) {
                    result.records = raw
                }
            } else {
                const raw = stmt.run(...normalizedParameters)
                result.affected = raw.changes
                result.raw = raw.lastInsertRowid
            }

            // log slow queries if maxQueryExecutionTime is set
            const maxQueryExecutionTime =
                this.driver.options.maxQueryExecutionTime
            const queryEndTime = Date.now()
            const queryExecutionTime = queryEndTime - queryStartTime
            if (
                maxQueryExecutionTime &&
                queryExecutionTime > maxQueryExecutionTime
            )
                dataSource.logger.logQuerySlow(
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
            dataSource.logger.logQueryError(
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
        // bun:sqlite has no db.pragma() — use prepare().all() instead.
        return databaseConnection
            .prepare(
                `PRAGMA ${database ? `"${database}".` : ""}${pragma}("${tableName}")`,
            )
            .all()
    }
}
