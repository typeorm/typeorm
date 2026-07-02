import fs from "node:fs/promises"
import path from "node:path"
import type { DataSource } from "../../data-source"
import { TypeORMError } from "../../error"
import { PlatformTools } from "../../platform/PlatformTools"
import type { QueryRunner } from "../../query-runner/QueryRunner"
import { filepathToName, isAbsolute } from "../../util/PathUtils"
import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver"
import type { ColumnType } from "../types/ColumnTypes"
import type { ReplicationMode } from "../types/ReplicationMode"
import type { BunSqliteDataSourceOptions } from "./BunSqliteDataSourceOptions"
import { BunSqliteQueryRunner } from "./BunSqliteQueryRunner"

/**
 * Organizes communication with SQLite using the built-in `bun:sqlite` module.
 * No native addon required — works out of the box with the Bun runtime.
 */
export class BunSqliteDriver extends AbstractSqliteDriver {
    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * DataSource options.
     */
    options: BunSqliteDataSourceOptions

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(dataSource: DataSource) {
        super(dataSource)

        this.database = this.options.database

        // load sqlite package
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
        this.databaseConnection.close()
    }

    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode: ReplicationMode): QueryRunner {
        this.queryRunner ??= new BunSqliteQueryRunner(this)

        return this.queryRunner
    }

    normalizeType(column: {
        type?: ColumnType
        length?: number | string
        precision?: number | null
        scale?: number
    }): string {
        if (
            typeof column.type === "function" &&
            column.type.prototype instanceof Uint8Array
        ) {
            return "blob"
        }

        return super.normalizeType(column)
    }

    async afterConnect(): Promise<void> {
        return this.attachDatabases()
    }

    /**
     * For SQLite, the database may be added in the decorator metadata. It will be a filepath to a database file.
     */
    buildTableName(
        tableName: string,
        _schema?: string,
        database?: string,
    ): string {
        if (!database) return tableName
        if (this.getAttachedDatabaseHandleByRelativePath(database))
            return `${this.getAttachedDatabaseHandleByRelativePath(database)}.${tableName}`

        if (database === this.options.database) return tableName

        const identifierHash = filepathToName(database)
        const absFilepath = isAbsolute(database)
            ? database
            : path.join(this.getMainDatabasePath(), database)

        this.attachedDatabases[database] = {
            attachFilepathAbsolute: absFilepath,
            attachFilepathRelative: database,
            attachHandle: identifierHash,
        }

        return `${identifierHash}.${tableName}`
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates connection with the database.
     */
    protected async createDatabaseConnection() {
        if (this.options.database !== ":memory:") {
            const dir = path.dirname(this.options.database)
            // "." means the file is in the current directory — no mkdir needed.
            // Skipping also avoids a Bun bug where fs.promises.mkdir(".") throws ENOENT.
            if (dir !== ".") {
                await fs.mkdir(dir, { recursive: true })
            }
        }

        const { database, readonly = false, prepareDatabase } = this.options

        const databaseConnection = new this.sqlite(database, {
            create: !readonly,
            readonly,
        })

        // function to run before a database is used in typeorm.
        if (typeof prepareDatabase === "function") {
            await prepareDatabase(databaseConnection)
        }

        // enable foreign keys to make sure all foreign key related features work properly.
        databaseConnection.prepare("PRAGMA foreign_keys = ON").run()

        // turn on WAL mode to enhance performance.
        if (this.options.enableWAL) {
            databaseConnection.prepare("PRAGMA journal_mode = WAL").run()
        }

        return databaseConnection
    }

    /**
     * Loads `bun:sqlite`'s Database class.
     * `bun:sqlite` is a Bun built-in — it is not available in Node.js.
     */
    protected loadDependencies(): void {
        try {
            this.sqlite = PlatformTools.load("bun:sqlite").Database
        } catch (e) {
            throw new TypeORMError(
                "bun:sqlite is only available in the Bun runtime. " +
                    "Please run your application with Bun (https://bun.sh).",
            )
        }
    }

    /**
     * Auto creates database directory if it does not exist.
     */
    protected async createDatabaseDirectory(dbPath: string): Promise<void> {
        await fs.mkdir(dbPath, { recursive: true })
    }

    /**
     * Performs the attaching of the database files. The attachedDatabase should have been populated during calls to #buildTableName
     * during EntityMetadata production (see EntityMetadata#buildTablePath)
     *
     * https://sqlite.org/lang_attach.html
     */
    protected async attachDatabases() {
        for (const { attachHandle, attachFilepathAbsolute } of Object.values(
            this.attachedDatabases,
        )) {
            await this.createDatabaseDirectory(
                path.dirname(attachFilepathAbsolute),
            )
            await this.dataSource.query(
                `ATTACH "${attachFilepathAbsolute}" AS "${attachHandle}"`,
            )
        }
    }

    protected getMainDatabasePath(): string {
        const optionsDb = this.options.database
        return path.dirname(
            isAbsolute(optionsDb)
                ? optionsDb
                : path.join(this.options.baseDirectory!, optionsDb),
        )
    }
}
