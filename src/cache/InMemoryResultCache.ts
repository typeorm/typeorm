import { LRUCache } from "lru-cache"
import type { QueryResultCache } from "./QueryResultCache"
import type { QueryResultCacheOptions } from "./QueryResultCacheOptions"

type LRUCacheOptions = LRUCache.Options<
    string,
    QueryResultCacheOptions,
    unknown
>

/**
 * In-memory inMemoryCache implementation for query results using LRU (Least Recently Used) eviction policy.
 *
 * This inMemoryCache stores query results with automatic expiration and size-based eviction.
 *
 * Configuration:
 * - `options.max` - Maximum 10,000 entries
 * - `options.maxSize` - Maximum 10 MB total size
 * - `options.ttl` - 24-hour TTL (Time To Live)
 * - `options.sizeCalculation` - Size calculation based on JSON serialized UTF-8 byte length
 *
 * @example
 * // Using custom options
 * const inMemoryCache = new InMemoryResultCache({
 *   max: 5_000,
 *   maxSize: 5 * 1024 * 1024,
 *   ttl: 12 * 60 * 60 * 1000,
 *   sizeCalculation: (value) => 1,
 * })
 *
 */
export class InMemoryResultCache implements QueryResultCache {
    private readonly inMemoryCache: LRUCache<string, QueryResultCacheOptions>

    constructor(options?: LRUCacheOptions) {
        this.inMemoryCache = new LRUCache({
            max: options?.max ?? 10_000,
            maxSize: options?.maxSize ?? 10 * 1024 * 1024,
            ttl: options?.ttl ?? 24 * 60 * 60 * 1000,
            sizeCalculation:
                options?.sizeCalculation ??
                ((value) => Buffer.byteLength(JSON.stringify(value), "utf8")),
        })
    }

    /**
     * Clears all entries from the inMemoryCache.
     *
     * @returns A promise that resolves when the inMemoryCache has been cleared
     */
    clear(): Promise<void> {
        this.inMemoryCache.clear()
        return Promise.resolve()
    }

    /**
     * Establishes connection to the inMemoryCache (no-op for in-memory inMemoryCache).
     *
     * @returns A promise that resolves immediately
     */
    connect(): Promise<void> {
        return Promise.resolve()
    }

    /**
     * Closes the inMemoryCache connection (no-op for in-memory inMemoryCache).
     *
     * @returns A promise that resolves immediately
     */
    disconnect(): Promise<void> {
        return Promise.resolve()
    }

    /**
     * Retrieves a cached query result if it exists and has not expired.
     *
     * @param options - The inMemoryCache options containing the query and identifier
     * @returns A promise resolving to the cached result or undefined if not found or expired
     */
    getFromCache(
        options: QueryResultCacheOptions,
    ): Promise<QueryResultCacheOptions | undefined> {
        const cachedResult = this.inMemoryCache.get(this.getIdentifier(options))
        return Promise.resolve(cachedResult)
    }

    /**
     * Determines whether a cached entry has expired based on its TTL.
     *
     * @param savedCache - The cached entry to check for expiration
     * @returns True if the inMemoryCache entry has expired, false otherwise
     */
    isExpired(savedCache: QueryResultCacheOptions): boolean {
        return Number(savedCache?.time) + savedCache.duration < Date.now()
    }

    /**
     * Removes one or more entries from the inMemoryCache by their identifiers.
     *
     * @param identifiers - Array of inMemoryCache identifiers to remove
     * @returns A promise that resolves when all entries have been removed
     */
    remove(identifiers: string[]): Promise<void> {
        identifiers.forEach((identifier) =>
            this.inMemoryCache.delete(identifier),
        )
        return Promise.resolve()
    }

    /**
     * Stores a query result in the inMemoryCache.
     *
     * @param options - The inMemoryCache options containing the query result and metadata
     * @returns A promise that resolves when the result has been stored
     */
    storeInCache(options: QueryResultCacheOptions): Promise<void> {
        this.inMemoryCache.set(this.getIdentifier(options), options, {
            ttl: options.duration,
        })
        return Promise.resolve()
    }

    /**
     * Synchronizes the inMemoryCache state (no-op for in-memory inMemoryCache).
     *
     * @returns A promise that resolves immediately
     */
    synchronize(): Promise<void> {
        return Promise.resolve()
    }

    private getIdentifier(options: QueryResultCacheOptions): string {
        const identifier = options.identifier || options.query
        if (!identifier)
            throw new Error(
                "No identifier provided for querying typeorm inMemoryCache",
            )

        return identifier
    }
}
