import { RedisQueryResultCache } from "./RedisQueryResultCache";
import { QueryResultCache, QueryResultCacheFactory as BrowserQueryResultCacheFactory } from "@typeorm/browser-core";
import { Connection } from "../connection/Connection";

/**
 * Caches query result into Redis database.
 */
export class QueryResultCacheFactory extends BrowserQueryResultCacheFactory {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        super(connection);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new query result cache based on connection options.
     */
    create(): QueryResultCache {
        const cache: any = this.connection.options.cache;
        if (!cache
            || cache.provider && typeof cache.provider === "function"
            || !(cache.type === "redis" || cache.type === "ioredis" || cache.type === "ioredis/cluster")) {
            return super.create();
        }

        return new RedisQueryResultCache(this.connection, cache.type);
    }

}
