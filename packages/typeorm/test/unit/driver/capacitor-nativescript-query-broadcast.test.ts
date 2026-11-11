import { expect } from "chai"
import type { CapacitorDriver } from "../../../src/driver/capacitor/CapacitorDriver"
import { CapacitorQueryRunner } from "../../../src/driver/capacitor/CapacitorQueryRunner"
import type { NativescriptDriver } from "../../../src/driver/nativescript/NativescriptDriver"
import { NativescriptQueryRunner } from "../../../src/driver/nativescript/NativescriptQueryRunner"

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

// Guards against the fix regressing into a hang: if promise never settles,
// this rejects instead of leaving the test to mocha's own timeout.
function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
        setTimeout(
            () => reject(new Error(`${label} did not settle (hang?)`)),
            200,
        ).unref()
    })
    return Promise.race([promise, timeout])
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
    describe("CapacitorQueryRunner", () => {
        it("waits for the afterQuery subscriber before resolving on success", async () => {
            const { dataSource, isSettled } = settledSubscriber()
            const driver = {
                dataSource,
                options: {},
                databaseConnection: {
                    query: () => Promise.resolve({ values: [{ x: 1 }] }),
                },
            } as unknown as CapacitorDriver
            const runner = new CapacitorQueryRunner(driver)

            await runner.query("SELECT 1")

            expect(isSettled()).to.be.true
        })

        it("waits for the afterQuery subscriber before rejecting on failure", async () => {
            const { dataSource, isSettled } = settledSubscriber()
            const driver = {
                dataSource,
                options: {},
                databaseConnection: {
                    query: () => Promise.reject(new Error("boom")),
                },
            } as unknown as CapacitorDriver
            const runner = new CapacitorQueryRunner(driver)

            await expect(runner.query("SELECT 1")).to.be.rejected

            expect(isSettled()).to.be.true
        })

        it("rejects (does not hang) when the afterQuery subscriber rejects on success", async () => {
            const driver = {
                dataSource: rejectingSubscriber(),
                options: {},
                databaseConnection: {
                    query: () => Promise.resolve({ values: [{ x: 1 }] }),
                },
            } as unknown as CapacitorDriver
            const runner = new CapacitorQueryRunner(driver)

            await expect(
                withTimeout(runner.query("SELECT 1"), "query()"),
            ).to.be.rejectedWith("subscriber failure")
        })

        it("rejects with the original query error (not hang) when the afterQuery subscriber also rejects on failure", async () => {
            const driver = {
                dataSource: rejectingSubscriber(),
                options: {},
                databaseConnection: {
                    query: () => Promise.reject(new Error("boom")),
                },
            } as unknown as CapacitorDriver
            const runner = new CapacitorQueryRunner(driver)

            await expect(
                withTimeout(runner.query("SELECT 1"), "query()"),
            ).to.be.rejectedWith("boom")
        })
    })

    describe("NativescriptQueryRunner", () => {
        it("waits for the afterQuery subscriber before resolving on success", async () => {
            const { dataSource, isSettled } = settledSubscriber()
            const driver = {
                dataSource,
                options: {},
                databaseConnection: {
                    all: (
                        _query: string,
                        _parameters: unknown,
                        cb: (err: Error | null, raw: unknown) => void,
                    ) => setImmediate(() => cb(null, [{ x: 1 }])),
                },
            } as unknown as NativescriptDriver
            const runner = new NativescriptQueryRunner(driver)

            await runner.query("SELECT 1")

            expect(isSettled()).to.be.true
        })

        it("waits for the afterQuery subscriber before rejecting on failure", async () => {
            const { dataSource, isSettled } = settledSubscriber()
            const driver = {
                dataSource,
                options: {},
                databaseConnection: {
                    all: (
                        _query: string,
                        _parameters: unknown,
                        cb: (err: Error | null, raw: unknown) => void,
                    ) => setImmediate(() => cb(new Error("boom"), null)),
                },
            } as unknown as NativescriptDriver
            const runner = new NativescriptQueryRunner(driver)

            await expect(runner.query("SELECT 1")).to.be.rejected

            expect(isSettled()).to.be.true
        })

        it("rejects (does not hang) when the afterQuery subscriber rejects on success", async () => {
            const driver = {
                dataSource: rejectingSubscriber(),
                options: {},
                databaseConnection: {
                    all: (
                        _query: string,
                        _parameters: unknown,
                        cb: (err: Error | null, raw: unknown) => void,
                    ) => setImmediate(() => cb(null, [{ x: 1 }])),
                },
            } as unknown as NativescriptDriver
            const runner = new NativescriptQueryRunner(driver)

            await expect(
                withTimeout(runner.query("SELECT 1"), "query()"),
            ).to.be.rejectedWith("subscriber failure")
        })

        it("rejects with the original query error (not hang) when the afterQuery subscriber also rejects on failure", async () => {
            const driver = {
                dataSource: rejectingSubscriber(),
                options: {},
                databaseConnection: {
                    all: (
                        _query: string,
                        _parameters: unknown,
                        cb: (err: Error | null, raw: unknown) => void,
                    ) => setImmediate(() => cb(new Error("boom"), null)),
                },
            } as unknown as NativescriptDriver
            const runner = new NativescriptQueryRunner(driver)

            await expect(
                withTimeout(runner.query("SELECT 1"), "query()"),
            ).to.be.rejectedWith("boom")
        })
    })
})
