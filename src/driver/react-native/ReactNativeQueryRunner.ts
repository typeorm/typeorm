import { ObjectLiteral } from "../../common/ObjectLiteral"
import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError"
import { QueryFailedError } from "../../error/QueryFailedError"
import { AbstractSqliteQueryRunner } from "../sqlite-abstract/AbstractSqliteQueryRunner"
import { ReactNativeDriver } from "./ReactNativeDriver"
import { Broadcaster } from "../../subscriber/Broadcaster"
import { QueryResult } from "../../query-runner/QueryResult"

/**
 * Runs queries on a single sqlite database connection.
 */
export class ReactNativeQueryRunner extends AbstractSqliteQueryRunner {
    /**
     * Database driver used by connection.
     */
    // @ts-ignore temporary, we need to fix the issue with the AbstractSqliteDriver and circular errors
    driver: ReactNativeDriver

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(driver: ReactNativeDriver) {
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
    query(
        query: string,
        parameters?: any[],
        useStructuredResult = false,
    ): Promise<any> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        return new Promise(async (ok, fail) => {
            const databaseConnection = await this.connect()
            this.driver.connection.logger.logQuery(query, parameters, this)
            const queryStartTime = +new Date()
            databaseConnection.executeSql(
                query,
                parameters,
                (raw: any) => {
                    // log slow queries if maxQueryExecution time is set
                    const maxQueryExecutionTime =
                        this.driver.options.maxQueryExecutionTime
                    const queryEndTime = +new Date()
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

                    const result = new QueryResult()

                    if (raw?.hasOwnProperty("rowsAffected")) {
                        result.affected = raw.rowsAffected
                    }

                    if (raw?.hasOwnProperty("rows")) {
                        let records = []
                        for (let i = 0; i < raw.rows.length; i++) {
                            records.push(raw.rows.item(i))
                        }

                        result.raw = records
                        result.records = records
                    }

                    // return id of inserted row, if query was insert statement.
                    if (query.substr(0, 11) === "INSERT INTO") {
                        result.raw = raw.insertId
                    }

                    if (useStructuredResult) {
                        ok(result)
                    } else {
                        ok(result.raw)
                    }
                },
                (err: any) => {
                    this.driver.connection.logger.logQueryError(
                        err,
                        query,
                        parameters,
                        this,
                    )
                    fail(new QueryFailedError(query, parameters, err))
                },
            )
        })
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Parametrizes given object of values. Used to create column=value queries.
     */
    protected parametrize(
        objectLiteral: ObjectLiteral,
        startIndex: number = 0,
    ): string[] {
        return Object.keys(objectLiteral).map((key, index) => `"${key}"` + "=?")
    }
}
