import {Table} from "../schema-builder/table/Table";
import {TableColumn} from "../schema-builder/table/TableColumn";
import {Connection} from "../connection/Connection";
import {Migration} from "./Migration";
import {MigrationInterface} from "./MigrationInterface";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {CollectionUtils} from "../util/CollectionUtils";
import {PromiseUtils} from "../util/PromiseUtils";
import {QueryRunner} from "../query-runner/QueryRunner";
import {SqlServerDriver} from "../driver/sqlserver/SqlServerDriver";
import {MssqlParameter} from "../driver/sqlserver/MssqlParameter";
import {SqlServerConnectionOptions} from "../driver/sqlserver/SqlServerConnectionOptions";
import {PostgresConnectionOptions} from "../driver/postgres/PostgresConnectionOptions";
import {MongoDriver} from "../driver/mongodb/MongoDriver";
import {MongoQueryRunner} from "../driver/mongodb/MongoQueryRunner";
import {sha1} from "object-hash";

export const COLUMN_CREATE_DATE = "create_date";
export const COLUMN_HASH = "hash";
export const COLUMN_ID = "id";
export const COLUMN_NAME = "name";
export const COLUMN_TIMESTAMP = "timestamp";

/**
 * Executes migrations: runs pending and reverts previously executed migrations.
 */
export class MigrationExecutor {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Indicates if migrations must be executed in a transaction.
     */
    transaction: boolean = true;

    // -------------------------------------------------------------------------
    // Private Properties
    // -------------------------------------------------------------------------

