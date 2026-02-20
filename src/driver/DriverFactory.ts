import { DataSource } from "../data-source/DataSource"
import { MissingDriverError } from "../error/MissingDriverError"
import { AuroraMysqlDriver } from "./aurora-mysql/AuroraMysqlDriver"
import { AuroraPostgresDriver } from "./aurora-postgres/AuroraPostgresDriver"
import { BetterSqlite3Driver } from "./better-sqlite3/BetterSqlite3Driver"
import { CapacitorDriver } from "./capacitor/CapacitorDriver"
import { CockroachDriver } from "./cockroachdb/CockroachDriver"
import { CordovaDriver } from "./cordova/CordovaDriver"
import { Driver } from "./Driver"
import { ExpoDriver } from "./expo/ExpoDriver"
import { MongoDriver } from "./mongodb/MongoDriver"
import { MysqlDriver } from "./mysql/MysqlDriver"
import { NativescriptDriver } from "./nativescript/NativescriptDriver"
import { OracleDriver } from "./oracle/OracleDriver"
import { PostgresDriver } from "./postgres/PostgresDriver"
import { ReactNativeDriver } from "./react-native/ReactNativeDriver"
import { SapDriver } from "./sap/SapDriver"
import { SpannerDriver } from "./spanner/SpannerDriver"
import { SqliteDriver } from "./sqlite/SqliteDriver"
import { SqljsDriver } from "./sqljs/SqljsDriver"
import { SqlServerDriver } from "./sqlserver/SqlServerDriver"

/**
 * Helps to create drivers.
 */
export class DriverFactory {
    /**
     * Creates a new driver depend on a given connection's driver type.
     * @param connection DataSource instance.
     * @returns Driver
     */
    create(connection: DataSource): Driver {
        const { type } = connection.options
        switch (type) {
            case "aurora-mysql":
                return new AuroraMysqlDriver(connection)
            case "aurora-postgres":
                return new AuroraPostgresDriver(connection)
            case "better-sqlite3":
                return new BetterSqlite3Driver(connection)
            case "capacitor":
                return new CapacitorDriver(connection)
            case "cockroachdb":
                return new CockroachDriver(connection)
            case "cordova":
                return new CordovaDriver(connection)
            case "expo":
                return new ExpoDriver(connection)
            case "mariadb":
                return new MysqlDriver(connection)
            case "mongodb":
                return new MongoDriver(connection)
            case "mssql":
                return new SqlServerDriver(connection)
            case "mysql":
                return new MysqlDriver(connection)
            case "nativescript":
                return new NativescriptDriver(connection)
            case "oracle":
                return new OracleDriver(connection)
            case "postgres":
                return new PostgresDriver(connection)
            case "react-native":
                return new ReactNativeDriver(connection)
            case "sap":
                return new SapDriver(connection)
            case "spanner":
                return new SpannerDriver(connection)
            case "sqlite":
                return new SqliteDriver(connection)
            case "sqljs":
                return new SqljsDriver(connection)
            default:
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
                    "spanner",
                    "sqlite",
                    "sqljs",
                ])
        }
    }
}
