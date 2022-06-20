"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverFactory = void 0;
const MissingDriverError_1 = require("../error/MissingDriverError");
const CockroachDriver_1 = require("./cockroachdb/CockroachDriver");
const MongoDriver_1 = require("./mongodb/MongoDriver");
const SqlServerDriver_1 = require("./sqlserver/SqlServerDriver");
const OracleDriver_1 = require("./oracle/OracleDriver");
const SqliteDriver_1 = require("./sqlite/SqliteDriver");
const CordovaDriver_1 = require("./cordova/CordovaDriver");
const ReactNativeDriver_1 = require("./react-native/ReactNativeDriver");
const NativescriptDriver_1 = require("./nativescript/NativescriptDriver");
const SqljsDriver_1 = require("./sqljs/SqljsDriver");
const MysqlDriver_1 = require("./mysql/MysqlDriver");
const PostgresDriver_1 = require("./postgres/PostgresDriver");
const ExpoDriver_1 = require("./expo/ExpoDriver");
const AuroraMysqlDriver_1 = require("./aurora-mysql/AuroraMysqlDriver");
const AuroraPostgresDriver_1 = require("./aurora-postgres/AuroraPostgresDriver");
const SapDriver_1 = require("./sap/SapDriver");
const BetterSqlite3Driver_1 = require("./better-sqlite3/BetterSqlite3Driver");
const CapacitorDriver_1 = require("./capacitor/CapacitorDriver");
const SpannerDriver_1 = require("./spanner/SpannerDriver");
/**
 * Helps to create drivers.
 */
class DriverFactory {
    /**
     * Creates a new driver depend on a given connection's driver type.
     */
    create(connection) {
        const { type } = connection.options;
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
            case "aurora-mysql":
                return new AuroraMysqlDriver_1.AuroraMysqlDriver(connection);
            case "aurora-postgres":
                return new AuroraPostgresDriver_1.AuroraPostgresDriver(connection);
            case "capacitor":
                return new CapacitorDriver_1.CapacitorDriver(connection);
            case "spanner":
                return new SpannerDriver_1.SpannerDriver(connection);
            default:
                throw new MissingDriverError_1.MissingDriverError(type, [
                    "aurora-mysql",
                    "aurora-postgres",
                    "better-sqlite3",
                    "capacitor",
                    "cockroachdb",
                    "cordova",
                    "expo",
                    "mariadb",
                    "mongodb",
                    "mssql",
                    "mysql",
                    "nativescript",
                    "oracle",
                    "postgres",
                    "react-native",
                    "sap",
                    "sqlite",
                    "sqljs",
                    "spanner",
                ]);
        }
    }
}
exports.DriverFactory = DriverFactory;

//# sourceMappingURL=DriverFactory.js.map
