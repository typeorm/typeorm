import {LoggerOptions, shouldLog} from "./LoggerOptions";
import {PlatformTools} from "../platform/PlatformTools";
import {QueryRunner} from "../query-runner/QueryRunner";
import {Logger} from "./Logger";

/**
 * Performs logging of the events in TypeORM.
 * This version of logger uses console to log events and use syntax highlighting.
 */
export class AdvancedConsoleLogger implements Logger {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private options?: LoggerOptions) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Logs query and parameters used in it.
     */
    logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
        if (shouldLog("query", this.options)) {
            const sql = query + (parameters && parameters.length ? " -- PARAMETERS: " + this.stringifyParams(parameters) : "");
            PlatformTools.logInfo("query:", PlatformTools.highlightSql(sql));
        }
    }

    /**
     * Logs query that is failed.
     */
    logQueryError(error: string, query: string, parameters?: any[], queryRunner?: QueryRunner) {
        if (shouldLog("error", this.options)) {
            const sql = query + (parameters && parameters.length ? " -- PARAMETERS: " + this.stringifyParams(parameters) : "");
            PlatformTools.logError(`query failed:`, PlatformTools.highlightSql(sql));
            PlatformTools.logError(`error:`, error);
        }
    }

    /**
     * Logs query that is slow.
     */
    logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner) {
        const sql = query + (parameters && parameters.length ? " -- PARAMETERS: " + this.stringifyParams(parameters) : "");
        PlatformTools.logWarn(`query is slow:`, PlatformTools.highlightSql(sql));
        PlatformTools.logWarn(`execution time:`, time);
    }

    /**
     * Logs events from the schema build process.
     */
    logSchemaBuild(message: string, queryRunner?: QueryRunner) {
        if (shouldLog("schema", this.options)) {
            PlatformTools.log(message);
        }
    }

    /**
     * Logs events from the migration run process.
     */
    logMigration(message: string, queryRunner?: QueryRunner) {
        PlatformTools.log(message);
    }

    /**
     * Perform logging using given logger, or by default to the console.
     * Log has its own level and message.
     */
    log(level: "log"|"info"|"warn", message: any, queryRunner?: QueryRunner) {
        switch (level) {
            case "log":
                if (shouldLog("log", this.options))
                    PlatformTools.log(message);
                break;
            case "info":
                if (shouldLog("info", this.options))
                    PlatformTools.logInfo("INFO:", message);
                break;
            case "warn":
                if (shouldLog("warn", this.options))
                    console.warn(PlatformTools.warn(message));
                break;
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
            return JSON.stringify(parameters);

        } catch (error) { // most probably circular objects in parameters
            return parameters;
        }
    }

}
