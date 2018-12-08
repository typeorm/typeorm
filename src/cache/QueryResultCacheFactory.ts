import {RedisQueryResultCache} from "./RedisQueryResultCache";
import {IORedisQueryResultCache} from "./IORedisQueryResultCache";
import {DbQueryResultCache} from "./DbQueryResultCache";
import {QueryResultCache} from "./QueryResultCache";
import {Connection} from "../connection/Connection";

/**
 * Caches query result into Redis database.
 */
export class QueryResultCacheFactory {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new query result cache based on connection options.
     */
    create(): QueryResultCache {
        if (!this.connection.options.cache)
            throw new Error(`To use cache you need to enable it in connection options by setting cache: true or providing some caching options. Example: { host: ..., username: ..., cache: true }`);

        if ((this.connection.options.cache as any).type === "redis")
            return new RedisQueryResultCache(this.connection);

        if ((this.connection.options.cache as any).type === "ioredis")
            return new IORedisQueryResultCache(this.connection);

        return new DbQueryResultCache(this.connection);
    }


}