"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Query_1 = require("../driver/Query");
var SqlInMemory_1 = require("../driver/SqlInMemory");
var PromiseUtils_1 = require("../util/PromiseUtils");
var BaseQueryRunner = /** @class */ (function () {
    function BaseQueryRunner() {
        // -------------------------------------------------------------------------
        // Public Properties
        // -------------------------------------------------------------------------
        /**
         * Indicates if connection for this query runner is released.
         * Once its released, query runner cannot run queries anymore.
         */
        this.isReleased = false;
        /**
         * Indicates if transaction is in progress.
         */
        this.isTransactionActive = false;
        /**
         * Stores temporarily user data.
         * Useful for sharing data with subscribers.
         */
        this.data = {};
        /**
         * All synchronized tables in the database.
         */
        this.loadedTables = [];
        /**
         * All synchronized views in the database.
         */
        this.loadedViews = [];
        /**
         * Indicates if special query runner mode in which sql queries won't be executed is enabled.
         */
        this.sqlMemoryMode = false;
        /**
         * Sql-s stored if "sql in memory" mode is enabled.
         */
        this.sqlInMemory = new SqlInMemory_1.SqlInMemory();
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Loads given table's data from the database.
     */
    BaseQueryRunner.prototype.getTable = function (tablePath) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, this.loadTables([tablePath])];
                    case 1:
                        _a.loadedTables = _b.sent();
                        return [2 /*return*/, this.loadedTables.length > 0 ? this.loadedTables[0] : undefined];
                }
            });
        });
    };
    /**
     * Loads all tables (with given names) from the database.
     */
    BaseQueryRunner.prototype.getTables = function (tableNames) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, this.loadTables(tableNames)];
                    case 1:
                        _a.loadedTables = _b.sent();
                        return [2 /*return*/, this.loadedTables];
                }
            });
        });
    };
    /**
     * Loads given view's data from the database.
     */
    BaseQueryRunner.prototype.getView = function (viewPath) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, this.loadViews([viewPath])];
                    case 1:
                        _a.loadedViews = _b.sent();
                        return [2 /*return*/, this.loadedViews.length > 0 ? this.loadedViews[0] : undefined];
                }
            });
        });
    };
    /**
     * Loads given view's data from the database.
     */
    BaseQueryRunner.prototype.getViews = function (viewPaths) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, this.loadViews(viewPaths)];
                    case 1:
                        _a.loadedViews = _b.sent();
                        return [2 /*return*/, this.loadedViews];
                }
            });
        });
    };
    /**
     * Enables special query runner mode in which sql queries won't be executed,
     * instead they will be memorized into a special variable inside query runner.
     * You can get memorized sql using getMemorySql() method.
     */
    BaseQueryRunner.prototype.enableSqlMemory = function () {
        this.sqlInMemory = new SqlInMemory_1.SqlInMemory();
        this.sqlMemoryMode = true;
    };
    /**
     * Disables special query runner mode in which sql queries won't be executed
     * started by calling enableSqlMemory() method.
     *
     * Previously memorized sql will be flushed.
     */
    BaseQueryRunner.prototype.disableSqlMemory = function () {
        this.sqlInMemory = new SqlInMemory_1.SqlInMemory();
        this.sqlMemoryMode = false;
    };
    /**
     * Flushes all memorized sqls.
     */
    BaseQueryRunner.prototype.clearSqlMemory = function () {
        this.sqlInMemory = new SqlInMemory_1.SqlInMemory();
    };
    /**
     * Gets sql stored in the memory. Parameters in the sql are already replaced.
     */
    BaseQueryRunner.prototype.getMemorySql = function () {
        return this.sqlInMemory;
    };
    /**
     * Executes up sql queries.
     */
    BaseQueryRunner.prototype.executeMemoryUpSql = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(this.sqlInMemory.upQueries, function (upQuery) { return _this.query(upQuery.query, upQuery.parameters); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Executes down sql queries.
     */
    BaseQueryRunner.prototype.executeMemoryDownSql = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(this.sqlInMemory.downQueries.reverse(), function (downQuery) { return _this.query(downQuery.query, downQuery.parameters); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Gets view from previously loaded views, otherwise loads it from database.
     */
    BaseQueryRunner.prototype.getCachedView = function (viewName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var view, foundViews;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        view = this.loadedViews.find(function (view) { return view.name === viewName; });
                        if (view)
                            return [2 /*return*/, view];
                        return [4 /*yield*/, this.loadViews([viewName])];
                    case 1:
                        foundViews = _a.sent();
                        if (foundViews.length > 0) {
                            this.loadedViews.push(foundViews[0]);
                            return [2 /*return*/, foundViews[0]];
                        }
                        else {
                            throw new Error("View \"" + viewName + "\" does not exist.");
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets table from previously loaded tables, otherwise loads it from database.
     */
    BaseQueryRunner.prototype.getCachedTable = function (tableName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var table, foundTables;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        table = this.loadedTables.find(function (table) { return table.name === tableName; });
                        if (table)
                            return [2 /*return*/, table];
                        return [4 /*yield*/, this.loadTables([tableName])];
                    case 1:
                        foundTables = _a.sent();
                        if (foundTables.length > 0) {
                            this.loadedTables.push(foundTables[0]);
                            return [2 /*return*/, foundTables[0]];
                        }
                        else {
                            throw new Error("Table \"" + tableName + "\" does not exist.");
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Replaces loaded table with given changed table.
     */
    BaseQueryRunner.prototype.replaceCachedTable = function (table, changedTable) {
        var foundTable = this.loadedTables.find(function (loadedTable) { return loadedTable.name === table.name; });
        if (foundTable) {
            foundTable.name = changedTable.name;
            foundTable.columns = changedTable.columns;
            foundTable.indices = changedTable.indices;
            foundTable.foreignKeys = changedTable.foreignKeys;
            foundTable.uniques = changedTable.uniques;
            foundTable.checks = changedTable.checks;
            foundTable.justCreated = changedTable.justCreated;
            foundTable.engine = changedTable.engine;
        }
    };
    BaseQueryRunner.prototype.getTypeormMetadataTableName = function () {
        var options = this.connection.driver.options;
        return this.connection.driver.buildTableName("typeorm_metadata", options.schema, options.database);
    };
    /**
     * Checks if at least one of column properties was changed.
     * Does not checks column type, length and autoincrement, because these properties changes separately.
     */
    BaseQueryRunner.prototype.isColumnChanged = function (oldColumn, newColumn, checkDefault, checkComment) {
        // this logs need to debug issues in column change detection. Do not delete it!
        // console.log("charset ---------------");
        // console.log(oldColumn.charset !== newColumn.charset);
        // console.log(oldColumn.charset, newColumn.charset);
        // console.log("collation ---------------");
        // console.log(oldColumn.collation !== newColumn.collation);
        // console.log(oldColumn.collation, newColumn.collation);
        // console.log("precision ---------------");
        // console.log(oldColumn.precision !== newColumn.precision);
        // console.log(oldColumn.precision, newColumn.precision);
        // console.log("scale ---------------");
        // console.log(oldColumn.scale !== newColumn.scale);
        // console.log(oldColumn.scale, newColumn.scale);
        // console.log("default ---------------");
        // console.log((checkDefault && oldColumn.default !== newColumn.default));
        // console.log(oldColumn.default, newColumn.default);
        // console.log("isNullable ---------------");
        // console.log(oldColumn.isNullable !== newColumn.isNullable);
        // console.log(oldColumn.isNullable, newColumn.isNullable);
        // console.log("comment ---------------");
        // console.log((checkComment && oldColumn.comment !== newColumn.comment));
        // console.log(oldColumn.comment, newColumn.comment);
        // console.log("enum ---------------");
        // console.log(oldColumn.enum !== newColumn.enum);
        // console.log(oldColumn.enum, newColumn.enum);
        return oldColumn.charset !== newColumn.charset
            || oldColumn.collation !== newColumn.collation
            || oldColumn.precision !== newColumn.precision
            || oldColumn.scale !== newColumn.scale
            || oldColumn.width !== newColumn.width // MySQL only
            || oldColumn.zerofill !== newColumn.zerofill // MySQL only
            || oldColumn.unsigned !== newColumn.unsigned // MySQL only
            || oldColumn.asExpression !== newColumn.asExpression // MySQL only
            || (checkDefault && oldColumn.default !== newColumn.default)
            || oldColumn.onUpdate !== newColumn.onUpdate // MySQL only
            || oldColumn.isNullable !== newColumn.isNullable
            || (checkComment && oldColumn.comment !== newColumn.comment)
            || oldColumn.enum !== newColumn.enum;
    };
    /**
     * Checks if column length is by default.
     */
    BaseQueryRunner.prototype.isDefaultColumnLength = function (table, column, length) {
        // if table have metadata, we check if length is specified in column metadata
        if (this.connection.hasMetadata(table.name)) {
            var metadata = this.connection.getMetadata(table.name);
            var columnMetadata = metadata.findColumnWithDatabaseName(column.name);
            if (columnMetadata && columnMetadata.length)
                return false;
        }
        if (this.connection.driver.dataTypeDefaults
            && this.connection.driver.dataTypeDefaults[column.type]
            && this.connection.driver.dataTypeDefaults[column.type].length) {
            return this.connection.driver.dataTypeDefaults[column.type].length.toString() === length.toString();
        }
        return false;
    };
    /**
     * Checks if column display width is by default. Used only for MySQL.
     */
    BaseQueryRunner.prototype.isDefaultColumnWidth = function (table, column, width) {
        // if table have metadata, we check if length is specified in column metadata
        if (this.connection.hasMetadata(table.name)) {
            var metadata = this.connection.getMetadata(table.name);
            var columnMetadata = metadata.findColumnWithDatabaseName(column.name);
            if (columnMetadata && columnMetadata.width)
                return false;
        }
        if (this.connection.driver.dataTypeDefaults
            && this.connection.driver.dataTypeDefaults[column.type]
            && this.connection.driver.dataTypeDefaults[column.type].width) {
            return this.connection.driver.dataTypeDefaults[column.type].width === width;
        }
        return false;
    };
    /**
     * Checks if column precision is by default.
     */
    BaseQueryRunner.prototype.isDefaultColumnPrecision = function (table, column, precision) {
        // if table have metadata, we check if length is specified in column metadata
        if (this.connection.hasMetadata(table.name)) {
            var metadata = this.connection.getMetadata(table.name);
            var columnMetadata = metadata.findColumnWithDatabaseName(column.name);
            if (columnMetadata && columnMetadata.precision !== null && columnMetadata.precision !== undefined)
                return false;
        }
        if (this.connection.driver.dataTypeDefaults
            && this.connection.driver.dataTypeDefaults[column.type]
            && this.connection.driver.dataTypeDefaults[column.type].precision !== null
            && this.connection.driver.dataTypeDefaults[column.type].precision !== undefined)
            return this.connection.driver.dataTypeDefaults[column.type].precision === precision;
        return false;
    };
    /**
     * Checks if column scale is by default.
     */
    BaseQueryRunner.prototype.isDefaultColumnScale = function (table, column, scale) {
        // if table have metadata, we check if length is specified in column metadata
        if (this.connection.hasMetadata(table.name)) {
            var metadata = this.connection.getMetadata(table.name);
            var columnMetadata = metadata.findColumnWithDatabaseName(column.name);
            if (columnMetadata && columnMetadata.scale !== null && columnMetadata.scale !== undefined)
                return false;
        }
        if (this.connection.driver.dataTypeDefaults
            && this.connection.driver.dataTypeDefaults[column.type]
            && this.connection.driver.dataTypeDefaults[column.type].scale !== null
            && this.connection.driver.dataTypeDefaults[column.type].scale !== undefined)
            return this.connection.driver.dataTypeDefaults[column.type].scale === scale;
        return false;
    };
    /**
     * Executes sql used special for schema build.
     */
    BaseQueryRunner.prototype.executeQueries = function (upQueries, downQueries) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, _b;
            var _this = this;
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (upQueries instanceof Query_1.Query)
                            upQueries = [upQueries];
                        if (downQueries instanceof Query_1.Query)
                            downQueries = [downQueries];
                        (_a = this.sqlInMemory.upQueries).push.apply(_a, tslib_1.__spread(upQueries));
                        (_b = this.sqlInMemory.downQueries).push.apply(_b, tslib_1.__spread(downQueries));
                        // if sql-in-memory mode is enabled then simply store sql in memory and return
                        if (this.sqlMemoryMode === true)
                            return [2 /*return*/, Promise.resolve()];
                        return [4 /*yield*/, PromiseUtils_1.PromiseUtils.runInSequence(upQueries, function (upQuery) { return _this.query(upQuery.query, upQuery.parameters); })];
                    case 1:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return BaseQueryRunner;
}());
exports.BaseQueryRunner = BaseQueryRunner;
//# sourceMappingURL=BaseQueryRunner.js.map