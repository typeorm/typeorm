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

    /**
     * Whether the Redis client uses Promise-based API (v5+) or callback-based API (v3/v4).
     * Detected at runtime after connection.
     */
    protected isPromiseBasedApi: boolean = false

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
            const clientOptions = {
                ...cacheOptions?.options,
            }

            // Create initial client to test Redis version
            let tempClient = this.redis.createClient(clientOptions)
            const isRedis4Plus = typeof tempClient.connect === "function"

            if (isRedis4Plus) {
                // Redis 4+ detected, recreate with legacyMode for Redis 4.x
                // (Redis 5 will ignore legacyMode if not needed)
                clientOptions.legacyMode = true
                tempClient = this.redis.createClient(clientOptions)
            }

            // Set as the main client
            this.client = tempClient

            if (
                typeof this.connection.options.cache === "object" &&
                this.connection.options.cache.ignoreErrors
            ) {
                this.client.on("error", (err: any) => {
                    this.connection.logger.log("warn", err)
                })
            }

            // Connect if Redis 4+
            if (typeof this.client.connect === "function") {
                await this.client.connect()
            }

            // Detect API style by checking if methods return Promises
            this.detectPromiseBasedApi()
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
        if (this.isPromiseBasedApi) {
            await this.client.quit()
            this.client = undefined
            return
        }

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
        const key = options.identifier || options.query
        if (!key) return Promise.resolve(undefined)

        if (this.isPromiseBasedApi) {
            return this.client.get(key).then((result: any) => {
                return result ? JSON.parse(result) : undefined
            })
        }

        return new Promise<QueryResultCacheOptions | undefined>((ok, fail) => {
            this.client.get(key, (err: any, result: any) => {
                if (err) return fail(err)
                ok(result ? JSON.parse(result) : undefined)
            })
        })
    }

    /**
     * Checks if cache is expired or not.
     */
    isExpired(savedCache: QueryResultCacheOptions): boolean {
        return savedCache.time! + savedCache.duration < Date.now()
    }

    /**
     * Stores given query result in the cache.
     */
    async storeInCache(
        options: QueryResultCacheOptions,
        savedCache: QueryResultCacheOptions,
        queryRunner?: QueryRunner,
    ): Promise<void> {
        const key = options.identifier || options.query
        if (!key) return

        const value = JSON.stringify(options)
        const duration = options.duration

        if (this.isPromiseBasedApi) {
            await this.client.set(key, value, {
                PX: duration,
            })
            return
        }

        return new Promise<void>((ok, fail) => {
            this.client.set(
                key,
                value,
                "PX",
                duration,
                (err: any, result: any) => {
                    if (err) return fail(err)
                    ok()
                },
            )
        })
    }

    /**
     * Clears everything stored in the cache.
     */
    async clear(queryRunner?: QueryRunner): Promise<void> {
        if (this.isPromiseBasedApi) {
            await this.client.flushDb()
            return
        }

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
    protected async deleteKey(key: string): Promise<void> {
        if (this.isPromiseBasedApi) {
            await this.client.del(key)
            return
        }

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
        } catch {
            throw new TypeORMError(
                `Cannot use cache because ${this.clientType} is not installed. Please run "npm i ${this.clientType}".`,
            )
        }
    }

    /**
     * Detects whether the Redis client uses Promise-based API (v5+) or callback-based API (v3/v4)
     * by checking the return type of a method call at runtime.
     */
    private detectPromiseBasedApi(): void {
        if (this.clientType !== "redis") {
            this.isPromiseBasedApi = false
            return
        }

        // Call ping() and check if it returns a Promise
        // This works because v5+ returns Promises directly, while v4 with legacyMode uses callbacks
        const result = this.client.ping()
        this.isPromiseBasedApi = result && typeof result.then === "function"
    }
}
