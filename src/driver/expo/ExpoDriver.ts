import type { DataSource } from "../../data-source/DataSource"
import { DriverPackageNotInstalledError, TypeORMError } from "../../error"
import type { QueryRunner } from "../../query-runner/QueryRunner"
import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver"
import type { ExpoDataSourceOptions } from "./ExpoDataSourceOptions"
import { ExpoQueryRunner } from "./ExpoQueryRunner"

export class ExpoDriver extends AbstractSqliteDriver {
    declare options: ExpoDataSourceOptions

    constructor(dataSource: DataSource) {
        super(dataSource)
        this.loadDependencies()
    }

    async disconnect(): Promise<void> {
        this.queryRunner = undefined
        await this.databaseConnection.closeAsync()
        this.databaseConnection = undefined
    }

    createQueryRunner(): QueryRunner {
        this.queryRunner ??= new ExpoQueryRunner(this)
        return this.queryRunner
    }

    protected async createDatabaseConnection() {
        this.databaseConnection = await this.sqlite.openDatabaseAsync(
            this.options.database,
        )
        await this.databaseConnection.runAsync("PRAGMA foreign_keys = ON")
        return this.databaseConnection
    }

    /**
     * If driver dependency is not given explicitly, then try to load it via `require`.
     * A literal `require("expo-sqlite")` is picked up by Metro's static bundler —
     * `PlatformTools.load()` is a throwing stub in the browser/React-Native build.
     */
    protected loadDependencies(): void {
        try {
            this.sqlite = this.options.driver ?? require("expo-sqlite")
        } catch (e) {
            throw new DriverPackageNotInstalledError(
                "Expo SQLite",
                "expo-sqlite",
            )
        }

        // Expo SDK v52 removed the legacy synchronous API. The modern async API
        // exposes `openDatabaseAsync` as a function — anything else (missing,
        // non-callable, non-object `driver`) means the user is on a pre-v52 SDK
        // or has passed something that isn't the expo-sqlite module.
        if (typeof this.sqlite?.openDatabaseAsync !== "function") {
            throw new TypeORMError(
                "Legacy Expo SQLite driver is not supported. Upgrade to Expo SDK v52 or later, which ships the modern async SQLite API.",
            )
        }
    }
}
