import { AuroraMysqlDataSourceOptions } from "../driver/aurora-mysql/AuroraMysqlDataSourceOptions"
import { AuroraPostgresDataSourceOptions } from "../driver/aurora-postgres/AuroraPostgresDataSourceOptions"
import { BetterSqlite3DataSourceOptions } from "../driver/better-sqlite3/BetterSqlite3DataSourceOptions"
import { CapacitorDataSourceOptions } from "../driver/capacitor/CapacitorDataSourceOptions"
import { CockroachDataSourceOptions } from "../driver/cockroachdb/CockroachDataSourceOptions"
import { CordovaDataSourceOptions } from "../driver/cordova/CordovaDataSourceOptions"
import { ExpoDataSourceOptions } from "../driver/expo/ExpoDataSourceOptions"
import { MongoDataSourceOptions } from "../driver/mongodb/MongoDataSourceOptions"
import { MysqlDataSourceOptions } from "../driver/mysql/MysqlDataSourceOptions"
import { NativescriptDataSourceOptions } from "../driver/nativescript/NativescriptDataSourceOptions"
import { OracleDataSourceOptions } from "../driver/oracle/OracleDataSourceOptions"
import { PostgresDataSourceOptions } from "../driver/postgres/PostgresDataSourceOptions"
import { ReactNativeDataSourceOptions } from "../driver/react-native/ReactNativeDataSourceOptions"
import { SapDataSourceOptions } from "../driver/sap/SapDataSourceOptions"
import { SpannerDataSourceOptions } from "../driver/spanner/SpannerDataSourceOptions"
import { SqliteDataSourceOptions } from "../driver/sqlite/SqliteDataSourceOptions"
import { SqljsDataSourceOptions } from "../driver/sqljs/SqljsDataSourceOptions"
import { SqlServerDataSourceOptions } from "../driver/sqlserver/SqlServerDataSourceOptions"

/**
 * DataSourceOptions is an interface with settings and options for specific DataSource.
 */
export type DataSourceOptions =
    | AuroraMysqlDataSourceOptions
    | AuroraPostgresDataSourceOptions
    | BetterSqlite3DataSourceOptions
    | CapacitorDataSourceOptions
    | CockroachDataSourceOptions
    | CordovaDataSourceOptions
    | ExpoDataSourceOptions
    | MongoDataSourceOptions
    | MysqlDataSourceOptions
    | NativescriptDataSourceOptions
    | OracleDataSourceOptions
    | PostgresDataSourceOptions
    | ReactNativeDataSourceOptions
    | SapDataSourceOptions
    | SpannerDataSourceOptions
    | SqliteDataSourceOptions
    | SqljsDataSourceOptions
    | SqlServerDataSourceOptions
