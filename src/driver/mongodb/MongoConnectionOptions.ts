import {BaseConnectionOptions} from "../../connection/BaseConnectionOptions";

/**
 * MongoDB specific connection options.
 */
export interface MongoConnectionOptions extends BaseConnectionOptions {

    /**
     * Database type.
     */
    readonly type: "mongodb";

    /**
     * Connection url where perform connection to.
     */
    readonly url?: string;

    /**
     * Database host.
     */
    readonly host?: string;

    /**
     * Database host port.
     */
    readonly port?: number;

    /**
     * Database name to connect to.
     */
    readonly database?: string;

}