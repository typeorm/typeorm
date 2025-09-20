import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver"
import { CapacitorConnectionOptions } from "./CapacitorConnectionOptions"
import { CapacitorQueryRunner } from "./CapacitorQueryRunner"
import { QueryRunner } from "../../query-runner/QueryRunner"
import { DataSource } from "../../data-source/DataSource"
import { DriverPackageNotInstalledError } from "../../error"
import { ReplicationMode } from "../types/ReplicationMode"

export class CapacitorDriver extends AbstractSqliteDriver {
    driver: any
    options: CapacitorConnectionOptions

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: DataSource) {
        super(connection)

        this.database = this.options.database
        this.driver = this.options.driver

        // load sqlite package
        this.sqlite = this.options.driver
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     */
    async connect(): Promise<void> {
        this.databaseConnection = this.createDatabaseConnection()
        await this.databaseConnection
    }

    /**
     * Closes connection with database.
     */
    async disconnect(): Promise<void> {
        this.queryRunner = undefined
        const databaseConnection = await this.databaseConnection
        return databaseConnection.close().then(() => {
            this.databaseConnection = undefined
        })
    }

    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode: ReplicationMode): QueryRunner {
        if (!this.queryRunner) this.queryRunner = new CapacitorQueryRunner(this)

        return this.queryRunner
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates connection with the database.
     */
    protected async createDatabaseConnection() {
        const databaseMode = this.options.mode || "no-encryption"
        const isDatabaseEncryted = databaseMode !== "no-encryption"
        const databaseVersion =
            typeof this.options.version === "undefined"
                ? 1
                : this.options.version
        const connection = await this.sqlite.createConnection(
            this.options.database,
            isDatabaseEncryted,
            databaseMode,
            databaseVersion,
        )
        await connection.open()

        // we need to enable foreign keys in sqlite to make sure all foreign key related features
        // working properly. this also makes onDelete to work with sqlite.
        await connection.execute(`PRAGMA foreign_keys = ON`)

        if (
            this.options.journalMode &&
            ["DELETE", "TRUNCATE", "PERSIST", "MEMORY", "WAL", "OFF"].indexOf(
                this.options.journalMode,
            ) !== -1
        ) {
            await connection.execute(
                `PRAGMA journal_mode = ${this.options.journalMode}`,
            )
        }

        return connection
    }

    protected loadDependencies(): void {
        this.sqlite = this.driver
        if (!this.driver) {
            throw new DriverPackageNotInstalledError(
                "Capacitor",
                "@capacitor-community/sqlite",
            )
        }
    }
}
