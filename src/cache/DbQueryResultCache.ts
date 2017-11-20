import {QueryResultCache} from "./QueryResultCache";
import {QueryResultCacheOptions} from "./QueryResultCacheOptions";
import {Table} from "../schema-builder/schema/Table";
import {TableColumn} from "../schema-builder/schema/TableColumn";
import {QueryRunner} from "../query-runner/QueryRunner";
import {Connection} from "../connection/Connection";
import {SqlServerDriver} from "../driver/sqlserver/SqlServerDriver";
import {MssqlParameter} from "../driver/sqlserver/MssqlParameter";
import {ObjectLiteral} from "../common/ObjectLiteral";

/**
 * Caches query result into current database, into separate table called "query-result-cache".
 */
export class DbQueryResultCache implements QueryResultCache {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a connection with given cache provider.
     */
    async connect(): Promise<void> {
    }

    /**
     * Disconnects with given cache provider.
     */
    async disconnect(): Promise<void> {
    }

    /**
     * Creates table for storing cache if it does not exist yet.
     */
    async synchronize(queryRunner?: QueryRunner): Promise<void> {
        queryRunner = this.getQueryRunner(queryRunner);
        const driver = this.connection.driver;
        const tableExist = await queryRunner.hasTable("query-result-cache"); // todo: table name should be configurable
        if (tableExist)
            return;

        await queryRunner.createTable(new Table("query-result-cache", [ // createTableIfNotExist
            new TableColumn({
                name: "id",
                isNullable: true,
                isPrimary: true,
                type: driver.normalizeType({ type: driver.mappedDataTypes.cacheId }),
                generationStrategy: "increment",
                isGenerated: true
            }),
            new TableColumn({
                name: "identifier",
                type: driver.normalizeType({ type: driver.mappedDataTypes.cacheIdentifier }),
                isNullable: true
            }),
            new TableColumn({
                name: "time",
                type: driver.normalizeType({ type: driver.mappedDataTypes.cacheTime }),
                isPrimary: false,
                isNullable: false
            }),
            new TableColumn({
                name: "duration",
                type: driver.normalizeType({ type: driver.mappedDataTypes.cacheDuration }),
                isPrimary: false,
                isNullable: false
            }),
            new TableColumn({
                name: "query",
                type: driver.normalizeType({ type: driver.mappedDataTypes.cacheQuery }),
                isPrimary: false,
                isNullable: false
            }),
            new TableColumn({
                name: "result",
                type: driver.normalizeType({ type: driver.mappedDataTypes.cacheResult }),
                isNullable: false
            }),
        ]));
    }

    /**
     * Caches given query result.
     * Returns cache result if found.
     * Returns undefined if result is not cached.
     */
    getFromCache(options: QueryResultCacheOptions, queryRunner?: QueryRunner): Promise<QueryResultCacheOptions|undefined> {
        queryRunner = this.getQueryRunner(queryRunner);
        const qb = this.connection
            .createQueryBuilder(queryRunner)
            .select()
            .from("query-result-cache", "cache");

        if (options.identifier) {
            return qb
                .where(`${qb.escape("cache")}.${qb.escape("identifier")} = :identifier`)
                .setParameters({ identifier: this.connection.driver instanceof SqlServerDriver ? new MssqlParameter(options.identifier, "nvarchar") : options.identifier })
                .getRawOne();

        } else if (options.query) {
            return qb
                .where(`${qb.escape("cache")}.${qb.escape("query")} = :query`)
                .setParameters({ query: this.connection.driver instanceof SqlServerDriver ? new MssqlParameter(options.query, "nvarchar") : options.query })
                .getRawOne();
        }

        return Promise.resolve(undefined);
    }

    /**
     * Checks if cache is expired or not.
     */
    isExpired(savedCache: QueryResultCacheOptions): boolean {
        return ((typeof savedCache.time === "string" ? parseInt(savedCache.time as any) : savedCache.time)! + savedCache.duration) < new Date().getTime();
    }

    /**
     * Stores given query result in the cache.
     */
    async storeInCache(options: QueryResultCacheOptions, savedCache: QueryResultCacheOptions|undefined, queryRunner?: QueryRunner): Promise<void> {
        queryRunner = this.getQueryRunner(queryRunner);

        let insertedValues: ObjectLiteral = options;
        if (this.connection.driver instanceof SqlServerDriver) { // todo: bad abstraction, re-implement this part, probably better if we create an entity metadata for cache table
            insertedValues = {
                identifier: new MssqlParameter(options.identifier, "nvarchar"),
                time: new MssqlParameter(options.time, "bigint"),
                duration: new MssqlParameter(options.duration, "int"),
                query: new MssqlParameter(options.query, "nvarchar"),
                result: new MssqlParameter(options.result, "nvarchar"),
            };
        }

        if (savedCache && savedCache.identifier) { // if exist then update

            await queryRunner.manager
                .createQueryBuilder()
                .update("query-result-cache")
                .set(insertedValues)
                .where({ identifier: insertedValues.identifier })
                .execute();

        } else if (savedCache && savedCache.query) { // if exist then update

            await queryRunner.manager
                .createQueryBuilder()
                .update("query-result-cache")
                .set(insertedValues)
                .where({ query: insertedValues.query })
                .execute();

        } else { // otherwise insert

            await queryRunner.manager
                .createQueryBuilder()
                .insert()
                .into("query-result-cache")
                .values(insertedValues)
                .execute();
        }
    }

    /**
     * Clears everything stored in the cache.
     */
    async clear(queryRunner: QueryRunner): Promise<void> {
        return this.getQueryRunner(queryRunner).truncate("query-result-cache");
    }

    /**
     * Removes all cached results by given identifiers from cache.
     */
    async remove(identifiers: string[], queryRunner?: QueryRunner): Promise<void> {
        await Promise.all(identifiers.map(identifier => {
            return this.getQueryRunner(queryRunner).manager
                .createQueryBuilder()
                .delete()
                .from("query-result-cache")
                .where(identifier)
                .execute();
        }));
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Gets a query runner to work with.
     */
    protected getQueryRunner(queryRunner: QueryRunner|undefined): QueryRunner {
        if (queryRunner)
            return queryRunner;

        return this.connection.createQueryRunner("master");
    }

}