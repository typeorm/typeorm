import type { EventEmitter } from "events"
import { DriverPackageNotInstalledError } from "../../error/DriverPackageNotInstalledError"
import { TypeORMError } from "../../error/TypeORMError"
import type { Logger } from "../../logger/Logger"
import { PlatformTools } from "../../platform/PlatformTools"
import type { ReadStream } from "../../platform/PlatformTools"
import { QueryResult } from "../../query-runner/QueryResult"
import type { PostgresConnectionCredentialsOptions } from "./PostgresConnectionCredentialsOptions"
import type { PostgresDataSourceOptions } from "./PostgresDataSourceOptions"
import type {
    PostgresConnectionRelease,
    PostgresDriverAdapter,
} from "./PostgresDriverAdapter"

interface PgConnection extends EventEmitter {
    query(query: string, parameters?: unknown[]): Promise<unknown>
    query(stream: unknown): ReadStream
}

interface PgPool extends EventEmitter {
    connect(
        callback: (
            error: Error | undefined,
            connection: PgConnection,
            release: PostgresConnectionRelease,
        ) => void,
    ): void
    end(callback: (error?: Error) => void): void
}

interface PgModule {
    Pool: new (options: object) => PgPool
    defaults?: { parseInt8?: boolean }
    native?: PgModule
}

/** Default PostgreSQL client integration, backed by pg or its native override. */
export class PgDriverAdapter implements PostgresDriverAdapter {
    readonly postgres: PgModule

    constructor(options: PostgresDataSourceOptions) {
        try {
            let postgres = (options.driver ??
                PlatformTools.load("pg")) as PgModule
            try {
                const native =
                    options.nativeDriver ?? PlatformTools.load("pg-native")
                if (native && postgres.native) postgres = postgres.native
            } catch {
                // pg-native is optional; fall back to the JavaScript client.
            }
            this.postgres = postgres
        } catch {
            throw new DriverPackageNotInstalledError("Postgres", "pg")
        }
    }

    async createPool(
        options: PostgresDataSourceOptions,
        credentials: PostgresConnectionCredentialsOptions,
        logger: Logger,
    ): Promise<unknown> {
        if (options.parseInt8 !== undefined) {
            if (
                this.postgres.defaults &&
                Object.getOwnPropertyDescriptor(
                    this.postgres.defaults,
                    "parseInt8",
                )?.set
            ) {
                this.postgres.defaults.parseInt8 = options.parseInt8
            } else {
                logger.log(
                    "warn",
                    "Attempted to set parseInt8 option, but the postgres driver does not support setting defaults.parseInt8. This option will be ignored.",
                )
            }
        }
        const pool = new this.postgres.Pool({
            connectionString: credentials.url,
            host: credentials.host,
            user: credentials.username,
            password: credentials.password,
            database: credentials.database,
            port: credentials.port,
            ssl: credentials.ssl,
            connectionTimeoutMillis: options.connectTimeoutMS,
            application_name:
                options.applicationName ?? credentials.applicationName,
            max: options.poolSize,
            ...options.extra,
        })
        pool.on(
            "error",
            options.poolErrorHandler ??
                ((error: Error) =>
                    logger.log(
                        "warn",
                        `Postgres pool raised an error. ${error}`,
                    )),
        )
        if (options.logNotifications) {
            pool.on("connect", (connection: PgConnection) => {
                connection.on("notice", (message: { message: string }) => {
                    if (message) logger.log("info", message.message)
                })
                connection.on(
                    "notification",
                    (message: { channel: string; payload: string }) => {
                        if (message)
                            logger.log(
                                "info",
                                `Received NOTIFY on channel ${message.channel}: ${message.payload}.`,
                            )
                    },
                )
            })
        }
        try {
            const [, release] = await this.acquire(pool)
            await release()
            return pool
        } catch (error) {
            await this.closePool(pool)
            throw error
        }
    }

    closePool(pool: unknown): Promise<void> {
        return new Promise((resolve, reject) => {
            ;(pool as PgPool).end((error) =>
                error ? reject(error) : resolve(),
            )
        })
    }

    acquire(pool: unknown): Promise<[unknown, PostgresConnectionRelease]> {
        return new Promise((resolve, reject) => {
            ;(pool as PgPool).connect((error, connection, release) => {
                if (error) reject(error)
                else resolve([connection, release])
            })
        })
    }

    query(
        connection: unknown,
        query: string,
        parameters?: unknown[],
    ): Promise<unknown> {
        return (connection as PgConnection).query(query, parameters)
    }

    normalizeResult(raw: unknown): QueryResult {
        const result = new QueryResult()
        if (!raw) return result
        const native = raw as {
            rows?: unknown[]
            rowCount?: number
            command?: string
        }
        if (Object.prototype.hasOwnProperty.call(native, "rows"))
            result.records = native.rows!
        if (Object.prototype.hasOwnProperty.call(native, "rowCount"))
            result.affected = native.rowCount
        result.raw =
            native.command === "UPDATE" || native.command === "DELETE"
                ? [native.rows, native.rowCount]
                : native.rows
        return result
    }

    onError(connection: unknown, listener: (error: Error) => void): () => void {
        const native = connection as PgConnection
        native.on("error", listener)
        return () => {
            native.removeListener("error", listener)
        }
    }

    loadStreamDependency(): new (
        query: string,
        parameters?: unknown[],
    ) => unknown {
        try {
            return PlatformTools.load("pg-query-stream")
        } catch {
            throw new TypeORMError(
                `To use streams you should install pg-query-stream package. Please run "npm i pg-query-stream".`,
            )
        }
    }

    stream(
        connection: unknown,
        query: string,
        parameters?: unknown[],
    ): ReadStream {
        const QueryStream = this.loadStreamDependency()
        return (connection as PgConnection).query(
            new QueryStream(query, parameters),
        )
    }
}
