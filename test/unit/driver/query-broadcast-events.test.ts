/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from "chai"
import { CapacitorQueryRunner } from "../../../src/driver/capacitor/CapacitorQueryRunner"
import { NativescriptQueryRunner } from "../../../src/driver/nativescript/NativescriptQueryRunner"

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * A minimal DataSource stub with a single subscriber whose afterQuery hook
 * does real async work, so tests can tell whether query() waited for it.
 */
function makeDataSource() {
    let subscriberSettled = false
    const dataSource: any = {
        logger: { logQuery() {}, logQueryError() {}, logQuerySlow() {} },
        manager: {},
        subscribers: [
            {
                afterQuery: async () => {
                    await delay(10)
                    subscriberSettled = true
                },
            },
        ],
    }
    return {
        dataSource,
        isSubscriberSettled: () => subscriberSettled,
    }
}

describe("query runner > broadcasts AFTER_QUERY before settling", () => {
    describe("CapacitorQueryRunner", () => {
        it("waits for the afterQuery subscriber before resolving on success", async () => {
            const { dataSource, isSubscriberSettled } = makeDataSource()
            const driver: any = {
                dataSource,
                options: {},
                databaseConnection: {
                    query: () => Promise.resolve({ values: [{ x: 1 }] }),
                },
            }
            const runner = new CapacitorQueryRunner(driver)

            await runner.query("SELECT 1")

            expect(isSubscriberSettled()).to.be.true
        })

        it("waits for the afterQuery subscriber before rejecting on failure", async () => {
            const { dataSource, isSubscriberSettled } = makeDataSource()
            const driver: any = {
                dataSource,
                options: {},
                databaseConnection: {
                    query: () => Promise.reject(new Error("boom")),
                },
            }
            const runner = new CapacitorQueryRunner(driver)

            await expect(runner.query("SELECT 1")).to.be.rejected

            expect(isSubscriberSettled()).to.be.true
        })
    })

    describe("NativescriptQueryRunner", () => {
        it("waits for the afterQuery subscriber before resolving on success", async () => {
            const { dataSource, isSubscriberSettled } = makeDataSource()
            const driver: any = {
                dataSource,
                options: {},
                databaseConnection: {
                    all: (
                        _query: string,
                        _parameters: any,
                        cb: (err: any, raw: any) => void,
                    ) => setImmediate(() => cb(null, [{ x: 1 }])),
                },
            }
            const runner = new NativescriptQueryRunner(driver)

            await runner.query("SELECT 1")

            expect(isSubscriberSettled()).to.be.true
        })

        it("waits for the afterQuery subscriber before rejecting on failure", async () => {
            const { dataSource, isSubscriberSettled } = makeDataSource()
            const driver: any = {
                dataSource,
                options: {},
                databaseConnection: {
                    all: (
                        _query: string,
                        _parameters: any,
                        cb: (err: any, raw: any) => void,
                    ) => setImmediate(() => cb(new Error("boom"), null)),
                },
            }
            const runner = new NativescriptQueryRunner(driver)

            await expect(runner.query("SELECT 1")).to.be.rejected

            expect(isSubscriberSettled()).to.be.true
        })
    })
})
