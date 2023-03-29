"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CordovaDriver = void 0;
var tslib_1 = require("tslib");
var AbstractSqliteDriver_1 = require("../sqlite-abstract/AbstractSqliteDriver");
var CordovaQueryRunner_1 = require("./CordovaQueryRunner");
var DriverOptionNotSetError_1 = require("../../error/DriverOptionNotSetError");
var DriverPackageNotInstalledError_1 = require("../../error/DriverPackageNotInstalledError");
var CordovaDriver = /** @class */ (function (_super) {
    tslib_1.__extends(CordovaDriver, _super);
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function CordovaDriver(connection) {
        var _this = _super.call(this, connection) || this;
        // this.connection = connection;
        // this.options = connection.options as CordovaConnectionOptions;
        _this.database = _this.options.database;
        // validate options to make sure everything is set
        if (!_this.options.database)
            throw new DriverOptionNotSetError_1.DriverOptionNotSetError("database");
        if (!_this.options.location)
            throw new DriverOptionNotSetError_1.DriverOptionNotSetError("location");
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
    CordovaDriver.prototype.disconnect = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (ok, fail) {
                        _this.queryRunner = undefined;
                        _this.databaseConnection.close(ok, fail);
                    })];
            });
        });
    };
    /**
     * Creates a query runner used to execute database queries.
     */
    CordovaDriver.prototype.createQueryRunner = function (mode) {
        if (!this.queryRunner)
            this.queryRunner = new CordovaQueryRunner_1.CordovaQueryRunner(this);
        return this.queryRunner;
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Creates connection with the database.
     */
    CordovaDriver.prototype.createDatabaseConnection = function () {
        var _this = this;
        return new Promise(function (ok, fail) {
            var options = Object.assign({}, {
                name: _this.options.database,
                location: _this.options.location,
            }, _this.options.extra || {});
            _this.sqlite.openDatabase(options, function (db) {
                var databaseConnection = db;
                // we need to enable foreign keys in sqlite to make sure all foreign key related features
                // working properly. this also makes onDelete to work with sqlite.
                databaseConnection.executeSql("PRAGMA foreign_keys = ON;", [], function (result) {
                    ok(databaseConnection);
                }, function (error) {
                    fail(error);
                });
            }, function (error) {
                fail(error);
            });
        });
    };
    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    CordovaDriver.prototype.loadDependencies = function () {
        try {
            this.sqlite = window.sqlitePlugin;
        }
        catch (e) {
            throw new DriverPackageNotInstalledError_1.DriverPackageNotInstalledError("Cordova-SQLite", "cordova-sqlite-storage");
        }
    };
    return CordovaDriver;
}(AbstractSqliteDriver_1.AbstractSqliteDriver));
exports.CordovaDriver = CordovaDriver;

//# sourceMappingURL=CordovaDriver.js.map
