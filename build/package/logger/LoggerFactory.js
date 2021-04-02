"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerFactory = void 0;
var SimpleConsoleLogger_1 = require("./SimpleConsoleLogger");
var AdvancedConsoleLogger_1 = require("./AdvancedConsoleLogger");
var FileLogger_1 = require("./FileLogger");
var DebugLogger_1 = require("./DebugLogger");
/**
 * Helps to create logger instances.
 */
var LoggerFactory = /** @class */ (function () {
    function LoggerFactory() {
    }
    /**
     * Creates a new logger depend on a given connection's driver.
     */
    LoggerFactory.prototype.create = function (logger, options) {
        if (logger instanceof Object)
            return logger;
        if (logger) {
            switch (logger) {
                case "simple-console":
                    return new SimpleConsoleLogger_1.SimpleConsoleLogger(options);
                case "file":
                    return new FileLogger_1.FileLogger(options);
                case "advanced-console":
                    return new AdvancedConsoleLogger_1.AdvancedConsoleLogger(options);
                case "debug":
                    return new DebugLogger_1.DebugLogger();
            }
        }
        return new AdvancedConsoleLogger_1.AdvancedConsoleLogger(options);
    };
    return LoggerFactory;
}());
exports.LoggerFactory = LoggerFactory;

//# sourceMappingURL=LoggerFactory.js.map
