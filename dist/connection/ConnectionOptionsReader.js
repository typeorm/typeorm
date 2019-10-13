"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var PlatformTools_1 = require("../platform/PlatformTools");
var ConnectionOptionsEnvReader_1 = require("./options-reader/ConnectionOptionsEnvReader");
var ConnectionOptionsYmlReader_1 = require("./options-reader/ConnectionOptionsYmlReader");
var ConnectionOptionsXmlReader_1 = require("./options-reader/ConnectionOptionsXmlReader");
/**
 * Reads connection options from the ormconfig.
 * Can read from multiple file extensions including env, json, js, xml and yml.
 */
var ConnectionOptionsReader = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function ConnectionOptionsReader(options) {
        this.options = options;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Returns all connection options read from the ormconfig.
     */
    ConnectionOptionsReader.prototype.all = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var options;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.load()];
                    case 1:
                        options = _a.sent();
                        if (!options)
                            throw new Error("No connection options were found in any of configurations file.");
                        return [2 /*return*/, options];
                }
            });
        });
    };
    /**
     * Gets a connection with a given name read from ormconfig.
     * If connection with such name would not be found then it throw error.
     */
    ConnectionOptionsReader.prototype.get = function (name) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var allOptions, targetOptions;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.all()];
                    case 1:
                        allOptions = _a.sent();
                        targetOptions = allOptions.find(function (options) { return options.name === name || (name === "default" && !options.name); });
                        if (!targetOptions)
                            throw new Error("Cannot find connection " + name + " because its not defined in any orm configuration files.");
                        return [2 /*return*/, targetOptions];
                }
            });
        });
    };
    /**
     * Checks if there is a TypeORM configuration file.
     */
    ConnectionOptionsReader.prototype.has = function (name) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var allOptions, targetOptions;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.load()];
                    case 1:
                        allOptions = _a.sent();
                        if (!allOptions)
                            return [2 /*return*/, false];
                        targetOptions = allOptions.find(function (options) { return options.name === name || (name === "default" && !options.name); });
                        return [2 /*return*/, !!targetOptions];
                }
            });
        });
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Loads all connection options from a configuration file.
     *
     * todo: get in count NODE_ENV somehow
     */
    ConnectionOptionsReader.prototype.load = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var connectionOptions, fileFormats, possibleExtension, fileExtension, foundFileFormat, dotenv, dotenv, configFile;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        connectionOptions = undefined;
                        fileFormats = ["env", "js", "ts", "json", "yml", "yaml", "xml"];
                        possibleExtension = this.baseFilePath.substr(this.baseFilePath.lastIndexOf("."));
                        fileExtension = fileFormats.find(function (extension) { return "." + extension === possibleExtension; });
                        foundFileFormat = fileExtension || fileFormats.find(function (format) {
                            return PlatformTools_1.PlatformTools.fileExist(_this.baseFilePath + "." + format);
                        });
                        // if .env file found then load all its variables into process.env using dotenv package
                        if (foundFileFormat === "env") {
                            dotenv = PlatformTools_1.PlatformTools.load("dotenv");
                            dotenv.config({ path: this.baseFilePath });
                        }
                        else if (PlatformTools_1.PlatformTools.fileExist(".env")) {
                            dotenv = PlatformTools_1.PlatformTools.load("dotenv");
                            dotenv.config({ path: ".env" });
                        }
                        configFile = fileExtension ? this.baseFilePath : this.baseFilePath + "." + foundFileFormat;
                        if (!(PlatformTools_1.PlatformTools.getEnvVariable("TYPEORM_CONNECTION") || PlatformTools_1.PlatformTools.getEnvVariable("TYPEORM_URL"))) return [3 /*break*/, 1];
                        connectionOptions = new ConnectionOptionsEnvReader_1.ConnectionOptionsEnvReader().read();
                        return [3 /*break*/, 8];
                    case 1:
                        if (!(foundFileFormat === "js")) return [3 /*break*/, 2];
                        connectionOptions = PlatformTools_1.PlatformTools.load(configFile);
                        return [3 /*break*/, 8];
                    case 2:
                        if (!(foundFileFormat === "ts")) return [3 /*break*/, 3];
                        connectionOptions = PlatformTools_1.PlatformTools.load(configFile);
                        return [3 /*break*/, 8];
                    case 3:
                        if (!(foundFileFormat === "json")) return [3 /*break*/, 4];
                        connectionOptions = PlatformTools_1.PlatformTools.load(configFile);
                        return [3 /*break*/, 8];
                    case 4:
                        if (!(foundFileFormat === "yml")) return [3 /*break*/, 5];
                        connectionOptions = new ConnectionOptionsYmlReader_1.ConnectionOptionsYmlReader().read(configFile);
                        return [3 /*break*/, 8];
                    case 5:
                        if (!(foundFileFormat === "yaml")) return [3 /*break*/, 6];
                        connectionOptions = new ConnectionOptionsYmlReader_1.ConnectionOptionsYmlReader().read(configFile);
                        return [3 /*break*/, 8];
                    case 6:
                        if (!(foundFileFormat === "xml")) return [3 /*break*/, 8];
                        return [4 /*yield*/, new ConnectionOptionsXmlReader_1.ConnectionOptionsXmlReader().read(configFile)];
                    case 7:
                        connectionOptions = _a.sent();
                        _a.label = 8;
                    case 8:
                        // normalize and return connection options
                        if (connectionOptions) {
                            return [2 /*return*/, this.normalizeConnectionOptions(connectionOptions)];
                        }
                        return [2 /*return*/, undefined];
                }
            });
        });
    };
    /**
     * Normalize connection options.
     */
    ConnectionOptionsReader.prototype.normalizeConnectionOptions = function (connectionOptions) {
        var _this = this;
        if (!(connectionOptions instanceof Array))
            connectionOptions = [connectionOptions];
        connectionOptions.forEach(function (options) {
            if (options.entities) {
                var entities = options.entities.map(function (entity) {
                    if (typeof entity === "string" && entity.substr(0, 1) !== "/")
                        return _this.baseDirectory + "/" + entity;
                    return entity;
                });
                Object.assign(connectionOptions, { entities: entities });
            }
            if (options.subscribers) {
                var subscribers = options.subscribers.map(function (subscriber) {
                    if (typeof subscriber === "string" && subscriber.substr(0, 1) !== "/")
                        return _this.baseDirectory + "/" + subscriber;
                    return subscriber;
                });
                Object.assign(connectionOptions, { subscribers: subscribers });
            }
            if (options.migrations) {
                var migrations = options.migrations.map(function (migration) {
                    if (typeof migration === "string" && migration.substr(0, 1) !== "/")
                        return _this.baseDirectory + "/" + migration;
                    return migration;
                });
                Object.assign(connectionOptions, { migrations: migrations });
            }
            // make database path file in sqlite relative to package.json
            if (options.type === "sqlite") {
                if (typeof options.database === "string" &&
                    options.database.substr(0, 1) !== "/" && // unix absolute
                    options.database.substr(1, 2) !== ":\\" && // windows absolute
                    options.database !== ":memory:") {
                    Object.assign(options, {
                        database: _this.baseDirectory + "/" + options.database
                    });
                }
            }
        });
        return connectionOptions;
    };
    Object.defineProperty(ConnectionOptionsReader.prototype, "baseFilePath", {
        /**
         * Gets directory where configuration file should be located and configuration file name.
         */
        get: function () {
            return this.baseDirectory + "/" + this.baseConfigName;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionOptionsReader.prototype, "baseDirectory", {
        /**
         * Gets directory where configuration file should be located.
         */
        get: function () {
            if (this.options && this.options.root)
                return this.options.root;
            return PlatformTools_1.PlatformTools.load("app-root-path").path;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionOptionsReader.prototype, "baseConfigName", {
        /**
         * Gets configuration file name.
         */
        get: function () {
            if (this.options && this.options.configName)
                return this.options.configName;
            return "ormconfig";
        },
        enumerable: true,
        configurable: true
    });
    return ConnectionOptionsReader;
}());
exports.ConnectionOptionsReader = ConnectionOptionsReader;
//# sourceMappingURL=ConnectionOptionsReader.js.map