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
import { AuroraDataApiConnectionOptions } from "../driver/aurora-data-api/AuroraDataApiConnectionOptions";
/**
 * ConnectionOptions is an interface with settings and options for specific connection.
 * Options contain database and other connection-related settings.
 * Consumer must provide connection options for each of your connections.
 */
export declare type ConnectionOptions = MysqlConnectionOptions | PostgresConnectionOptions | CockroachConnectionOptions | SqliteConnectionOptions | SqlServerConnectionOptions | OracleConnectionOptions | CordovaConnectionOptions | NativescriptConnectionOptions | ReactNativeConnectionOptions | SqljsConnectionOptions | MongoConnectionOptions | AuroraDataApiConnectionOptions | ExpoConnectionOptions;
