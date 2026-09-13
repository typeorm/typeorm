import { Table } from "../schema-builder/table/Table"
import { TableColumn } from "../schema-builder/table/TableColumn"
import type { DataSource } from "../data-source/DataSource"
import { Migration } from "./Migration"
import type { ObjectLiteral } from "../common/ObjectLiteral"
import type { QueryRunner } from "../query-runner/QueryRunner"
import {
    isMssqlParameterType,
    MssqlParameter,
} from "../driver/sqlserver/MssqlParameter"
import type { MongoQueryRunner } from "../driver/mongodb/MongoQueryRunner"
import {
    ForbiddenTransactionModeOverrideError,
    MigrationChecksumMismatchError,
    TypeORMError,
} from "../error"
import { InstanceChecker } from "../util/InstanceChecker"
import {
    computeMigrationChecksum,
    formatSqlForChecksum,
    sqlStatementsForDisplay,
} from "./MigrationSource"
import { QueryResult } from "../query-runner/QueryResult"

/**
 * Executes migrations: runs pending and reverts previously executed migrations.
 */
export class MigrationExecutor {
    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Indicates how migrations should be run in transactions.
     *   all: all migrations are run in a single transaction
     *   none: all migrations are run without a transaction
     *   each: each migration is run in a separate transaction
     */
    transaction: "all" | "none" | "each" = "all"

    /**
     * Option to fake-run or fake-revert a migration, adding to the
     * executed migrations table, but not actually running it. This feature is
     * useful for when migrations are added after the fact or for
     * interoperability between applications which are desired to each keep
     * a consistent migration history.
     */
    fake: boolean

    // -------------------------------------------------------------------------
    // Private Properties
    // -------------------------------------------------------------------------

