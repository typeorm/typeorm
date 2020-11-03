import { Connection } from "../connection/Connection";
import { MissingDriverError } from "../error/MissingDriverError";
import { AuroraDataApiPostgresDriver } from "./aurora-data-api-pg/AuroraDataApiPostgresDriver";
import { AuroraDataApiDriver } from "./aurora-data-api/AuroraDataApiDriver";
import { BetterSqlite3Driver } from "./better-sqlite3/BetterSqlite3Driver";
import { CockroachDriver } from "./cockroachdb/CockroachDriver";
import { CordovaDriver } from "./cordova/CordovaDriver";
import { Driver } from "./Driver";
import { ExpoDriver } from "./expo/ExpoDriver";
import { IgniteDriver } from "./ignite/IgniteDriver";
import { MongoDriver } from "./mongodb/MongoDriver";
import { MysqlDriver } from "./mysql/MysqlDriver";
import { NativescriptDriver } from "./nativescript/NativescriptDriver";
import { OracleDriver } from "./oracle/OracleDriver";
import { PostgresDriver } from "./postgres/PostgresDriver";
import { ReactNativeDriver } from "./react-native/ReactNativeDriver";
import { SapDriver } from "./sap/SapDriver";
import { SqliteDriver } from "./sqlite/SqliteDriver";
import { SqljsDriver } from "./sqljs/SqljsDriver";
import { SqlServerDriver } from "./sqlserver/SqlServerDriver";

/**
 * Helps to create drivers.
 */
export class DriverFactory {

    /**
     * Creates a new driver depend on a given connection's driver type.
     */
    create(connection: Connection): Driver {
        const {type} = connection.options;
        switch (type) {
            case "mysql":
                return new MysqlDriver(connection);
            case "postgres":
                return new PostgresDriver(connection);
            case "cockroachdb":
                return new CockroachDriver(connection);
            case "sap":
                return new SapDriver(connection);
            case "mariadb":
                return new MysqlDriver(connection);
            case "sqlite":
                return new SqliteDriver(connection);
            case "better-sqlite3":
                return new BetterSqlite3Driver(connection);
            case "cordova":
                return new CordovaDriver(connection);
            case "nativescript":
                return new NativescriptDriver(connection);
            case "react-native":
                return new ReactNativeDriver(connection);
            case "sqljs":
                return new SqljsDriver(connection);
            case "oracle":
                return new OracleDriver(connection);
            case "mssql":
                return new SqlServerDriver(connection);
            case "mongodb":
                return new MongoDriver(connection);
            case "expo":
                return new ExpoDriver(connection);
            case "aurora-data-api":
                return new AuroraDataApiDriver(connection);
            case "aurora-data-api-pg":
                return new AuroraDataApiPostgresDriver(connection);
            case "ignite":
                return new IgniteDriver(connection);
            default:
                throw new MissingDriverError(type);
        }
    }

}
