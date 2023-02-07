import { LoggerOptions } from "./LoggerOptions"
import { QueryRunner } from "../query-runner/QueryRunner"
import { Logger } from "./Logger"

/**
 * Performs logging of the events in TypeORM.
 * This version of logger uses console to log events and does not use syntax highlighting.
 */
export class SimpleConsoleLogger implements Logger {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private options?: LoggerOptions) {}

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Logs query and parameters used in it.
     */
    logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
        if (
            this.options === "all" ||
            this.options === true ||
            (Array.isArray(this.options) &&
                this.options.indexOf("query") !== -1)
        ) {
            const sql =
                query +
                (parameters && parameters.length
                    ? " -- PARAMETERS: " + this.stringifyParams(parameters)
                    : "")
            console.log("query" + ": " + sql)
        }
    }

    /**
     * Logs query that is failed.
     */
    logQueryError(
        error: string,
        query: string,
        parameters?: any[],
        queryRunner?: QueryRunner,
    ) {
        if (
            this.options === "all" ||
            this.options === true ||
            (Array.isArray(this.options) &&
                this.options.indexOf("error") !== -1)
        ) {
            const sql =
                query +
                (parameters && parameters.length
                    ? " -- PARAMETERS: " + this.stringifyParams(parameters)
                    : "")
            console.log(`query failed: ` + sql)
            console.log(`error:`, error)
        }
    }

    /**
     * Logs query that is slow.
     */
    logQuerySlow(
        time: number,
        query: string,
        parameters?: any[],
        queryRunner?: QueryRunner,
    ) {
        const sql =
            query +
            (parameters && parameters.length
                ? " -- PARAMETERS: " + this.stringifyParams(parameters)
                : "")
        console.log(`query is slow: ` + sql)
        console.log(`execution time: ` + time)
    }

    /**
     * Logs events from the schema build process.
     */
    logSchemaBuild(message: string, queryRunner?: QueryRunner) {
        if (
            this.options === "all" ||
            (Array.isArray(this.options) &&
                this.options.indexOf("schema") !== -1)
        ) {
            console.log(message)
        }
    }

    /**
     * Logs events from the migrations run process.
     */
    logMigration(message: string, queryRunner?: QueryRunner) {
        console.log(message)
    }

    /**
     * Perform logging using given logger, or by default to the console.
     * Log has its own level and message.
     */
    log(
        level: "log" | "info" | "warn",
        message: any,
        queryRunner?: QueryRunner,
    ) {
        switch (level) {
            case "log":
                if (
                    this.options === "all" ||
                    (Array.isArray(this.options) &&
                        this.options.indexOf("log") !== -1)
                )
                    console.log(message)
                break
            case "info":
                if (
                    this.options === "all" ||
                    (Array.isArray(this.options) &&
                        this.options.indexOf("info") !== -1)
                )
                    console.info(message)
                break
            case "warn":
                if (
                    this.options === "all" ||
                    (Array.isArray(this.options) &&
                        this.options.indexOf("warn") !== -1)
                )
                    console.warn(message)
                break
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Converts parameters to a string.
     * Sometimes parameters can have circular objects and therefor we are handle this case too.
     */
    protected stringifyParams(parameters: any[]) {
        try {
            return JSON.stringify(parameters)
        } catch (error) {
            // most probably circular objects in parameters
            return parameters
        }
    }
}
