import { PgDriverAdapter } from "./PgDriverAdapter"
import type {
    PostgresDriverAdapter,
    PostgresConnectionRelease,
} from "./PostgresDriverAdapter"
import { PostgresDialect } from "./PostgresDialect"
import type { DataSource } from "../../data-source/DataSource"
import { TypeORMError } from "../../error"
import { ConnectionIsNotSetError } from "../../error/ConnectionIsNotSetError"
import type { QueryRunner } from "../../query-runner/QueryRunner"
import { RdbmsSchemaBuilder } from "../../schema-builder/RdbmsSchemaBuilder"
import { VersionUtils } from "../../util/VersionUtils"
import type { Driver } from "../Driver"
import { DriverUtils } from "../DriverUtils"
import type { ReplicationMode } from "../types/ReplicationMode"
import type { PostgresConnectionCredentialsOptions } from "./PostgresConnectionCredentialsOptions"
import type { PostgresDataSourceOptions } from "./PostgresDataSourceOptions"
import { PostgresQueryRunner } from "./PostgresQueryRunner"

/**
 * Organizes communication with PostgreSQL DBMS.
 */
export class PostgresDriver extends PostgresDialect implements Driver {
    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * DataSource used by the driver.
     */
    dataSource: DataSource

    /**
     * DataSource used by the driver.
     *
     * @deprecated since 1.0.0. Use {@link dataSource} instance instead.
     */
    get connection(): DataSource {
        return this.dataSource
    }

    /**
     * Postgres underlying library.
     */
    adapter: PostgresDriverAdapter

    postgres: any

    /**
     * Pool for master database.
     */
    master: any

    /**
     * Pool for slave databases.
     * Used in replication.
     */
    slaves: any[] = []

    /**
     * We store all created query runners because we need to release them.
     */
    connectedQueryRunners: QueryRunner[] = []

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * DataSource options.
     */
    options: PostgresDataSourceOptions

    /**
     * Version of Postgres. Requires a SQL query to the DB, so it is set on the first
     * connection attempt.
     */
    version?: string

    /**
     * Database name used to perform all write queries.
     */
    database?: string

    /**
     * Schema name used to perform all write queries.
     */
    schema?: string

    /**
     * Schema that's used internally by Postgres for object resolution.
     *
     * Because we never set this we have to track it in separately from the `schema` so
     * we know when we have to specify the full schema or not.
     *
     * In most cases this will be `public`.
     */
    searchSchema?: string

    /**
     * Indicates if replication is enabled.
     */
    isReplicated: boolean = false

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(dataSource?: DataSource) {
        super()
        if (!dataSource) {
            return
        }

        this.dataSource = dataSource
        this.options = dataSource.options as PostgresDataSourceOptions
        this.isReplicated = this.options.replication ? true : false
        if (this.options.useUTC) {
            process.env.PGTZ = "UTC"
        }
        // load postgres package
        this.loadDependencies()

        this.database = DriverUtils.buildDriverOptions(
            this.options.replication
                ? this.options.replication.master
                : this.options,
        ).database
        this.schema = DriverUtils.buildDriverOptions(this.options).schema

        // ObjectUtils.assign(this.options, DriverUtils.buildDriverOptions(connection.options)); // todo: do it better way
        // validate options to make sure everything is set
        // todo: revisit validation with replication in mind
        // if (!this.options.host)
        //     throw new DriverOptionNotSetError("host");
        // if (!this.options.username)
        //     throw new DriverOptionNotSetError("username");
        // if (!this.options.database)
        //     throw new DriverOptionNotSetError("database");
    }

    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     * Based on pooling options, it can either create connection immediately,
     * either create a pool and create connection when needed.
     */
    async connect(): Promise<void> {
        try {
            if (this.options.replication) {
                const pools = await Promise.allSettled(
                    this.options.replication.slaves.map((slave) =>
                        this.createPool(this.options, slave),
                    ),
                )
                this.slaves = pools.flatMap((pool) =>
                    pool.status === "fulfilled" ? [pool.value] : [],
                )
                const failed = pools.find((pool) => pool.status === "rejected")
                if (failed?.status === "rejected") throw failed.reason
                this.master = await this.createPool(
                    this.options,
                    this.options.replication.master,
                )
            } else {
                this.master = await this.createPool(this.options, this.options)
            }
            if (!this.version || !this.database || !this.searchSchema) {
                const queryRunner = this.createQueryRunner("master")
                try {
                    this.version ??= await queryRunner.getVersion()
                    this.database ??= await queryRunner.getCurrentDatabase()
                    this.searchSchema ??= await queryRunner.getCurrentSchema()
                } finally {
                    await queryRunner.release()
                }
            }
            this.schema ??= this.searchSchema
        } catch (error) {
            await Promise.allSettled(
                [this.master, ...this.slaves]
                    .filter((pool) => pool !== undefined)
                    .map((pool) => this.closePool(pool)),
            )
            this.master = undefined
            this.slaves = []
            throw error
        }
    }

