import { expect } from "chai"
import type { ReactNativeDriver } from "../../../src/driver/react-native/ReactNativeDriver"
import { ReactNativeQueryRunner } from "../../../src/driver/react-native/ReactNativeQueryRunner"

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

// Guards against the fix regressing into a hang: if promise never settles,
// this rejects instead of leaving the test to mocha's own timeout. 2s gives
// generous headroom over the 10ms subscriber delay for a stalled CI event
// loop (this repo has precedent for loosening timing assertions, see the
// sqljs elapsed/2 -> elapsed/3 change).
function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
        setTimeout(
            () => reject(new Error(`${label} did not settle (hang?)`)),
            2000,
        ).unref()
    })
    return Promise.race([promise, timeout])
}

// Captures process-level unhandledRejection events during a test. The bug
// this guards against: broadcasting AFTER_QUERY on the error path pushes the
// subscriber's promise into broadcasterResult.promises without anyone ever
// attaching a handler to it, so a rejecting subscriber surfaces as a Node
// unhandledRejection instead of being observed at all. Always call restore()
// (in a finally) so no listener leaks past the test, since this repo's mocha
// config runs with check-leaks.
function captureUnhandledRejections() {
    const seen: unknown[] = []
    const listener = (reason: unknown) => seen.push(reason)
    process.on("unhandledRejection", listener)
    return {
        seen,
        restore: () => process.off("unhandledRejection", listener),
    }
}

/**
 * A minimal DataSource stub with a single subscriber whose afterQuery hook
 * does real async work, so tests can tell whether query() waited for it.
 */
function makeDataSource(afterQuery: () => Promise<void>) {
    return {
        logger: {
            logQuery: () => {},
            logQueryError: () => {},
            logQuerySlow: () => {},
        },
        subscribers: [{ afterQuery }],
    }
}

function settledSubscriber() {
    let settled = false
    const dataSource = makeDataSource(async () => {
        await delay(10)
        settled = true
    })
    return { dataSource, isSettled: () => settled }
}

function rejectingSubscriber() {
    return makeDataSource(async () => {
        await delay(10)
        throw new Error("subscriber failure")
    })
}

describe("query runner > broadcasts AFTER_QUERY before settling", () => {
    describe("ReactNativeQueryRunner", () => {
        it("waits for the afterQuery subscriber before rejecting on failure", async () => {
            const { dataSource, isSettled } = settledSubscriber()
            const driver = {
                dataSource,
                options: {},
                databaseConnection: {
                    executeSql: (
                        _query: string,
                        _parameters: unknown,
                        _ok: (raw: unknown) => void,
                        fail: (err: Error) => void,
                    ) => setImmediate(() => fail(new Error("boom"))),
                },
            } as unknown as ReactNativeDriver
            const runner = new ReactNativeQueryRunner(driver)

            await expect(runner.query("SELECT 1")).to.be.rejected

            expect(isSettled()).to.be.true
        })

        it("rejects with the original query error and does not leak the subscriber's rejection as unhandled, when the afterQuery subscriber also rejects on failure", async () => {
            const driver = {
                dataSource: rejectingSubscriber(),
                options: {},
                databaseConnection: {
                    executeSql: (
                        _query: string,
                        _parameters: unknown,
                        _ok: (raw: unknown) => void,
                        fail: (err: Error) => void,
                    ) => setImmediate(() => fail(new Error("boom"))),
                },
            } as unknown as ReactNativeDriver
            const runner = new ReactNativeQueryRunner(driver)

            const rejections = captureUnhandledRejections()
            try {
                await expect(
                    withTimeout(runner.query("SELECT 1"), "query()"),
                ).to.be.rejectedWith("boom")

                // the subscriber rejects ~10ms after query() has already
                // settled; give it room to surface as an unhandled
                // rejection before asserting it didn't.
                await delay(50)

                expect(rejections.seen).to.eql([])
            } finally {
                rejections.restore()
            }
        })

        it("rejects (does not hang) when the afterQuery subscriber rejects on success", async () => {
            const driver = {
                dataSource: rejectingSubscriber(),
                options: {},
                databaseConnection: {
                    executeSql: (
                        _query: string,
                        _parameters: unknown,
                        ok: (raw: unknown) => void,
                    ) => setImmediate(() => ok({})),
                },
            } as unknown as ReactNativeDriver
            const runner = new ReactNativeQueryRunner(driver)

            await expect(
                withTimeout(runner.query("SELECT 1"), "query()"),
            ).to.be.rejectedWith("subscriber failure")
        })
    })
})
