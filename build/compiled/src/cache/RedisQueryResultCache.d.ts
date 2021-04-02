import { QueryResultCache } from "./QueryResultCache";
import { QueryResultCacheOptions } from "./QueryResultCacheOptions";
import { Connection } from "../connection/Connection";
import { QueryRunner } from "../query-runner/QueryRunner";
/**
 * Caches query result into Redis database.
 */
export declare class RedisQueryResultCache implements QueryResultCache {
    protected connection: Connection;
    /**
     * Redis module instance loaded dynamically.
     */
    protected redis: any;
    /**
     * Connected redis client.
     */
    protected client: any;
    /**
     * Type of the Redis Client (redis or ioredis).
     */
    protected clientType: "redis" | "ioredis" | "ioredis/cluster";
    constructor(connection: Connection, clientType: "redis" | "ioredis" | "ioredis/cluster");
    /**
     * Creates a connection with given cache provider.
     */
    connect(): Promise<void>;
    /**
     * Disconnects the connection
     */
    disconnect(): Promise<void>;
    /**
     * Creates table for storing cache if it does not exist yet.
     */
    synchronize(queryRunner: QueryRunner): Promise<void>;
    /**
     * Caches given query result.
     * Returns cache result if found.
     * Returns undefined if result is not cached.
     */
    getFromCache(options: QueryResultCacheOptions, queryRunner?: QueryRunner): Promise<QueryResultCacheOptions | undefined>;
    /**
     * Checks if cache is expired or not.
     */
    isExpired(savedCache: QueryResultCacheOptions): boolean;
    /**
     * Stores given query result in the cache.
     */
    storeInCache(options: QueryResultCacheOptions, savedCache: QueryResultCacheOptions, queryRunner?: QueryRunner): Promise<void>;
    /**
     * Clears everything stored in the cache.
     */
    clear(queryRunner?: QueryRunner): Promise<void>;
    /**
     * Removes all cached results by given identifiers from cache.
     */
    remove(identifiers: string[], queryRunner?: QueryRunner): Promise<void>;
    /**
     * Removes a single key from redis database.
     */
    protected deleteKey(key: string): Promise<void>;
    /**
     * Loads redis dependency.
     */
    protected loadRedis(): any;
}
