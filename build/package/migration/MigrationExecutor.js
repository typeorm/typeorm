"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationExecutor = void 0;
var tslib_1 = require("tslib");
var Table_1 = require("../schema-builder/table/Table");
var Migration_1 = require("./Migration");
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
         * Indicates how migrations should be run in transactions.
         *   all: all migrations are run in a single transaction
         *   none: all migrations are run without a transaction
         *   each: each migration is run in a separate transaction
         */
        this.transaction = "all";
        var options = this.connection.driver.options;
        this.migrationsTableName = connection.options.migrationsTableName || "migrations";
        this.migrationsTable = this.connection.driver.buildTableName(this.migrationsTableName, options.schema, options.database);
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Tries to execute a single migration given.
     */
    MigrationExecutor.prototype.executeMigration = function (migration) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, this.withQueryRunner(function (queryRunner) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.createMigrationsTableIfNotExist(queryRunner)];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, migration.instance.up(queryRunner)];
                                case 2:
                                    _a.sent();
                                    return [4 /*yield*/, this.insertExecutedMigration(queryRunner, migration)];
                                case 3:
                                    _a.sent();
                                    return [2 /*return*/, migration];
                            }
                        });
                    }); })];
            });
        });
    };
    /**
     * Returns an array of all migrations.
     */
    MigrationExecutor.prototype.getAllMigrations = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, Promise.resolve(this.getMigrations())];
            });
        });
    };
    /**
     * Returns an array of all executed migrations.
     */
    MigrationExecutor.prototype.getExecutedMigrations = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, this.withQueryRunner(function (queryRunner) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.createMigrationsTableIfNotExist(queryRunner)];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, this.loadExecutedMigrations(queryRunner)];
                                case 2: return [2 /*return*/, _a.sent()];
                            }
                        });
                    }); })];
            });
        });
    };
    /**
     * Returns an array of all pending migrations.
     */
    MigrationExecutor.prototype.getPendingMigrations = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var allMigrations, executedMigrations;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getAllMigrations()];
                    case 1:
                        allMigrations = _a.sent();
                        return [4 /*yield*/, this.getExecutedMigrations()];
                    case 2:
                        executedMigrations = _a.sent();
                        return [2 /*return*/, allMigrations.filter(function (migration) {
                                return !executedMigrations.find(function (executedMigration) {
                                    return executedMigration.name === migration.name;
                                });
                            })];
                }
            });
        });
    };
    /**
     * Inserts an executed migration.
     */
    MigrationExecutor.prototype.insertMigration = function (migration) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.withQueryRunner(function (queryRunner) {
                _this.insertExecutedMigration(queryRunner, migration)
                    .then(resolve)
                    .catch(reject);
            });
        });
    };
    /**
     * Deletes an executed migration.
     */
    MigrationExecutor.prototype.deleteMigration = function (migration) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.withQueryRunner(function (queryRunner) {
                _this.deleteExecutedMigration(queryRunner, migration)
                    .then(resolve)
                    .catch(reject);
            });
        });
    };
    /**
     * Lists all migrations and whether they have been executed or not
     * returns true if there are unapplied migrations
     */
    MigrationExecutor.prototype.showMigrations = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var hasUnappliedMigrations, queryRunner, executedMigrations, allMigrations, _loop_1, this_1, allMigrations_1, allMigrations_1_1, migration;
            var e_1, _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        hasUnappliedMigrations = false;
                        queryRunner = this.queryRunner || this.connection.createQueryRunner();
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
            var queryRunner, executedMigrations, lastTimeExecutedMigration, allMigrations, successMigrations, pendingMigrations, transactionStartedByUs, _loop_2, this_2, pendingMigrations_1, pendingMigrations_1_1, migration, e_2_1, err_1, rollbackError_1;
            var e_2, _a;
            var _this = this;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        queryRunner = this.queryRunner || this.connection.createQueryRunner();
                        // create migrations table if its not created yet
                        return [4 /*yield*/, this.createMigrationsTableIfNotExist(queryRunner)];
                    case 1:
                        // create migrations table if its not created yet
                        _b.sent();
                        return [4 /*yield*/, this.loadExecutedMigrations(queryRunner)];
                    case 2:
                        executedMigrations = _b.sent();
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
                        _b.sent();
                        _b.label = 4;
                    case 4: return [2 /*return*/, []];
                    case 5:
                        // log information about migration execution
                        this.connection.logger.logSchemaBuild(executedMigrations.length + " migrations are already loaded in the database.");
                        this.connection.logger.logSchemaBuild(allMigrations.length + " migrations were found in the source code.");
                        if (lastTimeExecutedMigration)
                            this.connection.logger.logSchemaBuild(lastTimeExecutedMigration.name + " is the last executed migration. It was executed on " + new Date(lastTimeExecutedMigration.timestamp).toString() + ".");
                        this.connection.logger.logSchemaBuild(pendingMigrations.length + " migrations are new migrations that needs to be executed.");
                        transactionStartedByUs = false;
                        if (!(this.transaction === "all" && !queryRunner.isTransactionActive)) return [3 /*break*/, 7];
                        return [4 /*yield*/, queryRunner.startTransaction()];
                    case 6:
                        _b.sent();
                        transactionStartedByUs = true;
                        _b.label = 7;
                    case 7:
                        _b.trys.push([7, 18, 23, 26]);
                        _loop_2 = function (migration) {
                            return tslib_1.__generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        if (!(this_2.transaction === "each" && !queryRunner.isTransactionActive)) return [3 /*break*/, 2];
                                        return [4 /*yield*/, queryRunner.startTransaction()];
                                    case 1:
                                        _c.sent();
                                        transactionStartedByUs = true;
                                        _c.label = 2;
                                    case 2: return [4 /*yield*/, migration.instance.up(queryRunner)
                                            .then(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                            return tslib_1.__generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: // now when migration is executed we need to insert record about it into the database
                                                    return [4 /*yield*/, this.insertExecutedMigration(queryRunner, migration)];
                                                    case 1:
                                                        _a.sent();
                                                        if (!(this.transaction === "each" && transactionStartedByUs)) return [3 /*break*/, 3];
                                                        return [4 /*yield*/, queryRunner.commitTransaction()];
                                                    case 2:
                                                        _a.sent();
                                                        _a.label = 3;
                                                    case 3: return [2 /*return*/];
                                                }
                                            });
                                        }); })
                                            .then(function () {
                                            successMigrations.push(migration);
                                            _this.connection.logger.logSchemaBuild("Migration " + migration.name + " has been executed successfully.");
                                        })];
                                    case 3:
                                        _c.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_2 = this;
                        _b.label = 8;
                    case 8:
                        _b.trys.push([8, 13, 14, 15]);
                        pendingMigrations_1 = tslib_1.__values(pendingMigrations), pendingMigrations_1_1 = pendingMigrations_1.next();
                        _b.label = 9;
                    case 9:
                        if (!!pendingMigrations_1_1.done) return [3 /*break*/, 12];
                        migration = pendingMigrations_1_1.value;
                        return [5 /*yield**/, _loop_2(migration)];
                    case 10:
                        _b.sent();
                        _b.label = 11;
                    case 11:
                        pendingMigrations_1_1 = pendingMigrations_1.next();
                        return [3 /*break*/, 9];
                    case 12: return [3 /*break*/, 15];
                    case 13:
                        e_2_1 = _b.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 15];
                    case 14:
                        try {
                            if (pendingMigrations_1_1 && !pendingMigrations_1_1.done && (_a = pendingMigrations_1.return)) _a.call(pendingMigrations_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                        return [7 /*endfinally*/];
                    case 15:
                        if (!(this.transaction === "all" && transactionStartedByUs)) return [3 /*break*/, 17];
                        return [4 /*yield*/, queryRunner.commitTransaction()];
                    case 16:
                        _b.sent();
                        _b.label = 17;
                    case 17: return [3 /*break*/, 26];
                    case 18:
                        err_1 = _b.sent();
                        if (!transactionStartedByUs) return [3 /*break*/, 22];
                        _b.label = 19;
                    case 19:
                        _b.trys.push([19, 21, , 22]);
                        return [4 /*yield*/, queryRunner.rollbackTransaction()];
                    case 20:
                        _b.sent();
                        return [3 /*break*/, 22];
                    case 21:
                        rollbackError_1 = _b.sent();
                        return [3 /*break*/, 22];
                    case 22: throw err_1;
                    case 23:
                        if (!!this.queryRunner) return [3 /*break*/, 25];
                        return [4 /*yield*/, queryRunner.release()];
                    case 24:
                        _b.sent();
                        _b.label = 25;
                    case 25: return [7 /*endfinally*/];
                    case 26: return [2 /*return*/, successMigrations];
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
                        queryRunner = this.queryRunner || this.connection.createQueryRunner();
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
                        if (!((this.transaction !== "none") && !queryRunner.isTransactionActive)) return [3 /*break*/, 4];
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
     * Loads all migrations that were executed and saved into the database (sorts by id).
     */
    MigrationExecutor.prototype.loadExecutedMigrations = function (queryRunner) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var mongoRunner, migrationsRaw;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.connection.driver instanceof MongoDriver_1.MongoDriver)) return [3 /*break*/, 2];
                        mongoRunner = queryRunner;
                        return [4 /*yield*/, mongoRunner.databaseConnection
                                .db(this.connection.driver.database)
                                .collection(this.migrationsTableName)
                                .find()
                                .sort({ "_id": -1 })
                                .toArray()];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, this.connection.manager
                            .createQueryBuilder(queryRunner)
                            .select()
                            .orderBy(this.connection.driver.escape("id"), "DESC")
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
            var migrationClassName = migration.name || migration.constructor.name;
            var migrationTimestamp = parseInt(migrationClassName.substr(-13), 10);
            if (!migrationTimestamp || isNaN(migrationTimestamp)) {
                throw new Error(migrationClassName + " migration name is wrong. Migration class name should have a JavaScript timestamp appended.");
            }
            return new Migration_1.Migration(undefined, migrationTimestamp, migrationClassName, migration);
        });
        this.checkForDuplicateMigrations(migrations);
        // sort them by timestamp
        return migrations.sort(function (a, b) { return a.timestamp - b.timestamp; });
    };
    MigrationExecutor.prototype.checkForDuplicateMigrations = function (migrations) {
        var migrationNames = migrations.map(function (migration) { return migration.name; });
        var duplicates = Array.from(new Set(migrationNames.filter(function (migrationName, index) { return migrationNames.indexOf(migrationName) < index; })));
        if (duplicates.length > 0) {
            throw Error("Duplicate migrations: " + duplicates.join(", "));
        }
    };
    /**
     * Finds the latest migration (sorts by timestamp) in the given array of migrations.
     */
    MigrationExecutor.prototype.getLatestTimestampMigration = function (migrations) {
        var sortedMigrations = migrations.map(function (migration) { return migration; }).sort(function (a, b) { return (a.timestamp - b.timestamp) * -1; });
        return sortedMigrations.length > 0 ? sortedMigrations[0] : undefined;
    };
    /**
     * Finds the latest migration in the given array of migrations.
     * PRE: Migration array must be sorted by descending id.
     */
    MigrationExecutor.prototype.getLatestExecutedMigration = function (sortedMigrations) {
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
                        if (!(this.connection.driver instanceof MongoDriver_1.MongoDriver)) return [3 /*break*/, 2];
                        mongoRunner = queryRunner;
                        return [4 /*yield*/, mongoRunner.databaseConnection.db(this.connection.driver.database).collection(this.migrationsTableName).insert(values)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2:
                        qb = queryRunner.manager.createQueryBuilder();
                        return [4 /*yield*/, qb.insert()
                                .into(this.migrationsTable)
                                .values(values)
                                .execute()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
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
                        if (!(this.connection.driver instanceof MongoDriver_1.MongoDriver)) return [3 /*break*/, 2];
                        mongoRunner = queryRunner;
                        return [4 /*yield*/, mongoRunner.databaseConnection.db(this.connection.driver.database).collection(this.migrationsTableName).deleteOne(conditions)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2:
                        qb = queryRunner.manager.createQueryBuilder();
                        return [4 /*yield*/, qb.delete()
                                .from(this.migrationsTable)
                                .where(qb.escape("timestamp") + " = :timestamp")
                                .andWhere(qb.escape("name") + " = :name")
                                .setParameters(conditions)
                                .execute()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    MigrationExecutor.prototype.withQueryRunner = function (callback) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var queryRunner;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryRunner = this.queryRunner || this.connection.createQueryRunner();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 2, 5]);
                        return [2 /*return*/, callback(queryRunner)];
                    case 2:
                        if (!!this.queryRunner) return [3 /*break*/, 4];
                        return [4 /*yield*/, queryRunner.release()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return MigrationExecutor;
}());
exports.MigrationExecutor = MigrationExecutor;

//# sourceMappingURL=MigrationExecutor.js.map
