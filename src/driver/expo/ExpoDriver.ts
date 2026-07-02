import type { DataSource } from "../../data-source/DataSource"
import { DriverPackageNotInstalledError, TypeORMError } from "../../error"
import { PlatformTools } from "../../platform/PlatformTools"
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
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        try {
            this.sqlite =
                this.options.driver ?? PlatformTools.load("expo-sqlite")
        } catch {
            throw new DriverPackageNotInstalledError(
                "Expo SQLite",
                "expo-sqlite",
            )
        }

        // The modern Expo SQLite API that TypeORM supports exposes `openDatabaseAsync` as a function
        if (typeof this.sqlite.openDatabaseAsync !== "function") {
            throw new TypeORMError(
                `The provided Expo SQLite client is not supported. Please upgrade your Expo SDK v52 or higher!`,
            )
        }
    }
}
