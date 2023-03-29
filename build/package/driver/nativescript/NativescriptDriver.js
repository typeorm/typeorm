"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativescriptDriver = void 0;
var tslib_1 = require("tslib");
var AbstractSqliteDriver_1 = require("../sqlite-abstract/AbstractSqliteDriver");
var NativescriptQueryRunner_1 = require("./NativescriptQueryRunner");
var DriverOptionNotSetError_1 = require("../../error/DriverOptionNotSetError");
var DriverPackageNotInstalledError_1 = require("../../error/DriverPackageNotInstalledError");
/**
 * Organizes communication with sqlite DBMS within Nativescript.
 */
var NativescriptDriver = /** @class */ (function (_super) {
    tslib_1.__extends(NativescriptDriver, _super);
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function NativescriptDriver(connection) {
        var _this = _super.call(this, connection) || this;
        _this.connection = connection;
        _this.options = connection.options;
        _this.database = _this.options.database;
        _this.driver = _this.options.driver;
        // validate options to make sure everything is set
        if (!_this.options.database) {
            throw new DriverOptionNotSetError_1.DriverOptionNotSetError("database");
        }
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
    NativescriptDriver.prototype.disconnect = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (ok, fail) {
                        _this.queryRunner = undefined;
                        _this.databaseConnection.close().then(ok).catch(fail);
                    })];
            });
        });
    };
    /**
     * Creates a query runner used to execute database queries.
     */
    NativescriptDriver.prototype.createQueryRunner = function (mode) {
        if (!this.queryRunner) {
            this.queryRunner = new NativescriptQueryRunner_1.NativescriptQueryRunner(this);
        }
        return this.queryRunner;
    };
    NativescriptDriver.prototype.normalizeType = function (column) {
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
    NativescriptDriver.prototype.createDatabaseConnection = function () {
        var _this = this;
        return new Promise(function (ok, fail) {
            var options = Object.assign({}, {
                readOnly: _this.options.readOnly,
                key: _this.options.key,
                multithreading: _this.options.multithreading,
                migrate: _this.options.migrate,
                iosFlags: _this.options.iosFlags,
                androidFlags: _this.options.androidFlags,
            }, _this.options.extra || {});
            new _this.sqlite(_this.options.database, options, function (err, db) {
                if (err)
                    return fail(err);
                // use object mode to work with TypeORM
                db.resultType(_this.sqlite.RESULTSASOBJECT);
                // we need to enable foreign keys in sqlite to make sure all foreign key related features
                // working properly. this also makes onDelete work with sqlite.
                db.execSQL("PRAGMA foreign_keys = ON;", [], function (err, result) {
                    if (err)
                        return fail(err);
                    // We are all set
                    ok(db);
                });
            });
        });
    };
    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    NativescriptDriver.prototype.loadDependencies = function () {
        this.sqlite = this.driver;
        if (!this.driver) {
            throw new DriverPackageNotInstalledError_1.DriverPackageNotInstalledError("Nativescript", "nativescript-sqlite");
        }
    };
    return NativescriptDriver;
}(AbstractSqliteDriver_1.AbstractSqliteDriver));
exports.NativescriptDriver = NativescriptDriver;

//# sourceMappingURL=NativescriptDriver.js.map
