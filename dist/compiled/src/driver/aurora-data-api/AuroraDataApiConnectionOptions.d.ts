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
}