    /**
     * Makes any action after connection (e.g. create extensions in Postgres driver).
     */
    async afterConnect(): Promise<void> {
        const [connection, release] = await this.obtainMasterConnection()

        try {
            const installExtensions =
                this.options.installExtensions === undefined ||
                this.options.installExtensions
            if (installExtensions) {
                const extensionsMetadata =
                    await this.checkMetadataForExtensions()
                const extensionsToInstall = this.options.extensions
                if (extensionsMetadata.hasExtensions)
                    await this.enableExtensions(extensionsMetadata, connection)

                if (extensionsToInstall) {
                    const availableExtensions =
                        await this.getAvailableExtensions(connection)

                    await this.enableCustomExtensions(
                        availableExtensions,
                        extensionsToInstall,
                        connection,
                    )
                }
            }

            this.isGeneratedColumnsSupported = VersionUtils.isGreaterOrEqual(
                this.version,
                "12.0",
            )
        } finally {
            await release()
        }
    }

    protected async getAvailableExtensions(connection: any) {
        const availableExtensions = new Set<string>()
        const { logger } = this.dataSource
        try {
            const result: any = await this.executeQuery(
                connection,
                `SELECT name FROM pg_available_extensions`,
            )
            if (result.records && Array.isArray(result.records)) {
                result.records.forEach((row: any) => {
                    availableExtensions.add(row.name)
                })
            }
        } catch (_) {
            logger.log(
                "warn",
                "Could not retrieve available extensions. Extension installation may fail if extensions are not available.",
            )
        }
        return availableExtensions
    }

