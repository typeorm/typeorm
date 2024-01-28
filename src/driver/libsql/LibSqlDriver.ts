import type { createClient } from "@libsql/client"
import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver"
import type { LibSqlConnectionOptions } from "./LibSqlConnectionOptions"
import { LibSqlQueryRunner } from "./LibSqlQueryRunner"
import { PlatformTools } from "../../platform/PlatformTools"
import type { QueryRunner } from "../../query-runner/QueryRunner"
import type { DataSource } from "../../data-source/DataSource"
import type { EntityMetadata } from "../../metadata/EntityMetadata"
import { DriverPackageNotInstalledError } from "../../error/DriverPackageNotInstalledError"
import type { ColumnType } from "../types/ColumnTypes"

export class LibSqlDriver extends AbstractSqliteDriver {
    sqlite: { createClient: typeof createClient }

    options: LibSqlConnectionOptions

    constructor(connection: DataSource) {
        super(connection)
        this.database = this.options.database

        try {
            this.sqlite = PlatformTools.load("libsql")
        } catch (e) {
            throw new DriverPackageNotInstalledError("SQLite", "sqlite3")
        }
    }

    /**
     * Closes connection with database.
     */
    async disconnect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            try {
                this.queryRunner = undefined
                this.databaseConnection?.close()
                this.databaseConnection = undefined
                ok()
            } catch (error) {
                fail(error)
            }
        })
    }

    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(): QueryRunner {
        if (!this.queryRunner) this.queryRunner = new LibSqlQueryRunner(this)
        return this.queryRunner
    }

    override createGeneratedMap(
        metadata: EntityMetadata,
        insertResult: any,
        entityIndex: number,
        entityNum: number,
    ) {
        if (typeof insertResult === "bigint")
            insertResult = Number(insertResult)
        return super.createGeneratedMap(
            metadata,
            insertResult,
            entityIndex,
            entityNum,
        )
    }

    normalizeType(column: {
        type?: ColumnType
        length?: number | string
        precision?: number | null
        scale?: number
    }): string {
        return (column.type as any) === Buffer
            ? "blob"
            : super.normalizeType(column)
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates connection with the database.
     */
    protected async createDatabaseConnection() {
        const client = this.sqlite.createClient({
            url: `file:${this.database}`,
            intMode: "number",
        })

        if (this.options.enableWAL) {
            await client.execute("PRAGMA journal_mode = WAL")
        }

        /*
        // we need to enable foreign keys in libsql to make sure all foreign key related features working properly.
            this also makes onDelete work with libsql.
        */
        await client.execute("PRAGMA foreign_keys = ON")
        return client
    }
}
