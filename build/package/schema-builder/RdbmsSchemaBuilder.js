"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RdbmsSchemaBuilder = void 0;
var tslib_1 = require("tslib");
var CockroachDriver_1 = require("../driver/cockroachdb/CockroachDriver");
var Table_1 = require("./table/Table");
var TableColumn_1 = require("./table/TableColumn");
var TableForeignKey_1 = require("./table/TableForeignKey");
var TableIndex_1 = require("./table/TableIndex");
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
                        this.queryRunner = this.connection.createQueryRunner();
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
                        this.queryRunner = this.connection.createQueryRunner();
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
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(RdbmsSchemaBuilder.prototype, "viewEntityToSyncMetadatas", {
        /**
         * Returns only entities that should be synced in the database.
         */
        get: function () {
            return this.connection.entityMetadatas.filter(function (metadata) { return metadata.tableType === "view" && metadata.synchronize; });
        },
        enumerable: false,
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
            var _loop_1, this_1, _a, _b, metadata, e_1_1;
            var e_1, _c;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _loop_1 = function (metadata) {
                            var table, tableForeignKeysToDrop;
                            return tslib_1.__generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        table = this_1.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/, "continue"];
                                        tableForeignKeysToDrop = table.foreignKeys.filter(function (tableForeignKey) {
                                            var metadataFK = metadata.foreignKeys.find(function (metadataForeignKey) { return foreignKeysMatch(tableForeignKey, metadataForeignKey); });
                                            return !metadataFK
                                                || (metadataFK.onDelete && metadataFK.onDelete !== tableForeignKey.onDelete)
                                                || (metadataFK.onUpdate && metadataFK.onUpdate !== tableForeignKey.onUpdate);
                                        });
                                        if (tableForeignKeysToDrop.length === 0)
                                            return [2 /*return*/, "continue"];
                                        this_1.connection.logger.logSchemaBuild("dropping old foreign keys of " + table.name + ": " + tableForeignKeysToDrop.map(function (dbForeignKey) { return dbForeignKey.name; }).join(", "));
                                        // drop foreign keys from the database
                                        return [4 /*yield*/, this_1.queryRunner.dropForeignKeys(table, tableForeignKeysToDrop)];
                                    case 1:
                                        // drop foreign keys from the database
                                        _e.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        _a = tslib_1.__values(this.entityToSyncMetadatas), _b = _a.next();
                        _d.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 5];
                        metadata = _b.value;
                        return [5 /*yield**/, _loop_1(metadata)];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_1_1 = _d.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Rename tables
     */
    RdbmsSchemaBuilder.prototype.renameTables = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/];
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
            var _loop_2, this_2, _a, _b, metadata, e_2_1;
            var e_2, _c;
            var _this = this;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _loop_2 = function (metadata) {
                            var table, renamedMetadataColumns, renamedTableColumns, renamedColumn;
                            return tslib_1.__generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        table = this_2.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/, "continue"];
                                        if (metadata.columns.length !== table.columns.length)
                                            return [2 /*return*/, "continue"];
                                        renamedMetadataColumns = metadata.columns.filter(function (column) {
                                            return !table.columns.find(function (tableColumn) {
                                                return tableColumn.name === column.databaseName
                                                    && tableColumn.type === _this.connection.driver.normalizeType(column)
                                                    && tableColumn.isNullable === column.isNullable
                                                    && tableColumn.isUnique === _this.connection.driver.normalizeIsUnique(column);
                                            });
                                        });
                                        if (renamedMetadataColumns.length === 0 || renamedMetadataColumns.length > 1)
                                            return [2 /*return*/, "continue"];
                                        renamedTableColumns = table.columns.filter(function (tableColumn) {
                                            return !metadata.columns.find(function (column) {
                                                return column.databaseName === tableColumn.name
                                                    && _this.connection.driver.normalizeType(column) === tableColumn.type
                                                    && column.isNullable === tableColumn.isNullable
                                                    && _this.connection.driver.normalizeIsUnique(column) === tableColumn.isUnique;
                                            });
                                        });
                                        if (renamedTableColumns.length === 0 || renamedTableColumns.length > 1)
                                            return [2 /*return*/, "continue"];
                                        renamedColumn = renamedTableColumns[0].clone();
                                        renamedColumn.name = renamedMetadataColumns[0].databaseName;
                                        this_2.connection.logger.logSchemaBuild("renaming column \"" + renamedTableColumns[0].name + "\" in to \"" + renamedColumn.name + "\"");
                                        return [4 /*yield*/, this_2.queryRunner.renameColumn(table, renamedTableColumns[0], renamedColumn)];
                                    case 1:
                                        _e.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_2 = this;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        _a = tslib_1.__values(this.entityToSyncMetadatas), _b = _a.next();
                        _d.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 5];
                        metadata = _b.value;
                        return [5 /*yield**/, _loop_2(metadata)];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_2_1 = _d.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_2) throw e_2.error; }
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    RdbmsSchemaBuilder.prototype.dropOldIndices = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _loop_3, this_3, _a, _b, metadata, e_3_1;
            var e_3, _c;
            var _this = this;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _loop_3 = function (metadata) {
                            var table, dropQueries;
                            return tslib_1.__generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        table = this_3.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/, "continue"];
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
                                                if (_this.connection.driver.isFullTextColumnTypeSupported() && indexMetadata.isFulltext !== tableIndex.isFulltext)
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
                                        _e.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_3 = this;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        _a = tslib_1.__values(this.entityToSyncMetadatas), _b = _a.next();
                        _d.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 5];
                        metadata = _b.value;
                        return [5 /*yield**/, _loop_3(metadata)];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_3_1 = _d.sent();
                        e_3 = { error: e_3_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_3) throw e_3.error; }
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    RdbmsSchemaBuilder.prototype.dropOldChecks = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _loop_4, this_4, _a, _b, metadata, e_4_1;
            var e_4, _c;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        // Mysql does not support check constraints
                        if (this.connection.driver instanceof MysqlDriver_1.MysqlDriver || this.connection.driver instanceof AuroraDataApiDriver_1.AuroraDataApiDriver)
                            return [2 /*return*/];
                        _loop_4 = function (metadata) {
                            var table, oldChecks;
                            return tslib_1.__generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        table = this_4.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/, "continue"];
                                        oldChecks = table.checks.filter(function (tableCheck) {
                                            return !metadata.checks.find(function (checkMetadata) { return checkMetadata.name === tableCheck.name; });
                                        });
                                        if (oldChecks.length === 0)
                                            return [2 /*return*/, "continue"];
                                        this_4.connection.logger.logSchemaBuild("dropping old check constraint: " + oldChecks.map(function (check) { return "\"" + check.name + "\""; }).join(", ") + " from table \"" + table.name + "\"");
                                        return [4 /*yield*/, this_4.queryRunner.dropCheckConstraints(table, oldChecks)];
                                    case 1:
                                        _e.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_4 = this;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        _a = tslib_1.__values(this.entityToSyncMetadatas), _b = _a.next();
                        _d.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 5];
                        metadata = _b.value;
                        return [5 /*yield**/, _loop_4(metadata)];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_4_1 = _d.sent();
                        e_4 = { error: e_4_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_4) throw e_4.error; }
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    RdbmsSchemaBuilder.prototype.dropCompositeUniqueConstraints = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _loop_5, this_5, _a, _b, metadata, e_5_1;
            var e_5, _c;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _loop_5 = function (metadata) {
                            var table, compositeUniques;
                            return tslib_1.__generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        table = this_5.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/, "continue"];
                                        compositeUniques = table.uniques.filter(function (tableUnique) {
                                            return tableUnique.columnNames.length > 1 && !metadata.uniques.find(function (uniqueMetadata) { return uniqueMetadata.name === tableUnique.name; });
                                        });
                                        if (compositeUniques.length === 0)
                                            return [2 /*return*/, "continue"];
                                        this_5.connection.logger.logSchemaBuild("dropping old unique constraint: " + compositeUniques.map(function (unique) { return "\"" + unique.name + "\""; }).join(", ") + " from table \"" + table.name + "\"");
                                        return [4 /*yield*/, this_5.queryRunner.dropUniqueConstraints(table, compositeUniques)];
                                    case 1:
                                        _e.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_5 = this;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        _a = tslib_1.__values(this.entityToSyncMetadatas), _b = _a.next();
                        _d.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 5];
                        metadata = _b.value;
                        return [5 /*yield**/, _loop_5(metadata)];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_5_1 = _d.sent();
                        e_5 = { error: e_5_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_5) throw e_5.error; }
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    RdbmsSchemaBuilder.prototype.dropOldExclusions = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _loop_6, this_6, _a, _b, metadata, e_6_1;
            var e_6, _c;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        // Only PostgreSQL supports exclusion constraints
                        if (!(this.connection.driver instanceof PostgresDriver_1.PostgresDriver))
                            return [2 /*return*/];
                        _loop_6 = function (metadata) {
                            var table, oldExclusions;
                            return tslib_1.__generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        table = this_6.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/, "continue"];
                                        oldExclusions = table.exclusions.filter(function (tableExclusion) {
                                            return !metadata.exclusions.find(function (exclusionMetadata) { return exclusionMetadata.name === tableExclusion.name; });
                                        });
                                        if (oldExclusions.length === 0)
                                            return [2 /*return*/, "continue"];
                                        this_6.connection.logger.logSchemaBuild("dropping old exclusion constraint: " + oldExclusions.map(function (exclusion) { return "\"" + exclusion.name + "\""; }).join(", ") + " from table \"" + table.name + "\"");
                                        return [4 /*yield*/, this_6.queryRunner.dropExclusionConstraints(table, oldExclusions)];
                                    case 1:
                                        _e.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_6 = this;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        _a = tslib_1.__values(this.entityToSyncMetadatas), _b = _a.next();
                        _d.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 5];
                        metadata = _b.value;
                        return [5 /*yield**/, _loop_6(metadata)];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_6_1 = _d.sent();
                        e_6 = { error: e_6_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_6) throw e_6.error; }
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
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
            var _loop_7, this_7, _a, _b, metadata, e_7_1;
            var e_7, _c;
            var _this = this;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _loop_7 = function (metadata) {
                            var existTable, table;
                            return tslib_1.__generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        existTable = this_7.queryRunner.loadedTables.find(function (table) {
                                            var database = metadata.database && metadata.database !== _this.connection.driver.database ? metadata.database : undefined;
                                            var schema = metadata.schema || _this.connection.driver.options.schema;
                                            var fullTableName = _this.connection.driver.buildTableName(metadata.tableName, schema, database);
                                            return table.name === fullTableName;
                                        });
                                        if (existTable)
                                            return [2 /*return*/, "continue"];
                                        this_7.connection.logger.logSchemaBuild("creating a new table: " + metadata.tablePath);
                                        table = Table_1.Table.create(metadata, this_7.connection.driver);
                                        return [4 /*yield*/, this_7.queryRunner.createTable(table, false, false)];
                                    case 1:
                                        _e.sent();
                                        this_7.queryRunner.loadedTables.push(table);
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_7 = this;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        _a = tslib_1.__values(this.entityToSyncMetadatas), _b = _a.next();
                        _d.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 5];
                        metadata = _b.value;
                        return [5 /*yield**/, _loop_7(metadata)];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_7_1 = _d.sent();
                        e_7 = { error: e_7_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_7) throw e_7.error; }
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    RdbmsSchemaBuilder.prototype.createViews = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _loop_8, this_8, _a, _b, metadata, e_8_1;
            var e_8, _c;
            var _this = this;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _loop_8 = function (metadata) {
                            var existView, view;
                            return tslib_1.__generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        existView = this_8.queryRunner.loadedViews.find(function (view) {
                                            var database = metadata.database && metadata.database !== _this.connection.driver.database ? metadata.database : undefined;
                                            var schema = metadata.schema || _this.connection.driver.options.schema;
                                            var fullViewName = _this.connection.driver.buildTableName(metadata.tableName, schema, database);
                                            var viewExpression = typeof view.expression === "string" ? view.expression.trim() : view.expression(_this.connection).getQuery();
                                            var metadataExpression = typeof metadata.expression === "string" ? metadata.expression.trim() : metadata.expression(_this.connection).getQuery();
                                            return view.name === fullViewName && viewExpression === metadataExpression;
                                        });
                                        if (existView)
                                            return [2 /*return*/, "continue"];
                                        this_8.connection.logger.logSchemaBuild("creating a new view: " + metadata.tablePath);
                                        view = View_1.View.create(metadata, this_8.connection.driver);
                                        return [4 /*yield*/, this_8.queryRunner.createView(view)];
                                    case 1:
                                        _e.sent();
                                        this_8.queryRunner.loadedViews.push(view);
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_8 = this;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        _a = tslib_1.__values(this.viewEntityToSyncMetadatas), _b = _a.next();
                        _d.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 5];
                        metadata = _b.value;
                        return [5 /*yield**/, _loop_8(metadata)];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_8_1 = _d.sent();
                        e_8 = { error: e_8_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_8) throw e_8.error; }
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    RdbmsSchemaBuilder.prototype.dropOldViews = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _loop_9, this_9, _a, _b, view, e_9_1;
            var e_9, _c;
            var _this = this;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _loop_9 = function (view) {
                            var existViewMetadata;
                            return tslib_1.__generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        existViewMetadata = this_9.viewEntityToSyncMetadatas.find(function (metadata) {
                                            var database = metadata.database && metadata.database !== _this.connection.driver.database ? metadata.database : undefined;
                                            var schema = metadata.schema || _this.connection.driver.options.schema;
                                            var fullViewName = _this.connection.driver.buildTableName(metadata.tableName, schema, database);
                                            var viewExpression = typeof view.expression === "string" ? view.expression.trim() : view.expression(_this.connection).getQuery();
                                            var metadataExpression = typeof metadata.expression === "string" ? metadata.expression.trim() : metadata.expression(_this.connection).getQuery();
                                            return view.name === fullViewName && viewExpression === metadataExpression;
                                        });
                                        if (existViewMetadata)
                                            return [2 /*return*/, "continue"];
                                        this_9.connection.logger.logSchemaBuild("dropping an old view: " + view.name);
                                        // drop an old view
                                        return [4 /*yield*/, this_9.queryRunner.dropView(view)];
                                    case 1:
                                        // drop an old view
                                        _e.sent();
                                        this_9.queryRunner.loadedViews.splice(this_9.queryRunner.loadedViews.indexOf(view), 1);
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_9 = this;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        _a = tslib_1.__values(this.queryRunner.loadedViews), _b = _a.next();
                        _d.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 5];
                        view = _b.value;
                        return [5 /*yield**/, _loop_9(view)];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_9_1 = _d.sent();
                        e_9 = { error: e_9_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_9) throw e_9.error; }
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
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
            var _loop_10, this_10, _a, _b, metadata, e_10_1;
            var e_10, _c;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _loop_10 = function (metadata) {
                            var table, droppedTableColumns;
                            return tslib_1.__generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        table = this_10.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/, "continue"];
                                        droppedTableColumns = table.columns.filter(function (tableColumn) {
                                            return !metadata.columns.find(function (columnMetadata) { return columnMetadata.databaseName === tableColumn.name; });
                                        });
                                        if (droppedTableColumns.length === 0)
                                            return [2 /*return*/, "continue"];
                                        this_10.connection.logger.logSchemaBuild("columns dropped in " + table.name + ": " + droppedTableColumns.map(function (column) { return column.name; }).join(", "));
                                        // drop columns from the database
                                        return [4 /*yield*/, this_10.queryRunner.dropColumns(table, droppedTableColumns)];
                                    case 1:
                                        // drop columns from the database
                                        _e.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_10 = this;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        _a = tslib_1.__values(this.entityToSyncMetadatas), _b = _a.next();
                        _d.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 5];
                        metadata = _b.value;
                        return [5 /*yield**/, _loop_10(metadata)];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_10_1 = _d.sent();
                        e_10 = { error: e_10_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_10) throw e_10.error; }
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
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
            var _loop_11, this_11, _a, _b, metadata, e_11_1;
            var e_11, _c;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _loop_11 = function (metadata) {
                            var table, newColumnMetadatas, newTableColumnOptions, newTableColumns;
                            return tslib_1.__generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        table = this_11.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/, "continue"];
                                        newColumnMetadatas = metadata.columns.filter(function (columnMetadata) {
                                            return !table.columns.find(function (tableColumn) { return tableColumn.name === columnMetadata.databaseName; });
                                        });
                                        if (newColumnMetadatas.length === 0)
                                            return [2 /*return*/, "continue"];
                                        newTableColumnOptions = this_11.metadataColumnsToTableColumnOptions(newColumnMetadatas);
                                        newTableColumns = newTableColumnOptions.map(function (option) { return new TableColumn_1.TableColumn(option); });
                                        if (newTableColumns.length === 0)
                                            return [2 /*return*/, "continue"];
                                        this_11.connection.logger.logSchemaBuild("new columns added: " + newColumnMetadatas.map(function (column) { return column.databaseName; }).join(", "));
                                        return [4 /*yield*/, this_11.queryRunner.addColumns(table, newTableColumns)];
                                    case 1:
                                        _e.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_11 = this;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        _a = tslib_1.__values(this.entityToSyncMetadatas), _b = _a.next();
                        _d.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 5];
                        metadata = _b.value;
                        return [5 /*yield**/, _loop_11(metadata)];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_11_1 = _d.sent();
                        e_11 = { error: e_11_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_11) throw e_11.error; }
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Updates composite primary keys.
     */
    RdbmsSchemaBuilder.prototype.updatePrimaryKeys = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _loop_12, this_12, _a, _b, metadata, e_12_1;
            var e_12, _c;
            var _this = this;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _loop_12 = function (metadata) {
                            var table, primaryMetadataColumns, primaryTableColumns, changedPrimaryColumns;
                            return tslib_1.__generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        table = this_12.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/, "continue"];
                                        primaryMetadataColumns = metadata.columns.filter(function (column) { return column.isPrimary; });
                                        primaryTableColumns = table.columns.filter(function (column) { return column.isPrimary; });
                                        if (!(primaryTableColumns.length !== primaryMetadataColumns.length && primaryMetadataColumns.length > 1)) return [3 /*break*/, 2];
                                        changedPrimaryColumns = primaryMetadataColumns.map(function (primaryMetadataColumn) {
                                            return new TableColumn_1.TableColumn(TableUtils_1.TableUtils.createTableColumnOptions(primaryMetadataColumn, _this.connection.driver));
                                        });
                                        return [4 /*yield*/, this_12.queryRunner.updatePrimaryKeys(table, changedPrimaryColumns)];
                                    case 1:
                                        _e.sent();
                                        _e.label = 2;
                                    case 2: return [2 /*return*/];
                                }
                            });
                        };
                        this_12 = this;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        _a = tslib_1.__values(this.entityToSyncMetadatas), _b = _a.next();
                        _d.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 5];
                        metadata = _b.value;
                        return [5 /*yield**/, _loop_12(metadata)];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_12_1 = _d.sent();
                        e_12 = { error: e_12_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_12) throw e_12.error; }
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
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
            var _loop_13, this_13, _a, _b, metadata, e_13_1;
            var e_13, _c;
            var _this = this;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _loop_13 = function (metadata) {
                            var table, changedColumns, changedColumns_1, changedColumns_1_1, changedColumn, e_14_1, changedColumns_2, changedColumns_2_1, changedColumn, e_15_1, changedColumns_3, changedColumns_3_1, changedColumn, e_16_1, newAndOldTableColumns;
                            var e_14, _e, e_15, _f, e_16, _g;
                            return tslib_1.__generator(this, function (_h) {
                                switch (_h.label) {
                                    case 0:
                                        table = this_13.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/, "continue"];
                                        changedColumns = this_13.connection.driver.findChangedColumns(table.columns, metadata.columns);
                                        if (changedColumns.length === 0)
                                            return [2 /*return*/, "continue"];
                                        _h.label = 1;
                                    case 1:
                                        _h.trys.push([1, 6, 7, 8]);
                                        changedColumns_1 = (e_14 = void 0, tslib_1.__values(changedColumns)), changedColumns_1_1 = changedColumns_1.next();
                                        _h.label = 2;
                                    case 2:
                                        if (!!changedColumns_1_1.done) return [3 /*break*/, 5];
                                        changedColumn = changedColumns_1_1.value;
                                        return [4 /*yield*/, this_13.dropColumnReferencedForeignKeys(metadata.tablePath, changedColumn.databaseName)];
                                    case 3:
                                        _h.sent();
                                        _h.label = 4;
                                    case 4:
                                        changedColumns_1_1 = changedColumns_1.next();
                                        return [3 /*break*/, 2];
                                    case 5: return [3 /*break*/, 8];
                                    case 6:
                                        e_14_1 = _h.sent();
                                        e_14 = { error: e_14_1 };
                                        return [3 /*break*/, 8];
                                    case 7:
                                        try {
                                            if (changedColumns_1_1 && !changedColumns_1_1.done && (_e = changedColumns_1.return)) _e.call(changedColumns_1);
                                        }
                                        finally { if (e_14) throw e_14.error; }
                                        return [7 /*endfinally*/];
                                    case 8:
                                        _h.trys.push([8, 13, 14, 15]);
                                        changedColumns_2 = (e_15 = void 0, tslib_1.__values(changedColumns)), changedColumns_2_1 = changedColumns_2.next();
                                        _h.label = 9;
                                    case 9:
                                        if (!!changedColumns_2_1.done) return [3 /*break*/, 12];
                                        changedColumn = changedColumns_2_1.value;
                                        return [4 /*yield*/, this_13.dropColumnCompositeIndices(metadata.tablePath, changedColumn.databaseName)];
                                    case 10:
                                        _h.sent();
                                        _h.label = 11;
                                    case 11:
                                        changedColumns_2_1 = changedColumns_2.next();
                                        return [3 /*break*/, 9];
                                    case 12: return [3 /*break*/, 15];
                                    case 13:
                                        e_15_1 = _h.sent();
                                        e_15 = { error: e_15_1 };
                                        return [3 /*break*/, 15];
                                    case 14:
                                        try {
                                            if (changedColumns_2_1 && !changedColumns_2_1.done && (_f = changedColumns_2.return)) _f.call(changedColumns_2);
                                        }
                                        finally { if (e_15) throw e_15.error; }
                                        return [7 /*endfinally*/];
                                    case 15:
                                        if (!!(this_13.connection.driver instanceof MysqlDriver_1.MysqlDriver || this_13.connection.driver instanceof AuroraDataApiDriver_1.AuroraDataApiDriver)) return [3 /*break*/, 23];
                                        _h.label = 16;
                                    case 16:
                                        _h.trys.push([16, 21, 22, 23]);
                                        changedColumns_3 = (e_16 = void 0, tslib_1.__values(changedColumns)), changedColumns_3_1 = changedColumns_3.next();
                                        _h.label = 17;
                                    case 17:
                                        if (!!changedColumns_3_1.done) return [3 /*break*/, 20];
                                        changedColumn = changedColumns_3_1.value;
                                        return [4 /*yield*/, this_13.dropColumnCompositeUniques(metadata.tablePath, changedColumn.databaseName)];
                                    case 18:
                                        _h.sent();
                                        _h.label = 19;
                                    case 19:
                                        changedColumns_3_1 = changedColumns_3.next();
                                        return [3 /*break*/, 17];
                                    case 20: return [3 /*break*/, 23];
                                    case 21:
                                        e_16_1 = _h.sent();
                                        e_16 = { error: e_16_1 };
                                        return [3 /*break*/, 23];
                                    case 22:
                                        try {
                                            if (changedColumns_3_1 && !changedColumns_3_1.done && (_g = changedColumns_3.return)) _g.call(changedColumns_3);
                                        }
                                        finally { if (e_16) throw e_16.error; }
                                        return [7 /*endfinally*/];
                                    case 23:
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
                                            return [2 /*return*/, "continue"];
                                        this_13.connection.logger.logSchemaBuild("columns changed in \"" + table.name + "\". updating: " + changedColumns.map(function (column) { return column.databaseName; }).join(", "));
                                        return [4 /*yield*/, this_13.queryRunner.changeColumns(table, newAndOldTableColumns)];
                                    case 24:
                                        _h.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_13 = this;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        _a = tslib_1.__values(this.entityToSyncMetadatas), _b = _a.next();
                        _d.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 5];
                        metadata = _b.value;
                        return [5 /*yield**/, _loop_13(metadata)];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_13_1 = _d.sent();
                        e_13 = { error: e_13_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_13) throw e_13.error; }
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates composite indices which are missing in db yet.
     */
    RdbmsSchemaBuilder.prototype.createNewIndices = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _loop_14, this_14, _a, _b, metadata, e_17_1;
            var e_17, _c;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _loop_14 = function (metadata) {
                            var table, newIndices;
                            return tslib_1.__generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        table = this_14.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/, "continue"];
                                        newIndices = metadata.indices
                                            .filter(function (indexMetadata) { return !table.indices.find(function (tableIndex) { return tableIndex.name === indexMetadata.name; }) && indexMetadata.synchronize === true; })
                                            .map(function (indexMetadata) { return TableIndex_1.TableIndex.create(indexMetadata); });
                                        if (newIndices.length === 0)
                                            return [2 /*return*/, "continue"];
                                        this_14.connection.logger.logSchemaBuild("adding new indices " + newIndices.map(function (index) { return "\"" + index.name + "\""; }).join(", ") + " in table \"" + table.name + "\"");
                                        return [4 /*yield*/, this_14.queryRunner.createIndices(table, newIndices)];
                                    case 1:
                                        _e.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_14 = this;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        _a = tslib_1.__values(this.entityToSyncMetadatas), _b = _a.next();
                        _d.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 5];
                        metadata = _b.value;
                        return [5 /*yield**/, _loop_14(metadata)];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_17_1 = _d.sent();
                        e_17 = { error: e_17_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_17) throw e_17.error; }
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    RdbmsSchemaBuilder.prototype.createNewChecks = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _loop_15, this_15, _a, _b, metadata, e_18_1;
            var e_18, _c;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        // Mysql does not support check constraints
                        if (this.connection.driver instanceof MysqlDriver_1.MysqlDriver || this.connection.driver instanceof AuroraDataApiDriver_1.AuroraDataApiDriver)
                            return [2 /*return*/];
                        _loop_15 = function (metadata) {
                            var table, newChecks;
                            return tslib_1.__generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        table = this_15.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/, "continue"];
                                        newChecks = metadata.checks
                                            .filter(function (checkMetadata) { return !table.checks.find(function (tableCheck) { return tableCheck.name === checkMetadata.name; }); })
                                            .map(function (checkMetadata) { return TableCheck_1.TableCheck.create(checkMetadata); });
                                        if (newChecks.length === 0)
                                            return [2 /*return*/, "continue"];
                                        this_15.connection.logger.logSchemaBuild("adding new check constraints: " + newChecks.map(function (index) { return "\"" + index.name + "\""; }).join(", ") + " in table \"" + table.name + "\"");
                                        return [4 /*yield*/, this_15.queryRunner.createCheckConstraints(table, newChecks)];
                                    case 1:
                                        _e.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_15 = this;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        _a = tslib_1.__values(this.entityToSyncMetadatas), _b = _a.next();
                        _d.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 5];
                        metadata = _b.value;
                        return [5 /*yield**/, _loop_15(metadata)];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_18_1 = _d.sent();
                        e_18 = { error: e_18_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_18) throw e_18.error; }
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates composite uniques which are missing in db yet.
     */
    RdbmsSchemaBuilder.prototype.createCompositeUniqueConstraints = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _loop_16, this_16, _a, _b, metadata, e_19_1;
            var e_19, _c;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _loop_16 = function (metadata) {
                            var table, compositeUniques;
                            return tslib_1.__generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        table = this_16.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/, "continue"];
                                        compositeUniques = metadata.uniques
                                            .filter(function (uniqueMetadata) { return uniqueMetadata.columns.length > 1 && !table.uniques.find(function (tableUnique) { return tableUnique.name === uniqueMetadata.name; }); })
                                            .map(function (uniqueMetadata) { return TableUnique_1.TableUnique.create(uniqueMetadata); });
                                        if (compositeUniques.length === 0)
                                            return [2 /*return*/, "continue"];
                                        this_16.connection.logger.logSchemaBuild("adding new unique constraints: " + compositeUniques.map(function (unique) { return "\"" + unique.name + "\""; }).join(", ") + " in table \"" + table.name + "\"");
                                        return [4 /*yield*/, this_16.queryRunner.createUniqueConstraints(table, compositeUniques)];
                                    case 1:
                                        _e.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_16 = this;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        _a = tslib_1.__values(this.entityToSyncMetadatas), _b = _a.next();
                        _d.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 5];
                        metadata = _b.value;
                        return [5 /*yield**/, _loop_16(metadata)];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_19_1 = _d.sent();
                        e_19 = { error: e_19_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_19) throw e_19.error; }
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates exclusions which are missing in db yet.
     */
    RdbmsSchemaBuilder.prototype.createNewExclusions = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _loop_17, this_17, _a, _b, metadata, e_20_1;
            var e_20, _c;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        // Only PostgreSQL supports exclusion constraints
                        if (!(this.connection.driver instanceof PostgresDriver_1.PostgresDriver))
                            return [2 /*return*/];
                        _loop_17 = function (metadata) {
                            var table, newExclusions;
                            return tslib_1.__generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        table = this_17.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/, "continue"];
                                        newExclusions = metadata.exclusions
                                            .filter(function (exclusionMetadata) { return !table.exclusions.find(function (tableExclusion) { return tableExclusion.name === exclusionMetadata.name; }); })
                                            .map(function (exclusionMetadata) { return TableExclusion_1.TableExclusion.create(exclusionMetadata); });
                                        if (newExclusions.length === 0)
                                            return [2 /*return*/, "continue"];
                                        this_17.connection.logger.logSchemaBuild("adding new exclusion constraints: " + newExclusions.map(function (exclusion) { return "\"" + exclusion.name + "\""; }).join(", ") + " in table \"" + table.name + "\"");
                                        return [4 /*yield*/, this_17.queryRunner.createExclusionConstraints(table, newExclusions)];
                                    case 1:
                                        _e.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_17 = this;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        _a = tslib_1.__values(this.entityToSyncMetadatas), _b = _a.next();
                        _d.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 5];
                        metadata = _b.value;
                        return [5 /*yield**/, _loop_17(metadata)];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_20_1 = _d.sent();
                        e_20 = { error: e_20_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_20) throw e_20.error; }
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates foreign keys which does not exist in the table yet.
     */
    RdbmsSchemaBuilder.prototype.createForeignKeys = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _loop_18, this_18, _a, _b, metadata, e_21_1;
            var e_21, _c;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _loop_18 = function (metadata) {
                            var table, newKeys, dbForeignKeys;
                            return tslib_1.__generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        table = this_18.queryRunner.loadedTables.find(function (table) { return table.name === metadata.tablePath; });
                                        if (!table)
                                            return [2 /*return*/, "continue"];
                                        newKeys = metadata.foreignKeys
                                            .filter(function (foreignKey) {
                                            return !table.foreignKeys.find(function (dbForeignKey) { return foreignKeysMatch(dbForeignKey, foreignKey); });
                                        });
                                        if (newKeys.length === 0)
                                            return [2 /*return*/, "continue"];
                                        dbForeignKeys = newKeys.map(function (foreignKeyMetadata) { return TableForeignKey_1.TableForeignKey.create(foreignKeyMetadata); });
                                        this_18.connection.logger.logSchemaBuild("creating a foreign keys: " + newKeys.map(function (key) { return key.name; }).join(", ") + " on table \"" + table.name + "\"");
                                        return [4 /*yield*/, this_18.queryRunner.createForeignKeys(table, dbForeignKeys)];
                                    case 1:
                                        _e.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_18 = this;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 6, 7, 8]);
                        _a = tslib_1.__values(this.entityToSyncMetadatas), _b = _a.next();
                        _d.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 5];
                        metadata = _b.value;
                        return [5 /*yield**/, _loop_18(metadata)];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_21_1 = _d.sent();
                        e_21 = { error: e_21_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_21) throw e_21.error; }
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops all foreign keys where given column of the given table is being used.
     */
    RdbmsSchemaBuilder.prototype.dropColumnReferencedForeignKeys = function (tablePath, columnName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, tablesWithFK, columnForeignKey, clonedTable, tablesWithFK_1, tablesWithFK_1_1, tableWithFK, e_22_1;
            var e_22, _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
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
                        if (!(tablesWithFK.length > 0)) return [3 /*break*/, 8];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, 7, 8]);
                        tablesWithFK_1 = tslib_1.__values(tablesWithFK), tablesWithFK_1_1 = tablesWithFK_1.next();
                        _b.label = 2;
                    case 2:
                        if (!!tablesWithFK_1_1.done) return [3 /*break*/, 5];
                        tableWithFK = tablesWithFK_1_1.value;
                        this.connection.logger.logSchemaBuild("dropping related foreign keys of " + tableWithFK.name + ": " + tableWithFK.foreignKeys.map(function (foreignKey) { return foreignKey.name; }).join(", "));
                        return [4 /*yield*/, this.queryRunner.dropForeignKeys(tableWithFK, tableWithFK.foreignKeys)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4:
                        tablesWithFK_1_1 = tablesWithFK_1.next();
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6:
                        e_22_1 = _b.sent();
                        e_22 = { error: e_22_1 };
                        return [3 /*break*/, 8];
                    case 7:
                        try {
                            if (tablesWithFK_1_1 && !tablesWithFK_1_1.done && (_a = tablesWithFK_1.return)) _a.call(tablesWithFK_1);
                        }
                        finally { if (e_22) throw e_22.error; }
                        return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
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
function foreignKeysMatch(tableForeignKey, metadataForeignKey) {
    return (tableForeignKey.name === metadataForeignKey.name)
        && (tableForeignKey.referencedTableName === metadataForeignKey.referencedTablePath);
}

//# sourceMappingURL=RdbmsSchemaBuilder.js.map
