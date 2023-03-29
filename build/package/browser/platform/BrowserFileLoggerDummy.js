import { __extends } from "tslib";
/**
 * Performs logging of the events in TypeORM.
 * This version of logger logs everything into ormlogs.log file.
 */
var DummyLogger = /** @class */ (function () {
    function DummyLogger() {
    }
    /**
     * Logs query and parameters used in it.
     */
    DummyLogger.prototype.logQuery = function () {
        throw new Error('This logger is not applicable in a browser context');
    };
    /**
     * Logs query that is failed.
     */
    DummyLogger.prototype.logQueryError = function () {
        throw new Error('This logger is not applicable in a browser context');
    };
    /**
     * Logs query that is slow.
     */
    DummyLogger.prototype.logQuerySlow = function () {
        throw new Error('This logger is not applicable in a browser context');
    };
    /**
     * Logs events from the schema build process.
     */
    DummyLogger.prototype.logSchemaBuild = function () {
        throw new Error('This logger is not applicable in a browser context');
    };
    /**
     * Logs events from the migrations run process.
     */
    DummyLogger.prototype.logMigration = function () {
        throw new Error('This logger is not applicable in a browser context');
    };
    /**
     * Perform logging using given logger, or by default to the console.
     * Log has its own level and message.
     */
    DummyLogger.prototype.log = function () {
        throw new Error('This logger is not applicable in a browser context');
    };
    return DummyLogger;
}());
export { DummyLogger };
var FileLogger = /** @class */ (function (_super) {
    __extends(FileLogger, _super);
    function FileLogger() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return FileLogger;
}(DummyLogger));
export { FileLogger };

//# sourceMappingURL=BrowserFileLoggerDummy.js.map
