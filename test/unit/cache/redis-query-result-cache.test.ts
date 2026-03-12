/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from "chai"
import * as sinon from "sinon"
import { RedisQueryResultCache } from "../../../src/cache/RedisQueryResultCache"
import { PlatformTools } from "../../../src/platform/PlatformTools"
import type { DataSource } from "../../../src/data-source/DataSource"
import { TypeORMError } from "../../../src/error/TypeORMError"

describe("RedisQueryResultCache", () => {
    let sandbox: sinon.SinonSandbox
    let mockDataSource: Pick<DataSource, "options" | "logger">
    let loadStub: sinon.SinonStub

    beforeEach(() => {
        sandbox = sinon.createSandbox()
        mockDataSource = {
            options: {
                cache: {},
            } as any,
            logger: {
                log: sandbox.stub(),
            } as any,
        }
        loadStub = sandbox.stub(PlatformTools, "load")
    })

    afterEach(() => {
        sandbox.restore()
    })

    describe("isExpired", () => {
        it("detects expiration based on duration", () => {
            loadStub.returns({})
            const cache = new RedisQueryResultCache(
                mockDataSource as DataSource,
                "redis",
            )
            const now = Date.now()

            expect(cache.isExpired({ time: now - 2000, duration: 1000 } as any))
                .to.be.true
            expect(cache.isExpired({ time: now - 200, duration: 1000 } as any))
                .to.be.false
        })
    })

    describe("storeInCache", () => {
        it("stores using PX options for node-redis", async () => {
            loadStub.returns({})
            const cache = new RedisQueryResultCache(
                mockDataSource as DataSource,
                "redis",
            )
            const set = sandbox.stub().resolves()
            ;(cache as any).client = { set }
            const options = {
                identifier: "node",
                duration: 5000,
                time: Date.now(),
            } as any

            await cache.storeInCache(options, options)

            expect(
                set.calledOnceWithExactly("node", JSON.stringify(options), {
                    expiration: { type: "PX", value: 5000 },
                }),
            ).to.be.true
        })

        it("stores using PX arguments for ioredis", async () => {
            loadStub.returns({})
            const cache = new RedisQueryResultCache(
                mockDataSource as DataSource,
                "ioredis",
            )
            const set = sandbox.stub().resolves()
            ;(cache as any).client = { set }
            const options = {
                identifier: "io",
                duration: 1200,
                time: Date.now(),
            } as any

            await cache.storeInCache(options, options)

            expect(
                set.calledOnceWithExactly(
                    "io",
                    JSON.stringify(options),
                    "PX",
                    1200,
                ),
            ).to.be.true
        })
    })

    describe("clear", () => {
        it("uses flushDb for node-redis", async () => {
            loadStub.returns({})
            const cache = new RedisQueryResultCache(
                mockDataSource as DataSource,
                "redis",
            )
            const flushDb = sandbox.stub().resolves()
            ;(cache as any).client = { flushDb }

            await cache.clear()

            expect(flushDb.calledOnce).to.be.true
        })

        it("uses flushdb for ioredis", async () => {
            loadStub.returns({})
            const cache = new RedisQueryResultCache(
                mockDataSource as DataSource,
                "ioredis",
            )
            const flushdb = sandbox.stub().resolves()
            ;(cache as any).client = { flushdb }

            await cache.clear()

            expect(flushdb.calledOnce).to.be.true
        })
    })

    describe("remove", () => {
        it("delegates to redis del with identifiers", async () => {
            loadStub.returns({})
            const cache = new RedisQueryResultCache(
                mockDataSource as DataSource,
                "redis",
            )
            const del = sandbox.stub().resolves()
            ;(cache as any).client = { del }

            await cache.remove(["a", "b"])

            expect(del.calledOnceWithExactly(["a", "b"])).to.be.true
        })
    })

    describe("deleteKey", () => {
        it("removes a single key using del", async () => {
            loadStub.returns({})
            const cache = new RedisQueryResultCache(
                mockDataSource as DataSource,
                "redis",
            )
            const del = sandbox.stub().resolves()
            ;(cache as any).client = { del }

            await (cache as any).deleteKey("single")

            expect(del.calledOnceWithExactly(["single"])).to.be.true
        })
    })

    describe("loadRedis", () => {
        it("loads ioredis module for cluster clients", () => {
            const module = { Cluster: class {} }
            loadStub.withArgs("ioredis").returns(module)

            const cache = new RedisQueryResultCache(
                mockDataSource as DataSource,
                "ioredis/cluster",
            )

            expect((cache as any).redis).to.equal(module)
            expect(loadStub.calledOnceWithExactly("ioredis")).to.be.true
        })

        it("throws a TypeORMError when dependency is missing", () => {
            loadStub.callsFake(() => {
                throw new Error("missing")
            })

            expect(() => {
                return new RedisQueryResultCache(
                    mockDataSource as DataSource,
                    "redis",
                )
            }).to.throw(TypeORMError)
        })
    })
})