    private readonly migrationsTable: string;
    private readonly migrationsTableName: string;
    private readonly migrationsIgnoreHash: boolean;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection,
                protected queryRunner?: QueryRunner) {

        const options = <SqlServerConnectionOptions|PostgresConnectionOptions>this.connection.driver.options;
        this.migrationsTableName = connection.options.migrationsTableName || "migrations";
        this.migrationsIgnoreHash = !!connection.options.migrationsIgnoreHash;
        this.migrationsTable = this.connection.driver.buildTableName(this.migrationsTableName, options.schema, options.database);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Executes all pending migrations. Pending migrations are migrations that are not yet executed,
     * thus not saved in the database.
     */
    async executePendingMigrations(): Promise<Migration[]> {

        const queryRunner = this.queryRunner || this.connection.createQueryRunner("master");
        // create migrations table if its not created yet
        await this.createMigrationsTableIfNotExist(queryRunner);
        // get all migrations that are executed and saved in the database
        const executedMigrations = await this.loadExecutedMigrations(queryRunner);
        const executedMigrationsByName = CollectionUtils.indexBy(executedMigrations, "name");

        // get the time when last migration was executed
        let lastTimeExecutedMigration = this.getLatestTimestampMigration(executedMigrations);

        // get all user's migrations in the source code
        const allMigrations = this.getMigrations();

        // variable to store all migrations we did successefuly
        const successMigrations: Migration[] = [];

        // find all migrations that needs to be executed
        const pendingMigrations = allMigrations.filter(migration => {
            // check if we already have executed migration
            const executedMigration = executedMigrationsByName[migration.name];
            if (executedMigration) {
                delete executedMigrationsByName[migration.name];
                if (!this.migrationsIgnoreHash && executedMigration.hash !== migration.hash) {
                    throw new Error(`Migration hash for ${executedMigration.name} does not match: ${executedMigration.hash} !== ${migration.hash}`);
                }
                return false;
            }

            // migration is new and not executed. now check if its timestamp is correct
            // if (lastTimeExecutedMigration && migration.timestamp < lastTimeExecutedMigration.timestamp)
            //     throw new Error(`New migration found: ${migration.name}, however this migration's timestamp is not valid. Migration's timestamp should not be older then migrations already executed in the database.`);

            // every check is passed means that migration was not run yet and we need to run it
            return true;
        });

        const nonExistingMigrations = Object.keys(executedMigrationsByName);
        if (!this.migrationsIgnoreHash && nonExistingMigrations.length) {
            // if a migration was executed, but the source file deleted, we abort because this means the enviornment won't be reproducible
            throw new Error(`No source migration(s) found for the following executed migration(s): ${nonExistingMigrations}`);
        }

        // if no migrations are pending then nothing to do here
        if (!pendingMigrations.length) {
            this.connection.logger.logSchemaBuild(`No migrations are pending`);
            // if query runner was created by us then release it
            if (!this.queryRunner)
                await queryRunner.release();
            return [];
        }

        // log information about migration execution
        this.connection.logger.logSchemaBuild(`${executedMigrations.length} migrations are already loaded in the database.`);
        this.connection.logger.logSchemaBuild(`${allMigrations.length} migrations were found in the source code.`);
        if (lastTimeExecutedMigration)
            this.connection.logger.logSchemaBuild(`${lastTimeExecutedMigration.name} is the last executed migration. It was executed on ${new Date(lastTimeExecutedMigration.timestamp).toString()}.`);
        this.connection.logger.logSchemaBuild(`${pendingMigrations.length} migrations are new migrations that needs to be executed.`);

        // start transaction if its not started yet
        let transactionStartedByUs = false;
        if (this.transaction && !queryRunner.isTransactionActive) {
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
                        successMigrations.push(migration);
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
        return successMigrations;

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
        let lastTimeExecutedMigration = this.getLatestExecutedMigration(executedMigrations);

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
        this.connection.logger.logSchemaBuild(`${lastTimeExecutedMigration.name} is the last executed migration. It was executed on ${new Date(lastTimeExecutedMigration.timestamp).toString()}.`);
        this.connection.logger.logSchemaBuild(`Now reverting it...`);

        // start transaction if its not started yet
        let transactionStartedByUs = false;
        if (this.transaction && !queryRunner.isTransactionActive) {
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
        // If driver is mongo no need to create
        if (this.connection.driver instanceof MongoDriver) {
            const mongoRunner = queryRunner as MongoQueryRunner;
            const anyMigrationWithoutHash = await mongoRunner.databaseConnection.db(this.connection.driver.database!).collection(this.migrationsTableName).countDocuments({ hash: { $exists: false } });
            if (anyMigrationWithoutHash) {
                await this.updateHashes(queryRunner);
            }
            return;
        }
        const tableExist = await queryRunner.hasTable(this.migrationsTable); // todo: table name should be configurable
        if (!tableExist) {
            await queryRunner.createTable(new Table(
                {
                    name: this.migrationsTable,
                    columns: [
                        {
                            name: COLUMN_ID,
                            type: this.connection.driver.normalizeType({type: this.connection.driver.mappedDataTypes.migrationId}),
                            isGenerated: true,
                            generationStrategy: "increment",
                            isPrimary: true,
                            isNullable: false
                        },
                        {
                            name: COLUMN_TIMESTAMP,
                            type: this.connection.driver.normalizeType({type: this.connection.driver.mappedDataTypes.migrationTimestamp}),
                            isPrimary: false,
                            isNullable: false
                        },
                        {
                            name: COLUMN_NAME,
                            type: this.connection.driver.normalizeType({type: this.connection.driver.mappedDataTypes.migrationName}),
                            isNullable: false
                        },
                        {
                            name: COLUMN_HASH,
                            type: this.connection.driver.normalizeType({type: this.connection.driver.mappedDataTypes.migrationHash}),
                            isNullable: false,
                            length: "40"
                        }
                    ]
                },
            ));
        }
        const table = await queryRunner.getTable(this.migrationsTable);
        const hashColumnExist = table!.columns.some(c => c.name.toLowerCase() === COLUMN_HASH);
        if (!hashColumnExist) {
            await queryRunner.addColumn(this.migrationsTable, new TableColumn({
                name: COLUMN_HASH,
                type: this.connection.driver.normalizeType({type: this.connection.driver.mappedDataTypes.migrationHash}),
                isNullable: true,
                length: "40",
            }));

            await this.updateHashes(queryRunner);

            await queryRunner.changeColumn(this.migrationsTable, COLUMN_HASH, new TableColumn({
                name: COLUMN_HASH,
                type: this.connection.driver.normalizeType({type: this.connection.driver.mappedDataTypes.migrationHash}),
                isNullable: false,
                length: "40",
            }));
        }

        const createDateColumnExist = table!.columns.some(c => c.name.toLowerCase() === COLUMN_CREATE_DATE);
        if (!createDateColumnExist) {
            await queryRunner.addColumn(this.migrationsTable, new TableColumn({
                name: COLUMN_CREATE_DATE,
                type: this.connection.driver.normalizeType({type: this.connection.driver.mappedDataTypes.createDate}),
                default: this.connection.driver.mappedDataTypes.createDateDefault,
                precision: this.connection.driver.mappedDataTypes.createDatePrecision,
                isNullable: true,
            }));
        }
    }

    protected async updateHashes(queryRunner: QueryRunner): Promise<void> {
        const executedMigrations = await this.loadExecutedMigrations(queryRunner);
        const migrations = this.getMigrations().filter(migration => executedMigrations.find(executedMigration => executedMigration.name === migration.name));
        await PromiseUtils.runInSequence(migrations, migration => {
            return this.updateHash(migration, queryRunner);
        });
    }

    protected async updateHash(migration: Migration, queryRunner: QueryRunner): Promise<void> {
        const hash = this.calculateHash(migration.instance!);
        if (this.connection.driver instanceof MongoDriver) {
            const mongoRunner = queryRunner as MongoQueryRunner;
            await mongoRunner.databaseConnection.db(this.connection.driver.database!).collection(this.migrationsTableName).updateOne({
                name: migration.name,
            }, {
                $set: { hash }
            });
        } else {
            await this.connection.manager
            .createQueryBuilder()
            .update(this.migrationsTable)
            .set({ hash })
            .where({ name: migration.name })
            .execute();
        }
    }

    /**
     * Loads all migrations that were executed and saved into the database.
     */
    protected async loadExecutedMigrations(queryRunner: QueryRunner): Promise<Migration[]> {
        if (this.connection.driver instanceof MongoDriver) {
            const mongoRunner = queryRunner as MongoQueryRunner;
            return await mongoRunner.databaseConnection.db(this.connection.driver.database!).collection(this.migrationsTableName).find().toArray();
        } else {
            const migrationsRaw: ObjectLiteral[] = await this.connection.manager
            .createQueryBuilder(queryRunner)
            .select()
            .from(this.migrationsTable, this.migrationsTableName)
            .getRawMany();
            return migrationsRaw.map(migrationRaw => {
                return new Migration(parseInt(migrationRaw[COLUMN_ID]), parseInt(migrationRaw[COLUMN_TIMESTAMP]), migrationRaw[COLUMN_NAME], migrationRaw[COLUMN_HASH]);
            });
        }
    }

    /**
     * Gets all migrations that setup for this connection.
     */
    protected getMigrations(): Migration[] {
        const migrations = this.connection.migrations.map(migration => {
            const migrationClassName = (migration.constructor as any).name;
            const migrationTimestamp = parseInt(migrationClassName.substr(-13));
            if (!migrationTimestamp)
                throw new Error(`${migrationClassName} migration name is wrong. Migration class name should have a JavaScript timestamp appended.`);
            const hash = this.calculateHash(migration);
            return new Migration(undefined, migrationTimestamp, migrationClassName, hash, migration);
        });

        // sort them by timestamp
        return migrations.sort((a, b) => a.timestamp - b.timestamp);
    }

    protected calculateHash(migration: MigrationInterface): string {
        return sha1(migration);
    }

    /**
     * Finds the latest migration (sorts by timestamp) in the given array of migrations.
     */
    protected getLatestTimestampMigration(migrations: Migration[]): Migration|undefined {
        const sortedMigrations = migrations.map(migration => migration).sort((a, b) => (a.timestamp - b.timestamp) * -1);
        return sortedMigrations.length > 0 ? sortedMigrations[0] : undefined;
    }

    /**
     * Finds the latest migration (sorts by id) in the given array of migrations.
     */
    protected getLatestExecutedMigration(migrations: Migration[]): Migration|undefined {
        const sortedMigrations = migrations.map(migration => migration).sort((a, b) => ((a.id || 0) - (b.id || 0)) * -1);
        return sortedMigrations.length > 0 ? sortedMigrations[0] : undefined;
    }

    /**
     * Inserts new executed migration's data into migrations table.
     */
    protected async insertExecutedMigration(queryRunner: QueryRunner, migration: Migration): Promise<void> {
        const values: ObjectLiteral = {};
        if (this.connection.driver instanceof SqlServerDriver) {
            values[COLUMN_TIMESTAMP] = new MssqlParameter(migration.timestamp, this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationTimestamp }) as any);
            values[COLUMN_NAME] = new MssqlParameter(migration.name, this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationName }) as any);
            values[COLUMN_HASH] = new MssqlParameter(migration.hash, this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationHash }) as any);
        } else {
            values[COLUMN_TIMESTAMP] = migration.timestamp;
            values[COLUMN_NAME] = migration.name;
            values[COLUMN_HASH] = migration.hash;
        }
        if (this.connection.driver instanceof MongoDriver) {
            values[COLUMN_CREATE_DATE] = new Date();
            const mongoRunner = queryRunner as MongoQueryRunner;
            await mongoRunner.databaseConnection.db(this.connection.driver.database!).collection(this.migrationsTableName).insertOne(values);
        } else {
            const qb = queryRunner.manager.createQueryBuilder();
            await qb.insert()
                .into(this.migrationsTable)
                .values(values)
                .execute();
        }
    }

    /**
     * Delete previously executed migration's data from the migrations table.
     */
    protected async deleteExecutedMigration(queryRunner: QueryRunner, migration: Migration): Promise<void> {

        const conditions: ObjectLiteral = {};
        if (this.connection.driver instanceof SqlServerDriver) {
            conditions[COLUMN_TIMESTAMP] = new MssqlParameter(migration.timestamp, this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationTimestamp }) as any);
            conditions[COLUMN_NAME] = new MssqlParameter(migration.name, this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationName }) as any);
        } else {
            conditions[COLUMN_TIMESTAMP] = migration.timestamp;
            conditions[COLUMN_NAME] = migration.name;
        }

        if (this.connection.driver instanceof MongoDriver) {
            const mongoRunner = queryRunner as MongoQueryRunner;
            mongoRunner.databaseConnection.db(this.connection.driver.database!).collection(this.migrationsTableName).deleteOne(conditions);
        } else {
            const qb = queryRunner.manager.createQueryBuilder();
            await qb.delete()
                .from(this.migrationsTable)
                .where(`${qb.escape(COLUMN_TIMESTAMP)} = :timestamp`)
                .andWhere(`${qb.escape(COLUMN_NAME)} = :name`)
                .setParameters(conditions)
                .execute();
        }

    }

}
