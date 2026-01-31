import { Driver } from "../Driver"
import { DriverCapabilities } from "../types/DriverCapabilities"
import { PostgresDriver } from "../postgres/PostgresDriver"
import { PlatformTools } from "../../platform/PlatformTools"
import { DataSource } from "../../data-source/DataSource"
import { AuroraPostgresConnectionOptions } from "./AuroraPostgresConnectionOptions"
import { AuroraPostgresQueryRunner } from "./AuroraPostgresQueryRunner"
import { ReplicationMode } from "../types/ReplicationMode"
import { ColumnMetadata } from "../../metadata/ColumnMetadata"
import { ApplyValueTransformers } from "../../util/ApplyValueTransformers"
import { DriverUtils } from "../DriverUtils"

abstract class PostgresWrapper extends PostgresDriver {
    declare options: any

    abstract createQueryRunner(mode: ReplicationMode): any
}

export class AuroraPostgresDriver extends PostgresWrapper implements Driver {
    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Connection used by driver.
     */
    connection: DataSource

    /**
     * Aurora Data API underlying library.
     */
    DataApiDriver: any

    client: any

    /**
     * Represent transaction support by this driver
     */
    transactionSupport = "nested" as const

    capabilities: DriverCapabilities = {
        // Dialect - Same as Postgres
        stringAggregation: "STRING_AGG",
        pagination: "LIMIT_OFFSET",
        useIndexHint: false,
        maxExecutionTimeHint: false,
        distinctOn: true,

        // Upsert
        upsertStyle: "ON_CONFLICT",
        upsertConflictWhere: true,

        // Returning
        returningInsert: true,
        returningUpdate: true,
        returningDelete: true,
        returningStyle: "RETURNING",
        returningRequiresInto: false,

        // Update/Delete
        limitInUpdate: false,
        limitInDelete: false,
        joinInUpdate: true,

        // Locking
        forUpdate: true,
        forShareStyle: "FOR_SHARE",
        forKeyShare: true,
        forNoKeyUpdate: true,
        skipLocked: true,
        nowait: true,
        lockOfTables: true,

        // CTE
        cteEnabled: true,
        cteRecursive: true,
        cteRequiresRecursiveKeyword: true,
        cteWritable: true,
        cteMaterializedHint: true,

        // DDL
        indexTypes: ["brin", "btree", "gin", "gist", "hash", "spgist"],
        defaultIndexType: "btree",
        partialIndexes: true,
        expressionIndexes: true,

        // Column types
        requiresColumnLength: false,
        jsonColumnType: true,
        uuidColumnType: true,
        arrayColumnType: true,

        // Transactions
        transactionSupport: "nested",
    }

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Connection options.
     */
    options: AuroraPostgresConnectionOptions

    /**
     * Master database used to perform all write queries.
     */
    database?: string

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: DataSource) {
        super()
        this.connection = connection
        this.options = connection.options as AuroraPostgresConnectionOptions
        this.isReplicated = false

        // load data-api package
        this.loadDependencies()

        this.client = new this.DataApiDriver(
            this.options.region,
            this.options.secretArn,
            this.options.resourceArn,
            this.options.database,
            (query: string, parameters?: any[]) =>
                this.connection.logger.logQuery(query, parameters),
            this.options.serviceConfigOptions,
            this.options.formatOptions,
        )

        this.database = DriverUtils.buildDriverOptions(this.options).database
    }

    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     * Based on pooling options, it can either create connection immediately,
     * either create a pool and create connection when needed.
     */
    async connect(): Promise<void> {}

    /**
     * Closes connection with database.
     */
    async disconnect(): Promise<void> {}

    /**
     * Creates a query runner used to execute database queries.
     * @param mode
     */
    createQueryRunner(mode: ReplicationMode) {
        return new AuroraPostgresQueryRunner(
            this,
            new this.DataApiDriver(
                this.options.region,
                this.options.secretArn,
                this.options.resourceArn,
                this.options.database,
                (query: string, parameters?: any[]) =>
                    this.connection.logger.logQuery(query, parameters),
                this.options.serviceConfigOptions,
                this.options.formatOptions,
            ),
            mode,
        )
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     * @param value
     * @param columnMetadata
     */
    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        if (
            this.options.formatOptions &&
            this.options.formatOptions.castParameters === false
        ) {
            return super.preparePersistentValue(value, columnMetadata)
        }

        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformTo(
                columnMetadata.transformer,
                value,
            )

        return this.client.preparePersistentValue(value, columnMetadata)
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     * @param value
     * @param columnMetadata
     */
    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any {
        if (
            this.options.formatOptions &&
            this.options.formatOptions.castParameters === false
        ) {
            return super.prepareHydratedValue(value, columnMetadata)
        }

        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformFrom(
                columnMetadata.transformer,
                value,
            )

        return this.client.prepareHydratedValue(value, columnMetadata)
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        const driver =
            this.options.driver ||
            PlatformTools.load("typeorm-aurora-data-api-driver")
        const { pg } = driver

        this.DataApiDriver = pg
    }

    /**
     * Executes given query.
     * @param connection
     * @param query
     */
    protected executeQuery(connection: any, query: string) {
        return this.connection.query(query)
    }

    /**
     * Makes any action after connection (e.g. create extensions in Postgres driver).
     */
    async afterConnect(): Promise<void> {
        const extensionsMetadata = await this.checkMetadataForExtensions()

        if (extensionsMetadata.hasExtensions) {
            await this.enableExtensions(extensionsMetadata, this.connection)
        }

        return Promise.resolve()
    }
}
