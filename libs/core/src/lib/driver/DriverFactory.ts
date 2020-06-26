import { Driver, DriverFactory as BrowserDriverFactory, MissingDriverError } from "@typeorm/browser-core";
import { Connection } from "../connection/Connection";

/**
 * Helps to create drivers.
 */
export class DriverFactory extends BrowserDriverFactory {

    /**
     * Creates a new driver depend on a given connection's driver.
     */
    create(connection: Connection): Driver {
        if (connection.options.driver) return super.create(connection);
        const {type} = connection.options;
        const driverBaseUri = '@typeorm/driver-';
        switch (type) {
            case "mysql":
                const {MysqlDriver} = require(driverBaseUri + 'mysql');
                return new MysqlDriver(connection);
            case "postgres":
                const {PostgresDriver} = require(driverBaseUri + 'postgres');
                return new PostgresDriver(connection);
            case "cockroachdb":
                const {CockroachDriver} = require(driverBaseUri + 'cockroachdb');
                return new CockroachDriver(connection);
            case "sap":
                const {SapDriver} = require(driverBaseUri + 'sap');
                return new SapDriver(connection);
            case "mariadb":
                return new (require(driverBaseUri + 'mysql').MysqlDriver)(connection);
            case "sqlite":
                const {SqliteDriver} = require(driverBaseUri + 'sqlite');
                return new SqliteDriver(connection);
            case "cordova":
                const {CordovaDriver} = require(driverBaseUri + 'cordova');
                return new CordovaDriver(connection);
            case "nativescript":
                const {NativescriptDriver} = require(driverBaseUri + 'nativescript');
                return new NativescriptDriver(connection);
            case "react-native":
                const {ReactNativeDriver} = require(driverBaseUri + 'react-native');
                return new ReactNativeDriver(connection);
            case "sqljs":
                const {SqljsDriver} = require(driverBaseUri + 'sqljs');
                return new SqljsDriver(connection);
            case "oracle":
                const {OracleDriver} = require(driverBaseUri + 'oracle');
                return new OracleDriver(connection);
            case "mssql":
                const {SqlServerDriver} = require(driverBaseUri + 'sqlserver');
                return new SqlServerDriver(connection);
            case "mongodb":
                const {MongoDriver} = require(driverBaseUri + 'mongodb');
                return new MongoDriver(connection);
            case "expo":
                const {ExpoDriver} = require(driverBaseUri + 'expo');
                return new ExpoDriver(connection);
            case "aurora-data-api":
                const {AuroraDataApiDriver} = require(driverBaseUri + 'aurora-data-api');
                return new AuroraDataApiDriver(connection);
            case "aurora-data-api-pg":
                const {AuroraDataApiPostgresDriver} = require(driverBaseUri + 'aurora-data-api-pg');
                return new AuroraDataApiPostgresDriver(connection);
            default:
                throw new MissingDriverError(type);
        }
    }

}
