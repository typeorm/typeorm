"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SapQueryRunner = void 0;
const tslib_1 = require("tslib");
const QueryRunnerAlreadyReleasedError_1 = require("../../error/QueryRunnerAlreadyReleasedError");
const TransactionAlreadyStartedError_1 = require("../../error/TransactionAlreadyStartedError");
const TransactionNotStartedError_1 = require("../../error/TransactionNotStartedError");
const index_1 = require("../../index");
const BaseQueryRunner_1 = require("../../query-runner/BaseQueryRunner");
const Table_1 = require("../../schema-builder/table/Table");
const TableCheck_1 = require("../../schema-builder/table/TableCheck");
const TableColumn_1 = require("../../schema-builder/table/TableColumn");
const TableForeignKey_1 = require("../../schema-builder/table/TableForeignKey");
const TableIndex_1 = require("../../schema-builder/table/TableIndex");
const TableUnique_1 = require("../../schema-builder/table/TableUnique");
const View_1 = require("../../schema-builder/view/View");
const Broadcaster_1 = require("../../subscriber/Broadcaster");
const OrmUtils_1 = require("../../util/OrmUtils");
const Query_1 = require("../Query");
const BroadcasterResult_1 = require("../../subscriber/BroadcasterResult");
/**
 * Runs queries on a single SQL Server database connection.
 */
