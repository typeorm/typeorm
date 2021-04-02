import { PlatformTools } from "../platform/PlatformTools";
/**
 * Performs logging of the events in TypeORM.
 * This version of logger uses console to log events and use syntax highlighting.
 */
var AdvancedConsoleLogger = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function AdvancedConsoleLogger(options) {
        this.options = options;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Logs query and parameters used in it.
     */
    AdvancedConsoleLogger.prototype.logQuery = function (query, parameters, queryRunner) {
        if (this.options === "all" || this.options === true || (Array.isArray(this.options) && this.options.indexOf("query") !== -1)) {
            var sql = query + (parameters && parameters.length ? " -- PARAMETERS: " + this.stringifyParams(parameters) : "");
            PlatformTools.logInfo("query:", PlatformTools.highlightSql(sql));
        }
    };
    /**
     * Logs query that is failed.
     */
    AdvancedConsoleLogger.prototype.logQueryError = function (error, query, parameters, queryRunner) {
        if (this.options === "all" || this.options === true || (Array.isArray(this.options) && this.options.indexOf("error") !== -1)) {
            var sql = query + (parameters && parameters.length ? " -- PARAMETERS: " + this.stringifyParams(parameters) : "");
            PlatformTools.logError("query failed:", PlatformTools.highlightSql(sql));
            PlatformTools.logError("error:", error);
        }
    };
    /**
     * Logs query that is slow.
     */
    AdvancedConsoleLogger.prototype.logQuerySlow = function (time, query, parameters, queryRunner) {
        var sql = query + (parameters && parameters.length ? " -- PARAMETERS: " + this.stringifyParams(parameters) : "");
        PlatformTools.logWarn("query is slow:", PlatformTools.highlightSql(sql));
        PlatformTools.logWarn("execution time:", time);
    };
    /**
     * Logs events from the schema build process.
     */
    AdvancedConsoleLogger.prototype.logSchemaBuild = function (message, queryRunner) {
        if (this.options === "all" || (Array.isArray(this.options) && this.options.indexOf("schema") !== -1)) {
            PlatformTools.log(message);
        }
    };
    /**
     * Logs events from the migration run process.
     */
    AdvancedConsoleLogger.prototype.logMigration = function (message, queryRunner) {
        PlatformTools.log(message);
    };
    /**
     * Perform logging using given logger, or by default to the console.
     * Log has its own level and message.
     */
    AdvancedConsoleLogger.prototype.log = function (level, message, queryRunner) {
        switch (level) {
            case "log":
                if (this.options === "all" || (Array.isArray(this.options) && this.options.indexOf("log") !== -1))
                    PlatformTools.log(message);
                break;
            case "info":
                if (this.options === "all" || (Array.isArray(this.options) && this.options.indexOf("info") !== -1))
                    PlatformTools.logInfo("INFO:", message);
                break;
            case "warn":
                if (this.options === "all" || (Array.isArray(this.options) && this.options.indexOf("warn") !== -1))
                    console.warn(PlatformTools.warn(message));
                break;
        }
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Converts parameters to a string.
     * Sometimes parameters can have circular objects and therefor we are handle this case too.
     */
    AdvancedConsoleLogger.prototype.stringifyParams = function (parameters) {
        try {
            return JSON.stringify(parameters);
        }
        catch (error) { // most probably circular objects in parameters
            return parameters;
        }
    };
    return AdvancedConsoleLogger;
}());
export { AdvancedConsoleLogger };

//# sourceMappingURL=AdvancedConsoleLogger.js.map
