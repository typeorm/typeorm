"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbQueryResultCache = void 0;
const MssqlParameter_1 = require("../driver/sqlserver/MssqlParameter");
const Table_1 = require("../schema-builder/table/Table");
const uuid_1 = require("uuid");
/**
 * Caches query result into current database, into separate table called "query-result-cache".
 */
class DbQueryResultCache {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(connection) {
        this.connection = connection;
        const { schema } = this.connection.driver.options;
        const database = this.connection.driver.database;
        const cacheOptions = typeof this.connection.options.cache === "object"
            ? this.connection.options.cache
            : {};
        const cacheTableName = cacheOptions.tableName || "query-result-cache";
        this.queryResultCacheDatabase = database;
        this.queryResultCacheSchema = schema;
        this.queryResultCacheTable = this.connection.driver.buildTableName(cacheTableName, schema, database);
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a connection with given cache provider.
     */
    async connect() { }
    /**
     * Disconnects with given cache provider.
     */
    async disconnect() { }
    /**
     * Creates table for storing cache if it does not exist yet.
     */
    async synchronize(queryRunner) {
        queryRunner = this.getQueryRunner(queryRunner);
        const driver = this.connection.driver;
        const tableExist = await queryRunner.hasTable(this.queryResultCacheTable); // todo: table name should be configurable
        if (tableExist)
            return;
        await queryRunner.createTable(new Table_1.Table({
            database: this.queryResultCacheDatabase,
            schema: this.queryResultCacheSchema,
            name: this.queryResultCacheTable,
            columns: [
                {
                    name: "id",
                    isPrimary: true,
                    isNullable: false,
                    type: driver.normalizeType({
                        type: driver.mappedDataTypes.cacheId,
                    }),
                    generationStrategy: driver.options.type === "spanner"
                        ? "uuid"
                        : "increment",
                    isGenerated: true,
                },
                {
                    name: "identifier",
                    type: driver.normalizeType({
                        type: driver.mappedDataTypes.cacheIdentifier,
                    }),
                    isNullable: true,
                },
                {
                    name: "time",
                    type: driver.normalizeType({
                        type: driver.mappedDataTypes.cacheTime,
                    }),
                    isPrimary: false,
                    isNullable: false,
                },
                {
                    name: "duration",
                    type: driver.normalizeType({
                        type: driver.mappedDataTypes.cacheDuration,
                    }),
                    isPrimary: false,
                    isNullable: false,
                },
                {
                    name: "query",
                    type: driver.normalizeType({
                        type: driver.mappedDataTypes.cacheQuery,
                    }),
                    isPrimary: false,
                    isNullable: false,
                },
                {
                    name: "result",
                    type: driver.normalizeType({
                        type: driver.mappedDataTypes.cacheResult,
                    }),
                    isNullable: false,
                },
            ],
        }));
    }
    /**
     * Caches given query result.
     * Returns cache result if found.
     * Returns undefined if result is not cached.
     */
    getFromCache(options, queryRunner) {
        queryRunner = this.getQueryRunner(queryRunner);
        const qb = this.connection
            .createQueryBuilder(queryRunner)
            .select()
            .from(this.queryResultCacheTable, "cache");
        if (options.identifier) {
            return qb
                .where(`${qb.escape("cache")}.${qb.escape("identifier")} = :identifier`)
                .setParameters({
                identifier: this.connection.driver.options.type === "mssql"
                    ? new MssqlParameter_1.MssqlParameter(options.identifier, "nvarchar")
                    : options.identifier,
            })
                .getRawOne();
        }
        else if (options.query) {
            if (this.connection.driver.options.type === "oracle") {
                return qb
                    .where(`dbms_lob.compare(${qb.escape("cache")}.${qb.escape("query")}, :query) = 0`, { query: options.query })
                    .getRawOne();
            }
            return qb
                .where(`${qb.escape("cache")}.${qb.escape("query")} = :query`)
                .setParameters({
                query: this.connection.driver.options.type === "mssql"
                    ? new MssqlParameter_1.MssqlParameter(options.query, "nvarchar")
                    : options.query,
            })
                .getRawOne();
        }
        return Promise.resolve(undefined);
    }
    /**
     * Checks if cache is expired or not.
     */
    isExpired(savedCache) {
        const duration = typeof savedCache.duration === "string"
            ? parseInt(savedCache.duration)
            : savedCache.duration;
        return ((typeof savedCache.time === "string"
            ? parseInt(savedCache.time)
            : savedCache.time) +
            duration <
            new Date().getTime());
    }
    /**
     * Stores given query result in the cache.
     */
    async storeInCache(options, savedCache, queryRunner) {
        const shouldCreateQueryRunner = queryRunner === undefined ||
            (queryRunner === null || queryRunner === void 0 ? void 0 : queryRunner.getReplicationMode()) === "slave";
        if (queryRunner === undefined || shouldCreateQueryRunner) {
            queryRunner = this.connection.createQueryRunner("master");
        }
        let insertedValues = options;
        if (this.connection.driver.options.type === "mssql") {
            // todo: bad abstraction, re-implement this part, probably better if we create an entity metadata for cache table
            insertedValues = {
                identifier: new MssqlParameter_1.MssqlParameter(options.identifier, "nvarchar"),
                time: new MssqlParameter_1.MssqlParameter(options.time, "bigint"),
                duration: new MssqlParameter_1.MssqlParameter(options.duration, "int"),
                query: new MssqlParameter_1.MssqlParameter(options.query, "nvarchar"),
                result: new MssqlParameter_1.MssqlParameter(options.result, "nvarchar"),
            };
        }
        if (savedCache && savedCache.identifier) {
            // if exist then update
            const qb = queryRunner.manager
                .createQueryBuilder()
                .update(this.queryResultCacheTable)
                .set(insertedValues);
            qb.where(`${qb.escape("identifier")} = :condition`, {
                condition: insertedValues.identifier,
            });
            await qb.execute();
        }
        else if (savedCache && savedCache.query) {
            // if exist then update
            const qb = queryRunner.manager
                .createQueryBuilder()
                .update(this.queryResultCacheTable)
                .set(insertedValues);
            if (this.connection.driver.options.type === "oracle") {
                qb.where(`dbms_lob.compare("query", :condition) = 0`, {
                    condition: insertedValues.query,
                });
            }
            else {
                qb.where(`${qb.escape("query")} = :condition`, {
                    condition: insertedValues.query,
                });
            }
            await qb.execute();
        }
        else {
            // Spanner does not support auto-generated columns
            if (this.connection.driver.options.type === "spanner" &&
                !insertedValues.id) {
                insertedValues.id = (0, uuid_1.v4)();
            }
            // otherwise insert
            await queryRunner.manager
                .createQueryBuilder()
                .insert()
                .into(this.queryResultCacheTable)
                .values(insertedValues)
                .execute();
        }
        if (shouldCreateQueryRunner) {
            await queryRunner.release();
        }
    }
    /**
     * Clears everything stored in the cache.
     */
    async clear(queryRunner) {
        return this.getQueryRunner(queryRunner).clearTable(this.queryResultCacheTable);
    }
    /**
     * Removes all cached results by given identifiers from cache.
     */
    async remove(identifiers, queryRunner) {
        await Promise.all(identifiers.map((identifier) => {
            const qb = this.getQueryRunner(queryRunner).manager.createQueryBuilder();
            return qb
                .delete()
                .from(this.queryResultCacheTable)
                .where(`${qb.escape("identifier")} = :identifier`, {
                identifier,
            })
                .execute();
        }));
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Gets a query runner to work with.
     */
    getQueryRunner(queryRunner) {
        if (queryRunner)
            return queryRunner;
        return this.connection.createQueryRunner();
    }
}
exports.DbQueryResultCache = DbQueryResultCache;

//# sourceMappingURL=DbQueryResultCache.js.map
