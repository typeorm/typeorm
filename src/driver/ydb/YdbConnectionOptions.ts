import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"
import {
    AnonymousAuthOptions,
    TokenAuthOptions,
    IamAuthOptions,
    MetadataAuthOptions,
} from "./AuthenticationOptions"

/**
 * YDB specific connection options.
 */
export interface YdbConnectionOptions extends BaseDataSourceOptions {
    /**
     * Database type.
     */
    readonly type: "ydb"

    /**
     * Endpoint name to connect to.
     */
    readonly endpoint: string

    /**
     * Database name to connect to.
     */
    readonly database: string

    /**
     * Authentication options
     *
     * Read more [here](https://ydb.tech/en/docs/concepts/auth)
     */
    readonly authentication:
        | AnonymousAuthOptions
        | TokenAuthOptions
        | IamAuthOptions
        | MetadataAuthOptions

    /**
     * Timeout to create connection in milliseconds
     */
    readonly connectTimeout: number

    /**
     * gRPC client options. [Read more](https://grpc.github.io/grpc/core/group__grpc__arg__keys.html)
     */
    readonly gRpcClientOptions?: { [key: string]: any }

    /**
     * Session pool settings
     */
    readonly poolSettings?: {
        minLimit?: number
        maxLimit?: number
        keepAlivePeriod?: number
    }
}
