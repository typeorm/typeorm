import { BaseDataSourceOptions } from "../../data-source/BaseDataSourceOptions"

/**
 * Postgres-specific connection options.
 */
export interface AuroraPostgresConnectionOptions extends BaseDataSourceOptions {
    /**
     * Database type.
     */
    readonly type: "aurora-postgres"

    readonly region: string

    readonly secretArn: string

    readonly resourceArn: string

    readonly database: string

    /**
     * The driver object
     * This defaults to require("typeorm-aurora-data-api-driver")
     */
    readonly driver?: any

    /**
     * The Postgres extension to use to generate UUID columns. Defaults to uuid-ossp.
     * If pgcrypto is selected, TypeORM will use the gen_random_uuid() function from this extension.
     * If uuid-ossp is selected, TypeORM will use the uuid_generate_v4() function from this extension.
     */
    readonly uuidExtension?: "pgcrypto" | "uuid-ossp"

    readonly transformParameters?: boolean

    /*
     * Function handling errors thrown by drivers pool.
     * Defaults to logging error with `warn` level.
     */
    readonly poolErrorHandler?: (err: any) => any

    readonly serviceConfigOptions?: { [key: string]: any }

    readonly formatOptions?: { [key: string]: any; castParameters: boolean }

    readonly poolSize?: never
}
