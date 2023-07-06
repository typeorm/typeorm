"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryResultCacheFactory = void 0;
const RedisQueryResultCache_1 = require("./RedisQueryResultCache");
const DbQueryResultCache_1 = require("./DbQueryResultCache");
/**
 * Caches query result into Redis database.
 */
class QueryResultCacheFactory {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(connection) {
        this.connection = connection;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a new query result cache based on connection options.
     */
    create() {
        if (!this.connection.options.cache)
            throw new Error(`To use cache you need to enable it in connection options by setting cache: true or providing some caching options. Example: { host: ..., username: ..., cache: true }`);
        const cache = this.connection.options.cache;
        if (cache.provider && typeof cache.provider === "function") {
            return cache.provider(this.connection);
        }
        if (cache.type === "redis" || cache.type === "ioredis" || cache.type === "ioredis/cluster") {
            return new RedisQueryResultCache_1.RedisQueryResultCache(this.connection, cache.type);
        }
        else {
            return new DbQueryResultCache_1.DbQueryResultCache(this.connection);
        }
    }
}
exports.QueryResultCacheFactory = QueryResultCacheFactory;
//# sourceMappingURL=QueryResultCacheFactory.js.map