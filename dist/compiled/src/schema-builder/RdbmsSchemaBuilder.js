"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var CockroachDriver_1 = require("../driver/cockroachdb/CockroachDriver");
var Table_1 = require("./table/Table");
var TableColumn_1 = require("./table/TableColumn");
var TableForeignKey_1 = require("./table/TableForeignKey");
var TableIndex_1 = require("./table/TableIndex");
var PromiseUtils_1 = require("../util/PromiseUtils");
var TableUtils_1 = require("./util/TableUtils");
var PostgresDriver_1 = require("../driver/postgres/PostgresDriver");
var MysqlDriver_1 = require("../driver/mysql/MysqlDriver");
var TableUnique_1 = require("./table/TableUnique");
var TableCheck_1 = require("./table/TableCheck");
var TableExclusion_1 = require("./table/TableExclusion");
var View_1 = require("./view/View");
var AuroraDataApiDriver_1 = require("../driver/aurora-data-api/AuroraDataApiDriver");
/**
 * Creates complete tables schemas in the database based on the entity metadatas.
 *
 * Steps how schema is being built:
 * 1. load list of all tables with complete column and keys information from the db
 * 2. drop all (old) foreign keys that exist in the table, but does not exist in the metadata
 * 3. create new tables that does not exist in the db, but exist in the metadata
 * 4. drop all columns exist (left old) in the db table, but does not exist in the metadata
 * 5. add columns from metadata which does not exist in the table
 * 6. update all exist columns which metadata has changed
 * 7. update primary keys - update old and create new primary key from changed columns
 * 8. create foreign keys which does not exist in the table yet
 * 9. create indices which are missing in db yet, and drops indices which exist in the db, but does not exist in the metadata anymore
 */
