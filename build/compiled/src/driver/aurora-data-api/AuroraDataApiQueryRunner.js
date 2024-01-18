"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuroraDataApiQueryRunner = void 0;
const tslib_1 = require("tslib");
const TransactionAlreadyStartedError_1 = require("../../error/TransactionAlreadyStartedError");
const TransactionNotStartedError_1 = require("../../error/TransactionNotStartedError");
const TableColumn_1 = require("../../schema-builder/table/TableColumn");
const Table_1 = require("../../schema-builder/table/Table");
const TableForeignKey_1 = require("../../schema-builder/table/TableForeignKey");
const TableIndex_1 = require("../../schema-builder/table/TableIndex");
const QueryRunnerAlreadyReleasedError_1 = require("../../error/QueryRunnerAlreadyReleasedError");
const View_1 = require("../../schema-builder/view/View");
const Query_1 = require("../Query");
const OrmUtils_1 = require("../../util/OrmUtils");
const TableUnique_1 = require("../../schema-builder/table/TableUnique");
const BaseQueryRunner_1 = require("../../query-runner/BaseQueryRunner");
const Broadcaster_1 = require("../../subscriber/Broadcaster");
const BroadcasterResult_1 = require("../../subscriber/BroadcasterResult");
/**
 * Runs queries on a single mysql database connection.
 */
