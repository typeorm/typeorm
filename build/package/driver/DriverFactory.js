"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverFactory = void 0;
var MissingDriverError_1 = require("../error/MissingDriverError");
var CockroachDriver_1 = require("./cockroachdb/CockroachDriver");
var MongoDriver_1 = require("./mongodb/MongoDriver");
var SqlServerDriver_1 = require("./sqlserver/SqlServerDriver");
var OracleDriver_1 = require("./oracle/OracleDriver");
var SqliteDriver_1 = require("./sqlite/SqliteDriver");
var CordovaDriver_1 = require("./cordova/CordovaDriver");
var ReactNativeDriver_1 = require("./react-native/ReactNativeDriver");
var NativescriptDriver_1 = require("./nativescript/NativescriptDriver");
var SqljsDriver_1 = require("./sqljs/SqljsDriver");
var MysqlDriver_1 = require("./mysql/MysqlDriver");
var PostgresDriver_1 = require("./postgres/PostgresDriver");
var ExpoDriver_1 = require("./expo/ExpoDriver");
var AuroraDataApiDriver_1 = require("./aurora-data-api/AuroraDataApiDriver");
var AuroraDataApiPostgresDriver_1 = require("./aurora-data-api-pg/AuroraDataApiPostgresDriver");
var SapDriver_1 = require("./sap/SapDriver");
var BetterSqlite3Driver_1 = require("./better-sqlite3/BetterSqlite3Driver");
/**
 * Helps to create drivers.
 */
var DriverFactory = /** @class */ (function () {
    function DriverFactory() {
    }
    /**
     * Creates a new driver depend on a given connection's driver type.
     */
    DriverFactory.prototype.create = function (connection) {
        var type = connection.options.type;
        switch (type) {
            case "mysql":
                return new MysqlDriver_1.MysqlDriver(connection);
            case "postgres":
                return new PostgresDriver_1.PostgresDriver(connection);
            case "cockroachdb":
                return new CockroachDriver_1.CockroachDriver(connection);
            case "sap":
                return new SapDriver_1.SapDriver(connection);
            case "mariadb":
                return new MysqlDriver_1.MysqlDriver(connection);
            case "sqlite":
                return new SqliteDriver_1.SqliteDriver(connection);
            case "better-sqlite3":
                return new BetterSqlite3Driver_1.BetterSqlite3Driver(connection);
            case "cordova":
                return new CordovaDriver_1.CordovaDriver(connection);
            case "nativescript":
                return new NativescriptDriver_1.NativescriptDriver(connection);
            case "react-native":
                return new ReactNativeDriver_1.ReactNativeDriver(connection);
            case "sqljs":
                return new SqljsDriver_1.SqljsDriver(connection);
            case "oracle":
                return new OracleDriver_1.OracleDriver(connection);
            case "mssql":
                return new SqlServerDriver_1.SqlServerDriver(connection);
            case "mongodb":
                return new MongoDriver_1.MongoDriver(connection);
            case "expo":
                return new ExpoDriver_1.ExpoDriver(connection);
            case "aurora-data-api":
                return new AuroraDataApiDriver_1.AuroraDataApiDriver(connection);
            case "aurora-data-api-pg":
                return new AuroraDataApiPostgresDriver_1.AuroraDataApiPostgresDriver(connection);
            default:
                throw new MissingDriverError_1.MissingDriverError(type);
        }
    };
    return DriverFactory;
}());
exports.DriverFactory = DriverFactory;

//# sourceMappingURL=DriverFactory.js.map
