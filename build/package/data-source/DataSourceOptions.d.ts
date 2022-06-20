import { CockroachConnectionOptions } from "../driver/cockroachdb/CockroachConnectionOptions";
import { MysqlConnectionOptions } from "../driver/mysql/MysqlConnectionOptions";
import { PostgresConnectionOptions } from "../driver/postgres/PostgresConnectionOptions";
import { SqliteConnectionOptions } from "../driver/sqlite/SqliteConnectionOptions";
import { SqlServerConnectionOptions } from "../driver/sqlserver/SqlServerConnectionOptions";
import { OracleConnectionOptions } from "../driver/oracle/OracleConnectionOptions";
import { MongoConnectionOptions } from "../driver/mongodb/MongoConnectionOptions";
import { CordovaConnectionOptions } from "../driver/cordova/CordovaConnectionOptions";
import { SqljsConnectionOptions } from "../driver/sqljs/SqljsConnectionOptions";
import { ReactNativeConnectionOptions } from "../driver/react-native/ReactNativeConnectionOptions";
import { NativescriptConnectionOptions } from "../driver/nativescript/NativescriptConnectionOptions";
import { ExpoConnectionOptions } from "../driver/expo/ExpoConnectionOptions";
import { AuroraMysqlConnectionOptions } from "../driver/aurora-mysql/AuroraMysqlConnectionOptions";
import { SapConnectionOptions } from "../driver/sap/SapConnectionOptions";
import { AuroraPostgresConnectionOptions } from "../driver/aurora-postgres/AuroraPostgresConnectionOptions";
import { BetterSqlite3ConnectionOptions } from "../driver/better-sqlite3/BetterSqlite3ConnectionOptions";
import { CapacitorConnectionOptions } from "../driver/capacitor/CapacitorConnectionOptions";
import { SpannerConnectionOptions } from "../driver/spanner/SpannerConnectionOptions";
/**
 * DataSourceOptions is an interface with settings and options for specific DataSource.
 */
export declare type DataSourceOptions = MysqlConnectionOptions | PostgresConnectionOptions | CockroachConnectionOptions | SqliteConnectionOptions | SqlServerConnectionOptions | SapConnectionOptions | OracleConnectionOptions | CordovaConnectionOptions | NativescriptConnectionOptions | ReactNativeConnectionOptions | SqljsConnectionOptions | MongoConnectionOptions | AuroraMysqlConnectionOptions | AuroraPostgresConnectionOptions | ExpoConnectionOptions | BetterSqlite3ConnectionOptions | CapacitorConnectionOptions | SpannerConnectionOptions;
