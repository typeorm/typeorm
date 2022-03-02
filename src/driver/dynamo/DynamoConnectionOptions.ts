/**
 * DynamoDb specific connection options.
 */
import {BaseConnectionOptions} from "../../connection/BaseConnectionOptions";

export interface DynamoConnectionOptions extends BaseConnectionOptions {

    /**
     * Database type.
     */
    readonly type: "dynamodb";

}
