import type { Driver, DriverConstructor } from "./Driver"
import type { DataSource } from "../data-source/DataSource"

const getDriver = async (
    type: DataSource["options"]["type"],
): Promise<DriverConstructor> => {
    switch (type) {
        case "mysql":
        case "mariadb":
            return (await import("./mysql/MysqlDriver")).MysqlDriver
        case "postgres":
            return (await import("./postgres/PostgresDriver")).PostgresDriver
        case "cockroachdb":
            return (await import("./cockroachdb/CockroachDriver"))
                .CockroachDriver
        case "sap":
            return (await import("./sap/SapDriver")).SapDriver
        case "sqlite":
            return (await import("./sqlite/SqliteDriver")).SqliteDriver
        case "better-sqlite3":
            return (await import("./better-sqlite3/BetterSqlite3Driver"))
                .BetterSqlite3Driver
        case "cordova":
            return (await import("./cordova/CordovaDriver")).CordovaDriver
        case "nativescript":
            return (await import("./nativescript/NativescriptDriver"))
                .NativescriptDriver
        case "react-native":
            return (await import("./react-native/ReactNativeDriver"))
                .ReactNativeDriver
        case "sqljs":
            return (await import("./sqljs/SqljsDriver")).SqljsDriver
        case "oracle":
            return (await import("./oracle/OracleDriver")).OracleDriver
        case "mssql":
            return (await import("./sqlserver/SqlServerDriver")).SqlServerDriver
        case "mongodb":
            return (await import("./mongodb/MongoDriver")).MongoDriver
        case "expo":
            return (await import("./expo/ExpoDriver")).ExpoDriver
        case "aurora-mysql":
            return (await import("./aurora-mysql/AuroraMysqlDriver"))
                .AuroraMysqlDriver
        case "aurora-postgres":
            return (await import("./aurora-postgres/AuroraPostgresDriver"))
                .AuroraPostgresDriver
        case "capacitor":
            return (await import("./capacitor/CapacitorDriver")).CapacitorDriver
        case "spanner":
            return (await import("./spanner/SpannerDriver")).SpannerDriver
        default:
            const { MissingDriverError } = await import(
                "../error/MissingDriverError"
            )
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

/**
 * Helps to create drivers.
 */
export class DriverFactory {
    /**
     * Creates a new driver depend on a given connection's driver type.
     */
    static async create(connection: DataSource): Promise<Driver> {
        const { type } = connection.options
        return new (await getDriver(type))(connection)
    }
}
