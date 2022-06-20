import { QueryResultCache } from "./QueryResultCache";
import { DataSource } from "../data-source/DataSource";
/**
 * Caches query result into Redis database.
 */
export declare class QueryResultCacheFactory {
    protected connection: DataSource;
    constructor(connection: DataSource);
    /**
     * Creates a new query result cache based on connection options.
     */
    create(): QueryResultCache;
}