var RdbmsSchemaBuilder = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function RdbmsSchemaBuilder(connection) {
        this.connection = connection;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates complete schemas for the given entity metadatas.
     */
    RdbmsSchemaBuilder.prototype.build = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var tablePaths, error_1, rollbackError_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.queryRunner = this.connection.createQueryRunner("master");
                        if (!!(this.connection.driver instanceof CockroachDriver_1.CockroachDriver)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.queryRunner.startTransaction()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 12, 18, 20]);
                        tablePaths = this.entityToSyncMetadatas.map(function (metadata) { return metadata.tablePath; });
                        if (!(this.viewEntityToSyncMetadatas.length > 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.createTypeormMetadataTable()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [4 /*yield*/, this.queryRunner.getTables(tablePaths)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, this.queryRunner.getViews([])];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, this.executeSchemaSyncOperationsInProperOrder()];
                    case 7:
                        _a.sent();
                        if (!this.connection.queryResultCache) return [3 /*break*/, 9];
                        return [4 /*yield*/, this.connection.queryResultCache.synchronize(this.queryRunner)];
                    case 8:
                        _a.sent();
                        _a.label = 9;
                    case 9:
                        if (!!(this.connection.driver instanceof CockroachDriver_1.CockroachDriver)) return [3 /*break*/, 11];
                        return [4 /*yield*/, this.queryRunner.commitTransaction()];
                    case 10:
                        _a.sent();
                        _a.label = 11;
                    case 11: return [3 /*break*/, 20];
                    case 12:
                        error_1 = _a.sent();
                        _a.label = 13;
                    case 13:
                        _a.trys.push([13, 16, , 17]);
                        if (!!(this.connection.driver instanceof CockroachDriver_1.CockroachDriver)) return [3 /*break*/, 15];
                        return [4 /*yield*/, this.queryRunner.rollbackTransaction()];
                    case 14:
                        _a.sent();
                        _a.label = 15;
                    case 15: return [3 /*break*/, 17];
                    case 16:
                        rollbackError_1 = _a.sent();
                        return [3 /*break*/, 17];
                    case 17: throw error_1;
                    case 18: return [4 /*yield*/, this.queryRunner.release()];
                    case 19:
                        _a.sent();
                        return [7 /*endfinally*/];
                    case 20: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns sql queries to be executed by schema builder.
     */
    RdbmsSchemaBuilder.prototype.log = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var tablePaths;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.queryRunner = this.connection.createQueryRunner("master");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 9, 11]);
                        tablePaths = this.entityToSyncMetadatas.map(function (metadata) { return metadata.tablePath; });
                        if (!(this.viewEntityToSyncMetadatas.length > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.createTypeormMetadataTable()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.queryRunner.getTables(tablePaths)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, this.queryRunner.getViews([])];
                    case 5:
                        _a.sent();
                        this.queryRunner.enableSqlMemory();
                        return [4 /*yield*/, this.executeSchemaSyncOperationsInProperOrder()];
                    case 6:
                        _a.sent();
                        if (!this.connection.queryResultCache) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.connection.queryResultCache.synchronize(this.queryRunner)];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8: return [2 /*return*/, this.queryRunner.getMemorySql()];
                    case 9:
                        // its important to disable this mode despite the fact we are release query builder
                        // because there exist drivers which reuse same query runner. Also its important to disable
                        // sql memory after call of getMemorySql() method because last one flushes sql memory.
                        this.queryRunner.disableSqlMemory();
                        return [4 /*yield*/, this.queryRunner.release()];
                    case 10:
                        _a.sent();
                        return [7 /*endfinally*/];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    Object.defineProperty(RdbmsSchemaBuilder.prototype, "entityToSyncMetadatas", {
        // -------------------------------------------------------------------------
        // Protected Methods
        // -------------------------------------------------------------------------
        /**
         * Returns only entities that should be synced in the database.
         */
        get: function () {
            return this.connection.entityMetadatas.filter(function (metadata) { return metadata.synchronize && metadata.tableType !== "entity-child" && metadata.tableType !== "view"; });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RdbmsSchemaBuilder.prototype, "viewEntityToSyncMetadatas", {
        /**
         * Returns only entities that should be synced in the database.
         */
        get: function () {
            return this.connection.entityMetadatas.filter(function (metadata) { return metadata.tableType === "view" && metadata.synchronize; });
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Executes schema sync operations in a proper order.
     * Order of operations matter here.
     */
    RdbmsSchemaBuilder.prototype.executeSchemaSyncOperationsInProperOrder = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.dropOldViews()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.dropOldForeignKeys()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.dropOldIndices()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.dropOldChecks()];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, this.dropOldExclusions()];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, this.dropCompositeUniqueConstraints()];
                    case 6:
                        _a.sent();
                        // await this.renameTables();
                        return [4 /*yield*/, this.renameColumns()];
                    case 7:
                        // await this.renameTables();
                        _a.sent();
                        return [4 /*yield*/, this.createNewTables()];
                    case 8:
                        _a.sent();
                        return [4 /*yield*/, this.dropRemovedColumns()];
                    case 9:
                        _a.sent();
                        return [4 /*yield*/, this.addNewColumns()];
                    case 10:
                        _a.sent();
                        return [4 /*yield*/, this.updatePrimaryKeys()];
                    case 11:
                        _a.sent();
                        return [4 /*yield*/, this.updateExistColumns()];
                    case 12:
                        _a.sent();
                        return [4 /*yield*/, this.createNewIndices()];
                    case 13:
                        _a.sent();
                        return [4 /*yield*/, this.createNewChecks()];
                    case 14:
                        _a.sent();
                        return [4 /*yield*/, this.createNewExclusions()];
                    case 15:
                        _a.sent();
                        return [4 /*yield*/, this.createCompositeUniqueConstraints()];
                    case 16:
                        _a.sent();
                        return [4 /*yield*/, this.createForeignKeys()];
                    case 17:
                        _a.sent();
                        return [4 /*yield*/, this.createViews()];
                    case 18:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops all (old) foreign keys that exist in the tables, but do not exist in the entity metadata.
     */
    RdbmsSchemaBuilder.prototype.dropOldForeignKeys = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(this.entityToSyncMetadatas, function (metadata) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var table, tableForeignKeysToDrop;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        table = this.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/];
                                        tableForeignKeysToDrop = table.foreignKeys.filter(function (tableForeignKey) {
                                            var metadataFK = metadata.foreignKeys.find(function (metadataForeignKey) { return metadataForeignKey.name === tableForeignKey.name; });
                                            return !metadataFK
                                                || (metadataFK.onDelete && metadataFK.onDelete !== tableForeignKey.onDelete)
                                                || (metadataFK.onUpdate && metadataFK.onUpdate !== tableForeignKey.onUpdate);
                                        });
                                        if (tableForeignKeysToDrop.length === 0)
                                            return [2 /*return*/];
                                        this.connection.logger.logSchemaBuild("dropping old foreign keys of " + table.name + ": " + tableForeignKeysToDrop.map(function (dbForeignKey) { return dbForeignKey.name; }).join(", "));
                                        // drop foreign keys from the database
                                        return [4 /*yield*/, this.queryRunner.dropForeignKeys(table, tableForeignKeysToDrop)];
                                    case 1:
                                        // drop foreign keys from the database
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Rename tables
     */
    RdbmsSchemaBuilder.prototype.renameTables = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(this.entityToSyncMetadatas, function (metadata) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            return tslib_1.__generator(this, function (_a) {
                                return [2 /*return*/];
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Renames columns.
     * Works if only one column per table was changed.
     * Changes only column name. If something besides name was changed, these changes will be ignored.
     */
    RdbmsSchemaBuilder.prototype.renameColumns = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(this.entityToSyncMetadatas, function (metadata) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var table, renamedMetadataColumns, renamedTableColumns, renamedColumn;
                            var _this = this;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        table = this.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/];
                                        if (metadata.columns.length !== table.columns.length)
                                            return [2 /*return*/];
                                        renamedMetadataColumns = metadata.columns.filter(function (column) {
                                            return !table.columns.find(function (tableColumn) {
                                                return tableColumn.name === column.databaseName
                                                    && tableColumn.type === _this.connection.driver.normalizeType(column)
                                                    && tableColumn.isNullable === column.isNullable
                                                    && tableColumn.isUnique === _this.connection.driver.normalizeIsUnique(column);
                                            });
                                        });
                                        if (renamedMetadataColumns.length === 0 || renamedMetadataColumns.length > 1)
                                            return [2 /*return*/];
                                        renamedTableColumns = table.columns.filter(function (tableColumn) {
                                            return !metadata.columns.find(function (column) {
                                                return column.databaseName === tableColumn.name
                                                    && _this.connection.driver.normalizeType(column) === tableColumn.type
                                                    && column.isNullable === tableColumn.isNullable
                                                    && _this.connection.driver.normalizeIsUnique(column) === tableColumn.isUnique;
                                            });
                                        });
                                        if (renamedTableColumns.length === 0 || renamedTableColumns.length > 1)
                                            return [2 /*return*/];
                                        renamedColumn = renamedTableColumns[0].clone();
                                        renamedColumn.name = renamedMetadataColumns[0].databaseName;
                                        this.connection.logger.logSchemaBuild("renaming column \"" + renamedTableColumns[0].name + "\" in to \"" + renamedColumn.name + "\"");
                                        return [4 /*yield*/, this.queryRunner.renameColumn(table, renamedTableColumns[0], renamedColumn)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    RdbmsSchemaBuilder.prototype.dropOldIndices = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(this.entityToSyncMetadatas, function (metadata) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var table, dropQueries;
                            var _this = this;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        table = this.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/];
                                        dropQueries = table.indices
                                            .filter(function (tableIndex) {
                                            var indexMetadata = metadata.indices.find(function (index) { return index.name === tableIndex.name; });
                                            if (indexMetadata) {
                                                if (indexMetadata.synchronize === false)
                                                    return false;
                                                if (indexMetadata.isUnique !== tableIndex.isUnique)
                                                    return true;
                                                if (indexMetadata.isSpatial !== tableIndex.isSpatial)
                                                    return true;
                                                if (indexMetadata.isFulltext !== tableIndex.isFulltext)
                                                    return true;
                                                if (indexMetadata.columns.length !== tableIndex.columnNames.length)
                                                    return true;
                                                return !indexMetadata.columns.every(function (column) { return tableIndex.columnNames.indexOf(column.databaseName) !== -1; });
                                            }
                                            return true;
                                        })
                                            .map(function (tableIndex) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                            return tslib_1.__generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        this.connection.logger.logSchemaBuild("dropping an index: \"" + tableIndex.name + "\" from table " + table.name);
                                                        return [4 /*yield*/, this.queryRunner.dropIndex(table, tableIndex)];
                                                    case 1:
                                                        _a.sent();
                                                        return [2 /*return*/];
                                                }
                                            });
                                        }); });
                                        return [4 /*yield*/, Promise.all(dropQueries)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    RdbmsSchemaBuilder.prototype.dropOldChecks = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Mysql does not support check constraints
                        if (this.connection.driver instanceof MysqlDriver_1.MysqlDriver || this.connection.driver instanceof AuroraDataApiDriver_1.AuroraDataApiDriver)
                            return [2 /*return*/];
                        return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(this.entityToSyncMetadatas, function (metadata) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                var table, oldChecks;
                                return tslib_1.__generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            table = this.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                            if (!table)
                                                return [2 /*return*/];
                                            oldChecks = table.checks.filter(function (tableCheck) {
                                                return !metadata.checks.find(function (checkMetadata) { return checkMetadata.name === tableCheck.name; });
                                            });
                                            if (oldChecks.length === 0)
                                                return [2 /*return*/];
                                            this.connection.logger.logSchemaBuild("dropping old check constraint: " + oldChecks.map(function (check) { return "\"" + check.name + "\""; }).join(", ") + " from table \"" + table.name + "\"");
                                            return [4 /*yield*/, this.queryRunner.dropCheckConstraints(table, oldChecks)];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    RdbmsSchemaBuilder.prototype.dropCompositeUniqueConstraints = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(this.entityToSyncMetadatas, function (metadata) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var table, compositeUniques;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        table = this.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/];
                                        compositeUniques = table.uniques.filter(function (tableUnique) {
                                            return tableUnique.columnNames.length > 1 && !metadata.uniques.find(function (uniqueMetadata) { return uniqueMetadata.name === tableUnique.name; });
                                        });
                                        if (compositeUniques.length === 0)
                                            return [2 /*return*/];
                                        this.connection.logger.logSchemaBuild("dropping old unique constraint: " + compositeUniques.map(function (unique) { return "\"" + unique.name + "\""; }).join(", ") + " from table \"" + table.name + "\"");
                                        return [4 /*yield*/, this.queryRunner.dropUniqueConstraints(table, compositeUniques)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    RdbmsSchemaBuilder.prototype.dropOldExclusions = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Only PostgreSQL supports exclusion constraints
                        if (!(this.connection.driver instanceof PostgresDriver_1.PostgresDriver))
                            return [2 /*return*/];
                        return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(this.entityToSyncMetadatas, function (metadata) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                var table, oldExclusions;
                                return tslib_1.__generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            table = this.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                            if (!table)
                                                return [2 /*return*/];
                                            oldExclusions = table.exclusions.filter(function (tableExclusion) {
                                                return !metadata.exclusions.find(function (exclusionMetadata) { return exclusionMetadata.name === tableExclusion.name; });
                                            });
                                            if (oldExclusions.length === 0)
                                                return [2 /*return*/];
                                            this.connection.logger.logSchemaBuild("dropping old exclusion constraint: " + oldExclusions.map(function (exclusion) { return "\"" + exclusion.name + "\""; }).join(", ") + " from table \"" + table.name + "\"");
                                            return [4 /*yield*/, this.queryRunner.dropExclusionConstraints(table, oldExclusions)];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates tables that do not exist in the database yet.
     * New tables are created without foreign and primary keys.
     * Primary key only can be created in conclusion with auto generated column.
     */
    RdbmsSchemaBuilder.prototype.createNewTables = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(this.entityToSyncMetadatas, function (metadata) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var existTable, table;
                            var _this = this;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        existTable = this.queryRunner.loadedTables.find(function (table) {
                                            var database = metadata.database && metadata.database !== _this.connection.driver.database ? metadata.database : undefined;
                                            var schema = metadata.schema || _this.connection.driver.options.schema;
                                            var fullTableName = _this.connection.driver.buildTableName(metadata.tableName, schema, database);
                                            return table.name === fullTableName;
                                        });
                                        if (existTable)
                                            return [2 /*return*/];
                                        this.connection.logger.logSchemaBuild("creating a new table: " + metadata.tablePath);
                                        table = Table_1.Table.create(metadata, this.connection.driver);
                                        return [4 /*yield*/, this.queryRunner.createTable(table, false, false)];
                                    case 1:
                                        _a.sent();
                                        this.queryRunner.loadedTables.push(table);
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    RdbmsSchemaBuilder.prototype.createViews = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(this.viewEntityToSyncMetadatas, function (metadata) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var existView, view;
                            var _this = this;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        existView = this.queryRunner.loadedViews.find(function (view) {
                                            var database = metadata.database && metadata.database !== _this.connection.driver.database ? metadata.database : undefined;
                                            var schema = metadata.schema || _this.connection.driver.options.schema;
                                            var fullViewName = _this.connection.driver.buildTableName(metadata.tableName, schema, database);
                                            var viewExpression = typeof view.expression === "string" ? view.expression.trim() : view.expression(_this.connection).getQuery();
                                            var metadataExpression = typeof metadata.expression === "string" ? metadata.expression.trim() : metadata.expression(_this.connection).getQuery();
                                            return view.name === fullViewName && viewExpression === metadataExpression;
                                        });
                                        if (existView)
                                            return [2 /*return*/];
                                        this.connection.logger.logSchemaBuild("creating a new view: " + metadata.tablePath);
                                        view = View_1.View.create(metadata, this.connection.driver);
                                        return [4 /*yield*/, this.queryRunner.createView(view)];
                                    case 1:
                                        _a.sent();
                                        this.queryRunner.loadedViews.push(view);
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    RdbmsSchemaBuilder.prototype.dropOldViews = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(this.queryRunner.loadedViews, function (view) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var existViewMetadata;
                            var _this = this;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        existViewMetadata = this.viewEntityToSyncMetadatas.find(function (metadata) {
                                            var database = metadata.database && metadata.database !== _this.connection.driver.database ? metadata.database : undefined;
                                            var schema = metadata.schema || _this.connection.driver.options.schema;
                                            var fullViewName = _this.connection.driver.buildTableName(metadata.tableName, schema, database);
                                            var viewExpression = typeof view.expression === "string" ? view.expression.trim() : view.expression(_this.connection).getQuery();
                                            var metadataExpression = typeof metadata.expression === "string" ? metadata.expression.trim() : metadata.expression(_this.connection).getQuery();
                                            return view.name === fullViewName && viewExpression === metadataExpression;
                                        });
                                        if (existViewMetadata)
                                            return [2 /*return*/];
                                        this.connection.logger.logSchemaBuild("dropping an old view: " + view.name);
                                        // drop an old view
                                        return [4 /*yield*/, this.queryRunner.dropView(view)];
                                    case 1:
                                        // drop an old view
                                        _a.sent();
                                        this.queryRunner.loadedViews.splice(this.queryRunner.loadedViews.indexOf(view), 1);
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops all columns that exist in the table, but does not exist in the metadata (left old).
     * We drop their keys too, since it should be safe.
     */
    RdbmsSchemaBuilder.prototype.dropRemovedColumns = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(this.entityToSyncMetadatas, function (metadata) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var table, droppedTableColumns;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        table = this.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/];
                                        droppedTableColumns = table.columns.filter(function (tableColumn) {
                                            return !metadata.columns.find(function (columnMetadata) { return columnMetadata.databaseName === tableColumn.name; });
                                        });
                                        if (droppedTableColumns.length === 0)
                                            return [2 /*return*/];
                                        this.connection.logger.logSchemaBuild("columns dropped in " + table.name + ": " + droppedTableColumns.map(function (column) { return column.name; }).join(", "));
                                        // drop columns from the database
                                        return [4 /*yield*/, this.queryRunner.dropColumns(table, droppedTableColumns)];
                                    case 1:
                                        // drop columns from the database
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Adds columns from metadata which does not exist in the table.
     * Columns are created without keys.
     */
    RdbmsSchemaBuilder.prototype.addNewColumns = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(this.entityToSyncMetadatas, function (metadata) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var table, newColumnMetadatas, newTableColumnOptions, newTableColumns;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        table = this.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/];
                                        newColumnMetadatas = metadata.columns.filter(function (columnMetadata) {
                                            return !table.columns.find(function (tableColumn) { return tableColumn.name === columnMetadata.databaseName; });
                                        });
                                        if (newColumnMetadatas.length === 0)
                                            return [2 /*return*/];
                                        newTableColumnOptions = this.metadataColumnsToTableColumnOptions(newColumnMetadatas);
                                        newTableColumns = newTableColumnOptions.map(function (option) { return new TableColumn_1.TableColumn(option); });
                                        if (newTableColumns.length === 0)
                                            return [2 /*return*/];
                                        this.connection.logger.logSchemaBuild("new columns added: " + newColumnMetadatas.map(function (column) { return column.databaseName; }).join(", "));
                                        return [4 /*yield*/, this.queryRunner.addColumns(table, newTableColumns)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Updates composite primary keys.
     */
    RdbmsSchemaBuilder.prototype.updatePrimaryKeys = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(this.entityToSyncMetadatas, function (metadata) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var table, primaryMetadataColumns, primaryTableColumns, changedPrimaryColumns;
                            var _this = this;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        table = this.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/];
                                        primaryMetadataColumns = metadata.columns.filter(function (column) { return column.isPrimary; });
                                        primaryTableColumns = table.columns.filter(function (column) { return column.isPrimary; });
                                        if (!(primaryTableColumns.length !== primaryMetadataColumns.length && primaryMetadataColumns.length > 1)) return [3 /*break*/, 2];
                                        changedPrimaryColumns = primaryMetadataColumns.map(function (primaryMetadataColumn) {
                                            return new TableColumn_1.TableColumn(TableUtils_1.TableUtils.createTableColumnOptions(primaryMetadataColumn, _this.connection.driver));
                                        });
                                        return [4 /*yield*/, this.queryRunner.updatePrimaryKeys(table, changedPrimaryColumns)];
                                    case 1:
                                        _a.sent();
                                        _a.label = 2;
                                    case 2: return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update all exist columns which metadata has changed.
     * Still don't create keys. Also we don't touch foreign keys of the changed columns.
     */
    RdbmsSchemaBuilder.prototype.updateExistColumns = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(this.entityToSyncMetadatas, function (metadata) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var table, changedColumns, newAndOldTableColumns;
                            var _this = this;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        table = this.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/];
                                        changedColumns = this.connection.driver.findChangedColumns(table.columns, metadata.columns);
                                        if (changedColumns.length === 0)
                                            return [2 /*return*/];
                                        // drop all foreign keys that point to this column
                                        return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(changedColumns, function (changedColumn) { return _this.dropColumnReferencedForeignKeys(metadata.tablePath, changedColumn.databaseName); })];
                                    case 1:
                                        // drop all foreign keys that point to this column
                                        _a.sent();
                                        // drop all composite indices related to this column
                                        return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(changedColumns, function (changedColumn) { return _this.dropColumnCompositeIndices(metadata.tablePath, changedColumn.databaseName); })];
                                    case 2:
                                        // drop all composite indices related to this column
                                        _a.sent();
                                        if (!!(this.connection.driver instanceof MysqlDriver_1.MysqlDriver || this.connection.driver instanceof AuroraDataApiDriver_1.AuroraDataApiDriver)) return [3 /*break*/, 4];
                                        return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(changedColumns, function (changedColumn) { return _this.dropColumnCompositeUniques(metadata.tablePath, changedColumn.databaseName); })];
                                    case 3:
                                        _a.sent();
                                        _a.label = 4;
                                    case 4:
                                        newAndOldTableColumns = changedColumns.map(function (changedColumn) {
                                            var oldTableColumn = table.columns.find(function (column) { return column.name === changedColumn.databaseName; });
                                            var newTableColumnOptions = TableUtils_1.TableUtils.createTableColumnOptions(changedColumn, _this.connection.driver);
                                            var newTableColumn = new TableColumn_1.TableColumn(newTableColumnOptions);
                                            return {
                                                oldColumn: oldTableColumn,
                                                newColumn: newTableColumn
                                            };
                                        });
                                        if (newAndOldTableColumns.length === 0)
                                            return [2 /*return*/];
                                        this.connection.logger.logSchemaBuild("columns changed in \"" + table.name + "\". updating: " + changedColumns.map(function (column) { return column.databaseName; }).join(", "));
                                        return [4 /*yield*/, this.queryRunner.changeColumns(table, newAndOldTableColumns)];
                                    case 5:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates composite indices which are missing in db yet.
     */
    RdbmsSchemaBuilder.prototype.createNewIndices = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(this.entityToSyncMetadatas, function (metadata) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var table, newIndices;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        table = this.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/];
                                        newIndices = metadata.indices
                                            .filter(function (indexMetadata) { return !table.indices.find(function (tableIndex) { return tableIndex.name === indexMetadata.name; }) && indexMetadata.synchronize === true; })
                                            .map(function (indexMetadata) { return TableIndex_1.TableIndex.create(indexMetadata); });
                                        if (newIndices.length === 0)
                                            return [2 /*return*/];
                                        this.connection.logger.logSchemaBuild("adding new indices " + newIndices.map(function (index) { return "\"" + index.name + "\""; }).join(", ") + " in table \"" + table.name + "\"");
                                        return [4 /*yield*/, this.queryRunner.createIndices(table, newIndices)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    RdbmsSchemaBuilder.prototype.createNewChecks = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Mysql does not support check constraints
                        if (this.connection.driver instanceof MysqlDriver_1.MysqlDriver || this.connection.driver instanceof AuroraDataApiDriver_1.AuroraDataApiDriver)
                            return [2 /*return*/];
                        return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(this.entityToSyncMetadatas, function (metadata) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                var table, newChecks;
                                return tslib_1.__generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            table = this.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                            if (!table)
                                                return [2 /*return*/];
                                            newChecks = metadata.checks
                                                .filter(function (checkMetadata) { return !table.checks.find(function (tableCheck) { return tableCheck.name === checkMetadata.name; }); })
                                                .map(function (checkMetadata) { return TableCheck_1.TableCheck.create(checkMetadata); });
                                            if (newChecks.length === 0)
                                                return [2 /*return*/];
                                            this.connection.logger.logSchemaBuild("adding new check constraints: " + newChecks.map(function (index) { return "\"" + index.name + "\""; }).join(", ") + " in table \"" + table.name + "\"");
                                            return [4 /*yield*/, this.queryRunner.createCheckConstraints(table, newChecks)];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates composite uniques which are missing in db yet.
     */
    RdbmsSchemaBuilder.prototype.createCompositeUniqueConstraints = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(this.entityToSyncMetadatas, function (metadata) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var table, compositeUniques;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        table = this.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/];
                                        compositeUniques = metadata.uniques
                                            .filter(function (uniqueMetadata) { return uniqueMetadata.columns.length > 1 && !table.uniques.find(function (tableUnique) { return tableUnique.name === uniqueMetadata.name; }); })
                                            .map(function (uniqueMetadata) { return TableUnique_1.TableUnique.create(uniqueMetadata); });
                                        if (compositeUniques.length === 0)
                                            return [2 /*return*/];
                                        this.connection.logger.logSchemaBuild("adding new unique constraints: " + compositeUniques.map(function (unique) { return "\"" + unique.name + "\""; }).join(", ") + " in table \"" + table.name + "\"");
                                        return [4 /*yield*/, this.queryRunner.createUniqueConstraints(table, compositeUniques)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates exclusions which are missing in db yet.
     */
    RdbmsSchemaBuilder.prototype.createNewExclusions = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Only PostgreSQL supports exclusion constraints
                        if (!(this.connection.driver instanceof PostgresDriver_1.PostgresDriver))
                            return [2 /*return*/];
                        return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(this.entityToSyncMetadatas, function (metadata) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                var table, newExclusions;
                                return tslib_1.__generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            table = this.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                            if (!table)
                                                return [2 /*return*/];
                                            newExclusions = metadata.exclusions
                                                .filter(function (exclusionMetadata) { return !table.exclusions.find(function (tableExclusion) { return tableExclusion.name === exclusionMetadata.name; }); })
                                                .map(function (exclusionMetadata) { return TableExclusion_1.TableExclusion.create(exclusionMetadata); });
                                            if (newExclusions.length === 0)
                                                return [2 /*return*/];
                                            this.connection.logger.logSchemaBuild("adding new exclusion constraints: " + newExclusions.map(function (exclusion) { return "\"" + exclusion.name + "\""; }).join(", ") + " in table \"" + table.name + "\"");
                                            return [4 /*yield*/, this.queryRunner.createExclusionConstraints(table, newExclusions)];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates foreign keys which does not exist in the table yet.
     */
    RdbmsSchemaBuilder.prototype.createForeignKeys = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(this.entityToSyncMetadatas, function (metadata) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var table, newKeys, dbForeignKeys;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        table = this.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/];
                                        newKeys = metadata.foreignKeys.filter(function (foreignKey) {
                                            return !table.foreignKeys.find(function (dbForeignKey) { return dbForeignKey.name === foreignKey.name; });
                                        });
                                        if (newKeys.length === 0)
                                            return [2 /*return*/];
                                        dbForeignKeys = newKeys.map(function (foreignKeyMetadata) { return TableForeignKey_1.TableForeignKey.create(foreignKeyMetadata); });
                                        this.connection.logger.logSchemaBuild("creating a foreign keys: " + newKeys.map(function (key) { return key.name; }).join(", ") + " on table \"" + table.name + "\"");
                                        return [4 /*yield*/, this.queryRunner.createForeignKeys(table, dbForeignKeys)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops all foreign keys where given column of the given table is being used.
     */
    RdbmsSchemaBuilder.prototype.dropColumnReferencedForeignKeys = function (tablePath, columnName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, tablesWithFK, columnForeignKey, clonedTable;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        table = this.queryRunner.loadedTables.find(function (table) { return table.name === tablePath; });
                        if (!table)
                            return [2 /*return*/];
                        tablesWithFK = [];
                        columnForeignKey = table.foreignKeys.find(function (foreignKey) { return foreignKey.columnNames.indexOf(columnName) !== -1; });
                        if (columnForeignKey) {
                            clonedTable = table.clone();
                            clonedTable.foreignKeys = [columnForeignKey];
                            tablesWithFK.push(clonedTable);
                            table.removeForeignKey(columnForeignKey);
                        }
                        this.queryRunner.loadedTables.forEach(function (loadedTable) {
                            var dependForeignKeys = loadedTable.foreignKeys.filter(function (foreignKey) {
                                return foreignKey.referencedTableName === tablePath && foreignKey.referencedColumnNames.indexOf(columnName) !== -1;
                            });
                            if (dependForeignKeys.length > 0) {
                                var clonedTable = loadedTable.clone();
                                clonedTable.foreignKeys = dependForeignKeys;
                                tablesWithFK.push(clonedTable);
                                dependForeignKeys.forEach(function (dependForeignKey) { return loadedTable.removeForeignKey(dependForeignKey); });
                            }
                        });
                        if (!(tablesWithFK.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(tablesWithFK, function (tableWithFK) {
                                _this.connection.logger.logSchemaBuild("dropping related foreign keys of " + tableWithFK.name + ": " + tableWithFK.foreignKeys.map(function (foreignKey) { return foreignKey.name; }).join(", "));
                                return _this.queryRunner.dropForeignKeys(tableWithFK, tableWithFK.foreignKeys);
                            })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops all composite indices, related to given column.
     */
    RdbmsSchemaBuilder.prototype.dropColumnCompositeIndices = function (tablePath, columnName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, relatedIndices;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        table = this.queryRunner.loadedTables.find(function (table) { return table.name === tablePath; });
                        if (!table)
                            return [2 /*return*/];
                        relatedIndices = table.indices.filter(function (index) { return index.columnNames.length > 1 && index.columnNames.indexOf(columnName) !== -1; });
                        if (relatedIndices.length === 0)
                            return [2 /*return*/];
                        this.connection.logger.logSchemaBuild("dropping related indices of \"" + tablePath + "\".\"" + columnName + "\": " + relatedIndices.map(function (index) { return index.name; }).join(", "));
                        return [4 /*yield*/, this.queryRunner.dropIndices(table, relatedIndices)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops all composite uniques, related to given column.
     */
    RdbmsSchemaBuilder.prototype.dropColumnCompositeUniques = function (tablePath, columnName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, relatedUniques;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        table = this.queryRunner.loadedTables.find(function (table) { return table.name === tablePath; });
                        if (!table)
                            return [2 /*return*/];
                        relatedUniques = table.uniques.filter(function (unique) { return unique.columnNames.length > 1 && unique.columnNames.indexOf(columnName) !== -1; });
                        if (relatedUniques.length === 0)
                            return [2 /*return*/];
                        this.connection.logger.logSchemaBuild("dropping related unique constraints of \"" + tablePath + "\".\"" + columnName + "\": " + relatedUniques.map(function (unique) { return unique.name; }).join(", "));
                        return [4 /*yield*/, this.queryRunner.dropUniqueConstraints(table, relatedUniques)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates new columns from the given column metadatas.
     */
    RdbmsSchemaBuilder.prototype.metadataColumnsToTableColumnOptions = function (columns) {
        var _this = this;
        return columns.map(function (columnMetadata) { return TableUtils_1.TableUtils.createTableColumnOptions(columnMetadata, _this.connection.driver); });
    };
    /**
     * Creates typeorm service table for storing user defined Views.
     */
    RdbmsSchemaBuilder.prototype.createTypeormMetadataTable = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var options, typeormMetadataTable;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        options = this.connection.driver.options;
                        typeormMetadataTable = this.connection.driver.buildTableName("typeorm_metadata", options.schema, options.database);
                        return [4 /*yield*/, this.queryRunner.createTable(new Table_1.Table({
                                name: typeormMetadataTable,
                                columns: [
                                    {
                                        name: "type",
                                        type: this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.metadataType }),
                                        isNullable: false
                                    },
                                    {
                                        name: "database",
                                        type: this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.metadataDatabase }),
                                        isNullable: true
                                    },
                                    {
                                        name: "schema",
                                        type: this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.metadataSchema }),
                                        isNullable: true
                                    },
                                    {
                                        name: "table",
                                        type: this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.metadataTable }),
                                        isNullable: true
                                    },
                                    {
                                        name: "name",
                                        type: this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.metadataName }),
                                        isNullable: true
                                    },
                                    {
                                        name: "value",
                                        type: this.connection.driver.normalizeType({ type: this.connection.driver.mappedDataTypes.metadataValue }),
                                        isNullable: true
                                    },
                                ]
                            }), true)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return RdbmsSchemaBuilder;
}());
exports.RdbmsSchemaBuilder = RdbmsSchemaBuilder;
//# sourceMappingURL=RdbmsSchemaBuilder.js.map