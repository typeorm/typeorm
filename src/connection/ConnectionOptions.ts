import {MysqlConnectionOptions} from "../driver/mysql/MysqlConnectionOptions";
import {PostgresConnectionOptions} from "../driver/postgres/PostgresConnectionOptions";
import {SqliteConnectionOptions} from "../driver/sqlite/SqliteConnectionOptions";
import {SqlServerConnectionOptions} from "../driver/sqlserver/SqlServerConnectionOptions";
import {OracleConnectionOptions} from "../driver/oracle/OracleConnectionOptions";
import {WebSqlConnectionOptions} from "../driver/websql/WebSqlConnectionOptions";
import {MongoConnectionOptions} from "../driver/mongodb/MongoConnectionOptions";
import {CordovaConnectionOptions} from "../driver/cordova/CordovaConnectionOptions";
import {SqljsConnectionOptions} from "../driver/sqljs/SqljsConnectionOptions";

/**
 * ConnectionOptions is an interface with settings and options for specific connection.
 * Options contain database and other connection-related settings.
 * Consumer must provide connection options for each of your connections.
 */
export type ConnectionOptions =
    MysqlConnectionOptions|
    PostgresConnectionOptions|
    SqliteConnectionOptions|
    SqlServerConnectionOptions|
    OracleConnectionOptions|
    WebSqlConnectionOptions|
    CordovaConnectionOptions|
    SqljsConnectionOptions|
    MongoConnectionOptions;