import { BaseConnectionOptions } from "../../connection/BaseConnectionOptions";
import { AuroraDataApiConnectionCredentialsOptions } from "./AuroraDataApiConnectionCredentialsOptions";
/**
 * MySQL specific connection options.
 *
 * @see https://github.com/mysqljs/mysql#connection-options
 */
export interface AuroraDataApiConnectionOptions extends BaseConnectionOptions, AuroraDataApiConnectionCredentialsOptions {
    /**
     * Database type.
     */
    readonly type: "aurora-data-api";
    readonly region: string;
    readonly secretArn: string;
    readonly resourceArn: string;
    readonly database: string;
    readonly serviceConfigOptions?: {
        [key: string]: any;
    };
    readonly formatOptions?: {
        [key: string]: any;
        castParameters: boolean;
    };
    /**
     * Use spatial functions like GeomFromText and AsText which are removed in MySQL 8.
     * (Default: true)
     */
    readonly legacySpatialSupport?: boolean;
}
