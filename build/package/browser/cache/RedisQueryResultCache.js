import { __awaiter } from "tslib";
import { PlatformTools } from "../platform/PlatformTools";
/**
 * Caches query result into Redis database.
 */
export class RedisQueryResultCache {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(connection, clientType) {
        this.connection = connection;
        this.clientType = clientType;
        this.redis = this.loadRedis();
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a connection with given cache provider.
     */
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheOptions = this.connection.options.cache;
            if (this.clientType === "redis") {
                if (cacheOptions && cacheOptions.options) {
                    this.client = this.redis.createClient(cacheOptions.options);
                }
                else {
                    this.client = this.redis.createClient();
                }
            }
            else if (this.clientType === "ioredis") {
                if (cacheOptions && cacheOptions.options) {
                    this.client = new this.redis(cacheOptions.options);
                }
                else {
                    this.client = new this.redis();
                }
            }
            else if (this.clientType === "ioredis/cluster") {
                if (cacheOptions && cacheOptions.options && Array.isArray(cacheOptions.options)) {
                    this.client = new this.redis.Cluster(cacheOptions.options);
                }
                else if (cacheOptions && cacheOptions.options && cacheOptions.options.startupNodes) {
                    this.client = new this.redis.Cluster(cacheOptions.options.startupNodes, cacheOptions.options.options);
                }
                else {
                    throw new Error(`options.startupNodes required for ${this.clientType}.`);
                }
            }
        });
    }
    /**
     * Disconnects the connection
     */
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((ok, fail) => {
                this.client.quit((err, result) => {
                    if (err)
                        return fail(err);
                    ok();
                    this.client = undefined;
                });
            });
        });
    }
    /**
     * Creates table for storing cache if it does not exist yet.
     */
    synchronize(queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    /**
     * Caches given query result.
     * Returns cache result if found.
     * Returns undefined if result is not cached.
     */
    getFromCache(options, queryRunner) {
        return new Promise((ok, fail) => {
            if (options.identifier) {
                this.client.get(options.identifier, (err, result) => {
                    if (err)
                        return fail(err);
                    ok(JSON.parse(result));
                });
            }
            else if (options.query) {
                this.client.get(options.query, (err, result) => {
                    if (err)
                        return fail(err);
                    ok(JSON.parse(result));
                });
            }
            else {
                ok(undefined);
            }
        });
    }
    /**
     * Checks if cache is expired or not.
     */
    isExpired(savedCache) {
        return (savedCache.time + savedCache.duration) < new Date().getTime();
    }
    /**
     * Stores given query result in the cache.
     */
    storeInCache(options, savedCache, queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((ok, fail) => {
                if (options.identifier) {
                    this.client.set(options.identifier, JSON.stringify(options), "PX", options.duration, (err, result) => {
                        if (err)
                            return fail(err);
                        ok();
                    });
                }
                else if (options.query) {
                    this.client.set(options.query, JSON.stringify(options), "PX", options.duration, (err, result) => {
                        if (err)
                            return fail(err);
                        ok();
                    });
                }
            });
        });
    }
    /**
     * Clears everything stored in the cache.
     */
    clear(queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((ok, fail) => {
                this.client.flushdb((err, result) => {
                    if (err)
                        return fail(err);
                    ok();
                });
            });
        });
    }
    /**
     * Removes all cached results by given identifiers from cache.
     */
    remove(identifiers, queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(identifiers.map(identifier => {
                return this.deleteKey(identifier);
            }));
        });
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Removes a single key from redis database.
     */
    deleteKey(key) {
        return new Promise((ok, fail) => {
            this.client.del(key, (err, result) => {
                if (err)
                    return fail(err);
                ok();
            });
        });
    }
    /**
     * Loads redis dependency.
     */
    loadRedis() {
        try {
            if (this.clientType === "ioredis/cluster") {
                return PlatformTools.load("ioredis");
            }
            else {
                return PlatformTools.load(this.clientType);
            }
        }
        catch (e) {
            throw new Error(`Cannot use cache because ${this.clientType} is not installed. Please run "npm i ${this.clientType} --save".`);
        }
    }
}

//# sourceMappingURL=RedisQueryResultCache.js.map
