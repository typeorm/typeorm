"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetterSqlite3Driver = void 0;
var tslib_1 = require("tslib");
var mkdirp_1 = tslib_1.__importDefault(require("mkdirp"));
var path_1 = tslib_1.__importDefault(require("path"));
var DriverPackageNotInstalledError_1 = require("../../error/DriverPackageNotInstalledError");
var DriverOptionNotSetError_1 = require("../../error/DriverOptionNotSetError");
var PlatformTools_1 = require("../../platform/PlatformTools");
var AbstractSqliteDriver_1 = require("../sqlite-abstract/AbstractSqliteDriver");
var BetterSqlite3QueryRunner_1 = require("./BetterSqlite3QueryRunner");
/**
 * Organizes communication with sqlite DBMS.
 */
var BetterSqlite3Driver = /** @class */ (function (_super) {
    tslib_1.__extends(BetterSqlite3Driver, _super);
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function BetterSqlite3Driver(connection) {
        var _this = _super.call(this, connection) || this;
        _this.connection = connection;
        _this.options = connection.options;
        _this.database = _this.options.database;
        // validate options to make sure everything is set
        if (!_this.options.database)
            throw new DriverOptionNotSetError_1.DriverOptionNotSetError("database");
        // load sqlite package
        _this.loadDependencies();
        return _this;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Closes connection with database.
     */
    BetterSqlite3Driver.prototype.disconnect = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                this.queryRunner = undefined;
                this.databaseConnection.close();
                return [2 /*return*/];
            });
        });
    };
    /**
     * Creates a query runner used to execute database queries.
     */
    BetterSqlite3Driver.prototype.createQueryRunner = function (mode) {
        if (!this.queryRunner)
            this.queryRunner = new BetterSqlite3QueryRunner_1.BetterSqlite3QueryRunner(this);
        return this.queryRunner;
    };
    BetterSqlite3Driver.prototype.normalizeType = function (column) {
        if (column.type === Buffer) {
            return "blob";
        }
        return _super.prototype.normalizeType.call(this, column);
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Creates connection with the database.
     */
    BetterSqlite3Driver.prototype.createDatabaseConnection = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, database, _b, readonly, _c, fileMustExist, _d, timeout, _e, verbose, prepareDatabase, databaseConnection;
            return tslib_1.__generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        if (!(this.options.database !== ":memory:")) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.createDatabaseDirectory(this.options.database)];
                    case 1:
                        _f.sent();
                        _f.label = 2;
                    case 2:
                        _a = this.options, database = _a.database, _b = _a.readonly, readonly = _b === void 0 ? false : _b, _c = _a.fileMustExist, fileMustExist = _c === void 0 ? false : _c, _d = _a.timeout, timeout = _d === void 0 ? 5000 : _d, _e = _a.verbose, verbose = _e === void 0 ? null : _e, prepareDatabase = _a.prepareDatabase;
                        databaseConnection = this.sqlite(database, { readonly: readonly, fileMustExist: fileMustExist, timeout: timeout, verbose: verbose });
                        // we need to enable foreign keys in sqlite to make sure all foreign key related features
                        // working properly. this also makes onDelete to work with sqlite.
                        databaseConnection.exec("PRAGMA foreign_keys = ON");
                        // turn on WAL mode to enhance performance
                        databaseConnection.exec("PRAGMA journal_mode = WAL");
                        // in the options, if encryption key for SQLCipher is setted.
                        if (this.options.key) {
                            databaseConnection.exec("PRAGMA key = " + JSON.stringify(this.options.key));
                        }
                        if (typeof prepareDatabase === "function") {
                            prepareDatabase(databaseConnection);
                        }
                        return [2 /*return*/, databaseConnection];
                }
            });
        });
    };
    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    BetterSqlite3Driver.prototype.loadDependencies = function () {
        try {
            this.sqlite = PlatformTools_1.PlatformTools.load("better-sqlite3");
        }
        catch (e) {
            throw new DriverPackageNotInstalledError_1.DriverPackageNotInstalledError("SQLite", "better-sqlite3");
        }
    };
    /**
     * Auto creates database directory if it does not exist.
     */
    BetterSqlite3Driver.prototype.createDatabaseDirectory = function (fullPath) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, mkdirp_1.default(path_1.default.dirname(fullPath))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return BetterSqlite3Driver;
}(AbstractSqliteDriver_1.AbstractSqliteDriver));
exports.BetterSqlite3Driver = BetterSqlite3Driver;

//# sourceMappingURL=BetterSqlite3Driver.js.map
