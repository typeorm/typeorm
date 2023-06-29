"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractSqliteQueryRunner = void 0;
const tslib_1 = require("tslib");
const TransactionAlreadyStartedError_1 = require("../../error/TransactionAlreadyStartedError");
const TransactionNotStartedError_1 = require("../../error/TransactionNotStartedError");
const TableColumn_1 = require("../../schema-builder/table/TableColumn");
const ColumnMetadata_1 = require("../../metadata/ColumnMetadata");
const Table_1 = require("../../schema-builder/table/Table");
const TableIndex_1 = require("../../schema-builder/table/TableIndex");
const TableForeignKey_1 = require("../../schema-builder/table/TableForeignKey");
const View_1 = require("../../schema-builder/view/View");
const BroadcasterResult_1 = require("../../subscriber/BroadcasterResult");
const Query_1 = require("../Query");
const TableUnique_1 = require("../../schema-builder/table/TableUnique");
const BaseQueryRunner_1 = require("../../query-runner/BaseQueryRunner");
const OrmUtils_1 = require("../../util/OrmUtils");
const TableCheck_1 = require("../../schema-builder/table/TableCheck");
/**
 * Runs queries on a single sqlite database connection.
 */
class AbstractSqliteQueryRunner extends BaseQueryRunner_1.BaseQueryRunner {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor() {
        super();
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates/uses database connection from the connection pool to perform further operations.
     * Returns obtained database connection.
     */
    connect() {
        return Promise.resolve(this.driver.databaseConnection);
    }
    /**
     * Releases used database connection.
     * We just clear loaded tables and sql in memory, because sqlite do not support multiple connections thus query runners.
     */
    release() {
        this.loadedTables = [];
        this.clearSqlMemory();
        return Promise.resolve();
    }
    /**
     * Starts transaction.
     */
    startTransaction(isolationLevel) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.isTransactionActive)
                throw new TransactionAlreadyStartedError_1.TransactionAlreadyStartedError();
            if (isolationLevel) {
                if (isolationLevel !== "READ UNCOMMITTED" && isolationLevel !== "SERIALIZABLE") {
                    throw new Error(`SQLite only supports SERIALIZABLE and READ UNCOMMITTED isolation`);
                }
                if (isolationLevel === "READ UNCOMMITTED") {
                    yield this.query("PRAGMA read_uncommitted = true");
                }
                else {
                    yield this.query("PRAGMA read_uncommitted = false");
                }
            }
            const beforeBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
            this.broadcaster.broadcastBeforeTransactionStartEvent(beforeBroadcastResult);
            if (beforeBroadcastResult.promises.length > 0)
                yield Promise.all(beforeBroadcastResult.promises);
            this.isTransactionActive = true;
            yield this.query("BEGIN TRANSACTION");
            const afterBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
            this.broadcaster.broadcastAfterTransactionStartEvent(afterBroadcastResult);
            if (afterBroadcastResult.promises.length > 0)
                yield Promise.all(afterBroadcastResult.promises);
        });
    }
    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    commitTransaction() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.isTransactionActive)
                throw new TransactionNotStartedError_1.TransactionNotStartedError();
            const beforeBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
            this.broadcaster.broadcastBeforeTransactionCommitEvent(beforeBroadcastResult);
            if (beforeBroadcastResult.promises.length > 0)
                yield Promise.all(beforeBroadcastResult.promises);
            yield this.query("COMMIT");
            this.isTransactionActive = false;
            const afterBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
            this.broadcaster.broadcastAfterTransactionCommitEvent(afterBroadcastResult);
            if (afterBroadcastResult.promises.length > 0)
                yield Promise.all(afterBroadcastResult.promises);
        });
    }
    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    rollbackTransaction() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.isTransactionActive)
                throw new TransactionNotStartedError_1.TransactionNotStartedError();
            const beforeBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
            this.broadcaster.broadcastBeforeTransactionRollbackEvent(beforeBroadcastResult);
            if (beforeBroadcastResult.promises.length > 0)
                yield Promise.all(beforeBroadcastResult.promises);
            yield this.query("ROLLBACK");
            this.isTransactionActive = false;
            const afterBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
            this.broadcaster.broadcastAfterTransactionRollbackEvent(afterBroadcastResult);
            if (afterBroadcastResult.promises.length > 0)
                yield Promise.all(afterBroadcastResult.promises);
        });
    }
    /**
     * Returns raw data stream.
     */
    stream(query, parameters, onEnd, onError) {
        throw new Error(`Stream is not supported by sqlite driver.`);
    }
    /**
     * Returns all available database names including system databases.
     */
    getDatabases() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return Promise.resolve([]);
        });
    }
    /**
     * Returns all available schema names including system schemas.
     * If database parameter specified, returns schemas of that database.
     */
    getSchemas(database) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return Promise.resolve([]);
        });
    }
    /**
     * Checks if database with the given name exist.
     */
    hasDatabase(database) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return Promise.resolve(false);
        });
    }
    /**
     * Checks if schema with the given name exist.
     */
    hasSchema(schema) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`This driver does not support table schemas`);
        });
    }
    /**
     * Checks if table with the given name exist in the database.
     */
    hasTable(tableOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const tableName = tableOrName instanceof Table_1.Table ? tableOrName.name : tableOrName;
            const sql = `SELECT * FROM "sqlite_master" WHERE "type" = 'table' AND "name" = '${tableName}'`;
            const result = yield this.query(sql);
            return result.length ? true : false;
        });
    }
    /**
     * Checks if column with the given name exist in the given table.
     */
    hasColumn(tableOrName, columnName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const tableName = tableOrName instanceof Table_1.Table ? tableOrName.name : tableOrName;
            const sql = `PRAGMA table_info("${tableName}")`;
            const columns = yield this.query(sql);
            return !!columns.find(column => column["name"] === columnName);
        });
    }
    /**
     * Creates a new database.
     */
    createDatabase(database, ifNotExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return Promise.resolve();
        });
    }
    /**
     * Drops database.
     */
    dropDatabase(database, ifExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return Promise.resolve();
        });
    }
    /**
     * Creates a new table schema.
     */
    createSchema(schema, ifNotExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return Promise.resolve();
        });
    }
    /**
     * Drops table schema.
     */
    dropSchema(schemaPath, ifExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return Promise.resolve();
        });
    }
    /**
     * Creates a new table.
     */
    createTable(table, ifNotExist = false, createForeignKeys = true, createIndices = true) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const upQueries = [];
            const downQueries = [];
            if (ifNotExist) {
                const isTableExist = yield this.hasTable(table);
                if (isTableExist)
                    return Promise.resolve();
            }
            upQueries.push(this.createTableSql(table, createForeignKeys));
            downQueries.push(this.dropTableSql(table));
            if (createIndices) {
                table.indices.forEach(index => {
                    // new index may be passed without name. In this case we generate index name manually.
                    if (!index.name)
                        index.name = this.connection.namingStrategy.indexName(table.name, index.columnNames, index.where);
                    upQueries.push(this.createIndexSql(table, index));
                    downQueries.push(this.dropIndexSql(index));
                });
            }
            yield this.executeQueries(upQueries, downQueries);
        });
    }
    /**
     * Drops the table.
     */
    dropTable(tableOrName, ifExist, dropForeignKeys = true, dropIndices = true) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (ifExist) {
                const isTableExist = yield this.hasTable(tableOrName);
                if (!isTableExist)
                    return Promise.resolve();
            }
            // if dropTable called with dropForeignKeys = true, we must create foreign keys in down query.
            const createForeignKeys = dropForeignKeys;
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const upQueries = [];
            const downQueries = [];
            if (dropIndices) {
                table.indices.forEach(index => {
                    upQueries.push(this.dropIndexSql(index));
                    downQueries.push(this.createIndexSql(table, index));
                });
            }
            upQueries.push(this.dropTableSql(table, ifExist));
            downQueries.push(this.createTableSql(table, createForeignKeys));
            yield this.executeQueries(upQueries, downQueries);
        });
    }
    /**
     * Creates a new view.
     */
    createView(view) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const upQueries = [];
            const downQueries = [];
            upQueries.push(this.createViewSql(view));
            upQueries.push(this.insertViewDefinitionSql(view));
            downQueries.push(this.dropViewSql(view));
            downQueries.push(this.deleteViewDefinitionSql(view));
            yield this.executeQueries(upQueries, downQueries);
        });
    }
    /**
     * Drops the view.
     */
    dropView(target) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const viewName = target instanceof View_1.View ? target.name : target;
            const view = yield this.getCachedView(viewName);
            const upQueries = [];
            const downQueries = [];
            upQueries.push(this.deleteViewDefinitionSql(view));
            upQueries.push(this.dropViewSql(view));
            downQueries.push(this.insertViewDefinitionSql(view));
            downQueries.push(this.createViewSql(view));
            yield this.executeQueries(upQueries, downQueries);
        });
    }
    /**
     * Renames the given table.
     */
    renameTable(oldTableOrName, newTableName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const oldTable = oldTableOrName instanceof Table_1.Table ? oldTableOrName : yield this.getCachedTable(oldTableOrName);
            const newTable = oldTable.clone();
            newTable.name = newTableName;
            // rename table
            const up = new Query_1.Query(`ALTER TABLE "${oldTable.name}" RENAME TO "${newTableName}"`);
            const down = new Query_1.Query(`ALTER TABLE "${newTableName}" RENAME TO "${oldTable.name}"`);
            yield this.executeQueries(up, down);
            // rename old table;
            oldTable.name = newTable.name;
            // rename unique constraints
            newTable.uniques.forEach(unique => {
                unique.name = this.connection.namingStrategy.uniqueConstraintName(newTable, unique.columnNames);
            });
            // rename foreign key constraints
            newTable.foreignKeys.forEach(foreignKey => {
                foreignKey.name = this.connection.namingStrategy.foreignKeyName(newTable, foreignKey.columnNames, foreignKey.referencedTableName, foreignKey.referencedColumnNames);
            });
            // rename indices
            newTable.indices.forEach(index => {
                index.name = this.connection.namingStrategy.indexName(newTable, index.columnNames, index.where);
            });
            // recreate table with new constraint names
            yield this.recreateTable(newTable, oldTable);
        });
    }
    /**
     * Creates a new column from the column in the table.
     */
    addColumn(tableOrName, column) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            return this.addColumns(table, [column]);
        });
    }
    /**
     * Creates a new columns from the column in the table.
     */
    addColumns(tableOrName, columns) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const changedTable = table.clone();
            columns.forEach(column => changedTable.addColumn(column));
            yield this.recreateTable(changedTable, table);
        });
    }
    /**
     * Renames column in the given table.
     */
    renameColumn(tableOrName, oldTableColumnOrName, newTableColumnOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const oldColumn = oldTableColumnOrName instanceof TableColumn_1.TableColumn ? oldTableColumnOrName : table.columns.find(c => c.name === oldTableColumnOrName);
            if (!oldColumn)
                throw new Error(`Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`);
            let newColumn = undefined;
            if (newTableColumnOrName instanceof TableColumn_1.TableColumn) {
                newColumn = newTableColumnOrName;
            }
            else {
                newColumn = oldColumn.clone();
                newColumn.name = newTableColumnOrName;
            }
            return this.changeColumn(table, oldColumn, newColumn);
        });
    }
    /**
     * Changes a column in the table.
     */
    changeColumn(tableOrName, oldTableColumnOrName, newColumn) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const oldColumn = oldTableColumnOrName instanceof TableColumn_1.TableColumn ? oldTableColumnOrName : table.columns.find(c => c.name === oldTableColumnOrName);
            if (!oldColumn)
                throw new Error(`Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`);
            yield this.changeColumns(table, [{ oldColumn, newColumn }]);
        });
    }
    /**
     * Changes a column in the table.
     * Changed column looses all its keys in the db.
     */
    changeColumns(tableOrName, changedColumns) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const changedTable = table.clone();
            changedColumns.forEach(changedColumnSet => {
                if (changedColumnSet.newColumn.name !== changedColumnSet.oldColumn.name) {
                    changedTable.findColumnUniques(changedColumnSet.oldColumn).forEach(unique => {
                        unique.columnNames.splice(unique.columnNames.indexOf(changedColumnSet.oldColumn.name), 1);
                        unique.columnNames.push(changedColumnSet.newColumn.name);
                        unique.name = this.connection.namingStrategy.uniqueConstraintName(changedTable, unique.columnNames);
                    });
                    changedTable.findColumnForeignKeys(changedColumnSet.oldColumn).forEach(fk => {
                        fk.columnNames.splice(fk.columnNames.indexOf(changedColumnSet.oldColumn.name), 1);
                        fk.columnNames.push(changedColumnSet.newColumn.name);
                        fk.name = this.connection.namingStrategy.foreignKeyName(changedTable, fk.columnNames, fk.referencedTableName, fk.referencedColumnNames);
                    });
                    changedTable.findColumnIndices(changedColumnSet.oldColumn).forEach(index => {
                        index.columnNames.splice(index.columnNames.indexOf(changedColumnSet.oldColumn.name), 1);
                        index.columnNames.push(changedColumnSet.newColumn.name);
                        index.name = this.connection.namingStrategy.indexName(changedTable, index.columnNames, index.where);
                    });
                }
                const originalColumn = changedTable.columns.find(column => column.name === changedColumnSet.oldColumn.name);
                if (originalColumn)
                    changedTable.columns[changedTable.columns.indexOf(originalColumn)] = changedColumnSet.newColumn;
            });
            yield this.recreateTable(changedTable, table);
        });
    }
    /**
     * Drops column in the table.
     */
    dropColumn(tableOrName, columnOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const column = columnOrName instanceof TableColumn_1.TableColumn ? columnOrName : table.findColumnByName(columnOrName);
            if (!column)
                throw new Error(`Column "${columnOrName}" was not found in table "${table.name}"`);
            yield this.dropColumns(table, [column]);
        });
    }
    /**
     * Drops the columns in the table.
     */
    dropColumns(tableOrName, columns) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            // clone original table and remove column and its constraints from cloned table
            const changedTable = table.clone();
            columns.forEach(column => {
                changedTable.removeColumn(column);
                changedTable.findColumnUniques(column).forEach(unique => changedTable.removeUniqueConstraint(unique));
                changedTable.findColumnIndices(column).forEach(index => changedTable.removeIndex(index));
                changedTable.findColumnForeignKeys(column).forEach(fk => changedTable.removeForeignKey(fk));
            });
            yield this.recreateTable(changedTable, table);
            // remove column and its constraints from original table.
            columns.forEach(column => {
                table.removeColumn(column);
                table.findColumnUniques(column).forEach(unique => table.removeUniqueConstraint(unique));
                table.findColumnIndices(column).forEach(index => table.removeIndex(index));
                table.findColumnForeignKeys(column).forEach(fk => table.removeForeignKey(fk));
            });
        });
    }
    /**
     * Creates a new primary key.
     */
    createPrimaryKey(tableOrName, columnNames) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            // clone original table and mark columns as primary
            const changedTable = table.clone();
            changedTable.columns.forEach(column => {
                if (columnNames.find(columnName => columnName === column.name))
                    column.isPrimary = true;
            });
            yield this.recreateTable(changedTable, table);
            // mark columns as primary in original table
            table.columns.forEach(column => {
                if (columnNames.find(columnName => columnName === column.name))
                    column.isPrimary = true;
            });
        });
    }
    /**
     * Updates composite primary keys.
     */
    updatePrimaryKeys(tableOrName, columns) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield Promise.resolve();
        });
    }
    /**
     * Drops a primary key.
     */
    dropPrimaryKey(tableOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            // clone original table and mark primary columns as non-primary
            const changedTable = table.clone();
            changedTable.primaryColumns.forEach(column => {
                column.isPrimary = false;
            });
            yield this.recreateTable(changedTable, table);
            // mark primary columns as non-primary in original table
            table.primaryColumns.forEach(column => {
                column.isPrimary = false;
            });
        });
    }
    /**
     * Creates a new unique constraint.
     */
    createUniqueConstraint(tableOrName, uniqueConstraint) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.createUniqueConstraints(tableOrName, [uniqueConstraint]);
        });
    }
    /**
     * Creates a new unique constraints.
     */
    createUniqueConstraints(tableOrName, uniqueConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            // clone original table and add unique constraints in to cloned table
            const changedTable = table.clone();
            uniqueConstraints.forEach(uniqueConstraint => changedTable.addUniqueConstraint(uniqueConstraint));
            yield this.recreateTable(changedTable, table);
        });
    }
    /**
     * Drops an unique constraint.
     */
    dropUniqueConstraint(tableOrName, uniqueOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const uniqueConstraint = uniqueOrName instanceof TableUnique_1.TableUnique ? uniqueOrName : table.uniques.find(u => u.name === uniqueOrName);
            if (!uniqueConstraint)
                throw new Error(`Supplied unique constraint was not found in table ${table.name}`);
            yield this.dropUniqueConstraints(table, [uniqueConstraint]);
        });
    }
    /**
     * Creates an unique constraints.
     */
    dropUniqueConstraints(tableOrName, uniqueConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            // clone original table and remove unique constraints from cloned table
            const changedTable = table.clone();
            uniqueConstraints.forEach(uniqueConstraint => changedTable.removeUniqueConstraint(uniqueConstraint));
            yield this.recreateTable(changedTable, table);
        });
    }
    /**
     * Creates new check constraint.
     */
    createCheckConstraint(tableOrName, checkConstraint) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.createCheckConstraints(tableOrName, [checkConstraint]);
        });
    }
    /**
     * Creates new check constraints.
     */
    createCheckConstraints(tableOrName, checkConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            // clone original table and add check constraints in to cloned table
            const changedTable = table.clone();
            checkConstraints.forEach(checkConstraint => changedTable.addCheckConstraint(checkConstraint));
            yield this.recreateTable(changedTable, table);
        });
    }
    /**
     * Drops check constraint.
     */
    dropCheckConstraint(tableOrName, checkOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const checkConstraint = checkOrName instanceof TableCheck_1.TableCheck ? checkOrName : table.checks.find(c => c.name === checkOrName);
            if (!checkConstraint)
                throw new Error(`Supplied check constraint was not found in table ${table.name}`);
            yield this.dropCheckConstraints(table, [checkConstraint]);
        });
    }
    /**
     * Drops check constraints.
     */
    dropCheckConstraints(tableOrName, checkConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            // clone original table and remove check constraints from cloned table
            const changedTable = table.clone();
            checkConstraints.forEach(checkConstraint => changedTable.removeCheckConstraint(checkConstraint));
            yield this.recreateTable(changedTable, table);
        });
    }
    /**
     * Creates a new exclusion constraint.
     */
    createExclusionConstraint(tableOrName, exclusionConstraint) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Sqlite does not support exclusion constraints.`);
        });
    }
    /**
     * Creates a new exclusion constraints.
     */
    createExclusionConstraints(tableOrName, exclusionConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Sqlite does not support exclusion constraints.`);
        });
    }
    /**
     * Drops exclusion constraint.
     */
    dropExclusionConstraint(tableOrName, exclusionOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Sqlite does not support exclusion constraints.`);
        });
    }
    /**
     * Drops exclusion constraints.
     */
    dropExclusionConstraints(tableOrName, exclusionConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Sqlite does not support exclusion constraints.`);
        });
    }
    /**
     * Creates a new foreign key.
     */
    createForeignKey(tableOrName, foreignKey) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.createForeignKeys(tableOrName, [foreignKey]);
        });
    }
    /**
     * Creates a new foreign keys.
     */
    createForeignKeys(tableOrName, foreignKeys) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            // clone original table and add foreign keys in to cloned table
            const changedTable = table.clone();
            foreignKeys.forEach(foreignKey => changedTable.addForeignKey(foreignKey));
            yield this.recreateTable(changedTable, table);
        });
    }
    /**
     * Drops a foreign key from the table.
     */
    dropForeignKey(tableOrName, foreignKeyOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const foreignKey = foreignKeyOrName instanceof TableForeignKey_1.TableForeignKey ? foreignKeyOrName : table.foreignKeys.find(fk => fk.name === foreignKeyOrName);
            if (!foreignKey)
                throw new Error(`Supplied foreign key was not found in table ${table.name}`);
            yield this.dropForeignKeys(tableOrName, [foreignKey]);
        });
    }
    /**
     * Drops a foreign keys from the table.
     */
    dropForeignKeys(tableOrName, foreignKeys) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            // clone original table and remove foreign keys from cloned table
            const changedTable = table.clone();
            foreignKeys.forEach(foreignKey => changedTable.removeForeignKey(foreignKey));
            yield this.recreateTable(changedTable, table);
        });
    }
    /**
     * Creates a new index.
     */
    createIndex(tableOrName, index) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            // new index may be passed without name. In this case we generate index name manually.
            if (!index.name)
                index.name = this.connection.namingStrategy.indexName(table.name, index.columnNames, index.where);
            const up = this.createIndexSql(table, index);
            const down = this.dropIndexSql(index);
            yield this.executeQueries(up, down);
            table.addIndex(index);
        });
    }
    /**
     * Creates a new indices
     */
    createIndices(tableOrName, indices) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const promises = indices.map(index => this.createIndex(tableOrName, index));
            yield Promise.all(promises);
        });
    }
    /**
     * Drops an index from the table.
     */
    dropIndex(tableOrName, indexOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const index = indexOrName instanceof TableIndex_1.TableIndex ? indexOrName : table.indices.find(i => i.name === indexOrName);
            if (!index)
                throw new Error(`Supplied index was not found in table ${table.name}`);
            const up = this.dropIndexSql(index);
            const down = this.createIndexSql(table, index);
            yield this.executeQueries(up, down);
            table.removeIndex(index);
        });
    }
    /**
     * Drops an indices from the table.
     */
    dropIndices(tableOrName, indices) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const promises = indices.map(index => this.dropIndex(tableOrName, index));
            yield Promise.all(promises);
        });
    }
    /**
     * Clears all table contents.
     * Note: this operation uses SQL's TRUNCATE query which cannot be reverted in transactions.
     */
    clearTable(tableName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.query(`DELETE FROM "${tableName}"`);
        });
    }
    /**
     * Removes all tables from the currently connected database.
     */
    clearDatabase() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.query(`PRAGMA foreign_keys = OFF;`);
            yield this.startTransaction();
            try {
                const selectViewDropsQuery = `SELECT 'DROP VIEW "' || name || '";' as query FROM "sqlite_master" WHERE "type" = 'view'`;
                const dropViewQueries = yield this.query(selectViewDropsQuery);
                yield Promise.all(dropViewQueries.map(q => this.query(q["query"])));
                const selectTableDropsQuery = `SELECT 'DROP TABLE "' || name || '";' as query FROM "sqlite_master" WHERE "type" = 'table' AND "name" != 'sqlite_sequence'`;
                const dropTableQueries = yield this.query(selectTableDropsQuery);
                yield Promise.all(dropTableQueries.map(q => this.query(q["query"])));
                yield this.commitTransaction();
            }
            catch (error) {
                try { // we throw original error even if rollback thrown an error
                    yield this.rollbackTransaction();
                }
                catch (rollbackError) { }
                throw error;
            }
            finally {
                yield this.query(`PRAGMA foreign_keys = ON;`);
            }
        });
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    loadViews(viewNames) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const hasTable = yield this.hasTable(this.getTypeormMetadataTableName());
            if (!hasTable)
                return Promise.resolve([]);
            const viewNamesString = viewNames.map(name => "'" + name + "'").join(", ");
            let query = `SELECT "t".* FROM "${this.getTypeormMetadataTableName()}" "t" INNER JOIN "sqlite_master" s ON "s"."name" = "t"."name" AND "s"."type" = 'view' WHERE "t"."type" = 'VIEW'`;
            if (viewNamesString.length > 0)
                query += ` AND "t"."name" IN (${viewNamesString})`;
            const dbViews = yield this.query(query);
            return dbViews.map((dbView) => {
                const view = new View_1.View();
                view.name = dbView["name"];
                view.expression = dbView["value"];
                return view;
            });
        });
    }
    /**
     * Loads all tables (with given names) from the database and creates a Table from them.
     */
    loadTables(tableNames) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // if no tables given then no need to proceed
            if (!tableNames || !tableNames.length)
                return [];
            const tableNamesString = tableNames.map(tableName => `'${tableName}'`).join(", ");
            // load tables
            const dbTables = yield this.query(`SELECT * FROM "sqlite_master" WHERE "type" = 'table' AND "name" IN (${tableNamesString})`);
            // load indices
            const dbIndicesDef = yield this.query(`SELECT * FROM "sqlite_master" WHERE "type" = 'index' AND "tbl_name" IN (${tableNamesString})`);
            // if tables were not found in the db, no need to proceed
            if (!dbTables || !dbTables.length)
                return [];
            // create table schemas for loaded tables
            return Promise.all(dbTables.map((dbTable) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const table = new Table_1.Table({ name: dbTable["name"] });
                const sql = dbTable["sql"];
                // load columns and indices
                const [dbColumns, dbIndices, dbForeignKeys] = yield Promise.all([
                    this.query(`PRAGMA table_info("${dbTable["name"]}")`),
                    this.query(`PRAGMA index_list("${dbTable["name"]}")`),
                    this.query(`PRAGMA foreign_key_list("${dbTable["name"]}")`),
                ]);
                // find column name with auto increment
                let autoIncrementColumnName = undefined;
                const tableSql = dbTable["sql"];
                let autoIncrementIndex = tableSql.toUpperCase().indexOf("AUTOINCREMENT");
                if (autoIncrementIndex !== -1) {
                    autoIncrementColumnName = tableSql.substr(0, autoIncrementIndex);
                    const comma = autoIncrementColumnName.lastIndexOf(",");
                    const bracket = autoIncrementColumnName.lastIndexOf("(");
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
                table.columns = dbColumns.map(dbColumn => {
                    const tableColumn = new TableColumn_1.TableColumn();
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
                        const enumMatch = sql.match(new RegExp("\"(" + tableColumn.name + ")\" varchar CHECK\\s*\\(\\s*\\1\\s+IN\\s*\\(('[^']+'(?:\\s*,\\s*'[^']+')+)\\s*\\)\\s*\\)"));
                        if (enumMatch) {
                            // This is an enum
                            tableColumn.enum = enumMatch[2].substr(1, enumMatch[2].length - 2).split("','");
                        }
                    }
                    // parse datatype and attempt to retrieve length, precision and scale
                    let pos = tableColumn.type.indexOf("(");
                    if (pos !== -1) {
                        const fullType = tableColumn.type;
                        let dataType = fullType.substr(0, pos);
                        if (!!this.driver.withLengthColumnTypes.find(col => col === dataType)) {
                            let len = parseInt(fullType.substring(pos + 1, fullType.length - 1));
                            if (len) {
                                tableColumn.length = len.toString();
                                tableColumn.type = dataType; // remove the length part from the datatype
                            }
                        }
                        if (!!this.driver.withPrecisionColumnTypes.find(col => col === dataType)) {
                            const re = new RegExp(`^${dataType}\\((\\d+),?\\s?(\\d+)?\\)`);
                            const matches = fullType.match(re);
                            if (matches && matches[1]) {
                                tableColumn.precision = +matches[1];
                            }
                            if (!!this.driver.withScaleColumnTypes.find(col => col === dataType)) {
                                if (matches && matches[2]) {
                                    tableColumn.scale = +matches[2];
                                }
                            }
                            tableColumn.type = dataType; // remove the precision/scale part from the datatype
                        }
                    }
                    return tableColumn;
                });
                // build foreign keys
                const tableForeignKeyConstraints = OrmUtils_1.OrmUtils.uniq(dbForeignKeys, dbForeignKey => dbForeignKey["id"]);
                table.foreignKeys = tableForeignKeyConstraints.map(foreignKey => {
                    const ownForeignKeys = dbForeignKeys.filter(dbForeignKey => dbForeignKey["id"] === foreignKey["id"] && dbForeignKey["table"] === foreignKey["table"]);
                    const columnNames = ownForeignKeys.map(dbForeignKey => dbForeignKey["from"]);
                    const referencedColumnNames = ownForeignKeys.map(dbForeignKey => dbForeignKey["to"]);
                    // build foreign key name, because we can not get it directly.
                    const fkName = this.connection.namingStrategy.foreignKeyName(table, columnNames, foreignKey.referencedTableName, foreignKey.referencedColumnNames);
                    return new TableForeignKey_1.TableForeignKey({
                        name: fkName,
                        columnNames: columnNames,
                        referencedTableName: foreignKey["table"],
                        referencedColumnNames: referencedColumnNames,
                        onDelete: foreignKey["on_delete"],
                        onUpdate: foreignKey["on_update"]
                    });
                });
                // build unique constraints
                const tableUniquePromises = dbIndices
                    .filter(dbIndex => dbIndex["origin"] === "u")
                    .map(dbIndex => dbIndex["name"])
                    .filter((value, index, self) => self.indexOf(value) === index)
                    .map((dbIndexName) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const dbIndex = dbIndices.find(dbIndex => dbIndex["name"] === dbIndexName);
                    const indexInfos = yield this.query(`PRAGMA index_info("${dbIndex["name"]}")`);
                    const indexColumns = indexInfos
                        .sort((indexInfo1, indexInfo2) => parseInt(indexInfo1["seqno"]) - parseInt(indexInfo2["seqno"]))
                        .map(indexInfo => indexInfo["name"]);
                    if (indexColumns.length === 1) {
                        const column = table.columns.find(column => {
                            return !!indexColumns.find(indexColumn => indexColumn === column.name);
                        });
                        if (column)
                            column.isUnique = true;
                    }
                    // Sqlite does not store unique constraint name, so we generate its name manually.
                    return new TableUnique_1.TableUnique({
                        name: this.connection.namingStrategy.uniqueConstraintName(table, indexColumns),
                        columnNames: indexColumns
                    });
                }));
                table.uniques = (yield Promise.all(tableUniquePromises));
                // build checks
                let result;
                const regexp = /CONSTRAINT "([^"]*)" CHECK (\(.*?\))([,]|[)]$)/g;
                while (((result = regexp.exec(sql)) !== null)) {
                    table.checks.push(new TableCheck_1.TableCheck({ name: result[1], expression: result[2] }));
                }
                // build indices
                const indicesPromises = dbIndices
                    .filter(dbIndex => dbIndex["origin"] === "c")
                    .map(dbIndex => dbIndex["name"])
                    .filter((value, index, self) => self.indexOf(value) === index) // unqiue
                    .map((dbIndexName) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const indexDef = dbIndicesDef.find(dbIndexDef => dbIndexDef["name"] === dbIndexName);
                    const condition = /WHERE (.*)/.exec(indexDef["sql"]);
                    const dbIndex = dbIndices.find(dbIndex => dbIndex["name"] === dbIndexName);
                    const indexInfos = yield this.query(`PRAGMA index_info("${dbIndex["name"]}")`);
                    const indexColumns = indexInfos
                        .sort((indexInfo1, indexInfo2) => parseInt(indexInfo1["seqno"]) - parseInt(indexInfo2["seqno"]))
                        .map(indexInfo => indexInfo["name"]);
                    const isUnique = dbIndex["unique"] === "1" || dbIndex["unique"] === 1;
                    return new TableIndex_1.TableIndex({
                        table: table,
                        name: dbIndex["name"],
                        columnNames: indexColumns,
                        isUnique: isUnique,
                        where: condition ? condition[1] : undefined
                    });
                }));
                const indices = yield Promise.all(indicesPromises);
                table.indices = indices.filter(index => !!index);
                return table;
            })));
        });
    }
    /**
     * Builds create table sql.
     */
    createTableSql(table, createForeignKeys) {
        const primaryColumns = table.columns.filter(column => column.isPrimary);
        const hasAutoIncrement = primaryColumns.find(column => column.isGenerated && column.generationStrategy === "increment");
        const skipPrimary = primaryColumns.length > 1;
        if (skipPrimary && hasAutoIncrement)
            throw new Error(`Sqlite does not support AUTOINCREMENT on composite primary key`);
        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(column, skipPrimary)).join(", ");
        let sql = `CREATE TABLE "${table.name}" (${columnDefinitions}`;
        // need for `addColumn()` method, because it recreates table.
        table.columns
            .filter(column => column.isUnique)
            .forEach(column => {
            const isUniqueExist = table.uniques.some(unique => unique.columnNames.length === 1 && unique.columnNames[0] === column.name);
            if (!isUniqueExist)
                table.uniques.push(new TableUnique_1.TableUnique({
                    name: this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]),
                    columnNames: [column.name]
                }));
        });
        if (table.uniques.length > 0) {
            const uniquesSql = table.uniques.map(unique => {
                const uniqueName = unique.name ? unique.name : this.connection.namingStrategy.uniqueConstraintName(table.name, unique.columnNames);
                const columnNames = unique.columnNames.map(columnName => `"${columnName}"`).join(", ");
                return `CONSTRAINT "${uniqueName}" UNIQUE (${columnNames})`;
            }).join(", ");
            sql += `, ${uniquesSql}`;
        }
        if (table.checks.length > 0) {
            const checksSql = table.checks.map(check => {
                const checkName = check.name ? check.name : this.connection.namingStrategy.checkConstraintName(table.name, check.expression);
                return `CONSTRAINT "${checkName}" CHECK (${check.expression})`;
            }).join(", ");
            sql += `, ${checksSql}`;
        }
        if (table.foreignKeys.length > 0 && createForeignKeys) {
            const foreignKeysSql = table.foreignKeys.map(fk => {
                const columnNames = fk.columnNames.map(columnName => `"${columnName}"`).join(", ");
                if (!fk.name)
                    fk.name = this.connection.namingStrategy.foreignKeyName(table.name, fk.columnNames, fk.referencedTableName, fk.referencedColumnNames);
                const referencedColumnNames = fk.referencedColumnNames.map(columnName => `"${columnName}"`).join(", ");
                let constraint = `CONSTRAINT "${fk.name}" FOREIGN KEY (${columnNames}) REFERENCES "${fk.referencedTableName}" (${referencedColumnNames})`;
                if (fk.onDelete)
                    constraint += ` ON DELETE ${fk.onDelete}`;
                if (fk.onUpdate)
                    constraint += ` ON UPDATE ${fk.onUpdate}`;
                return constraint;
            }).join(", ");
            sql += `, ${foreignKeysSql}`;
        }
        if (primaryColumns.length > 1) {
            const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
            sql += `, PRIMARY KEY (${columnNames})`;
        }
        sql += `)`;
        const tableMetadata = this.connection.entityMetadatas.find(metadata => metadata.tableName === table.name);
        if (tableMetadata && tableMetadata.withoutRowid) {
            sql += " WITHOUT ROWID";
        }
        return new Query_1.Query(sql);
    }
    /**
     * Builds drop table sql.
     */
    dropTableSql(tableOrName, ifExist) {
        const tableName = tableOrName instanceof Table_1.Table ? tableOrName.name : tableOrName;
        const query = ifExist ? `DROP TABLE IF EXISTS "${tableName}"` : `DROP TABLE "${tableName}"`;
        return new Query_1.Query(query);
    }
    createViewSql(view) {
        if (typeof view.expression === "string") {
            return new Query_1.Query(`CREATE VIEW "${view.name}" AS ${view.expression}`);
        }
        else {
            return new Query_1.Query(`CREATE VIEW "${view.name}" AS ${view.expression(this.connection).getQuery()}`);
        }
    }
    insertViewDefinitionSql(view) {
        const expression = typeof view.expression === "string" ? view.expression.trim() : view.expression(this.connection).getQuery();
        const [query, parameters] = this.connection.createQueryBuilder()
            .insert()
            .into(this.getTypeormMetadataTableName())
            .values({ type: "VIEW", name: view.name, value: expression })
            .getQueryAndParameters();
        return new Query_1.Query(query, parameters);
    }
    /**
     * Builds drop view sql.
     */
    dropViewSql(viewOrPath) {
        const viewName = viewOrPath instanceof View_1.View ? viewOrPath.name : viewOrPath;
        return new Query_1.Query(`DROP VIEW "${viewName}"`);
    }
    /**
     * Builds remove view sql.
     */
    deleteViewDefinitionSql(viewOrPath) {
        const viewName = viewOrPath instanceof View_1.View ? viewOrPath.name : viewOrPath;
        const qb = this.connection.createQueryBuilder();
        const [query, parameters] = qb.delete()
            .from(this.getTypeormMetadataTableName())
            .where(`${qb.escape("type")} = 'VIEW'`)
            .andWhere(`${qb.escape("name")} = :name`, { name: viewName })
            .getQueryAndParameters();
        return new Query_1.Query(query, parameters);
    }
    /**
     * Builds create index sql.
     */
    createIndexSql(table, index) {
        const columns = index.columnNames.map(columnName => `"${columnName}"`).join(", ");
        return new Query_1.Query(`CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX "${index.name}" ON "${table.name}" (${columns}) ${index.where ? "WHERE " + index.where : ""}`);
    }
    /**
     * Builds drop index sql.
     */
    dropIndexSql(indexOrName) {
        let indexName = indexOrName instanceof TableIndex_1.TableIndex ? indexOrName.name : indexOrName;
        return new Query_1.Query(`DROP INDEX "${indexName}"`);
    }
    /**
     * Builds a query for create column.
     */
    buildCreateColumnSql(column, skipPrimary) {
        let c = "\"" + column.name + "\"";
        if (column instanceof ColumnMetadata_1.ColumnMetadata) {
            c += " " + this.driver.normalizeType(column);
        }
        else {
            c += " " + this.connection.driver.createFullType(column);
        }
        if (column.enum)
            c += " CHECK( " + column.name + " IN (" + column.enum.map(val => "'" + val + "'").join(",") + ") )";
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
    }
    recreateTable(newTable, oldTable, migrateData = true) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const upQueries = [];
            const downQueries = [];
            // drop old table indices
            oldTable.indices.forEach(index => {
                upQueries.push(this.dropIndexSql(index));
                downQueries.push(this.createIndexSql(oldTable, index));
            });
            // change table name into 'temporary_table'
            newTable.name = "temporary_" + newTable.name;
            // create new table
            upQueries.push(this.createTableSql(newTable, true));
            downQueries.push(this.dropTableSql(newTable));
            // migrate all data from the old table into new table
            if (migrateData) {
                let newColumnNames = newTable.columns.map(column => `"${column.name}"`).join(", ");
                let oldColumnNames = oldTable.columns.map(column => `"${column.name}"`).join(", ");
                if (oldTable.columns.length < newTable.columns.length) {
                    newColumnNames = newTable.columns.filter(column => {
                        return oldTable.columns.find(c => c.name === column.name);
                    }).map(column => `"${column.name}"`).join(", ");
                }
                else if (oldTable.columns.length > newTable.columns.length) {
                    oldColumnNames = oldTable.columns.filter(column => {
                        return newTable.columns.find(c => c.name === column.name);
                    }).map(column => `"${column.name}"`).join(", ");
                }
                upQueries.push(new Query_1.Query(`INSERT INTO "${newTable.name}"(${newColumnNames}) SELECT ${oldColumnNames} FROM "${oldTable.name}"`));
                downQueries.push(new Query_1.Query(`INSERT INTO "${oldTable.name}"(${oldColumnNames}) SELECT ${newColumnNames} FROM "${newTable.name}"`));
            }
            // drop old table
            upQueries.push(this.dropTableSql(oldTable));
            downQueries.push(this.createTableSql(oldTable, true));
            // rename old table
            upQueries.push(new Query_1.Query(`ALTER TABLE "${newTable.name}" RENAME TO "${oldTable.name}"`));
            downQueries.push(new Query_1.Query(`ALTER TABLE "${oldTable.name}" RENAME TO "${newTable.name}"`));
            newTable.name = oldTable.name;
            // recreate table indices
            newTable.indices.forEach(index => {
                // new index may be passed without name. In this case we generate index name manually.
                if (!index.name)
                    index.name = this.connection.namingStrategy.indexName(newTable.name, index.columnNames, index.where);
                upQueries.push(this.createIndexSql(newTable, index));
                downQueries.push(this.dropIndexSql(index));
            });
            yield this.executeQueries(upQueries, downQueries);
            this.replaceCachedTable(oldTable, newTable);
        });
    }
}
exports.AbstractSqliteQueryRunner = AbstractSqliteQueryRunner;

//# sourceMappingURL=AbstractSqliteQueryRunner.js.map
