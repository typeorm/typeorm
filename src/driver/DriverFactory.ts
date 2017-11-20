import {MissingDriverError} from "../error/MissingDriverError";
import {MongoDriver} from "./mongodb/MongoDriver";
import {WebsqlDriver} from "./websql/WebsqlDriver";
import {SqlServerDriver} from "./sqlserver/SqlServerDriver";
import {OracleDriver} from "./oracle/OracleDriver";
import {SqliteDriver} from "./sqlite/SqliteDriver";
import {CordovaDriver} from "./cordova/CordovaDriver";
import {SqljsDriver} from "./sqljs/SqljsDriver";
import {MysqlDriver} from "./mysql/MysqlDriver";
import {PostgresDriver} from "./postgres/PostgresDriver";
import {Driver} from "./Driver";
import {Connection} from "../connection/Connection";

/**
 * Helps to create drivers.
 */
export class DriverFactory {

    /**
     * Creates a new driver depend on a given connection's driver type.
     */
    create(connection: Connection): Driver {
        const type = connection.options.type;
        switch (type) {
            case "mysql":
                return new MysqlDriver(connection);
            case "postgres":
                return new PostgresDriver(connection);
            case "mariadb":
                return new MysqlDriver(connection);
            case "sqlite":
                return new SqliteDriver(connection);
            case "cordova":
                return new CordovaDriver(connection);
            case "sqljs":
                return new SqljsDriver(connection);
            case "oracle":
                return new OracleDriver(connection);
            case "mssql":
                return new SqlServerDriver(connection);
            case "websql":
                return new WebsqlDriver(connection);
            case "mongodb":
                return new MongoDriver(connection);
            default:
                throw new MissingDriverError(type);
        }
    }

}