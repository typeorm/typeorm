import {QueryResultCache} from "./QueryResultCache";
import {QueryResultCacheOptions} from "./QueryResultCacheOptions";
import {PlatformTools} from "../platform/PlatformTools";
import {Connection} from "../connection/Connection";
import {QueryRunner} from "../query-runner/QueryRunner";

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
    protected redis: any;

    /**
     * Connected redis client.
     */
    protected client: any;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection) {
        this.redis = this.loadRedis();
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a connection with given cache provider.
     */
    async connect(): Promise<void> {
        const cacheOptions: any = this.connection.options.cache;
        if (cacheOptions && cacheOptions.options) {
            this.client = this.redis.createClient(cacheOptions.options);
        } else {
            this.client = this.redis.createClient();
        }
    }

    /**
     * Creates a connection with given cache provider.
     */
    async disconnect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            this.client.quit((err: any, result: any) => {
                if (err) return fail(err);
                ok();
                this.client = undefined;
            });
        });
    }

    /**
     * Creates table for storing cache if it does not exist yet.
     */
    async synchronize(queryRunner: QueryRunner): Promise<void> {
    }

    /**
     * Caches given query result.
     * Returns cache result if found.
     * Returns undefined if result is not cached.
     */
    getFromCache(options: QueryResultCacheOptions, queryRunner?: QueryRunner): Promise<QueryResultCacheOptions|undefined> {
        return new Promise<QueryResultCacheOptions|undefined>((ok, fail) => {

            if (options.identifier) {
                this.client.get(options.identifier, (err: any, result: any) => {
                    if (err) return fail(err);
                    ok(JSON.parse(result));
                });

            } else if (options.query) {
                this.client.get(options.query, (err: any, result: any) => {
                    if (err) return fail(err);
                    ok(JSON.parse(result));
                });

            } else {
                ok(undefined);
            }
        });
    }

    /**
     * Checks if cache is expired or not.
     */
    isExpired(savedCache: QueryResultCacheOptions): boolean {
        return (savedCache.time! + savedCache.duration) < new Date().getTime();
    }

    /**
     * Stores given query result in the cache.
     */
    async storeInCache(options: QueryResultCacheOptions, savedCache: QueryResultCacheOptions, queryRunner?: QueryRunner): Promise<void> {
        return new Promise<void>((ok, fail) => {
            if (options.identifier) {
                this.client.set(options.identifier, JSON.stringify(options), (err: any, result: any) => {
                    if (err) return fail(err);
                    ok();
                });

            } else if (options.query) {
                this.client.set(options.query, JSON.stringify(options), (err: any, result: any) => {
                    if (err) return fail(err);
                    ok();
                });
            }
        });
    }

    /**
     * Clears everything stored in the cache.
     */
    async clear(queryRunner?: QueryRunner): Promise<void> {
        return new Promise<void>((ok, fail) => {
            this.client.flushdb((err: any, result: any) => {
                if (err) return fail(err);
                ok();
            });
        });
    }

    /**
     * Removes all cached results by given identifiers from cache.
     */
    async remove(identifiers: string[], queryRunner?: QueryRunner): Promise<void> {
        await Promise.all(identifiers.map(identifier => {
            return this.deleteKey(identifier);
        }));
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
                if (err) return fail(err);
                ok();
            });
        });
    }

    /**
     * Loads redis dependency.
     */
    protected loadRedis(): any {
        try {
            return PlatformTools.load("redis");

        } catch (e) {
            throw new Error(`Cannot use cache because redis is not installed. Please run "npm i redis --save".`);
        }
    }


}