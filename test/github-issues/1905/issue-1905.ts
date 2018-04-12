import "reflect-metadata";
import {RedisQueryResultCache} from "../../../src/cache/RedisQueryResultCache";
import {DbQueryResultCache} from "../../../src/cache/DbQueryResultCache";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src";
import {stub} from "sinon";
import {expect} from "chai";

let redisStub: any;

class TestRedisQueryResultCache extends RedisQueryResultCache {
    constructor() {
        // Not testing anything related to the connection
        super({} as any);
        this.client = redisStub;
    }
    loadRedis() {
        // overridden to set this.client as stub
    }
}

describe("github issues > #1905 Use prefix for caching key when provided in cache options", () => {

    describe("Redis cache", () => {

        beforeEach(() => {
            redisStub = {
                get: stub().callsArgWith(1, null, "{}"),
                set: stub().callsArgWith(2, null, "{}")
            };
        });

        describe("Uses the expected cache key for getting cached items", () => {
            it("Should use the query as a key when identifier is not set", async () => {
                const resultCache = new TestRedisQueryResultCache();
                const options = { query: "query", identifier: "", duration: 0 };
                return resultCache.getFromCache(options).then(() => {
                    expect(redisStub.get.firstCall.args[0]).to.be.equal("query");
                });
            });

            it("Should use the identifier as a key when set", async () => {
                const resultCache = new TestRedisQueryResultCache();
                const options = { query: "query", identifier: "identifier", duration: 0 };
                return resultCache.getFromCache(options).then(() => {
                    expect(redisStub.get.firstCall.args[0]).to.be.equal("identifier");
                });
            });

            it("Should use prefix the query when prefix option is set", async () => {
                const resultCache = new TestRedisQueryResultCache();
                const options = { query: "query", identifier: "", prefix: "prefix", duration: 0 };
                return resultCache.getFromCache(options).then(() => {
                expect(redisStub.get.firstCall.args[0]).to.be.equal("prefixquery");
                });
            });

            it("Should use prefix the identifier when prefix and identifier options are set", async () => {
                const resultCache = new TestRedisQueryResultCache();
                const options = { query: "query", identifier: "identifier", prefix: "prefix", duration: 0 };
                return resultCache.getFromCache(options).then(() => {
                    expect(redisStub.get.firstCall.args[0]).to.be.equal("prefixidentifier");
                });
            });
        });

        describe("Uses the expected cache key for storing items in the cache", () => {
            it("Should use the query as a key when identifier is not set", async () => {
                const resultCache = new TestRedisQueryResultCache();
                const options = { query: "query", identifier: "", duration: 0 };
                return resultCache.storeInCache(options, options).then(() => {
                    expect(redisStub.set.firstCall.args[0]).to.be.equal("query");
                });
            });

            it("Should use the identifier as a key when set", async () => {
                const resultCache = new TestRedisQueryResultCache();
                const options = { query: "query", identifier: "identifier", duration: 0 };
                return resultCache.storeInCache(options, options).then(() => {
                    expect(redisStub.set.firstCall.args[0]).to.be.equal("identifier");
                });
            });

            it("Should use prefix the query when prefix option is set", async () => {
                const resultCache = new TestRedisQueryResultCache();
                const options = { query: "query", identifier: "", prefix: "prefix", duration: 0 };
                return resultCache.storeInCache(options, options).then(() => {
                expect(redisStub.set.firstCall.args[0]).to.be.equal("prefixquery");
                });
            });

            it("Should use prefix the identifier when prefix and identifier options are set", async () => {
                const resultCache = new TestRedisQueryResultCache();
                const options = { query: "query", identifier: "identifier", prefix: "prefix", duration: 0 };
                return resultCache.storeInCache(options, options).then(() => {
                    expect(redisStub.set.firstCall.args[0]).to.be.equal("prefixidentifier");
                });
            });
        });

        describe("Database cache - with cache key prefix", () => {
            let connections: Connection[];
            before(async () => connections = await createTestingConnections({
                enabledDrivers: ["mysql"]
            }));
            beforeEach(() => reloadTestingDatabases(connections));
            after(() => closeTestingConnections(connections));

            it("Should set and get cache items based on composite or prefix and identifier or query when no prefix is passed", async () => Promise.all(connections.map(async connection => {
                const dbQueryResultCache = new DbQueryResultCache(connection);
                await dbQueryResultCache.synchronize();

                // prefix cache option
                let cacheOptions: any = { query: "query", identifier: null, time: 0, duration: 0, result: "with query" };
                await dbQueryResultCache.storeInCache(cacheOptions, undefined);
                cacheOptions = { query: "query", identifier: null, prefix: "prefix", time: 0, duration: 0, result: "with prefix" };
                await dbQueryResultCache.storeInCache(cacheOptions, undefined);
                let resultWithCachePrefix: any = await dbQueryResultCache.getFromCache(cacheOptions);
                expect(resultWithCachePrefix!.id).to.eq(2);
                expect(resultWithCachePrefix!.result).to.eq("with prefix");
                await dbQueryResultCache.storeInCache({...cacheOptions, result: "update with prefix"}, cacheOptions);
                resultWithCachePrefix = await dbQueryResultCache.getFromCache(cacheOptions);
                expect(resultWithCachePrefix!.id).to.eq(2);
                expect(resultWithCachePrefix!.result).to.eq("update with prefix");

                // identifier and prefix cache option
                cacheOptions = { query: "query", identifier: "identifier", time: 0, duration: 0, result: "with identifer" };
                await dbQueryResultCache.storeInCache(cacheOptions, undefined);
                cacheOptions = { query: "query", identifier: "identifier", prefix: "prefix", time: 0, duration: 0, result: "with identifer and prefix" };
                await dbQueryResultCache.storeInCache(cacheOptions, undefined);
                let resultWithCacheIdentifierAndPrefix: any = await dbQueryResultCache.getFromCache(cacheOptions);
                expect(resultWithCacheIdentifierAndPrefix!.id).to.eq(3);
                expect(resultWithCacheIdentifierAndPrefix!.result).to.eq("with identifer and prefix");
                await dbQueryResultCache.storeInCache({...cacheOptions, result: "update identifier and prefix"}, cacheOptions);
                resultWithCacheIdentifierAndPrefix = await dbQueryResultCache.getFromCache(cacheOptions);
                expect(resultWithCacheIdentifierAndPrefix!.id).to.eq(3);
                expect(resultWithCacheIdentifierAndPrefix!.result).to.eq("update identifier and prefix");
            })));
        });
    });
});
