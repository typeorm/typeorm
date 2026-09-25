import type { QueryRunner } from "../query-runner/QueryRunner"
import { isActiveMongoTransaction } from "../driver/mongodb/isActiveMongoTransaction"

/** Result of broadcasting listeners and subscribers. */
export class BroadcasterResult {
    count: number = 0
    promises: Promise<any>[] = []
    private readonly deferred: (() => void | Promise<any>)[] = []
    private waitPromise?: Promise<BroadcasterResult>
    private readonly sequential: boolean

    constructor(queryRunner?: QueryRunner) {
        this.sequential = isActiveMongoTransaction(queryRunner)
    }

    /**
     * Keep ordinary hooks eager; defer only hooks sharing an active Mongo session.
     *
     * @param callback
     */
    add(callback: () => void | Promise<any>): void {
        if (this.sequential) {
            this.deferred.push(callback)
        } else {
            const result = callback()
            if (result instanceof Promise) this.promises.push(result)
            this.count++
        }
    }

    /** Invoke deferred hooks once, in registration order, stopping at the first failure. */
    wait(): Promise<BroadcasterResult> {
        this.waitPromise ??= (async () => {
            for (const callback of this.deferred) {
                const result = callback()
                this.count++
                await result
            }
            if (this.promises.length) await Promise.all(this.promises)
            return this
        })()
        return this.waitPromise
    }
}
