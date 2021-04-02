/**
 * Performs logging of the events in TypeORM.
 * This version of logger uses console to log events and does not use syntax highlighting.
 */
var SimpleConsoleLogger = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function SimpleConsoleLogger(options) {
        this.options = options;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Logs query and parameters used in it.
     */
    SimpleConsoleLogger.prototype.logQuery = function (query, parameters, queryRunner) {
        if (this.options === "all" || this.options === true || (Array.isArray(this.options) && this.options.indexOf("query") !== -1)) {
            var sql = query + (parameters && parameters.length ? " -- PARAMETERS: " + this.stringifyParams(parameters) : "");
            console.log("query" + ": " + sql);
        }
    };
    /**
     * Logs query that is failed.
     */
    SimpleConsoleLogger.prototype.logQueryError = function (error, query, parameters, queryRunner) {
        if (this.options === "all" || this.options === true || (Array.isArray(this.options) && this.options.indexOf("error") !== -1)) {
            var sql = query + (parameters && parameters.length ? " -- PARAMETERS: " + this.stringifyParams(parameters) : "");
            console.log("query failed: " + sql);
            console.log("error:", error);
        }
    };
    /**
     * Logs query that is slow.
     */
    SimpleConsoleLogger.prototype.logQuerySlow = function (time, query, parameters, queryRunner) {
        var sql = query + (parameters && parameters.length ? " -- PARAMETERS: " + this.stringifyParams(parameters) : "");
        console.log("query is slow: " + sql);
        console.log("execution time: " + time);
    };
    /**
     * Logs events from the schema build process.
     */
    SimpleConsoleLogger.prototype.logSchemaBuild = function (message, queryRunner) {
        if (this.options === "all" || (Array.isArray(this.options) && this.options.indexOf("schema") !== -1)) {
            console.log(message);
        }
    };
    /**
     * Logs events from the migrations run process.
     */
    SimpleConsoleLogger.prototype.logMigration = function (message, queryRunner) {
        console.log(message);
    };
    /**
     * Perform logging using given logger, or by default to the console.
     * Log has its own level and message.
     */
    SimpleConsoleLogger.prototype.log = function (level, message, queryRunner) {
        switch (level) {
            case "log":
                if (this.options === "all" || (Array.isArray(this.options) && this.options.indexOf("log") !== -1))
                    console.log(message);
                break;
            case "info":
                if (this.options === "all" || (Array.isArray(this.options) && this.options.indexOf("info") !== -1))
                    console.info(message);
                break;
            case "warn":
                if (this.options === "all" || (Array.isArray(this.options) && this.options.indexOf("warn") !== -1))
                    console.warn(message);
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
    SimpleConsoleLogger.prototype.stringifyParams = function (parameters) {
        try {
            return JSON.stringify(parameters);
        }
        catch (error) { // most probably circular objects in parameters
            return parameters;
        }
    };
    return SimpleConsoleLogger;
}());
export { SimpleConsoleLogger };

//# sourceMappingURL=SimpleConsoleLogger.js.map
