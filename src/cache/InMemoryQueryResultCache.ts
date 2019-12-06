import {QueryResultCache} from "./QueryResultCache";
import { QueryResultCacheOptions } from './QueryResultCacheOptions';
import { QueryRunner } from '..';

/**
 * Caches query result into simple in-memory map.
 */
export class InMemoryQueryResultCache implements QueryResultCache {

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Map to store cached values.
     */
    protected cache: Record<string, QueryResultCacheOptions>

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor() {
        this.cache = {};
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a connection with given cache provider.
     */
    connect(): Promise<void> {
        return Promise.resolve();
    } 
    
    /**
     * Disconnects the connection
     */
    disconnect(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Creates table for storing cache if it does not exist yet.
     */
    synchronize(queryRunner?: import("..").QueryRunner | undefined): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Caches given query result.
     * Returns cache result if found.
     * Returns undefined if result is not cached.
     */
    getFromCache(options: QueryResultCacheOptions, queryRunner?: QueryRunner | undefined): Promise<QueryResultCacheOptions | undefined> {
        const result = this.cache[options.identifier];
        return Promise.resolve(result);
    }

    /**
     * Stores given query result in the cache.
     */
    storeInCache(options: QueryResultCacheOptions, savedCache: QueryResultCacheOptions | undefined, queryRunner?: QueryRunner | undefined): Promise<void> {
        this.cache[options.identifier] = options;
        return Promise.resolve();
    }

    /**
     * Checks if cache is expired or not.
     */
    isExpired(savedCache: QueryResultCacheOptions): boolean {
        const duration = typeof savedCache.duration === "string" ? parseInt(savedCache.duration) : savedCache.duration;
        return ((typeof savedCache.time === "string" ? parseInt(savedCache.time as any) : savedCache.time)! + duration) < new Date().getTime();
    }

    /**
     * Clears everything stored in the cache.
     */
    clear(queryRunner?: QueryRunner | undefined): Promise<void> {
        this.cache = {};
        return Promise.resolve();
    }

    /**
     * Removes all cached results by given identifiers from cache.
     */
    remove(identifiers: string[], queryRunner?: QueryRunner | undefined): Promise<void> {
        identifiers.forEach(identifier => {
            if (this.cache[identifier]) {
                delete this.cache[identifier]
            } 
        })
        return Promise.resolve();
    }
}