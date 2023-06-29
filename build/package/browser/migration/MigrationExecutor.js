import { __awaiter } from "tslib";
import { Table } from "../schema-builder/table/Table";
import { Migration } from "./Migration";
import { SqlServerDriver } from "../driver/sqlserver/SqlServerDriver";
import { MssqlParameter } from "../driver/sqlserver/MssqlParameter";
import { MongoDriver } from "../driver/mongodb/MongoDriver";
/**
 * Executes migrations: runs pending and reverts previously executed migrations.
 */
export class MigrationExecutor {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(connection, queryRunner, puzzleLogger) {
        this.connection = connection;
        this.queryRunner = queryRunner;
        this.puzzleLogger = puzzleLogger;
        // -------------------------------------------------------------------------
        // Public Properties
        // -------------------------------------------------------------------------
        /**
         * Indicates how migrations should be run in transactions.
         *   all: all migrations are run in a single transaction
         *   none: all migrations are run without a transaction
         *   each: each migration is run in a separate transaction
         */
        this.transaction = "all";
        const options = this.connection.driver.options;
        this.migrationsTableName = connection.options.migrationsTableName || "migrations";
        this.migrationsTable = this.connection.driver.buildTableName(this.migrationsTableName, options.schema, options.database);
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Tries to execute a single migration given.
     */
    executeMigration(migration) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            (_a = this.puzzleLogger) === null || _a === void 0 ? void 0 : _a.info(`Running migration`, { name: migration.name });
            try {
                return this.withQueryRunner((queryRunner) => __awaiter(this, void 0, void 0, function* () {
                    yield this.createMigrationsTableIfNotExist(queryRunner);
                    yield migration.instance.up(queryRunner);
                    yield this.insertExecutedMigration(queryRunner, migration);
                    return migration;
                }));
            }
            catch (e) {
                (_b = this.puzzleLogger) === null || _b === void 0 ? void 0 : _b.error(`Failed migration`, { name: migration.name });
                throw e;
            }
        });
    }
    /**
     * Returns an array of all migrations.
     */
    getAllMigrations() {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve(this.getMigrations());
        });
    }
    /**
     * Returns an array of all executed migrations.
     */
    getExecutedMigrations() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.withQueryRunner((queryRunner) => __awaiter(this, void 0, void 0, function* () {
                yield this.createMigrationsTableIfNotExist(queryRunner);
                return yield this.loadExecutedMigrations(queryRunner);
            }));
        });
    }
    /**
     * Returns an array of all pending migrations.
     */
    getPendingMigrations() {
        return __awaiter(this, void 0, void 0, function* () {
            const allMigrations = yield this.getAllMigrations();
            const executedMigrations = yield this.getExecutedMigrations();
            return allMigrations.filter(migration => !executedMigrations.find(executedMigration => executedMigration.name === migration.name));
        });
    }
    /**
     * Inserts an executed migration.
     */
    insertMigration(migration) {
        return new Promise((resolve, reject) => {
            this.withQueryRunner(queryRunner => {
                this.insertExecutedMigration(queryRunner, migration)
                    .then(resolve)
                    .catch(reject);
            });
        });
    }
    /**
     * Deletes an executed migration.
     */
    deleteMigration(migration) {
        return new Promise((resolve, reject) => {
            this.withQueryRunner(queryRunner => {
                this.deleteExecutedMigration(queryRunner, migration)
                    .then(resolve)
                    .catch(reject);
            });
        });
    }
    /**
     * Lists all migrations and whether they have been executed or not
     * returns true if there are unapplied migrations
     */
    showMigrations() {
        return __awaiter(this, void 0, void 0, function* () {
            let hasUnappliedMigrations = false;
            const queryRunner = this.queryRunner || this.connection.createQueryRunner();
            // create migrations table if its not created yet
            yield this.createMigrationsTableIfNotExist(queryRunner);
            // get all migrations that are executed and saved in the database
            const executedMigrations = yield this.loadExecutedMigrations(queryRunner);
            // get all user's migrations in the source code
            const allMigrations = this.getMigrations();
            for (const migration of allMigrations) {
                const executedMigration = executedMigrations.find(executedMigration => executedMigration.name === migration.name);
                if (executedMigration) {
                    this.connection.logger.logSchemaBuild(` [X] ${migration.name}`);
                }
                else {
                    hasUnappliedMigrations = true;
                    this.connection.logger.logSchemaBuild(` [ ] ${migration.name}`);
                }
            }
            // if query runner was created by us then release it
            if (!this.queryRunner) {
                yield queryRunner.release();
            }
            return hasUnappliedMigrations;
        });
    }
    /**
     * Executes all pending migrations. Pending migrations are migrations that are not yet executed,
     * thus not saved in the database.
     */
    executePendingMigrations() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const queryRunner = this.queryRunner || this.connection.createQueryRunner();
            // create migrations table if its not created yet
            yield this.createMigrationsTableIfNotExist(queryRunner);
            // get all migrations that are executed and saved in the database
            const executedMigrations = yield this.loadExecutedMigrations(queryRunner);
            // get the time when last migration was executed
            let lastTimeExecutedMigration = this.getLatestTimestampMigration(executedMigrations);
            // get all user's migrations in the source code
            const allMigrations = this.getMigrations();
            // variable to store all migrations we did successefuly
            const successMigrations = [];
            // find all migrations that needs to be executed
            const pendingMigrations = allMigrations.filter(migration => {
                // check if we already have executed migration
                const executedMigration = executedMigrations.find(executedMigration => executedMigration.name === migration.name);
                if (executedMigration)
                    return false;
                // migration is new and not executed. now check if its timestamp is correct
                // if (lastTimeExecutedMigration && migration.timestamp < lastTimeExecutedMigration.timestamp)
                //     throw new Error(`New migration found: ${migration.name}, however this migration's timestamp is not valid. Migration's timestamp should not be older then migrations already executed in the database.`);
                // every check is passed means that migration was not run yet and we need to run it
                return true;
            });
            // if no migrations are pending then nothing to do here
            if (!pendingMigrations.length) {
                this.connection.logger.logSchemaBuild(`No migrations are pending`);
                // if query runner was created by us then release it
                if (!this.queryRunner)
                    yield queryRunner.release();
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
            if (this.transaction === "all" && !queryRunner.isTransactionActive) {
                yield queryRunner.startTransaction();
                transactionStartedByUs = true;
            }
            // run all pending migrations in a sequence
            try {
                for (const migration of pendingMigrations) {
                    if (this.transaction === "each" && !queryRunner.isTransactionActive) {
                        yield queryRunner.startTransaction();
                        transactionStartedByUs = true;
                    }
                    (_a = this.puzzleLogger) === null || _a === void 0 ? void 0 : _a.info(`Running migration`, { name: migration.name });
                    try {
                        yield migration.instance.up(queryRunner)
                            .then(() => __awaiter(this, void 0, void 0, function* () {
                            yield this.insertExecutedMigration(queryRunner, migration);
                            // commit transaction if we started it
                            if (this.transaction === "each" && transactionStartedByUs)
                                yield queryRunner.commitTransaction();
                        }))
                            .then(() => {
                            successMigrations.push(migration);
                            this.connection.logger.logSchemaBuild(`Migration ${migration.name} has been executed successfully.`);
                        });
                    }
                    catch (e) {
                        this.connection.logger.logSchemaBuild(`Migration ${migration.name} has failed.`);
                        (_b = this.puzzleLogger) === null || _b === void 0 ? void 0 : _b.error(`Failed migration`, { name: migration.name });
                        throw e;
                    }
                }
                // commit transaction if we started it
                if (this.transaction === "all" && transactionStartedByUs)
                    yield queryRunner.commitTransaction();
            }
            catch (err) { // rollback transaction if we started it
                if (transactionStartedByUs) {
                    try { // we throw original error even if rollback thrown an error
                        yield queryRunner.rollbackTransaction();
                    }
                    catch (rollbackError) { }
                }
                throw err;
            }
            finally {
                // if query runner was created by us then release it
                if (!this.queryRunner)
                    yield queryRunner.release();
            }
            return successMigrations;
        });
    }
    /**
     * Reverts last migration that were run.
     */
    undoLastMigration() {
        return __awaiter(this, void 0, void 0, function* () {
            const queryRunner = this.queryRunner || this.connection.createQueryRunner();
            // create migrations table if its not created yet
            yield this.createMigrationsTableIfNotExist(queryRunner);
            // get all migrations that are executed and saved in the database
            const executedMigrations = yield this.loadExecutedMigrations(queryRunner);
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
            const migrationToRevert = allMigrations.find(migration => migration.name === lastTimeExecutedMigration.name);
            // if no migrations found in the database then nothing to revert
            if (!migrationToRevert)
                throw new Error(`No migration ${lastTimeExecutedMigration.name} was found in the source code. Make sure you have this migration in your codebase and its included in the connection options.`);
            // log information about migration execution
            this.connection.logger.logSchemaBuild(`${executedMigrations.length} migrations are already loaded in the database.`);
            this.connection.logger.logSchemaBuild(`${lastTimeExecutedMigration.name} is the last executed migration. It was executed on ${new Date(lastTimeExecutedMigration.timestamp).toString()}.`);
            this.connection.logger.logSchemaBuild(`Now reverting it...`);
            // start transaction if its not started yet
            let transactionStartedByUs = false;
            if ((this.transaction !== "none") && !queryRunner.isTransactionActive) {
                yield queryRunner.startTransaction();
                transactionStartedByUs = true;
            }
            try {
                yield migrationToRevert.instance.down(queryRunner);
                yield this.deleteExecutedMigration(queryRunner, migrationToRevert);
                this.connection.logger.logSchemaBuild(`Migration ${migrationToRevert.name} has been reverted successfully.`);
                // commit transaction if we started it
                if (transactionStartedByUs)
                    yield queryRunner.commitTransaction();
            }
            catch (err) { // rollback transaction if we started it
                if (transactionStartedByUs) {
                    try { // we throw original error even if rollback thrown an error
                        yield queryRunner.rollbackTransaction();
                    }
                    catch (rollbackError) { }
                }
                throw err;
            }
            finally {
                // if query runner was created by us then release it
                if (!this.queryRunner)
                    yield queryRunner.release();
            }
        });
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Creates table "migrations" that will store information about executed migrations.
     */
    createMigrationsTableIfNotExist(queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            // If driver is mongo no need to create
            if (this.connection.driver instanceof MongoDriver) {
                return;
            }
            const tableExist = yield queryRunner.hasTable(this.migrationsTable); // todo: table name should be configurable
            if (!tableExist) {
                yield queryRunner.createTable(new Table({
                    name: this.migrationsTable,
                    columns: [
                        {
                            name: "id",
                            type: this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationId }),
                            isGenerated: true,
                            generationStrategy: "increment",
                            isPrimary: true,
                            isNullable: false
                        },
                        {
                            name: "timestamp",
                            type: this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationTimestamp }),
                            isPrimary: false,
                            isNullable: false
                        },
                        {
                            name: "name",
                            type: this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationName }),
                            isNullable: false
                        },
                    ]
                }));
            }
        });
    }
    /**
     * Loads all migrations that were executed and saved into the database (sorts by id).
     */
    loadExecutedMigrations(queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.connection.driver instanceof MongoDriver) {
                const mongoRunner = queryRunner;
                return yield mongoRunner.databaseConnection
                    .db(this.connection.driver.database)
                    .collection(this.migrationsTableName)
                    .find()
                    .sort({ "_id": -1 })
                    .toArray();
            }
            else {
                const migrationsRaw = yield this.connection.manager
                    .createQueryBuilder(queryRunner)
                    .select()
                    .orderBy(this.connection.driver.escape("id"), "DESC")
                    .from(this.migrationsTable, this.migrationsTableName)
                    .getRawMany();
                return migrationsRaw.map(migrationRaw => {
                    return new Migration(parseInt(migrationRaw["id"]), parseInt(migrationRaw["timestamp"]), migrationRaw["name"]);
                });
            }
        });
    }
    /**
     * Gets all migrations that setup for this connection.
     */
    getMigrations() {
        const migrations = this.connection.migrations.map(migration => {
            const migrationClassName = migration.name || migration.constructor.name;
            const migrationTimestamp = parseInt(migrationClassName.substr(-13), 10);
            if (!migrationTimestamp || isNaN(migrationTimestamp)) {
                throw new Error(`${migrationClassName} migration name is wrong. Migration class name should have a JavaScript timestamp appended.`);
            }
            return new Migration(undefined, migrationTimestamp, migrationClassName, migration);
        });
        this.checkForDuplicateMigrations(migrations);
        // sort them by timestamp
        return migrations.sort((a, b) => a.timestamp - b.timestamp);
    }
    checkForDuplicateMigrations(migrations) {
        const migrationNames = migrations.map(migration => migration.name);
        const duplicates = Array.from(new Set(migrationNames.filter((migrationName, index) => migrationNames.indexOf(migrationName) < index)));
        if (duplicates.length > 0) {
            throw Error(`Duplicate migrations: ${duplicates.join(", ")}`);
        }
    }
    /**
     * Finds the latest migration (sorts by timestamp) in the given array of migrations.
     */
    getLatestTimestampMigration(migrations) {
        const sortedMigrations = migrations.map(migration => migration).sort((a, b) => (a.timestamp - b.timestamp) * -1);
        return sortedMigrations.length > 0 ? sortedMigrations[0] : undefined;
    }
    /**
     * Finds the latest migration in the given array of migrations.
     * PRE: Migration array must be sorted by descending id.
     */
    getLatestExecutedMigration(sortedMigrations) {
        return sortedMigrations.length > 0 ? sortedMigrations[0] : undefined;
    }
    /**
     * Inserts new executed migration's data into migrations table.
     */
    insertExecutedMigration(queryRunner, migration) {
        return __awaiter(this, void 0, void 0, function* () {
            const values = {};
            if (this.connection.driver instanceof SqlServerDriver) {
                values["timestamp"] = new MssqlParameter(migration.timestamp, this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationTimestamp }));
                values["name"] = new MssqlParameter(migration.name, this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationName }));
            }
            else {
                values["timestamp"] = migration.timestamp;
                values["name"] = migration.name;
            }
            if (this.connection.driver instanceof MongoDriver) {
                const mongoRunner = queryRunner;
                yield mongoRunner.databaseConnection.db(this.connection.driver.database).collection(this.migrationsTableName).insert(values);
            }
            else {
                const qb = queryRunner.manager.createQueryBuilder();
                yield qb.insert()
                    .into(this.migrationsTable)
                    .values(values)
                    .execute();
            }
        });
    }
    /**
     * Delete previously executed migration's data from the migrations table.
     */
    deleteExecutedMigration(queryRunner, migration) {
        return __awaiter(this, void 0, void 0, function* () {
            const conditions = {};
            if (this.connection.driver instanceof SqlServerDriver) {
                conditions["timestamp"] = new MssqlParameter(migration.timestamp, this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationTimestamp }));
                conditions["name"] = new MssqlParameter(migration.name, this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationName }));
            }
            else {
                conditions["timestamp"] = migration.timestamp;
                conditions["name"] = migration.name;
            }
            if (this.connection.driver instanceof MongoDriver) {
                const mongoRunner = queryRunner;
                yield mongoRunner.databaseConnection.db(this.connection.driver.database).collection(this.migrationsTableName).deleteOne(conditions);
            }
            else {
                const qb = queryRunner.manager.createQueryBuilder();
                yield qb.delete()
                    .from(this.migrationsTable)
                    .where(`${qb.escape("timestamp")} = :timestamp`)
                    .andWhere(`${qb.escape("name")} = :name`)
                    .setParameters(conditions)
                    .execute();
            }
        });
    }
    withQueryRunner(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryRunner = this.queryRunner || this.connection.createQueryRunner();
            try {
                return callback(queryRunner);
            }
            finally {
                if (!this.queryRunner) {
                    yield queryRunner.release();
                }
            }
        });
    }
}

//# sourceMappingURL=MigrationExecutor.js.map