    protected async enableExtensions(extensionsMetadata: any, connection: any) {
        const { logger } = this.dataSource

        const {
            hasUuidColumns,
            hasCitextColumns,
            hasHstoreColumns,
            hasCubeColumns,
            hasGeometryColumns,
            hasLtreeColumns,
            hasVectorColumns,
            hasExclusionConstraints,
        } = extensionsMetadata

        if (hasUuidColumns)
            try {
                await this.executeQuery(
                    connection,
                    `CREATE EXTENSION IF NOT EXISTS "${
                        this.options.uuidExtension ?? "uuid-ossp"
                    }"`,
                )
            } catch (_) {
                logger.log(
                    "warn",
                    `At least one of the entities has uuid column, but the '${
                        this.options.uuidExtension ?? "uuid-ossp"
                    }' extension cannot be installed automatically. Please install it manually using superuser rights, or select another uuid extension.`,
                )
            }
        if (hasCitextColumns)
            try {
                await this.executeQuery(
                    connection,
                    `CREATE EXTENSION IF NOT EXISTS "citext"`,
                )
            } catch (_) {
                logger.log(
                    "warn",
                    "At least one of the entities has citext column, but the 'citext' extension cannot be installed automatically. Please install it manually using superuser rights",
                )
            }
        if (hasHstoreColumns)
            try {
                await this.executeQuery(
                    connection,
                    `CREATE EXTENSION IF NOT EXISTS "hstore"`,
                )
            } catch (_) {
                logger.log(
                    "warn",
                    "At least one of the entities has hstore column, but the 'hstore' extension cannot be installed automatically. Please install it manually using superuser rights",
                )
            }
        if (hasGeometryColumns)
            try {
                await this.executeQuery(
                    connection,
                    `CREATE EXTENSION IF NOT EXISTS "postgis"`,
                )
            } catch (_) {
                logger.log(
                    "warn",
                    "At least one of the entities has a geometry column, but the 'postgis' extension cannot be installed automatically. Please install it manually using superuser rights",
                )
            }
        if (hasCubeColumns)
            try {
                await this.executeQuery(
                    connection,
                    `CREATE EXTENSION IF NOT EXISTS "cube"`,
                )
            } catch (_) {
                logger.log(
                    "warn",
                    "At least one of the entities has a cube column, but the 'cube' extension cannot be installed automatically. Please install it manually using superuser rights",
                )
            }
        if (hasLtreeColumns)
            try {
                await this.executeQuery(
                    connection,
                    `CREATE EXTENSION IF NOT EXISTS "ltree"`,
                )
            } catch (_) {
                logger.log(
                    "warn",
                    "At least one of the entities has a ltree column, but the 'ltree' extension cannot be installed automatically. Please install it manually using superuser rights",
                )
            }
        if (hasVectorColumns)
            try {
                await this.executeQuery(
                    connection,
                    `CREATE EXTENSION IF NOT EXISTS "vector"`,
                )
            } catch (_) {
                logger.log(
                    "warn",
                    "At least one of the entities has a vector column, but the 'vector' extension (pgvector) cannot be installed automatically. Please install it manually using superuser rights",
                )
            }
        if (hasExclusionConstraints)
            try {
                // The btree_gist extension provides operator support in PostgreSQL exclusion constraints
                await this.executeQuery(
                    connection,
                    `CREATE EXTENSION IF NOT EXISTS "btree_gist"`,
                )
            } catch (_) {
                logger.log(
                    "warn",
                    "At least one of the entities has an exclusion constraint, but the 'btree_gist' extension cannot be installed automatically. Please install it manually using superuser rights",
                )
            }
    }

    protected async enableCustomExtensions(
        availableExtensions: Set<string>,
        extensionsToInstall: string[],
        connection: any,
    ) {
        if (!extensionsToInstall) return
        const logger = this.dataSource.logger
        for (const extension of extensionsToInstall) {
            if (availableExtensions.has(extension)) {
                try {
                    await this.executeQuery(
                        connection,
                        `CREATE EXTENSION IF NOT EXISTS "${extension}"`,
                    )
                } catch (_) {
                    logger.log(
                        "warn",
                        `The extension "${extension}" cannot be installed automatically. Please install it manually using superuser rights`,
                    )
                }
            } else {
                logger.log(
                    "warn",
                    `The extension "${extension}" is not available on this database. Please install it manually using superuser rights`,
                )
            }
        }
    }

    protected async checkMetadataForExtensions() {
        const hasUuidColumns = this.dataSource.entityMetadatas.some(
            (metadata) => {
                return (
                    metadata.generatedColumns.filter(
                        (column) => column.generationStrategy === "uuid",
                    ).length > 0
                )
            },
        )
        const hasCitextColumns = this.dataSource.entityMetadatas.some(
            (metadata) => {
                return (
                    metadata.columns.filter(
                        (column) => column.type === "citext",
                    ).length > 0
                )
            },
        )
        const hasHstoreColumns = this.dataSource.entityMetadatas.some(
            (metadata) => {
                return (
                    metadata.columns.filter(
                        (column) => column.type === "hstore",
                    ).length > 0
                )
            },
        )
        const hasCubeColumns = this.dataSource.entityMetadatas.some(
            (metadata) => {
                return (
                    metadata.columns.filter((column) => column.type === "cube")
                        .length > 0
                )
            },
        )
        const hasGeometryColumns = this.dataSource.entityMetadatas.some(
            (metadata) => {
                return (
                    metadata.columns.filter(
                        (column) => this.spatialTypes.indexOf(column.type) >= 0,
                    ).length > 0
                )
            },
        )
        const hasLtreeColumns = this.dataSource.entityMetadatas.some(
            (metadata) => {
                return (
                    metadata.columns.filter((column) => column.type === "ltree")
                        .length > 0
                )
            },
        )
        const hasVectorColumns = this.dataSource.entityMetadatas.some(
            (metadata) => {
                return metadata.columns.some(
                    (column) =>
                        column.type === "vector" || column.type === "halfvec",
                )
            },
        )
        const hasExclusionConstraints = this.dataSource.entityMetadatas.some(
            (metadata) => {
                return metadata.exclusions.length > 0
            },
        )

        return {
            hasUuidColumns,
            hasCitextColumns,
            hasHstoreColumns,
            hasCubeColumns,
            hasGeometryColumns,
            hasLtreeColumns,
            hasVectorColumns,
            hasExclusionConstraints,
            hasExtensions:
                hasUuidColumns ||
                hasCitextColumns ||
                hasHstoreColumns ||
                hasGeometryColumns ||
                hasCubeColumns ||
                hasLtreeColumns ||
                hasVectorColumns ||
                hasExclusionConstraints,
        }
    }

