import { QueryResultCache } from "./QueryResultCache"
import { QueryResultCacheOptions } from "./QueryResultCacheOptions"
import { PlatformTools } from "../platform/PlatformTools"
import { DataSource } from "../data-source/DataSource"
import { QueryRunner } from "../query-runner/QueryRunner"
import { TypeORMError } from "../error/TypeORMError"

/**
 * Caches query result into Redis database.
 */
export class RedisQueryResultCache implements QueryResultCache {
    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Redis module instance loaded dynamically.
     */
    protected redis: any

    /**
     * Connected redis client.
     */
    protected client: any

    /**
     * Type of the Redis Client (redis or ioredis).
     */
    protected clientType: "redis" | "ioredis" | "ioredis/cluster"

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(
        protected connection: DataSource,
        clientType: "redis" | "ioredis" | "ioredis/cluster",
    ) {
        this.clientType = clientType
        this.redis = this.loadRedis()
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a connection with given cache provider.
     */
    async connect(): Promise<void> {
        const cacheOptions: any = this.connection.options.cache
        if (this.clientType === "redis") {
            this.client = this.redis.createClient({
                ...cacheOptions?.options,
                legacyMode: true,
            })
            if (
                typeof this.connection.options.cache === "object" &&
                this.connection.options.cache.ignoreErrors
            ) {
                this.client.on("error", (err: any) => {
                    this.connection.logger.log("warn", err)
                })
            }
            if ("connect" in this.client) {
                await this.client.connect()
            }
        } else if (this.clientType === "ioredis") {
            if (cacheOptions && cacheOptions.port) {
                if (cacheOptions.options) {
                    this.client = new this.redis(
                        cacheOptions.port,
                        cacheOptions.options,
                    )
                } else {
                    this.client = new this.redis(cacheOptions.port)
                }
            } else if (cacheOptions && cacheOptions.options) {
                this.client = new this.redis(cacheOptions.options)
            } else {
                this.client = new this.redis()
            }
        } else if (this.clientType === "ioredis/cluster") {
            if (
                cacheOptions &&
                cacheOptions.options &&
                Array.isArray(cacheOptions.options)
            ) {
                this.client = new this.redis.Cluster(cacheOptions.options)
            } else if (
                cacheOptions &&
                cacheOptions.options &&
                cacheOptions.options.startupNodes
            ) {
                this.client = new this.redis.Cluster(
                    cacheOptions.options.startupNodes,
                    cacheOptions.options.options,
                )
            } else {
                throw new TypeORMError(
                    `options.startupNodes required for ${this.clientType}.`,
                )
            }
        }
    }

    /**
     * Disconnects the connection
     */
    async disconnect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            this.client.quit((err: any, result: any) => {
                if (err) return fail(err)
                ok()
                this.client = undefined
            })
        })
    }

    /**
     * Creates table for storing cache if it does not exist yet.
     */
    async synchronize(queryRunner: QueryRunner): Promise<void> {}

    /**
     * Get data from cache.
     * Returns cache result if found.
     * Returns undefined if result is not cached.
     */
    getFromCache(
        options: QueryResultCacheOptions,
        queryRunner?: QueryRunner,
    ): Promise<QueryResultCacheOptions | undefined> {
        return new Promise<QueryResultCacheOptions | undefined>((ok, fail) => {
            if (options.identifier) {
                this.client.get(options.identifier, (err: any, result: any) => {
                    if (err) return fail(err)
                    ok(JSON.parse(result))
                })
            } else if (options.query) {
                this.client.get(options.query, (err: any, result: any) => {
                    if (err) return fail(err)
                    ok(JSON.parse(result))
                })
            } else {
                ok(undefined)
            }
        })
    }

    /**
     * Checks if cache is expired or not.
     */
    isExpired(savedCache: QueryResultCacheOptions): boolean {
        return savedCache.time! + savedCache.duration < new Date().getTime()
    }

    /**
     * Stores given query result in the cache.
     */
    async storeInCache(
        options: QueryResultCacheOptions,
        savedCache: QueryResultCacheOptions,
        queryRunner?: QueryRunner,
    ): Promise<void> {
        return new Promise<void>((ok, fail) => {
            if (options.identifier) {
                this.client.set(
                    options.identifier,
                    JSON.stringify(options),
                    "PX",
                    options.duration,
                    (err: any, result: any) => {
                        if (err) return fail(err)
                        ok()
                    },
                )
            } else if (options.query) {
                this.client.set(
                    options.query,
                    JSON.stringify(options),
                    "PX",
                    options.duration,
                    (err: any, result: any) => {
                        if (err) return fail(err)
                        ok()
                    },
                )
            }
        })
    }

    /**
     * Clears everything stored in the cache.
     */
    async clear(queryRunner?: QueryRunner): Promise<void> {
        return new Promise<void>((ok, fail) => {
            this.client.flushdb((err: any, result: any) => {
                if (err) return fail(err)
                ok()
            })
        })
    }

    /**
     * Removes all cached results by given identifiers from cache.
     */
    async remove(
        identifiers: string[],
        queryRunner?: QueryRunner,
    ): Promise<void> {
        await Promise.all(
            identifiers.map((identifier) => {
                return this.deleteKey(identifier)
            }),
        )
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Removes a single key from redis database.
     */
    protected deleteKey(key: string): Promise<void> {
        return new Promise<void>((ok, fail) => {
            this.client.del(key, (err: any, result: any) => {
                if (err) return fail(err)
                ok()
            })
        })
    }

    /**
     * Loads redis dependency.
     */
    protected loadRedis(): any {
        try {
            if (this.clientType === "ioredis/cluster") {
                return PlatformTools.load("ioredis")
            } else {
                return PlatformTools.load(this.clientType)
            }
        } catch (e) {
            throw new TypeORMError(
                `Cannot use cache because ${this.clientType} is not installed. Please run "npm i ${this.clientType} --save".`,
            )
        }
    }
}
