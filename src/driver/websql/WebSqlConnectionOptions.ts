import {BaseConnectionOptions} from "../../connection/BaseConnectionOptions";

/**
 * Websql-specific connection options.
 */
export interface WebSqlConnectionOptions extends BaseConnectionOptions {

    /**
     * Database type.
     */
    readonly type: "websql";

    /**
     * Storage type or path to the storage.
     */
    readonly database: string;

}