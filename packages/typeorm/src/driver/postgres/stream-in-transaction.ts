import { PlatformTools, type ReadStream } from "../../platform/PlatformTools"
import type { CockroachQueryRunner } from "../cockroachdb/CockroachQueryRunner"
import type { PostgresQueryRunner } from "./PostgresQueryRunner"

/**
 * PostgreSQL and CockroachDB both use pg-query-stream on a single pg client.
 */
export async function streamInTransaction(
    this: PostgresQueryRunner | CockroachQueryRunner,
    sql: string,
    parameters: unknown[],
    releaseOnFinish: boolean,
): Promise<ReadStream> {
    const release = (error?: unknown) => {
        if (!releaseOnFinish || this.isReleased) return
        if (!this.isTransactionActive) return this.release()
        // A failed rollback or a subscriber can leave the client in a transaction.
        return this.release(
            error instanceof Error
                ? error
                : new Error("Transaction is still active"),
        )
    }
    const rollback = async () => {
        if (this.isTransactionActive) {
            try {
                await this.rollbackTransaction()
            } catch (error) {
                try {
                    await release(error)
                } catch {}
                throw error
            }
        }
        await release()
    }
    const fail = async (error: unknown): Promise<never> => {
        try {
            await rollback()
        } catch {}
        throw error
    }
    try {
        await this.startTransaction()
        // pg queues COMMIT behind the cursor, so expose rows before committing.
        const cursor = await this.stream(sql, parameters)
        return PlatformTools.wrapQueryStream(cursor, async (commit) => {
            if (!commit) return rollback()
            try {
                await this.commitTransaction()
            } catch (error) {
                return fail(error)
            }
            await release()
        })
    } catch (error) {
        return fail(error)
    }
}
