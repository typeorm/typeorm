"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbQueryResultCache = void 0;
const tslib_1 = require("tslib");
const OracleDriver_1 = require("../driver/oracle/OracleDriver");
const MssqlParameter_1 = require("../driver/sqlserver/MssqlParameter");
const SqlServerDriver_1 = require("../driver/sqlserver/SqlServerDriver");
const Table_1 = require("../schema-builder/table/Table");
/**
 * Caches query result into current database, into separate table called "query-result-cache".
 */
class DbQueryResultCache {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(connection) {
        this.connection = connection;
        const options = this.connection.driver.options;
        const cacheOptions = typeof this.connection.options.cache === "object" ? this.connection.options.cache : {};
        const cacheTableName = cacheOptions.tableName || "query-result-cache";
        this.queryResultCacheTable = this.connection.driver.buildTableName(cacheTableName, options.schema, options.database);
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a connection with given cache provider.
     */
    connect() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
        });
    }
    /**
     * Disconnects with given cache provider.
     */
    disconnect() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
        });
    }
    /**
     * Creates table for storing cache if it does not exist yet.
     */
    synchronize(queryRunner) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            queryRunner = this.getQueryRunner(queryRunner);
            const driver = this.connection.driver;
            const tableExist = yield queryRunner.hasTable(this.queryResultCacheTable); // todo: table name should be configurable
            if (tableExist)
                return;
            yield queryRunner.createTable(new Table_1.Table({
                name: this.queryResultCacheTable,
                columns: [
                    {
                        name: "id",
                        isPrimary: true,
                        isNullable: false,
                        type: driver.normalizeType({ type: driver.mappedDataTypes.cacheId }),
                        generationStrategy: "increment",
                        isGenerated: true
                    },
                    {
                        name: "identifier",
                        type: driver.normalizeType({ type: driver.mappedDataTypes.cacheIdentifier }),
                        isNullable: true
                    },
                    {
                        name: "time",
                        type: driver.normalizeType({ type: driver.mappedDataTypes.cacheTime }),
                        isPrimary: false,
                        isNullable: false
                    },
                    {
                        name: "duration",
                        type: driver.normalizeType({ type: driver.mappedDataTypes.cacheDuration }),
                        isPrimary: false,
                        isNullable: false
                    },
                    {
                        name: "query",
                        type: driver.normalizeType({ type: driver.mappedDataTypes.cacheQuery }),
                        isPrimary: false,
                        isNullable: false
                    },
                    {
                        name: "result",
                        type: driver.normalizeType({ type: driver.mappedDataTypes.cacheResult }),
                        isNullable: false
                    },
                ]
            }));
        });
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
                .setParameters({ identifier: this.connection.driver instanceof SqlServerDriver_1.SqlServerDriver ? new MssqlParameter_1.MssqlParameter(options.identifier, "nvarchar") : options.identifier })
                .getRawOne();
        }
        else if (options.query) {
            if (this.connection.driver instanceof OracleDriver_1.OracleDriver) {
                return qb
                    .where(`dbms_lob.compare(${qb.escape("cache")}.${qb.escape("query")}, :query) = 0`, { query: options.query })
                    .getRawOne();
            }
            return qb
                .where(`${qb.escape("cache")}.${qb.escape("query")} = :query`)
                .setParameters({ query: this.connection.driver instanceof SqlServerDriver_1.SqlServerDriver ? new MssqlParameter_1.MssqlParameter(options.query, "nvarchar") : options.query })
                .getRawOne();
        }
        return Promise.resolve(undefined);
    }
    /**
     * Checks if cache is expired or not.
     */
    isExpired(savedCache) {
        const duration = typeof savedCache.duration === "string" ? parseInt(savedCache.duration) : savedCache.duration;
        return ((typeof savedCache.time === "string" ? parseInt(savedCache.time) : savedCache.time) + duration) < new Date().getTime();
    }
    /**
     * Stores given query result in the cache.
     */
    storeInCache(options, savedCache, queryRunner) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            queryRunner = this.getQueryRunner(queryRunner);
            let insertedValues = options;
            if (this.connection.driver instanceof SqlServerDriver_1.SqlServerDriver) { // todo: bad abstraction, re-implement this part, probably better if we create an entity metadata for cache table
                insertedValues = {
                    identifier: new MssqlParameter_1.MssqlParameter(options.identifier, "nvarchar"),
                    time: new MssqlParameter_1.MssqlParameter(options.time, "bigint"),
                    duration: new MssqlParameter_1.MssqlParameter(options.duration, "int"),
                    query: new MssqlParameter_1.MssqlParameter(options.query, "nvarchar"),
                    result: new MssqlParameter_1.MssqlParameter(options.result, "nvarchar"),
                };
            }
            if (savedCache && savedCache.identifier) { // if exist then update
                const qb = queryRunner.manager
                    .createQueryBuilder()
                    .update(this.queryResultCacheTable)
                    .set(insertedValues);
                qb.where(`${qb.escape("identifier")} = :condition`, { condition: insertedValues.identifier });
                yield qb.execute();
            }
            else if (savedCache && savedCache.query) { // if exist then update
                const qb = queryRunner.manager
                    .createQueryBuilder()
                    .update(this.queryResultCacheTable)
                    .set(insertedValues);
                if (this.connection.driver instanceof OracleDriver_1.OracleDriver) {
                    qb.where(`dbms_lob.compare("query", :condition) = 0`, { condition: insertedValues.query });
                }
                else {
                    qb.where(`${qb.escape("query")} = :condition`, { condition: insertedValues.query });
                }
                yield qb.execute();
            }
            else { // otherwise insert
                yield queryRunner.manager
                    .createQueryBuilder()
                    .insert()
                    .into(this.queryResultCacheTable)
                    .values(insertedValues)
                    .execute();
            }
        });
    }
    /**
     * Clears everything stored in the cache.
     */
    clear(queryRunner) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return this.getQueryRunner(queryRunner).clearTable(this.queryResultCacheTable);
        });
    }
    /**
     * Removes all cached results by given identifiers from cache.
     */
    remove(identifiers, queryRunner) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield Promise.all(identifiers.map(identifier => {
                const qb = this.getQueryRunner(queryRunner).manager.createQueryBuilder();
                return qb.delete()
                    .from(this.queryResultCacheTable)
                    .where(`${qb.escape("identifier")} = :identifier`, { identifier })
                    .execute();
            }));
        });
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