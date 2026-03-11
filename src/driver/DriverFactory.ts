import type { DataSource } from "../data-source/DataSource"
import { MissingDriverError } from "../error/MissingDriverError"
import { AuroraMysqlDriver } from "./aurora-mysql/AuroraMysqlDriver"
import { AuroraPostgresDriver } from "./aurora-postgres/AuroraPostgresDriver"
import { BetterSqlite3Driver } from "./better-sqlite3/BetterSqlite3Driver"
import { CapacitorDriver } from "./capacitor/CapacitorDriver"
import { CockroachDriver } from "./cockroachdb/CockroachDriver"
import { CordovaDriver } from "./cordova/CordovaDriver"
import type { Driver } from "./Driver"
import { ExpoDriver } from "./expo/ExpoDriver"
import { MongoDriver } from "./mongodb/MongoDriver"
import { MysqlDriver } from "./mysql/MysqlDriver"
import { NativescriptDriver } from "./nativescript/NativescriptDriver"
import { OracleDriver } from "./oracle/OracleDriver"
import { PostgresDriver } from "./postgres/PostgresDriver"
import { ReactNativeDriver } from "./react-native/ReactNativeDriver"
import { SapDriver } from "./sap/SapDriver"
import { SpannerDriver } from "./spanner/SpannerDriver"
import { SqljsDriver } from "./sqljs/SqljsDriver"
import { SqlServerDriver } from "./sqlserver/SqlServerDriver"

/**
 * Helps to create drivers.
 */
export class DriverFactory {
    /**
     * Creates a new driver depend on a given connection's driver type.
     * @param dataSource DataSource instance.
     * @returns Driver
     */
    create(dataSource: DataSource): Driver {
        const { type } = dataSource.options
        switch (type) {
            case "aurora-mysql":
                return new AuroraMysqlDriver(dataSource)
            case "aurora-postgres":
                return new AuroraPostgresDriver(dataSource)
            case "better-sqlite3":
                return new BetterSqlite3Driver(dataSource)
            case "capacitor":
                return new CapacitorDriver(dataSource)
            case "cockroachdb":
                return new CockroachDriver(dataSource)
            case "cordova":
                return new CordovaDriver(dataSource)
            case "expo":
                return new ExpoDriver(dataSource)
            case "mariadb":
                return new MysqlDriver(dataSource)
            case "mongodb":
                return new MongoDriver(dataSource)
            case "mssql":
                return new SqlServerDriver(dataSource)
            case "mysql":
                return new MysqlDriver(dataSource)
            case "nativescript":
                return new NativescriptDriver(dataSource)
            case "oracle":
                return new OracleDriver(dataSource)
            case "postgres":
                return new PostgresDriver(dataSource)
            case "react-native":
                return new ReactNativeDriver(dataSource)
            case "sap":
                return new SapDriver(dataSource)
            case "spanner":
                return new SpannerDriver(dataSource)
            case "sqljs":
                return new SqljsDriver(dataSource)
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
                    "sqljs",
                ])
        }
    }
}
