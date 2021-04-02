import { __awaiter, __extends, __generator, __read } from "tslib";
import { TransactionAlreadyStartedError } from "../../error/TransactionAlreadyStartedError";
import { TransactionNotStartedError } from "../../error/TransactionNotStartedError";
import { TableColumn } from "../../schema-builder/table/TableColumn";
import { ColumnMetadata } from "../../metadata/ColumnMetadata";
import { Table } from "../../schema-builder/table/Table";
import { TableIndex } from "../../schema-builder/table/TableIndex";
import { TableForeignKey } from "../../schema-builder/table/TableForeignKey";
import { View } from "../../schema-builder/view/View";
import { BroadcasterResult } from "../../subscriber/BroadcasterResult";
import { Query } from "../Query";
import { TableUnique } from "../../schema-builder/table/TableUnique";
import { BaseQueryRunner } from "../../query-runner/BaseQueryRunner";
import { OrmUtils } from "../../util/OrmUtils";
import { TableCheck } from "../../schema-builder/table/TableCheck";
/**
 * Runs queries on a single sqlite database connection.
 */
var AbstractSqliteQueryRunner = /** @class */ (function (_super) {
    __extends(AbstractSqliteQueryRunner, _super);
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function AbstractSqliteQueryRunner() {
        return _super.call(this) || this;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates/uses database connection from the connection pool to perform further operations.
     * Returns obtained database connection.
     */
    AbstractSqliteQueryRunner.prototype.connect = function () {
        return Promise.resolve(this.driver.databaseConnection);
    };
    /**
     * Releases used database connection.
     * We just clear loaded tables and sql in memory, because sqlite do not support multiple connections thus query runners.
     */
    AbstractSqliteQueryRunner.prototype.release = function () {
        this.loadedTables = [];
        this.clearSqlMemory();
        return Promise.resolve();
    };
    /**
     * Starts transaction.
     */
    AbstractSqliteQueryRunner.prototype.startTransaction = function (isolationLevel) {
        return __awaiter(this, void 0, void 0, function () {
            var beforeBroadcastResult, afterBroadcastResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isTransactionActive)
                            throw new TransactionAlreadyStartedError();
                        if (!isolationLevel) return [3 /*break*/, 4];
                        if (isolationLevel !== "READ UNCOMMITTED" && isolationLevel !== "SERIALIZABLE") {
                            throw new Error("SQLite only supports SERIALIZABLE and READ UNCOMMITTED isolation");
                        }
                        if (!(isolationLevel === "READ UNCOMMITTED")) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.query("PRAGMA read_uncommitted = true")];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.query("PRAGMA read_uncommitted = false")];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        beforeBroadcastResult = new BroadcasterResult();
                        this.broadcaster.broadcastBeforeTransactionStartEvent(beforeBroadcastResult);
                        if (!(beforeBroadcastResult.promises.length > 0)) return [3 /*break*/, 6];
                        return [4 /*yield*/, Promise.all(beforeBroadcastResult.promises)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        this.isTransactionActive = true;
                        return [4 /*yield*/, this.query("BEGIN TRANSACTION")];
                    case 7:
                        _a.sent();
                        afterBroadcastResult = new BroadcasterResult();
                        this.broadcaster.broadcastAfterTransactionStartEvent(afterBroadcastResult);
                        if (!(afterBroadcastResult.promises.length > 0)) return [3 /*break*/, 9];
                        return [4 /*yield*/, Promise.all(afterBroadcastResult.promises)];
                    case 8:
                        _a.sent();
                        _a.label = 9;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    AbstractSqliteQueryRunner.prototype.commitTransaction = function () {
        return __awaiter(this, void 0, void 0, function () {
            var beforeBroadcastResult, afterBroadcastResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isTransactionActive)
                            throw new TransactionNotStartedError();
                        beforeBroadcastResult = new BroadcasterResult();
                        this.broadcaster.broadcastBeforeTransactionCommitEvent(beforeBroadcastResult);
                        if (!(beforeBroadcastResult.promises.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.all(beforeBroadcastResult.promises)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.query("COMMIT")];
                    case 3:
                        _a.sent();
                        this.isTransactionActive = false;
                        afterBroadcastResult = new BroadcasterResult();
                        this.broadcaster.broadcastAfterTransactionCommitEvent(afterBroadcastResult);
                        if (!(afterBroadcastResult.promises.length > 0)) return [3 /*break*/, 5];
                        return [4 /*yield*/, Promise.all(afterBroadcastResult.promises)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    AbstractSqliteQueryRunner.prototype.rollbackTransaction = function () {
        return __awaiter(this, void 0, void 0, function () {
            var beforeBroadcastResult, afterBroadcastResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isTransactionActive)
                            throw new TransactionNotStartedError();
                        beforeBroadcastResult = new BroadcasterResult();
                        this.broadcaster.broadcastBeforeTransactionRollbackEvent(beforeBroadcastResult);
                        if (!(beforeBroadcastResult.promises.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.all(beforeBroadcastResult.promises)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.query("ROLLBACK")];
                    case 3:
                        _a.sent();
                        this.isTransactionActive = false;
                        afterBroadcastResult = new BroadcasterResult();
                        this.broadcaster.broadcastAfterTransactionRollbackEvent(afterBroadcastResult);
                        if (!(afterBroadcastResult.promises.length > 0)) return [3 /*break*/, 5];
                        return [4 /*yield*/, Promise.all(afterBroadcastResult.promises)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns raw data stream.
     */
    AbstractSqliteQueryRunner.prototype.stream = function (query, parameters, onEnd, onError) {
        throw new Error("Stream is not supported by sqlite driver.");
    };
    /**
     * Returns all available database names including system databases.
     */
    AbstractSqliteQueryRunner.prototype.getDatabases = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.resolve([])];
            });
        });
    };
    /**
     * Returns all available schema names including system schemas.
     * If database parameter specified, returns schemas of that database.
     */
    AbstractSqliteQueryRunner.prototype.getSchemas = function (database) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.resolve([])];
            });
        });
    };
    /**
     * Checks if database with the given name exist.
     */
    AbstractSqliteQueryRunner.prototype.hasDatabase = function (database) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.resolve(false)];
            });
        });
    };
    /**
     * Checks if schema with the given name exist.
     */
    AbstractSqliteQueryRunner.prototype.hasSchema = function (schema) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("This driver does not support table schemas");
            });
        });
    };
    /**
     * Checks if table with the given name exist in the database.
     */
    AbstractSqliteQueryRunner.prototype.hasTable = function (tableOrName) {
        return __awaiter(this, void 0, void 0, function () {
            var tableName, sql, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
                        sql = "SELECT * FROM \"sqlite_master\" WHERE \"type\" = 'table' AND \"name\" = '" + tableName + "'";
                        return [4 /*yield*/, this.query(sql)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.length ? true : false];
                }
            });
        });
    };
    /**
     * Checks if column with the given name exist in the given table.
     */
    AbstractSqliteQueryRunner.prototype.hasColumn = function (tableOrName, columnName) {
        return __awaiter(this, void 0, void 0, function () {
            var tableName, sql, columns;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
                        sql = "PRAGMA table_info(\"" + tableName + "\")";
                        return [4 /*yield*/, this.query(sql)];
                    case 1:
                        columns = _a.sent();
                        return [2 /*return*/, !!columns.find(function (column) { return column["name"] === columnName; })];
                }
            });
        });
    };
    /**
     * Creates a new database.
     */
    AbstractSqliteQueryRunner.prototype.createDatabase = function (database, ifNotExist) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.resolve()];
            });
        });
    };
    /**
     * Drops database.
     */
    AbstractSqliteQueryRunner.prototype.dropDatabase = function (database, ifExist) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.resolve()];
            });
        });
    };
    /**
     * Creates a new table schema.
     */
    AbstractSqliteQueryRunner.prototype.createSchema = function (schema, ifNotExist) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.resolve()];
            });
        });
    };
    /**
     * Drops table schema.
     */
    AbstractSqliteQueryRunner.prototype.dropSchema = function (schemaPath, ifExist) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.resolve()];
            });
        });
    };
    /**
     * Creates a new table.
     */
    AbstractSqliteQueryRunner.prototype.createTable = function (table, ifNotExist, createForeignKeys, createIndices) {
        if (ifNotExist === void 0) { ifNotExist = false; }
        if (createForeignKeys === void 0) { createForeignKeys = true; }
        if (createIndices === void 0) { createIndices = true; }
        return __awaiter(this, void 0, void 0, function () {
            var upQueries, downQueries, isTableExist;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        upQueries = [];
                        downQueries = [];
                        if (!ifNotExist) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.hasTable(table)];
                    case 1:
                        isTableExist = _a.sent();
                        if (isTableExist)
                            return [2 /*return*/, Promise.resolve()];
                        _a.label = 2;
                    case 2:
                        upQueries.push(this.createTableSql(table, createForeignKeys));
                        downQueries.push(this.dropTableSql(table));
                        if (createIndices) {
                            table.indices.forEach(function (index) {
                                // new index may be passed without name. In this case we generate index name manually.
                                if (!index.name)
                                    index.name = _this.connection.namingStrategy.indexName(table.name, index.columnNames, index.where);
                                upQueries.push(_this.createIndexSql(table, index));
                                downQueries.push(_this.dropIndexSql(index));
                            });
                        }
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops the table.
     */
    AbstractSqliteQueryRunner.prototype.dropTable = function (tableOrName, ifExist, dropForeignKeys, dropIndices) {
        if (dropForeignKeys === void 0) { dropForeignKeys = true; }
        if (dropIndices === void 0) { dropIndices = true; }
        return __awaiter(this, void 0, void 0, function () {
            var isTableExist, createForeignKeys, table, _a, upQueries, downQueries;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!ifExist) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.hasTable(tableOrName)];
                    case 1:
                        isTableExist = _b.sent();
                        if (!isTableExist)
                            return [2 /*return*/, Promise.resolve()];
                        _b.label = 2;
                    case 2:
                        createForeignKeys = dropForeignKeys;
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 3];
                        _a = tableOrName;
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 4:
                        _a = _b.sent();
                        _b.label = 5;
                    case 5:
                        table = _a;
                        upQueries = [];
                        downQueries = [];
                        if (dropIndices) {
                            table.indices.forEach(function (index) {
                                upQueries.push(_this.dropIndexSql(index));
                                downQueries.push(_this.createIndexSql(table, index));
                            });
                        }
                        upQueries.push(this.dropTableSql(table, ifExist));
                        downQueries.push(this.createTableSql(table, createForeignKeys));
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 6:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new view.
     */
    AbstractSqliteQueryRunner.prototype.createView = function (view) {
        return __awaiter(this, void 0, void 0, function () {
            var upQueries, downQueries;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        upQueries = [];
                        downQueries = [];
                        upQueries.push(this.createViewSql(view));
                        upQueries.push(this.insertViewDefinitionSql(view));
                        downQueries.push(this.dropViewSql(view));
                        downQueries.push(this.deleteViewDefinitionSql(view));
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops the view.
     */
    AbstractSqliteQueryRunner.prototype.dropView = function (target) {
        return __awaiter(this, void 0, void 0, function () {
            var viewName, view, upQueries, downQueries;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        viewName = target instanceof View ? target.name : target;
                        return [4 /*yield*/, this.getCachedView(viewName)];
                    case 1:
                        view = _a.sent();
                        upQueries = [];
                        downQueries = [];
                        upQueries.push(this.deleteViewDefinitionSql(view));
                        upQueries.push(this.dropViewSql(view));
                        downQueries.push(this.insertViewDefinitionSql(view));
                        downQueries.push(this.createViewSql(view));
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Renames the given table.
     */
    AbstractSqliteQueryRunner.prototype.renameTable = function (oldTableOrName, newTableName) {
        return __awaiter(this, void 0, void 0, function () {
            var oldTable, _a, newTable, up, down;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(oldTableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = oldTableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(oldTableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        oldTable = _a;
                        newTable = oldTable.clone();
                        newTable.name = newTableName;
                        up = new Query("ALTER TABLE \"" + oldTable.name + "\" RENAME TO \"" + newTableName + "\"");
                        down = new Query("ALTER TABLE \"" + newTableName + "\" RENAME TO \"" + oldTable.name + "\"");
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        // rename old table;
                        oldTable.name = newTable.name;
                        // rename unique constraints
                        newTable.uniques.forEach(function (unique) {
                            unique.name = _this.connection.namingStrategy.uniqueConstraintName(newTable, unique.columnNames);
                        });
                        // rename foreign key constraints
                        newTable.foreignKeys.forEach(function (foreignKey) {
                            foreignKey.name = _this.connection.namingStrategy.foreignKeyName(newTable, foreignKey.columnNames, foreignKey.referencedTableName, foreignKey.referencedColumnNames);
                        });
                        // rename indices
                        newTable.indices.forEach(function (index) {
                            index.name = _this.connection.namingStrategy.indexName(newTable, index.columnNames, index.where);
                        });
                        // recreate table with new constraint names
                        return [4 /*yield*/, this.recreateTable(newTable, oldTable)];
                    case 5:
                        // recreate table with new constraint names
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new column from the column in the table.
     */
    AbstractSqliteQueryRunner.prototype.addColumn = function (tableOrName, column) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        return [2 /*return*/, this.addColumns(table, [column])];
                }
            });
        });
    };
    /**
     * Creates a new columns from the column in the table.
     */
    AbstractSqliteQueryRunner.prototype.addColumns = function (tableOrName, columns) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, changedTable;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        changedTable = table.clone();
                        columns.forEach(function (column) { return changedTable.addColumn(column); });
                        return [4 /*yield*/, this.recreateTable(changedTable, table)];
                    case 4:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Renames column in the given table.
     */
    AbstractSqliteQueryRunner.prototype.renameColumn = function (tableOrName, oldTableColumnOrName, newTableColumnOrName) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, oldColumn, newColumn;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        oldColumn = oldTableColumnOrName instanceof TableColumn ? oldTableColumnOrName : table.columns.find(function (c) { return c.name === oldTableColumnOrName; });
                        if (!oldColumn)
                            throw new Error("Column \"" + oldTableColumnOrName + "\" was not found in the \"" + table.name + "\" table.");
                        newColumn = undefined;
                        if (newTableColumnOrName instanceof TableColumn) {
                            newColumn = newTableColumnOrName;
                        }
                        else {
                            newColumn = oldColumn.clone();
                            newColumn.name = newTableColumnOrName;
                        }
                        return [2 /*return*/, this.changeColumn(table, oldColumn, newColumn)];
                }
            });
        });
    };
    /**
     * Changes a column in the table.
     */
    AbstractSqliteQueryRunner.prototype.changeColumn = function (tableOrName, oldTableColumnOrName, newColumn) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, oldColumn;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        oldColumn = oldTableColumnOrName instanceof TableColumn ? oldTableColumnOrName : table.columns.find(function (c) { return c.name === oldTableColumnOrName; });
                        if (!oldColumn)
                            throw new Error("Column \"" + oldTableColumnOrName + "\" was not found in the \"" + table.name + "\" table.");
                        return [4 /*yield*/, this.changeColumns(table, [{ oldColumn: oldColumn, newColumn: newColumn }])];
                    case 4:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Changes a column in the table.
     * Changed column looses all its keys in the db.
     */
    AbstractSqliteQueryRunner.prototype.changeColumns = function (tableOrName, changedColumns) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, changedTable;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        changedTable = table.clone();
                        changedColumns.forEach(function (changedColumnSet) {
                            if (changedColumnSet.newColumn.name !== changedColumnSet.oldColumn.name) {
                                changedTable.findColumnUniques(changedColumnSet.oldColumn).forEach(function (unique) {
                                    unique.columnNames.splice(unique.columnNames.indexOf(changedColumnSet.oldColumn.name), 1);
                                    unique.columnNames.push(changedColumnSet.newColumn.name);
                                    unique.name = _this.connection.namingStrategy.uniqueConstraintName(changedTable, unique.columnNames);
                                });
                                changedTable.findColumnForeignKeys(changedColumnSet.oldColumn).forEach(function (fk) {
                                    fk.columnNames.splice(fk.columnNames.indexOf(changedColumnSet.oldColumn.name), 1);
                                    fk.columnNames.push(changedColumnSet.newColumn.name);
                                    fk.name = _this.connection.namingStrategy.foreignKeyName(changedTable, fk.columnNames, fk.referencedTableName, fk.referencedColumnNames);
                                });
                                changedTable.findColumnIndices(changedColumnSet.oldColumn).forEach(function (index) {
                                    index.columnNames.splice(index.columnNames.indexOf(changedColumnSet.oldColumn.name), 1);
                                    index.columnNames.push(changedColumnSet.newColumn.name);
                                    index.name = _this.connection.namingStrategy.indexName(changedTable, index.columnNames, index.where);
                                });
                            }
                            var originalColumn = changedTable.columns.find(function (column) { return column.name === changedColumnSet.oldColumn.name; });
                            if (originalColumn)
                                changedTable.columns[changedTable.columns.indexOf(originalColumn)] = changedColumnSet.newColumn;
                        });
                        return [4 /*yield*/, this.recreateTable(changedTable, table)];
                    case 4:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops column in the table.
     */
    AbstractSqliteQueryRunner.prototype.dropColumn = function (tableOrName, columnOrName) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, column;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        column = columnOrName instanceof TableColumn ? columnOrName : table.findColumnByName(columnOrName);
                        if (!column)
                            throw new Error("Column \"" + columnOrName + "\" was not found in table \"" + table.name + "\"");
                        return [4 /*yield*/, this.dropColumns(table, [column])];
                    case 4:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops the columns in the table.
     */
    AbstractSqliteQueryRunner.prototype.dropColumns = function (tableOrName, columns) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, changedTable;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        changedTable = table.clone();
                        columns.forEach(function (column) {
                            changedTable.removeColumn(column);
                            changedTable.findColumnUniques(column).forEach(function (unique) { return changedTable.removeUniqueConstraint(unique); });
                            changedTable.findColumnIndices(column).forEach(function (index) { return changedTable.removeIndex(index); });
                            changedTable.findColumnForeignKeys(column).forEach(function (fk) { return changedTable.removeForeignKey(fk); });
                        });
                        return [4 /*yield*/, this.recreateTable(changedTable, table)];
                    case 4:
                        _b.sent();
                        // remove column and its constraints from original table.
                        columns.forEach(function (column) {
                            table.removeColumn(column);
                            table.findColumnUniques(column).forEach(function (unique) { return table.removeUniqueConstraint(unique); });
                            table.findColumnIndices(column).forEach(function (index) { return table.removeIndex(index); });
                            table.findColumnForeignKeys(column).forEach(function (fk) { return table.removeForeignKey(fk); });
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new primary key.
     */
    AbstractSqliteQueryRunner.prototype.createPrimaryKey = function (tableOrName, columnNames) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, changedTable;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        changedTable = table.clone();
                        changedTable.columns.forEach(function (column) {
                            if (columnNames.find(function (columnName) { return columnName === column.name; }))
                                column.isPrimary = true;
                        });
                        return [4 /*yield*/, this.recreateTable(changedTable, table)];
                    case 4:
                        _b.sent();
                        // mark columns as primary in original table
                        table.columns.forEach(function (column) {
                            if (columnNames.find(function (columnName) { return columnName === column.name; }))
                                column.isPrimary = true;
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Updates composite primary keys.
     */
    AbstractSqliteQueryRunner.prototype.updatePrimaryKeys = function (tableOrName, columns) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops a primary key.
     */
    AbstractSqliteQueryRunner.prototype.dropPrimaryKey = function (tableOrName) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, changedTable;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        changedTable = table.clone();
                        changedTable.primaryColumns.forEach(function (column) {
                            column.isPrimary = false;
                        });
                        return [4 /*yield*/, this.recreateTable(changedTable, table)];
                    case 4:
                        _b.sent();
                        // mark primary columns as non-primary in original table
                        table.primaryColumns.forEach(function (column) {
                            column.isPrimary = false;
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new unique constraint.
     */
    AbstractSqliteQueryRunner.prototype.createUniqueConstraint = function (tableOrName, uniqueConstraint) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.createUniqueConstraints(tableOrName, [uniqueConstraint])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new unique constraints.
     */
    AbstractSqliteQueryRunner.prototype.createUniqueConstraints = function (tableOrName, uniqueConstraints) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, changedTable;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        changedTable = table.clone();
                        uniqueConstraints.forEach(function (uniqueConstraint) { return changedTable.addUniqueConstraint(uniqueConstraint); });
                        return [4 /*yield*/, this.recreateTable(changedTable, table)];
                    case 4:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops an unique constraint.
     */
    AbstractSqliteQueryRunner.prototype.dropUniqueConstraint = function (tableOrName, uniqueOrName) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, uniqueConstraint;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        uniqueConstraint = uniqueOrName instanceof TableUnique ? uniqueOrName : table.uniques.find(function (u) { return u.name === uniqueOrName; });
                        if (!uniqueConstraint)
                            throw new Error("Supplied unique constraint was not found in table " + table.name);
                        return [4 /*yield*/, this.dropUniqueConstraints(table, [uniqueConstraint])];
                    case 4:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates an unique constraints.
     */
    AbstractSqliteQueryRunner.prototype.dropUniqueConstraints = function (tableOrName, uniqueConstraints) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, changedTable;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        changedTable = table.clone();
                        uniqueConstraints.forEach(function (uniqueConstraint) { return changedTable.removeUniqueConstraint(uniqueConstraint); });
                        return [4 /*yield*/, this.recreateTable(changedTable, table)];
                    case 4:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates new check constraint.
     */
    AbstractSqliteQueryRunner.prototype.createCheckConstraint = function (tableOrName, checkConstraint) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.createCheckConstraints(tableOrName, [checkConstraint])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates new check constraints.
     */
    AbstractSqliteQueryRunner.prototype.createCheckConstraints = function (tableOrName, checkConstraints) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, changedTable;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        changedTable = table.clone();
                        checkConstraints.forEach(function (checkConstraint) { return changedTable.addCheckConstraint(checkConstraint); });
                        return [4 /*yield*/, this.recreateTable(changedTable, table)];
                    case 4:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops check constraint.
     */
    AbstractSqliteQueryRunner.prototype.dropCheckConstraint = function (tableOrName, checkOrName) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, checkConstraint;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        checkConstraint = checkOrName instanceof TableCheck ? checkOrName : table.checks.find(function (c) { return c.name === checkOrName; });
                        if (!checkConstraint)
                            throw new Error("Supplied check constraint was not found in table " + table.name);
                        return [4 /*yield*/, this.dropCheckConstraints(table, [checkConstraint])];
                    case 4:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops check constraints.
     */
    AbstractSqliteQueryRunner.prototype.dropCheckConstraints = function (tableOrName, checkConstraints) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, changedTable;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        changedTable = table.clone();
                        checkConstraints.forEach(function (checkConstraint) { return changedTable.removeCheckConstraint(checkConstraint); });
                        return [4 /*yield*/, this.recreateTable(changedTable, table)];
                    case 4:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new exclusion constraint.
     */
    AbstractSqliteQueryRunner.prototype.createExclusionConstraint = function (tableOrName, exclusionConstraint) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Sqlite does not support exclusion constraints.");
            });
        });
    };
    /**
     * Creates a new exclusion constraints.
     */
    AbstractSqliteQueryRunner.prototype.createExclusionConstraints = function (tableOrName, exclusionConstraints) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Sqlite does not support exclusion constraints.");
            });
        });
    };
    /**
     * Drops exclusion constraint.
     */
    AbstractSqliteQueryRunner.prototype.dropExclusionConstraint = function (tableOrName, exclusionOrName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Sqlite does not support exclusion constraints.");
            });
        });
    };
    /**
     * Drops exclusion constraints.
     */
    AbstractSqliteQueryRunner.prototype.dropExclusionConstraints = function (tableOrName, exclusionConstraints) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Sqlite does not support exclusion constraints.");
            });
        });
    };
    /**
     * Creates a new foreign key.
     */
    AbstractSqliteQueryRunner.prototype.createForeignKey = function (tableOrName, foreignKey) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.createForeignKeys(tableOrName, [foreignKey])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new foreign keys.
     */
    AbstractSqliteQueryRunner.prototype.createForeignKeys = function (tableOrName, foreignKeys) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, changedTable;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        changedTable = table.clone();
                        foreignKeys.forEach(function (foreignKey) { return changedTable.addForeignKey(foreignKey); });
                        return [4 /*yield*/, this.recreateTable(changedTable, table)];
                    case 4:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops a foreign key from the table.
     */
    AbstractSqliteQueryRunner.prototype.dropForeignKey = function (tableOrName, foreignKeyOrName) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, foreignKey;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        foreignKey = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName : table.foreignKeys.find(function (fk) { return fk.name === foreignKeyOrName; });
                        if (!foreignKey)
                            throw new Error("Supplied foreign key was not found in table " + table.name);
                        return [4 /*yield*/, this.dropForeignKeys(tableOrName, [foreignKey])];
                    case 4:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops a foreign keys from the table.
     */
    AbstractSqliteQueryRunner.prototype.dropForeignKeys = function (tableOrName, foreignKeys) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, changedTable;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        changedTable = table.clone();
                        foreignKeys.forEach(function (foreignKey) { return changedTable.removeForeignKey(foreignKey); });
                        return [4 /*yield*/, this.recreateTable(changedTable, table)];
                    case 4:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new index.
     */
    AbstractSqliteQueryRunner.prototype.createIndex = function (tableOrName, index) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, up, down;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        // new index may be passed without name. In this case we generate index name manually.
                        if (!index.name)
                            index.name = this.connection.namingStrategy.indexName(table.name, index.columnNames, index.where);
                        up = this.createIndexSql(table, index);
                        down = this.dropIndexSql(index);
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        table.addIndex(index);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a new indices
     */
    AbstractSqliteQueryRunner.prototype.createIndices = function (tableOrName, indices) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = indices.map(function (index) { return _this.createIndex(tableOrName, index); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops an index from the table.
     */
    AbstractSqliteQueryRunner.prototype.dropIndex = function (tableOrName, indexOrName) {
        return __awaiter(this, void 0, void 0, function () {
            var table, _a, index, up, down;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(tableOrName instanceof Table)) return [3 /*break*/, 1];
                        _a = tableOrName;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.getCachedTable(tableOrName)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        table = _a;
                        index = indexOrName instanceof TableIndex ? indexOrName : table.indices.find(function (i) { return i.name === indexOrName; });
                        if (!index)
                            throw new Error("Supplied index was not found in table " + table.name);
                        up = this.dropIndexSql(index);
                        down = this.createIndexSql(table, index);
                        return [4 /*yield*/, this.executeQueries(up, down)];
                    case 4:
                        _b.sent();
                        table.removeIndex(index);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Drops an indices from the table.
     */
    AbstractSqliteQueryRunner.prototype.dropIndices = function (tableOrName, indices) {
        return __awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        promises = indices.map(function (index) { return _this.dropIndex(tableOrName, index); });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clears all table contents.
     * Note: this operation uses SQL's TRUNCATE query which cannot be reverted in transactions.
     */
    AbstractSqliteQueryRunner.prototype.clearTable = function (tableName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.query("DELETE FROM \"" + tableName + "\"")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Removes all tables from the currently connected database.
     */
    AbstractSqliteQueryRunner.prototype.clearDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var selectViewDropsQuery, dropViewQueries, selectTableDropsQuery, dropTableQueries, error_1, rollbackError_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.query("PRAGMA foreign_keys = OFF;")];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.startTransaction()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 9, 14, 16]);
                        selectViewDropsQuery = "SELECT 'DROP VIEW \"' || name || '\";' as query FROM \"sqlite_master\" WHERE \"type\" = 'view'";
                        return [4 /*yield*/, this.query(selectViewDropsQuery)];
                    case 4:
                        dropViewQueries = _a.sent();
                        return [4 /*yield*/, Promise.all(dropViewQueries.map(function (q) { return _this.query(q["query"]); }))];
                    case 5:
                        _a.sent();
                        selectTableDropsQuery = "SELECT 'DROP TABLE \"' || name || '\";' as query FROM \"sqlite_master\" WHERE \"type\" = 'table' AND \"name\" != 'sqlite_sequence'";
                        return [4 /*yield*/, this.query(selectTableDropsQuery)];
                    case 6:
                        dropTableQueries = _a.sent();
                        return [4 /*yield*/, Promise.all(dropTableQueries.map(function (q) { return _this.query(q["query"]); }))];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, this.commitTransaction()];
                    case 8:
                        _a.sent();
                        return [3 /*break*/, 16];
                    case 9:
                        error_1 = _a.sent();
                        _a.label = 10;
                    case 10:
                        _a.trys.push([10, 12, , 13]);
                        return [4 /*yield*/, this.rollbackTransaction()];
                    case 11:
                        _a.sent();
                        return [3 /*break*/, 13];
                    case 12:
                        rollbackError_1 = _a.sent();
                        return [3 /*break*/, 13];
                    case 13: throw error_1;
                    case 14: return [4 /*yield*/, this.query("PRAGMA foreign_keys = ON;")];
                    case 15:
                        _a.sent();
                        return [7 /*endfinally*/];
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    AbstractSqliteQueryRunner.prototype.loadViews = function (viewNames) {
        return __awaiter(this, void 0, void 0, function () {
            var hasTable, viewNamesString, query, dbViews;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.hasTable(this.getTypeormMetadataTableName())];
                    case 1:
                        hasTable = _a.sent();
                        if (!hasTable)
                            return [2 /*return*/, Promise.resolve([])];
                        viewNamesString = viewNames.map(function (name) { return "'" + name + "'"; }).join(", ");
                        query = "SELECT \"t\".* FROM \"" + this.getTypeormMetadataTableName() + "\" \"t\" INNER JOIN \"sqlite_master\" s ON \"s\".\"name\" = \"t\".\"name\" AND \"s\".\"type\" = 'view' WHERE \"t\".\"type\" = 'VIEW'";
                        if (viewNamesString.length > 0)
                            query += " AND \"t\".\"name\" IN (" + viewNamesString + ")";
                        return [4 /*yield*/, this.query(query)];
                    case 2:
                        dbViews = _a.sent();
                        return [2 /*return*/, dbViews.map(function (dbView) {
                                var view = new View();
                                view.name = dbView["name"];
                                view.expression = dbView["value"];
                                return view;
                            })];
                }
            });
        });
    };
    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     */
    AbstractSqliteQueryRunner.prototype.loadTables = function (tableNames) {
        return __awaiter(this, void 0, void 0, function () {
            var tableNamesString, dbTables, dbIndicesDef;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // if no tables given then no need to proceed
                        if (!tableNames || !tableNames.length)
                            return [2 /*return*/, []];
                        tableNamesString = tableNames.map(function (tableName) { return "'" + tableName + "'"; }).join(", ");
                        return [4 /*yield*/, this.query("SELECT * FROM \"sqlite_master\" WHERE \"type\" = 'table' AND \"name\" IN (" + tableNamesString + ")")];
                    case 1:
                        dbTables = _a.sent();
                        return [4 /*yield*/, this.query("SELECT * FROM \"sqlite_master\" WHERE \"type\" = 'index' AND \"tbl_name\" IN (" + tableNamesString + ")")];
                    case 2:
                        dbIndicesDef = _a.sent();
                        // if tables were not found in the db, no need to proceed
                        if (!dbTables || !dbTables.length)
                            return [2 /*return*/, []];
                        // create table schemas for loaded tables
                        return [2 /*return*/, Promise.all(dbTables.map(function (dbTable) { return __awaiter(_this, void 0, void 0, function () {
                                var table, sql, _a, dbColumns, dbIndices, dbForeignKeys, autoIncrementColumnName, tableSql, autoIncrementIndex, comma, bracket, tableForeignKeyConstraints, tableUniquePromises, _b, result, regexp, indicesPromises, indices;
                                var _this = this;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            table = new Table({ name: dbTable["name"] });
                                            sql = dbTable["sql"];
                                            return [4 /*yield*/, Promise.all([
                                                    this.query("PRAGMA table_info(\"" + dbTable["name"] + "\")"),
                                                    this.query("PRAGMA index_list(\"" + dbTable["name"] + "\")"),
                                                    this.query("PRAGMA foreign_key_list(\"" + dbTable["name"] + "\")"),
                                                ])];
                                        case 1:
                                            _a = __read.apply(void 0, [_c.sent(), 3]), dbColumns = _a[0], dbIndices = _a[1], dbForeignKeys = _a[2];
                                            autoIncrementColumnName = undefined;
                                            tableSql = dbTable["sql"];
                                            autoIncrementIndex = tableSql.toUpperCase().indexOf("AUTOINCREMENT");
                                            if (autoIncrementIndex !== -1) {
                                                autoIncrementColumnName = tableSql.substr(0, autoIncrementIndex);
                                                comma = autoIncrementColumnName.lastIndexOf(",");
                                                bracket = autoIncrementColumnName.lastIndexOf("(");
                                                if (comma !== -1) {
                                                    autoIncrementColumnName = autoIncrementColumnName.substr(comma);
                                                    autoIncrementColumnName = autoIncrementColumnName.substr(0, autoIncrementColumnName.lastIndexOf("\""));
                                                    autoIncrementColumnName = autoIncrementColumnName.substr(autoIncrementColumnName.indexOf("\"") + 1);
                                                }
                                                else if (bracket !== -1) {
                                                    autoIncrementColumnName = autoIncrementColumnName.substr(bracket);
                                                    autoIncrementColumnName = autoIncrementColumnName.substr(0, autoIncrementColumnName.lastIndexOf("\""));
                                                    autoIncrementColumnName = autoIncrementColumnName.substr(autoIncrementColumnName.indexOf("\"") + 1);
                                                }
                                            }
                                            // create columns from the loaded columns
                                            table.columns = dbColumns.map(function (dbColumn) {
                                                var tableColumn = new TableColumn();
                                                tableColumn.name = dbColumn["name"];
                                                tableColumn.type = dbColumn["type"].toLowerCase();
                                                tableColumn.default = dbColumn["dflt_value"] !== null && dbColumn["dflt_value"] !== undefined ? dbColumn["dflt_value"] : undefined;
                                                tableColumn.isNullable = dbColumn["notnull"] === 0;
                                                // primary keys are numbered starting with 1, columns that aren't primary keys are marked with 0
                                                tableColumn.isPrimary = dbColumn["pk"] > 0;
                                                tableColumn.comment = ""; // SQLite does not support column comments
                                                tableColumn.isGenerated = autoIncrementColumnName === dbColumn["name"];
                                                if (tableColumn.isGenerated) {
                                                    tableColumn.generationStrategy = "increment";
                                                }
                                                if (tableColumn.type === "varchar") {
                                                    // Check if this is an enum
                                                    var enumMatch = sql.match(new RegExp("\"(" + tableColumn.name + ")\" varchar CHECK\\s*\\(\\s*\\1\\s+IN\\s*\\(('[^']+'(?:\\s*,\\s*'[^']+')+)\\s*\\)\\s*\\)"));
                                                    if (enumMatch) {
                                                        // This is an enum
                                                        tableColumn.enum = enumMatch[2].substr(1, enumMatch[2].length - 2).split("','");
                                                    }
                                                }
                                                // parse datatype and attempt to retrieve length, precision and scale
                                                var pos = tableColumn.type.indexOf("(");
                                                if (pos !== -1) {
                                                    var fullType = tableColumn.type;
                                                    var dataType_1 = fullType.substr(0, pos);
                                                    if (!!_this.driver.withLengthColumnTypes.find(function (col) { return col === dataType_1; })) {
                                                        var len = parseInt(fullType.substring(pos + 1, fullType.length - 1));
                                                        if (len) {
                                                            tableColumn.length = len.toString();
                                                            tableColumn.type = dataType_1; // remove the length part from the datatype
                                                        }
                                                    }
                                                    if (!!_this.driver.withPrecisionColumnTypes.find(function (col) { return col === dataType_1; })) {
                                                        var re = new RegExp("^" + dataType_1 + "\\((\\d+),?\\s?(\\d+)?\\)");
                                                        var matches = fullType.match(re);
                                                        if (matches && matches[1]) {
                                                            tableColumn.precision = +matches[1];
                                                        }
                                                        if (!!_this.driver.withScaleColumnTypes.find(function (col) { return col === dataType_1; })) {
                                                            if (matches && matches[2]) {
                                                                tableColumn.scale = +matches[2];
                                                            }
                                                        }
                                                        tableColumn.type = dataType_1; // remove the precision/scale part from the datatype
                                                    }
                                                }
                                                return tableColumn;
                                            });
                                            tableForeignKeyConstraints = OrmUtils.uniq(dbForeignKeys, function (dbForeignKey) { return dbForeignKey["id"]; });
                                            table.foreignKeys = tableForeignKeyConstraints.map(function (foreignKey) {
                                                var ownForeignKeys = dbForeignKeys.filter(function (dbForeignKey) { return dbForeignKey["id"] === foreignKey["id"] && dbForeignKey["table"] === foreignKey["table"]; });
                                                var columnNames = ownForeignKeys.map(function (dbForeignKey) { return dbForeignKey["from"]; });
                                                var referencedColumnNames = ownForeignKeys.map(function (dbForeignKey) { return dbForeignKey["to"]; });
                                                // build foreign key name, because we can not get it directly.
                                                var fkName = _this.connection.namingStrategy.foreignKeyName(table, columnNames, foreignKey.referencedTableName, foreignKey.referencedColumnNames);
                                                return new TableForeignKey({
                                                    name: fkName,
                                                    columnNames: columnNames,
                                                    referencedTableName: foreignKey["table"],
                                                    referencedColumnNames: referencedColumnNames,
                                                    onDelete: foreignKey["on_delete"],
                                                    onUpdate: foreignKey["on_update"]
                                                });
                                            });
                                            tableUniquePromises = dbIndices
                                                .filter(function (dbIndex) { return dbIndex["origin"] === "u"; })
                                                .map(function (dbIndex) { return dbIndex["name"]; })
                                                .filter(function (value, index, self) { return self.indexOf(value) === index; })
                                                .map(function (dbIndexName) { return __awaiter(_this, void 0, void 0, function () {
                                                var dbIndex, indexInfos, indexColumns, column;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            dbIndex = dbIndices.find(function (dbIndex) { return dbIndex["name"] === dbIndexName; });
                                                            return [4 /*yield*/, this.query("PRAGMA index_info(\"" + dbIndex["name"] + "\")")];
                                                        case 1:
                                                            indexInfos = _a.sent();
                                                            indexColumns = indexInfos
                                                                .sort(function (indexInfo1, indexInfo2) { return parseInt(indexInfo1["seqno"]) - parseInt(indexInfo2["seqno"]); })
                                                                .map(function (indexInfo) { return indexInfo["name"]; });
                                                            if (indexColumns.length === 1) {
                                                                column = table.columns.find(function (column) {
                                                                    return !!indexColumns.find(function (indexColumn) { return indexColumn === column.name; });
                                                                });
                                                                if (column)
                                                                    column.isUnique = true;
                                                            }
                                                            // Sqlite does not store unique constraint name, so we generate its name manually.
                                                            return [2 /*return*/, new TableUnique({
                                                                    name: this.connection.namingStrategy.uniqueConstraintName(table, indexColumns),
                                                                    columnNames: indexColumns
                                                                })];
                                                    }
                                                });
                                            }); });
                                            _b = table;
                                            return [4 /*yield*/, Promise.all(tableUniquePromises)];
                                        case 2:
                                            _b.uniques = (_c.sent());
                                            regexp = /CONSTRAINT "([^"]*)" CHECK (\(.*?\))([,]|[)]$)/g;
                                            while (((result = regexp.exec(sql)) !== null)) {
                                                table.checks.push(new TableCheck({ name: result[1], expression: result[2] }));
                                            }
                                            indicesPromises = dbIndices
                                                .filter(function (dbIndex) { return dbIndex["origin"] === "c"; })
                                                .map(function (dbIndex) { return dbIndex["name"]; })
                                                .filter(function (value, index, self) { return self.indexOf(value) === index; }) // unqiue
                                                .map(function (dbIndexName) { return __awaiter(_this, void 0, void 0, function () {
                                                var indexDef, condition, dbIndex, indexInfos, indexColumns, isUnique;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            indexDef = dbIndicesDef.find(function (dbIndexDef) { return dbIndexDef["name"] === dbIndexName; });
                                                            condition = /WHERE (.*)/.exec(indexDef["sql"]);
                                                            dbIndex = dbIndices.find(function (dbIndex) { return dbIndex["name"] === dbIndexName; });
                                                            return [4 /*yield*/, this.query("PRAGMA index_info(\"" + dbIndex["name"] + "\")")];
                                                        case 1:
                                                            indexInfos = _a.sent();
                                                            indexColumns = indexInfos
                                                                .sort(function (indexInfo1, indexInfo2) { return parseInt(indexInfo1["seqno"]) - parseInt(indexInfo2["seqno"]); })
                                                                .map(function (indexInfo) { return indexInfo["name"]; });
                                                            isUnique = dbIndex["unique"] === "1" || dbIndex["unique"] === 1;
                                                            return [2 /*return*/, new TableIndex({
                                                                    table: table,
                                                                    name: dbIndex["name"],
                                                                    columnNames: indexColumns,
                                                                    isUnique: isUnique,
                                                                    where: condition ? condition[1] : undefined
                                                                })];
                                                    }
                                                });
                                            }); });
                                            return [4 /*yield*/, Promise.all(indicesPromises)];
                                        case 3:
                                            indices = _c.sent();
                                            table.indices = indices.filter(function (index) { return !!index; });
                                            return [2 /*return*/, table];
                                    }
                                });
                            }); }))];
                }
            });
        });
    };
    /**
     * Builds create table sql.
     */
    AbstractSqliteQueryRunner.prototype.createTableSql = function (table, createForeignKeys) {
        var _this = this;
        var primaryColumns = table.columns.filter(function (column) { return column.isPrimary; });
        var hasAutoIncrement = primaryColumns.find(function (column) { return column.isGenerated && column.generationStrategy === "increment"; });
        var skipPrimary = primaryColumns.length > 1;
        if (skipPrimary && hasAutoIncrement)
            throw new Error("Sqlite does not support AUTOINCREMENT on composite primary key");
        var columnDefinitions = table.columns.map(function (column) { return _this.buildCreateColumnSql(column, skipPrimary); }).join(", ");
        var sql = "CREATE TABLE \"" + table.name + "\" (" + columnDefinitions;
        // need for `addColumn()` method, because it recreates table.
        table.columns
            .filter(function (column) { return column.isUnique; })
            .forEach(function (column) {
            var isUniqueExist = table.uniques.some(function (unique) { return unique.columnNames.length === 1 && unique.columnNames[0] === column.name; });
            if (!isUniqueExist)
                table.uniques.push(new TableUnique({
                    name: _this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]),
                    columnNames: [column.name]
                }));
        });
        if (table.uniques.length > 0) {
            var uniquesSql = table.uniques.map(function (unique) {
                var uniqueName = unique.name ? unique.name : _this.connection.namingStrategy.uniqueConstraintName(table.name, unique.columnNames);
                var columnNames = unique.columnNames.map(function (columnName) { return "\"" + columnName + "\""; }).join(", ");
                return "CONSTRAINT \"" + uniqueName + "\" UNIQUE (" + columnNames + ")";
            }).join(", ");
            sql += ", " + uniquesSql;
        }
        if (table.checks.length > 0) {
            var checksSql = table.checks.map(function (check) {
                var checkName = check.name ? check.name : _this.connection.namingStrategy.checkConstraintName(table.name, check.expression);
                return "CONSTRAINT \"" + checkName + "\" CHECK (" + check.expression + ")";
            }).join(", ");
            sql += ", " + checksSql;
        }
        if (table.foreignKeys.length > 0 && createForeignKeys) {
            var foreignKeysSql = table.foreignKeys.map(function (fk) {
                var columnNames = fk.columnNames.map(function (columnName) { return "\"" + columnName + "\""; }).join(", ");
                if (!fk.name)
                    fk.name = _this.connection.namingStrategy.foreignKeyName(table.name, fk.columnNames, fk.referencedTableName, fk.referencedColumnNames);
                var referencedColumnNames = fk.referencedColumnNames.map(function (columnName) { return "\"" + columnName + "\""; }).join(", ");
                var constraint = "CONSTRAINT \"" + fk.name + "\" FOREIGN KEY (" + columnNames + ") REFERENCES \"" + fk.referencedTableName + "\" (" + referencedColumnNames + ")";
                if (fk.onDelete)
                    constraint += " ON DELETE " + fk.onDelete;
                if (fk.onUpdate)
                    constraint += " ON UPDATE " + fk.onUpdate;
                return constraint;
            }).join(", ");
            sql += ", " + foreignKeysSql;
        }
        if (primaryColumns.length > 1) {
            var columnNames = primaryColumns.map(function (column) { return "\"" + column.name + "\""; }).join(", ");
            sql += ", PRIMARY KEY (" + columnNames + ")";
        }
        sql += ")";
        var tableMetadata = this.connection.entityMetadatas.find(function (metadata) { return metadata.tableName === table.name; });
        if (tableMetadata && tableMetadata.withoutRowid) {
            sql += " WITHOUT ROWID";
        }
        return new Query(sql);
    };
    /**
     * Builds drop table sql.
     */
    AbstractSqliteQueryRunner.prototype.dropTableSql = function (tableOrName, ifExist) {
        var tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
        var query = ifExist ? "DROP TABLE IF EXISTS \"" + tableName + "\"" : "DROP TABLE \"" + tableName + "\"";
        return new Query(query);
    };
    AbstractSqliteQueryRunner.prototype.createViewSql = function (view) {
        if (typeof view.expression === "string") {
            return new Query("CREATE VIEW \"" + view.name + "\" AS " + view.expression);
        }
        else {
            return new Query("CREATE VIEW \"" + view.name + "\" AS " + view.expression(this.connection).getQuery());
        }
    };
    AbstractSqliteQueryRunner.prototype.insertViewDefinitionSql = function (view) {
        var expression = typeof view.expression === "string" ? view.expression.trim() : view.expression(this.connection).getQuery();
        var _a = __read(this.connection.createQueryBuilder()
            .insert()
            .into(this.getTypeormMetadataTableName())
            .values({ type: "VIEW", name: view.name, value: expression })
            .getQueryAndParameters(), 2), query = _a[0], parameters = _a[1];
        return new Query(query, parameters);
    };
    /**
     * Builds drop view sql.
     */
    AbstractSqliteQueryRunner.prototype.dropViewSql = function (viewOrPath) {
        var viewName = viewOrPath instanceof View ? viewOrPath.name : viewOrPath;
        return new Query("DROP VIEW \"" + viewName + "\"");
    };
    /**
     * Builds remove view sql.
     */
    AbstractSqliteQueryRunner.prototype.deleteViewDefinitionSql = function (viewOrPath) {
        var viewName = viewOrPath instanceof View ? viewOrPath.name : viewOrPath;
        var qb = this.connection.createQueryBuilder();
        var _a = __read(qb.delete()
            .from(this.getTypeormMetadataTableName())
            .where(qb.escape("type") + " = 'VIEW'")
            .andWhere(qb.escape("name") + " = :name", { name: viewName })
            .getQueryAndParameters(), 2), query = _a[0], parameters = _a[1];
        return new Query(query, parameters);
    };
    /**
     * Builds create index sql.
     */
    AbstractSqliteQueryRunner.prototype.createIndexSql = function (table, index) {
        var columns = index.columnNames.map(function (columnName) { return "\"" + columnName + "\""; }).join(", ");
        return new Query("CREATE " + (index.isUnique ? "UNIQUE " : "") + "INDEX \"" + index.name + "\" ON \"" + table.name + "\" (" + columns + ") " + (index.where ? "WHERE " + index.where : ""));
    };
    /**
     * Builds drop index sql.
     */
    AbstractSqliteQueryRunner.prototype.dropIndexSql = function (indexOrName) {
        var indexName = indexOrName instanceof TableIndex ? indexOrName.name : indexOrName;
        return new Query("DROP INDEX \"" + indexName + "\"");
    };
    /**
     * Builds a query for create column.
     */
    AbstractSqliteQueryRunner.prototype.buildCreateColumnSql = function (column, skipPrimary) {
        var c = "\"" + column.name + "\"";
        if (column instanceof ColumnMetadata) {
            c += " " + this.driver.normalizeType(column);
        }
        else {
            c += " " + this.connection.driver.createFullType(column);
        }
        if (column.enum)
            c += " CHECK( " + column.name + " IN (" + column.enum.map(function (val) { return "'" + val + "'"; }).join(",") + ") )";
        if (column.isPrimary && !skipPrimary)
            c += " PRIMARY KEY";
        if (column.isGenerated === true && column.generationStrategy === "increment") // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " AUTOINCREMENT";
        if (column.collation)
            c += " COLLATE " + column.collation;
        if (column.isNullable !== true)
            c += " NOT NULL";
        if (column.default !== undefined && column.default !== null)
            c += " DEFAULT (" + column.default + ")";
        return c;
    };
    AbstractSqliteQueryRunner.prototype.recreateTable = function (newTable, oldTable, migrateData) {
        if (migrateData === void 0) { migrateData = true; }
        return __awaiter(this, void 0, void 0, function () {
            var upQueries, downQueries, newColumnNames, oldColumnNames;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        upQueries = [];
                        downQueries = [];
                        // drop old table indices
                        oldTable.indices.forEach(function (index) {
                            upQueries.push(_this.dropIndexSql(index));
                            downQueries.push(_this.createIndexSql(oldTable, index));
                        });
                        // change table name into 'temporary_table'
                        newTable.name = "temporary_" + newTable.name;
                        // create new table
                        upQueries.push(this.createTableSql(newTable, true));
                        downQueries.push(this.dropTableSql(newTable));
                        // migrate all data from the old table into new table
                        if (migrateData) {
                            newColumnNames = newTable.columns.map(function (column) { return "\"" + column.name + "\""; }).join(", ");
                            oldColumnNames = oldTable.columns.map(function (column) { return "\"" + column.name + "\""; }).join(", ");
                            if (oldTable.columns.length < newTable.columns.length) {
                                newColumnNames = newTable.columns.filter(function (column) {
                                    return oldTable.columns.find(function (c) { return c.name === column.name; });
                                }).map(function (column) { return "\"" + column.name + "\""; }).join(", ");
                            }
                            else if (oldTable.columns.length > newTable.columns.length) {
                                oldColumnNames = oldTable.columns.filter(function (column) {
                                    return newTable.columns.find(function (c) { return c.name === column.name; });
                                }).map(function (column) { return "\"" + column.name + "\""; }).join(", ");
                            }
                            upQueries.push(new Query("INSERT INTO \"" + newTable.name + "\"(" + newColumnNames + ") SELECT " + oldColumnNames + " FROM \"" + oldTable.name + "\""));
                            downQueries.push(new Query("INSERT INTO \"" + oldTable.name + "\"(" + oldColumnNames + ") SELECT " + newColumnNames + " FROM \"" + newTable.name + "\""));
                        }
                        // drop old table
                        upQueries.push(this.dropTableSql(oldTable));
                        downQueries.push(this.createTableSql(oldTable, true));
                        // rename old table
                        upQueries.push(new Query("ALTER TABLE \"" + newTable.name + "\" RENAME TO \"" + oldTable.name + "\""));
                        downQueries.push(new Query("ALTER TABLE \"" + oldTable.name + "\" RENAME TO \"" + newTable.name + "\""));
                        newTable.name = oldTable.name;
                        // recreate table indices
                        newTable.indices.forEach(function (index) {
                            // new index may be passed without name. In this case we generate index name manually.
                            if (!index.name)
                                index.name = _this.connection.namingStrategy.indexName(newTable.name, index.columnNames, index.where);
                            upQueries.push(_this.createIndexSql(newTable, index));
                            downQueries.push(_this.dropIndexSql(index));
                        });
                        return [4 /*yield*/, this.executeQueries(upQueries, downQueries)];
                    case 1:
                        _a.sent();
                        this.replaceCachedTable(oldTable, newTable);
                        return [2 /*return*/];
                }
            });
        });
    };
    return AbstractSqliteQueryRunner;
}(BaseQueryRunner));
export { AbstractSqliteQueryRunner };

//# sourceMappingURL=AbstractSqliteQueryRunner.js.map
