/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from "chai"
import * as sinon from "sinon"
import { RedisQueryResultCache } from "../../../src/cache/RedisQueryResultCache"
import { PlatformTools } from "../../../src/platform/PlatformTools"
import { DataSource } from "../../../src/data-source/DataSource"

describe("RedisQueryResultCache", () => {
    describe("detectPromiseBasedApi", () => {
        let sandbox: sinon.SinonSandbox
        let mockDataSource: sinon.SinonStubbedInstance<DataSource>

        beforeEach(() => {
            sandbox = sinon.createSandbox()

            // Create a mock DataSource
            mockDataSource = {
                options: {},
                logger: {
                    log: sandbox.stub(),
                },
            } as any

            // Stub PlatformTools.load to prevent actual redis loading
            sandbox.stub(PlatformTools, "load").returns({})
        })

        afterEach(() => {
            sandbox.restore()
        })

        it("should detect Promise-based API when ping() returns a Promise", () => {
            const cache = new RedisQueryResultCache(
                mockDataSource as any,
                "redis",
            )

            // Mock client with Promise-based ping()
            ;(cache as any).client = {
                ping: () => Promise.resolve("pong"),
            }

            // Call the private method
            ;(cache as any).detectPromiseBasedApi()

            expect((cache as any).isPromiseBasedApi).to.be.true
        })

        it("should detect callback-based API when ping() returns a non-Promise value", () => {
            const cache = new RedisQueryResultCache(
                mockDataSource as any,
                "redis",
            )

            // Mock client with callback-based ping() (returns undefined)
            ;(cache as any).client = {
                ping: () => "PONG",
            }

            // Call the private method
            ;(cache as any).detectPromiseBasedApi()

            expect((cache as any).isPromiseBasedApi).to.be.false
        })

        it("should not detect for ioredis client type", () => {
            const cache = new RedisQueryResultCache(
                mockDataSource as any,
                "ioredis",
            )

            // Mock client - shouldn't matter since clientType is ioredis
            ;(cache as any).client = {
                ping: () => Promise.resolve("PONG"),
            }

            // Call the private method
            ;(cache as any).detectPromiseBasedApi()

            // Should remain false (default) for non-redis clients
            expect((cache as any).isPromiseBasedApi).to.be.false
        })
    })
})
