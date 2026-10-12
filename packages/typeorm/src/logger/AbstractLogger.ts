import type {
    Logger,
    LogLevel,
    LogMessage,
    LogMessageType,
    PrepareLogMessagesOptions,
} from "./Logger"
import type { QueryRunner } from "../query-runner/QueryRunner"
import type { LoggerOptions } from "./LoggerOptions"
import { PlatformTools } from "../platform/PlatformTools"
import type { ObjectLiteral } from "../common/ObjectLiteral"

/**
 * Byte length beyond which a binary parameter is logged as a summary rather
 * than serialised. Anything under this is small enough that the serialised
 * form is still readable in a log line.
 */
const MAX_LOGGED_PARAMETER_BYTES = 1024

export abstract class AbstractLogger implements Logger {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected options?: LoggerOptions) {}

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Logs query and parameters used in it.
     *
     * @param query
     * @param parameters
     * @param queryRunner
     */
    logQuery(
        query: string,
        parameters?: any[] | ObjectLiteral,
        queryRunner?: QueryRunner,
    ) {
        if (!this.isLogEnabledFor("query")) {
            return
        }

        this.writeLog(
            "query",
            {
                type: "query",
                prefix: "query",
                message: query,
                format: "sql",
                parameters,
            },
            queryRunner,
        )
    }

    /**
     * Logs query that is failed.
     *
     * @param error
     * @param query
     * @param parameters
     * @param queryRunner
     */
    logQueryError(
        error: string,
        query: string,
        parameters?: any[] | ObjectLiteral,
        queryRunner?: QueryRunner,
    ) {
        if (!this.isLogEnabledFor("query-error")) {
            return
        }

        this.writeLog(
            "warn",
            [
                {
                    type: "query-error",
                    prefix: "query failed",
                    message: query,
                    format: "sql",
                    parameters,
                },
                {
                    type: "query-error",
                    prefix: "error",
                    message: error,
                },
            ],
            queryRunner,
        )
    }

    /**
     * Logs query that is slow.
     *
     * @param time
     * @param query
     * @param parameters
     * @param queryRunner
     */
    logQuerySlow(
        time: number,
        query: string,
        parameters?: any[] | ObjectLiteral,
        queryRunner?: QueryRunner,
    ) {
        if (!this.isLogEnabledFor("query-slow")) {
            return
        }

        this.writeLog(
            "warn",
            [
                {
                    type: "query-slow",
                    prefix: "query is slow",
                    message: query,
                    format: "sql",
                    parameters,
                    additionalInfo: {
                        time,
                    },
                },
                {
                    type: "query-slow",
                    prefix: "execution time",
                    message: time,
                },
            ],
            queryRunner,
        )
    }

    /**
     * Logs events from the schema build process.
     *
     * @param message
     * @param queryRunner
     */
    logSchemaBuild(message: string, queryRunner?: QueryRunner) {
        if (!this.isLogEnabledFor("schema-build")) {
            return
        }

        this.writeLog(
            "schema",
            {
                type: "schema-build",
                message,
            },
            queryRunner,
        )
    }

    /**
     * Logs events from the migration run process.
     *
     * @param message
     * @param queryRunner
     */
    logMigration(message: string, queryRunner?: QueryRunner) {
        if (!this.isLogEnabledFor("migration")) {
            return
        }

        this.writeLog(
            "log",
            {
                type: "migration",
                message,
            },
            queryRunner,
        )
    }

    /**
     * Perform logging using given logger, or by default to the console.
     * Log has its own level and message.
     *
     * @param level
     * @param message
     * @param queryRunner
     */
    log(
        level: "log" | "info" | "warn",
        message: any,
        queryRunner?: QueryRunner,
    ) {
        switch (level) {
            case "log":
                if (!this.isLogEnabledFor("log")) {
                    return
                }

                this.writeLog(
                    "log",
                    {
                        type: "log",
                        message,
                    },
                    queryRunner,
                )
                break

            case "info":
                if (!this.isLogEnabledFor("info")) {
                    return
                }

                this.writeLog(
                    "info",
                    {
                        type: "info",
                        prefix: "info",
                        message,
                    },
                    queryRunner,
                )
                break

            case "warn":
                if (!this.isLogEnabledFor("warn")) {
                    return
                }

                this.writeLog(
                    "warn",
                    {
                        type: "warn",
                        message,
                    },
                    queryRunner,
                )
                break
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Check is logging for level or message type is enabled.
     *
     * @param type
     */
    protected isLogEnabledFor(type?: LogLevel | LogMessageType) {
        switch (type) {
            case "query":
                return (
                    this.options === "all" ||
                    this.options === true ||
                    (Array.isArray(this.options) &&
                        this.options.indexOf("query") !== -1)
                )

            case "error":
            case "query-error":
                return (
                    this.options === "all" ||
                    this.options === true ||
                    (Array.isArray(this.options) &&
                        this.options.indexOf("error") !== -1)
                )

            case "query-slow":
                return true

            case "schema":
            case "schema-build":
                return (
                    this.options === "all" ||
                    (Array.isArray(this.options) &&
                        this.options.indexOf("schema") !== -1)
                )

            case "migration":
                return true

            case "log":
                return (
                    this.options === "all" ||
                    (Array.isArray(this.options) &&
                        this.options.indexOf("log") !== -1)
                )

            case "info":
                return (
                    this.options === "all" ||
                    (Array.isArray(this.options) &&
                        this.options.indexOf("info") !== -1)
                )

            case "warn":
                return (
                    this.options === "all" ||
                    (Array.isArray(this.options) &&
                        this.options.indexOf("warn") !== -1)
                )

            default:
                return false
        }
    }

    /**
     * Write log to specific output.
     */
    protected abstract writeLog(
        level: LogLevel,
        message:
            LogMessage | string | number | (LogMessage | string | number)[],
        queryRunner?: QueryRunner,
    ): void

    /**
     * Prepare and format log messages
     *
     * @param logMessage
     * @param options
     * @param queryRunner
     */
    protected prepareLogMessages(
        logMessage:
            LogMessage | string | number | (LogMessage | string | number)[],
        options?: Partial<PrepareLogMessagesOptions>,
        queryRunner?: QueryRunner,
    ): LogMessage[] {
        options = {
            ...{
                addColonToPrefix: true,
                appendParameterAsComment: true,
                highlightSql: true,
                formatSql: false,
            },
            ...options,
        }
        const messages = Array.isArray(logMessage) ? logMessage : [logMessage]

        for (let message of messages) {
            if (typeof message !== "object") {
                message = {
                    message,
                }
            }

            if (message.format === "sql") {
                let sql = String(message.message)

                if (options.formatSql) {
                    sql = PlatformTools.formatSql(
                        sql,
                        queryRunner?.dataSource?.options.type,
                    )
                }

                if (
                    options.appendParameterAsComment &&
                    message.parameters &&
                    (!Array.isArray(message.parameters) ||
                        message.parameters.length)
                ) {
                    sql += ` -- PARAMETERS: ${this.stringifyParams(
                        message.parameters,
                    )}`
                }

                if (options.highlightSql) {
                    sql = PlatformTools.highlightSql(sql)
                }

                message.message = sql
            }

            if (options.addColonToPrefix && message.prefix) {
                message.prefix += ":"
            }
        }

        return messages as LogMessage[]
    }

    /**
     * Converts parameters to a string.
     * Sometimes parameters can have circular objects and therefor we are handle this case too.
     *
     * @param parameters
     */
    protected stringifyParams(parameters: any[] | ObjectLiteral) {
        try {
            if (!Array.isArray(parameters)) return JSON.stringify(parameters)

            // substituting before serialising keeps the array a single
            // JSON.stringify call, so everything that is not binary is rendered
            // exactly as it was: holes still become null, an element's index
            // still reaches its toJSON, and the separators are unchanged
            return JSON.stringify(
                Array.from(parameters, (value) => this.summariseParam(value)),
            )
        } catch (error) {
            // most probably circular objects in parameters
            return parameters
        }
    }

    /**
     * Replaces a query parameter that is too large to log with a summary.
     *
     * A binary parameter is summarised rather than serialised: a buffer of any
     * size becomes an array of that many numbers under `JSON.stringify`, so a
     * large one produces a log line several times the size of the data itself,
     * which is enough to exhaust memory before anything is written.
     *
     * @param value one query parameter
     * @returns the parameter, or a short stand-in when it is large and binary
     */
    protected summariseParam(value: unknown): unknown {
        if (
            ArrayBuffer.isView(value) &&
            value.byteLength > MAX_LOGGED_PARAMETER_BYTES
        )
            return `<${value.constructor.name}(${value.byteLength} bytes)>`

        return value
    }
}
