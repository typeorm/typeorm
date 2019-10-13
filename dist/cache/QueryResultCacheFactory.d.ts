import { QueryResultCache } from "./QueryResultCache";
import { Connection } from "../connection/Connection";
/**
 * Caches query result into Redis database.
 */
export declare class QueryResultCacheFactory {
    protected connection: Connection;
    constructor(connection: Connection);
    /**
     * Creates a new query result cache based on connection options.
     */
    create(): QueryResultCache;
}
