import { PlatformTools } from "../platform/PlatformTools";
import { TypeORMError } from "../error/TypeORMError";
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
    async connect() {
        const cacheOptions = this.connection.options.cache;
        if (this.clientType === "redis") {
            this.client = this.redis.createClient({
                ...cacheOptions === null || cacheOptions === void 0 ? void 0 : cacheOptions.options,
                legacyMode: true,
            });
            if (typeof this.connection.options.cache === "object" &&
                this.connection.options.cache.ignoreErrors) {
                this.client.on("error", (err) => {
                    this.connection.logger.log("warn", err);
                });
            }
            if ("connect" in this.client) {
                await this.client.connect();
            }
        }
        else if (this.clientType === "ioredis") {
            if (cacheOptions && cacheOptions.port) {
                if (cacheOptions.options) {
                    this.client = new this.redis(cacheOptions.port, cacheOptions.options);
                }
                else {
                    this.client = new this.redis(cacheOptions.port);
                }
            }
            else if (cacheOptions && cacheOptions.options) {
                this.client = new this.redis(cacheOptions.options);
            }
            else {
                this.client = new this.redis();
            }
        }
        else if (this.clientType === "ioredis/cluster") {
            if (cacheOptions &&
                cacheOptions.options &&
                Array.isArray(cacheOptions.options)) {
                this.client = new this.redis.Cluster(cacheOptions.options);
            }
            else if (cacheOptions &&
                cacheOptions.options &&
                cacheOptions.options.startupNodes) {
                this.client = new this.redis.Cluster(cacheOptions.options.startupNodes, cacheOptions.options.options);
            }
            else {
                throw new TypeORMError(`options.startupNodes required for ${this.clientType}.`);
            }
        }
    }
    /**
     * Disconnects the connection
     */
    async disconnect() {
        return new Promise((ok, fail) => {
            this.client.quit((err, result) => {
                if (err)
                    return fail(err);
                ok();
                this.client = undefined;
            });
        });
    }
    /**
     * Creates table for storing cache if it does not exist yet.
     */
    async synchronize(queryRunner) { }
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
        return savedCache.time + savedCache.duration < new Date().getTime();
    }
    /**
     * Stores given query result in the cache.
     */
    async storeInCache(options, savedCache, queryRunner) {
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
    }
    /**
     * Clears everything stored in the cache.
     */
    async clear(queryRunner) {
        return new Promise((ok, fail) => {
            this.client.flushdb((err, result) => {
                if (err)
                    return fail(err);
                ok();
            });
        });
    }
    /**
     * Removes all cached results by given identifiers from cache.
     */
    async remove(identifiers, queryRunner) {
        await Promise.all(identifiers.map((identifier) => {
            return this.deleteKey(identifier);
        }));
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
            throw new TypeORMError(`Cannot use cache because ${this.clientType} is not installed. Please run "npm i ${this.clientType} --save".`);
        }
    }
}

//# sourceMappingURL=RedisQueryResultCache.js.map