    private readonly migrationsDatabase?: string
    private readonly migrationsSchema?: string
    private readonly migrationsTable: string
    private readonly migrationsTableName: string
    private migrationsTableColumnsEnsured = false

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(
        protected dataSource: DataSource,
        protected queryRunner?: QueryRunner,
    ) {
        const { schema } = this.dataSource.driver.options as any
        const database = this.dataSource.driver.database
        this.migrationsDatabase = database
        this.migrationsSchema = schema
        this.migrationsTableName =
            dataSource.options.migrationsTableName ?? "migrations"
        this.migrationsTable = this.dataSource.driver.buildTableName(
            this.migrationsTableName,
            schema,
            database,
        )
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Tries to execute a single migration given.
     *
     * @param migration
     */
    public async executeMigration(migration: Migration): Promise<Migration> {
        return this.withQueryRunner(async (queryRunner) => {
            await this.createMigrationsTableIfNotExist(queryRunner)

            // create typeorm_metadata table if it's not created yet
            const schemaBuilder = this.dataSource.driver.createSchemaBuilder()
            if (InstanceChecker.isRdbmsSchemaBuilder(schemaBuilder)) {
                await schemaBuilder.createMetadataTableIfNecessary(queryRunner)
            }

            await queryRunner.beforeMigration()
            if (!migration.instance) {
                throw new TypeORMError(
                    `Cannot execute migration "${migration.name}" because it has no instance.`,
                )
            }
            const captured = await this.captureMigrationSql(
                queryRunner,
                () => migration.instance!.up(queryRunner),
                true,
            )
            migration.checksum = computeMigrationChecksum(
                migration.name,
                captured,
            )
            await queryRunner.afterMigration()
            await this.insertExecutedMigration(queryRunner, migration)

            return migration
        })
    }

    /**
     * @returns An array of all executed migrations
     */
    public async getExecutedMigrations(): Promise<Migration[]> {
        return this.withQueryRunner(async (queryRunner) => {
            // There is no need to check if migrations table exists for MongoDB,
            // as it's handled in loadExecutedMigrations
            if (this.dataSource.driver.options.type !== "mongodb") {
                const exist = await queryRunner.hasTable(this.migrationsTable)

                if (!exist) return []
            }

            return await this.loadExecutedMigrations(queryRunner)
        })
    }

    /**
     * Returns an array of all pending migrations.
     */
    public async getPendingMigrations(): Promise<Migration[]> {
        const allMigrations = this.getMigrations()
        const executedMigrations = await this.getExecutedMigrations()

        if (executedMigrations.length === 0) return allMigrations

        return allMigrations.filter(
            (migration) =>
                !executedMigrations.find(
                    (executedMigration) =>
                        executedMigration.name === migration.name,
                ),
        )
    }

    /**
     * Inserts an executed migration.
     *
     * @param migration
     */
    public insertMigration(migration: Migration): Promise<void> {
        return this.withQueryRunner((q) =>
            this.insertExecutedMigration(q, migration, { recordOnly: true }),
        )
    }

    /**
     * Deletes an executed migration.
     *
     * @param migration
     */
    public deleteMigration(migration: Migration): Promise<void> {
        return this.withQueryRunner((q) =>
            this.deleteExecutedMigration(q, migration),
        )
    }

    /**
     * Lists all migrations and whether they have been executed or not
     * returns true if there are unapplied migrations
     */
    async showMigrations(): Promise<boolean> {
        let hasUnappliedMigrations = false
        const queryRunner =
            this.queryRunner ?? this.dataSource.createQueryRunner()
        // create migrations table if its not created yet
        await this.createMigrationsTableIfNotExist(queryRunner)

        // get all migrations that are executed and saved in the database
        const executedMigrations =
            await this.loadExecutedMigrations(queryRunner)

        // get all user's migrations in the source code
        const allMigrations = this.getMigrations()

        for (const migration of allMigrations) {
            const executedMigration = executedMigrations.find(
                (executedMigration) =>
                    executedMigration.name === migration.name,
            )

            if (executedMigration) {
                this.dataSource.logger.logSchemaBuild(
                    `[X] ${executedMigration.id} ${migration.name}`,
                )
            } else {
                hasUnappliedMigrations = true
                this.dataSource.logger.logSchemaBuild(`[ ] ${migration.name}`)
            }
        }

        // if query runner was created by us then release it
        if (!this.queryRunner) {
            await queryRunner.release()
        }

        return hasUnappliedMigrations
    }

    /**
     * Executes all pending migrations. Pending migrations are migrations that are not yet executed,
     * thus not saved in the database.
     */
    async executePendingMigrations(): Promise<Migration[]> {
        const queryRunner =
            this.queryRunner ?? this.dataSource.createQueryRunner()
        // create migrations table if it's not created yet
        await this.createMigrationsTableIfNotExist(queryRunner)

        // create the typeorm_metadata table if it's not created yet
        const schemaBuilder = this.dataSource.driver.createSchemaBuilder()
        if (InstanceChecker.isRdbmsSchemaBuilder(schemaBuilder)) {
            await schemaBuilder.createMetadataTableIfNecessary(queryRunner)
        }

        // get all migrations that are executed and saved in the database
        const executedMigrations =
            await this.loadExecutedMigrations(queryRunner)

        // get the time when last migration was executed
        const lastTimeExecutedMigration =
            this.getLatestTimestampMigration(executedMigrations)

        // get all user's migrations in the source code
        const allMigrations = this.getMigrations()

        if (this.dataSource.options.migrationsChecksumCheck) {
            try {
                await this.verifyExecutedMigrationChecksums(
                    queryRunner,
                    executedMigrations,
                    allMigrations,
                )
            } catch (error) {
                // release the query runner we created so a checksum failure
                // does not hold a pooled connection
                if (!this.queryRunner) await queryRunner.release()
                throw error
            }
        }

        // variable to store all migrations we did successfully
        const successMigrations: Migration[] = []

        // find all migrations that needs to be executed
        const pendingMigrations = allMigrations.filter((migration) => {
            // check if we already have executed migration
            const executedMigration = executedMigrations.find(
                (executedMigration) =>
                    executedMigration.name === migration.name,
            )
            if (executedMigration) return false

            // migration is new and not executed. now check if its timestamp is correct
            // if (lastTimeExecutedMigration && migration.timestamp < lastTimeExecutedMigration.timestamp)
            //     throw new TypeORMError(`New migration found: ${migration.name}, however this migration's timestamp is not valid. Migration's timestamp should not be older then migrations already executed in the database.`);

            // every check is passed means that migration was not run yet and we need to run it
            return true
        })

        // if no migrations are pending then nothing to do here
        if (!pendingMigrations.length) {
            this.dataSource.logger.logSchemaBuild(`No migrations are pending`)
            // if query runner was created by us then release it
            if (!this.queryRunner) await queryRunner.release()
            return []
        }

        // log information about migration execution
        this.dataSource.logger.logSchemaBuild(
            `${executedMigrations.length} migrations are already loaded in the database.`,
        )
        this.dataSource.logger.logSchemaBuild(
            `${allMigrations.length} migrations were found in the source code.`,
        )
        if (lastTimeExecutedMigration)
            this.dataSource.logger.logSchemaBuild(
                `${
                    lastTimeExecutedMigration.name
                } is the last executed migration. It was executed on ${new Date(
                    lastTimeExecutedMigration.timestamp,
                ).toString()}.`,
            )
        this.dataSource.logger.logSchemaBuild(
            `${pendingMigrations.length} migrations are new migrations must be executed.`,
        )

        if (this.transaction === "all") {
            // If we desire to run all migrations in a single transaction
            // but there is a migration that explicitly overrides the transaction mode
            // then we have to fail since we cannot properly resolve that intent
            // In theory we could support overrides that are set to `true`,
            // however to keep the interface more rigid, we fail those too
            const migrationsOverridingTransactionMode =
                pendingMigrations.filter(
                    (migration) =>
                        !(migration.instance?.transaction === undefined),
                )

            if (migrationsOverridingTransactionMode.length > 0) {
                const error = new ForbiddenTransactionModeOverrideError(
                    migrationsOverridingTransactionMode,
                )
                this.dataSource.logger.logMigration(
                    `Migrations failed, error: ${error.message}`,
                )
                throw error
            }
        }

        // Set the per-migration defaults for the transaction mode
        // so that we have one centralized place that controls this behavior

        // When transaction mode is `each` the default is to run in a transaction
        // When transaction mode is `none` the default is to not run in a transaction
        // When transaction mode is `all` the default is to not run in a transaction
        // since all the migrations are already running in one single transaction

        const txModeDefault = {
            each: true,
            none: false,
            all: false,
        }[this.transaction]

        for (const migration of pendingMigrations) {
            if (migration.instance) {
                const instanceTx = migration.instance.transaction

                if (instanceTx === undefined) {
                    migration.transaction = txModeDefault
                } else {
                    migration.transaction = instanceTx
                }
            }
        }

        // start transaction if its not started yet
        let transactionStartedByUs = false
        if (this.transaction === "all" && !queryRunner.isTransactionActive) {
            await queryRunner.beforeMigration()
            await queryRunner.startTransaction()
            transactionStartedByUs = true
        }

        // run all pending migrations in a sequence
        try {
            for (const migration of pendingMigrations) {
                if (this.fake) {
                    // directly insert migration record into the database if it is fake
                    await this.insertExecutedMigration(queryRunner, migration)

                    // nothing else needs to be done, continue to next migration
                    continue
                }

                if (migration.transaction && !queryRunner.isTransactionActive) {
                    await queryRunner.beforeMigration()
                    await queryRunner.startTransaction()
                    transactionStartedByUs = true
                }

                await this.captureAndRunPendingMigration(queryRunner, migration)
                    .catch((error) => {
                        // informative log about migration failure
                        this.dataSource.logger.logMigration(
                            `Migration "${migration.name}" failed, error: ${error?.message}`,
                        )
                        throw error
                    })
                    .then(async () => {
                        // now when migration is executed we need to insert record about it into the database
                        await this.insertExecutedMigration(
                            queryRunner,
                            migration,
                        )
                        // commit transaction if we started it
                        if (migration.transaction && transactionStartedByUs) {
                            await queryRunner.commitTransaction()
                            await queryRunner.afterMigration()
                        }
                    })
                    .then(() => {
                        // informative log about migration success
                        successMigrations.push(migration)
                        this.dataSource.logger.logSchemaBuild(
                            `Migration ${migration.name} has been ${
                                this.fake ? "(fake) " : ""
                            }executed successfully.`,
                        )
                    })
            }

            // commit transaction if we started it
            if (this.transaction === "all" && transactionStartedByUs) {
                await queryRunner.commitTransaction()
                await queryRunner.afterMigration()
            }
        } catch (err) {
            // rollback transaction if we started it
            if (transactionStartedByUs) {
                try {
                    // we throw original error even if rollback thrown an error
                    await queryRunner.rollbackTransaction()
                } catch (rollbackError) {}
            }

            throw err
        } finally {
            // if query runner was created by us then release it
            if (!this.queryRunner) await queryRunner.release()
        }
        return successMigrations
    }

    /**
     * Reverts last migration that were run.
     */
    async undoLastMigration(): Promise<void> {
        const queryRunner =
            this.queryRunner ?? this.dataSource.createQueryRunner()

        // create migrations table if it's not created yet
        await this.createMigrationsTableIfNotExist(queryRunner)

        // create typeorm_metadata table if it's not created yet
        const schemaBuilder = this.dataSource.driver.createSchemaBuilder()
        if (InstanceChecker.isRdbmsSchemaBuilder(schemaBuilder)) {
            await schemaBuilder.createMetadataTableIfNecessary(queryRunner)
        }

        // get all migrations that are executed and saved in the database
        const executedMigrations =
            await this.loadExecutedMigrations(queryRunner)

        // get the time when last migration was executed
        const lastTimeExecutedMigration =
            this.getLatestExecutedMigration(executedMigrations)

        // if no migrations found in the database then nothing to revert
        if (!lastTimeExecutedMigration) {
            this.dataSource.logger.logSchemaBuild(
                `No migrations were found in the database. Nothing to revert!`,
            )
            // if query runner was created by us then release it
            if (!this.queryRunner) await queryRunner.release()
            return
        }

        // get all user's migrations in the source code
        const allMigrations = this.getMigrations()

        // find the instance of the migration we need to remove
        const migrationToRevert = allMigrations.find(
            (migration) => migration.name === lastTimeExecutedMigration!.name,
        )

        // if no migrations found in the database then nothing to revert
        if (!migrationToRevert)
            throw new TypeORMError(
                `No migration ${lastTimeExecutedMigration.name} was found in the source code. Make sure you have this migration in your codebase and its included in the connection options.`,
            )

        // log information about migration execution
        this.dataSource.logger.logSchemaBuild(
            `${executedMigrations.length} migrations are already loaded in the database.`,
        )
        this.dataSource.logger.logSchemaBuild(
            `${
                lastTimeExecutedMigration.name
            } is the last executed migration. It was executed on ${new Date(
                lastTimeExecutedMigration.timestamp,
            ).toString()}.`,
        )
        this.dataSource.logger.logSchemaBuild(`Now reverting it...`)

        // start transaction if its not started yet
        let transactionStartedByUs = false
        if (this.transaction !== "none" && !queryRunner.isTransactionActive) {
            await queryRunner.startTransaction()
            transactionStartedByUs = true
        }

        try {
            if (!this.fake) {
                await queryRunner.beforeMigration()
                await migrationToRevert.instance!.down(queryRunner)
                await queryRunner.afterMigration()
            }

            await this.deleteExecutedMigration(queryRunner, migrationToRevert)
            this.dataSource.logger.logSchemaBuild(
                `Migration ${migrationToRevert.name} has been ${
                    this.fake ? "(fake) " : ""
                }reverted successfully.`,
            )

            // commit transaction if we started it
            if (transactionStartedByUs) await queryRunner.commitTransaction()
        } catch (err) {
            // rollback transaction if we started it
            if (transactionStartedByUs) {
                try {
                    // we throw original error even if rollback thrown an error
                    await queryRunner.rollbackTransaction()
                } catch (rollbackError) {}
            }

            throw err
        } finally {
            // if query runner was created by us then release it
            if (!this.queryRunner) await queryRunner.release()
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates table "migrations" that will store information about executed migrations.
     *
     * @param queryRunner
     */
    protected async createMigrationsTableIfNotExist(
        queryRunner: QueryRunner,
    ): Promise<void> {
        // If driver is mongo no need to create
        if (this.dataSource.driver.options.type === "mongodb") {
            return
        }
        // Always verify the table exists (it may be dropped between calls on a
        // long-lived executor); the ensured flag only skips the column checks.
        const tableExist = await queryRunner.hasTable(this.migrationsTable) // todo: table name should be configurable
        if (!tableExist) {
            await queryRunner.createTable(
                new Table({
                    database: this.migrationsDatabase,
                    schema: this.migrationsSchema,
                    name: this.migrationsTable,
                    columns: [
                        {
                            name: "id",
                            type: this.dataSource.driver.normalizeType({
                                type: this.dataSource.driver.mappedDataTypes
                                    .migrationId,
                            }),
                            isGenerated: true,
                            generationStrategy: "increment",
                            isPrimary: true,
                            isNullable: false,
                        },
                        {
                            name: "timestamp",
                            type: this.dataSource.driver.normalizeType({
                                type: this.dataSource.driver.mappedDataTypes
                                    .migrationTimestamp,
                            }),
                            isPrimary: false,
                            isNullable: false,
                        },
                        {
                            name: "name",
                            type: this.dataSource.driver.normalizeType({
                                type: this.dataSource.driver.mappedDataTypes
                                    .migrationName,
                            }),
                            isNullable: false,
                        },
                        {
                            name: "executedAt",
                            type: this.dataSource.driver.normalizeType({
                                type: this.dataSource.driver.mappedDataTypes
                                    .migrationTimestamp,
                            }),
                            isNullable: true,
                        },
                        {
                            name: "checksum",
                            type: this.dataSource.driver.normalizeType({
                                type: this.dataSource.driver.mappedDataTypes
                                    .migrationName,
                            }),
                            length: "64",
                            isNullable: true,
                        },
                        ...this.getMigrationsExtraColumns().map((column) => ({
                            name: column.name,
                            type: column.type,
                            length: column.length,
                            isNullable: true,
                        })),
                    ],
                }),
            )
            this.migrationsTableColumnsEnsured = true
        } else {
            await this.ensureMigrationsTableColumns(queryRunner)
        }
    }

    /**
     * Loads all migrations that were executed and saved into the database (sorts by id).
     *
     * @param queryRunner
     */
    protected async loadExecutedMigrations(
        queryRunner: QueryRunner,
    ): Promise<Migration[]> {
        if (this.dataSource.driver.options.type === "mongodb") {
            const mongoRunner = queryRunner as MongoQueryRunner
            return mongoRunner
                .cursor(this.migrationsTableName, {})
                .sort({ _id: -1 })
                .toArray()
        } else {
            const migrationsRaw: ObjectLiteral[] = await this.dataSource.manager
                .createQueryBuilder(queryRunner)
                .select()
                .orderBy(this.dataSource.driver.escape("id"), "DESC")
                .from(this.migrationsTable, this.migrationsTableName)
                .getRawMany()
            return migrationsRaw.map((migrationRaw) => {
                const executedAtRaw = this.getRawMigrationValue(
                    migrationRaw,
                    "executedAt",
                )
                const checksumRaw = this.getRawMigrationValue(
                    migrationRaw,
                    "checksum",
                )
                return new Migration(
                    parseInt(migrationRaw["id"]),
                    parseInt(migrationRaw["timestamp"]),
                    migrationRaw["name"],
                    undefined,
                    undefined,
                    executedAtRaw != null && executedAtRaw !== ""
                        ? parseInt(String(executedAtRaw))
                        : undefined,
                    checksumRaw != null ? String(checksumRaw) : undefined,
                )
            })
        }
    }

    /**
     * Gets all migrations that setup for this connection.
     */
    protected getMigrations(): Migration[] {
        const migrations = this.dataSource.migrations.map((migration) => {
            const migrationClassName =
                migration.name ?? (migration.constructor as any).name
            const migrationTimestamp = parseInt(
                migrationClassName.slice(-13),
                10,
            )
            if (!migrationTimestamp || isNaN(migrationTimestamp)) {
                throw new TypeORMError(
                    `${migrationClassName} migration name is wrong. Migration class name should have a JavaScript timestamp appended.`,
                )
            }

            return new Migration(
                undefined,
                migrationTimestamp,
                migrationClassName,
                migration,
            )
        })

        this.checkForDuplicateMigrations(migrations)

        // sort them by timestamp
        return migrations.sort((a, b) => a.timestamp - b.timestamp)
    }

    protected checkForDuplicateMigrations(migrations: Migration[]) {
        const migrationNames = migrations.map((migration) => migration.name)
        const duplicates = Array.from(
            new Set(
                migrationNames.filter(
                    (migrationName, index) =>
                        migrationNames.indexOf(migrationName) < index,
                ),
            ),
        )
        if (duplicates.length > 0) {
            throw Error(`Duplicate migrations: ${duplicates.join(", ")}`)
        }
    }

    /**
     * Finds the latest migration (sorts by timestamp) in the given array of migrations.
     *
     * @param migrations
     */
    protected getLatestTimestampMigration(
        migrations: Migration[],
    ): Migration | undefined {
        const sortedMigrations = migrations
            .map((migration) => migration)
            .sort((a, b) => (a.timestamp - b.timestamp) * -1)
        return sortedMigrations.length > 0 ? sortedMigrations[0] : undefined
    }

    /**
     * Finds the latest migration in the given array of migrations.
     * PRE: Migration array must be sorted by descending id.
     *
     * @param sortedMigrations
     */
    protected getLatestExecutedMigration(
        sortedMigrations: Migration[],
    ): Migration | undefined {
        return sortedMigrations.length > 0 ? sortedMigrations[0] : undefined
    }

    /**
     * Inserts new executed migration's data into migrations table.
     *
     * @param queryRunner
     * @param migration
     * @param options
     * @param options.recordOnly
     */
    protected async insertExecutedMigration(
        queryRunner: QueryRunner,
        migration: Migration,
        options?: { recordOnly?: boolean },
    ): Promise<void> {
        await this.createMigrationsTableIfNotExist(queryRunner)

        const values: ObjectLiteral = {}
        if (this.dataSource.driver.options.type === "mssql") {
            const timestampType = this.dataSource.driver.normalizeType({
                type: this.dataSource.driver.mappedDataTypes.migrationTimestamp,
            })
            const nameType = this.dataSource.driver.normalizeType({
                type: this.dataSource.driver.mappedDataTypes.migrationName,
            })
            values["timestamp"] = this.createMssqlParameter(
                migration.timestamp,
                timestampType,
            )
            values["name"] = this.createMssqlParameter(migration.name, nameType)
            values["executedAt"] = this.createMssqlParameter(
                Date.now(),
                timestampType,
            )
            const checksum = await this.resolveMigrationChecksum(
                queryRunner,
                migration,
                options,
            )
            values["checksum"] = this.createMssqlParameter(checksum, nameType)
        } else {
            values["timestamp"] = migration.timestamp
            values["name"] = migration.name
            values["executedAt"] = Date.now()
            values["checksum"] = await this.resolveMigrationChecksum(
                queryRunner,
                migration,
                options,
            )
        }

        for (const column of this.getMigrationsExtraColumns()) {
            const value =
                migration.instance?.migrationMetadata?.[column.name] ?? null
            if (
                this.dataSource.driver.options.type === "mssql" &&
                isMssqlParameterType(column.type)
            ) {
                const length =
                    column.length != null && column.length !== ""
                        ? parseInt(column.length, 10)
                        : undefined
                values[column.name] =
                    length != null && !Number.isNaN(length)
                        ? new MssqlParameter(value, column.type, length)
                        : new MssqlParameter(value, column.type)
            } else {
                // Other drivers, or SQL Server column types without a dedicated
                // parameter type (e.g. sql_variant): let the driver infer.
                values[column.name] = value
            }
        }

        if (this.dataSource.driver.options.type === "mongodb") {
            const mongoRunner = queryRunner as MongoQueryRunner
            await mongoRunner.databaseConnection
                .db(this.dataSource.driver.database!)
                .collection(this.migrationsTableName)
                .insertOne(values)
        } else {
            const qb = queryRunner.manager.createQueryBuilder()
            await qb
                .insert()
                .into(this.migrationsTable)
                .values(values)
                .execute()
        }
    }

    /**
     * Delete previously executed migration's data from the migrations table.
     *
     * @param queryRunner
     * @param migration
     */
    protected async deleteExecutedMigration(
        queryRunner: QueryRunner,
        migration: Migration,
    ): Promise<void> {
        const conditions: ObjectLiteral = {}
        if (this.dataSource.driver.options.type === "mssql") {
            conditions["timestamp"] = this.createMssqlParameter(
                migration.timestamp,
                this.dataSource.driver.normalizeType({
                    type: this.dataSource.driver.mappedDataTypes
                        .migrationTimestamp,
                }),
            )
            conditions["name"] = this.createMssqlParameter(
                migration.name,
                this.dataSource.driver.normalizeType({
                    type: this.dataSource.driver.mappedDataTypes.migrationName,
                }),
            )
        } else {
            conditions["timestamp"] = migration.timestamp
            conditions["name"] = migration.name
        }

        if (this.dataSource.driver.options.type === "mongodb") {
            const mongoRunner = queryRunner as MongoQueryRunner
            await mongoRunner.databaseConnection
                .db(this.dataSource.driver.database!)
                .collection(this.migrationsTableName)
                .deleteOne(conditions)
        } else {
            const qb = queryRunner.manager.createQueryBuilder()
            await qb
                .delete()
                .from(this.migrationsTable)
                .where(`${qb.escape("timestamp")} = :timestamp`)
                .andWhere(`${qb.escape("name")} = :name`)
                .setParameters(conditions)
                .execute()
        }
    }

    protected async withQueryRunner<T extends any>(
        callback: (queryRunner: QueryRunner) => T | Promise<T>,
    ) {
        const queryRunner =
            this.queryRunner ?? this.dataSource.createQueryRunner()

        try {
            return await callback(queryRunner)
        } finally {
            if (!this.queryRunner) {
                await queryRunner.release()
            }
        }
    }

    protected async captureAndRunPendingMigration(
        queryRunner: QueryRunner,
        migration: Migration,
    ): Promise<void> {
        const captured = await this.captureMigrationSql(
            queryRunner,
            () => migration.instance!.up(queryRunner),
            true,
        )
        migration.checksum = computeMigrationChecksum(migration.name, captured)
    }

    /**
     * Collects SQL from `up()`, including schema-builder queries and raw
     * `queryRunner.query()` calls.
     * When `execute` is false, queries are recorded but not sent to the database.
     *
     * @param queryRunner
     * @param run
     * @param execute
     */
    protected async captureMigrationSql(
        queryRunner: QueryRunner,
        run: () => Promise<void>,
        execute: boolean,
    ): Promise<string[]> {
        if (this.dataSource.driver.options.type === "mongodb") {
            if (execute) {
                await run()
            }
            return []
        }

        const statements: string[] = []
        const originalQuery = queryRunner.query.bind(queryRunner)
        queryRunner.query = ((
            query: string,
            parameters?: any,
            useStructuredResult?: boolean,
        ) => {
            statements.push(formatSqlForChecksum(query, parameters))
            if (execute) {
                if (useStructuredResult === true) {
                    return originalQuery(query, parameters, true)
                }
                return originalQuery(query, parameters)
            }
            if (useStructuredResult === true) {
                const result = new QueryResult()
                result.records = []
                result.raw = []
                return Promise.resolve(result)
            }
            return Promise.resolve([])
        }) as QueryRunner["query"]

        try {
            await run()
        } finally {
            queryRunner.query = originalQuery
        }

        return statements
    }

    protected async resolveMigrationChecksum(
        queryRunner: QueryRunner,
        migration: Migration,
        options?: { recordOnly?: boolean },
    ): Promise<string | null> {
        if (!migration.instance) {
            return null
        }
        if (migration.checksum) {
            return migration.checksum
        }
        // Fake runs and insertMigration() only record a row; they must not
        // execute migration code while resolving a checksum.
        if (options?.recordOnly || this.fake) {
            return null
        }

        const captured = await this.captureMigrationSql(
            queryRunner,
            () => migration.instance!.up(queryRunner),
            false,
        )
        return computeMigrationChecksum(migration.name, captured)
    }

    protected async verifyExecutedMigrationChecksums(
        queryRunner: QueryRunner,
        executedMigrations: Migration[],
        sourceMigrations: Migration[],
    ) {
        if (this.dataSource.driver.options.type === "mongodb") {
            return
        }

        const sourceMigrationsByName = new Map(
            sourceMigrations.map((migration) => [migration.name, migration]),
        )

        for (const executedMigration of executedMigrations) {
            if (!executedMigration.checksum) {
                continue
            }

            const sourceMigration = sourceMigrationsByName.get(
                executedMigration.name,
            )
            if (!sourceMigration?.instance) {
                continue
            }

            const capturedSql = await this.captureMigrationSql(
                queryRunner,
                () => sourceMigration.instance!.up(queryRunner),
                false,
            )
            const currentSql = sqlStatementsForDisplay(capturedSql)
            const currentChecksum = computeMigrationChecksum(
                sourceMigration.name,
                capturedSql,
            )
            if (currentChecksum !== executedMigration.checksum) {
                this.dataSource.logger.logMigration(
                    `Checksum mismatch for "${executedMigration.name}". SQL used for current checksum:\n${currentSql}`,
                )
                throw new MigrationChecksumMismatchError(
                    executedMigration.name,
                    executedMigration.checksum,
                    currentChecksum,
                    currentSql,
                )
            }
        }
    }

    /**
     * Wraps a value for SQL Server using a type name resolved at runtime
     * (driver-normalized or user-configured), rejecting unsupported names.
     *
     * @param value
     * @param type
     * @param params optional length / precision / scale
     */
    protected createMssqlParameter(
        value: unknown,
        type: string,
        ...params: number[]
    ): MssqlParameter {
        if (!isMssqlParameterType(type)) {
            throw new TypeORMError(
                `Unsupported SQL Server parameter type "${type}" for the migrations table.`,
            )
        }
        return new MssqlParameter(value, type, ...params)
    }

    protected buildExecutedAtColumn(): TableColumn {
        return new TableColumn({
            name: "executedAt",
            type: this.dataSource.driver.normalizeType({
                type: this.dataSource.driver.mappedDataTypes.migrationTimestamp,
            }),
            isNullable: true,
        })
    }

    protected buildChecksumColumn(): TableColumn {
        return new TableColumn({
            name: "checksum",
            type: this.dataSource.driver.normalizeType({
                type: this.dataSource.driver.mappedDataTypes.migrationName,
            }),
            length: "64",
            isNullable: true,
        })
    }

    protected getRawMigrationValue(
        migrationRaw: ObjectLiteral,
        columnName: string,
    ): unknown {
        if (Object.prototype.hasOwnProperty.call(migrationRaw, columnName)) {
            return migrationRaw[columnName]
        }

        const lowerName = columnName.toLowerCase()
        for (const key of Object.keys(migrationRaw)) {
            if (key.toLowerCase() === lowerName) {
                return migrationRaw[key]
            }
        }

        return undefined
    }

    protected getMigrationsExtraColumns(): {
        name: string
        type: string
        length?: string
    }[] {
        const reserved = new Set([
            "id",
            "timestamp",
            "name",
            "executedat",
            "checksum",
        ])
        const seenNames = new Set<string>()
        const columns: {
            name: string
            type: string
            length?: string
        }[] = []
        for (const column of this.dataSource.options.migrationsExtraColumns ??
            []) {
            const name = column.name?.trim()
            if (!name) continue
            const lowerName = name.toLowerCase()
            // skip reserved names and duplicates (case-insensitive) so table
            // creation does not fail with duplicate-column errors
            if (reserved.has(lowerName) || seenNames.has(lowerName)) continue
            seenNames.add(lowerName)
            columns.push({ ...column, name })
        }
        return columns
    }

    protected async ensureMigrationsTableColumns(
        queryRunner: QueryRunner,
    ): Promise<void> {
        if (this.migrationsTableColumnsEnsured) {
            return
        }

        // Read the table once and diff in memory instead of issuing one
        // hasColumn round-trip per column on every startup.
        const table = await queryRunner.getTable(this.migrationsTable)
        if (!table) {
            return
        }

        // Match by exact name: identifiers are quoted, so on case-sensitive
        // databases "Checksum" and "checksum" are different columns and the
        // insert would target the exact-case name.
        const missingColumns: TableColumn[] = []
        if (!table.findColumnByName("executedAt")) {
            missingColumns.push(this.buildExecutedAtColumn())
        }
        if (!table.findColumnByName("checksum")) {
            missingColumns.push(this.buildChecksumColumn())
        }
        for (const column of this.getMigrationsExtraColumns()) {
            if (!table.findColumnByName(column.name)) {
                missingColumns.push(
                    new TableColumn({
                        name: column.name,
                        type: column.type,
                        length: column.length,
                        isNullable: true,
                    }),
                )
            }
        }

        if (missingColumns.length > 0) {
            await queryRunner.addColumns(this.migrationsTable, missingColumns)
        }

        this.migrationsTableColumnsEnsured = true
    }
}
