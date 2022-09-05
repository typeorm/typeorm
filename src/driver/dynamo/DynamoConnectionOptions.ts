/**
 * DynamoDb specific connection options.
 */
import {BaseConnectionOptions} from "../../connection/BaseConnectionOptions";

export interface DynamoConnectionOptions extends BaseConnectionOptions {

    /**
     * Database type.
     */
    readonly type: "dynamodb";

    /**
     * Database name to connect to.
     */
    readonly database?: string;

    /**
     * The driver object
     * This defaults to require("mongodb")
     */
    readonly driver?: any

}
