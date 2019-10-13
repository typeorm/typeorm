"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var path = require("path");
var fs = require("fs");
var cli_highlight_1 = require("cli-highlight");
var fs_1 = require("fs");
exports.ReadStream = fs_1.ReadStream;
var events_1 = require("events");
exports.EventEmitter = events_1.EventEmitter;
var stream_1 = require("stream");
exports.Readable = stream_1.Readable;
exports.Writable = stream_1.Writable;
var chalk = require("chalk");
/**
 * Platform-specific tools.
 */
var PlatformTools = /** @class */ (function () {
    function PlatformTools() {
    }
    /**
     * Gets global variable where global stuff can be stored.
     */
    PlatformTools.getGlobalVariable = function () {
        return global;
    };
    /**
     * Loads ("require"-s) given file or package.
     * This operation only supports on node platform
     */
    PlatformTools.load = function (name) {
        // if name is not absolute or relative, then try to load package from the node_modules of the directory we are currently in
        // this is useful when we are using typeorm package globally installed and it accesses drivers
        // that are not installed globally
        try {
            // switch case to explicit require statements for webpack compatibility.
            switch (name) {
                /**
                * mongodb
                */
                case "mongodb":
                    return require("mongodb");
                /**
                * mysql
                */
                case "mysql":
                    return require("mysql");
                case "mysql2":
                    return require("mysql2");
                /**
                * oracle
                */
                case "oracledb":
                    return require("oracledb");
                /**
                * postgres
                */
                case "pg":
                    return require("pg");
                case "pg-native":
                    return require("pg-native");
                case "pg-query-stream":
                    return require("pg-query-stream");
                /**
                * redis
                */
                case "redis":
                    return require("redis");
                /**
                 * ioredis
                 */
                case "ioredis":
                case "ioredis/cluster":
                    return require("ioredis");
                /**
                * sqlite
                */
                case "sqlite3":
                    return require("sqlite3");
                /**
                * sql.js
                */
                case "sql.js":
                    return require("sql.js");
                /**
                * sqlserver
                */
                case "mssql":
                    return require("mssql");
                /**
                * other modules
                */
                case "mkdirp":
                    return require("mkdirp");
                case "path":
                    return require("path");
                case "debug":
                    return require("debug");
                case "app-root-path":
                    return require("app-root-path");
                case "glob":
                    return require("glob");
                case "typeorm-aurora-data-api-driver":
                    return require("typeorm-aurora-data-api-driver");
                /**
                * default
                */
                default:
                    return require(name);
            }
        }
        catch (err) {
            if (!path.isAbsolute(name) && name.substr(0, 2) !== "./" && name.substr(0, 3) !== "../") {
                return require(path.resolve(process.cwd() + "/node_modules/" + name));
            }
            throw err;
        }
    };
    /**
     * Normalizes given path. Does "path.normalize".
     */
    PlatformTools.pathNormalize = function (pathStr) {
        return path.normalize(pathStr);
    };
    /**
     * Gets file extension. Does "path.extname".
     */
    PlatformTools.pathExtname = function (pathStr) {
        return path.extname(pathStr);
    };
    /**
     * Resolved given path. Does "path.resolve".
     */
    PlatformTools.pathResolve = function (pathStr) {
        return path.resolve(pathStr);
    };
    /**
     * Synchronously checks if file exist. Does "fs.existsSync".
     */
    PlatformTools.fileExist = function (pathStr) {
        return fs.existsSync(pathStr);
    };
    PlatformTools.readFileSync = function (filename) {
        return fs.readFileSync(filename);
    };
    PlatformTools.appendFileSync = function (filename, data) {
        fs.appendFileSync(filename, data);
    };
    PlatformTools.writeFile = function (path, data) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (ok, fail) {
                        fs.writeFile(path, data, function (err) {
                            if (err)
                                fail(err);
                            ok();
                        });
                    })];
            });
        });
    };
    /**
     * Gets environment variable.
     */
    PlatformTools.getEnvVariable = function (name) {
        return process.env[name];
    };
    /**
     * Highlights sql string to be print in the console.
     */
    PlatformTools.highlightSql = function (sql) {
        var theme = {
            "keyword": chalk.blueBright,
            "literal": chalk.blueBright,
            "string": chalk.white,
            "type": chalk.magentaBright,
            "built_in": chalk.magentaBright,
            "comment": chalk.gray,
        };
        return cli_highlight_1.highlight(sql, { theme: theme, language: "sql" });
    };
    /**
     * Highlights json string to be print in the console.
     */
    PlatformTools.highlightJson = function (json) {
        return cli_highlight_1.highlight(json, { language: "json" });
    };
    /**
     * Logging functions needed by AdvancedConsoleLogger
     */
    PlatformTools.logInfo = function (prefix, info) {
        console.log(chalk.gray.underline(prefix), info);
    };
    PlatformTools.logError = function (prefix, error) {
        console.log(chalk.underline.red(prefix), error);
    };
    PlatformTools.logWarn = function (prefix, warning) {
        console.log(chalk.underline.yellow(prefix), warning);
    };
    PlatformTools.log = function (message) {
        console.log(chalk.underline(message));
    };
    PlatformTools.warn = function (message) {
        return chalk.yellow(message);
    };
    /**
     * Type of the currently running platform.
     */
    PlatformTools.type = "node";
    return PlatformTools;
}());
exports.PlatformTools = PlatformTools;
//# sourceMappingURL=PlatformTools.js.map