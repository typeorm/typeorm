import { expect } from "chai"
import sinon from "sinon"
import { RedisQueryResultCache } from "../../../src/cache/RedisQueryResultCache"
import { PlatformTools } from "../../../src/platform/PlatformTools"
import type { DataSource } from "../../../src/data-source/DataSource"
import type { QueryResultCacheOptions } from "../../../src/cache/QueryResultCacheOptions"

// Regression for https://github.com/typeorm/typeorm/issues/11562
describe("Redis query cache keys", () => {
    afterEach(() => sinon.restore())

    for (const clientType of ["redis", "ioredis", "ioredis/cluster"] as const) {
        it(`should hash automatic keys for ${clientType}`, async () => {
            const get = sinon.stub().resolves(null)
            const set = sinon.stub().resolves()
            const client = { get, set, connect: sinon.stub().resolves() }
            class RedisClient {
                constructor() {
                    return client
                }
                static Cluster = RedisClient
            }
            sinon
                .stub(PlatformTools, "load")
                .returns(
                    clientType === "redis"
                        ? { createClient: () => client }
                        : RedisClient,
                )
            const dataSource = {
                options: { cache: { options: { startupNodes: [] } } },
            } as DataSource
            const cache = new RedisQueryResultCache(dataSource, clientType)
            await cache.connect()
            const options: QueryResultCacheOptions = {
                query: `SELECT '${"界".repeat(4096)}' -- PARAMETERS: [1]`,
                duration: 5000,
                time: Date.now(),
                result: "[]",
            }

            await cache.getFromCache(options)
            const key = get.firstCall.args[0]
            expect(key).to.match(/^[a-f0-9]{40}$/)
            await cache.storeInCache(options, options)
            expect(set.firstCall.args[0]).to.equal(key)
            get.resolves(set.firstCall.args[1])
            expect(await cache.getFromCache(options)).to.deep.equal(options)

            await cache.getFromCache({ ...options, query: options.query + "2" })
            expect(get.lastCall.args[0]).not.to.equal(key)
            await cache.getFromCache({ ...options, identifier: "" })
            expect(get.lastCall.args[0]).to.equal(key)

            await cache.storeInCache(
                { ...options, identifier: "named" },
                options,
            )
            expect(set.lastCall.args[0]).to.equal("named")
            await cache.getFromCache({ ...options, identifier: "named" })
            expect(get.lastCall.args[0]).to.equal("named")

            get.resetHistory()
            set.resetHistory()
            await cache.getFromCache({ duration: 5000 })
            await cache.storeInCache({ duration: 5000 }, options)
            expect(get.called).to.equal(false)
            expect(set.called).to.equal(false)
        })
    }
})
