import { ReadStream } from "../../platform/PlatformTools"
import { ReplicationMode } from "../types/ReplicationMode"
import { PostgresQueryRunner } from "../postgres/PostgresQueryRunner"
import { PostgresJSDriver } from "./PostgresJSDriver"
import { TypeORMError } from "../../error"
import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError"
import { Readable } from "stream"

/**
 * Runs queries on a single postgres.js database connection.
 */
export class PostgresJSQueryRunner extends PostgresQueryRunner {
    constructor(driver: PostgresJSDriver, mode: ReplicationMode) {
        // Cast to PostgresDriver for parent constructor (safe since PostgresJSDriver extends PostgresDriver)
        super(driver as any, mode)
    }

    /**
     * Returns raw data stream from postgres.js using the cursor API.
     * Wraps the postgres.js async-iterable cursor in a Node.js Readable stream.
     * @param query
     * @param parameters
     * @param onEnd
     * @param onError
     */
    override async stream(
        query: string,
        parameters?: any[],
        onEnd?: Function,
        onError?: Function,
    ): Promise<ReadStream> {
        if (this.isReleased) {
            throw new QueryRunnerAlreadyReleasedError()
        }

        // Get the pg-compatible adapter (which wraps the reserved connection)
        const conn = await this.connect()

        // Extract the raw postgres.js reserved connection
        // (exposed by the adapter for streaming)
        if (!conn._reserved) {
            throw new TypeORMError(
                "Could not obtain postgres.js reserved connection for streaming.",
            )
        }

        this.driver.connection.logger.logQuery(query, parameters, this)

        // Create a cursor with chunk size of 1
        // (postgres.js cursor yields arrays of rows; we yield individual rows)
        const cursor = conn._reserved.unsafe(query, parameters ?? []).cursor(1)

        // Wrap the async-iterable cursor in a Node.js Readable stream
        const readable = Readable.from(
            (async function* () {
                for await (const rows of cursor) {
                    for (const row of rows) {
                        yield row
                    }
                }
            })(),
        ) as unknown as ReadStream

        if (onEnd) {
            readable.on("end", onEnd as any)
        }
        if (onError) {
            readable.on("error", onError as any)
        }

        return readable
    }
}
