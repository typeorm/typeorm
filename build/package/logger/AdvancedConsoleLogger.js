"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedConsoleLogger = void 0;
const PlatformTools_1 = require("../platform/PlatformTools");
/**
 * Performs logging of the events in TypeORM.
 * This version of logger uses console to log events and use syntax highlighting.
 */
class AdvancedConsoleLogger {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(options) {
        this.options = options;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Logs query and parameters used in it.
     */
    logQuery(query, parameters, queryRunner) {
        if (this.options === "all" ||
            this.options === true ||
            (Array.isArray(this.options) &&
                this.options.indexOf("query") !== -1)) {
            const sql = query +
                (parameters && parameters.length
                    ? " -- PARAMETERS: " + this.stringifyParams(parameters)
                    : "");
            PlatformTools_1.PlatformTools.logInfo("query:", PlatformTools_1.PlatformTools.highlightSql(sql));
        }
    }
    /**
     * Logs query that is failed.
     */
    logQueryError(error, query, parameters, queryRunner) {
        if (this.options === "all" ||
            this.options === true ||
            (Array.isArray(this.options) &&
                this.options.indexOf("error") !== -1)) {
            const sql = query +
                (parameters && parameters.length
                    ? " -- PARAMETERS: " + this.stringifyParams(parameters)
                    : "");
            PlatformTools_1.PlatformTools.logError(`query failed:`, PlatformTools_1.PlatformTools.highlightSql(sql));
            PlatformTools_1.PlatformTools.logError(`error:`, error);
        }
    }
    /**
     * Logs query that is slow.
     */
    logQuerySlow(time, query, parameters, queryRunner) {
        const sql = query +
            (parameters && parameters.length
                ? " -- PARAMETERS: " + this.stringifyParams(parameters)
                : "");
        PlatformTools_1.PlatformTools.logWarn(`query is slow:`, PlatformTools_1.PlatformTools.highlightSql(sql));
        PlatformTools_1.PlatformTools.logWarn(`execution time:`, time);
    }
    /**
     * Logs events from the schema build process.
     */
    logSchemaBuild(message, queryRunner) {
        if (this.options === "all" ||
            (Array.isArray(this.options) &&
                this.options.indexOf("schema") !== -1)) {
            PlatformTools_1.PlatformTools.log(message);
        }
    }
    /**
     * Logs events from the migration run process.
     */
    logMigration(message, queryRunner) {
        PlatformTools_1.PlatformTools.log(message);
    }
    /**
     * Perform logging using given logger, or by default to the console.
     * Log has its own level and message.
     */
    log(level, message, queryRunner) {
        switch (level) {
            case "log":
                if (this.options === "all" ||
                    (Array.isArray(this.options) &&
                        this.options.indexOf("log") !== -1))
                    PlatformTools_1.PlatformTools.log(message);
                break;
            case "info":
                if (this.options === "all" ||
                    (Array.isArray(this.options) &&
                        this.options.indexOf("info") !== -1))
                    PlatformTools_1.PlatformTools.logInfo("INFO:", message);
                break;
            case "warn":
                if (this.options === "all" ||
                    (Array.isArray(this.options) &&
                        this.options.indexOf("warn") !== -1))
                    console.warn(PlatformTools_1.PlatformTools.warn(message));
                break;
        }
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Converts parameters to a string.
     * Sometimes parameters can have circular objects and therefore we are handle this case too.
     */
    stringifyParams(parameters) {
        try {
            return JSON.stringify(parameters);
        }
        catch (error) {
            // most probably circular objects in parameters
            return parameters;
        }
    }
}
exports.AdvancedConsoleLogger = AdvancedConsoleLogger;

//# sourceMappingURL=AdvancedConsoleLogger.js.map
