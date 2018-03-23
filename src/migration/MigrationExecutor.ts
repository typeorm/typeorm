import {Table} from "../schema-builder/schema/Table";
import {TableColumn} from "../schema-builder/schema/TableColumn";
import {Connection} from "../connection/Connection";
import {Migration} from "./Migration";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {PromiseUtils} from "../util/PromiseUtils";
import {QueryRunner} from "../query-runner/QueryRunner";
import {SqlServerDriver} from "../driver/sqlserver/SqlServerDriver";
import {MssqlParameter} from "../driver/sqlserver/MssqlParameter";

/**
 * Executes migrations: runs pending and reverts previously executed migrations.
 */
export class MigrationExecutor {

    private migrationsTableName: string = "migrations";
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection,
                protected queryRunner?: QueryRunner) {
        if (connection.options.migrationsTableName) {
            this.migrationsTableName = connection.options.migrationsTableName;
        }
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Executes all pending migrations. Pending migrations are migrations that are not yet executed,
     * thus not saved in the database.
     */
    async executePendingMigrations(): Promise<void> {

        const queryRunner = this.queryRunner || this.connection.createQueryRunner("master");

        // create migrations table if its not created yet
        await this.createMigrationsTableIfNotExist(queryRunner);

        // get all migrations that are executed and saved in the database
        const executedMigrations = await this.loadExecutedMigrations(queryRunner);

        // get the time when last migration was executed
        let lastTimeExecutedMigration = this.getLatestMigration(executedMigrations);

        // get all user's migrations in the source code
        const allMigrations = this.getMigrations();

        // find all migrations that needs to be executed
        const pendingMigrations = allMigrations.filter(migration => {
            // check if we already have executed migration
            const executedMigration = executedMigrations.find(executedMigration => executedMigration.name === migration.name);
            if (executedMigration)
                return false;

            // migration is new and not executed. now check if its timestamp is correct
            if (lastTimeExecutedMigration && migration.timestamp < lastTimeExecutedMigration.timestamp)
                throw new Error(`New migration found: ${migration.name}, however this migration's timestamp is not valid. Migration's timestamp should not be older then migrations already executed in the database.`);

            // every check is passed means that migration was not run yet and we need to run it
            return true;
        });

        // if no migrations are pending then nothing to do here
        if (!pendingMigrations.length) {
            this.connection.logger.logSchemaBuild(`No migrations are pending`);
            return;
        }

        // log information about migration execution
        this.connection.logger.logSchemaBuild(`${executedMigrations.length} migrations are already loaded in the database.`);
        this.connection.logger.logSchemaBuild(`${allMigrations.length} migrations were found in the source code.`);
        if (lastTimeExecutedMigration)
            this.connection.logger.logSchemaBuild(`${lastTimeExecutedMigration.name} is the last executed migration. It was executed on ${new Date(lastTimeExecutedMigration.timestamp * 1000).toString()}.`);
        this.connection.logger.logSchemaBuild(`${pendingMigrations.length} migrations are new migrations that needs to be executed.`);

        // start transaction if its not started yet
        let transactionStartedByUs = false;
        if (!queryRunner.isTransactionActive) {
            await queryRunner.startTransaction();
            transactionStartedByUs = true;
        }

        // run all pending migrations in a sequence
        try {
            await PromiseUtils.runInSequence(pendingMigrations, migration => {
                return migration.instance!.up(queryRunner)
                    .then(() => { // now when migration is executed we need to insert record about it into the database
                        return this.insertExecutedMigration(queryRunner, migration);
                    })
                    .then(() => { // informative log about migration success
                        this.connection.logger.logSchemaBuild(`Migration ${migration.name} has been executed successfully.`);
                    });
            });

            // commit transaction if we started it
            if (transactionStartedByUs)
                await queryRunner.commitTransaction();

        } catch (err) { // rollback transaction if we started it
            if (transactionStartedByUs) {
                try { // we throw original error even if rollback thrown an error
                    await queryRunner.rollbackTransaction();
                } catch (rollbackError) { }
            }

            throw err;

        } finally {

            // if query runner was created by us then release it
            if (!this.queryRunner)
                await queryRunner.release();
        }

    }

    /**
     * Reverts last migration that were run.
     */
    async undoLastMigration(): Promise<void> {

        const queryRunner = this.queryRunner || this.connection.createQueryRunner("master");

        // create migrations table if its not created yet
        await this.createMigrationsTableIfNotExist(queryRunner);

        // get all migrations that are executed and saved in the database
        const executedMigrations = await this.loadExecutedMigrations(queryRunner);

        // get the time when last migration was executed
        let lastTimeExecutedMigration = this.getLatestMigration(executedMigrations);

        // if no migrations found in the database then nothing to revert
        if (!lastTimeExecutedMigration) {
            this.connection.logger.logSchemaBuild(`No migrations was found in the database. Nothing to revert!`);
            return;
        }

        // get all user's migrations in the source code
        const allMigrations = this.getMigrations();

        // find the instance of the migration we need to remove
        const migrationToRevert = allMigrations.find(migration => migration.name === lastTimeExecutedMigration!.name);

        // if no migrations found in the database then nothing to revert
        if (!migrationToRevert)
            throw new Error(`No migration ${lastTimeExecutedMigration.name} was found in the source code. Make sure you have this migration in your codebase and its included in the connection options.`);

        // log information about migration execution
        this.connection.logger.logSchemaBuild(`${executedMigrations.length} migrations are already loaded in the database.`);
        this.connection.logger.logSchemaBuild(`${lastTimeExecutedMigration.name} is the last executed migration. It was executed on ${new Date(lastTimeExecutedMigration.timestamp * 1000).toString()}.`);
        this.connection.logger.logSchemaBuild(`Now reverting it...`);

        // start transaction if its not started yet
        let transactionStartedByUs = false;
        if (!queryRunner.isTransactionActive) {
            await queryRunner.startTransaction();
            transactionStartedByUs = true;
        }

        try {
            await migrationToRevert.instance!.down(queryRunner);
            await this.deleteExecutedMigration(queryRunner, migrationToRevert);
            this.connection.logger.logSchemaBuild(`Migration ${migrationToRevert.name} has been reverted successfully.`);

            // commit transaction if we started it
            if (transactionStartedByUs)
                await queryRunner.commitTransaction();

        } catch (err) { // rollback transaction if we started it
            if (transactionStartedByUs) {
                try { // we throw original error even if rollback thrown an error
                    await queryRunner.rollbackTransaction();
                } catch (rollbackError) { }
            }

            throw err;

        } finally {

            // if query runner was created by us then release it
            if (!this.queryRunner)
                await queryRunner.release();
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates table "migrations" that will store information about executed migrations.
     */
    protected async createMigrationsTableIfNotExist(queryRunner: QueryRunner): Promise<void> {
        const tableExist = await queryRunner.hasTable(this.migrationsTableName);
        if (!tableExist) {
            await queryRunner.createTable(new Table(this.migrationsTableName, [
                new TableColumn({
                    name: "timestamp",
                    type: this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationTimestamp }),
                    isPrimary: true,
                    isNullable: false
                }),
                new TableColumn({
                    name: "name",
                    type: this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationName }),
                    isNullable: false
                }),
            ]));
        }
    }

    /**
     * Loads all migrations that were executed and saved into the database.
     */
    protected async loadExecutedMigrations(queryRunner: QueryRunner): Promise<Migration[]> {
        const migrationsRaw: ObjectLiteral[] = await this.connection.manager
            .createQueryBuilder(queryRunner)
            .select()
            .from(this.migrationsTableName, "migrations")
            .getRawMany();

        return migrationsRaw.map(migrationRaw => {
            return new Migration(parseInt(migrationRaw["timestamp"]), migrationRaw["name"]);
        });
    }

    /**
     * Gets all migrations that setup for this connection.
     */
    protected getMigrations(): Migration[] {
        const migrations = this.connection.migrations.map(migration => {
            const migrationClassName = (migration.constructor as any).name;
            const migrationTimestamp = parseInt(migrationClassName.substr(-13));
            if (!migrationTimestamp)
                throw new Error(`${migrationClassName} migration name is wrong. Migration class name should have a UNIX timestamp appended. `);

            return new Migration(migrationTimestamp, migrationClassName, migration);
        });

        // sort them by timestamp
        return migrations.sort((a, b) => a.timestamp - b.timestamp);
    }

    /**
     * Finds the latest migration (sorts by timestamp) in the given array of migrations.
     */
    protected getLatestMigration(migrations: Migration[]): Migration|undefined {
        const sortedMigrations = migrations.map(migration => migration).sort((a, b) => (a.timestamp - b.timestamp) * -1);
        return sortedMigrations.length > 0 ? sortedMigrations[0] : undefined;
    }

    /**
     * Inserts new executed migration's data into migrations table.
     */
    protected async insertExecutedMigration(queryRunner: QueryRunner, migration: Migration): Promise<void> {
        if (this.connection.driver instanceof SqlServerDriver) {
            await queryRunner.insert(this.migrationsTableName, {
                timestamp: new MssqlParameter(migration.timestamp, this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationTimestamp }) as any),
                name: new MssqlParameter(migration.name, this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationName }) as any),
            });

        } else {
            await queryRunner.insert(this.migrationsTableName, {
                timestamp: migration.timestamp,
                name: migration.name,
            });
        }
    }

    /**
     * Delete previously executed migration's data from the migrations table.
     */
    protected async deleteExecutedMigration(queryRunner: QueryRunner, migration: Migration): Promise<void> {
        if (this.connection.driver instanceof SqlServerDriver) {
            await queryRunner.delete(this.migrationsTableName, {
                timestamp: new MssqlParameter(migration.timestamp, this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationTimestamp }) as any),
                name: new MssqlParameter(migration.name, this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationName }) as any),
            });

        } else {
            await queryRunner.delete(this.migrationsTableName, {
                timestamp: migration.timestamp,
                name: migration.name,
            });
        }
    }

}