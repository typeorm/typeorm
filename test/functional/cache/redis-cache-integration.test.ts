import "reflect-metadata"
import { expect } from "chai"
import { GenericContainer, StartedTestContainer } from "testcontainers"
import { RedisQueryResultCache } from "../../../src/cache/RedisQueryResultCache"
import { DataSource } from "../../../src/data-source/DataSource"
import { QueryResultCacheOptions } from "../../../src/cache/QueryResultCacheOptions"

describe("RedisQueryResultCache Integration", function () {
    let container: StartedTestContainer
    let caches: RedisQueryResultCache[] = []

    before(async () => {
        container = await new GenericContainer("redis:8.6.1-alpine")
            .withExposedPorts(6379)
            .start()
    })

    after(async () => {
        await container?.stop()
    })

    beforeEach(async () => {
        const host = container.getHost()
        const port = container.getMappedPort(6379)

        const logger = {
            log: (level: string, message: string) => console.log(message),
        }

        const mockRedisDataSource = {
            options: {
                cache: {
                    type: "redis",
                    options: {
                        url: `redis://${host}:${port}`,
                    },
                },
            },
            logger,
        }

        const mockIoRedisDataSource = {
            options: {
                cache: {
                    type: "ioredis",
                    options: {
                        host,
                        port,
                    },
                },
            },
            logger,
        }

        const redisCache = new RedisQueryResultCache(
            mockRedisDataSource as DataSource,
            "redis",
        )
        const ioredisCache = new RedisQueryResultCache(
            mockIoRedisDataSource as DataSource,
            "ioredis",
        )

        await redisCache.connect()
        await ioredisCache.connect()

        caches = [redisCache, ioredisCache]
    })

    afterEach(async () => {
        for (const cache of caches) {
            if (cache) {
                await cache.clear()
                await cache.disconnect()
            }
        }
        caches = []
    })

    it("should successfully store and retrieve a query result", async () => {
        for (const cache of caches) {
            const queryOptions: QueryResultCacheOptions = {
                identifier: "test-query-id",
                query: "SELECT * FROM users",
                duration: 5000,
                time: Date.now(),
                result: [{ id: 1, name: "Integration Test User" }],
            }

            await cache.storeInCache(queryOptions, queryOptions)

            const retrieved = await cache.getFromCache(queryOptions)

            expect(retrieved).to.exist
            expect(retrieved!.identifier).to.equal("test-query-id")
            expect(retrieved!.query).to.equal("SELECT * FROM users")
            expect(retrieved!.result).to.deep.equal([
                { id: 1, name: "Integration Test User" },
            ])
            expect(retrieved!.duration).to.equal(5000)
            expect(retrieved!.time).to.equal(queryOptions.time)
        }
    })

    it("should successfully remove existing keys based on identifier array", async () => {
        for (const cache of caches) {
            const queryOptions1: QueryResultCacheOptions = {
                identifier: "test-query-id-1",
                query: "SELECT 1",
                duration: 5000,
                time: Date.now(),
                result: [{ id: 1 }],
            }

            const queryOptions2: QueryResultCacheOptions = {
                identifier: "test-query-id-2",
                query: "SELECT 2",
                duration: 5000,
                time: Date.now(),
                result: [{ id: 2 }],
            }

            await cache.storeInCache(queryOptions1, queryOptions1)
            await cache.storeInCache(queryOptions2, queryOptions2)

            expect(await cache.getFromCache(queryOptions1)).to.exist
            expect(await cache.getFromCache(queryOptions2)).to.exist

            await cache.remove(["test-query-id-1", "test-query-id-2"])

            expect(await cache.getFromCache(queryOptions1)).to.be.undefined
            expect(await cache.getFromCache(queryOptions2)).to.be.undefined
        }
    })

    it("should successfully clear results from real Redis", async () => {
        for (const cache of caches) {
            const queryOptions: QueryResultCacheOptions = {
                identifier: "test-clear-id",
                query: "SELECT * FROM items",
                duration: 5000,
                time: Date.now(),
                result: [{ id: 2 }],
            }

            await cache.storeInCache(queryOptions, queryOptions)

            expect(await cache.getFromCache(queryOptions)).to.exist

            await cache.clear()

            const retrieved = await cache.getFromCache(queryOptions)
            expect(retrieved).to.be.undefined
        }
    })

    it("should correctly report whether cache is expired", () => {
        for (const cache of caches) {
            const now = Date.now()
            const notExpiredCache: QueryResultCacheOptions = {
                identifier: "test-expired-1",
                query: "",
                time: now - 1000,
                duration: 5000, // Expires in 4000ms
                result: [],
            }
            const expiredCache: QueryResultCacheOptions = {
                identifier: "test-expired-2",
                query: "",
                time: now - 10000,
                duration: 5000, // Expired 5000ms ago
                result: [],
            }

            expect(cache.isExpired(notExpiredCache)).to.be.false
            expect(cache.isExpired(expiredCache)).to.be.true
        }
    })
})
