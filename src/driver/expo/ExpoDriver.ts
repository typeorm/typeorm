import { DataSource } from "../../data-source/DataSource"
import { TypeORMError } from "../../error"
import { QueryRunner } from "../../query-runner/QueryRunner"
import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver"
import { ExpoDataSourceOptions } from "./ExpoDataSourceOptions"
import { ExpoQueryRunner } from "./ExpoQueryRunner"

export class ExpoDriver extends AbstractSqliteDriver {
    declare options: ExpoDataSourceOptions

    constructor(connection: DataSource) {
        super(connection)

        if (this.isLegacyDriver) {
            throw new TypeORMError("Legacy Expo driver is not supported.")
        }

        this.sqlite = this.options.driver
    }

    async disconnect(): Promise<void> {
        this.queryRunner = undefined
        await this.databaseConnection.closeAsync()
        this.databaseConnection = undefined
    }

    createQueryRunner(): QueryRunner {
        if (!this.queryRunner) this.queryRunner = new ExpoQueryRunner(this)

        return this.queryRunner
    }

    protected async createDatabaseConnection() {
        this.databaseConnection = await this.sqlite.openDatabaseAsync(
            this.options.database,
        )
        await this.databaseConnection.runAsync("PRAGMA foreign_keys = ON")
        return this.databaseConnection
    }

    private get isLegacyDriver(): boolean {
        return !("openDatabaseAsync" in this.options.driver)
    }
}
