import "reflect-metadata";
import {RedisQueryResultCache} from "../../../src/cache/RedisQueryResultCache";
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
            expect(redisStub.get.firstCall.args[0]).to.be.equal("prefix~query");
            });
        });

        it("Should use prefix the identifier when prefix and identifier options are set", async () => {
            const resultCache = new TestRedisQueryResultCache();
            const options = { query: "query", identifier: "identifier", prefix: "prefix", duration: 0 };
            return resultCache.getFromCache(options).then(() => {
                expect(redisStub.get.firstCall.args[0]).to.be.equal("prefix~identifier");
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
            expect(redisStub.set.firstCall.args[0]).to.be.equal("prefix~query");
            });
        });

        it("Should use prefix the identifier when prefix and identifier options are set", async () => {
            const resultCache = new TestRedisQueryResultCache();
            const options = { query: "query", identifier: "identifier", prefix: "prefix", duration: 0 };
            return resultCache.storeInCache(options, options).then(() => {
                expect(redisStub.set.firstCall.args[0]).to.be.equal("prefix~identifier");
            });
        });
    });
});