class SapQueryRunner extends BaseQueryRunner_1.BaseQueryRunner {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(driver, mode) {
        super();
        // -------------------------------------------------------------------------
        // Protected Properties
        // -------------------------------------------------------------------------
        /**
         * Last executed query in a transaction.
         * This is needed because we cannot rely on parallel queries because we use second query
         * to select CURRENT_IDENTITY_VALUE()
         */
        this.queryResponsibilityChain = [];
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster_1.Broadcaster(this);
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.databaseConnection)
                return this.databaseConnection;
            this.databaseConnection = yield this.driver.obtainMasterConnection();
            return this.databaseConnection;
        });
    }
    /**
     * Releases used database connection.
     * You cannot use query runner methods once its released.
     */
    release() {
        this.isReleased = true;
        if (this.databaseConnection) {
            return this.driver.master.release(this.databaseConnection);
        }
        return Promise.resolve();
    }
    /**
     * Starts transaction.
     */
    startTransaction(isolationLevel) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.isReleased)
                throw new QueryRunnerAlreadyReleasedError_1.QueryRunnerAlreadyReleasedError();
            if (this.isTransactionActive)
                throw new TransactionAlreadyStartedError_1.TransactionAlreadyStartedError();
            const beforeBroadcastResult = new BroadcasterResult_1.BroadcasterResult();
            this.broadcaster.broadcastBeforeTransactionStartEvent(beforeBroadcastResult);
            if (beforeBroadcastResult.promises.length > 0)
                yield Promise.all(beforeBroadcastResult.promises);
            this.isTransactionActive = true;
            if (isolationLevel) {
                yield this.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel || ""}`);
            }
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
            if (this.isReleased)
                throw new QueryRunnerAlreadyReleasedError_1.QueryRunnerAlreadyReleasedError();
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
            if (this.isReleased)
                throw new QueryRunnerAlreadyReleasedError_1.QueryRunnerAlreadyReleasedError();
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
     * Executes a given SQL query.
     */
    query(query, parameters) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.isReleased)
                throw new QueryRunnerAlreadyReleasedError_1.QueryRunnerAlreadyReleasedError();
            let waitingOkay;
            const waitingPromise = new Promise((ok) => waitingOkay = ok);
            if (this.queryResponsibilityChain.length) {
                const otherWaitingPromises = [...this.queryResponsibilityChain];
                this.queryResponsibilityChain.push(waitingPromise);
                yield Promise.all(otherWaitingPromises);
            }
            const promise = new Promise((ok, fail) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                try {
                    const databaseConnection = yield this.connect();
                    // we disable autocommit because ROLLBACK does not work in autocommit mode
                    databaseConnection.setAutoCommit(!this.isTransactionActive);
                    this.driver.connection.logger.logQuery(query, parameters, this);
                    const queryStartTime = +new Date();
                    const isInsertQuery = query.substr(0, 11) === "INSERT INTO";
                    const statement = databaseConnection.prepare(query);
                    statement.exec(parameters, (err, result) => {
                        // log slow queries if maxQueryExecution time is set
                        const maxQueryExecutionTime = this.driver.connection.options.maxQueryExecutionTime;
                        const queryEndTime = +new Date();
                        const queryExecutionTime = queryEndTime - queryStartTime;
                        if (maxQueryExecutionTime && queryExecutionTime > maxQueryExecutionTime)
                            this.driver.connection.logger.logQuerySlow(queryExecutionTime, query, parameters, this);
                        const resolveChain = () => {
                            if (promiseIndex !== -1)
                                this.queryResponsibilityChain.splice(promiseIndex, 1);
                            if (waitingPromiseIndex !== -1)
                                this.queryResponsibilityChain.splice(waitingPromiseIndex, 1);
                            waitingOkay();
                        };
                        let promiseIndex = this.queryResponsibilityChain.indexOf(promise);
                        let waitingPromiseIndex = this.queryResponsibilityChain.indexOf(waitingPromise);
                        if (err) {
                            this.driver.connection.logger.logQueryError(err, query, parameters, this);
                            resolveChain();
                            return fail(new index_1.QueryFailedError(query, parameters, err));
                        }
                        else {
                            if (isInsertQuery) {
                                const lastIdQuery = `SELECT CURRENT_IDENTITY_VALUE() FROM "SYS"."DUMMY"`;
                                this.driver.connection.logger.logQuery(lastIdQuery, [], this);
                                databaseConnection.exec(lastIdQuery, (err, result) => {
                                    if (err) {
                                        this.driver.connection.logger.logQueryError(err, lastIdQuery, [], this);
                                        resolveChain();
                                        fail(new index_1.QueryFailedError(lastIdQuery, [], err));
                                        return;
                                    }
                                    ok(result[0]["CURRENT_IDENTITY_VALUE()"]);
                                    resolveChain();
                                });
                            }
                            else {
                                ok(result);
                                resolveChain();
                            }
                        }
                    });
                }
                catch (err) {
                    fail(err);
                }
            }));
            // with this condition, Promise.all causes unexpected behavior.
            // if (this.isTransactionActive)
            this.queryResponsibilityChain.push(promise);
            return promise;
        });
    }
    /**
     * Returns raw data stream.
     */
    stream(query, parameters, onEnd, onError) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`Stream is not supported by SAP driver.`);
        });
    }
    /**
     * Returns all available database names including system databases.
     */
    getDatabases() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const results = yield this.query(`SELECT DATABASE_NAME FROM "SYS"."M_DATABASES"`);
            return results.map(result => result["DATABASE_NAME"]);
        });
    }
    /**
     * Returns all available schema names including system schemas.
     * If database parameter specified, returns schemas of that database.
     */
    getSchemas(database) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const query = database ? `SELECT * FROM "${database}"."SYS"."SCHEMAS"` : `SELECT * FROM "SYS"."SCHEMAS"`;
            const results = yield this.query(query);
            return results.map(result => result["SCHEMA_NAME"]);
        });
    }
    /**
     * Checks if database with the given name exist.
     */
    hasDatabase(database) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const databases = yield this.getDatabases();
            return databases.indexOf(database) !== -1;
        });
    }
    /**
     * Checks if schema with the given name exist.
     */
    hasSchema(schema) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const schemas = yield this.getSchemas();
            return schemas.indexOf(schema) !== -1;
        });
    }
    /**
     * Checks if table with the given name exist in the database.
     */
    hasTable(tableOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const parsedTableName = this.parseTableName(tableOrName);
            const sql = `SELECT * FROM "SYS"."TABLES" WHERE "SCHEMA_NAME" = ${parsedTableName.schema} AND "TABLE_NAME" = ${parsedTableName.tableName}`;
            const result = yield this.query(sql);
            return result.length ? true : false;
        });
    }
    /**
     * Checks if column with the given name exist in the given table.
     */
    hasColumn(tableOrName, columnName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const parsedTableName = this.parseTableName(tableOrName);
            const sql = `SELECT * FROM "SYS"."TABLE_COLUMNS" WHERE "SCHEMA_NAME" = ${parsedTableName.schema} AND "TABLE_NAME" = ${parsedTableName.tableName} AND "COLUMN_NAME" = '${columnName}'`;
            const result = yield this.query(sql);
            return result.length ? true : false;
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
            let exist = false;
            if (ifNotExist) {
                const result = yield this.query(`SELECT * FROM "SYS"."SCHEMAS" WHERE "SCHEMA_NAME" = '${schema}'`);
                exist = !!result.length;
            }
            if (!ifNotExist || (ifNotExist && !exist)) {
                const up = `CREATE SCHEMA "${schema}"`;
                const down = `DROP SCHEMA "${schema}" CASCADE`;
                yield this.executeQueries(new Query_1.Query(up), new Query_1.Query(down));
            }
        });
    }
    /**
     * Drops table schema
     */
    dropSchema(schemaPath, ifExist, isCascade) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const schema = schemaPath.indexOf(".") === -1 ? schemaPath : schemaPath.split(".")[0];
            let exist = false;
            if (ifExist) {
                const result = yield this.query(`SELECT * FROM "SYS"."SCHEMAS" WHERE "SCHEMA_NAME" = '${schema}'`);
                exist = !!result.length;
            }
            if (!ifExist || (ifExist && exist)) {
                const up = `DROP SCHEMA "${schema}" ${isCascade ? "CASCADE" : ""}`;
                const down = `CREATE SCHEMA "${schema}"`;
                yield this.executeQueries(new Query_1.Query(up), new Query_1.Query(down));
            }
        });
    }
    /**
     * Creates a new table.
     */
    createTable(table, ifNotExist = false, createForeignKeys = true, createIndices = true) {
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
                    downQueries.push(this.dropIndexSql(table, index));
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
            // It needs because if table does not exist and dropForeignKeys or dropIndices is true, we don't need
            // to perform drop queries for foreign keys and indices.
            if (dropIndices) {
                table.indices.forEach(index => {
                    upQueries.push(this.dropIndexSql(table, index));
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
            const oldTableName = oldTable.name.indexOf(".") === -1 ? oldTable.name : oldTable.name.split(".")[1];
            const schemaName = oldTable.name.indexOf(".") === -1 ? undefined : oldTable.name.split(".")[0];
            newTable.name = schemaName ? `${schemaName}.${newTableName}` : newTableName;
            // rename table
            upQueries.push(new Query_1.Query(`RENAME TABLE ${this.escapePath(oldTable.name)} TO ${this.escapePath(newTableName)}`));
            downQueries.push(new Query_1.Query(`RENAME TABLE ${this.escapePath(newTable.name)} TO ${this.escapePath(oldTableName)}`));
            // drop old FK's. Foreign keys must be dropped before the primary keys are dropped
            newTable.foreignKeys.forEach(foreignKey => {
                upQueries.push(this.dropForeignKeySql(newTable, foreignKey));
                downQueries.push(this.createForeignKeySql(newTable, foreignKey));
            });
            // SAP HANA does not allow to drop PK's which is referenced by foreign keys.
            // To avoid this, we must drop all referential foreign keys and recreate them later
            const referencedForeignKeySql = `SELECT * FROM "SYS"."REFERENTIAL_CONSTRAINTS" WHERE "REFERENCED_SCHEMA_NAME" = '${schemaName}' AND "REFERENCED_TABLE_NAME" = '${oldTableName}'`;
            const dbForeignKeys = yield this.query(referencedForeignKeySql);
            let referencedForeignKeys = [];
            const referencedForeignKeyTableMapping = [];
            if (dbForeignKeys.length > 0) {
                referencedForeignKeys = dbForeignKeys.map(dbForeignKey => {
                    const foreignKeys = dbForeignKeys.filter(dbFk => dbFk["CONSTRAINT_NAME"] === dbForeignKey["CONSTRAINT_NAME"]);
                    referencedForeignKeyTableMapping.push({ tableName: `${dbForeignKey["SCHEMA_NAME"]}.${dbForeignKey["TABLE_NAME"]}`, fkName: dbForeignKey["CONSTRAINT_NAME"] });
                    return new TableForeignKey_1.TableForeignKey({
                        name: dbForeignKey["CONSTRAINT_NAME"],
                        columnNames: foreignKeys.map(dbFk => dbFk["COLUMN_NAME"]),
                        referencedTableName: newTable.name,
                        referencedColumnNames: foreignKeys.map(dbFk => dbFk["REFERENCED_COLUMN_NAME"]),
                        onDelete: dbForeignKey["DELETE_RULE"] === "RESTRICT" ? "NO ACTION" : dbForeignKey["DELETE_RULE"],
                        onUpdate: dbForeignKey["UPDATE_RULE"] === "RESTRICT" ? "NO ACTION" : dbForeignKey["UPDATE_RULE"],
                    });
                });
                // drop referenced foreign keys
                referencedForeignKeys.forEach(foreignKey => {
                    const mapping = referencedForeignKeyTableMapping.find(it => it.fkName === foreignKey.name);
                    upQueries.push(this.dropForeignKeySql(mapping.tableName, foreignKey));
                    downQueries.push(this.createForeignKeySql(mapping.tableName, foreignKey));
                });
            }
            // rename primary key constraint
            if (newTable.primaryColumns.length > 0) {
                const columnNames = newTable.primaryColumns.map(column => column.name);
                const columnNamesString = columnNames.map(columnName => `"${columnName}"`).join(", ");
                const oldPkName = this.connection.namingStrategy.primaryKeyName(oldTable, columnNames);
                const newPkName = this.connection.namingStrategy.primaryKeyName(newTable, columnNames);
                // drop old PK
                upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(newTable)} DROP CONSTRAINT "${oldPkName}"`));
                downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(newTable)} ADD CONSTRAINT "${oldPkName}" PRIMARY KEY (${columnNamesString})`));
                // create new PK
                upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(newTable)} ADD CONSTRAINT "${newPkName}" PRIMARY KEY (${columnNamesString})`));
                downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(newTable)} DROP CONSTRAINT "${newPkName}"`));
            }
            // recreate foreign keys with new constraint names
            newTable.foreignKeys.forEach(foreignKey => {
                // replace constraint name
                foreignKey.name = this.connection.namingStrategy.foreignKeyName(newTable, foreignKey.columnNames, foreignKey.referencedTableName, foreignKey.referencedColumnNames);
                // create new FK's
                upQueries.push(this.createForeignKeySql(newTable, foreignKey));
                downQueries.push(this.dropForeignKeySql(newTable, foreignKey));
            });
            // restore referenced foreign keys
            referencedForeignKeys.forEach(foreignKey => {
                const mapping = referencedForeignKeyTableMapping.find(it => it.fkName === foreignKey.name);
                upQueries.push(this.createForeignKeySql(mapping.tableName, foreignKey));
                downQueries.push(this.dropForeignKeySql(mapping.tableName, foreignKey));
            });
            // rename index constraints
            newTable.indices.forEach(index => {
                // build new constraint name
                const newIndexName = this.connection.namingStrategy.indexName(newTable, index.columnNames, index.where);
                // drop old index
                upQueries.push(this.dropIndexSql(newTable, index));
                downQueries.push(this.createIndexSql(newTable, index));
                // replace constraint name
                index.name = newIndexName;
                // create new index
                upQueries.push(this.createIndexSql(newTable, index));
                downQueries.push(this.dropIndexSql(newTable, index));
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
            const parsedTableName = this.parseTableName(table);
            const clonedTable = table.clone();
            const upQueries = [];
            const downQueries = [];
            upQueries.push(new Query_1.Query(this.addColumnSql(table, column)));
            downQueries.push(new Query_1.Query(this.dropColumnSql(table, column)));
            // create or update primary key constraint
            if (column.isPrimary) {
                const primaryColumns = clonedTable.primaryColumns;
                // if table already have primary key, me must drop it and recreate again
                if (primaryColumns.length > 0) {
                    // SAP HANA does not allow to drop PK's which is referenced by foreign keys.
                    // To avoid this, we must drop all referential foreign keys and recreate them later
                    const referencedForeignKeySql = `SELECT * FROM "SYS"."REFERENTIAL_CONSTRAINTS" WHERE "REFERENCED_SCHEMA_NAME" = ${parsedTableName.schema} AND "REFERENCED_TABLE_NAME" = ${parsedTableName.tableName}`;
                    const dbForeignKeys = yield this.query(referencedForeignKeySql);
                    let referencedForeignKeys = [];
                    const referencedForeignKeyTableMapping = [];
                    if (dbForeignKeys.length > 0) {
                        referencedForeignKeys = dbForeignKeys.map(dbForeignKey => {
                            const foreignKeys = dbForeignKeys.filter(dbFk => dbFk["CONSTRAINT_NAME"] === dbForeignKey["CONSTRAINT_NAME"]);
                            referencedForeignKeyTableMapping.push({ tableName: `${dbForeignKey["SCHEMA_NAME"]}.${dbForeignKey["TABLE_NAME"]}`, fkName: dbForeignKey["CONSTRAINT_NAME"] });
                            return new TableForeignKey_1.TableForeignKey({
                                name: dbForeignKey["CONSTRAINT_NAME"],
                                columnNames: foreignKeys.map(dbFk => dbFk["COLUMN_NAME"]),
                                referencedTableName: table.name,
                                referencedColumnNames: foreignKeys.map(dbFk => dbFk["REFERENCED_COLUMN_NAME"]),
                                onDelete: dbForeignKey["DELETE_RULE"] === "RESTRICT" ? "NO ACTION" : dbForeignKey["DELETE_RULE"],
                                onUpdate: dbForeignKey["UPDATE_RULE"] === "RESTRICT" ? "NO ACTION" : dbForeignKey["UPDATE_RULE"],
                            });
                        });
                        // drop referenced foreign keys
                        referencedForeignKeys.forEach(foreignKey => {
                            const mapping = referencedForeignKeyTableMapping.find(it => it.fkName === foreignKey.name);
                            upQueries.push(this.dropForeignKeySql(mapping.tableName, foreignKey));
                            downQueries.push(this.createForeignKeySql(mapping.tableName, foreignKey));
                        });
                    }
                    const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                    const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                    upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${pkName}"`));
                    downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                    // restore referenced foreign keys
                    referencedForeignKeys.forEach(foreignKey => {
                        const mapping = referencedForeignKeyTableMapping.find(it => it.fkName === foreignKey.name);
                        upQueries.push(this.createForeignKeySql(mapping.tableName, foreignKey));
                        downQueries.push(this.dropForeignKeySql(mapping.tableName, foreignKey));
                    });
                }
                primaryColumns.push(column);
                const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${pkName}"`));
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
                upQueries.push(this.createIndexSql(table, uniqueIndex));
                downQueries.push(this.dropIndexSql(table, uniqueIndex));
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
    changeColumn(tableOrName, oldTableColumnOrName, newColumn) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            let clonedTable = table.clone();
            const upQueries = [];
            const downQueries = [];
            const oldColumn = oldTableColumnOrName instanceof TableColumn_1.TableColumn
                ? oldTableColumnOrName
                : table.columns.find(column => column.name === oldTableColumnOrName);
            if (!oldColumn)
                throw new Error(`Column "${oldTableColumnOrName}" was not found in the "${table.name}" table.`);
            if ((newColumn.isGenerated !== oldColumn.isGenerated && newColumn.generationStrategy !== "uuid") || newColumn.type !== oldColumn.type || newColumn.length !== oldColumn.length) {
                // SQL Server does not support changing of IDENTITY column, so we must drop column and recreate it again.
                // Also, we recreate column if column type changed
                yield this.dropColumn(table, oldColumn);
                yield this.addColumn(table, newColumn);
                // update cloned table
                clonedTable = table.clone();
            }
            else {
                if (newColumn.name !== oldColumn.name) {
                    // rename column
                    upQueries.push(new Query_1.Query(`RENAME COLUMN ${this.escapePath(table)}."${oldColumn.name}" TO "${newColumn.name}"`));
                    downQueries.push(new Query_1.Query(`RENAME COLUMN ${this.escapePath(table)}."${newColumn.name}" TO "${oldColumn.name}"`));
                    if (oldColumn.isPrimary === true) {
                        const primaryColumns = clonedTable.primaryColumns;
                        // build old primary constraint name
                        const columnNames = primaryColumns.map(column => column.name);
                        const oldPkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);
                        // replace old column name with new column name
                        columnNames.splice(columnNames.indexOf(oldColumn.name), 1);
                        columnNames.push(newColumn.name);
                        const columnNamesString = columnNames.map(columnName => `"${columnName}"`).join(", ");
                        // drop old PK
                        upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(clonedTable)} DROP CONSTRAINT "${oldPkName}"`));
                        downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(clonedTable)} ADD CONSTRAINT "${oldPkName}" PRIMARY KEY (${columnNamesString})`));
                        // build new primary constraint name
                        const newPkName = this.connection.namingStrategy.primaryKeyName(clonedTable, columnNames);
                        // create new PK
                        upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(clonedTable)} ADD CONSTRAINT "${newPkName}" PRIMARY KEY (${columnNamesString})`));
                        downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(clonedTable)} DROP CONSTRAINT "${newPkName}"`));
                    }
                    // rename index constraints
                    clonedTable.findColumnIndices(oldColumn).forEach(index => {
                        // build new constraint name
                        index.columnNames.splice(index.columnNames.indexOf(oldColumn.name), 1);
                        index.columnNames.push(newColumn.name);
                        const newIndexName = this.connection.namingStrategy.indexName(clonedTable, index.columnNames, index.where);
                        // drop old index
                        upQueries.push(this.dropIndexSql(clonedTable, index));
                        downQueries.push(this.createIndexSql(clonedTable, index));
                        // replace constraint name
                        index.name = newIndexName;
                        // create new index
                        upQueries.push(this.createIndexSql(clonedTable, index));
                        downQueries.push(this.dropIndexSql(clonedTable, index));
                    });
                    // rename foreign key constraints
                    clonedTable.findColumnForeignKeys(oldColumn).forEach(foreignKey => {
                        // build new constraint name
                        foreignKey.columnNames.splice(foreignKey.columnNames.indexOf(oldColumn.name), 1);
                        foreignKey.columnNames.push(newColumn.name);
                        const newForeignKeyName = this.connection.namingStrategy.foreignKeyName(clonedTable, foreignKey.columnNames, foreignKey.referencedTableName, foreignKey.referencedColumnNames);
                        upQueries.push(this.dropForeignKeySql(clonedTable, foreignKey));
                        downQueries.push(this.createForeignKeySql(clonedTable, foreignKey));
                        // replace constraint name
                        foreignKey.name = newForeignKeyName;
                        // create new FK's
                        upQueries.push(this.createForeignKeySql(clonedTable, foreignKey));
                        downQueries.push(this.dropForeignKeySql(clonedTable, foreignKey));
                    });
                    // rename check constraints
                    clonedTable.findColumnChecks(oldColumn).forEach(check => {
                        // build new constraint name
                        check.columnNames.splice(check.columnNames.indexOf(oldColumn.name), 1);
                        check.columnNames.push(newColumn.name);
                        const newCheckName = this.connection.namingStrategy.checkConstraintName(clonedTable, check.expression);
                        upQueries.push(this.dropCheckConstraintSql(clonedTable, check));
                        downQueries.push(this.createCheckConstraintSql(clonedTable, check));
                        // replace constraint name
                        check.name = newCheckName;
                        upQueries.push(this.createCheckConstraintSql(clonedTable, check));
                        downQueries.push(this.dropCheckConstraintSql(clonedTable, check));
                    });
                    // rename old column in the Table object
                    const oldTableColumn = clonedTable.columns.find(column => column.name === oldColumn.name);
                    clonedTable.columns[clonedTable.columns.indexOf(oldTableColumn)].name = newColumn.name;
                    oldColumn.name = newColumn.name;
                }
                if (this.isColumnChanged(oldColumn, newColumn)) {
                    upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ALTER (${this.buildCreateColumnSql(newColumn)})`));
                    downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ALTER (${this.buildCreateColumnSql(oldColumn)})`));
                }
                if (newColumn.isPrimary !== oldColumn.isPrimary) {
                    const primaryColumns = clonedTable.primaryColumns;
                    // if primary column state changed, we must always drop existed constraint.
                    if (primaryColumns.length > 0) {
                        const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                        const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                        upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${pkName}"`));
                        downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                    }
                    if (newColumn.isPrimary === true) {
                        primaryColumns.push(newColumn);
                        // update column in table
                        const column = clonedTable.columns.find(column => column.name === newColumn.name);
                        column.isPrimary = true;
                        const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                        const columnNames = primaryColumns.map(column => `"${column.name}"`).join(", ");
                        upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                        downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${pkName}"`));
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
                            upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                            downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${pkName}"`));
                        }
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
                        upQueries.push(this.createIndexSql(table, uniqueIndex));
                        downQueries.push(this.dropIndexSql(table, uniqueIndex));
                    }
                    else {
                        const uniqueIndex = clonedTable.indices.find(index => {
                            return index.columnNames.length === 1 && index.isUnique === true && !!index.columnNames.find(columnName => columnName === newColumn.name);
                        });
                        clonedTable.indices.splice(clonedTable.indices.indexOf(uniqueIndex), 1);
                        const tableUnique = clonedTable.uniques.find(unique => unique.name === uniqueIndex.name);
                        clonedTable.uniques.splice(clonedTable.uniques.indexOf(tableUnique), 1);
                        upQueries.push(this.dropIndexSql(table, uniqueIndex));
                        downQueries.push(this.createIndexSql(table, uniqueIndex));
                    }
                }
                if (newColumn.default !== oldColumn.default) {
                    if (newColumn.default !== null && newColumn.default !== undefined) {
                        upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ALTER ("${newColumn.name}" ${this.connection.driver.createFullType(newColumn)} DEFAULT ${newColumn.default})`));
                        if (oldColumn.default !== null && oldColumn.default !== undefined) {
                            downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ALTER ("${oldColumn.name}" ${this.connection.driver.createFullType(oldColumn)} DEFAULT ${oldColumn.default})`));
                        }
                        else {
                            downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ALTER ("${oldColumn.name}" ${this.connection.driver.createFullType(oldColumn)} DEFAULT NULL)`));
                        }
                    }
                    else if (oldColumn.default !== null && oldColumn.default !== undefined) {
                        upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ALTER ("${newColumn.name}" ${this.connection.driver.createFullType(newColumn)} DEFAULT NULL)`));
                        downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ALTER ("${oldColumn.name}" ${this.connection.driver.createFullType(oldColumn)} DEFAULT ${oldColumn.default})`));
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
            const parsedTableName = this.parseTableName(table);
            const column = columnOrName instanceof TableColumn_1.TableColumn ? columnOrName : table.findColumnByName(columnOrName);
            if (!column)
                throw new Error(`Column "${columnOrName}" was not found in table "${table.name}"`);
            const clonedTable = table.clone();
            const upQueries = [];
            const downQueries = [];
            // drop primary key constraint
            if (column.isPrimary) {
                // SAP HANA does not allow to drop PK's which is referenced by foreign keys.
                // To avoid this, we must drop all referential foreign keys and recreate them later
                const referencedForeignKeySql = `SELECT * FROM "SYS"."REFERENTIAL_CONSTRAINTS" WHERE "REFERENCED_SCHEMA_NAME" = ${parsedTableName.schema} AND "REFERENCED_TABLE_NAME" = ${parsedTableName.tableName}`;
                const dbForeignKeys = yield this.query(referencedForeignKeySql);
                let referencedForeignKeys = [];
                const referencedForeignKeyTableMapping = [];
                if (dbForeignKeys.length > 0) {
                    referencedForeignKeys = dbForeignKeys.map(dbForeignKey => {
                        const foreignKeys = dbForeignKeys.filter(dbFk => dbFk["CONSTRAINT_NAME"] === dbForeignKey["CONSTRAINT_NAME"]);
                        referencedForeignKeyTableMapping.push({ tableName: `${dbForeignKey["SCHEMA_NAME"]}.${dbForeignKey["TABLE_NAME"]}`, fkName: dbForeignKey["CONSTRAINT_NAME"] });
                        return new TableForeignKey_1.TableForeignKey({
                            name: dbForeignKey["CONSTRAINT_NAME"],
                            columnNames: foreignKeys.map(dbFk => dbFk["COLUMN_NAME"]),
                            referencedTableName: table.name,
                            referencedColumnNames: foreignKeys.map(dbFk => dbFk["REFERENCED_COLUMN_NAME"]),
                            onDelete: dbForeignKey["DELETE_RULE"] === "RESTRICT" ? "NO ACTION" : dbForeignKey["DELETE_RULE"],
                            onUpdate: dbForeignKey["UPDATE_RULE"] === "RESTRICT" ? "NO ACTION" : dbForeignKey["UPDATE_RULE"],
                        });
                    });
                    // drop referenced foreign keys
                    referencedForeignKeys.forEach(foreignKey => {
                        const mapping = referencedForeignKeyTableMapping.find(it => it.fkName === foreignKey.name);
                        upQueries.push(this.dropForeignKeySql(mapping.tableName, foreignKey));
                        downQueries.push(this.createForeignKeySql(mapping.tableName, foreignKey));
                    });
                }
                const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, clonedTable.primaryColumns.map(column => column.name));
                const columnNames = clonedTable.primaryColumns.map(primaryColumn => `"${primaryColumn.name}"`).join(", ");
                upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(clonedTable)} DROP CONSTRAINT "${pkName}"`));
                downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(clonedTable)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                // update column in table
                const tableColumn = clonedTable.findColumnByName(column.name);
                tableColumn.isPrimary = false;
                // if primary key have multiple columns, we must recreate it without dropped column
                if (clonedTable.primaryColumns.length > 0) {
                    const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, clonedTable.primaryColumns.map(column => column.name));
                    const columnNames = clonedTable.primaryColumns.map(primaryColumn => `"${primaryColumn.name}"`).join(", ");
                    upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(clonedTable)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNames})`));
                    downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(clonedTable)} DROP CONSTRAINT "${pkName}"`));
                }
                // restore referenced foreign keys
                referencedForeignKeys.forEach(foreignKey => {
                    const mapping = referencedForeignKeyTableMapping.find(it => it.fkName === foreignKey.name);
                    upQueries.push(this.createForeignKeySql(mapping.tableName, foreignKey));
                    downQueries.push(this.dropForeignKeySql(mapping.tableName, foreignKey));
                });
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
                if (foundUnique) {
                    clonedTable.uniques.splice(clonedTable.uniques.indexOf(foundUnique), 1);
                    upQueries.push(this.dropIndexSql(table, uniqueName));
                    downQueries.push(new Query_1.Query(`CREATE UNIQUE INDEX "${uniqueName}" ON ${this.escapePath(table)} ("${column.name}")`));
                }
                const indexName = this.connection.namingStrategy.indexName(table.name, [column.name]);
                const foundIndex = clonedTable.indices.find(index => index.name === indexName);
                if (foundIndex) {
                    clonedTable.indices.splice(clonedTable.indices.indexOf(foundIndex), 1);
                    upQueries.push(this.dropIndexSql(table, indexName));
                    downQueries.push(new Query_1.Query(`CREATE UNIQUE INDEX "${indexName}" ON ${this.escapePath(table)} ("${column.name}")`));
                }
            }
            // drop column check
            const columnCheck = clonedTable.checks.find(check => !!check.columnNames && check.columnNames.length === 1 && check.columnNames[0] === column.name);
            if (columnCheck) {
                clonedTable.checks.splice(clonedTable.checks.indexOf(columnCheck), 1);
                upQueries.push(this.dropCheckConstraintSql(table, columnCheck));
                downQueries.push(this.createCheckConstraintSql(table, columnCheck));
            }
            upQueries.push(new Query_1.Query(this.dropColumnSql(table, column)));
            downQueries.push(new Query_1.Query(this.addColumnSql(table, column)));
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
            const parsedTableName = this.parseTableName(table);
            const clonedTable = table.clone();
            const columnNames = columns.map(column => column.name);
            const upQueries = [];
            const downQueries = [];
            // SAP HANA does not allow to drop PK's which is referenced by foreign keys.
            // To avoid this, we must drop all referential foreign keys and recreate them later
            const referencedForeignKeySql = `SELECT * FROM "SYS"."REFERENTIAL_CONSTRAINTS" WHERE "REFERENCED_SCHEMA_NAME" = ${parsedTableName.schema} AND "REFERENCED_TABLE_NAME" = ${parsedTableName.tableName}`;
            const dbForeignKeys = yield this.query(referencedForeignKeySql);
            let referencedForeignKeys = [];
            const referencedForeignKeyTableMapping = [];
            if (dbForeignKeys.length > 0) {
                referencedForeignKeys = dbForeignKeys.map(dbForeignKey => {
                    const foreignKeys = dbForeignKeys.filter(dbFk => dbFk["CONSTRAINT_NAME"] === dbForeignKey["CONSTRAINT_NAME"]);
                    referencedForeignKeyTableMapping.push({ tableName: `${dbForeignKey["SCHEMA_NAME"]}.${dbForeignKey["TABLE_NAME"]}`, fkName: dbForeignKey["CONSTRAINT_NAME"] });
                    return new TableForeignKey_1.TableForeignKey({
                        name: dbForeignKey["CONSTRAINT_NAME"],
                        columnNames: foreignKeys.map(dbFk => dbFk["COLUMN_NAME"]),
                        referencedTableName: table.name,
                        referencedColumnNames: foreignKeys.map(dbFk => dbFk["REFERENCED_COLUMN_NAME"]),
                        onDelete: dbForeignKey["DELETE_RULE"] === "RESTRICT" ? "NO ACTION" : dbForeignKey["DELETE_RULE"],
                        onUpdate: dbForeignKey["UPDATE_RULE"] === "RESTRICT" ? "NO ACTION" : dbForeignKey["UPDATE_RULE"],
                    });
                });
                // drop referenced foreign keys
                referencedForeignKeys.forEach(foreignKey => {
                    const mapping = referencedForeignKeyTableMapping.find(it => it.fkName === foreignKey.name);
                    upQueries.push(this.dropForeignKeySql(mapping.tableName, foreignKey));
                    downQueries.push(this.createForeignKeySql(mapping.tableName, foreignKey));
                });
            }
            // if table already have primary columns, we must drop them.
            const primaryColumns = clonedTable.primaryColumns;
            if (primaryColumns.length > 0) {
                const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, primaryColumns.map(column => column.name));
                const columnNamesString = primaryColumns.map(column => `"${column.name}"`).join(", ");
                upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${pkName}"`));
                downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNamesString})`));
            }
            // update columns in table.
            clonedTable.columns
                .filter(column => columnNames.indexOf(column.name) !== -1)
                .forEach(column => column.isPrimary = true);
            const pkName = this.connection.namingStrategy.primaryKeyName(clonedTable.name, columnNames);
            const columnNamesString = columnNames.map(columnName => `"${columnName}"`).join(", ");
            upQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${pkName}" PRIMARY KEY (${columnNamesString})`));
            downQueries.push(new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${pkName}"`));
            // restore referenced foreign keys
            referencedForeignKeys.forEach(foreignKey => {
                const mapping = referencedForeignKeyTableMapping.find(it => it.fkName === foreignKey.name);
                upQueries.push(this.createForeignKeySql(mapping.tableName, foreignKey));
                downQueries.push(this.dropForeignKeySql(mapping.tableName, foreignKey));
            });
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
            const parsedTableName = this.parseTableName(table);
            const upQueries = [];
            const downQueries = [];
            // SAP HANA does not allow to drop PK's which is referenced by foreign keys.
            // To avoid this, we must drop all referential foreign keys and recreate them later
            const referencedForeignKeySql = `SELECT * FROM "SYS"."REFERENTIAL_CONSTRAINTS" WHERE "REFERENCED_SCHEMA_NAME" = ${parsedTableName.schema} AND "REFERENCED_TABLE_NAME" = ${parsedTableName.tableName}`;
            const dbForeignKeys = yield this.query(referencedForeignKeySql);
            let referencedForeignKeys = [];
            const referencedForeignKeyTableMapping = [];
            if (dbForeignKeys.length > 0) {
                referencedForeignKeys = dbForeignKeys.map(dbForeignKey => {
                    const foreignKeys = dbForeignKeys.filter(dbFk => dbFk["CONSTRAINT_NAME"] === dbForeignKey["CONSTRAINT_NAME"]);
                    referencedForeignKeyTableMapping.push({ tableName: `${dbForeignKey["SCHEMA_NAME"]}.${dbForeignKey["TABLE_NAME"]}`, fkName: dbForeignKey["CONSTRAINT_NAME"] });
                    return new TableForeignKey_1.TableForeignKey({
                        name: dbForeignKey["CONSTRAINT_NAME"],
                        columnNames: foreignKeys.map(dbFk => dbFk["COLUMN_NAME"]),
                        referencedTableName: table.name,
                        referencedColumnNames: foreignKeys.map(dbFk => dbFk["REFERENCED_COLUMN_NAME"]),
                        onDelete: dbForeignKey["DELETE_RULE"] === "RESTRICT" ? "NO ACTION" : dbForeignKey["DELETE_RULE"],
                        onUpdate: dbForeignKey["UPDATE_RULE"] === "RESTRICT" ? "NO ACTION" : dbForeignKey["UPDATE_RULE"],
                    });
                });
                // drop referenced foreign keys
                referencedForeignKeys.forEach(foreignKey => {
                    const mapping = referencedForeignKeyTableMapping.find(it => it.fkName === foreignKey.name);
                    upQueries.push(this.dropForeignKeySql(mapping.tableName, foreignKey));
                    downQueries.push(this.createForeignKeySql(mapping.tableName, foreignKey));
                });
            }
            upQueries.push(this.dropPrimaryKeySql(table));
            downQueries.push(this.createPrimaryKeySql(table, table.primaryColumns.map(column => column.name)));
            // restore referenced foreign keys
            referencedForeignKeys.forEach(foreignKey => {
                const mapping = referencedForeignKeyTableMapping.find(it => it.fkName === foreignKey.name);
                upQueries.push(this.createForeignKeySql(mapping.tableName, foreignKey));
                downQueries.push(this.dropForeignKeySql(mapping.tableName, foreignKey));
            });
            yield this.executeQueries(upQueries, downQueries);
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
            throw new Error(`SAP HANA does not support unique constraints. Use unique index instead.`);
        });
    }
    /**
     * Creates a new unique constraints.
     */
    createUniqueConstraints(tableOrName, uniqueConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`SAP HANA does not support unique constraints. Use unique index instead.`);
        });
    }
    /**
     * Drops unique constraint.
     */
    dropUniqueConstraint(tableOrName, uniqueOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`SAP HANA does not support unique constraints. Use unique index instead.`);
        });
    }
    /**
     * Drops an unique constraints.
     */
    dropUniqueConstraints(tableOrName, uniqueConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`SAP HANA does not support unique constraints. Use unique index instead.`);
        });
    }
    /**
     * Creates a new check constraint.
     */
    createCheckConstraint(tableOrName, checkConstraint) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = tableOrName instanceof Table_1.Table ? tableOrName : yield this.getCachedTable(tableOrName);
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
     * Creates a new check constraints.
     */
    createCheckConstraints(tableOrName, checkConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const promises = checkConstraints.map(checkConstraint => this.createCheckConstraint(tableOrName, checkConstraint));
            yield Promise.all(promises);
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const promises = checkConstraints.map(checkConstraint => this.dropCheckConstraint(tableOrName, checkConstraint));
            yield Promise.all(promises);
        });
    }
    /**
     * Creates a new exclusion constraint.
     */
    createExclusionConstraint(tableOrName, exclusionConstraint) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`SAP HANA does not support exclusion constraints.`);
        });
    }
    /**
     * Creates a new exclusion constraints.
     */
    createExclusionConstraints(tableOrName, exclusionConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`SAP HANA does not support exclusion constraints.`);
        });
    }
    /**
     * Drops exclusion constraint.
     */
    dropExclusionConstraint(tableOrName, exclusionOrName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`SAP HANA does not support exclusion constraints.`);
        });
    }
    /**
     * Drops exclusion constraints.
     */
    dropExclusionConstraints(tableOrName, exclusionConstraints) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw new Error(`SAP HANA does not support exclusion constraints.`);
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const promises = foreignKeys.map(foreignKey => this.createForeignKey(tableOrName, foreignKey));
            yield Promise.all(promises);
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
    clearTable(tablePath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.query(`TRUNCATE TABLE ${this.escapePath(tablePath)}`);
        });
    }
    /**
     * Removes all tables from the currently connected database.
     */
    clearDatabase() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const schemas = [];
            this.connection.entityMetadatas
                .filter(metadata => metadata.schema)
                .forEach(metadata => {
                const isSchemaExist = !!schemas.find(schema => schema === metadata.schema);
                if (!isSchemaExist)
                    schemas.push(metadata.schema);
            });
            schemas.push(this.driver.options.schema || "current_schema");
            const schemaNamesString = schemas.map(name => {
                return name === "current_schema" ? name : "'" + name + "'";
            }).join(", ");
            yield this.startTransaction();
            try {
                // const selectViewDropsQuery = `SELECT 'DROP VIEW IF EXISTS "' || schemaname || '"."' || viewname || '" CASCADE;' as "query" ` +
                //     `FROM "pg_views" WHERE "schemaname" IN (${schemaNamesString}) AND "viewname" NOT IN ('geography_columns', 'geometry_columns', 'raster_columns', 'raster_overviews')`;
                // const dropViewQueries: ObjectLiteral[] = await this.query(selectViewDropsQuery);
                // await Promise.all(dropViewQueries.map(q => this.query(q["query"])));
                // ignore spatial_ref_sys; it's a special table supporting PostGIS
                const selectTableDropsQuery = `SELECT 'DROP TABLE "' || schema_name || '"."' || table_name || '" CASCADE;' as "query" FROM "SYS"."TABLES" WHERE "SCHEMA_NAME" IN (${schemaNamesString}) AND "TABLE_NAME" NOT IN ('SYS_AFL_GENERATOR_PARAMETERS') AND "IS_COLUMN_TABLE" = 'TRUE'`;
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
        });
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Return current database.
     */
    getCurrentDatabase() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const currentDBQuery = yield this.query(`SELECT "VALUE" AS "db_name" FROM "SYS"."M_SYSTEM_OVERVIEW" WHERE "SECTION" = 'System' and "NAME" = 'Instance ID'`);
            return currentDBQuery[0]["db_name"];
        });
    }
    /**
     * Return current schema.
     */
    getCurrentSchema() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const currentSchemaQuery = yield this.query(`SELECT CURRENT_SCHEMA AS "schema_name" FROM "SYS"."DUMMY"`);
            return currentSchemaQuery[0]["schema_name"];
        });
    }
    loadViews(viewNames) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const hasTable = yield this.hasTable(this.getTypeormMetadataTableName());
            if (!hasTable)
                return Promise.resolve([]);
            const currentSchema = yield this.getCurrentSchema();
            const viewsCondition = viewNames.map(viewName => {
                let [schema, name] = viewName.split(".");
                if (!name) {
                    name = schema;
                    schema = this.driver.options.schema || currentSchema;
                }
                return `("t"."schema" = '${schema}' AND "t"."name" = '${name}')`;
            }).join(" OR ");
            const query = `SELECT "t".* FROM ${this.escapePath(this.getTypeormMetadataTableName())} "t" WHERE "t"."type" = 'VIEW' ${viewsCondition ? `AND (${viewsCondition})` : ""}`;
            const dbViews = yield this.query(query);
            return dbViews.map((dbView) => {
                const view = new View_1.View();
                const schema = dbView["schema"] === currentSchema && !this.driver.options.schema ? undefined : dbView["schema"];
                view.name = this.driver.buildTableName(dbView["name"], schema);
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
            const currentSchema = yield this.getCurrentSchema();
            const tablesCondition = tableNames.map(tableName => {
                let [schema, name] = tableName.split(".");
                if (!name) {
                    name = schema;
                    schema = this.driver.options.schema || currentSchema;
                }
                return `("SCHEMA_NAME" = '${schema}' AND "TABLE_NAME" = '${name}')`;
            }).join(" OR ");
            const tablesSql = `SELECT * FROM "SYS"."TABLES" WHERE ` + tablesCondition;
            const columnsSql = `SELECT * FROM "SYS"."TABLE_COLUMNS" WHERE ` + tablesCondition + ` ORDER BY "POSITION"`;
            const constraintsCondition = tableNames.map(tableName => {
                let [schema, name] = tableName.split(".");
                if (!name) {
                    name = schema;
                    schema = this.driver.options.schema || currentSchema;
                }
                return `("SCHEMA_NAME" = '${schema}' AND "TABLE_NAME" = '${name}')`;
            }).join(" OR ");
            const constraintsSql = `SELECT * FROM "SYS"."CONSTRAINTS" WHERE (${constraintsCondition}) ORDER BY "POSITION"`;
            const indicesCondition = tableNames.map(tableName => {
                let [schema, name] = tableName.split(".");
                if (!name) {
                    name = schema;
                    schema = this.driver.options.schema || currentSchema;
                }
                return `("I"."SCHEMA_NAME" = '${schema}' AND "I"."TABLE_NAME" = '${name}')`;
            }).join(" OR ");
            // excluding primary key and autogenerated fulltext indices
            const indicesSql = `SELECT "I"."INDEX_TYPE", "I"."SCHEMA_NAME", "I"."TABLE_NAME", "I"."INDEX_NAME", "IC"."COLUMN_NAME", "I"."CONSTRAINT" ` +
                `FROM "SYS"."INDEXES" "I" INNER JOIN "SYS"."INDEX_COLUMNS" "IC" ON "IC"."INDEX_OID" = "I"."INDEX_OID" ` +
                `WHERE (${indicesCondition}) AND ("I"."CONSTRAINT" IS NULL OR "I"."CONSTRAINT" != 'PRIMARY KEY') AND "I"."INDEX_NAME" NOT LIKE '%_SYS_FULLTEXT_%' ORDER BY "IC"."POSITION"`;
            const foreignKeysCondition = tableNames.map(tableName => {
                let [schema, name] = tableName.split(".");
                if (!name) {
                    name = schema;
                    schema = this.driver.options.schema || currentSchema;
                }
                return `("SCHEMA_NAME" = '${schema}' AND "TABLE_NAME" = '${name}')`;
            }).join(" OR ");
            const foreignKeysSql = `SELECT * FROM "SYS"."REFERENTIAL_CONSTRAINTS" WHERE (${foreignKeysCondition}) ORDER BY "POSITION"`;
            const [dbTables, dbColumns, dbConstraints, dbIndices, dbForeignKeys] = yield Promise.all([
                this.query(tablesSql),
                this.query(columnsSql),
                this.query(constraintsSql),
                this.query(indicesSql),
                this.query(foreignKeysSql),
            ]);
            // if tables were not found in the db, no need to proceed
            if (!dbTables.length)
                return [];
            // create tables for loaded tables
            return Promise.all(dbTables.map((dbTable) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const table = new Table_1.Table();
                // We do not need to join schema name, when database is by default.
                // In this case we need local variable `tableFullName` for below comparision.
                const schema = dbTable["SCHEMA_NAME"] === currentSchema && !this.driver.options.schema ? undefined : dbTable["SCHEMA_NAME"];
                table.name = this.driver.buildTableName(dbTable["TABLE_NAME"], schema);
                const tableFullName = this.driver.buildTableName(dbTable["TABLE_NAME"], dbTable["SCHEMA_NAME"]);
                // create columns from the loaded columns
                table.columns = yield Promise.all(dbColumns
                    .filter(dbColumn => this.driver.buildTableName(dbColumn["TABLE_NAME"], dbColumn["SCHEMA_NAME"]) === tableFullName)
                    .map((dbColumn) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    const columnConstraints = dbConstraints.filter(dbConstraint => {
                        return this.driver.buildTableName(dbConstraint["TABLE_NAME"], dbConstraint["SCHEMA_NAME"]) === tableFullName && dbConstraint["COLUMN_NAME"] === dbColumn["COLUMN_NAME"];
                    });
                    const columnUniqueIndex = dbIndices.find(dbIndex => {
                        const indexTableFullName = this.driver.buildTableName(dbIndex["TABLE_NAME"], dbIndex["SCHEMA_NAME"]);
                        if (indexTableFullName !== tableFullName) {
                            return false;
                        }
                        // Index is not for this column
                        if (dbIndex["COLUMN_NAME"] !== dbColumn["COLUMN_NAME"]) {
                            return false;
                        }
                        return dbIndex["CONSTRAINT"] && dbIndex["CONSTRAINT"].indexOf("UNIQUE") !== -1;
                    });
                    const tableMetadata = this.connection.entityMetadatas.find(metadata => metadata.tablePath === table.name);
                    const hasIgnoredIndex = columnUniqueIndex && tableMetadata && tableMetadata.indices
                        .some(index => index.name === columnUniqueIndex["INDEX_NAME"] && index.synchronize === false);
                    const isConstraintComposite = columnUniqueIndex
                        ? !!dbIndices.find(dbIndex => dbIndex["INDEX_NAME"] === columnUniqueIndex["INDEX_NAME"] && dbIndex["COLUMN_NAME"] !== dbColumn["COLUMN_NAME"])
                        : false;
                    const tableColumn = new TableColumn_1.TableColumn();
                    tableColumn.name = dbColumn["COLUMN_NAME"];
                    tableColumn.type = dbColumn["DATA_TYPE_NAME"].toLowerCase();
                    if (tableColumn.type === "dec" || tableColumn.type === "decimal") {
                        // If one of these properties was set, and another was not, Postgres sets '0' in to unspecified property
                        // we set 'undefined' in to unspecified property to avoid changing column on sync
                        if (dbColumn["LENGTH"] !== null && !this.isDefaultColumnPrecision(table, tableColumn, dbColumn["LENGTH"])) {
                            tableColumn.precision = dbColumn["LENGTH"];
                        }
                        else if (dbColumn["SCALE"] !== null && !this.isDefaultColumnScale(table, tableColumn, dbColumn["SCALE"])) {
                            tableColumn.precision = undefined;
                        }
                        if (dbColumn["SCALE"] !== null && !this.isDefaultColumnScale(table, tableColumn, dbColumn["SCALE"])) {
                            tableColumn.scale = dbColumn["SCALE"];
                        }
                        else if (dbColumn["LENGTH"] !== null && !this.isDefaultColumnPrecision(table, tableColumn, dbColumn["LENGTH"])) {
                            tableColumn.scale = undefined;
                        }
                    }
                    if (dbColumn["DATA_TYPE_NAME"].toLowerCase() === "array") {
                        tableColumn.isArray = true;
                        tableColumn.type = dbColumn["CS_DATA_TYPE_NAME"].toLowerCase();
                    }
                    // check only columns that have length property
                    if (this.driver.withLengthColumnTypes.indexOf(tableColumn.type) !== -1 && dbColumn["LENGTH"]) {
                        const length = dbColumn["LENGTH"].toString();
                        tableColumn.length = !this.isDefaultColumnLength(table, tableColumn, length) ? length : "";
                    }
                    tableColumn.isUnique = !!columnUniqueIndex && !hasIgnoredIndex && !isConstraintComposite;
                    tableColumn.isNullable = dbColumn["IS_NULLABLE"] === "TRUE";
                    tableColumn.isPrimary = !!columnConstraints.find(constraint => constraint["IS_PRIMARY_KEY"] === "TRUE");
                    tableColumn.isGenerated = dbColumn["GENERATION_TYPE"] === "ALWAYS AS IDENTITY";
                    if (tableColumn.isGenerated)
                        tableColumn.generationStrategy = "increment";
                    if (dbColumn["DEFAULT_VALUE"] === null
                        || dbColumn["DEFAULT_VALUE"] === undefined) {
                        tableColumn.default = undefined;
                    }
                    else {
                        if (tableColumn.type === "char" || tableColumn.type === "nchar" || tableColumn.type === "varchar" ||
                            tableColumn.type === "nvarchar" || tableColumn.type === "alphanum" || tableColumn.type === "shorttext") {
                            tableColumn.default = `'${dbColumn["DEFAULT_VALUE"]}'`;
                        }
                        else if (tableColumn.type === "boolean") {
                            tableColumn.default = dbColumn["DEFAULT_VALUE"] === "1" ? "true" : "false";
                        }
                        else {
                            tableColumn.default = dbColumn["DEFAULT_VALUE"];
                        }
                    }
                    tableColumn.comment = ""; // dbColumn["COLUMN_COMMENT"];
                    if (dbColumn["character_set_name"])
                        tableColumn.charset = dbColumn["character_set_name"];
                    if (dbColumn["collation_name"])
                        tableColumn.collation = dbColumn["collation_name"];
                    return tableColumn;
                })));
                // find check constraints of table, group them by constraint name and build TableCheck.
                const tableCheckConstraints = OrmUtils_1.OrmUtils.uniq(dbConstraints.filter(dbConstraint => {
                    return this.driver.buildTableName(dbConstraint["TABLE_NAME"], dbConstraint["SCHEMA_NAME"]) === tableFullName
                        && dbConstraint["CHECK_CONDITION"] !== null && dbConstraint["CHECK_CONDITION"] !== undefined;
                }), dbConstraint => dbConstraint["CONSTRAINT_NAME"]);
                table.checks = tableCheckConstraints.map(constraint => {
                    const checks = dbConstraints.filter(dbC => dbC["CONSTRAINT_NAME"] === constraint["CONSTRAINT_NAME"]);
                    return new TableCheck_1.TableCheck({
                        name: constraint["CONSTRAINT_NAME"],
                        columnNames: checks.map(c => c["COLUMN_NAME"]),
                        expression: constraint["CHECK_CONDITION"],
                    });
                });
                // find foreign key constraints of table, group them by constraint name and build TableForeignKey.
                const tableForeignKeyConstraints = OrmUtils_1.OrmUtils.uniq(dbForeignKeys.filter(dbForeignKey => {
                    return this.driver.buildTableName(dbForeignKey["TABLE_NAME"], dbForeignKey["SCHEMA_NAME"]) === tableFullName;
                }), dbForeignKey => dbForeignKey["CONSTRAINT_NAME"]);
                table.foreignKeys = tableForeignKeyConstraints.map(dbForeignKey => {
                    const foreignKeys = dbForeignKeys.filter(dbFk => dbFk["CONSTRAINT_NAME"] === dbForeignKey["CONSTRAINT_NAME"]);
                    // if referenced table located in currently used schema, we don't need to concat schema name to table name.
                    const schema = dbForeignKey["REFERENCED_SCHEMA_NAME"] === currentSchema ? undefined : dbForeignKey["REFERENCED_SCHEMA_NAME"];
                    const referencedTableName = this.driver.buildTableName(dbForeignKey["REFERENCED_TABLE_NAME"], schema);
                    return new TableForeignKey_1.TableForeignKey({
                        name: dbForeignKey["CONSTRAINT_NAME"],
                        columnNames: foreignKeys.map(dbFk => dbFk["COLUMN_NAME"]),
                        referencedTableName: referencedTableName,
                        referencedColumnNames: foreignKeys.map(dbFk => dbFk["REFERENCED_COLUMN_NAME"]),
                        onDelete: dbForeignKey["DELETE_RULE"] === "RESTRICT" ? "NO ACTION" : dbForeignKey["DELETE_RULE"],
                        onUpdate: dbForeignKey["UPDATE_RULE"] === "RESTRICT" ? "NO ACTION" : dbForeignKey["UPDATE_RULE"],
                    });
                });
                // find index constraints of table, group them by constraint name and build TableIndex.
                const tableIndexConstraints = OrmUtils_1.OrmUtils.uniq(dbIndices.filter(dbIndex => {
                    return this.driver.buildTableName(dbIndex["TABLE_NAME"], dbIndex["SCHEMA_NAME"]) === tableFullName;
                }), dbIndex => dbIndex["INDEX_NAME"]);
                table.indices = tableIndexConstraints.map(constraint => {
                    const indices = dbIndices.filter(index => {
                        return index["SCHEMA_NAME"] === constraint["SCHEMA_NAME"]
                            && index["TABLE_NAME"] === constraint["TABLE_NAME"]
                            && index["INDEX_NAME"] === constraint["INDEX_NAME"];
                    });
                    return new TableIndex_1.TableIndex({
                        table: table,
                        name: constraint["INDEX_NAME"],
                        columnNames: indices.map(i => i["COLUMN_NAME"]),
                        isUnique: constraint["CONSTRAINT"] && constraint["CONSTRAINT"].indexOf("UNIQUE") !== -1,
                        isFulltext: constraint["INDEX_TYPE"] === "FULLTEXT"
                    });
                });
                return table;
            })));
        });
    }
    /**
     * Builds and returns SQL for create table.
     */
    createTableSql(table, createForeignKeys) {
        const columnDefinitions = table.columns.map(column => this.buildCreateColumnSql(column)).join(", ");
        let sql = `CREATE TABLE ${this.escapePath(table)} (${columnDefinitions}`;
        // we create unique indexes instead of unique constraints, because SAP HANA does not have unique constraints.
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
        // as SAP HANA does not have unique constraints, we must create table indices from table uniques and mark them as unique.
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
                let constraint = `CONSTRAINT "${fk.name}" FOREIGN KEY (${columnNames}) REFERENCES ${this.escapePath(fk.referencedTableName)} (${referencedColumnNames})`;
                // SAP HANA does not have "NO ACTION" option for FK's
                if (fk.onDelete) {
                    const onDelete = fk.onDelete === "NO ACTION" ? "RESTRICT" : fk.onDelete;
                    constraint += ` ON DELETE ${onDelete}`;
                }
                if (fk.onUpdate) {
                    const onUpdate = fk.onUpdate === "NO ACTION" ? "RESTRICT" : fk.onUpdate;
                    constraint += ` ON UPDATE ${onUpdate}`;
                }
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
        return new Query_1.Query(sql);
    }
    /**
     * Builds drop table sql.
     */
    dropTableSql(tableOrName, ifExist) {
        const query = ifExist ? `DROP TABLE IF EXISTS ${this.escapePath(tableOrName)}` : `DROP TABLE ${this.escapePath(tableOrName)}`;
        return new Query_1.Query(query);
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
            const currentSchema = yield this.getCurrentSchema();
            const splittedName = view.name.split(".");
            let schema = this.driver.options.schema || currentSchema;
            let name = view.name;
            if (splittedName.length === 2) {
                schema = splittedName[0];
                name = splittedName[1];
            }
            const expression = typeof view.expression === "string" ? view.expression.trim() : view.expression(this.connection).getQuery();
            const [query, parameters] = this.connection.createQueryBuilder()
                .insert()
                .into(this.getTypeormMetadataTableName())
                .values({ type: "VIEW", schema: schema, name: name, value: expression })
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
            const currentSchema = yield this.getCurrentSchema();
            const viewName = viewOrPath instanceof View_1.View ? viewOrPath.name : viewOrPath;
            const splittedName = viewName.split(".");
            let schema = this.driver.options.schema || currentSchema;
            let name = viewName;
            if (splittedName.length === 2) {
                schema = splittedName[0];
                name = splittedName[1];
            }
            const qb = this.connection.createQueryBuilder();
            const [query, parameters] = qb.delete()
                .from(this.getTypeormMetadataTableName())
                .where(`${qb.escape("type")} = 'VIEW'`)
                .andWhere(`${qb.escape("schema")} = :schema`, { schema })
                .andWhere(`${qb.escape("name")} = :name`, { name })
                .getQueryAndParameters();
            return new Query_1.Query(query, parameters);
        });
    }
    addColumnSql(table, column) {
        return `ALTER TABLE ${this.escapePath(table)} ADD (${this.buildCreateColumnSql(column)})`;
    }
    dropColumnSql(table, column) {
        return `ALTER TABLE ${this.escapePath(table)} DROP ("${column.name}")`;
    }
    /**
     * Builds create index sql.
     */
    createIndexSql(table, index) {
        const columns = index.columnNames.map(columnName => `"${columnName}"`).join(", ");
        let indexType = "";
        if (index.isUnique) {
            indexType += "UNIQUE ";
        }
        if (index.isFulltext) {
            indexType += "FULLTEXT ";
        }
        return new Query_1.Query(`CREATE ${indexType}INDEX "${index.name}" ON ${this.escapePath(table)} (${columns}) ${index.where ? "WHERE " + index.where : ""}`);
    }
    /**
     * Builds drop index sql.
     */
    dropIndexSql(table, indexOrName) {
        let indexName = indexOrName instanceof TableIndex_1.TableIndex ? indexOrName.name : indexOrName;
        const parsedTableName = this.parseTableName(table);
        if (parsedTableName.schema === "current_schema") {
            return new Query_1.Query(`DROP INDEX "${indexName}"`);
        }
        else {
            return new Query_1.Query(`DROP INDEX "${parsedTableName.schema.replace(/'/g, "")}"."${indexName}"`);
        }
    }
    /**
     * Builds create primary key sql.
     */
    createPrimaryKeySql(table, columnNames) {
        const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, columnNames);
        const columnNamesString = columnNames.map(columnName => `"${columnName}"`).join(", ");
        return new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${primaryKeyName}" PRIMARY KEY (${columnNamesString})`);
    }
    /**
     * Builds drop primary key sql.
     */
    dropPrimaryKeySql(table) {
        const columnNames = table.primaryColumns.map(column => column.name);
        const primaryKeyName = this.connection.namingStrategy.primaryKeyName(table.name, columnNames);
        return new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${primaryKeyName}"`);
    }
    /**
     * Builds create check constraint sql.
     */
    createCheckConstraintSql(table, checkConstraint) {
        return new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} ADD CONSTRAINT "${checkConstraint.name}" CHECK (${checkConstraint.expression})`);
    }
    /**
     * Builds drop check constraint sql.
     */
    dropCheckConstraintSql(table, checkOrName) {
        const checkName = checkOrName instanceof TableCheck_1.TableCheck ? checkOrName.name : checkOrName;
        return new Query_1.Query(`ALTER TABLE ${this.escapePath(table)} DROP CONSTRAINT "${checkName}"`);
    }
    /**
     * Builds create foreign key sql.
     */
    createForeignKeySql(tableOrName, foreignKey) {
        const columnNames = foreignKey.columnNames.map(column => `"` + column + `"`).join(", ");
        const referencedColumnNames = foreignKey.referencedColumnNames.map(column => `"` + column + `"`).join(",");
        let sql = `ALTER TABLE ${this.escapePath(tableOrName)} ADD CONSTRAINT "${foreignKey.name}" FOREIGN KEY (${columnNames}) ` +
            `REFERENCES ${this.escapePath(foreignKey.referencedTableName)}(${referencedColumnNames})`;
        // SAP HANA does not have "NO ACTION" option for FK's
        if (foreignKey.onDelete) {
            const onDelete = foreignKey.onDelete === "NO ACTION" ? "RESTRICT" : foreignKey.onDelete;
            sql += ` ON DELETE ${onDelete}`;
        }
        if (foreignKey.onUpdate) {
            const onUpdate = foreignKey.onUpdate === "NO ACTION" ? "RESTRICT" : foreignKey.onUpdate;
            sql += ` ON UPDATE ${onUpdate}`;
        }
        return new Query_1.Query(sql);
    }
    /**
     * Builds drop foreign key sql.
     */
    dropForeignKeySql(tableOrName, foreignKeyOrName) {
        const foreignKeyName = foreignKeyOrName instanceof TableForeignKey_1.TableForeignKey ? foreignKeyOrName.name : foreignKeyOrName;
        return new Query_1.Query(`ALTER TABLE ${this.escapePath(tableOrName)} DROP CONSTRAINT "${foreignKeyName}"`);
    }
    /**
     * Escapes given table or view path.
     */
    escapePath(target, disableEscape) {
        let tableName = target instanceof Table_1.Table || target instanceof View_1.View ? target.name : target;
        tableName = tableName.indexOf(".") === -1 && this.driver.options.schema ? `${this.driver.options.schema}.${tableName}` : tableName;
        return tableName.split(".").map(i => {
            return disableEscape ? i : `"${i}"`;
        }).join(".");
    }
    /**
     * Returns object with table schema and table name.
     */
    parseTableName(target) {
        const tableName = target instanceof Table_1.Table ? target.name : target;
        if (tableName.indexOf(".") === -1) {
            return {
                schema: this.driver.options.schema ? `'${this.driver.options.schema}'` : "current_schema",
                tableName: `'${tableName}'`
            };
        }
        else {
            return {
                schema: `'${tableName.split(".")[0]}'`,
                tableName: `'${tableName.split(".")[1]}'`
            };
        }
    }
    /**
     * Concat database name and schema name to the foreign key name.
     * Needs because FK name is relevant to the schema and database.
     */
    buildForeignKeyName(fkName, schemaName, dbName) {
        let joinedFkName = fkName;
        if (schemaName)
            joinedFkName = schemaName + "." + joinedFkName;
        if (dbName)
            joinedFkName = dbName + "." + joinedFkName;
        return joinedFkName;
    }
    /**
     * Removes parenthesis around default value.
     * Sql server returns default value with parenthesis around, e.g.
     *  ('My text') - for string
     *  ((1)) - for number
     *  (newsequentialId()) - for function
     */
    removeParenthesisFromDefault(defaultValue) {
        if (defaultValue.substr(0, 1) !== "(")
            return defaultValue;
        const normalizedDefault = defaultValue.substr(1, defaultValue.lastIndexOf(")") - 1);
        return this.removeParenthesisFromDefault(normalizedDefault);
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
            c += " GENERATED ALWAYS AS IDENTITY";
        return c;
    }
}
exports.SapQueryRunner = SapQueryRunner;
//# sourceMappingURL=SapQueryRunner.js.map