"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformTools = exports.Writable = exports.Readable = exports.EventEmitter = exports.ReadStream = void 0;
const tslib_1 = require("tslib");
const path = tslib_1.__importStar(require("path"));
const fs = tslib_1.__importStar(require("fs"));
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const cli_highlight_1 = require("cli-highlight");
var fs_1 = require("fs");
Object.defineProperty(exports, "ReadStream", { enumerable: true, get: function () { return fs_1.ReadStream; } });
var events_1 = require("events");
Object.defineProperty(exports, "EventEmitter", { enumerable: true, get: function () { return events_1.EventEmitter; } });
var stream_1 = require("stream");
Object.defineProperty(exports, "Readable", { enumerable: true, get: function () { return stream_1.Readable; } });
Object.defineProperty(exports, "Writable", { enumerable: true, get: function () { return stream_1.Writable; } });
/**
 * Platform-specific tools.
 */
class PlatformTools {
    /**
     * Gets global variable where global stuff can be stored.
     */
    static getGlobalVariable() {
        return global;
    }
    /**
     * Loads ("require"-s) given file or package.
     * This operation only supports on node platform
     */
    static load(name) {
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
                * hana
                */
                case "@sap/hana-client":
                    return require("@sap/hana-client");
                case "hdb-pool":
                    return require("hdb-pool");
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
                case "typeorm-aurora-data-api-driver":
                    return require("typeorm-aurora-data-api-driver");
                /**
                * redis
                */
                case "redis":
                    return require("redis");
                case "ioredis":
                    return require("ioredis");
                /**
                 * better-sqlite3
                 */
                case "better-sqlite3":
                    return require("better-sqlite3");
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
                 * react-native-sqlite
                 */
                case "react-native-sqlite-storage":
                    return require("react-native-sqlite-storage");
            }
        }
        catch (err) {
            return require(path.resolve(process.cwd() + "/node_modules/" + name));
        }
        // If nothing above matched and we get here, the package was not listed within PlatformTools
        // and is an Invalid Package.  To make it explicit that this is NOT the intended use case for
        // PlatformTools.load - it's not just a way to replace `require` all willy-nilly - let's throw
        // an error.
        throw new TypeError(`Invalid Package for PlatformTools.load: ${name}`);
    }
    /**
     * Normalizes given path. Does "path.normalize".
     */
    static pathNormalize(pathStr) {
        return path.normalize(pathStr);
    }
    /**
     * Gets file extension. Does "path.extname".
     */
    static pathExtname(pathStr) {
        return path.extname(pathStr);
    }
    /**
     * Resolved given path. Does "path.resolve".
     */
    static pathResolve(pathStr) {
        return path.resolve(pathStr);
    }
    /**
     * Synchronously checks if file exist. Does "fs.existsSync".
     */
    static fileExist(pathStr) {
        return fs.existsSync(pathStr);
    }
    static readFileSync(filename) {
        return fs.readFileSync(filename);
    }
    static appendFileSync(filename, data) {
        fs.appendFileSync(filename, data);
    }
    static writeFile(path, data) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return new Promise((ok, fail) => {
                fs.writeFile(path, data, (err) => {
                    if (err)
                        fail(err);
                    ok();
                });
            });
        });
    }
    /**
     * Loads a dotenv file into the environment variables.
     *
     * @param path The file to load as a dotenv configuration
     */
    static dotenv(pathStr) {
        dotenv_1.default.config({ path: pathStr });
    }
    /**
     * Gets environment variable.
     */
    static getEnvVariable(name) {
        return process.env[name];
    }
    /**
     * Highlights sql string to be print in the console.
     */
    static highlightSql(sql) {
        const theme = {
            "keyword": chalk_1.default.blueBright,
            "literal": chalk_1.default.blueBright,
            "string": chalk_1.default.white,
            "type": chalk_1.default.magentaBright,
            "built_in": chalk_1.default.magentaBright,
            "comment": chalk_1.default.gray,
        };
        return (0, cli_highlight_1.highlight)(sql, { theme: theme, language: "sql" });
    }
    /**
     * Highlights json string to be print in the console.
     */
    static highlightJson(json) {
        return (0, cli_highlight_1.highlight)(json, { language: "json" });
    }
    /**
     * Logging functions needed by AdvancedConsoleLogger
     */
    static logInfo(prefix, info) {
        console.log(chalk_1.default.gray.underline(prefix), info);
    }
    static logError(prefix, error) {
        console.log(chalk_1.default.underline.red(prefix), error);
    }
    static logWarn(prefix, warning) {
        console.log(chalk_1.default.underline.yellow(prefix), warning);
    }
    static log(message) {
        console.log(chalk_1.default.underline(message));
    }
    static warn(message) {
        return chalk_1.default.yellow(message);
    }
}
exports.PlatformTools = PlatformTools;
/**
 * Type of the currently running platform.
 */
PlatformTools.type = "node";
//# sourceMappingURL=PlatformTools.js.map