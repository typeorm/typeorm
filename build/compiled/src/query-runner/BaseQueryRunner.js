"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseQueryRunner = void 0;
const tslib_1 = require("tslib");
const Query_1 = require("../driver/Query");
const SqlInMemory_1 = require("../driver/SqlInMemory");
class BaseQueryRunner {
    constructor() {
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
    getTable(tablePath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.loadedTables = yield this.loadTables([tablePath]);
            return this.loadedTables.length > 0 ? this.loadedTables[0] : undefined;
        });
    }
    /**
     * Loads all tables (with given names) from the database.
     */
    getTables(tableNames) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.loadedTables = yield this.loadTables(tableNames);
            return this.loadedTables;
        });
    }
    /**
     * Loads given view's data from the database.
     */
    getView(viewPath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.loadedViews = yield this.loadViews([viewPath]);
            return this.loadedViews.length > 0 ? this.loadedViews[0] : undefined;
        });
    }
    /**
     * Loads given view's data from the database.
     */
    getViews(viewPaths) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.loadedViews = yield this.loadViews(viewPaths);
            return this.loadedViews;
        });
    }
    /**
     * Enables special query runner mode in which sql queries won't be executed,
     * instead they will be memorized into a special variable inside query runner.
     * You can get memorized sql using getMemorySql() method.
     */
    enableSqlMemory() {
        this.sqlInMemory = new SqlInMemory_1.SqlInMemory();
        this.sqlMemoryMode = true;
    }
    /**
     * Disables special query runner mode in which sql queries won't be executed
     * started by calling enableSqlMemory() method.
     *
     * Previously memorized sql will be flushed.
     */
    disableSqlMemory() {
        this.sqlInMemory = new SqlInMemory_1.SqlInMemory();
        this.sqlMemoryMode = false;
    }
    /**
     * Flushes all memorized sqls.
     */
    clearSqlMemory() {
        this.sqlInMemory = new SqlInMemory_1.SqlInMemory();
    }
    /**
     * Gets sql stored in the memory. Parameters in the sql are already replaced.
     */
    getMemorySql() {
        return this.sqlInMemory;
    }
    /**
     * Executes up sql queries.
     */
    executeMemoryUpSql() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const { query, parameters } of this.sqlInMemory.upQueries) {
                yield this.query(query, parameters);
            }
        });
    }
    /**
     * Executes down sql queries.
     */
    executeMemoryDownSql() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const { query, parameters } of this.sqlInMemory.downQueries.reverse()) {
                yield this.query(query, parameters);
            }
        });
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Gets view from previously loaded views, otherwise loads it from database.
     */
    getCachedView(viewName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const view = this.loadedViews.find(view => view.name === viewName);
            if (view)
                return view;
            const foundViews = yield this.loadViews([viewName]);
            if (foundViews.length > 0) {
                this.loadedViews.push(foundViews[0]);
                return foundViews[0];
            }
            else {
                throw new Error(`View "${viewName}" does not exist.`);
            }
        });
    }
    /**
     * Gets table from previously loaded tables, otherwise loads it from database.
     */
    getCachedTable(tableName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = this.loadedTables.find(table => table.name === tableName);
            if (table)
                return table;
            const foundTables = yield this.loadTables([tableName]);
            if (foundTables.length > 0) {
                this.loadedTables.push(foundTables[0]);
                return foundTables[0];
            }
            else {
                throw new Error(`Table "${tableName}" does not exist.`);
            }
        });
    }
    /**
     * Replaces loaded table with given changed table.
     */
    replaceCachedTable(table, changedTable) {
        const foundTable = this.loadedTables.find(loadedTable => loadedTable.name === table.name);
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
    }
    getTypeormMetadataTableName() {
        const options = this.connection.driver.options;
        return this.connection.driver.buildTableName("typeorm_metadata", options.schema, options.database);
    }
    /**
     * Checks if at least one of column properties was changed.
     * Does not checks column type, length and autoincrement, because these properties changes separately.
     */
    isColumnChanged(oldColumn, newColumn, checkDefault, checkComment) {
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
    }
    /**
     * Checks if column length is by default.
     */
    isDefaultColumnLength(table, column, length) {
        // if table have metadata, we check if length is specified in column metadata
        if (this.connection.hasMetadata(table.name)) {
            const metadata = this.connection.getMetadata(table.name);
            const columnMetadata = metadata.findColumnWithDatabaseName(column.name);
            if (columnMetadata && columnMetadata.length)
                return false;
        }
        if (this.connection.driver.dataTypeDefaults
            && this.connection.driver.dataTypeDefaults[column.type]
            && this.connection.driver.dataTypeDefaults[column.type].length) {
            return this.connection.driver.dataTypeDefaults[column.type].length.toString() === length.toString();
        }
        return false;
    }
    /**
     * Checks if column precision is by default.
     */
    isDefaultColumnPrecision(table, column, precision) {
        // if table have metadata, we check if length is specified in column metadata
        if (this.connection.hasMetadata(table.name)) {
            const metadata = this.connection.getMetadata(table.name);
            const columnMetadata = metadata.findColumnWithDatabaseName(column.name);
            if (columnMetadata && columnMetadata.precision !== null && columnMetadata.precision !== undefined)
                return false;
        }
        if (this.connection.driver.dataTypeDefaults
            && this.connection.driver.dataTypeDefaults[column.type]
            && this.connection.driver.dataTypeDefaults[column.type].precision !== null
            && this.connection.driver.dataTypeDefaults[column.type].precision !== undefined)
            return this.connection.driver.dataTypeDefaults[column.type].precision === precision;
        return false;
    }
    /**
     * Checks if column scale is by default.
     */
    isDefaultColumnScale(table, column, scale) {
        // if table have metadata, we check if length is specified in column metadata
        if (this.connection.hasMetadata(table.name)) {
            const metadata = this.connection.getMetadata(table.name);
            const columnMetadata = metadata.findColumnWithDatabaseName(column.name);
            if (columnMetadata && columnMetadata.scale !== null && columnMetadata.scale !== undefined)
                return false;
        }
        if (this.connection.driver.dataTypeDefaults
            && this.connection.driver.dataTypeDefaults[column.type]
            && this.connection.driver.dataTypeDefaults[column.type].scale !== null
            && this.connection.driver.dataTypeDefaults[column.type].scale !== undefined)
            return this.connection.driver.dataTypeDefaults[column.type].scale === scale;
        return false;
    }
    /**
     * Executes sql used special for schema build.
     */
    executeQueries(upQueries, downQueries) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (upQueries instanceof Query_1.Query)
                upQueries = [upQueries];
            if (downQueries instanceof Query_1.Query)
                downQueries = [downQueries];
            this.sqlInMemory.upQueries.push(...upQueries);
            this.sqlInMemory.downQueries.push(...downQueries);
            // if sql-in-memory mode is enabled then simply store sql in memory and return
            if (this.sqlMemoryMode === true)
                return Promise.resolve();
            for (const { query, parameters } of upQueries) {
                yield this.query(query, parameters);
            }
        });
    }
}
exports.BaseQueryRunner = BaseQueryRunner;
//# sourceMappingURL=BaseQueryRunner.js.map