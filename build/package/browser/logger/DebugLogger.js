import debug from "debug";
import { PlatformTools } from "../platform/PlatformTools";
/**
 * Performs logging of the events in TypeORM via debug library.
 */
var DebugLogger = /** @class */ (function () {
    function DebugLogger() {
        this.debugQueryLog = debug("typeorm:query:log");
        this.debugQueryError = debug("typeorm:query:error");
        this.debugQuerySlow = debug("typeorm:query:slow");
        this.debugSchemaBuild = debug("typeorm:schema");
        this.debugMigration = debug("typeorm:migration");
        this.debugLog = debug("typeorm:log");
        this.debugInfo = debug("typeorm:info");
        this.debugWarn = debug("typeorm:warn");
    }
    /**
     * Logs query and parameters used in it.
     */
    DebugLogger.prototype.logQuery = function (query, parameters, queryRunner) {
        if (this.debugQueryLog.enabled) {
            this.debugQueryLog(PlatformTools.highlightSql(query) + ";");
            if (parameters && parameters.length) {
                this.debugQueryLog("parameters:", parameters);
            }
        }
    };
    /**
     * Logs query that failed.
     */
    DebugLogger.prototype.logQueryError = function (error, query, parameters, queryRunner) {
        if (this.debugQueryError.enabled) {
            this.debugQueryError(PlatformTools.highlightSql(query) + ";");
            if (parameters && parameters.length) {
                this.debugQueryError("parameters:", parameters);
            }
            this.debugQueryError("error: ", error);
        }
    };
    /**
     * Logs query that is slow.
     */
    DebugLogger.prototype.logQuerySlow = function (time, query, parameters, queryRunner) {
        if (this.debugQuerySlow.enabled) {
            this.debugQuerySlow(PlatformTools.highlightSql(query) + ";");
            if (parameters && parameters.length) {
                this.debugQuerySlow("parameters:", parameters);
            }
            this.debugQuerySlow("execution time:", time);
        }
    };
    /**
     * Logs events from the schema build process.
     */
    DebugLogger.prototype.logSchemaBuild = function (message, queryRunner) {
        if (this.debugSchemaBuild.enabled) {
            this.debugSchemaBuild(message);
        }
    };
    /**
     * Logs events from the migration run process.
     */
    DebugLogger.prototype.logMigration = function (message, queryRunner) {
        if (this.debugMigration.enabled) {
            this.debugMigration(message);
        }
    };
    /**
     * Perform logging using given logger.
     * Log has its own level and message.
     */
    DebugLogger.prototype.log = function (level, message, queryRunner) {
        switch (level) {
            case "log":
                if (this.debugLog.enabled) {
                    this.debugLog(message);
                }
                break;
            case "info":
                if (this.debugInfo.enabled) {
                    this.debugInfo(message);
                }
                break;
            case "warn":
                if (this.debugWarn.enabled) {
                    this.debugWarn(message);
                }
                break;
        }
    };
    return DebugLogger;
}());
export { DebugLogger };

//# sourceMappingURL=DebugLogger.js.map
