import { __awaiter } from "tslib";
import { TransactionAlreadyStartedError } from "../../error/TransactionAlreadyStartedError";
import { TransactionNotStartedError } from "../../error/TransactionNotStartedError";
import { TableColumn } from "../../schema-builder/table/TableColumn";
import { Table } from "../../schema-builder/table/Table";
import { TableForeignKey } from "../../schema-builder/table/TableForeignKey";
import { TableIndex } from "../../schema-builder/table/TableIndex";
import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError";
import { View } from "../../schema-builder/view/View";
import { Query } from "../Query";
import { QueryFailedError } from "../../error/QueryFailedError";
import { TableUnique } from "../../schema-builder/table/TableUnique";
import { Broadcaster } from "../../subscriber/Broadcaster";
import { BaseQueryRunner } from "../../query-runner/BaseQueryRunner";
import { OrmUtils } from "../../util/OrmUtils";
import { TableCheck } from "../../schema-builder/table/TableCheck";
import { BroadcasterResult } from "../../subscriber/BroadcasterResult";
/**
 * Runs queries on a single oracle database connection.
 */
export class OracleQueryRunner extends BaseQueryRunner {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(driver, mode) {
        super();
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster(this);
        this.mode = mode;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates/uses database connection from the connection pool to perform further operations.
     * Returns obtained database connection.
     */
    connect() {
        if (this.databaseConnection)
            return Promise.resolve(this.databaseConnection);
        if (this.databaseConnectionPromise)
            return this.databaseConnectionPromise;
        if (this.mode === "slave" && this.driver.isReplicated) {
            this.databaseConnectionPromise = this.driver.obtainSlaveConnection().then(connection => {
                this.databaseConnection = connection;
                return this.databaseConnection;
            });
        }
        else { // master
            this.databaseConnectionPromise = this.driver.obtainMasterConnection().then(connection => {
                this.databaseConnection = connection;
                return this.databaseConnection;
            });
        }
        return this.databaseConnectionPromise;
    }
    /**
     * Releases used database connection.
     * You cannot use query runner methods once its released.
     */
    release() {
        return new Promise((ok, fail) => {
            this.isReleased = true;
            if (this.databaseConnection) {
                this.databaseConnection.close((err) => {
                    if (err)
                        return fail(err);
                    ok();
                });
            }
            else {
                ok();
            }
        });
    }
    /**
     * Starts transaction.
     */
    startTransaction(isolationLevel = "READ COMMITTED") {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isReleased)
                throw new QueryRunnerAlreadyReleasedError();
            if (this.isTransactionActive)
                throw new TransactionAlreadyStartedError();
            // await this.query("START TRANSACTION");
            if (isolationLevel !== "SERIALIZABLE" && isolationLevel !== "READ COMMITTED") {
                throw new Error(`Oracle only supports SERIALIZABLE and READ COMMITTED isolation`);
            }
            const beforeBroadcastResult = new BroadcasterResult();
            this.broadcaster.broadcastBeforeTransactionStartEvent(beforeBroadcastResult);
            if (beforeBroadcastResult.promises.length > 0)
                yield Promise.all(beforeBroadcastResult.promises);
            yield this.query("SET TRANSACTION ISOLATION LEVEL " + isolationLevel);
            this.isTransactionActive = true;
            const afterBroadcastResult = new BroadcasterResult();
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
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isTransactionActive)
                throw new TransactionNotStartedError();
            const beforeBroadcastResult = new BroadcasterResult();
            this.broadcaster.broadcastBeforeTransactionCommitEvent(beforeBroadcastResult);
            if (beforeBroadcastResult.promises.length > 0)
                yield Promise.all(beforeBroadcastResult.promises);
            yield this.query("COMMIT");
            this.isTransactionActive = false;
            const afterBroadcastResult = new BroadcasterResult();
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
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isTransactionActive)
                throw new TransactionNotStartedError();
            const beforeBroadcastResult = new BroadcasterResult();
            this.broadcaster.broadcastBeforeTransactionRollbackEvent(beforeBroadcastResult);
            if (beforeBroadcastResult.promises.length > 0)
                yield Promise.all(beforeBroadcastResult.promises);
            yield this.query("ROLLBACK");
            this.isTransactionActive = false;
            const afterBroadcastResult = new BroadcasterResult();
            this.broadcaster.broadcastAfterTransactionRollbackEvent(afterBroadcastResult);
            if (afterBroadcastResult.promises.length > 0)
                yield Promise.all(afterBroadcastResult.promises);
        });
    }
    /**
     * Executes a given SQL query.
     */
    query(query, parameters) {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError();
        return new Promise((ok, fail) => __awaiter(this, void 0, void 0, function* () {
            try {
                this.driver.connection.logger.logQuery(query, parameters, this);
                const queryStartTime = +new Date();
                const handler = (err, result) => {
                    // log slow queries if maxQueryExecution time is set
                    const maxQueryExecutionTime = this.driver.connection.options.maxQueryExecutionTime;
                    const queryEndTime = +new Date();
                    const queryExecutionTime = queryEndTime - queryStartTime;
                    if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                        this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);
                    if (err) {
                        this.driver.connection.logger.logQueryError(err, query, parameters, this);
                        return fail(new QueryFailedError(query, parameters, err));
                    }
                    // TODO: find better solution. Must return result instead of properties
                    ok(result.rows || result.outBinds || result.rowsAffected);
                };
                const executionOptions = {
                    autoCommit: this.isTransactionActive ? false : true
                };
                const databaseConnection = yield this.connect();
                databaseConnection.execute(query, parameters || {}, executionOptions, handler);
            }
            catch (err) {
                fail(err);
            }
        }));
    }
    /**
     * Returns raw data stream.
     */
    stream(query, parameters, onEnd, onError) {
        throw new Error(`Stream is not supported by Oracle driver.`);
    }
    /**
     * Returns all available database names including system databases.
     */
    getDatabases() {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve([]);
        });
    }
    /**
     * Returns all available schema names including system schemas.
     * If database parameter specified, returns schemas of that database.
     */
    getSchemas(database) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve([]);
        });
    }
    /**
     * Checks if database with the given name exist.
     */
    hasDatabase(database) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve(false);
        });
    }
    /**
     * Checks if schema with the given name exist.
     */
    hasSchema(schema) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve(false);
        });
    }
    /**
     * Checks if table with the given name exist in the database.
     */
    hasTable(tableOrName) {
        return __awaiter(this, void 0, void 0, function* () {
            const tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
            const sql = `SELECT "TABLE_NAME" FROM "USER_TABLES" WHERE "TABLE_NAME" = '${tableName}'`;
            const result = yield this.query(sql);
            return result.length ? true : false;
        });
    }
    /**
     * Checks if column with the given name exist in the given table.
     */
    hasColumn(tableOrName, columnName) {
        return __awaiter(this, void 0, void 0, function* () {
            const tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
            const sql = `SELECT "COLUMN_NAME" FROM "USER_TAB_COLS" WHERE "TABLE_NAME" = '${tableName}' AND "COLUMN_NAME" = '${columnName}'`;
            const result = yield this.query(sql);
            return result.length ? true : false;
        });
    }
    /**
     * Creates a new database.
     */
    createDatabase(database, ifNotExist) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.query(`CREATE DATABASE IF NOT EXISTS "${database}"`);
        });
    }
    /**
     * Drops database.
     */
    dropDatabase(database, ifExist) {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve();
        });
    }
    /**
     * Creates a new table schema.
     */
    createSchema(schemas, ifNotExist) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema create queries are not supported by Oracle driver.`);
        });
    }
    /**
     * Drops table schema.
     */
    dropSchema(schemaPath, ifExist) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema drop queries are not supported by Oracle driver.`);
        });
    }
    /**
     * Creates a new table.
     */
    createTable(table, ifNotExist = false, createForeignKeys = true, createIndices = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (ifNotExist) {
                const isTableExist = yield this.hasTable(table);
                if (isTableExist)
                    return Promise.resolve();
            }
            const upQueries = [];
            const downQueries = [];
            upQueries.push(this.createTableSql(table, createForeignKeys));
            downQueries.push(this.dropTableSql(table));
            // if createForeignKeys is true, we must drop created foreign keys in down query.
            // createTable does not need separate method to create foreign keys, because it create fk's in the same query with table creation.
            if (createForeignKeys)
                table.foreignKeys.forEach(foreignKey => downQueries.push(this.dropForeignKeySql(table, foreignKey)));
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
        return __awaiter(this, void 0, void 0, function* () {
            // to perform drop queries for foreign keys and indices.
            if (ifExist) {
                const isTableExist = yield this.hasTable(tableOrName);
                if (!isTableExist)
                    return Promise.resolve();
            }
            // if dropTable called with dropForeignKeys = true, we must create foreign keys in down query.
            const createForeignKeys = dropForeignKeys;
            const table = tableOrName instanceof Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const upQueries = [];
            const downQueries = [];
            if (dropIndices) {
                table.indices.forEach(index => {
                    upQueries.push(this.dropIndexSql(index));
                    downQueries.push(this.createIndexSql(table, index));
                });
            }
            // if dropForeignKeys is true, we just drop the table, otherwise we also drop table foreign keys.
            // createTable does not need separate method to create foreign keys, because it create fk's in the same query with table creation.
            if (dropForeignKeys)
                table.foreignKeys.forEach(foreignKey => upQueries.push(this.dropForeignKeySql(table, foreignKey)));
            upQueries.push(this.dropTableSql(table));
            downQueries.push(this.createTableSql(table, createForeignKeys));
            yield this.executeQueries(upQueries, downQueries);
        });
    }
    /**
     * Creates a new view.
     */
    createView(view) {
        return __awaiter(this, void 0, void 0, function* () {
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
        return __awaiter(this, void 0, void 0, function* () {
            const viewName = target instanceof View ? target.name : target;
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
    renameTable(oldTableOrName, newTableOrName) {
        return __awaiter(this, void 0, void 0, function* () {
            const upQueries = [];
            const downQueries = [];
            const oldTable = oldTableOrName instanceof Table ? oldTableOrName : yield this.getCachedTable(oldTableOrName);
            let newTable = oldTable.clone();
            if (newTableOrName instanceof Table) {
                newTable = newTableOrName;
            }
            else {
                newTable.name = newTableOrName;
            }
            // rename table
            upQueries.push(new Query(`ALTER TABLE "${oldTable.name}" RENAME TO "${newTable.name}"`));
            downQueries.push(new Query(`ALTER TABLE "${newTable.name}" RENAME TO "${oldTable.name}"`));
            // rename primary key constraint
            if (newTable.primaryColumns.length > 0) {
                const columnNames = newTable.primaryColumns.map(column => column.name);
                const oldPkName = this.connection.namingStrategy.primaryKeyName(oldTable, columnNames);
                const newPkName = this.connection.namingStrategy.primaryKeyName(newTable, columnNames);
                // build queries
                upQueries.push(new Query(`ALTER TABLE "${newTable.name}" RENAME CONSTRAINT "${oldPkName}" TO "${newPkName}"`));
                downQueries.push(new Query(`ALTER TABLE "${newTable.name}" RENAME CONSTRAINT "${newPkName}" TO "${oldPkName}"`));
            }
            // rename unique constraints
            newTable.uniques.forEach(unique => {
                // build new constraint name
                const newUniqueName = this.connection.namingStrategy.uniqueConstraintName(newTable, unique.columnNames);
                // build queries
                upQueries.push(new Query(`ALTER TABLE "${newTable.name}" RENAME CONSTRAINT "${unique.name}" TO "${newUniqueName}"`));
                downQueries.push(new Query(`ALTER TABLE "${newTable.name}" RENAME CONSTRAINT "${newUniqueName}" TO "${unique.name}"`));
                // replace constraint name
                unique.name = newUniqueName;
            });
            // rename index constraints
            newTable.indices.forEach(index => {
                // build new constraint name
                const newIndexName = this.connection.namingStrategy.indexName(newTable, index.columnNames, index.where);
                // build queries
                upQueries.push(new Query(`ALTER INDEX "${index.name}" RENAME TO "${newIndexName}"`));
                downQueries.push(new Query(`ALTER INDEX "${newIndexName}" RENAME TO "${index.name}"`));
                // replace constraint name
                index.name = newIndexName;
            });
            // rename foreign key constraints
            newTable.foreignKeys.forEach(foreignKey => {
                // build new constraint name
                const newForeignKeyName = this.connection.namingStrategy.foreignKeyName(newTable, foreignKey.columnNames, foreignKey.referencedTableName, foreignKey.referencedColumnNames);
                // build queries
                upQueries.push(new Query(`ALTER TABLE "${newTable.name}" RENAME CONSTRAINT "${foreignKey.name}" TO "${newForeignKeyName}"`));
                downQueries.push(new Query(`ALTER TABLE "${newTable.name}" RENAME CONSTRAINT "${newForeignKeyName}" TO "${foreignKey.name}"`));
                // replace constraint name
                foreignKey.name = newForeignKeyName;
            });
            yield this.executeQueries(upQueries, downQueries);
            // rename old table and replace it in cached tabled;
            oldTable.name = newTable.name;
            this.replaceCachedTable(oldTable, newTable);
        });
    }
    /**
     * Creates a new column from the column in the table.
     */
    addColumn(tableOrName, column) {
        return __awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const clonedTable = table.clone();
            const upQueries = [];
            const downQueries = [];
            upQueries.push(new Query(`ALTER TABLE "${table.name}" ADD ${this.buildCreateColumnSql(column)}`));
            downQueries.push(new Query(`ALTER TABLE "${table.name}" DROP COLUMN "${column.name}"`));
            // create or update primary key constraint
            if (column.isPrimary) {
                const primaryColumns = clonedTable.primaryColumns;
                // if table already have primary key, me must drop it and recreate again
                if (primaryColumns.length > 0) {
                    const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                    const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                    upQueries.push(new Query(`ALTER TABLE "${table.name}" DROP CONSTRAINT "${pkName}"`));
                    downQueries.push(new Query(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                }
                primaryColumns.push(column);
                const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                upQueries.push(new Query(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                downQueries.push(new Query(`ALTER TABLE "${table.name}" DROP CONSTRAINT "${pkName}"`));
            }
            // create column index
            const columnIndex = clonedTable.indices.find(index => index.columnNames.length === 1 && index.columnNames[0] === column.name);
            if (columnIndex) {
                clonedTable.indices.splice(clonedTable.indices.indexOf(columnIndex), 1);
                upQueries.push(this.createIndexSql(table, columnIndex));
                downQueries.push(this.dropIndexSql(columnIndex));
            }
            // create unique constraint
            if (column.isUnique) {
                const uniqueConstraint = new TableUnique({
                    name: this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]),
                    columnNames: [column.name]
                });
                clonedTable.uniques.push(uniqueConstraint);
                upQueries.push(new Query(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE ("${column.name}")`));
                downQueries.push(new Query(`ALTER TABLE "${table.name}" DROP CONSTRAINT "${uniqueConstraint.name}"`));
            }
            yield this.executeQueries(upQueries, downQueries);
            clonedTable.addColumn(column);
            this.replaceCachedTable(table, clonedTable);
        });
    }
    /**
     * Creates a new columns from the column in the table.
     */
    addColumns(tableOrName, columns) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const column of columns) {
                yield this.addColumn(tableOrName, column);
            }
        });
    }
    /**
     * Renames column in the given table.
     */
    renameColumn(tableOrName, oldTableColumnOrName, newTableColumnOrName) {
        return __awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const oldColumn = oldTableColumnOrName instanceof TableColumn ? oldTableColumnOrName : table.columns.find(c => c.name === oldTableColumnOrName);
            if (!oldColumn)
                throw new Error(`Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`);
            let newColumn = undefined;
            if (newTableColumnOrName instanceof TableColumn) {
                newColumn = newTableColumnOrName;
            }
            else {
                newColumn = oldColumn.clone();
                newColumn.name = newTableColumnOrName;
            }
            yield this.changeColumn(table, oldColumn, newColumn);
        });
    }
    /**
     * Changes a column in the table.
     */
    changeColumn(tableOrName, oldTableColumnOrName, newColumn) {
        return __awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table ? tableOrName : yield this.getCachedTable(tableOrName);
            let clonedTable = table.clone();
            const upQueries = [];
            const downQueries = [];
            const oldColumn = oldTableColumnOrName instanceof TableColumn
                ? oldTableColumnOrName
                : table.columns.find(column => column.name === oldTableColumnOrName);
            if (!oldColumn)
                throw new Error(`Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`);
            if ((newColumn.isGenerated !== oldColumn.isGenerated && newColumn.generationStrategy !== "uuid") || oldColumn.type !== newColumn.type || oldColumn.length !== newColumn.length) {
                // Oracle does not support changing of IDENTITY column, so we must drop column and recreate it again.
                // Also, we recreate column if column type changed
                yield this.dropColumn(table, oldColumn);
                yield this.addColumn(table, newColumn);
                // update cloned table
                clonedTable = table.clone();
            }
            else {
                if (newColumn.name !== oldColumn.name) {
                    // rename column
                    upQueries.push(new Query(`ALTER TABLE "${table.name}" RENAME COLUMN "${oldColumn.name}" TO "${newColumn.name}"`));
                    downQueries.push(new Query(`ALTER TABLE "${table.name}" RENAME COLUMN "${newColumn.name}" TO "${oldColumn.name}"`));
                    // rename column primary key constraint
                    if (oldColumn.isPrimary === true) {
                        const primaryColumns = clonedTable.primaryColumns;
                        // build old primary constraint name
                        const columnNames = primaryColumns.map(column => column.name);
                        const oldPkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);
                        // replace old column name with new column name
                        columnNames.splice(columnNames.indexOf(oldColumn.name), 1);
                        columnNames.push(newColumn.name);
                        // build new primary constraint name
                        const newPkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);
                        upQueries.push(new Query(`ALTER TABLE "${table.name}" RENAME CONSTRAINT "${oldPkName}" TO "${newPkName}"`));
                        downQueries.push(new Query(`ALTER TABLE "${table.name}" RENAME CONSTRAINT "${newPkName}" TO "${oldPkName}"`));
                    }
                    // rename unique constraints
                    clonedTable.findColumnUniques(oldColumn).forEach(unique => {
                        // build new constraint name
                        unique.columnNames.splice(unique.columnNames.indexOf(oldColumn.name), 1);
                        unique.columnNames.push(newColumn.name);
                        const newUniqueName = this.connection.namingStrategy.uniqueConstraintName(clonedTable, unique.columnNames);
                        // build queries
                        upQueries.push(new Query(`ALTER TABLE "${table.name}" RENAME CONSTRAINT "${unique.name}" TO "${newUniqueName}"`));
                        downQueries.push(new Query(`ALTER TABLE "${table.name}" RENAME CONSTRAINT "${newUniqueName}" TO "${unique.name}"`));
                        // replace constraint name
                        unique.name = newUniqueName;
                    });
                    // rename index constraints
                    clonedTable.findColumnIndices(oldColumn).forEach(index => {
                        // build new constraint name
                        index.columnNames.splice(index.columnNames.indexOf(oldColumn.name), 1);
                        index.columnNames.push(newColumn.name);
                        const newIndexName = this.connection.namingStrategy.indexName(clonedTable, index.columnNames, index.where);
                        // build queries
                        upQueries.push(new Query(`ALTER INDEX "${index.name}" RENAME TO "${newIndexName}"`));
                        downQueries.push(new Query(`ALTER INDEX "${newIndexName}" RENAME TO "${index.name}"`));
                        // replace constraint name
                        index.name = newIndexName;
                    });
                    // rename foreign key constraints
                    clonedTable.findColumnForeignKeys(oldColumn).forEach(foreignKey => {
                        // build new constraint name
                        foreignKey.columnNames.splice(foreignKey.columnNames.indexOf(oldColumn.name), 1);
                        foreignKey.columnNames.push(newColumn.name);
                        const newForeignKeyName = this.connection.namingStrategy.foreignKeyName(clonedTable, foreignKey.columnNames, foreignKey.referencedTableName, foreignKey.referencedColumnNames);
                        // build queries
                        upQueries.push(new Query(`ALTER TABLE "${table.name}" RENAME CONSTRAINT "${foreignKey.name}" TO "${newForeignKeyName}"`));
                        downQueries.push(new Query(`ALTER TABLE "${table.name}" RENAME CONSTRAINT "${newForeignKeyName}" TO "${foreignKey.name}"`));
                        // replace constraint name
                        foreignKey.name = newForeignKeyName;
                    });
                    // rename old column in the Table object
                    const oldTableColumn = clonedTable.columns.find(column => column.name === oldColumn.name);
                    clonedTable.columns[clonedTable.columns.indexOf(oldTableColumn)].name = newColumn.name;
                    oldColumn.name = newColumn.name;
                }
                if (this.isColumnChanged(oldColumn, newColumn, true)) {
                    let defaultUp = "";
                    let defaultDown = "";
                    let nullableUp = "";
                    let nullableDown = "";
                    // changing column default
                    if (newColumn.default !== null && newColumn.default !== undefined) {
                        defaultUp = `DEFAULT ${newColumn.default}`;
                        if (oldColumn.default !== null && oldColumn.default !== undefined) {
                            defaultDown = `DEFAULT ${oldColumn.default}`;
                        }
                        else {
                            defaultDown = "DEFAULT NULL";
                        }
                    }
                    else if (oldColumn.default !== null && oldColumn.default !== undefined) {
                        defaultUp = "DEFAULT NULL";
                        defaultDown = `DEFAULT ${oldColumn.default}`;
                    }
                    // changing column isNullable property
                    if (newColumn.isNullable !== oldColumn.isNullable) {
                        if (newColumn.isNullable === true) {
                            nullableUp = "NULL";
                            nullableDown = "NOT NULL";
                        }
                        else {
                            nullableUp = "NOT NULL";
                            nullableDown = "NULL";
                        }
                    }
                    upQueries.push(new Query(`ALTER TABLE "${table.name}" MODIFY "${oldColumn.name}" ${this.connection.driver.createFullType(newColumn)} ${defaultUp} ${nullableUp}`));
                    downQueries.push(new Query(`ALTER TABLE "${table.name}" MODIFY "${oldColumn.name}" ${this.connection.driver.createFullType(oldColumn)} ${defaultDown} ${nullableDown}`));
                }
                if (newColumn.isPrimary !== oldColumn.isPrimary) {
                    const primaryColumns = clonedTable.primaryColumns;
                    // if primary column state changed, we must always drop existed constraint.
                    if (primaryColumns.length > 0) {
                        const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                        const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                        upQueries.push(new Query(`ALTER TABLE "${table.name}" DROP CONSTRAINT "${pkName}"`));
                        downQueries.push(new Query(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                    }
                    if (newColumn.isPrimary === true) {
                        primaryColumns.push(newColumn);
                        // update column in table
                        const column = clonedTable.columns.find(column => column.name === newColumn.name);
                        column.isPrimary = true;
                        const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                        const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                        upQueries.push(new Query(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                        downQueries.push(new Query(`ALTER TABLE "${table.name}" DROP CONSTRAINT "${pkName}"`));
                    }
                    else {
                        const primaryColumn = primaryColumns.find(c => c.name === newColumn.name);
                        primaryColumns.splice(primaryColumns.indexOf(primaryColumn), 1);
                        // update column in table
                        const column = clonedTable.columns.find(column => column.name === newColumn.name);
                        column.isPrimary = false;
                        // if we have another primary keys, we must recreate constraint.
                        if (primaryColumns.length > 0) {
                            const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                            const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                            upQueries.push(new Query(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                            downQueries.push(new Query(`ALTER TABLE "${table.name}" DROP CONSTRAINT "${pkName}"`));
                        }
                    }
                }
                if (newColumn.isUnique !== oldColumn.isUnique) {
                    if (newColumn.isUnique === true) {
                        const uniqueConstraint = new TableUnique({
                            name: this.connection.namingStrategy.uniqueConstraintName(table.name, [newColumn.name]),
                            columnNames: [newColumn.name]
                        });
                        clonedTable.uniques.push(uniqueConstraint);
                        upQueries.push(new Query(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE ("${newColumn.name}")`));
                        downQueries.push(new Query(`ALTER TABLE "${table.name}" DROP CONSTRAINT "${uniqueConstraint.name}"`));
                    }
                    else {
                        const uniqueConstraint = clonedTable.uniques.find(unique => {
                            return unique.columnNames.length === 1 && !!unique.columnNames.find(columnName => columnName === newColumn.name);
                        });
                        clonedTable.uniques.splice(clonedTable.uniques.indexOf(uniqueConstraint), 1);
                        upQueries.push(new Query(`ALTER TABLE "${table.name}" DROP CONSTRAINT "${uniqueConstraint.name}"`));
                        downQueries.push(new Query(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE ("${newColumn.name}")`));
                    }
                }
                yield this.executeQueries(upQueries, downQueries);
                this.replaceCachedTable(table, clonedTable);
            }
        });
    }
    /**
     * Changes a column in the table.
     */
    changeColumns(tableOrName, changedColumns) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const { oldColumn, newColumn } of changedColumns) {
                yield this.changeColumn(tableOrName, oldColumn, newColumn);
            }
        });
    }
    /**
     * Drops column in the table.
     */
    dropColumn(tableOrName, columnOrName) {
        return __awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const column = columnOrName instanceof TableColumn ? columnOrName : table.findColumnByName(columnOrName);
            if (!column)
                throw new Error(`Column "${columnOrName}" was not found in table "${table.name}"`);
            const clonedTable = table.clone();
            const upQueries = [];
            const downQueries = [];
            // drop primary key constraint
            if (column.isPrimary) {
                const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, clonedTable.primaryColumns.map(column => column.name));
                const columnNames = clonedTable.primaryColumns.map(primaryColumn => `"${primaryColumn.name}"`).join(", ");
                upQueries.push(new Query(`ALTER TABLE "${clonedTable.name}" DROP CONSTRAINT "${pkName}"`));
                downQueries.push(new Query(`ALTER TABLE "${clonedTable.name}" ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                // update column in table
                const tableColumn = clonedTable.findColumnByName(column.name);
                tableColumn.isPrimary = false;
                // if primary key have multiple columns, we must recreate it without dropped column
                if (clonedTable.primaryColumns.length > 0) {
                    const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, clonedTable.primaryColumns.map(column => column.name));
                    const columnNames = clonedTable.primaryColumns.map(primaryColumn => `"${primaryColumn.name}"`).join(", ");
                    upQueries.push(new Query(`ALTER TABLE "${clonedTable.name}" ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                    downQueries.push(new Query(`ALTER TABLE "${clonedTable.name}" DROP CONSTRAINT "${pkName}"`));
                }
            }
            // drop column index
            const columnIndex = clonedTable.indices.find(index => index.columnNames.length === 1 && index.columnNames[0] === column.name);
            if (columnIndex) {
                upQueries.push(this.dropIndexSql(columnIndex));
                downQueries.push(this.createIndexSql(table, columnIndex));
            }
            // drop column check
            const columnCheck = clonedTable.checks.find(check => !!check.columnNames && check.columnNames.length === 1 && check.columnNames[0] === column.name);
            if (columnCheck) {
                clonedTable.checks.splice(clonedTable.checks.indexOf(columnCheck), 1);
                upQueries.push(this.dropCheckConstraintSql(table, columnCheck));
                downQueries.push(this.createCheckConstraintSql(table, columnCheck));
            }
            // drop column unique
            const columnUnique = clonedTable.uniques.find(unique => unique.columnNames.length === 1 && unique.columnNames[0] === column.name);
            if (columnUnique) {
                clonedTable.uniques.splice(clonedTable.uniques.indexOf(columnUnique), 1);
                upQueries.push(this.dropUniqueConstraintSql(table, columnUnique));
                downQueries.push(this.createUniqueConstraintSql(table, columnUnique));
            }
            upQueries.push(new Query(`ALTER TABLE "${table.name}" DROP COLUMN "${column.name}"`));
            downQueries.push(new Query(`ALTER TABLE "${table.name}" ADD ${this.buildCreateColumnSql(column)}`));
            yield this.executeQueries(upQueries, downQueries);
            clonedTable.removeColumn(column);
            this.replaceCachedTable(table, clonedTable);
        });
    }
    /**
     * Drops the columns in the table.
     */
    dropColumns(tableOrName, columns) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const column of columns) {
                yield this.dropColumn(tableOrName, column);
            }
        });
    }
    /**
     * Creates a new primary key.
     */
    createPrimaryKey(tableOrName, columnNames) {
        return __awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const clonedTable = table.clone();
            const up = this.createPrimaryKeySql(table, columnNames);
            // mark columns as primary, because dropPrimaryKeySql build constraint name from table primary column names.
            clonedTable.columns.forEach(column => {
                if (columnNames.find(columnName => columnName === column.name))
                    column.isPrimary = true;
            });
            const down = this.dropPrimaryKeySql(clonedTable);
            yield this.executeQueries(up, down);
            this.replaceCachedTable(table, clonedTable);
        });
    }
    /**
     * Updates composite primary keys.
     */
    updatePrimaryKeys(tableOrName, columns) {
        return __awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const columnNames = columns.map(column => column.name);
            const clonedTable = table.clone();
            const upQueries = [];
            const downQueries = [];
            // if table already have primary columns, we must drop them.
            const primaryColumns = clonedTable.primaryColumns;
            if (primaryColumns.length > 0) {
                const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                const columnNamesString = primaryColumns.map(column => `"${column.name}"`).join(", ");
                upQueries.push(new Query(`ALTER TABLE "${table.name}" DROP CONSTRAINT "${pkName}"`));
                downQueries.push(new Query(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNamesString})`));
            }
            // update columns in table.
            clonedTable.columns
                .filter(column => columnNames.indexOf(column.name) !== -1)
                .forEach(column => column.isPrimary = true);
            const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, columnNames);
            const columnNamesString = columnNames.map(columnName => `"${columnName}"`).join(", ");
            upQueries.push(new Query(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNamesString})`));
            downQueries.push(new Query(`ALTER TABLE "${table.name}" DROP CONSTRAINT "${pkName}"`));
            yield this.executeQueries(upQueries, downQueries);
            this.replaceCachedTable(table, clonedTable);
        });
    }
    /**
     * Drops a primary key.
     */
    dropPrimaryKey(tableOrName) {
        return __awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const up = this.dropPrimaryKeySql(table);
            const down = this.createPrimaryKeySql(table, table.primaryColumns.map(column => column.name));
            yield this.executeQueries(up, down);
            table.primaryColumns.forEach(column => {
                column.isPrimary = false;
            });
        });
    }
    /**
     * Creates a new unique constraint.
     */
    createUniqueConstraint(tableOrName, uniqueConstraint) {
        return __awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table ? tableOrName : yield this.getCachedTable(tableOrName);
            // new unique constraint may be passed without name. In this case we generate unique name manually.
            if (!uniqueConstraint.name)
                uniqueConstraint.name = this.connection.namingStrategy.uniqueConstraintName(table.name, uniqueConstraint.columnNames);
            const up = this.createUniqueConstraintSql(table, uniqueConstraint);
            const down = this.dropUniqueConstraintSql(table, uniqueConstraint);
            yield this.executeQueries(up, down);
            table.addUniqueConstraint(uniqueConstraint);
        });
    }
    /**
     * Creates a new unique constraints.
     */
    createUniqueConstraints(tableOrName, uniqueConstraints) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = uniqueConstraints.map(uniqueConstraint => this.createUniqueConstraint(tableOrName, uniqueConstraint));
            yield Promise.all(promises);
        });
    }
    /**
     * Drops an unique constraint.
     */
    dropUniqueConstraint(tableOrName, uniqueOrName) {
        return __awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const uniqueConstraint = uniqueOrName instanceof TableUnique ? uniqueOrName : table.uniques.find(u => u.name === uniqueOrName);
            if (!uniqueConstraint)
                throw new Error(`Supplied unique constraint was not found in table ${table.name}`);
            const up = this.dropUniqueConstraintSql(table, uniqueConstraint);
            const down = this.createUniqueConstraintSql(table, uniqueConstraint);
            yield this.executeQueries(up, down);
            table.removeUniqueConstraint(uniqueConstraint);
        });
    }
    /**
     * Creates an unique constraints.
     */
    dropUniqueConstraints(tableOrName, uniqueConstraints) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = uniqueConstraints.map(uniqueConstraint => this.dropUniqueConstraint(tableOrName, uniqueConstraint));
            yield Promise.all(promises);
        });
    }
    /**
     * Creates new check constraint.
     */
    createCheckConstraint(tableOrName, checkConstraint) {
        return __awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table ? tableOrName : yield this.getCachedTable(tableOrName);
            // new unique constraint may be passed without name. In this case we generate unique name manually.
            if (!checkConstraint.name)
                checkConstraint.name = this.connection.namingStrategy.checkConstraintName(table.name, checkConstraint.expression);
            const up = this.createCheckConstraintSql(table, checkConstraint);
            const down = this.dropCheckConstraintSql(table, checkConstraint);
            yield this.executeQueries(up, down);
            table.addCheckConstraint(checkConstraint);
        });
    }
    /**
     * Creates new check constraints.
     */
    createCheckConstraints(tableOrName, checkConstraints) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = checkConstraints.map(checkConstraint => this.createCheckConstraint(tableOrName, checkConstraint));
            yield Promise.all(promises);
        });
    }
    /**
     * Drops check constraint.
     */
    dropCheckConstraint(tableOrName, checkOrName) {
        return __awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const checkConstraint = checkOrName instanceof TableCheck ? checkOrName : table.checks.find(c => c.name === checkOrName);
            if (!checkConstraint)
                throw new Error(`Supplied check constraint was not found in table ${table.name}`);
            const up = this.dropCheckConstraintSql(table, checkConstraint);
            const down = this.createCheckConstraintSql(table, checkConstraint);
            yield this.executeQueries(up, down);
            table.removeCheckConstraint(checkConstraint);
        });
    }
    /**
     * Drops check constraints.
     */
    dropCheckConstraints(tableOrName, checkConstraints) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = checkConstraints.map(checkConstraint => this.dropCheckConstraint(tableOrName, checkConstraint));
            yield Promise.all(promises);
        });
    }
    /**
     * Creates a new exclusion constraint.
     */
    createExclusionConstraint(tableOrName, exclusionConstraint) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error(`Oracle does not support exclusion constraints.`);
        });
    }
    /**
     * Creates a new exclusion constraints.
     */
    createExclusionConstraints(tableOrName, exclusionConstraints) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error(`Oracle does not support exclusion constraints.`);
        });
    }
    /**
     * Drops exclusion constraint.
     */
    dropExclusionConstraint(tableOrName, exclusionOrName) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error(`Oracle does not support exclusion constraints.`);
        });
    }
    /**
     * Drops exclusion constraints.
     */
    dropExclusionConstraints(tableOrName, exclusionConstraints) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error(`Oracle does not support exclusion constraints.`);
        });
    }
    /**
     * Creates a new foreign key.
     */
    createForeignKey(tableOrName, foreignKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table ? tableOrName : yield this.getCachedTable(tableOrName);
            // new FK may be passed without name. In this case we generate FK name manually.
            if (!foreignKey.name)
                foreignKey.name = this.connection.namingStrategy.foreignKeyName(table.name, foreignKey.columnNames, foreignKey.referencedTableName, foreignKey.referencedColumnNames);
            const up = this.createForeignKeySql(table, foreignKey);
            const down = this.dropForeignKeySql(table, foreignKey);
            yield this.executeQueries(up, down);
            table.addForeignKey(foreignKey);
        });
    }
    /**
     * Creates a new foreign keys.
     */
    createForeignKeys(tableOrName, foreignKeys) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = foreignKeys.map(foreignKey => this.createForeignKey(tableOrName, foreignKey));
            yield Promise.all(promises);
        });
    }
    /**
     * Drops a foreign key from the table.
     */
    dropForeignKey(tableOrName, foreignKeyOrName) {
        return __awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const foreignKey = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName : table.foreignKeys.find(fk => fk.name === foreignKeyOrName);
            if (!foreignKey)
                throw new Error(`Supplied foreign key was not found in table ${table.name}`);
            const up = this.dropForeignKeySql(table, foreignKey);
            const down = this.createForeignKeySql(table, foreignKey);
            yield this.executeQueries(up, down);
            table.removeForeignKey(foreignKey);
        });
    }
    /**
     * Drops a foreign keys from the table.
     */
    dropForeignKeys(tableOrName, foreignKeys) {
        return __awaiter(this, void 0, void 0, function* () {
            const promises = foreignKeys.map(foreignKey => this.dropForeignKey(tableOrName, foreignKey));
            yield Promise.all(promises);
        });
    }
    /**
     * Creates a new index.
     */
    createIndex(tableOrName, index) {
        return __awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table ? tableOrName : yield this.getCachedTable(tableOrName);
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
        return __awaiter(this, void 0, void 0, function* () {
            const promises = indices.map(index => this.createIndex(tableOrName, index));
            yield Promise.all(promises);
        });
    }
    /**
     * Drops an index from the table.
     */
    dropIndex(tableOrName, indexOrName) {
        return __awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const index = indexOrName instanceof TableIndex ? indexOrName : table.indices.find(i => i.name === indexOrName);
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
        return __awaiter(this, void 0, void 0, function* () {
            const promises = indices.map(index => this.dropIndex(tableOrName, index));
            yield Promise.all(promises);
        });
    }
    /**
     * Clears all table contents.
     * Note: this operation uses SQL's TRUNCATE query which cannot be reverted in transactions.
     */
    clearTable(tableName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.query(`TRUNCATE TABLE "${tableName}"`);
        });
    }
    /**
     * Removes all tables from the currently connected database.
     */
    clearDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.startTransaction();
            try {
                const dropViewsQuery = `SELECT 'DROP VIEW "' || VIEW_NAME || '"' AS "query" FROM "USER_VIEWS"`;
                const dropViewQueries = yield this.query(dropViewsQuery);
                yield Promise.all(dropViewQueries.map(query => this.query(query["query"])));
                const dropTablesQuery = `SELECT 'DROP TABLE "' || TABLE_NAME || '" CASCADE CONSTRAINTS' AS "query" FROM "USER_TABLES"`;
                const dropTableQueries = yield this.query(dropTablesQuery);
                yield Promise.all(dropTableQueries.map(query => this.query(query["query"])));
                yield this.commitTransaction();
            }
            catch (error) {
                try { // we throw original error even if rollback thrown an error
                    yield this.rollbackTransaction();
                }
                catch (rollbackError) { }
                throw error;
            }
        });
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    loadViews(viewNames) {
        return __awaiter(this, void 0, void 0, function* () {
            const hasTable = yield this.hasTable(this.getTypeormMetadataTableName());
            if (!hasTable)
                return Promise.resolve([]);
            const viewNamesString = viewNames.map(name => "'" + name + "'").join(", ");
            let query = `SELECT "T".* FROM "${this.getTypeormMetadataTableName()}" "T" INNER JOIN "USER_VIEWS" "V" ON "V"."VIEW_NAME" = "T"."name" WHERE "T"."type" = 'VIEW'`;
            if (viewNamesString.length > 0)
                query += ` AND "T"."name" IN (${viewNamesString})`;
            const dbViews = yield this.query(query);
            return dbViews.map((dbView) => {
                const view = new View();
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
        return __awaiter(this, void 0, void 0, function* () {
            // if no tables given then no need to proceed
            if (!tableNames || !tableNames.length)
                return [];
            // load tables, columns, indices and foreign keys
            const tableNamesString = tableNames.map(name => "'" + name + "'").join(", ");
            const tablesSql = `SELECT * FROM "USER_TABLES" WHERE "TABLE_NAME" IN (${tableNamesString})`;
            const columnsSql = `SELECT * FROM "USER_TAB_COLS" WHERE "TABLE_NAME" IN (${tableNamesString})`;
            const indicesSql = `SELECT "IND"."INDEX_NAME", "IND"."TABLE_NAME", "IND"."UNIQUENESS", ` +
                `LISTAGG ("COL"."COLUMN_NAME", ',') WITHIN GROUP (ORDER BY "COL"."COLUMN_NAME") AS "COLUMN_NAMES" ` +
                `FROM "USER_INDEXES" "IND" ` +
                `INNER JOIN "USER_IND_COLUMNS" "COL" ON "COL"."INDEX_NAME" = "IND"."INDEX_NAME" ` +
                `LEFT JOIN "USER_CONSTRAINTS" "CON" ON "CON"."CONSTRAINT_NAME" = "IND"."INDEX_NAME" ` +
                `WHERE "IND"."TABLE_NAME" IN (${tableNamesString}) AND "CON"."CONSTRAINT_NAME" IS NULL ` +
                `GROUP BY "IND"."INDEX_NAME", "IND"."TABLE_NAME", "IND"."UNIQUENESS"`;
            const foreignKeysSql = `SELECT "C"."CONSTRAINT_NAME", "C"."TABLE_NAME", "COL"."COLUMN_NAME", "REF_COL"."TABLE_NAME" AS "REFERENCED_TABLE_NAME", ` +
                `"REF_COL"."COLUMN_NAME" AS "REFERENCED_COLUMN_NAME", "C"."DELETE_RULE" AS "ON_DELETE" ` +
                `FROM "USER_CONSTRAINTS" "C" ` +
                `INNER JOIN "USER_CONS_COLUMNS" "COL" ON "COL"."OWNER" = "C"."OWNER" AND "COL"."CONSTRAINT_NAME" = "C"."CONSTRAINT_NAME" ` +
                `INNER JOIN "USER_CONS_COLUMNS" "REF_COL" ON "REF_COL"."OWNER" = "C"."R_OWNER" AND "REF_COL"."CONSTRAINT_NAME" = "C"."R_CONSTRAINT_NAME" AND "REF_COL"."POSITION" = "COL"."POSITION" ` +
                `WHERE "C"."TABLE_NAME" IN (${tableNamesString}) AND "C"."CONSTRAINT_TYPE" = 'R'`;
            const constraintsSql = `SELECT "C"."CONSTRAINT_NAME", "C"."CONSTRAINT_TYPE", "C"."TABLE_NAME", "COL"."COLUMN_NAME", "C"."SEARCH_CONDITION" ` +
                `FROM "USER_CONSTRAINTS" "C" ` +
                `INNER JOIN "USER_CONS_COLUMNS" "COL" ON "COL"."OWNER" = "C"."OWNER" AND "COL"."CONSTRAINT_NAME" = "C"."CONSTRAINT_NAME" ` +
                `WHERE "C"."TABLE_NAME" IN (${tableNamesString}) AND "C"."CONSTRAINT_TYPE" IN ('C', 'U', 'P') AND "C"."GENERATED" = 'USER NAME'`;
            const [dbTables, dbColumns, dbIndices, dbForeignKeys, dbConstraints] = yield Promise.all([
                this.query(tablesSql),
                this.query(columnsSql),
                this.query(indicesSql),
                this.query(foreignKeysSql),
                this.query(constraintsSql),
            ]);
            // if tables were not found in the db, no need to proceed
            if (!dbTables.length)
                return [];
            // create tables for loaded tables
            return dbTables.map(dbTable => {
                const table = new Table();
                table.name = dbTable["TABLE_NAME"];
                // create columns from the loaded columns
                table.columns = dbColumns
                    .filter(dbColumn => dbColumn["TABLE_NAME"] === table.name)
                    .map(dbColumn => {
                    const columnConstraints = dbConstraints.filter(dbConstraint => dbConstraint["TABLE_NAME"] === table.name && dbConstraint["COLUMN_NAME"] === dbColumn["COLUMN_NAME"]);
                    const uniqueConstraint = columnConstraints.find(constraint => constraint["CONSTRAINT_TYPE"] === "U");
                    const isConstraintComposite = uniqueConstraint
                        ? !!dbConstraints.find(dbConstraint => dbConstraint["CONSTRAINT_TYPE"] === "U"
                            && dbConstraint["CONSTRAINT_NAME"] === uniqueConstraint["CONSTRAINT_NAME"]
                            && dbConstraint["COLUMN_NAME"] !== dbColumn["COLUMN_NAME"])
                        : false;
                    const isUnique = !!uniqueConstraint && !isConstraintComposite;
                    const isPrimary = !!columnConstraints.find(constraint => constraint["CONSTRAINT_TYPE"] === "P");
                    const tableColumn = new TableColumn();
                    tableColumn.name = dbColumn["COLUMN_NAME"];
                    tableColumn.type = dbColumn["DATA_TYPE"].toLowerCase();
                    if (tableColumn.type.indexOf("(") !== -1)
                        tableColumn.type = tableColumn.type.replace(/\([0-9]*\)/, "");
                    // check only columns that have length property
                    if (this.driver.withLengthColumnTypes.indexOf(tableColumn.type) !== -1) {
                        const length = tableColumn.type === "raw" ? dbColumn["DATA_LENGTH"] : dbColumn["CHAR_COL_DECL_LENGTH"];
                        tableColumn.length = length && !this.isDefaultColumnLength(table, tableColumn, length) ? length.toString() : "";
                    }
                    if (tableColumn.type === "number" || tableColumn.type === "float") {
                        if (dbColumn["DATA_PRECISION"] !== null && !this.isDefaultColumnPrecision(table, tableColumn, dbColumn["DATA_PRECISION"]))
                            tableColumn.precision = dbColumn["DATA_PRECISION"];
                        if (dbColumn["DATA_SCALE"] !== null && !this.isDefaultColumnScale(table, tableColumn, dbColumn["DATA_SCALE"]))
                            tableColumn.scale = dbColumn["DATA_SCALE"];
                    }
                    else if ((tableColumn.type === "timestamp"
                        || tableColumn.type === "timestamp with time zone"
                        || tableColumn.type === "timestamp with local time zone") && dbColumn["DATA_SCALE"] !== null) {
                        tableColumn.precision = !this.isDefaultColumnPrecision(table, tableColumn, dbColumn["DATA_SCALE"]) ? dbColumn["DATA_SCALE"] : undefined;
                    }
                    tableColumn.default = dbColumn["DATA_DEFAULT"] !== null
                        && dbColumn["DATA_DEFAULT"] !== undefined
                        && dbColumn["DATA_DEFAULT"].trim() !== "NULL" ? tableColumn.default = dbColumn["DATA_DEFAULT"].trim() : undefined;
                    tableColumn.isNullable = dbColumn["NULLABLE"] === "Y";
                    tableColumn.isUnique = isUnique;
                    tableColumn.isPrimary = isPrimary;
                    tableColumn.isGenerated = dbColumn["IDENTITY_COLUMN"] === "YES";
                    if (tableColumn.isGenerated) {
                        tableColumn.generationStrategy = "increment";
                        tableColumn.default = undefined;
                    }
                    tableColumn.comment = ""; // todo
                    return tableColumn;
                });
                // find unique constraints of table, group them by constraint name and build TableUnique.
                const tableUniqueConstraints = OrmUtils.uniq(dbConstraints.filter(dbConstraint => {
                    return dbConstraint["TABLE_NAME"] === table.name && dbConstraint["CONSTRAINT_TYPE"] === "U";
                }), dbConstraint => dbConstraint["CONSTRAINT_NAME"]);
                table.uniques = tableUniqueConstraints.map(constraint => {
                    const uniques = dbConstraints.filter(dbC => dbC["CONSTRAINT_NAME"] === constraint["CONSTRAINT_NAME"]);
                    return new TableUnique({
                        name: constraint["CONSTRAINT_NAME"],
                        columnNames: uniques.map(u => u["COLUMN_NAME"])
                    });
                });
                // find check constraints of table, group them by constraint name and build TableCheck.
                const tableCheckConstraints = OrmUtils.uniq(dbConstraints.filter(dbConstraint => {
                    return dbConstraint["TABLE_NAME"] === table.name && dbConstraint["CONSTRAINT_TYPE"] === "C";
                }), dbConstraint => dbConstraint["CONSTRAINT_NAME"]);
                table.checks = tableCheckConstraints.map(constraint => {
                    const checks = dbConstraints.filter(dbC => dbC["CONSTRAINT_NAME"] === constraint["CONSTRAINT_NAME"]);
                    return new TableCheck({
                        name: constraint["CONSTRAINT_NAME"],
                        columnNames: checks.map(c => c["COLUMN_NAME"]),
                        expression: constraint["SEARCH_CONDITION"]
                    });
                });
                // find foreign key constraints of table, group them by constraint name and build TableForeignKey.
                const tableForeignKeyConstraints = OrmUtils.uniq(dbForeignKeys.filter(dbForeignKey => {
                    return dbForeignKey["TABLE_NAME"] === table.name;
                }), dbForeignKey => dbForeignKey["CONSTRAINT_NAME"]);
                table.foreignKeys = tableForeignKeyConstraints.map(dbForeignKey => {
                    const foreignKeys = dbForeignKeys.filter(dbFk => dbFk["CONSTRAINT_NAME"] === dbForeignKey["CONSTRAINT_NAME"]);
                    return new TableForeignKey({
                        name: dbForeignKey["CONSTRAINT_NAME"],
                        columnNames: foreignKeys.map(dbFk => dbFk["COLUMN_NAME"]),
                        referencedTableName: dbForeignKey["REFERENCED_TABLE_NAME"],
                        referencedColumnNames: foreignKeys.map(dbFk => dbFk["REFERENCED_COLUMN_NAME"]),
                        onDelete: dbForeignKey["ON_DELETE"],
                        onUpdate: "NO ACTION", // Oracle does not have onUpdate option in FK's, but we need it for proper synchronization
                    });
                });
                // create TableIndex objects from the loaded indices
                table.indices = dbIndices
                    .filter(dbIndex => dbIndex["TABLE_NAME"] === table.name)
                    .map(dbIndex => {
                    return new TableIndex({
                        name: dbIndex["INDEX_NAME"],
                        columnNames: dbIndex["COLUMN_NAMES"].split(","),
                        isUnique: dbIndex["UNIQUENESS"] === "UNIQUE"
                    });
                });
                return table;
            });
        });
    }
    /**
     * Builds and returns SQL for create table.
     */
    createTableSql(table, createForeignKeys) {
        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(column)).join(", ");
        let sql = `CREATE TABLE "${table.name}" (${columnDefinitions}`;
        table.columns
            .filter(column => column.isUnique)
            .forEach(column => {
            const isUniqueExist = table.uniques.some(unique => unique.columnNames.length === 1 && unique.columnNames[0] === column.name);
            if (!isUniqueExist)
                table.uniques.push(new TableUnique({
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
                if (fk.onDelete && fk.onDelete !== "NO ACTION") // Oracle does not support NO ACTION, but we set NO ACTION by default in EntityMetadata
                    constraint += ` ON DELETE ${fk.onDelete}`;
                return constraint;
            }).join(", ");
            sql += `, ${foreignKeysSql}`;
        }
        const primaryColumns = table.columns.filter(column => column.isPrimary);
        if (primaryColumns.length > 0) {
            const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, primaryColumns.map(column => column.name));
            const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
            sql += `, CONSTRAINT "${primaryKeyName}" PRIMARY KEY (${columnNames})`;
        }
        sql += `)`;
        return new Query(sql);
    }
    /**
     * Builds drop table sql.
     */
    dropTableSql(tableOrName, ifExist) {
        const tableName = tableOrName instanceof Table ? tableOrName.name : tableOrName;
        const query = ifExist ? `DROP TABLE IF EXISTS "${tableName}"` : `DROP TABLE "${tableName}"`;
        return new Query(query);
    }
    createViewSql(view) {
        const materializedClause = view.materialized ? "MATERIALIZED " : "";
        if (typeof view.expression === "string") {
            return new Query(`CREATE ${materializedClause}VIEW "${view.name}" AS ${view.expression}`);
        }
        else {
            return new Query(`CREATE ${materializedClause}VIEW "${view.name}" AS ${view.expression(this.connection).getQuery()}`);
        }
    }
    insertViewDefinitionSql(view) {
        const expression = typeof view.expression === "string" ? view.expression.trim() : view.expression(this.connection).getQuery();
        const [query, parameters] = this.connection.createQueryBuilder()
            .insert()
            .into(this.getTypeormMetadataTableName())
            .values({ type: "VIEW", name: view.name, value: expression })
            .getQueryAndParameters();
        return new Query(query, parameters);
    }
    /**
     * Builds drop view sql.
     */
    dropViewSql(viewOrPath) {
        const viewName = viewOrPath instanceof View ? viewOrPath.name : viewOrPath;
        return new Query(`DROP VIEW "${viewName}"`);
    }
    /**
     * Builds remove view sql.
     */
    deleteViewDefinitionSql(viewOrPath) {
        const viewName = viewOrPath instanceof View ? viewOrPath.name : viewOrPath;
        const qb = this.connection.createQueryBuilder();
        const [query, parameters] = qb.delete()
            .from(this.getTypeormMetadataTableName())
            .where(`${qb.escape("type")} = 'VIEW'`)
            .andWhere(`${qb.escape("name")} = :name`, { name: viewName })
            .getQueryAndParameters();
        return new Query(query, parameters);
    }
    /**
     * Builds create index sql.
     */
    createIndexSql(table, index) {
        const columns = index.columnNames.map(columnName => `"${columnName}"`).join(", ");
        return new Query(`CREATE ${index.isUnique ? "UNIQUE " : ""}INDEX "${index.name}" ON "${table.name}" (${columns})`);
    }
    /**
     * Builds drop index sql.
     */
    dropIndexSql(indexOrName) {
        let indexName = indexOrName instanceof TableIndex ? indexOrName.name : indexOrName;
        return new Query(`DROP INDEX "${indexName}"`);
    }
    /**
     * Builds create primary key sql.
     */
    createPrimaryKeySql(table, columnNames) {
        const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, columnNames);
        const columnNamesString = columnNames.map(columnName => `"${columnName}"`).join(", ");
        return new Query(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${primaryKeyName}" PRIMARY KEY (${columnNamesString})`);
    }
    /**
     * Builds drop primary key sql.
     */
    dropPrimaryKeySql(table) {
        const columnNames = table.primaryColumns.map(column => column.name);
        const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, columnNames);
        return new Query(`ALTER TABLE "${table.name}" DROP CONSTRAINT "${primaryKeyName}"`);
    }
    /**
     * Builds create unique constraint sql.
     */
    createUniqueConstraintSql(table, uniqueConstraint) {
        const columnNames = uniqueConstraint.columnNames.map(column => `"` + column + `"`).join(", ");
        return new Query(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${uniqueConstraint.name}" UNIQUE (${columnNames})`);
    }
    /**
     * Builds drop unique constraint sql.
     */
    dropUniqueConstraintSql(table, uniqueOrName) {
        const uniqueName = uniqueOrName instanceof TableUnique ? uniqueOrName.name : uniqueOrName;
        return new Query(`ALTER TABLE "${table.name}" DROP CONSTRAINT "${uniqueName}"`);
    }
    /**
     * Builds create check constraint sql.
     */
    createCheckConstraintSql(table, checkConstraint) {
        return new Query(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${checkConstraint.name}" CHECK (${checkConstraint.expression})`);
    }
    /**
     * Builds drop check constraint sql.
     */
    dropCheckConstraintSql(table, checkOrName) {
        const checkName = checkOrName instanceof TableCheck ? checkOrName.name : checkOrName;
        return new Query(`ALTER TABLE "${table.name}" DROP CONSTRAINT "${checkName}"`);
    }
    /**
     * Builds create foreign key sql.
     */
    createForeignKeySql(table, foreignKey) {
        const columnNames = foreignKey.columnNames.map(column => `"` + column + `"`).join(", ");
        const referencedColumnNames = foreignKey.referencedColumnNames.map(column => `"` + column + `"`).join(",");
        let sql = `ALTER TABLE "${table.name}" ADD CONSTRAINT "${foreignKey.name}" FOREIGN KEY (${columnNames}) ` +
            `REFERENCES "${foreignKey.referencedTableName}" (${referencedColumnNames})`;
        // Oracle does not support NO ACTION, but we set NO ACTION by default in EntityMetadata
        if (foreignKey.onDelete && foreignKey.onDelete !== "NO ACTION")
            sql += ` ON DELETE ${foreignKey.onDelete}`;
        return new Query(sql);
    }
    /**
     * Builds drop foreign key sql.
     */
    dropForeignKeySql(table, foreignKeyOrName) {
        const foreignKeyName = foreignKeyOrName instanceof TableForeignKey ? foreignKeyOrName.name : foreignKeyOrName;
        return new Query(`ALTER TABLE "${table.name}" DROP CONSTRAINT "${foreignKeyName}"`);
    }
    /**
     * Builds a query for create column.
     */
    buildCreateColumnSql(column) {
        let c = `"${column.name}" ` + this.connection.driver.createFullType(column);
        if (column.charset)
            c += " CHARACTER SET " + column.charset;
        if (column.collation)
            c += " COLLATE " + column.collation;
        if (column.default !== undefined && column.default !== null) // DEFAULT must be placed before NOT NULL
            c += " DEFAULT " + column.default;
        if (column.isNullable !== true && !column.isGenerated) // NOT NULL is not supported with GENERATED
            c += " NOT NULL";
        if (column.isGenerated === true && column.generationStrategy === "increment")
            c += " GENERATED BY DEFAULT AS IDENTITY";
        return c;
    }
}

//# sourceMappingURL=OracleQueryRunner.js.map
