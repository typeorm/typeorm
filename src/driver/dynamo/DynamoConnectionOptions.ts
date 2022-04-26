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

}
