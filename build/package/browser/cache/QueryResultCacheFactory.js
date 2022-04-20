import { RedisQueryResultCache } from "./RedisQueryResultCache";
import { DbQueryResultCache } from "./DbQueryResultCache";
/**
 * Caches query result into Redis database.
 */
var QueryResultCacheFactory = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function QueryResultCacheFactory(connection) {
        this.connection = connection;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a new query result cache based on connection options.
     */
    QueryResultCacheFactory.prototype.create = function () {
        if (!this.connection.options.cache)
            throw new Error("To use cache you need to enable it in connection options by setting cache: true or providing some caching options. Example: { host: ..., username: ..., cache: true }");
        var cache = this.connection.options.cache;
        if (cache.provider && typeof cache.provider === "function") {
            return cache.provider(this.connection);
        }
        if (cache.type === "redis" || cache.type === "ioredis" || cache.type === "ioredis/cluster") {
            return new RedisQueryResultCache(this.connection, cache.type);
        }
        else {
            return new DbQueryResultCache(this.connection);
        }
    };
    return QueryResultCacheFactory;
}());
export { QueryResultCacheFactory };

//# sourceMappingURL=QueryResultCacheFactory.js.map
