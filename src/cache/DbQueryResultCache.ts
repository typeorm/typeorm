import { ObjectLiteral } from "../common/ObjectLiteral"
import { DataSource } from "../data-source/DataSource"
import { MssqlParameter } from "../driver/sqlserver/MssqlParameter"
import { QueryRunner } from "../query-runner/QueryRunner"
import { Table } from "../schema-builder/table/Table"
import { QueryResultCache } from "./QueryResultCache"
import { QueryResultCacheOptions } from "./QueryResultCacheOptions"
import { v4 as uuidv4 } from "uuid"

/**
 * Caches query result into current database, into separate table called "query-result-cache".
 */
export class DbQueryResultCache implements QueryResultCache {
    // -------------------------------------------------------------------------
    // Private properties
    // -------------------------------------------------------------------------

    private queryResultCacheTable: string

    private queryResultCacheDatabase?: string

    private queryResultCacheSchema?: string

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: DataSource) {
        const { schema } = this.connection.driver.options as any
        const database = this.connection.driver.database
        const cacheOptions =
            typeof this.connection.options.cache === "object"
                ? this.connection.options.cache
                : {}
        const cacheTableName = cacheOptions.tableName || "query-result-cache"

        this.queryResultCacheDatabase = database
        this.queryResultCacheSchema = schema
        this.queryResultCacheTable = this.connection.driver.buildTableName(
            cacheTableName,
            schema,
            database,
        )
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a connection with given cache provider.
     */
    async connect(): Promise<void> {}

    /**
     * Disconnects with given cache provider.
     */
    async disconnect(): Promise<void> {}

    /**
     * Creates table for storing cache if it does not exist yet.
     */
    async synchronize(queryRunner?: QueryRunner): Promise<void> {
        queryRunner = this.getQueryRunner(queryRunner)
        const driver = this.connection.driver
        const tableExist = await queryRunner.hasTable(
            this.queryResultCacheTable,
        ) // todo: table name should be configurable
        if (tableExist) return

        await queryRunner.createTable(
            new Table({
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
                        generationStrategy:
                            driver.options.type === "spanner"
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
            }),
        )
    }

    /**
     * Get data from cache.
     * Returns cache result if found.
     * Returns undefined if result is not cached.
     */
    getFromCache(
        options: QueryResultCacheOptions,
        queryRunner?: QueryRunner,
    ): Promise<QueryResultCacheOptions | undefined> {
        queryRunner = this.getQueryRunner(queryRunner)
        const qb = this.connection
            .createQueryBuilder(queryRunner)
            .select()
            .from(this.queryResultCacheTable, "cache")

        if (options.identifier) {
            return qb
                .where(
                    `${qb.escape("cache")}.${qb.escape(
                        "identifier",
                    )} = :identifier`,
                )
                .setParameters({
                    identifier:
                        this.connection.driver.options.type === "mssql"
                            ? new MssqlParameter(options.identifier, "nvarchar")
                            : options.identifier,
                })
                .getRawOne()
        } else if (options.query) {
            if (this.connection.driver.options.type === "oracle") {
                return qb
                    .where(
                        `dbms_lob.compare(${qb.escape("cache")}.${qb.escape(
                            "query",
                        )}, :query) = 0`,
                        { query: options.query },
                    )
                    .getRawOne()
            }

            return qb
                .where(`${qb.escape("cache")}.${qb.escape("query")} = :query`)
                .setParameters({
                    query:
                        this.connection.driver.options.type === "mssql"
                            ? new MssqlParameter(options.query, "nvarchar")
                            : options.query,
                })
                .getRawOne()
        }

        return Promise.resolve(undefined)
    }

    /**
     * Checks if cache is expired or not.
     */
    isExpired(savedCache: QueryResultCacheOptions): boolean {
        const duration =
            typeof savedCache.duration === "string"
                ? parseInt(savedCache.duration)
                : savedCache.duration
        return (
            (typeof savedCache.time === "string"
                ? parseInt(savedCache.time as any)
                : savedCache.time)! +
                duration <
            new Date().getTime()
        )
    }

    /**
     * Stores given query result in the cache.
     */
    async storeInCache(
        options: QueryResultCacheOptions,
        savedCache: QueryResultCacheOptions | undefined,
        queryRunner?: QueryRunner,
    ): Promise<void> {
        const shouldCreateQueryRunner =
            queryRunner === undefined ||
            queryRunner?.getReplicationMode() === "slave"

        if (queryRunner === undefined || shouldCreateQueryRunner) {
            queryRunner = this.connection.createQueryRunner("master")
        }

        let insertedValues: ObjectLiteral = options
        if (this.connection.driver.options.type === "mssql") {
            // todo: bad abstraction, re-implement this part, probably better if we create an entity metadata for cache table
            insertedValues = {
                identifier: new MssqlParameter(options.identifier, "nvarchar"),
                time: new MssqlParameter(options.time, "bigint"),
                duration: new MssqlParameter(options.duration, "int"),
                query: new MssqlParameter(options.query, "nvarchar"),
                result: new MssqlParameter(options.result, "nvarchar"),
            }
        }

        if (savedCache && savedCache.identifier) {
            // if exist then update
            const qb = queryRunner.manager
                .createQueryBuilder()
                .update(this.queryResultCacheTable)
                .set(insertedValues)

            qb.where(`${qb.escape("identifier")} = :condition`, {
                condition: insertedValues.identifier,
            })
            await qb.execute()
        } else if (savedCache && savedCache.query) {
            // if exist then update
            const qb = queryRunner.manager
                .createQueryBuilder()
                .update(this.queryResultCacheTable)
                .set(insertedValues)

            if (this.connection.driver.options.type === "oracle") {
                qb.where(`dbms_lob.compare("query", :condition) = 0`, {
                    condition: insertedValues.query,
                })
            } else {
                qb.where(`${qb.escape("query")} = :condition`, {
                    condition: insertedValues.query,
                })
            }

            await qb.execute()
        } else {
            // Spanner does not support auto-generated columns
            if (
                this.connection.driver.options.type === "spanner" &&
                !insertedValues.id
            ) {
                insertedValues.id = uuidv4()
            }

            // otherwise insert
            await queryRunner.manager
                .createQueryBuilder()
                .insert()
                .into(this.queryResultCacheTable)
                .values(insertedValues)
                .execute()
        }

        if (shouldCreateQueryRunner) {
            await queryRunner.release()
        }
    }

    /**
     * Clears everything stored in the cache.
     */
    async clear(queryRunner: QueryRunner): Promise<void> {
        return this.getQueryRunner(queryRunner).clearTable(
            this.queryResultCacheTable,
        )
    }

    /**
     * Removes all cached results by given identifiers from cache.
     */
    async remove(
        identifiers: string[],
        queryRunner?: QueryRunner,
    ): Promise<void> {
        let _queryRunner: QueryRunner = queryRunner || this.getQueryRunner()
        await Promise.all(
            identifiers.map((identifier) => {
                const qb = _queryRunner.manager.createQueryBuilder()
                return qb
                    .delete()
                    .from(this.queryResultCacheTable)
                    .where(`${qb.escape("identifier")} = :identifier`, {
                        identifier,
                    })
                    .execute()
            }),
        )

        if (!queryRunner) {
            await _queryRunner.release()
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Gets a query runner to work with.
     */
    protected getQueryRunner(queryRunner?: QueryRunner): QueryRunner {
        if (queryRunner) return queryRunner

        return this.connection.createQueryRunner()
    }
}
