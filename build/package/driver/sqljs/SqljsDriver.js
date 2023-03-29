"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqljsDriver = void 0;
var tslib_1 = require("tslib");
var AbstractSqliteDriver_1 = require("../sqlite-abstract/AbstractSqliteDriver");
var SqljsQueryRunner_1 = require("./SqljsQueryRunner");
var DriverPackageNotInstalledError_1 = require("../../error/DriverPackageNotInstalledError");
var DriverOptionNotSetError_1 = require("../../error/DriverOptionNotSetError");
var PlatformTools_1 = require("../../platform/PlatformTools");
var OrmUtils_1 = require("../../util/OrmUtils");
var SqljsDriver = /** @class */ (function (_super) {
    tslib_1.__extends(SqljsDriver, _super);
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function SqljsDriver(connection) {
        var _this = _super.call(this, connection) || this;
        // If autoSave is enabled by user, location or autoSaveCallback have to be set
        // because either autoSave saves to location or calls autoSaveCallback.
        if (_this.options.autoSave && !_this.options.location && !_this.options.autoSaveCallback) {
            throw new DriverOptionNotSetError_1.DriverOptionNotSetError("location or autoSaveCallback");
        }
        // load sql.js package
        _this.loadDependencies();
        return _this;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Performs connection to the database.
     */
    SqljsDriver.prototype.connect = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, this.createDatabaseConnection()];
                    case 1:
                        _a.databaseConnection = _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Closes connection with database.
     */
    SqljsDriver.prototype.disconnect = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (ok, fail) {
                        try {
                            _this.queryRunner = undefined;
                            _this.databaseConnection.close();
                            ok();
                        }
                        catch (e) {
                            fail(e);
                        }
                    })];
            });
        });
    };
    /**
     * Creates a query runner used to execute database queries.
     */
    SqljsDriver.prototype.createQueryRunner = function (mode) {
        if (!this.queryRunner)
            this.queryRunner = new SqljsQueryRunner_1.SqljsQueryRunner(this);
        return this.queryRunner;
    };
    /**
     * Loads a database from a given file (Node.js), local storage key (browser) or array.
     * This will delete the current database!
     */
    SqljsDriver.prototype.load = function (fileNameOrLocalStorageOrData, checkIfFileOrLocalStorageExists) {
        if (checkIfFileOrLocalStorageExists === void 0) { checkIfFileOrLocalStorageExists = true; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var database, localStorageContent;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(typeof fileNameOrLocalStorageOrData === "string")) return [3 /*break*/, 8];
                        if (!(PlatformTools_1.PlatformTools.type === "node")) return [3 /*break*/, 1];
                        // Node.js
                        // fileNameOrLocalStorageOrData should be a path to the file
                        if (PlatformTools_1.PlatformTools.fileExist(fileNameOrLocalStorageOrData)) {
                            database = PlatformTools_1.PlatformTools.readFileSync(fileNameOrLocalStorageOrData);
                            return [2 /*return*/, this.createDatabaseConnectionWithImport(database)];
                        }
                        else if (checkIfFileOrLocalStorageExists) {
                            throw new Error("File " + fileNameOrLocalStorageOrData + " does not exist");
                        }
                        else {
                            // File doesn't exist and checkIfFileOrLocalStorageExists is set to false.
                            // Therefore open a database without importing an existing file.
                            // File will be written on first write operation.
                            return [2 /*return*/, this.createDatabaseConnectionWithImport()];
                        }
                        return [3 /*break*/, 7];
                    case 1:
                        localStorageContent = null;
                        if (!this.options.useLocalForage) return [3 /*break*/, 5];
                        if (!window.localforage) return [3 /*break*/, 3];
                        return [4 /*yield*/, window.localforage.getItem(fileNameOrLocalStorageOrData)];
                    case 2:
                        localStorageContent = _a.sent();
                        return [3 /*break*/, 4];
                    case 3: throw new Error("localforage is not defined - please import localforage.js into your site");
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        localStorageContent = PlatformTools_1.PlatformTools.getGlobalVariable().localStorage.getItem(fileNameOrLocalStorageOrData);
                        _a.label = 6;
                    case 6:
                        if (localStorageContent != null) {
                            // localStorage value exists.
                            return [2 /*return*/, this.createDatabaseConnectionWithImport(JSON.parse(localStorageContent))];
                        }
                        else if (checkIfFileOrLocalStorageExists) {
                            throw new Error("File " + fileNameOrLocalStorageOrData + " does not exist");
                        }
                        else {
                            // localStorage value doesn't exist and checkIfFileOrLocalStorageExists is set to false.
                            // Therefore open a database without importing anything.
                            // localStorage value will be written on first write operation.
                            return [2 /*return*/, this.createDatabaseConnectionWithImport()];
                        }
                        _a.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8: return [2 /*return*/, this.createDatabaseConnectionWithImport(fileNameOrLocalStorageOrData)];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Saved the current database to the given file (Node.js), local storage key (browser) or
     * indexedDB key (browser with enabled useLocalForage option).
     * If no location path is given, the location path in the options (if specified) will be used.
     */
    SqljsDriver.prototype.save = function (location) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var path, content, e_1, database, databaseArray;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!location && !this.options.location) {
                            throw new Error("No location is set, specify a location parameter or add the location option to your configuration");
                        }
                        path = "";
                        if (location) {
                            path = location;
                        }
                        else if (this.options.location) {
                            path = this.options.location;
                        }
                        if (!(PlatformTools_1.PlatformTools.type === "node")) return [3 /*break*/, 5];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        content = Buffer.from(this.databaseConnection.export());
                        return [4 /*yield*/, PlatformTools_1.PlatformTools.writeFile(path, content)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        throw new Error("Could not save database, error: " + e_1);
                    case 4: return [3 /*break*/, 10];
                    case 5:
                        database = this.databaseConnection.export();
                        databaseArray = [].slice.call(database);
                        if (!this.options.useLocalForage) return [3 /*break*/, 9];
                        if (!window.localforage) return [3 /*break*/, 7];
                        return [4 /*yield*/, window.localforage.setItem(path, JSON.stringify(databaseArray))];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 7: throw new Error("localforage is not defined - please import localforage.js into your site");
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        PlatformTools_1.PlatformTools.getGlobalVariable().localStorage.setItem(path, JSON.stringify(databaseArray));
                        _a.label = 10;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * This gets called by the QueryRunner when a change to the database is made.
     * If a custom autoSaveCallback is specified, it get's called with the database as Uint8Array,
     * otherwise the save method is called which saves it to file (Node.js), local storage (browser)
     * or indexedDB (browser with enabled useLocalForage option).
     */
    SqljsDriver.prototype.autoSave = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.options.autoSave) return [3 /*break*/, 4];
                        if (!this.options.autoSaveCallback) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.options.autoSaveCallback(this.export())];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.save()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns the current database as Uint8Array.
     */
    SqljsDriver.prototype.export = function () {
        return this.databaseConnection.export();
    };
    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     */
    SqljsDriver.prototype.createGeneratedMap = function (metadata, insertResult) {
        var _this = this;
        var generatedMap = metadata.generatedColumns.reduce(function (map, generatedColumn) {
            // seems to be the only way to get the inserted id, see https://github.com/kripken/sql.js/issues/77
            if (generatedColumn.isPrimary && generatedColumn.generationStrategy === "increment") {
                var query = "SELECT last_insert_rowid()";
                try {
                    var result = _this.databaseConnection.exec(query);
                    _this.connection.logger.logQuery(query);
                    return OrmUtils_1.OrmUtils.mergeDeep(map, generatedColumn.createValueMap(result[0].values[0][0]));
                }
                catch (e) {
                    _this.connection.logger.logQueryError(e, query, []);
                }
            }
            return map;
        }, {});
        return Object.keys(generatedMap).length > 0 ? generatedMap : undefined;
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Creates connection with the database.
     * If the location option is set, the database is loaded first.
     */
    SqljsDriver.prototype.createDatabaseConnection = function () {
        if (this.options.location) {
            return this.load(this.options.location, false);
        }
        return this.createDatabaseConnectionWithImport(this.options.database);
    };
    /**
     * Creates connection with an optional database.
     * If database is specified it is loaded, otherwise a new empty database is created.
     */
    SqljsDriver.prototype.createDatabaseConnectionWithImport = function (database) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var isLegacyVersion, sqlite, _a;
            var _this = this;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        isLegacyVersion = typeof this.sqlite.Database === "function";
                        if (!isLegacyVersion) return [3 /*break*/, 1];
                        _a = this.sqlite;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.sqlite(this.options.sqlJsConfig)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        sqlite = _a;
                        if (database && database.length > 0) {
                            this.databaseConnection = new sqlite.Database(database);
                        }
                        else {
                            this.databaseConnection = new sqlite.Database();
                        }
                        // Enable foreign keys for database
                        return [2 /*return*/, new Promise(function (ok, fail) {
                                try {
                                    _this.databaseConnection.exec("PRAGMA foreign_keys = ON;");
                                    ok(_this.databaseConnection);
                                }
                                catch (e) {
                                    fail(e);
                                }
                            })];
                }
            });
        });
    };
    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    SqljsDriver.prototype.loadDependencies = function () {
        if (PlatformTools_1.PlatformTools.type === "browser") {
            this.sqlite = window.SQL;
        }
        else {
            try {
                this.sqlite = PlatformTools_1.PlatformTools.load("sql.js");
            }
            catch (e) {
                throw new DriverPackageNotInstalledError_1.DriverPackageNotInstalledError("sql.js", "sql.js");
            }
        }
    };
    return SqljsDriver;
}(AbstractSqliteDriver_1.AbstractSqliteDriver));
exports.SqljsDriver = SqljsDriver;

//# sourceMappingURL=SqljsDriver.js.map
