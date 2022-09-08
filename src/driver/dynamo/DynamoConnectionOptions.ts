/**
 * DynamoDb specific connection options.
 */
import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"

export interface DynamoConnectionOptions extends BaseDataSourceOptions {
    /**
     * Database type.
     */
    readonly type: "dynamodb"

    /**
     * Database name to connect to.
     */
    readonly database?: string

    /**
     * The driver object
     * This defaults to require("mongodb")
     */
    readonly driver?: any
}