    /**
     * Closes connection with database.
     */
    async disconnect(): Promise<void> {
        if (this.master === undefined)
            throw new ConnectionIsNotSetError("postgres")
        const released = await Promise.allSettled(
            this.connectedQueryRunners.map((runner) => runner.release()),
        )
        const closed = await Promise.allSettled(
            [this.master, ...this.slaves].map((pool) => this.closePool(pool)),
        )
        this.master = undefined
        this.slaves = []
        const failure = [...released, ...closed].find(
            (result) => result.status === "rejected",
        )
        if (failure?.status === "rejected") throw failure.reason
    }

    /**
     * Creates a schema builder used to build and sync a schema.
     */
    createSchemaBuilder() {
        return new RdbmsSchemaBuilder(this.dataSource)
    }

    /**
     * Creates a query runner used to execute database queries.
     *
     * @param mode
     */
    createQueryRunner(mode: ReplicationMode): PostgresQueryRunner {
        return new PostgresQueryRunner(this, mode)
    }

    /**
     * Obtains a new database connection to a master server.
     * Used for replication.
     * If replication is not setup then returns default connection's database connection.
     */
    async obtainMasterConnection(): Promise<[any, PostgresConnectionRelease]> {
        if (this.master === undefined)
            throw new TypeORMError("Driver not Connected")
        return this.adapter.acquire(this.master)
    }

    /**
     * Obtains a new database connection to a slave server.
     * Used for replication.
     * If replication is not setup then returns master (default) connection's database connection.
     */
    async obtainSlaveConnection(): Promise<[any, PostgresConnectionRelease]> {
        if (!this.slaves.length) return this.obtainMasterConnection()
        return this.adapter.acquire(
            this.slaves[Math.floor(Math.random() * this.slaves.length)],
        )
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Loads postgres query stream package.
     */
    loadStreamDependency() {
        if (this.adapter instanceof PgDriverAdapter)
            return this.adapter.loadStreamDependency()
        throw new TypeORMError(
            "The selected PostgreSQL adapter does not expose pg-query-stream.",
        )
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        this.adapter = this.options.adapter ?? new PgDriverAdapter(this.options)
        if (this.adapter instanceof PgDriverAdapter)
            this.postgres = this.adapter.postgres
    }

    /**
     * Creates a new connection pool for a given database credentials.
     *
     * @param options
     * @param credentials
     */
    protected createPool(
        options: PostgresDataSourceOptions,
        credentials: PostgresConnectionCredentialsOptions,
    ): Promise<unknown> {
        return this.adapter.createPool(
            options,
            credentials,
            this.dataSource.logger,
        )
    }

    /**
     * Closes connection pool.
     *
     * @param pool
     */
    protected closePool(pool: unknown): Promise<void> {
        return this.adapter.closePool(pool)
    }

    /**
     * Executes given query.
     *
     * @param connection
     * @param query
     */
    protected async executeQuery(connection: unknown, query: string) {
        this.dataSource.logger.logQuery(query)
        return this.adapter.normalizeResult(
            await this.adapter.query(connection, query),
        )
    }
}