class AuroraDataApiQueryRunner extends BaseQueryRunner_1.BaseQueryRunner {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(driver, client) {
        super();
        this.driver = driver;
        this.connection = driver.connection;
        this.client = client;
        this.broadcaster = new Broadcaster_1.Broadcaster(this);
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates/uses database connection from the connection pool to perform further operations.
     * Returns obtained database connection.
     */
    connect() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return {};
        });
    }
    /**
     * Releases used database connection.
     * You cannot use query runner methods once its released.
     */
    release() {
        this.isReleased = true;
        if (this.databaseConnection)
            this.databaseConnection.release();
        return Promise.resolve();
    }
    /**
     * Starts transaction on the current connection.
     */
    startTransaction(isolationLevel) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.isTransactionActive)
                throw new TransactionAlreadyStartedError_1.TransactionAlreadyStartedError();
            const beforeBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
            this.broadcaster.broadcastBeforeTransactionStartEvent(beforeBroadcastResult);
            if (beforeBroadcastResult.promises.length > 0)
                yield Promise.all(beforeBroadcastResult.promises);
            this.isTransactionActive = true;
            yield this.client.startTransaction();
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
            yield this.client.commitTransaction();
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
            yield this.client.rollbackTransaction();
            this.isTransactionActive = false;
            const afterBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
            this.broadcaster.broadcastAfterTransactionRollbackEvent(afterBroadcastResult);
            if (afterBroadcastResult.promises.length > 0)
                yield Promise.all(afterBroadcastResult.promises);
        });
    }
    /**
     * Executes a raw SQL query.
     */
    query(query, parameters) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.isReleased)
                throw new QueryRunnerAlreadyReleasedError_1.QueryRunnerAlreadyReleasedError();
            const result = yield this.client.query(query, parameters);
            if (result.records) {
                return result.records;
            }
            return result;
        });
    }
    /**
     * Returns raw data stream.
     */
    stream(query, parameters, onEnd, onError) {
        if (this.isReleased)
            throw new QueryRunnerAlreadyReleasedError_1.QueryRunnerAlreadyReleasedError();
        return new Promise((ok, fail) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const databaseConnection = yield this.connect();
                const stream = databaseConnection.query(query, parameters);
                if (onEnd)
                    stream.on("end", onEnd);
                if (onError)
                    stream.on("error", onError);
                ok(stream);
            }
            catch (err) {
                fail(err);
            }
        }));
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
            throw new Error(`MySql driver does not support table schemas`);
        });
    }
    /**
     * Checks if database with the given name exist.
     */
    hasDatabase(database) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const result = yield this.query(`SELECT * FROM \`INFORMATION_SCHEMA\`.\`SCHEMATA\` WHERE \`SCHEMA_NAME\` = '${database}'`);
            return result.length ? true : false;
        });
    }
    /**
     * Checks if schema with the given name exist.
     */
    hasSchema(schema) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`MySql driver does not support table schemas`);
        });
    }
    /**
     * Checks if table with the given name exist in the database.
     */
    hasTable(tableOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const parsedTableName = this.parseTableName(tableOrName);
            const sql = `SELECT * FROM \`INFORMATION_SCHEMA\`.\`COLUMNS\` WHERE \`TABLE_SCHEMA\` = '${parsedTableName.database}' AND \`TABLE_NAME\` = '${parsedTableName.tableName}'`;
            const result = yield this.query(sql);
            return result.length ? true : false;
        });
    }
    /**
     * Checks if column with the given name exist in the given table.
     */
    hasColumn(tableOrName, column) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const parsedTableName = this.parseTableName(tableOrName);
            const columnName = column instanceof TableColumn_1.TableColumn ? column.name : column;
            const sql = `SELECT * FROM \`INFORMATION_SCHEMA\`.\`COLUMNS\` WHERE \`TABLE_SCHEMA\` = '${parsedTableName.database}' AND \`TABLE_NAME\` = '${parsedTableName.tableName}' AND \`COLUMN_NAME\` = '${columnName}'`;
            const result = yield this.query(sql);
            return result.length ? true : false;
        });
    }
    /**
     * Creates a new database.
     */
    createDatabase(database, ifNotExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const up = ifNotExist ? `CREATE DATABASE IF NOT EXISTS \`${database}\`` : `CREATE DATABASE \`${database}\``;
            const down = `DROP DATABASE \`${database}\``;
            yield this.executeQueries(new Query_1.Query(up), new Query_1.Query(down));
        });
    }
    /**
     * Drops database.
     */
    dropDatabase(database, ifExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const up = ifExist ? `DROP DATABASE IF EXISTS \`${database}\`` : `DROP DATABASE \`${database}\``;
            const down = `CREATE DATABASE \`${database}\``;
            yield this.executeQueries(new Query_1.Query(up), new Query_1.Query(down));
        });
    }
    /**
     * Creates a new table schema.
     */
    createSchema(schema, ifNotExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema create queries are not supported by MySql driver.`);
        });
    }
    /**
     * Drops table schema.
     */
    dropSchema(schemaPath, ifExist) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Schema drop queries are not supported by MySql driver.`);
        });
    }
    /**
     * Creates a new table.
     */
    createTable(table, ifNotExist = false, createForeignKeys = true) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (ifNotExist) {
                const isTableExist = yield this.hasTable(table);
                if (isTableExist)
                    return Promise.resolve();
            }
            const upQueries = [];
            const downQueries = [];
            upQueries.push(this.createTableSql(table, createForeignKeys));
            downQueries.push(this.dropTableSql(table));
            // we must first drop indices, than drop foreign keys, because drop queries runs in reversed order
            // and foreign keys will be dropped first as indices. This order is very important, because we can't drop index
            // if it related to the foreign key.
            // createTable does not need separate method to create indices, because it create indices in the same query with table creation.
            table.indices.forEach(index => downQueries.push(this.dropIndexSql(table, index)));
            // if createForeignKeys is true, we must drop created foreign keys in down query.
            // createTable does not need separate method to create foreign keys, because it create fk's in the same query with table creation.
            if (createForeignKeys)
                table.foreignKeys.forEach(foreignKey => downQueries.push(this.dropForeignKeySql(table, foreignKey)));
            return this.executeQueries(upQueries, downQueries);
        });
    }
    /**
     * Drop the table.
     */
    dropTable(target, ifExist, dropForeignKeys = true) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // It needs because if table does not exist and dropForeignKeys or dropIndices is true, we don't need
            // to perform drop queries for foreign keys and indices.
            if (ifExist) {
                const isTableExist = yield this.hasTable(target);
                if (!isTableExist)
                    return Promise.resolve();
            }
            // if dropTable called with dropForeignKeys = true, we must create foreign keys in down query.
            const createForeignKeys = dropForeignKeys;
            const tableName = target instanceof Table_1.Table ? target.name : target;
            const table = yield this.getCachedTable(tableName);
            const upQueries = [];
            const downQueries = [];
            if (dropForeignKeys)
                table.foreignKeys.forEach(foreignKey => upQueries.push(this.dropForeignKeySql(table, foreignKey)));
            table.indices.forEach(index => upQueries.push(this.dropIndexSql(table, index)));
            upQueries.push(this.dropTableSql(table));
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
            upQueries.push(yield this.insertViewDefinitionSql(view));
            downQueries.push(this.dropViewSql(view));
            downQueries.push(yield this.deleteViewDefinitionSql(view));
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
            upQueries.push(yield this.deleteViewDefinitionSql(view));
            upQueries.push(this.dropViewSql(view));
            downQueries.push(yield this.insertViewDefinitionSql(view));
            downQueries.push(this.createViewSql(view));
            yield this.executeQueries(upQueries, downQueries);
        });
    }
    /**
     * Renames a table.
     */
    renameTable(oldTableOrName, newTableName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const upQueries = [];
            const downQueries = [];
            const oldTable = oldTableOrName instanceof Table_1.Table ? oldTableOrName : yield this.getCachedTable(oldTableOrName);
            const newTable = oldTable.clone();
            const dbName = oldTable.name.indexOf(".") === -1 ? undefined : oldTable.name.split(".")[0];
            newTable.name = dbName ? `${dbName}.${newTableName}` : newTableName;
            // rename table
            upQueries.push(new Query_1.Query(`RENAME TABLE ${this.escapePath(oldTable.name)} TO ${this.escapePath(newTable.name)}`));
            downQueries.push(new Query_1.Query(`RENAME TABLE ${this.escapePath(newTable.name)} TO ${this.escapePath(oldTable.name)}`));
            // rename index constraints
            newTable.indices.forEach(index => {
                // build new constraint name
                const columnNames = index.columnNames.map(column => `\`${column}\``).join(", ");
                const newIndexName = this.connection.namingStrategy.indexName(newTable, index.columnNames, index.where);
                // build queries
                let indexType = "";
                if (index.isUnique)
                    indexType += "UNIQUE ";
                if (index.isSpatial)
                    indexType += "SPATIAL ";
                if (index.isFulltext)
                    indexType += "FULLTEXT ";
                upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(newTable)} DROP INDEX \`${index.name}\`, ADD ${indexType}INDEX \`${newIndexName}\` (${columnNames})`));
                downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(newTable)} DROP INDEX \`${newIndexName}\`, ADD ${indexType}INDEX \`${index.name}\` (${columnNames})`));
                // replace constraint name
                index.name = newIndexName;
            });
            // rename foreign key constraint
            newTable.foreignKeys.forEach(foreignKey => {
                // build new constraint name
                const columnNames = foreignKey.columnNames.map(column => `\`${column}\``).join(", ");
                const referencedColumnNames = foreignKey.referencedColumnNames.map(column => `\`${column}\``).join(",");
                const newForeignKeyName = this.connection.namingStrategy.foreignKeyName(newTable, foreignKey.columnNames);
                // build queries
                let up = `ALTER TABLE ${this.escapePath(newTable)} DROP FOREIGN KEY \`${foreignKey.name}\`, ADD CONSTRAINT \`${newForeignKeyName}\` FOREIGN KEY (${columnNames}) ` +
                    `REFERENCES ${this.escapePath(foreignKey.referencedTableName)}(${referencedColumnNames})`;
                if (foreignKey.onDelete)
                    up += ` ON DELETE ${foreignKey.onDelete}`;
                if (foreignKey.onUpdate)
                    up += ` ON UPDATE ${foreignKey.onUpdate}`;
                let down = `ALTER TABLE ${this.escapePath(newTable)} DROP FOREIGN KEY \`${newForeignKeyName}\`, ADD CONSTRAINT \`${foreignKey.name}\` FOREIGN KEY (${columnNames}) ` +
                    `REFERENCES ${this.escapePath(foreignKey.referencedTableName)}(${referencedColumnNames})`;
                if (foreignKey.onDelete)
                    down += ` ON DELETE ${foreignKey.onDelete}`;
                if (foreignKey.onUpdate)
                    down += ` ON UPDATE ${foreignKey.onUpdate}`;
                upQueries.push(new Query_1.Query(up));
                downQueries.push(new Query_1.Query(down));
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const clonedTable = table.clone();
            const upQueries = [];
            const downQueries = [];
            const skipColumnLevelPrimary = clonedTable.primaryColumns.length > 0;
            upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD ${this.buildCreateColumnSql(column, skipColumnLevelPrimary, false)}`));
            downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP COLUMN \`${column.name}\``));
            // create or update primary key constraint
            if (column.isPrimary && skipColumnLevelPrimary) {
                // if we already have generated column, we must temporary drop AUTO_INCREMENT property.
                const generatedColumn = clonedTable.columns.find(column => column.isGenerated && column.generationStrategy === "increment");
                if (generatedColumn) {
                    const nonGeneratedColumn = generatedColumn.clone();
                    nonGeneratedColumn.isGenerated = false;
                    nonGeneratedColumn.generationStrategy = undefined;
                    upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} CHANGE \`${column.name}\` ${this.buildCreateColumnSql(nonGeneratedColumn, true)}`));
                    downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} CHANGE \`${nonGeneratedColumn.name}\` ${this.buildCreateColumnSql(column, true)}`));
                }
                const primaryColumns = clonedTable.primaryColumns;
                let columnNames = primaryColumns.map(column => `\`${column.name}\``).join(", ");
                upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP PRIMARY KEY`));
                downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD PRIMARY KEY (${columnNames})`));
                primaryColumns.push(column);
                columnNames = primaryColumns.map(column => `\`${column.name}\``).join(", ");
                upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD PRIMARY KEY (${columnNames})`));
                downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP PRIMARY KEY`));
                // if we previously dropped AUTO_INCREMENT property, we must bring it back
                if (generatedColumn) {
                    const nonGeneratedColumn = generatedColumn.clone();
                    nonGeneratedColumn.isGenerated = false;
                    nonGeneratedColumn.generationStrategy = undefined;
                    upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} CHANGE \`${nonGeneratedColumn.name}\` ${this.buildCreateColumnSql(column, true)}`));
                    downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} CHANGE \`${column.name}\` ${this.buildCreateColumnSql(nonGeneratedColumn, true)}`));
                }
            }
            // create column index
            const columnIndex = clonedTable.indices.find(index => index.columnNames.length === 1 && index.columnNames[0] === column.name);
            if (columnIndex) {
                upQueries.push(this.createIndexSql(table, columnIndex));
                downQueries.push(this.dropIndexSql(table, columnIndex));
            }
            else if (column.isUnique) {
                const uniqueIndex = new TableIndex_1.TableIndex({
                    name: this.connection.namingStrategy.indexName(table.name, [column.name]),
                    columnNames: [column.name],
                    isUnique: true
                });
                clonedTable.indices.push(uniqueIndex);
                clonedTable.uniques.push(new TableUnique_1.TableUnique({
                    name: uniqueIndex.name,
                    columnNames: uniqueIndex.columnNames
                }));
                upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD UNIQUE INDEX \`${uniqueIndex.name}\` (\`${column.name}\`)`));
                downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP INDEX \`${uniqueIndex.name}\``));
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const column of columns) {
                yield this.addColumn(tableOrName, column);
            }
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
            yield this.changeColumn(table, oldColumn, newColumn);
        });
    }
    /**
     * Changes a column in the table.
     */
    changeColumn(tableOrName, oldColumnOrName, newColumn) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            let clonedTable = table.clone();
            const upQueries = [];
            const downQueries = [];
            const oldColumn = oldColumnOrName instanceof TableColumn_1.TableColumn
                ? oldColumnOrName
                : table.columns.find(column => column.name === oldColumnOrName);
            if (!oldColumn)
                throw new Error(`Column "${oldColumnOrName}" was not found in the "${table.name}" table.`);
            if ((newColumn.isGenerated !== oldColumn.isGenerated && newColumn.generationStrategy !== "uuid")
                || oldColumn.type !== newColumn.type
                || oldColumn.length !== newColumn.length
                || oldColumn.generatedType !== newColumn.generatedType) {
                yield this.dropColumn(table, oldColumn);
                yield this.addColumn(table, newColumn);
                // update cloned table
                clonedTable = table.clone();
            }
            else {
                if (newColumn.name !== oldColumn.name) {
                    // We don't change any column properties, just rename it.
                    upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} CHANGE \`${oldColumn.name}\` \`${newColumn.name}\` ${this.buildCreateColumnSql(oldColumn, true, true)}`));
                    downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} CHANGE \`${newColumn.name}\` \`${oldColumn.name}\` ${this.buildCreateColumnSql(oldColumn, true, true)}`));
                    // rename index constraints
                    clonedTable.findColumnIndices(oldColumn).forEach(index => {
                        // build new constraint name
                        index.columnNames.splice(index.columnNames.indexOf(oldColumn.name), 1);
                        index.columnNames.push(newColumn.name);
                        const columnNames = index.columnNames.map(column => `\`${column}\``).join(", ");
                        const newIndexName = this.connection.namingStrategy.indexName(clonedTable, index.columnNames, index.where);
                        // build queries
                        let indexType = "";
                        if (index.isUnique)
                            indexType += "UNIQUE ";
                        if (index.isSpatial)
                            indexType += "SPATIAL ";
                        if (index.isFulltext)
                            indexType += "FULLTEXT ";
                        upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP INDEX \`${index.name}\`, ADD ${indexType}INDEX \`${newIndexName}\` (${columnNames})`));
                        downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP INDEX \`${newIndexName}\`, ADD ${indexType}INDEX \`${index.name}\` (${columnNames})`));
                        // replace constraint name
                        index.name = newIndexName;
                    });
                    // rename foreign key constraints
                    clonedTable.findColumnForeignKeys(oldColumn).forEach(foreignKey => {
                        // build new constraint name
                        foreignKey.columnNames.splice(foreignKey.columnNames.indexOf(oldColumn.name), 1);
                        foreignKey.columnNames.push(newColumn.name);
                        const columnNames = foreignKey.columnNames.map(column => `\`${column}\``).join(", ");
                        const referencedColumnNames = foreignKey.referencedColumnNames.map(column => `\`${column}\``).join(",");
                        const newForeignKeyName = this.connection.namingStrategy.foreignKeyName(clonedTable, foreignKey.columnNames);
                        // build queries
                        let up = `ALTER TABLE ${this.escapePath(table)} DROP FOREIGN KEY \`${foreignKey.name}\`, ADD CONSTRAINT \`${newForeignKeyName}\` FOREIGN KEY (${columnNames}) ` +
                            `REFERENCES ${this.escapePath(foreignKey.referencedTableName)}(${referencedColumnNames})`;
                        if (foreignKey.onDelete)
                            up += ` ON DELETE ${foreignKey.onDelete}`;
                        if (foreignKey.onUpdate)
                            up += ` ON UPDATE ${foreignKey.onUpdate}`;
                        let down = `ALTER TABLE ${this.escapePath(table)} DROP FOREIGN KEY \`${newForeignKeyName}\`, ADD CONSTRAINT \`${foreignKey.name}\` FOREIGN KEY (${columnNames}) ` +
                            `REFERENCES ${this.escapePath(foreignKey.referencedTableName)}(${referencedColumnNames})`;
                        if (foreignKey.onDelete)
                            down += ` ON DELETE ${foreignKey.onDelete}`;
                        if (foreignKey.onUpdate)
                            down += ` ON UPDATE ${foreignKey.onUpdate}`;
                        upQueries.push(new Query_1.Query(up));
                        downQueries.push(new Query_1.Query(down));
                        // replace constraint name
                        foreignKey.name = newForeignKeyName;
                    });
                    // rename old column in the Table object
                    const oldTableColumn = clonedTable.columns.find(column => column.name === oldColumn.name);
                    clonedTable.columns[clonedTable.columns.indexOf(oldTableColumn)].name = newColumn.name;
                    oldColumn.name = newColumn.name;
                }
                if (this.isColumnChanged(oldColumn, newColumn, true)) {
                    upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} CHANGE \`${oldColumn.name}\` ${this.buildCreateColumnSql(newColumn, true)}`));
                    downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} CHANGE \`${newColumn.name}\` ${this.buildCreateColumnSql(oldColumn, true)}`));
                }
                if (newColumn.isPrimary !== oldColumn.isPrimary) {
                    // if table have generated column, we must drop AUTO_INCREMENT before changing primary constraints.
                    const generatedColumn = clonedTable.columns.find(column => column.isGenerated && column.generationStrategy === "increment");
                    if (generatedColumn) {
                        const nonGeneratedColumn = generatedColumn.clone();
                        nonGeneratedColumn.isGenerated = false;
                        nonGeneratedColumn.generationStrategy = undefined;
                        upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} CHANGE \`${generatedColumn.name}\` ${this.buildCreateColumnSql(nonGeneratedColumn, true)}`));
                        downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} CHANGE \`${nonGeneratedColumn.name}\` ${this.buildCreateColumnSql(generatedColumn, true)}`));
                    }
                    const primaryColumns = clonedTable.primaryColumns;
                    // if primary column state changed, we must always drop existed constraint.
                    if (primaryColumns.length > 0) {
                        const columnNames = primaryColumns.map(column => `\`${column.name}\``).join(", ");
                        upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP PRIMARY KEY`));
                        downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD PRIMARY KEY (${columnNames})`));
                    }
                    if (newColumn.isPrimary === true) {
                        primaryColumns.push(newColumn);
                        // update column in table
                        const column = clonedTable.columns.find(column => column.name === newColumn.name);
                        column.isPrimary = true;
                        const columnNames = primaryColumns.map(column => `\`${column.name}\``).join(", ");
                        upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD PRIMARY KEY (${columnNames})`));
                        downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP PRIMARY KEY`));
                    }
                    else {
                        const primaryColumn = primaryColumns.find(c => c.name === newColumn.name);
                        primaryColumns.splice(primaryColumns.indexOf(primaryColumn), 1);
                        // update column in table
                        const column = clonedTable.columns.find(column => column.name === newColumn.name);
                        column.isPrimary = false;
                        // if we have another primary keys, we must recreate constraint.
                        if (primaryColumns.length > 0) {
                            const columnNames = primaryColumns.map(column => `\`${column.name}\``).join(", ");
                            upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD PRIMARY KEY (${columnNames})`));
                            downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP PRIMARY KEY`));
                        }
                    }
                    // if we have generated column, and we dropped AUTO_INCREMENT property before, we must bring it back
                    if (generatedColumn) {
                        const nonGeneratedColumn = generatedColumn.clone();
                        nonGeneratedColumn.isGenerated = false;
                        nonGeneratedColumn.generationStrategy = undefined;
                        upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} CHANGE \`${nonGeneratedColumn.name}\` ${this.buildCreateColumnSql(generatedColumn, true)}`));
                        downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} CHANGE \`${generatedColumn.name}\` ${this.buildCreateColumnSql(nonGeneratedColumn, true)}`));
                    }
                }
                if (newColumn.isUnique !== oldColumn.isUnique) {
                    if (newColumn.isUnique === true) {
                        const uniqueIndex = new TableIndex_1.TableIndex({
                            name: this.connection.namingStrategy.indexName(table.name, [newColumn.name]),
                            columnNames: [newColumn.name],
                            isUnique: true
                        });
                        clonedTable.indices.push(uniqueIndex);
                        clonedTable.uniques.push(new TableUnique_1.TableUnique({
                            name: uniqueIndex.name,
                            columnNames: uniqueIndex.columnNames
                        }));
                        upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD UNIQUE INDEX \`${uniqueIndex.name}\` (\`${newColumn.name}\`)`));
                        downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP INDEX \`${uniqueIndex.name}\``));
                    }
                    else {
                        const uniqueIndex = clonedTable.indices.find(index => {
                            return index.columnNames.length === 1 && index.isUnique === true && !!index.columnNames.find(columnName => columnName === newColumn.name);
                        });
                        clonedTable.indices.splice(clonedTable.indices.indexOf(uniqueIndex), 1);
                        const tableUnique = clonedTable.uniques.find(unique => unique.name === uniqueIndex.name);
                        clonedTable.uniques.splice(clonedTable.uniques.indexOf(tableUnique), 1);
                        upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP INDEX \`${uniqueIndex.name}\``));
                        downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD UNIQUE INDEX \`${uniqueIndex.name}\` (\`${newColumn.name}\`)`));
                    }
                }
            }
            yield this.executeQueries(upQueries, downQueries);
            this.replaceCachedTable(table, clonedTable);
        });
    }
    /**
     * Changes a column in the table.
     */
    changeColumns(tableOrName, changedColumns) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const { oldColumn, newColumn } of changedColumns) {
                yield this.changeColumn(tableOrName, oldColumn, newColumn);
            }
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
            const clonedTable = table.clone();
            const upQueries = [];
            const downQueries = [];
            // drop primary key constraint
            if (column.isPrimary) {
                // if table have generated column, we must drop AUTO_INCREMENT before changing primary constraints.
                const generatedColumn = clonedTable.columns.find(column => column.isGenerated && column.generationStrategy === "increment");
                if (generatedColumn) {
                    const nonGeneratedColumn = generatedColumn.clone();
                    nonGeneratedColumn.isGenerated = false;
                    nonGeneratedColumn.generationStrategy = undefined;
                    upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} CHANGE \`${generatedColumn.name}\` ${this.buildCreateColumnSql(nonGeneratedColumn, true)}`));
                    downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} CHANGE \`${nonGeneratedColumn.name}\` ${this.buildCreateColumnSql(generatedColumn, true)}`));
                }
                // dropping primary key constraint
                const columnNames = clonedTable.primaryColumns.map(primaryColumn => `\`${primaryColumn.name}\``).join(", ");
                upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(clonedTable)} DROP PRIMARY KEY`));
                downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(clonedTable)} ADD PRIMARY KEY (${columnNames})`));
                // update column in table
                const tableColumn = clonedTable.findColumnByName(column.name);
                tableColumn.isPrimary = false;
                // if primary key have multiple columns, we must recreate it without dropped column
                if (clonedTable.primaryColumns.length > 0) {
                    const columnNames = clonedTable.primaryColumns.map(primaryColumn => `\`${primaryColumn.name}\``).join(", ");
                    upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(clonedTable)} ADD PRIMARY KEY (${columnNames})`));
                    downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(clonedTable)} DROP PRIMARY KEY`));
                }
                // if we have generated column, and we dropped AUTO_INCREMENT property before, and this column is not current dropping column, we must bring it back
                if (generatedColumn && generatedColumn.name !== column.name) {
                    const nonGeneratedColumn = generatedColumn.clone();
                    nonGeneratedColumn.isGenerated = false;
                    nonGeneratedColumn.generationStrategy = undefined;
                    upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} CHANGE \`${nonGeneratedColumn.name}\` ${this.buildCreateColumnSql(generatedColumn, true)}`));
                    downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} CHANGE \`${generatedColumn.name}\` ${this.buildCreateColumnSql(nonGeneratedColumn, true)}`));
                }
            }
            // drop column index
            const columnIndex = clonedTable.indices.find(index => index.columnNames.length === 1 && index.columnNames[0] === column.name);
            if (columnIndex) {
                clonedTable.indices.splice(clonedTable.indices.indexOf(columnIndex), 1);
                upQueries.push(this.dropIndexSql(table, columnIndex));
                downQueries.push(this.createIndexSql(table, columnIndex));
            }
            else if (column.isUnique) {
                // we splice constraints both from table uniques and indices.
                const uniqueName = this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]);
                const foundUnique = clonedTable.uniques.find(unique => unique.name === uniqueName);
                if (foundUnique)
                    clonedTable.uniques.splice(clonedTable.uniques.indexOf(foundUnique), 1);
                const indexName = this.connection.namingStrategy.indexName(table.name, [column.name]);
                const foundIndex = clonedTable.indices.find(index => index.name === indexName);
                if (foundIndex)
                    clonedTable.indices.splice(clonedTable.indices.indexOf(foundIndex), 1);
                upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP INDEX \`${indexName}\``));
                downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD UNIQUE INDEX \`${indexName}\` (\`${column.name}\`)`));
            }
            upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP COLUMN \`${column.name}\``));
            downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD ${this.buildCreateColumnSql(column, true)}`));
            yield this.executeQueries(upQueries, downQueries);
            clonedTable.removeColumn(column);
            this.replaceCachedTable(table, clonedTable);
        });
    }
    /**
     * Drops the columns in the table.
     */
    dropColumns(tableOrName, columns) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const column of columns) {
                yield this.dropColumn(tableOrName, column);
            }
        });
    }
    /**
     * Creates a new primary key.
     */
    createPrimaryKey(tableOrName, columnNames) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const clonedTable = table.clone();
            const up = this.createPrimaryKeySql(table, columnNames);
            const down = this.dropPrimaryKeySql(table);
            yield this.executeQueries(up, down);
            clonedTable.columns.forEach(column => {
                if (columnNames.find(columnName => columnName === column.name))
                    column.isPrimary = true;
            });
            this.replaceCachedTable(table, clonedTable);
        });
    }
    /**
     * Updates composite primary keys.
     */
    updatePrimaryKeys(tableOrName, columns) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const clonedTable = table.clone();
            const columnNames = columns.map(column => column.name);
            const upQueries = [];
            const downQueries = [];
            // if table have generated column, we must drop AUTO_INCREMENT before changing primary constraints.
            const generatedColumn = clonedTable.columns.find(column => column.isGenerated && column.generationStrategy === "increment");
            if (generatedColumn) {
                const nonGeneratedColumn = generatedColumn.clone();
                nonGeneratedColumn.isGenerated = false;
                nonGeneratedColumn.generationStrategy = undefined;
                upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} CHANGE \`${generatedColumn.name}\` ${this.buildCreateColumnSql(nonGeneratedColumn, true)}`));
                downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} CHANGE \`${nonGeneratedColumn.name}\` ${this.buildCreateColumnSql(generatedColumn, true)}`));
            }
            // if table already have primary columns, we must drop them.
            const primaryColumns = clonedTable.primaryColumns;
            if (primaryColumns.length > 0) {
                const columnNames = primaryColumns.map(column => `\`${column.name}\``).join(", ");
                upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP PRIMARY KEY`));
                downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD PRIMARY KEY (${columnNames})`));
            }
            // update columns in table.
            clonedTable.columns
                .filter(column => columnNames.indexOf(column.name) !== -1)
                .forEach(column => column.isPrimary = true);
            const columnNamesString = columnNames.map(columnName => `\`${columnName}\``).join(", ");
            upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD PRIMARY KEY (${columnNamesString})`));
            downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP PRIMARY KEY`));
            // if we already have generated column or column is changed to generated, and we dropped AUTO_INCREMENT property before, we must bring it back
            const newOrExistGeneratedColumn = generatedColumn ? generatedColumn : columns.find(column => column.isGenerated && column.generationStrategy === "increment");
            if (newOrExistGeneratedColumn) {
                const nonGeneratedColumn = newOrExistGeneratedColumn.clone();
                nonGeneratedColumn.isGenerated = false;
                nonGeneratedColumn.generationStrategy = undefined;
                upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} CHANGE \`${nonGeneratedColumn.name}\` ${this.buildCreateColumnSql(newOrExistGeneratedColumn, true)}`));
                downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} CHANGE \`${newOrExistGeneratedColumn.name}\` ${this.buildCreateColumnSql(nonGeneratedColumn, true)}`));
                // if column changed to generated, we must update it in table
                const changedGeneratedColumn = clonedTable.columns.find(column => column.name === newOrExistGeneratedColumn.name);
                changedGeneratedColumn.isGenerated = true;
                changedGeneratedColumn.generationStrategy = "increment";
            }
            yield this.executeQueries(upQueries, downQueries);
            this.replaceCachedTable(table, clonedTable);
        });
    }
    /**
     * Drops a primary key.
     */
    dropPrimaryKey(tableOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`MySql does not support unique constraints. Use unique index instead.`);
        });
    }
    /**
     * Creates a new unique constraints.
     */
    createUniqueConstraints(tableOrName, uniqueConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`MySql does not support unique constraints. Use unique index instead.`);
        });
    }
    /**
     * Drops an unique constraint.
     */
    dropUniqueConstraint(tableOrName, uniqueOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`MySql does not support unique constraints. Use unique index instead.`);
        });
    }
    /**
     * Drops an unique constraints.
     */
    dropUniqueConstraints(tableOrName, uniqueConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`MySql does not support unique constraints. Use unique index instead.`);
        });
    }
    /**
     * Creates a new check constraint.
     */
    createCheckConstraint(tableOrName, checkConstraint) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`MySql does not support check constraints.`);
        });
    }
    /**
     * Creates a new check constraints.
     */
    createCheckConstraints(tableOrName, checkConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`MySql does not support check constraints.`);
        });
    }
    /**
     * Drops check constraint.
     */
    dropCheckConstraint(tableOrName, checkOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`MySql does not support check constraints.`);
        });
    }
    /**
     * Drops check constraints.
     */
    dropCheckConstraints(tableOrName, checkConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`MySql does not support check constraints.`);
        });
    }
    /**
     * Creates a new exclusion constraint.
     */
    createExclusionConstraint(tableOrName, exclusionConstraint) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`MySql does not support exclusion constraints.`);
        });
    }
    /**
     * Creates a new exclusion constraints.
     */
    createExclusionConstraints(tableOrName, exclusionConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`MySql does not support exclusion constraints.`);
        });
    }
    /**
     * Drops exclusion constraint.
     */
    dropExclusionConstraint(tableOrName, exclusionOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`MySql does not support exclusion constraints.`);
        });
    }
    /**
     * Drops exclusion constraints.
     */
    dropExclusionConstraints(tableOrName, exclusionConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`MySql does not support exclusion constraints.`);
        });
    }
    /**
     * Creates a new foreign key.
     */
    createForeignKey(tableOrName, foreignKey) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            // new FK may be passed without name. In this case we generate FK name manually.
            if (!foreignKey.name)
                foreignKey.name = this.connection.namingStrategy.foreignKeyName(table.name, foreignKey.columnNames);
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const promises = foreignKeys.map(foreignKey => this.createForeignKey(tableOrName, foreignKey));
            yield Promise.all(promises);
        });
    }
    /**
     * Drops a foreign key.
     */
    dropForeignKey(tableOrName, foreignKeyOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const foreignKey = foreignKeyOrName instanceof TableForeignKey_1.TableForeignKey ? foreignKeyOrName : table.foreignKeys.find(fk => fk.name === foreignKeyOrName);
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const promises = foreignKeys.map(foreignKey => this.dropForeignKey(tableOrName, foreignKey));
            yield Promise.all(promises);
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
            const down = this.dropIndexSql(table, index);
            yield this.executeQueries(up, down);
            table.addIndex(index, true);
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
     * Drops an index.
     */
    dropIndex(tableOrName, indexOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const index = indexOrName instanceof TableIndex_1.TableIndex ? indexOrName : table.indices.find(i => i.name === indexOrName);
            if (!index)
                throw new Error(`Supplied index was not found in table ${table.name}`);
            const up = this.dropIndexSql(table, index);
            const down = this.createIndexSql(table, index);
            yield this.executeQueries(up, down);
            table.removeIndex(index, true);
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
    clearTable(tableOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.query(`TRUNCATE TABLE ${this.escapePath(tableOrName)}`);
        });
    }
    /**
     * Removes all tables from the currently connected database.
     * Be careful using this method and avoid using it in production or migrations
     * (because it can clear all your database).
     */
    clearDatabase(database) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const dbName = database ? database : this.driver.database;
            if (dbName) {
                const isDatabaseExist = yield this.hasDatabase(dbName);
                if (!isDatabaseExist)
                    return Promise.resolve();
            }
            else {
                throw new Error(`Can not clear database. No database is specified`);
            }
            yield this.startTransaction();
            try {
                const selectViewDropsQuery = `SELECT concat('DROP VIEW IF EXISTS \`', table_schema, '\`.\`', table_name, '\`') AS \`query\` FROM \`INFORMATION_SCHEMA\`.\`VIEWS\` WHERE \`TABLE_SCHEMA\` = '${dbName}'`;
                const dropViewQueries = yield this.query(selectViewDropsQuery);
                yield Promise.all(dropViewQueries.map(q => this.query(q["query"])));
                const disableForeignKeysCheckQuery = `SET FOREIGN_KEY_CHECKS = 0;`;
                const dropTablesQuery = `SELECT concat('DROP TABLE IF EXISTS \`', table_schema, '\`.\`', table_name, '\`') AS \`query\` FROM \`INFORMATION_SCHEMA\`.\`TABLES\` WHERE \`TABLE_SCHEMA\` = '${dbName}'`;
                const enableForeignKeysCheckQuery = `SET FOREIGN_KEY_CHECKS = 1;`;
                yield this.query(disableForeignKeysCheckQuery);
                const dropQueries = yield this.query(dropTablesQuery);
                yield Promise.all(dropQueries.map(query => this.query(query["query"])));
                yield this.query(enableForeignKeysCheckQuery);
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
    /**
     * Returns current database.
     */
    getCurrentDatabase() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const currentDBQuery = yield this.query(`SELECT DATABASE() AS \`db_name\``);
            return currentDBQuery[0]["db_name"];
        });
    }
    loadViews(viewNames) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const hasTable = yield this.hasTable(this.getTypeormMetadataTableName());
            if (!hasTable)
                return Promise.resolve([]);
            const currentDatabase = yield this.getCurrentDatabase();
            const viewsCondition = viewNames.map(tableName => {
                let [database, name] = tableName.split(".");
                if (!name) {
                    name = database;
                    database = this.driver.database || currentDatabase;
                }
                return `(\`t\`.\`schema\` = '${database}' AND \`t\`.\`name\` = '${name}')`;
            }).join(" OR ");
            const query = `SELECT \`t\`.*, \`v\`.\`check_option\` FROM ${this.escapePath(this.getTypeormMetadataTableName())} \`t\` ` +
                `INNER JOIN \`information_schema\`.\`views\` \`v\` ON \`v\`.\`table_schema\` = \`t\`.\`schema\` AND \`v\`.\`table_name\` = \`t\`.\`name\` WHERE \`t\`.\`type\` = 'VIEW' ${viewsCondition ? `AND (${viewsCondition})` : ""}`;
            const dbViews = yield this.query(query);
            return dbViews.map((dbView) => {
                const view = new View_1.View();
                const db = dbView["schema"] === currentDatabase ? undefined : dbView["schema"];
                view.name = this.driver.buildTableName(dbView["name"], undefined, db);
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
            const currentDatabase = yield this.getCurrentDatabase();
            const tablesCondition = tableNames.map(tableName => {
                let [database, name] = tableName.split(".");
                if (!name) {
                    name = database;
                    database = this.driver.database || currentDatabase;
                }
                return `(\`TABLE_SCHEMA\` = '${database}' AND \`TABLE_NAME\` = '${name}')`;
            }).join(" OR ");
            const tablesSql = `SELECT * FROM \`INFORMATION_SCHEMA\`.\`TABLES\` WHERE ` + tablesCondition;
            const columnsSql = `SELECT * FROM \`INFORMATION_SCHEMA\`.\`COLUMNS\` WHERE ` + tablesCondition;
            const primaryKeySql = `SELECT * FROM \`INFORMATION_SCHEMA\`.\`KEY_COLUMN_USAGE\` WHERE \`CONSTRAINT_NAME\` = 'PRIMARY' AND (${tablesCondition})`;
            const collationsSql = `SELECT \`SCHEMA_NAME\`, \`DEFAULT_CHARACTER_SET_NAME\` as \`CHARSET\`, \`DEFAULT_COLLATION_NAME\` AS \`COLLATION\` FROM \`INFORMATION_SCHEMA\`.\`SCHEMATA\``;
            const indicesCondition = tableNames.map(tableName => {
                let [database, name] = tableName.split(".");
                if (!name) {
                    name = database;
                    database = this.driver.database || currentDatabase;
                }
                return `(\`s\`.\`TABLE_SCHEMA\` = '${database}' AND \`s\`.\`TABLE_NAME\` = '${name}')`;
            }).join(" OR ");
            const indicesSql = `SELECT \`s\`.* FROM \`INFORMATION_SCHEMA\`.\`STATISTICS\` \`s\` ` +
                `LEFT JOIN \`INFORMATION_SCHEMA\`.\`REFERENTIAL_CONSTRAINTS\` \`rc\` ON \`s\`.\`INDEX_NAME\` = \`rc\`.\`CONSTRAINT_NAME\` ` +
                `WHERE (${indicesCondition}) AND \`s\`.\`INDEX_NAME\` != 'PRIMARY' AND \`rc\`.\`CONSTRAINT_NAME\` IS NULL`;
            const foreignKeysCondition = tableNames.map(tableName => {
                let [database, name] = tableName.split(".");
                if (!name) {
                    name = database;
                    database = this.driver.database || currentDatabase;
                }
                return `(\`kcu\`.\`TABLE_SCHEMA\` = '${database}' AND \`kcu\`.\`TABLE_NAME\` = '${name}')`;
            }).join(" OR ");
            const foreignKeysSql = `SELECT \`kcu\`.\`TABLE_SCHEMA\`, \`kcu\`.\`TABLE_NAME\`, \`kcu\`.\`CONSTRAINT_NAME\`, \`kcu\`.\`COLUMN_NAME\`, \`kcu\`.\`REFERENCED_TABLE_SCHEMA\`, ` +
                `\`kcu\`.\`REFERENCED_TABLE_NAME\`, \`kcu\`.\`REFERENCED_COLUMN_NAME\`, \`rc\`.\`DELETE_RULE\` \`ON_DELETE\`, \`rc\`.\`UPDATE_RULE\` \`ON_UPDATE\` ` +
                `FROM \`INFORMATION_SCHEMA\`.\`KEY_COLUMN_USAGE\` \`kcu\` ` +
                `INNER JOIN \`INFORMATION_SCHEMA\`.\`REFERENTIAL_CONSTRAINTS\` \`rc\` ON \`rc\`.\`constraint_name\` = \`kcu\`.\`constraint_name\` ` +
                `WHERE ` + foreignKeysCondition;
            const [dbTables, dbColumns, dbPrimaryKeys, dbCollations, dbIndices, dbForeignKeys] = yield Promise.all([
                this.query(tablesSql),
                this.query(columnsSql),
                this.query(primaryKeySql),
                this.query(collationsSql),
                this.query(indicesSql),
                this.query(foreignKeysSql)
            ]);
            // if tables were not found in the db, no need to proceed
            if (!dbTables.length)
                return [];
            // create tables for loaded tables
            return Promise.all(dbTables.map((dbTable) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const table = new Table_1.Table();
                const dbCollation = dbCollations.find(coll => coll["SCHEMA_NAME"] === dbTable["TABLE_SCHEMA"]);
                const defaultCollation = dbCollation["COLLATION"];
                const defaultCharset = dbCollation["CHARSET"];
                // We do not need to join database name, when database is by default.
                // In this case we need local variable `tableFullName` for below comparision.
                const db = dbTable["TABLE_SCHEMA"] === currentDatabase ? undefined : dbTable["TABLE_SCHEMA"];
                table.name = this.driver.buildTableName(dbTable["TABLE_NAME"], undefined, db);
                const tableFullName = this.driver.buildTableName(dbTable["TABLE_NAME"], undefined, dbTable["TABLE_SCHEMA"]);
                // create columns from the loaded columns
                table.columns = dbColumns
                    .filter(dbColumn => this.driver.buildTableName(dbColumn["TABLE_NAME"], undefined, dbColumn["TABLE_SCHEMA"]) === tableFullName)
                    .map(dbColumn => {
                    const columnUniqueIndex = dbIndices.find(dbIndex => {
                        const indexTableFullName = this.driver.buildTableName(dbIndex["TABLE_NAME"], undefined, dbIndex["TABLE_SCHEMA"]);
                        if (indexTableFullName !== tableFullName) {
                            return false;
                        }
                        // Index is not for this column
                        if (dbIndex["COLUMN_NAME"] !== dbColumn["COLUMN_NAME"]) {
                            return false;
                        }
                        const nonUnique = parseInt(dbIndex["NON_UNIQUE"], 10);
                        return nonUnique === 0;
                    });
                    const tableMetadata = this.connection.entityMetadatas.find(metadata => metadata.tablePath === table.name);
                    const hasIgnoredIndex = columnUniqueIndex && tableMetadata && tableMetadata.indices
                        .some(index => index.name === columnUniqueIndex["INDEX_NAME"] && index.synchronize === false);
                    const isConstraintComposite = columnUniqueIndex
                        ? !!dbIndices.find(dbIndex => dbIndex["INDEX_NAME"] === columnUniqueIndex["INDEX_NAME"] && dbIndex["COLUMN_NAME"] !== dbColumn["COLUMN_NAME"])
                        : false;
                    const tableColumn = new TableColumn_1.TableColumn();
                    tableColumn.name = dbColumn["COLUMN_NAME"];
                    tableColumn.type = dbColumn["DATA_TYPE"].toLowerCase();
                    if (this.driver.withWidthColumnTypes.indexOf(tableColumn.type) !== -1) {
                        const width = dbColumn["COLUMN_TYPE"].substring(dbColumn["COLUMN_TYPE"].indexOf("(") + 1, dbColumn["COLUMN_TYPE"].indexOf(")"));
                        tableColumn.width = width && !this.isDefaultColumnWidth(table, tableColumn, parseInt(width)) ? parseInt(width) : undefined;
                    }
                    if (dbColumn["COLUMN_DEFAULT"] === null
                        || dbColumn["COLUMN_DEFAULT"] === undefined) {
                        tableColumn.default = undefined;
                    }
                    else {
                        tableColumn.default = dbColumn["COLUMN_DEFAULT"] === "CURRENT_TIMESTAMP" ? dbColumn["COLUMN_DEFAULT"] : `'${dbColumn["COLUMN_DEFAULT"]}'`;
                    }
                    if (dbColumn["EXTRA"].indexOf("on update") !== -1) {
                        tableColumn.onUpdate = dbColumn["EXTRA"].substring(dbColumn["EXTRA"].indexOf("on update") + 10);
                    }
                    if (dbColumn["GENERATION_EXPRESSION"]) {
                        tableColumn.asExpression = dbColumn["GENERATION_EXPRESSION"];
                        tableColumn.generatedType = dbColumn["EXTRA"].indexOf("VIRTUAL") !== -1 ? "VIRTUAL" : "STORED";
                    }
                    tableColumn.isUnique = !!columnUniqueIndex && !hasIgnoredIndex && !isConstraintComposite;
                    tableColumn.isNullable = dbColumn["IS_NULLABLE"] === "YES";
                    tableColumn.isPrimary = dbPrimaryKeys.some(dbPrimaryKey => {
                        return this.driver.buildTableName(dbPrimaryKey["TABLE_NAME"], undefined, dbPrimaryKey["TABLE_SCHEMA"]) === tableFullName && dbPrimaryKey["COLUMN_NAME"] === tableColumn.name;
                    });
                    tableColumn.zerofill = dbColumn["COLUMN_TYPE"].indexOf("zerofill") !== -1;
                    tableColumn.unsigned = tableColumn.zerofill ? true : dbColumn["COLUMN_TYPE"].indexOf("unsigned") !== -1;
                    tableColumn.isGenerated = dbColumn["EXTRA"].indexOf("auto_increment") !== -1;
                    if (tableColumn.isGenerated)
                        tableColumn.generationStrategy = "increment";
                    tableColumn.comment = dbColumn["COLUMN_COMMENT"];
                    if (dbColumn["CHARACTER_SET_NAME"])
                        tableColumn.charset = dbColumn["CHARACTER_SET_NAME"] === defaultCharset ? undefined : dbColumn["CHARACTER_SET_NAME"];
                    if (dbColumn["COLLATION_NAME"])
                        tableColumn.collation = dbColumn["COLLATION_NAME"] === defaultCollation ? undefined : dbColumn["COLLATION_NAME"];
                    // check only columns that have length property
                    if (this.driver.withLengthColumnTypes.indexOf(tableColumn.type) !== -1 && dbColumn["CHARACTER_MAXIMUM_LENGTH"]) {
                        const length = dbColumn["CHARACTER_MAXIMUM_LENGTH"].toString();
                        tableColumn.length = !this.isDefaultColumnLength(table, tableColumn, length) ? length : "";
                    }
                    if (tableColumn.type === "decimal" || tableColumn.type === "double" || tableColumn.type === "float") {
                        if (dbColumn["NUMERIC_PRECISION"] !== null && !this.isDefaultColumnPrecision(table, tableColumn, dbColumn["NUMERIC_PRECISION"]))
                            tableColumn.precision = parseInt(dbColumn["NUMERIC_PRECISION"]);
                        if (dbColumn["NUMERIC_SCALE"] !== null && !this.isDefaultColumnScale(table, tableColumn, dbColumn["NUMERIC_SCALE"]))
                            tableColumn.scale = parseInt(dbColumn["NUMERIC_SCALE"]);
                    }
                    if (tableColumn.type === "enum" || tableColumn.type === "simple-enum") {
                        const colType = dbColumn["COLUMN_TYPE"];
                        const items = colType.substring(colType.indexOf("(") + 1, colType.lastIndexOf(")")).split(",");
                        tableColumn.enum = items.map(item => {
                            return item.substring(1, item.length - 1);
                        });
                        tableColumn.length = "";
                    }
                    if ((tableColumn.type === "datetime" || tableColumn.type === "time" || tableColumn.type === "timestamp")
                        && dbColumn["DATETIME_PRECISION"] !== null && dbColumn["DATETIME_PRECISION"] !== undefined
                        && !this.isDefaultColumnPrecision(table, tableColumn, parseInt(dbColumn["DATETIME_PRECISION"]))) {
                        tableColumn.precision = parseInt(dbColumn["DATETIME_PRECISION"]);
                    }
                    return tableColumn;
                });
                // find foreign key constraints of table, group them by constraint name and build TableForeignKey.
                const tableForeignKeyConstraints = OrmUtils_1.OrmUtils.uniq(dbForeignKeys.filter(dbForeignKey => {
                    return this.driver.buildTableName(dbForeignKey["TABLE_NAME"], undefined, dbForeignKey["TABLE_SCHEMA"]) === tableFullName;
                }), dbForeignKey => dbForeignKey["CONSTRAINT_NAME"]);
                table.foreignKeys = tableForeignKeyConstraints.map(dbForeignKey => {
                    const foreignKeys = dbForeignKeys.filter(dbFk => dbFk["CONSTRAINT_NAME"] === dbForeignKey["CONSTRAINT_NAME"]);
                    // if referenced table located in currently used db, we don't need to concat db name to table name.
                    const database = dbForeignKey["REFERENCED_TABLE_SCHEMA"] === currentDatabase ? undefined : dbForeignKey["REFERENCED_TABLE_SCHEMA"];
                    const referencedTableName = this.driver.buildTableName(dbForeignKey["REFERENCED_TABLE_NAME"], undefined, database);
                    return new TableForeignKey_1.TableForeignKey({
                        name: dbForeignKey["CONSTRAINT_NAME"],
                        columnNames: foreignKeys.map(dbFk => dbFk["COLUMN_NAME"]),
                        referencedTableName: referencedTableName,
                        referencedColumnNames: foreignKeys.map(dbFk => dbFk["REFERENCED_COLUMN_NAME"]),
                        onDelete: dbForeignKey["ON_DELETE"],
                        onUpdate: dbForeignKey["ON_UPDATE"]
                    });
                });
                // find index constraints of table, group them by constraint name and build TableIndex.
                const tableIndexConstraints = OrmUtils_1.OrmUtils.uniq(dbIndices.filter(dbIndex => {
                    return this.driver.buildTableName(dbIndex["TABLE_NAME"], undefined, dbIndex["TABLE_SCHEMA"]) === tableFullName;
                }), dbIndex => dbIndex["INDEX_NAME"]);
                table.indices = tableIndexConstraints.map(constraint => {
                    const indices = dbIndices.filter(index => {
                        return index["TABLE_SCHEMA"] === constraint["TABLE_SCHEMA"]
                            && index["TABLE_NAME"] === constraint["TABLE_NAME"]
                            && index["INDEX_NAME"] === constraint["INDEX_NAME"];
                    });
                    const nonUnique = parseInt(constraint["NON_UNIQUE"], 10);
                    return new TableIndex_1.TableIndex({
                        table: table,
                        name: constraint["INDEX_NAME"],
                        columnNames: indices.map(i => i["COLUMN_NAME"]),
                        isUnique: nonUnique === 0,
                        isSpatial: constraint["INDEX_TYPE"] === "SPATIAL",
                        isFulltext: constraint["INDEX_TYPE"] === "FULLTEXT"
                    });
                });
                return table;
            })));
        });
    }
    /**
     * Builds create table sql
     */
    createTableSql(table, createForeignKeys) {
        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(column, true)).join(", ");
        let sql = `CREATE TABLE ${this.escapePath(table)} (${columnDefinitions}`;
        // we create unique indexes instead of unique constraints, because MySql does not have unique constraints.
        // if we mark column as Unique, it means that we create UNIQUE INDEX.
        table.columns
            .filter(column => column.isUnique)
            .forEach(column => {
            const isUniqueIndexExist = table.indices.some(index => {
                return index.columnNames.length === 1 && !!index.isUnique && index.columnNames.indexOf(column.name) !== -1;
            });
            const isUniqueConstraintExist = table.uniques.some(unique => {
                return unique.columnNames.length === 1 && unique.columnNames.indexOf(column.name) !== -1;
            });
            if (!isUniqueIndexExist && !isUniqueConstraintExist)
                table.indices.push(new TableIndex_1.TableIndex({
                    name: this.connection.namingStrategy.uniqueConstraintName(table.name, [column.name]),
                    columnNames: [column.name],
                    isUnique: true
                }));
        });
        // as MySql does not have unique constraints, we must create table indices from table uniques and mark them as unique.
        if (table.uniques.length > 0) {
            table.uniques.forEach(unique => {
                const uniqueExist = table.indices.some(index => index.name === unique.name);
                if (!uniqueExist) {
                    table.indices.push(new TableIndex_1.TableIndex({
                        name: unique.name,
                        columnNames: unique.columnNames,
                        isUnique: true
                    }));
                }
            });
        }
        if (table.indices.length > 0) {
            const indicesSql = table.indices.map(index => {
                const columnNames = index.columnNames.map(columnName => `\`${columnName}\``).join(", ");
                if (!index.name)
                    index.name = this.connection.namingStrategy.indexName(table.name, index.columnNames, index.where);
                let indexType = "";
                if (index.isUnique)
                    indexType += "UNIQUE ";
                if (index.isSpatial)
                    indexType += "SPATIAL ";
                if (index.isFulltext)
                    indexType += "FULLTEXT ";
                return `${indexType}INDEX \`${index.name}\` (${columnNames})`;
            }).join(", ");
            sql += `, ${indicesSql}`;
        }
        if (table.foreignKeys.length > 0 && createForeignKeys) {
            const foreignKeysSql = table.foreignKeys.map(fk => {
                const columnNames = fk.columnNames.map(columnName => `\`${columnName}\``).join(", ");
                if (!fk.name)
                    fk.name = this.connection.namingStrategy.foreignKeyName(table.name, fk.columnNames);
                const referencedColumnNames = fk.referencedColumnNames.map(columnName => `\`${columnName}\``).join(", ");
                let constraint = `CONSTRAINT \`${fk.name}\` FOREIGN KEY (${columnNames}) REFERENCES ${this.escapePath(fk.referencedTableName)} (${referencedColumnNames})`;
                if (fk.onDelete)
                    constraint += ` ON DELETE ${fk.onDelete}`;
                if (fk.onUpdate)
                    constraint += ` ON UPDATE ${fk.onUpdate}`;
                return constraint;
            }).join(", ");
            sql += `, ${foreignKeysSql}`;
        }
        if (table.primaryColumns.length > 0) {
            const columnNames = table.primaryColumns.map(column => `\`${column.name}\``).join(", ");
            sql += `, PRIMARY KEY (${columnNames})`;
        }
        sql += `) ENGINE=${table.engine || "InnoDB"}`;
        return new Query_1.Query(sql);
    }
    /**
     * Builds drop table sql
     */
    dropTableSql(tableOrName) {
        return new Query_1.Query(`DROP TABLE ${this.escapePath(tableOrName)}`);
    }
    createViewSql(view) {
        if (typeof view.expression === "string") {
            return new Query_1.Query(`CREATE VIEW ${this.escapePath(view)} AS ${view.expression}`);
        }
        else {
            return new Query_1.Query(`CREATE VIEW ${this.escapePath(view)} AS ${view.expression(this.connection).getQuery()}`);
        }
    }
    insertViewDefinitionSql(view) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const currentDatabase = yield this.getCurrentDatabase();
            const expression = typeof view.expression === "string" ? view.expression.trim() : view.expression(this.connection).getQuery();
            const [query, parameters] = this.connection.createQueryBuilder()
                .insert()
                .into(this.getTypeormMetadataTableName())
                .values({ type: "VIEW", schema: currentDatabase, name: view.name, value: expression })
                .getQueryAndParameters();
            return new Query_1.Query(query, parameters);
        });
    }
    /**
     * Builds drop view sql.
     */
    dropViewSql(viewOrPath) {
        return new Query_1.Query(`DROP VIEW ${this.escapePath(viewOrPath)}`);
    }
    /**
     * Builds remove view sql.
     */
    deleteViewDefinitionSql(viewOrPath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const currentDatabase = yield this.getCurrentDatabase();
            const viewName = viewOrPath instanceof View_1.View ? viewOrPath.name : viewOrPath;
            const qb = this.connection.createQueryBuilder();
            const [query, parameters] = qb.delete()
                .from(this.getTypeormMetadataTableName())
                .where(`${qb.escape("type")} = 'VIEW'`)
                .andWhere(`${qb.escape("schema")} = :schema`, { schema: currentDatabase })
                .andWhere(`${qb.escape("name")} = :name`, { name: viewName })
                .getQueryAndParameters();
            return new Query_1.Query(query, parameters);
        });
    }
    /**
     * Builds create index sql.
     */
    createIndexSql(table, index) {
        const columns = index.columnNames.map(columnName => `\`${columnName}\``).join(", ");
        let indexType = "";
        if (index.isUnique)
            indexType += "UNIQUE ";
        if (index.isSpatial)
            indexType += "SPATIAL ";
        if (index.isFulltext)
            indexType += "FULLTEXT ";
        return new Query_1.Query(`CREATE ${indexType}INDEX \`${index.name}\` ON ${this.escapePath(table)} (${columns})`);
    }
    /**
     * Builds drop index sql.
     */
    dropIndexSql(table, indexOrName) {
        let indexName = indexOrName instanceof TableIndex_1.TableIndex ? indexOrName.name : indexOrName;
        return new Query_1.Query(`DROP INDEX \`${indexName}\` ON ${this.escapePath(table)}`);
    }
    /**
     * Builds create primary key sql.
     */
    createPrimaryKeySql(table, columnNames) {
        const columnNamesString = columnNames.map(columnName => `\`${columnName}\``).join(", ");
        return new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD PRIMARY KEY (${columnNamesString})`);
    }
    /**
     * Builds drop primary key sql.
     */
    dropPrimaryKeySql(table) {
        return new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP PRIMARY KEY`);
    }
    /**
     * Builds create foreign key sql.
     */
    createForeignKeySql(table, foreignKey) {
        const columnNames = foreignKey.columnNames.map(column => `\`${column}\``).join(", ");
        const referencedColumnNames = foreignKey.referencedColumnNames.map(column => `\`${column}\``).join(",");
        let sql = `ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT \`${foreignKey.name}\` FOREIGN KEY (${columnNames}) ` +
            `REFERENCES ${this.escapePath(foreignKey.referencedTableName)}(${referencedColumnNames})`;
        if (foreignKey.onDelete)
            sql += ` ON DELETE ${foreignKey.onDelete}`;
        if (foreignKey.onUpdate)
            sql += ` ON UPDATE ${foreignKey.onUpdate}`;
        return new Query_1.Query(sql);
    }
    /**
     * Builds drop foreign key sql.
     */
    dropForeignKeySql(table, foreignKeyOrName) {
        const foreignKeyName = foreignKeyOrName instanceof TableForeignKey_1.TableForeignKey ? foreignKeyOrName.name : foreignKeyOrName;
        return new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP FOREIGN KEY \`${foreignKeyName}\``);
    }
    parseTableName(target) {
        const tableName = target instanceof Table_1.Table ? target.name : target;
        return {
            database: tableName.indexOf(".") !== -1 ? tableName.split(".")[0] : this.driver.database,
            tableName: tableName.indexOf(".") !== -1 ? tableName.split(".")[1] : tableName
        };
    }
    /**
     * Escapes a given comment so it's safe to include in a query.
     */
    escapeComment(comment) {
        if (!comment || comment.length === 0) {
            return `''`;
        }
        comment = comment
            .replace("\\", "\\\\") // MySQL allows escaping characters via backslashes
            .replace(/'/g, "''")
            .replace("\0", ""); // Null bytes aren't allowed in comments
        return `'${comment}'`;
    }
    /**
     * Escapes given table or view path.
     */
    escapePath(target, disableEscape) {
        const tableName = target instanceof Table_1.Table || target instanceof View_1.View ? target.name : target;
        return tableName.split(".").map(i => disableEscape ? i : `\`${i}\``).join(".");
    }
    /**
     * Builds a part of query to create/change a column.
     */
    buildCreateColumnSql(column, skipPrimary, skipName = false) {
        let c = "";
        if (skipName) {
            c = this.connection.driver.createFullType(column);
        }
        else {
            c = `\`${column.name}\` ${this.connection.driver.createFullType(column)}`;
        }
        if (column.asExpression)
            c += ` AS (${column.asExpression}) ${column.generatedType ? column.generatedType : "VIRTUAL"}`;
        // if you specify ZEROFILL for a numeric column, MySQL automatically adds the UNSIGNED attribute to that column.
        if (column.zerofill) {
            c += " ZEROFILL";
        }
        else if (column.unsigned) {
            c += " UNSIGNED";
        }
        if (column.enum)
            c += ` (${column.enum.map(value => "'" + value + "'").join(", ")})`;
        if (column.charset)
            c += ` CHARACTER SET "${column.charset}"`;
        if (column.collation)
            c += ` COLLATE "${column.collation}"`;
        if (!column.isNullable)
            c += " NOT NULL";
        if (column.isNullable)
            c += " NULL";
        if (column.isPrimary && !skipPrimary)
            c += " PRIMARY KEY";
        if (column.isGenerated && column.generationStrategy === "increment") // don't use skipPrimary here since updates can update already exist primary without auto inc.
            c += " AUTO_INCREMENT";
        if (column.comment)
            c += ` COMMENT ${this.escapeComment(column.comment)}`;
        if (column.default !== undefined && column.default !== null)
            c += ` DEFAULT ${column.default}`;
        if (column.onUpdate)
            c += ` ON UPDATE ${column.onUpdate}`;
        return c;
    }
    /**
     * Checks if column display width is by default.
     */
    isDefaultColumnWidth(table, column, width) {
        // if table have metadata, we check if length is specified in column metadata
        if (this.connection.hasMetadata(table.name)) {
            const metadata = this.connection.getMetadata(table.name);
            const columnMetadata = metadata.findColumnWithDatabaseName(column.name);
            if (columnMetadata && columnMetadata.width)
                return false;
        }
        const defaultWidthForType = this.connection.driver.dataTypeDefaults
            && this.connection.driver.dataTypeDefaults[column.type]
            && this.connection.driver.dataTypeDefaults[column.type].width;
        if (defaultWidthForType) {
            return defaultWidthForType === width;
        }
        return false;
    }
}
exports.AuroraDataApiQueryRunner = AuroraDataApiQueryRunner;
//# sourceMappingURL=AuroraDataApiQueryRunner.js.map