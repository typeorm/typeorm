import { QueryResultCache } from "./QueryResultCache"
import { QueryResultCacheOptions } from "./QueryResultCacheOptions"
import { PlatformTools } from "../platform/PlatformTools"
import { DataSource } from "../data-source/DataSource"
import { QueryRunner } from "../query-runner/QueryRunner"
import { TypeORMError } from "../error/TypeORMError"
import Redis, { Cluster } from "ioredis"
import { RedisClientType } from "redis"

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
    protected client: RedisClientType | Redis | Cluster

    /**
     * Type of the Redis Client (redis or ioredis).
     */
    protected clientType: "redis" | "ioredis" | "ioredis/cluster"

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(
        protected dataSource: DataSource,
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
        const cacheOptions: any = this.dataSource.options.cache
        if (this.clientType === "redis") {
            const clientOptions = {
                ...cacheOptions?.options,
            }

            this.client = this.redis.createClient(clientOptions)

            if (
                typeof this.dataSource.options.cache === "object" &&
                this.dataSource.options.cache.ignoreErrors
            ) {
                this.client.on("error", (err: any) => {
                    this.dataSource.logger.log("warn", err)
                })
            }

            await this.client.connect()
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
        await this.client.quit()
    }

    /**
     * Creates table for storing cache if it does not exist yet.
     * @param queryRunner
     */
    async synchronize(queryRunner: QueryRunner): Promise<void> {}

    /**
     * Get data from cache.
     * Returns cache result if found.
     * Returns undefined if result is not cached.
     * @param options
     * @param queryRunner
     */
    async getFromCache(
        options: QueryResultCacheOptions,
        queryRunner?: QueryRunner,
    ): Promise<QueryResultCacheOptions | undefined> {
        const key = options.identifier || options.query
        if (!key) return Promise.resolve(undefined)

        return this.client.get(key).then((result: any) => {
            return result ? JSON.parse(result) : undefined
        })
    }

    /**
     * Checks if cache is expired or not.
     * @param savedCache
     */
    isExpired(savedCache: QueryResultCacheOptions): boolean {
        return savedCache.time! + savedCache.duration < Date.now()
    }

    /**
     * Stores given query result in the cache.
     * @param options
     * @param savedCache
     * @param queryRunner
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

        await this.client.set(key, value, "PX", duration)
    }

    /**
     * Clears everything stored in the cache.
     * @param queryRunner
     */
    async clear(queryRunner?: QueryRunner): Promise<void> {
        if (this.clientType === "redis") {
            const client = this.client as RedisClientType
            await client.flushDb()
        } else {
            const client = this.client as Redis | Cluster
            await client.flushdb()
        }
    }

    /**
     * Removes all cached results by given identifiers from cache.
     * @param identifiers
     * @param queryRunner
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
     * @param key
     */
    protected async deleteKey(key: string): Promise<void> {
        await this.client.del([key])
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
}
