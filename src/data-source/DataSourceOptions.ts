import type { AuroraMysqlDataSourceOptions } from "../driver/aurora-mysql/AuroraMysqlDataSourceOptions"
import type { AuroraPostgresDataSourceOptions } from "../driver/aurora-postgres/AuroraPostgresDataSourceOptions"
import type { BetterSqlite3DataSourceOptions } from "../driver/better-sqlite3/BetterSqlite3DataSourceOptions"
import type { CapacitorDataSourceOptions } from "../driver/capacitor/CapacitorDataSourceOptions"
import type { CockroachDataSourceOptions } from "../driver/cockroachdb/CockroachDataSourceOptions"
import type { CordovaDataSourceOptions } from "../driver/cordova/CordovaDataSourceOptions"
import type { ExpoDataSourceOptions } from "../driver/expo/ExpoDataSourceOptions"
import type { MongoDataSourceOptions } from "../driver/mongodb/MongoDataSourceOptions"
import type { MysqlDataSourceOptions } from "../driver/mysql/MysqlDataSourceOptions"
import type { NativescriptDataSourceOptions } from "../driver/nativescript/NativescriptDataSourceOptions"
import type { OracleDataSourceOptions } from "../driver/oracle/OracleDataSourceOptions"
import type { PostgresDataSourceOptions } from "../driver/postgres/PostgresDataSourceOptions"
import type { ReactNativeDataSourceOptions } from "../driver/react-native/ReactNativeDataSourceOptions"
import type { SapDataSourceOptions } from "../driver/sap/SapDataSourceOptions"
import type { SpannerDataSourceOptions } from "../driver/spanner/SpannerDataSourceOptions"
import type { SqljsDataSourceOptions } from "../driver/sqljs/SqljsDataSourceOptions"
import type { SqlServerDataSourceOptions } from "../driver/sqlserver/SqlServerDataSourceOptions"

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
    | SqljsDataSourceOptions
    | SqlServerDataSourceOptions
