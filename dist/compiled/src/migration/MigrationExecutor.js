"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Table_1 = require("../schema-builder/table/Table");
var Migration_1 = require("./Migration");
var PromiseUtils_1 = require("../util/PromiseUtils");
var SqlServerDriver_1 = require("../driver/sqlserver/SqlServerDriver");
var MssqlParameter_1 = require("../driver/sqlserver/MssqlParameter");
var MongoDriver_1 = require("../driver/mongodb/MongoDriver");
/**
 * Executes migrations: runs pending and reverts previously executed migrations.
 */
var MigrationExecutor = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function MigrationExecutor(connection, queryRunner) {
        this.connection = connection;
        this.queryRunner = queryRunner;
        // -------------------------------------------------------------------------
        // Public Properties
        // -------------------------------------------------------------------------
        /**
         * Indicates if migrations must be executed in a transaction.
         */
        this.transaction = true;
        var options = this.connection.driver.options;
        this.migrationsTableName = connection.options.migrationsTableName || "migrations";
        this.migrationsTable = this.connection.driver.buildTableName(this.migrationsTableName, options.schema, options.database);
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Lists all migrations and whether they have been executed or not
     * returns true if there are unapplied migrations
     */
    MigrationExecutor.prototype.showMigrations = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var e_1, _a, hasUnappliedMigrations, queryRunner, executedMigrations, allMigrations, _loop_1, this_1, allMigrations_1, allMigrations_1_1, migration;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        hasUnappliedMigrations = false;
                        queryRunner = this.queryRunner || this.connection.createQueryRunner("master");
                        // create migrations table if its not created yet
                        return [4 /*yield*/, this.createMigrationsTableIfNotExist(queryRunner)];
                    case 1:
                        // create migrations table if its not created yet
                        _b.sent();
                        return [4 /*yield*/, this.loadExecutedMigrations(queryRunner)];
                    case 2:
                        executedMigrations = _b.sent();
                        allMigrations = this.getMigrations();
                        _loop_1 = function (migration) {
                            var executedMigration = executedMigrations.find(function (executedMigration) { return executedMigration.name === migration.name; });
                            if (executedMigration) {
                                this_1.connection.logger.logSchemaBuild(" [X] " + migration.name);
                            }
                            else {
                                hasUnappliedMigrations = true;
                                this_1.connection.logger.logSchemaBuild(" [ ] " + migration.name);
                            }
                        };
                        this_1 = this;
                        try {
                            for (allMigrations_1 = tslib_1.__values(allMigrations), allMigrations_1_1 = allMigrations_1.next(); !allMigrations_1_1.done; allMigrations_1_1 = allMigrations_1.next()) {
                                migration = allMigrations_1_1.value;
                                _loop_1(migration);
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (allMigrations_1_1 && !allMigrations_1_1.done && (_a = allMigrations_1.return)) _a.call(allMigrations_1);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                        if (!!this.queryRunner) return [3 /*break*/, 4];
                        return [4 /*yield*/, queryRunner.release()];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4: return [2 /*return*/, hasUnappliedMigrations];
                }
            });
        });
    };
    /**
     * Executes all pending migrations. Pending migrations are migrations that are not yet executed,
     * thus not saved in the database.
     */
    MigrationExecutor.prototype.executePendingMigrations = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var queryRunner, executedMigrations, lastTimeExecutedMigration, allMigrations, successMigrations, pendingMigrations, transactionStartedByUs, err_1, rollbackError_1;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryRunner = this.queryRunner || this.connection.createQueryRunner("master");
                        // create migrations table if its not created yet
                        return [4 /*yield*/, this.createMigrationsTableIfNotExist(queryRunner)];
                    case 1:
                        // create migrations table if its not created yet
                        _a.sent();
                        return [4 /*yield*/, this.loadExecutedMigrations(queryRunner)];
                    case 2:
                        executedMigrations = _a.sent();
                        lastTimeExecutedMigration = this.getLatestTimestampMigration(executedMigrations);
                        allMigrations = this.getMigrations();
                        successMigrations = [];
                        pendingMigrations = allMigrations.filter(function (migration) {
                            // check if we already have executed migration
                            var executedMigration = executedMigrations.find(function (executedMigration) { return executedMigration.name === migration.name; });
                            if (executedMigration)
                                return false;
                            // migration is new and not executed. now check if its timestamp is correct
                            // if (lastTimeExecutedMigration && migration.timestamp < lastTimeExecutedMigration.timestamp)
                            //     throw new Error(`New migration found: ${migration.name}, however this migration's timestamp is not valid. Migration's timestamp should not be older then migrations already executed in the database.`);
                            // every check is passed means that migration was not run yet and we need to run it
                            return true;
                        });
                        if (!!pendingMigrations.length) return [3 /*break*/, 5];
                        this.connection.logger.logSchemaBuild("No migrations are pending");
                        if (!!this.queryRunner) return [3 /*break*/, 4];
                        return [4 /*yield*/, queryRunner.release()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/, []];
                    case 5:
                        // log information about migration execution
                        this.connection.logger.logSchemaBuild(executedMigrations.length + " migrations are already loaded in the database.");
                        this.connection.logger.logSchemaBuild(allMigrations.length + " migrations were found in the source code.");
                        if (lastTimeExecutedMigration)
                            this.connection.logger.logSchemaBuild(lastTimeExecutedMigration.name + " is the last executed migration. It was executed on " + new Date(lastTimeExecutedMigration.timestamp).toString() + ".");
                        this.connection.logger.logSchemaBuild(pendingMigrations.length + " migrations are new migrations that needs to be executed.");
                        transactionStartedByUs = false;
                        if (!(this.transaction && !queryRunner.isTransactionActive)) return [3 /*break*/, 7];
                        return [4 /*yield*/, queryRunner.startTransaction()];
                    case 6:
                        _a.sent();
                        transactionStartedByUs = true;
                        _a.label = 7;
                    case 7:
                        _a.trys.push([7, 11, 16, 19]);
                        return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(pendingMigrations, function (migration) {
                                return migration.instance.up(queryRunner)
                                    .then(function () {
                                    return _this.insertExecutedMigration(queryRunner, migration);
                                })
                                    .then(function () {
                                    successMigrations.push(migration);
                                    _this.connection.logger.logSchemaBuild("Migration " + migration.name + " has been executed successfully.");
                                });
                            })];
                    case 8:
                        _a.sent();
                        if (!transactionStartedByUs) return [3 /*break*/, 10];
                        return [4 /*yield*/, queryRunner.commitTransaction()];
                    case 9:
                        _a.sent();
                        _a.label = 10;
                    case 10: return [3 /*break*/, 19];
                    case 11:
                        err_1 = _a.sent();
                        if (!transactionStartedByUs) return [3 /*break*/, 15];
                        _a.label = 12;
                    case 12:
                        _a.trys.push([12, 14, , 15]);
                        return [4 /*yield*/, queryRunner.rollbackTransaction()];
                    case 13:
                        _a.sent();
                        return [3 /*break*/, 15];
                    case 14:
                        rollbackError_1 = _a.sent();
                        return [3 /*break*/, 15];
                    case 15: throw err_1;
                    case 16:
                        if (!!this.queryRunner) return [3 /*break*/, 18];
                        return [4 /*yield*/, queryRunner.release()];
                    case 17:
                        _a.sent();
                        _a.label = 18;
                    case 18: return [7 /*endfinally*/];
                    case 19: return [2 /*return*/, successMigrations];
                }
            });
        });
    };
    /**
     * Reverts last migration that were run.
     */
    MigrationExecutor.prototype.undoLastMigration = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var queryRunner, executedMigrations, lastTimeExecutedMigration, allMigrations, migrationToRevert, transactionStartedByUs, err_2, rollbackError_2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryRunner = this.queryRunner || this.connection.createQueryRunner("master");
                        // create migrations table if its not created yet
                        return [4 /*yield*/, this.createMigrationsTableIfNotExist(queryRunner)];
                    case 1:
                        // create migrations table if its not created yet
                        _a.sent();
                        return [4 /*yield*/, this.loadExecutedMigrations(queryRunner)];
                    case 2:
                        executedMigrations = _a.sent();
                        lastTimeExecutedMigration = this.getLatestExecutedMigration(executedMigrations);
                        // if no migrations found in the database then nothing to revert
                        if (!lastTimeExecutedMigration) {
                            this.connection.logger.logSchemaBuild("No migrations was found in the database. Nothing to revert!");
                            return [2 /*return*/];
                        }
                        allMigrations = this.getMigrations();
                        migrationToRevert = allMigrations.find(function (migration) { return migration.name === lastTimeExecutedMigration.name; });
                        // if no migrations found in the database then nothing to revert
                        if (!migrationToRevert)
                            throw new Error("No migration " + lastTimeExecutedMigration.name + " was found in the source code. Make sure you have this migration in your codebase and its included in the connection options.");
                        // log information about migration execution
                        this.connection.logger.logSchemaBuild(executedMigrations.length + " migrations are already loaded in the database.");
                        this.connection.logger.logSchemaBuild(lastTimeExecutedMigration.name + " is the last executed migration. It was executed on " + new Date(lastTimeExecutedMigration.timestamp).toString() + ".");
                        this.connection.logger.logSchemaBuild("Now reverting it...");
                        transactionStartedByUs = false;
                        if (!(this.transaction && !queryRunner.isTransactionActive)) return [3 /*break*/, 4];
                        return [4 /*yield*/, queryRunner.startTransaction()];
                    case 3:
                        _a.sent();
                        transactionStartedByUs = true;
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 9, 14, 17]);
                        return [4 /*yield*/, migrationToRevert.instance.down(queryRunner)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, this.deleteExecutedMigration(queryRunner, migrationToRevert)];
                    case 6:
                        _a.sent();
                        this.connection.logger.logSchemaBuild("Migration " + migrationToRevert.name + " has been reverted successfully.");
                        if (!transactionStartedByUs) return [3 /*break*/, 8];
                        return [4 /*yield*/, queryRunner.commitTransaction()];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8: return [3 /*break*/, 17];
                    case 9:
                        err_2 = _a.sent();
                        if (!transactionStartedByUs) return [3 /*break*/, 13];
                        _a.label = 10;
                    case 10:
                        _a.trys.push([10, 12, , 13]);
                        return [4 /*yield*/, queryRunner.rollbackTransaction()];
                    case 11:
                        _a.sent();
                        return [3 /*break*/, 13];
                    case 12:
                        rollbackError_2 = _a.sent();
                        return [3 /*break*/, 13];
                    case 13: throw err_2;
                    case 14:
                        if (!!this.queryRunner) return [3 /*break*/, 16];
                        return [4 /*yield*/, queryRunner.release()];
                    case 15:
                        _a.sent();
                        _a.label = 16;
                    case 16: return [7 /*endfinally*/];
                    case 17: return [2 /*return*/];
                }
            });
        });
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Creates table "migrations" that will store information about executed migrations.
     */
    MigrationExecutor.prototype.createMigrationsTableIfNotExist = function (queryRunner) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var tableExist;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // If driver is mongo no need to create
                        if (this.connection.driver instanceof MongoDriver_1.MongoDriver) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, queryRunner.hasTable(this.migrationsTable)];
                    case 1:
                        tableExist = _a.sent();
                        if (!!tableExist) return [3 /*break*/, 3];
                        return [4 /*yield*/, queryRunner.createTable(new Table_1.Table({
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
                            }))];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Loads all migrations that were executed and saved into the database.
     */
    MigrationExecutor.prototype.loadExecutedMigrations = function (queryRunner) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var mongoRunner, migrationsRaw;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.connection.driver instanceof MongoDriver_1.MongoDriver)) return [3 /*break*/, 2];
                        mongoRunner = queryRunner;
                        return [4 /*yield*/, mongoRunner.databaseConnection.db(this.connection.driver.database).collection(this.migrationsTableName).find().toArray()];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, this.connection.manager
                            .createQueryBuilder(queryRunner)
                            .select()
                            .from(this.migrationsTable, this.migrationsTableName)
                            .getRawMany()];
                    case 3:
                        migrationsRaw = _a.sent();
                        return [2 /*return*/, migrationsRaw.map(function (migrationRaw) {
                                return new Migration_1.Migration(parseInt(migrationRaw["id"]), parseInt(migrationRaw["timestamp"]), migrationRaw["name"]);
                            })];
                }
            });
        });
    };
    /**
     * Gets all migrations that setup for this connection.
     */
    MigrationExecutor.prototype.getMigrations = function () {
        var migrations = this.connection.migrations.map(function (migration) {
            var migrationClassName = migration.constructor.name;
            var migrationTimestamp = parseInt(migrationClassName.substr(-13));
            if (!migrationTimestamp)
                throw new Error(migrationClassName + " migration name is wrong. Migration class name should have a JavaScript timestamp appended.");
            return new Migration_1.Migration(undefined, migrationTimestamp, migrationClassName, migration);
        });
        // sort them by timestamp
        return migrations.sort(function (a, b) { return a.timestamp - b.timestamp; });
    };
    /**
     * Finds the latest migration (sorts by timestamp) in the given array of migrations.
     */
    MigrationExecutor.prototype.getLatestTimestampMigration = function (migrations) {
        var sortedMigrations = migrations.map(function (migration) { return migration; }).sort(function (a, b) { return (a.timestamp - b.timestamp) * -1; });
        return sortedMigrations.length > 0 ? sortedMigrations[0] : undefined;
    };
    /**
     * Finds the latest migration (sorts by id) in the given array of migrations.
     */
    MigrationExecutor.prototype.getLatestExecutedMigration = function (migrations) {
        var sortedMigrations = migrations.map(function (migration) { return migration; }).sort(function (a, b) { return ((a.id || 0) - (b.id || 0)) * -1; });
        return sortedMigrations.length > 0 ? sortedMigrations[0] : undefined;
    };
    /**
     * Inserts new executed migration's data into migrations table.
     */
    MigrationExecutor.prototype.insertExecutedMigration = function (queryRunner, migration) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var values, mongoRunner, qb;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        values = {};
                        if (this.connection.driver instanceof SqlServerDriver_1.SqlServerDriver) {
                            values["timestamp"] = new MssqlParameter_1.MssqlParameter(migration.timestamp, this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationTimestamp }));
                            values["name"] = new MssqlParameter_1.MssqlParameter(migration.name, this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationName }));
                        }
                        else {
                            values["timestamp"] = migration.timestamp;
                            values["name"] = migration.name;
                        }
                        if (!(this.connection.driver instanceof MongoDriver_1.MongoDriver)) return [3 /*break*/, 1];
                        mongoRunner = queryRunner;
                        mongoRunner.databaseConnection.db(this.connection.driver.database).collection(this.migrationsTableName).insert(values);
                        return [3 /*break*/, 3];
                    case 1:
                        qb = queryRunner.manager.createQueryBuilder();
                        return [4 /*yield*/, qb.insert()
                                .into(this.migrationsTable)
                                .values(values)
                                .execute()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Delete previously executed migration's data from the migrations table.
     */
    MigrationExecutor.prototype.deleteExecutedMigration = function (queryRunner, migration) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var conditions, mongoRunner, qb;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        conditions = {};
                        if (this.connection.driver instanceof SqlServerDriver_1.SqlServerDriver) {
                            conditions["timestamp"] = new MssqlParameter_1.MssqlParameter(migration.timestamp, this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationTimestamp }));
                            conditions["name"] = new MssqlParameter_1.MssqlParameter(migration.name, this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.migrationName }));
                        }
                        else {
                            conditions["timestamp"] = migration.timestamp;
                            conditions["name"] = migration.name;
                        }
                        if (!(this.connection.driver instanceof MongoDriver_1.MongoDriver)) return [3 /*break*/, 1];
                        mongoRunner = queryRunner;
                        mongoRunner.databaseConnection.db(this.connection.driver.database).collection(this.migrationsTableName).deleteOne(conditions);
                        return [3 /*break*/, 3];
                    case 1:
                        qb = queryRunner.manager.createQueryBuilder();
                        return [4 /*yield*/, qb.delete()
                                .from(this.migrationsTable)
                                .where(qb.escape("timestamp") + " = :timestamp")
                                .andWhere(qb.escape("name") + " = :name")
                                .setParameters(conditions)
                                .execute()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return MigrationExecutor;
}());
exports.MigrationExecutor = MigrationExecutor;
//# sourceMappingURL=MigrationExecutor.js.map