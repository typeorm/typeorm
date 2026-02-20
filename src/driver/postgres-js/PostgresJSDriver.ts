import { DataSource } from "../../data-source/DataSource"
import { DriverPackageNotInstalledError } from "../../error/DriverPackageNotInstalledError"
import { PlatformTools } from "../../platform/PlatformTools"
import { ReplicationMode } from "../types/ReplicationMode"
import { PostgresDriver } from "../postgres/PostgresDriver"
import { PostgresConnectionCredentialsOptions } from "../postgres/PostgresConnectionCredentialsOptions"
import { PostgresJSConnectionOptions } from "./PostgresJSConnectionOptions"
import { PostgresJSQueryRunner } from "./PostgresJSQueryRunner"
import { TypeORMError } from "../../error"

/**
 * Abstract wrapper to allow PostgresJSDriver to override the options type.
 * This mirrors the pattern used by AuroraPostgresDriver.
 */
abstract class PostgresDriverBase extends PostgresDriver {
    declare options: any
    abstract createQueryRunner(mode: ReplicationMode): any
}

/**
 * Postgres.js driver for TypeORM.
 * @see https://github.com/porsager/postgres
 */
export class PostgresJSDriver extends PostgresDriverBase {
    /**
     * The postgres.js module object (the factory function).
     */
    postgresJSLib: any

    /**
     * Connection options with postgres-js-specific type.
     */
    declare options: PostgresJSConnectionOptions

    constructor(connection: DataSource) {
        // Call super() with no args to trigger the guard "if (!connection) return"
        // in PostgresDriver.constructor(), preventing it from loading the pg module
        super()

        this.connection = connection
        this.options = connection.options as PostgresJSConnectionOptions
        this.isReplicated = this.options.replication ? true : false

        if (this.options.useUTC) {
            process.env.PGTZ = "UTC"
        }

        this.loadDependencies()

        const credentialOptions = this.options.replication
            ? this.options.replication.master
            : this.options

        this.database = credentialOptions.database
        this.schema = (this.options as any).schema
    }

    /**
     * Loads the postgres.js module.
     */
    protected override loadDependencies(): void {
        try {
            this.postgresJSLib =
                this.options.driver || PlatformTools.load("postgres")
        } catch (e) {
            throw new DriverPackageNotInstalledError("postgres.js", "postgres")
        }
    }

    /**
     * Establishes actual database connections.
     */
    override async connect(): Promise<void> {
        if (this.options.replication) {
            this.slaves = await Promise.all(
                this.options.replication.slaves.map((slave) =>
                    this.createSQLInstance(this.options, slave),
                ),
            )
            this.master = await this.createSQLInstance(
                this.options,
                this.options.replication.master,
            )
        } else {
            this.master = await this.createSQLInstance(
                this.options,
                this.options,
            )
        }

        // Populate server metadata (version, database, schema)
        if (!this.version || !this.database || !this.searchSchema) {
            const queryRunner = this.createQueryRunner("master")

            if (!this.version) {
                this.version = await queryRunner.getVersion()
            }

            if (!this.database) {
                this.database = await queryRunner.getCurrentDatabase()
            }

            if (!this.searchSchema) {
                this.searchSchema = await queryRunner.getCurrentSchema()
            }

            await queryRunner.release()
        }

        if (!this.schema) {
            this.schema = this.searchSchema
        }
    }

    /**
     * Closes database connection.
     */
    override async disconnect(): Promise<void> {
        if (!this.master) {
            throw new TypeORMError("Driver not Connected")
        }

        // Release all connected query runners first
        while (this.connectedQueryRunners.length) {
            await this.connectedQueryRunners[0].release()
        }

        await this.master.end()
        await Promise.all(this.slaves.map((slave: any) => slave.end()))
        this.master = undefined
        this.slaves = []
    }

