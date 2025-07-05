import { DriverPackageNotInstalledError } from "../../error"
import { PlatformTools } from "../../platform/PlatformTools"
import { DataSource } from "../../data-source"
import { ColumnType } from "../types/ColumnTypes"
import { QueryRunner } from "../../query-runner/QueryRunner"
import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver"
import { LibsqlConnectionOptions } from "./LibsqlConnectionOptions"
import { LibsqlQueryRunner } from "./LibsqlQueryRunner"
import { ReplicationMode } from "../types/ReplicationMode"

/**
 * Organizes communication with libsql DBMS.
 */
export class LibsqlDriver extends AbstractSqliteDriver {
    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Connection options.
     */
    options: LibsqlConnectionOptions

    /**
     * LibSQL underlying library.
     */
    libsql: any

    /**
     * Database connection.
     */
    databaseConnection: any

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: DataSource) {
        super(connection)

        this.connection = connection
        this.options = connection.options as LibsqlConnectionOptions
        this.database = this.options.database || this.options.url

        // load libsql package
        this.loadDependencies()
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Closes connection with database.
     */
    async disconnect(): Promise<void> {
        this.queryRunner = undefined
        if (this.databaseConnection) {
            try {
                await this.databaseConnection.close()
            } catch (error) {
                // Ignore close errors
            }
        }
    }

    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode: ReplicationMode): QueryRunner {
        if (!this.queryRunner) this.queryRunner = new LibsqlQueryRunner(this)

        return this.queryRunner
    }

    normalizeType(column: {
        type?: ColumnType
        length?: number | string
        precision?: number | null
        scale?: number
    }): string {
        if ((column.type as any) === Buffer) {
            return "blob"
        }

        return super.normalizeType(column)
    }

    async afterConnect(): Promise<void> {
        return Promise.resolve()
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates connection with the database.
     */
    protected async createDatabaseConnection(): Promise<any> {
        const { createClient } = this.libsql

        const config: any = {
            url: this.options.url,
        }

        // Add auth token if provided
        if (this.options.authToken) {
            config.authToken = this.options.authToken
        }

        // Add sync configuration for embedded replicas
        if (this.options.syncUrl) {
            config.syncUrl = this.options.syncUrl
            if (this.options.syncPeriod) {
                config.syncPeriod = this.options.syncPeriod
            }
            if (this.options.readYourWrites) {
                config.readYourWrites = this.options.readYourWrites
            }
        }

        const client = createClient(config)

        // Function to run before a database is used in typeorm
        if (typeof this.options.prepareDatabase === "function") {
            await this.options.prepareDatabase(client)
        }

        // Enable foreign keys
        await client.execute("PRAGMA foreign_keys = ON")

        // Enable WAL mode if specified
        if (this.options.enableWAL) {
            await client.execute("PRAGMA journal_mode = WAL")
        }

        // Set encryption key if provided
        if (this.options.key) {
            await client.execute({
                sql: "PRAGMA key = ?",
                args: [this.options.key],
            })
        }

        return client
    }

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        try {
            const libsql =
                this.options.driver || PlatformTools.load("@libsql/client")
            this.libsql = libsql
        } catch (e) {
            throw new DriverPackageNotInstalledError("LibSQL", "@libsql/client")
        }
    }
}
