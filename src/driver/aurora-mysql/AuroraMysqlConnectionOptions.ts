import { AuroraMysqlConnectionCredentialsOptions } from "./AuroraMysqlConnectionCredentialsOptions"
import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"

/**
 * MySQL specific connection options.
 *
 * @see https://github.com/mysqljs/mysql#connection-options
 */
export interface AuroraMysqlConnectionOptions
    extends BaseDataSourceOptions, AuroraMysqlConnectionCredentialsOptions {
    /**
     * Database type.
     */
    readonly type: "aurora-mysql"

    readonly region: string

    readonly secretArn: string

    readonly resourceArn: string

    readonly database: string

    /**
     * The driver object
     * This defaults to require("typeorm-aurora-data-api-driver")
     */
    readonly driver?: any

    readonly serviceConfigOptions?: { [key: string]: any } // pass optional AWS.ConfigurationOptions here

    readonly formatOptions?: { [key: string]: any; castParameters: boolean }

    /**
     * Use spatial functions like GeomFromText and AsText which are removed in MySQL 8.
     * (Default: true)
     */
    readonly legacySpatialSupport?: boolean

    readonly poolSize?: never
}