    /**
     * Creates a new postgres.js instance (acts as connection pool).
     * @param options
     * @param credentials
     */
    private async createSQLInstance(
        options: PostgresJSConnectionOptions,
        credentials: PostgresConnectionCredentialsOptions,
    ): Promise<any> {
        const { logger } = this.connection

        // Build postgres.js configuration
        const config: Record<string, any> = {
            host: credentials.host,
            port: credentials.port,
            user: credentials.username,
            password: credentials.password,
            database: credentials.database,
            ssl: credentials.ssl,
            max: options.poolSize,
            ...(options.connectTimeoutMS && {
                connect_timeout: Math.ceil(options.connectTimeoutMS / 1000),
            }),
            ...(options.applicationName &&
                credentials.applicationName && {
                    connection: {
                        application_name:
                            options.applicationName ??
                            credentials.applicationName,
                    },
                }),
        }

        // Map logNotifications to postgres.js onnotice handler
        if (options.logNotifications) {
            config.onnotice = (notice: any) => {
                if (notice?.message) {
                    logger.log("info", notice.message)
                }
            }
        }

        // Map parseInt8 to custom bigint type transformation
        if (options.parseInt8) {
            config.types = {
                bigint: {
                    to: 20,
                    from: [20],
                    serialize: (x: any) => String(x),
                    parse: (x: string) => {
                        const n = Number(x)
                        if (!Number.isSafeInteger(n)) {
                            logger.log(
                                "warn",
                                `parseInt8: value ${x} exceeds Number.MAX_SAFE_INTEGER`,
                            )
                        }
                        return n
                    },
                },
            }
        }

        // Merge user-supplied postgres.js options last (highest priority)
        if (options.postgresJSOptions) {
            Object.assign(config, options.postgresJSOptions)
        }

        // Create postgres.js instance
        let sql: any
        if (credentials.url) {
            sql = this.postgresJSLib(credentials.url, config)
        } else {
            sql = this.postgresJSLib(config)
        }

        // Validate connectivity (fail-fast, mirrors pg.Pool.connect() behavior)
        try {
            await sql`SELECT 1`
        } catch (err: any) {
            const handler =
                options.poolErrorHandler ||
                ((error: any) =>
                    logger.log(
                        "warn",
                        `postgres-js pool raised an error. ${error}`,
                    ))
            handler(err)
            throw err
        }

        return sql
    }

    /**
     * Creates a new query runner.
     * @param mode
     */
    override createQueryRunner(mode: ReplicationMode): PostgresJSQueryRunner {
        return new PostgresJSQueryRunner(this, mode)
    }

    /**
     * Obtains a new database connection to the master server.
     * Used for replication; if replication is not setup returns the default connection.
     */
    override async obtainMasterConnection(): Promise<[any, Function]> {
        if (!this.master) {
            throw new TypeORMError("Driver not Connected")
        }

        return this.buildAdaptedConnection(this.master)
    }

    /**
     * Obtains a new database connection to a slave server.
     * Used for replication; if replication is not setup returns master connection.
     */
    override async obtainSlaveConnection(): Promise<[any, Function]> {
        if (!this.slaves.length) {
            return this.obtainMasterConnection()
        }

        const random = Math.floor(Math.random() * this.slaves.length)
        return this.buildAdaptedConnection(this.slaves[random])
    }

    /**
     * Builds a pg-compatible adapter wrapping a postgres.js reserved connection.
     * This allows PostgresQueryRunner to work unchanged.
     * @param sql
     */
    private async buildAdaptedConnection(sql: any): Promise<[any, Function]> {
        const reserved = await sql.reserve()

        const pgCompatClient = {
            /**
             * Raw postgres.js reserved connection.
             * Exposed for stream() in PostgresJSQueryRunner.
             */
            _reserved: reserved,

            /**
             * Query method supporting both Promise and callback APIs.
             * Handles:
             * - query(sql) → Promise
             * - query(sql, params) → Promise
             * - query(sql, callback) → void
             * - query(sql, params, callback) → void
             * @param queryText
             * @param paramsOrCallback
             * @param callback
             */
            query(
                queryText: string,
                paramsOrCallback?:
                    | any[]
                    | ((err: Error | null, result?: any) => void),
                callback?: (err: Error | null, result?: any) => void,
            ): Promise<any> | void {
                // Normalize arguments
                let params: any[]
                let cb: ((err: Error | null, result?: any) => void) | undefined

                if (typeof paramsOrCallback === "function") {
                    params = []
                    cb = paramsOrCallback
                } else {
                    params = paramsOrCallback ?? []
                    cb = callback
                }

                // Execute query via postgres.js
                const promise = reserved
                    .unsafe(queryText, params)
                    .then((result: any) => {
                        // postgres.js result is an array with .count and .command properties
                        // Directly return result as rows since it's already an array
                        return {
                            rows: result,
                            // Only set rowCount for DML operations; null for SELECT
                            rowCount:
                                result.command &&
                                [
                                    "INSERT",
                                    "UPDATE",
                                    "DELETE",
                                    "MERGE",
                                ].includes(result.command)
                                    ? Number(result.count)
                                    : null,
                            command: result.command,
                        }
                    })

                // Handle callback-style invocation (for afterConnect extension setup)
                if (cb) {
                    promise
                        .then((r: any) => cb!(null, r))
                        .catch((e: any) => cb!(e))
                    return undefined
                }

                return promise
            },

            /**
             * No-op event emitter methods.
             * postgres.js does not expose client event emitters;
             * errors are thrown from query() instead.
             */
            on: () => {},
            removeListener: () => {},
            emit: () => false,
        }

        return [pgCompatClient, () => reserved.release()]
    }
}
