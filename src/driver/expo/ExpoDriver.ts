import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver"
import { ExpoConnectionOptions } from "./ExpoConnectionOptions"
import { ExpoQueryRunner } from "./ExpoQueryRunner"
import { QueryRunner } from "../../query-runner/QueryRunner"
import { DataSource } from "../../data-source/DataSource"

export class ExpoDriver extends AbstractSqliteDriver {
    declare options: ExpoConnectionOptions

    constructor(connection: DataSource) {
        super(connection)
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
}
