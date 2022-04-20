"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugLogger = void 0;
var tslib_1 = require("tslib");
var debug_1 = tslib_1.__importDefault(require("debug"));
var PlatformTools_1 = require("../platform/PlatformTools");
/**
 * Performs logging of the events in TypeORM via debug library.
 */
var DebugLogger = /** @class */ (function () {
    function DebugLogger() {
        this.debugQueryLog = debug_1.default("typeorm:query:log");
        this.debugQueryError = debug_1.default("typeorm:query:error");
        this.debugQuerySlow = debug_1.default("typeorm:query:slow");
        this.debugSchemaBuild = debug_1.default("typeorm:schema");
        this.debugMigration = debug_1.default("typeorm:migration");
        this.debugLog = debug_1.default("typeorm:log");
        this.debugInfo = debug_1.default("typeorm:info");
        this.debugWarn = debug_1.default("typeorm:warn");
    }
    /**
     * Logs query and parameters used in it.
     */
    DebugLogger.prototype.logQuery = function (query, parameters, queryRunner) {
        if (this.debugQueryLog.enabled) {
            this.debugQueryLog(PlatformTools_1.PlatformTools.highlightSql(query) + ";");
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
            this.debugQueryError(PlatformTools_1.PlatformTools.highlightSql(query) + ";");
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
            this.debugQuerySlow(PlatformTools_1.PlatformTools.highlightSql(query) + ";");
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
exports.DebugLogger = DebugLogger;

//# sourceMappingURL=DebugLogger.js.map
