import type { Logger } from "../../logger/Logger"
import type { ReadStream } from "../../platform/PlatformTools"
import type { QueryResult } from "../../query-runner/QueryResult"
import type { PostgresConnectionCredentialsOptions } from "./PostgresConnectionCredentialsOptions"
import type { PostgresDataSourceOptions } from "./PostgresDataSourceOptions"

export type PostgresConnectionRelease = (error?: Error) => void | Promise<void>

/** Native client boundary for the PostgreSQL dialect. Handles remain opaque to TypeORM. */
export interface PostgresDriverAdapter {
    /** Create a native pool and verify connectivity; clean up internally if creation fails. */
    createPool(
        options: PostgresDataSourceOptions,
        credentials: PostgresConnectionCredentialsOptions,
        logger: Logger,
    ): Promise<unknown>

    /** Close a pool, including any resources owned by the client. */
    closePool(pool: unknown): Promise<void>

    /** Reserve one connection until release; an error marks a broken connection. */
    acquire(pool: unknown): Promise<[unknown, PostgresConnectionRelease]>

    /** Execute on the reserved connection and return the native subscriber event payload. */
    query(
        connection: unknown,
        query: string,
        parameters?: unknown[],
    ): Promise<unknown>

    /** Convert a native payload to records, affected count and the public raw query result. */
    normalizeResult(result: unknown): QueryResult

    /** Observe fatal connection errors and return a function removing the listener. */
    onError?(connection: unknown, listener: (error: Error) => void): () => void

    /** Stream rows with backpressure on the reserved connection; destruction must cancel the query. */
    stream?(
        connection: unknown,
        query: string,
        parameters?: unknown[],
    ): ReadStream | Promise<ReadStream>
}
