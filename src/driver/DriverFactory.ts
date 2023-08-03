import type { Driver, DriverConstructor } from "./Driver"
import type { DataSource } from "../data-source/DataSource"

/**
 * Helps to create drivers.
 */
export class DriverFactory {
    /**
     * Creates a new driver depend on a given connection's driver type.
     */
    create(connection: DataSource): Driver {
        const { type } = connection.options
        return new (this.getDriver(type))(connection)
    }

    private getDriver(type: DataSource["options"]["type"]): DriverConstructor {
        switch (type) {
            case "mysql":
            case "mariadb":
                return require("./mysql/MysqlDriver").MysqlDriver
            case "postgres":
                return require("./postgres/PostgresDriver").PostgresDriver
            case "cockroachdb":
                return require("./cockroachdb/CockroachDriver").CockroachDriver
            case "sap":
                return require("./sap/SapDriver").SapDriver
            case "sqlite":
                return require("./sqlite/SqliteDriver").SqliteDriver
            case "better-sqlite3":
                return require("./better-sqlite3/BetterSqlite3Driver")
                    .BetterSqlite3Driver
            case "cordova":
                return require("./cordova/CordovaDriver").CordovaDriver
            case "nativescript":
                return require("./nativescript/NativescriptDriver")
                    .NativescriptDriver
            case "react-native":
                return require("./react-native/ReactNativeDriver")
                    .ReactNativeDriver
            case "sqljs":
                return require("./sqljs/SqljsDriver").SqljsDriver
            case "oracle":
                return require("./oracle/OracleDriver").OracleDriver
            case "mssql":
                return require("./sqlserver/SqlServerDriver").SqlServerDriver
            case "mongodb":
                return require("./mongodb/MongoDriver").MongoDriver
            case "expo":
                return require("./expo/ExpoDriver").ExpoDriver
            case "aurora-mysql":
                return require("./aurora-mysql/AuroraMysqlDriver")
                    .AuroraMysqlDriver
            case "aurora-postgres":
                return require("./aurora-postgres/AuroraPostgresDriver")
                    .AuroraPostgresDriver
            case "capacitor":
                return require("./capacitor/CapacitorDriver").CapacitorDriver
            case "spanner":
                return require("./spanner/SpannerDriver").SpannerDriver
            default:
                const {
                    MissingDriverError,
                } = require("../error/MissingDriverError")
                throw new MissingDriverError(type, [
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
                ])
        }
    }
}
