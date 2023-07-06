"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RdbmsSchemaBuilder = void 0;
const tslib_1 = require("tslib");
const CockroachDriver_1 = require("../driver/cockroachdb/CockroachDriver");
const Table_1 = require("./table/Table");
const TableColumn_1 = require("./table/TableColumn");
const TableForeignKey_1 = require("./table/TableForeignKey");
const TableIndex_1 = require("./table/TableIndex");
const TableUtils_1 = require("./util/TableUtils");
const PostgresDriver_1 = require("../driver/postgres/PostgresDriver");
const MysqlDriver_1 = require("../driver/mysql/MysqlDriver");
const TableUnique_1 = require("./table/TableUnique");
const TableCheck_1 = require("./table/TableCheck");
const TableExclusion_1 = require("./table/TableExclusion");
const View_1 = require("./view/View");
const AuroraDataApiDriver_1 = require("../driver/aurora-data-api/AuroraDataApiDriver");
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
class RdbmsSchemaBuilder {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(connection) {
        this.connection = connection;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates complete schemas for the given entity metadatas.
     */
    build() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.queryRunner = this.connection.createQueryRunner();
            // CockroachDB implements asynchronous schema sync operations which can not been executed in transaction.
            // E.g. if you try to DROP column and ADD it again in the same transaction, crdb throws error.
            if (!(this.connection.driver instanceof CockroachDriver_1.CockroachDriver))
                yield this.queryRunner.startTransaction();
            try {
                const tablePaths = this.entityToSyncMetadatas.map(metadata => metadata.tablePath);
                // TODO: typeorm_metadata table needs only for Views for now.
                //  Remove condition or add new conditions if necessary (for CHECK constraints for example).
                if (this.viewEntityToSyncMetadatas.length > 0)
                    yield this.createTypeormMetadataTable();
                yield this.queryRunner.getTables(tablePaths);
                yield this.queryRunner.getViews([]);
                yield this.executeSchemaSyncOperationsInProperOrder();
                // if cache is enabled then perform cache-synchronization as well
                if (this.connection.queryResultCache)
                    yield this.connection.queryResultCache.synchronize(this.queryRunner);
                if (!(this.connection.driver instanceof CockroachDriver_1.CockroachDriver))
                    yield this.queryRunner.commitTransaction();
            }
            catch (error) {
                try { // we throw original error even if rollback thrown an error
                    if (!(this.connection.driver instanceof CockroachDriver_1.CockroachDriver))
                        yield this.queryRunner.rollbackTransaction();
                }
                catch (rollbackError) { }
                throw error;
            }
            finally {
                yield this.queryRunner.release();
            }
        });
    }
    /**
     * Returns sql queries to be executed by schema builder.
     */
    log() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.queryRunner = this.connection.createQueryRunner();
            try {
                const tablePaths = this.entityToSyncMetadatas.map(metadata => metadata.tablePath);
                // TODO: typeorm_metadata table needs only for Views for now.
                //  Remove condition or add new conditions if necessary (for CHECK constraints for example).
                if (this.viewEntityToSyncMetadatas.length > 0)
                    yield this.createTypeormMetadataTable();
                yield this.queryRunner.getTables(tablePaths);
                yield this.queryRunner.getViews([]);
                this.queryRunner.enableSqlMemory();
                yield this.executeSchemaSyncOperationsInProperOrder();
                // if cache is enabled then perform cache-synchronization as well
                if (this.connection.queryResultCache) // todo: check this functionality
                    yield this.connection.queryResultCache.synchronize(this.queryRunner);
                return this.queryRunner.getMemorySql();
            }
            finally {
                // its important to disable this mode despite the fact we are release query builder
                // because there exist drivers which reuse same query runner. Also its important to disable
                // sql memory after call of getMemorySql() method because last one flushes sql memory.
                this.queryRunner.disableSqlMemory();
                yield this.queryRunner.release();
            }
        });
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Returns only entities that should be synced in the database.
     */
    get entityToSyncMetadatas() {
        return this.connection.entityMetadatas.filter(metadata => metadata.synchronize && metadata.tableType !== "entity-child" && metadata.tableType !== "view");
    }
    /**
     * Returns only entities that should be synced in the database.
     */
    get viewEntityToSyncMetadatas() {
        return this.connection.entityMetadatas.filter(metadata => metadata.tableType === "view" && metadata.synchronize);
    }
    /**
     * Executes schema sync operations in a proper order.
     * Order of operations matter here.
     */
    executeSchemaSyncOperationsInProperOrder() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.dropOldViews();
            yield this.dropOldForeignKeys();
            yield this.dropOldIndices();
            yield this.dropOldChecks();
            yield this.dropOldExclusions();
            yield this.dropCompositeUniqueConstraints();
            // await this.renameTables();
            yield this.renameColumns();
            yield this.createNewTables();
            yield this.dropRemovedColumns();
            yield this.addNewColumns();
            yield this.updatePrimaryKeys();
            yield this.updateExistColumns();
            yield this.createNewIndices();
            yield this.createNewChecks();
            yield this.createNewExclusions();
            yield this.createCompositeUniqueConstraints();
            yield this.createForeignKeys();
            yield this.createViews();
        });
    }
    /**
     * Drops all (old) foreign keys that exist in the tables, but do not exist in the entity metadata.
     */
    dropOldForeignKeys() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const metadata of this.entityToSyncMetadatas) {
                const table = this.queryRunner.loadedTables.find(table => table.name === metadata.tablePath);
                if (!table)
                    continue;
                // find foreign keys that exist in the schemas but does not exist in the entity metadata
                const tableForeignKeysToDrop = table.foreignKeys.filter(tableForeignKey => {
                    const metadataFK = metadata.foreignKeys.find(metadataForeignKey => foreignKeysMatch(tableForeignKey, metadataForeignKey));
                    return !metadataFK
                        || (metadataFK.onDelete && metadataFK.onDelete !== tableForeignKey.onDelete)
                        || (metadataFK.onUpdate && metadataFK.onUpdate !== tableForeignKey.onUpdate);
                });
                if (tableForeignKeysToDrop.length === 0)
                    continue;
                this.connection.logger.logSchemaBuild(`dropping old foreign keys of ${table.name}: ${tableForeignKeysToDrop.map(dbForeignKey => dbForeignKey.name).join(", ")}`);
                // drop foreign keys from the database
                yield this.queryRunner.dropForeignKeys(table, tableForeignKeysToDrop);
            }
        });
    }
    /**
     * Rename tables
     */
    renameTables() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // for (const metadata of this.entityToSyncMetadatas) {
            //     const table = this.queryRunner.loadedTables.find(table => table.name === metadata.tablePath);
            // }
        });
    }
    /**
     * Renames columns.
     * Works if only one column per table was changed.
     * Changes only column name. If something besides name was changed, these changes will be ignored.
     */
    renameColumns() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const metadata of this.entityToSyncMetadatas) {
                const table = this.queryRunner.loadedTables.find(table => table.name === metadata.tablePath);
                if (!table)
                    continue;
                if (metadata.columns.length !== table.columns.length)
                    continue;
                const renamedMetadataColumns = metadata.columns.filter(column => {
                    return !table.columns.find(tableColumn => {
                        return tableColumn.name === column.databaseName
                            && tableColumn.type === this.connection.driver.normalizeType(column)
                            && tableColumn.isNullable === column.isNullable
                            && tableColumn.isUnique === this.connection.driver.normalizeIsUnique(column);
                    });
                });
                if (renamedMetadataColumns.length === 0 || renamedMetadataColumns.length > 1)
                    continue;
                const renamedTableColumns = table.columns.filter(tableColumn => {
                    return !metadata.columns.find(column => {
                        return column.databaseName === tableColumn.name
                            && this.connection.driver.normalizeType(column) === tableColumn.type
                            && column.isNullable === tableColumn.isNullable
                            && this.connection.driver.normalizeIsUnique(column) === tableColumn.isUnique;
                    });
                });
                if (renamedTableColumns.length === 0 || renamedTableColumns.length > 1)
                    continue;
                const renamedColumn = renamedTableColumns[0].clone();
                renamedColumn.name = renamedMetadataColumns[0].databaseName;
                this.connection.logger.logSchemaBuild(`renaming column "${renamedTableColumns[0].name}" in to "${renamedColumn.name}"`);
                yield this.queryRunner.renameColumn(table, renamedTableColumns[0], renamedColumn);
            }
        });
    }
    dropOldIndices() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const metadata of this.entityToSyncMetadatas) {
                const table = this.queryRunner.loadedTables.find(table => table.name === metadata.tablePath);
                if (!table)
                    continue;
                const dropQueries = table.indices
                    .filter(tableIndex => {
                    const indexMetadata = metadata.indices.find(index => index.name === tableIndex.name);
                    if (indexMetadata) {
                        if (indexMetadata.synchronize === false)
                            return false;
                        if (indexMetadata.isUnique !== tableIndex.isUnique)
                            return true;
                        if (indexMetadata.isSpatial !== tableIndex.isSpatial)
                            return true;
                        if (this.connection.driver.isFullTextColumnTypeSupported() && indexMetadata.isFulltext !== tableIndex.isFulltext)
                            return true;
                        if (indexMetadata.columns.length !== tableIndex.columnNames.length)
                            return true;
                        return !indexMetadata.columns.every(column => tableIndex.columnNames.indexOf(column.databaseName) !== -1);
                    }
                    return true;
                })
                    .map((tableIndex) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    this.connection.logger.logSchemaBuild(`dropping an index: "${tableIndex.name}" from table ${table.name}`);
                    yield this.queryRunner.dropIndex(table, tableIndex);
                }));
                yield Promise.all(dropQueries);
            }
        });
    }
    dropOldChecks() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // Mysql does not support check constraints
            if (this.connection.driver instanceof MysqlDriver_1.MysqlDriver || this.connection.driver instanceof AuroraDataApiDriver_1.AuroraDataApiDriver)
                return;
            for (const metadata of this.entityToSyncMetadatas) {
                const table = this.queryRunner.loadedTables.find(table => table.name === metadata.tablePath);
                if (!table)
                    continue;
                const oldChecks = table.checks.filter(tableCheck => {
                    return !metadata.checks.find(checkMetadata => checkMetadata.name === tableCheck.name);
                });
                if (oldChecks.length === 0)
                    continue;
                this.connection.logger.logSchemaBuild(`dropping old check constraint: ${oldChecks.map(check => `"${check.name}"`).join(", ")} from table "${table.name}"`);
                yield this.queryRunner.dropCheckConstraints(table, oldChecks);
            }
        });
    }
    dropCompositeUniqueConstraints() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const metadata of this.entityToSyncMetadatas) {
                const table = this.queryRunner.loadedTables.find(table => table.name === metadata.tablePath);
                if (!table)
                    continue;
                const compositeUniques = table.uniques.filter(tableUnique => {
                    return tableUnique.columnNames.length > 1 && !metadata.uniques.find(uniqueMetadata => uniqueMetadata.name === tableUnique.name);
                });
                if (compositeUniques.length === 0)
                    continue;
                this.connection.logger.logSchemaBuild(`dropping old unique constraint: ${compositeUniques.map(unique => `"${unique.name}"`).join(", ")} from table "${table.name}"`);
                yield this.queryRunner.dropUniqueConstraints(table, compositeUniques);
            }
        });
    }
    dropOldExclusions() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // Only PostgreSQL supports exclusion constraints
            if (!(this.connection.driver instanceof PostgresDriver_1.PostgresDriver))
                return;
            for (const metadata of this.entityToSyncMetadatas) {
                const table = this.queryRunner.loadedTables.find(table => table.name === metadata.tablePath);
                if (!table)
                    continue;
                const oldExclusions = table.exclusions.filter(tableExclusion => {
                    return !metadata.exclusions.find(exclusionMetadata => exclusionMetadata.name === tableExclusion.name);
                });
                if (oldExclusions.length === 0)
                    continue;
                this.connection.logger.logSchemaBuild(`dropping old exclusion constraint: ${oldExclusions.map(exclusion => `"${exclusion.name}"`).join(", ")} from table "${table.name}"`);
                yield this.queryRunner.dropExclusionConstraints(table, oldExclusions);
            }
        });
    }
    /**
     * Creates tables that do not exist in the database yet.
     * New tables are created without foreign and primary keys.
     * Primary key only can be created in conclusion with auto generated column.
     */
    createNewTables() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const metadata of this.entityToSyncMetadatas) {
                // check if table does not exist yet
                const existTable = this.queryRunner.loadedTables.find(table => {
                    const database = metadata.database && metadata.database !== this.connection.driver.database ? metadata.database : undefined;
                    const schema = metadata.schema || this.connection.driver.options.schema;
                    const fullTableName = this.connection.driver.buildTableName(metadata.tableName, schema, database);
                    return table.name === fullTableName;
                });
                if (existTable)
                    continue;
                this.connection.logger.logSchemaBuild(`creating a new table: ${metadata.tablePath}`);
                // create a new table and sync it in the database
                const table = Table_1.Table.create(metadata, this.connection.driver);
                yield this.queryRunner.createTable(table, false, false);
                this.queryRunner.loadedTables.push(table);
            }
        });
    }
    createViews() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const metadata of this.viewEntityToSyncMetadatas) {
                // check if view does not exist yet
                const existView = this.queryRunner.loadedViews.find(view => {
                    const database = metadata.database && metadata.database !== this.connection.driver.database ? metadata.database : undefined;
                    const schema = metadata.schema || this.connection.driver.options.schema;
                    const fullViewName = this.connection.driver.buildTableName(metadata.tableName, schema, database);
                    const viewExpression = typeof view.expression === "string" ? view.expression.trim() : view.expression(this.connection).getQuery();
                    const metadataExpression = typeof metadata.expression === "string" ? metadata.expression.trim() : metadata.expression(this.connection).getQuery();
                    return view.name === fullViewName && viewExpression === metadataExpression;
                });
                if (existView)
                    continue;
                this.connection.logger.logSchemaBuild(`creating a new view: ${metadata.tablePath}`);
                // create a new view and sync it in the database
                const view = View_1.View.create(metadata, this.connection.driver);
                yield this.queryRunner.createView(view);
                this.queryRunner.loadedViews.push(view);
            }
        });
    }
    dropOldViews() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const view of this.queryRunner.loadedViews) {
                const existViewMetadata = this.viewEntityToSyncMetadatas.find(metadata => {
                    const database = metadata.database && metadata.database !== this.connection.driver.database ? metadata.database : undefined;
                    const schema = metadata.schema || this.connection.driver.options.schema;
                    const fullViewName = this.connection.driver.buildTableName(metadata.tableName, schema, database);
                    const viewExpression = typeof view.expression === "string" ? view.expression.trim() : view.expression(this.connection).getQuery();
                    const metadataExpression = typeof metadata.expression === "string" ? metadata.expression.trim() : metadata.expression(this.connection).getQuery();
                    return view.name === fullViewName && viewExpression === metadataExpression;
                });
                if (existViewMetadata)
                    continue;
                this.connection.logger.logSchemaBuild(`dropping an old view: ${view.name}`);
                // drop an old view
                yield this.queryRunner.dropView(view);
                this.queryRunner.loadedViews.splice(this.queryRunner.loadedViews.indexOf(view), 1);
            }
        });
    }
    /**
     * Drops all columns that exist in the table, but does not exist in the metadata (left old).
     * We drop their keys too, since it should be safe.
     */
    dropRemovedColumns() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const metadata of this.entityToSyncMetadatas) {
                const table = this.queryRunner.loadedTables.find(table => table.name === metadata.tablePath);
                if (!table)
                    continue;
                // find columns that exist in the database but does not exist in the metadata
                const droppedTableColumns = table.columns.filter(tableColumn => {
                    return !metadata.columns.find(columnMetadata => columnMetadata.databaseName === tableColumn.name);
                });
                if (droppedTableColumns.length === 0)
                    continue;
                this.connection.logger.logSchemaBuild(`columns dropped in ${table.name}: ` + droppedTableColumns.map(column => column.name).join(", "));
                // drop columns from the database
                yield this.queryRunner.dropColumns(table, droppedTableColumns);
            }
        });
    }
    /**
     * Adds columns from metadata which does not exist in the table.
     * Columns are created without keys.
     */
    addNewColumns() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const metadata of this.entityToSyncMetadatas) {
                const table = this.queryRunner.loadedTables.find(table => table.name === metadata.tablePath);
                if (!table)
                    continue;
                // find which columns are new
                const newColumnMetadatas = metadata.columns.filter(columnMetadata => {
                    return !table.columns.find(tableColumn => tableColumn.name === columnMetadata.databaseName);
                });
                if (newColumnMetadatas.length === 0)
                    continue;
                // create columns in the database
                const newTableColumnOptions = this.metadataColumnsToTableColumnOptions(newColumnMetadatas);
                const newTableColumns = newTableColumnOptions.map(option => new TableColumn_1.TableColumn(option));
                if (newTableColumns.length === 0)
                    continue;
                this.connection.logger.logSchemaBuild(`new columns added: ` + newColumnMetadatas.map(column => column.databaseName).join(", "));
                yield this.queryRunner.addColumns(table, newTableColumns);
            }
        });
    }
    /**
     * Updates composite primary keys.
     */
    updatePrimaryKeys() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const metadata of this.entityToSyncMetadatas) {
                const table = this.queryRunner.loadedTables.find(table => table.name === metadata.tablePath);
                if (!table)
                    continue;
                const primaryMetadataColumns = metadata.columns.filter(column => column.isPrimary);
                const primaryTableColumns = table.columns.filter(column => column.isPrimary);
                if (primaryTableColumns.length !== primaryMetadataColumns.length && primaryMetadataColumns.length > 1) {
                    const changedPrimaryColumns = primaryMetadataColumns.map(primaryMetadataColumn => {
                        return new TableColumn_1.TableColumn(TableUtils_1.TableUtils.createTableColumnOptions(primaryMetadataColumn, this.connection.driver));
                    });
                    yield this.queryRunner.updatePrimaryKeys(table, changedPrimaryColumns);
                }
            }
        });
    }
    /**
     * Update all exist columns which metadata has changed.
     * Still don't create keys. Also we don't touch foreign keys of the changed columns.
     */
    updateExistColumns() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const metadata of this.entityToSyncMetadatas) {
                const table = this.queryRunner.loadedTables.find(table => table.name === metadata.tablePath);
                if (!table)
                    continue;
                const changedColumns = this.connection.driver.findChangedColumns(table.columns, metadata.columns);
                if (changedColumns.length === 0)
                    continue;
                // drop all foreign keys that point to this column
                for (const changedColumn of changedColumns) {
                    yield this.dropColumnReferencedForeignKeys(metadata.tablePath, changedColumn.databaseName);
                }
                // drop all composite indices related to this column
                for (const changedColumn of changedColumns) {
                    yield this.dropColumnCompositeIndices(metadata.tablePath, changedColumn.databaseName);
                }
                // drop all composite uniques related to this column
                // Mysql does not support unique constraints.
                if (!(this.connection.driver instanceof MysqlDriver_1.MysqlDriver || this.connection.driver instanceof AuroraDataApiDriver_1.AuroraDataApiDriver)) {
                    for (const changedColumn of changedColumns) {
                        yield this.dropColumnCompositeUniques(metadata.tablePath, changedColumn.databaseName);
                    }
                }
                // generate a map of new/old columns
                const newAndOldTableColumns = changedColumns.map(changedColumn => {
                    const oldTableColumn = table.columns.find(column => column.name === changedColumn.databaseName);
                    const newTableColumnOptions = TableUtils_1.TableUtils.createTableColumnOptions(changedColumn, this.connection.driver);
                    const newTableColumn = new TableColumn_1.TableColumn(newTableColumnOptions);
                    return {
                        oldColumn: oldTableColumn,
                        newColumn: newTableColumn
                    };
                });
                if (newAndOldTableColumns.length === 0)
                    continue;
                this.connection.logger.logSchemaBuild(`columns changed in "${table.name}". updating: ` + changedColumns.map(column => column.databaseName).join(", "));
                yield this.queryRunner.changeColumns(table, newAndOldTableColumns);
            }
        });
    }
    /**
     * Creates composite indices which are missing in db yet.
     */
    createNewIndices() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const metadata of this.entityToSyncMetadatas) {
                const table = this.queryRunner.loadedTables.find(table => table.name === metadata.tablePath);
                if (!table)
                    continue;
                const newIndices = metadata.indices
                    .filter(indexMetadata => !table.indices.find(tableIndex => tableIndex.name === indexMetadata.name) && indexMetadata.synchronize === true)
                    .map(indexMetadata => TableIndex_1.TableIndex.create(indexMetadata));
                if (newIndices.length === 0)
                    continue;
                this.connection.logger.logSchemaBuild(`adding new indices ${newIndices.map(index => `"${index.name}"`).join(", ")} in table "${table.name}"`);
                yield this.queryRunner.createIndices(table, newIndices);
            }
        });
    }
    createNewChecks() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // Mysql does not support check constraints
            if (this.connection.driver instanceof MysqlDriver_1.MysqlDriver || this.connection.driver instanceof AuroraDataApiDriver_1.AuroraDataApiDriver)
                return;
            for (const metadata of this.entityToSyncMetadatas) {
                const table = this.queryRunner.loadedTables.find(table => table.name === metadata.tablePath);
                if (!table)
                    continue;
                const newChecks = metadata.checks
                    .filter(checkMetadata => !table.checks.find(tableCheck => tableCheck.name === checkMetadata.name))
                    .map(checkMetadata => TableCheck_1.TableCheck.create(checkMetadata));
                if (newChecks.length === 0)
                    continue;
                this.connection.logger.logSchemaBuild(`adding new check constraints: ${newChecks.map(index => `"${index.name}"`).join(", ")} in table "${table.name}"`);
                yield this.queryRunner.createCheckConstraints(table, newChecks);
            }
        });
    }
    /**
     * Creates composite uniques which are missing in db yet.
     */
    createCompositeUniqueConstraints() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const metadata of this.entityToSyncMetadatas) {
                const table = this.queryRunner.loadedTables.find(table => table.name === metadata.tablePath);
                if (!table)
                    continue;
                const compositeUniques = metadata.uniques
                    .filter(uniqueMetadata => uniqueMetadata.columns.length > 1 && !table.uniques.find(tableUnique => tableUnique.name === uniqueMetadata.name))
                    .map(uniqueMetadata => TableUnique_1.TableUnique.create(uniqueMetadata));
                if (compositeUniques.length === 0)
                    continue;
                this.connection.logger.logSchemaBuild(`adding new unique constraints: ${compositeUniques.map(unique => `"${unique.name}"`).join(", ")} in table "${table.name}"`);
                yield this.queryRunner.createUniqueConstraints(table, compositeUniques);
            }
        });
    }
    /**
     * Creates exclusions which are missing in db yet.
     */
    createNewExclusions() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // Only PostgreSQL supports exclusion constraints
            if (!(this.connection.driver instanceof PostgresDriver_1.PostgresDriver))
                return;
            for (const metadata of this.entityToSyncMetadatas) {
                const table = this.queryRunner.loadedTables.find(table => table.name === metadata.tablePath);
                if (!table)
                    continue;
                const newExclusions = metadata.exclusions
                    .filter(exclusionMetadata => !table.exclusions.find(tableExclusion => tableExclusion.name === exclusionMetadata.name))
                    .map(exclusionMetadata => TableExclusion_1.TableExclusion.create(exclusionMetadata));
                if (newExclusions.length === 0)
                    continue;
                this.connection.logger.logSchemaBuild(`adding new exclusion constraints: ${newExclusions.map(exclusion => `"${exclusion.name}"`).join(", ")} in table "${table.name}"`);
                yield this.queryRunner.createExclusionConstraints(table, newExclusions);
            }
        });
    }
    /**
     * Creates foreign keys which does not exist in the table yet.
     */
    createForeignKeys() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            for (const metadata of this.entityToSyncMetadatas) {
                const table = this.queryRunner.loadedTables.find(table => table.name === metadata.tablePath);
                if (!table)
                    continue;
                const newKeys = metadata.foreignKeys
                    .filter(foreignKey => {
                    return !table.foreignKeys.find(dbForeignKey => foreignKeysMatch(dbForeignKey, foreignKey));
                });
                if (newKeys.length === 0)
                    continue;
                const dbForeignKeys = newKeys.map(foreignKeyMetadata => TableForeignKey_1.TableForeignKey.create(foreignKeyMetadata));
                this.connection.logger.logSchemaBuild(`creating a foreign keys: ${newKeys.map(key => key.name).join(", ")} on table "${table.name}"`);
                yield this.queryRunner.createForeignKeys(table, dbForeignKeys);
            }
        });
    }
    /**
     * Drops all foreign keys where given column of the given table is being used.
     */
    dropColumnReferencedForeignKeys(tablePath, columnName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = this.queryRunner.loadedTables.find(table => table.name === tablePath);
            if (!table)
                return;
            const tablesWithFK = [];
            const columnForeignKey = table.foreignKeys.find(foreignKey => foreignKey.columnNames.indexOf(columnName) !== -1);
            if (columnForeignKey) {
                const clonedTable = table.clone();
                clonedTable.foreignKeys = [columnForeignKey];
                tablesWithFK.push(clonedTable);
                table.removeForeignKey(columnForeignKey);
            }
            this.queryRunner.loadedTables.forEach(loadedTable => {
                const dependForeignKeys = loadedTable.foreignKeys.filter(foreignKey => {
                    return foreignKey.referencedTableName === tablePath && foreignKey.referencedColumnNames.indexOf(columnName) !== -1;
                });
                if (dependForeignKeys.length > 0) {
                    const clonedTable = loadedTable.clone();
                    clonedTable.foreignKeys = dependForeignKeys;
                    tablesWithFK.push(clonedTable);
                    dependForeignKeys.forEach(dependForeignKey => loadedTable.removeForeignKey(dependForeignKey));
                }
            });
            if (tablesWithFK.length > 0) {
                for (const tableWithFK of tablesWithFK) {
                    this.connection.logger.logSchemaBuild(`dropping related foreign keys of ${tableWithFK.name}: ${tableWithFK.foreignKeys.map(foreignKey => foreignKey.name).join(", ")}`);
                    yield this.queryRunner.dropForeignKeys(tableWithFK, tableWithFK.foreignKeys);
                }
            }
        });
    }
    /**
     * Drops all composite indices, related to given column.
     */
    dropColumnCompositeIndices(tablePath, columnName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = this.queryRunner.loadedTables.find(table => table.name === tablePath);
            if (!table)
                return;
            const relatedIndices = table.indices.filter(index => index.columnNames.length > 1 && index.columnNames.indexOf(columnName) !== -1);
            if (relatedIndices.length === 0)
                return;
            this.connection.logger.logSchemaBuild(`dropping related indices of "${tablePath}"."${columnName}": ${relatedIndices.map(index => index.name).join(", ")}`);
            yield this.queryRunner.dropIndices(table, relatedIndices);
        });
    }
    /**
     * Drops all composite uniques, related to given column.
     */
    dropColumnCompositeUniques(tablePath, columnName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const table = this.queryRunner.loadedTables.find(table => table.name === tablePath);
            if (!table)
                return;
            const relatedUniques = table.uniques.filter(unique => unique.columnNames.length > 1 && unique.columnNames.indexOf(columnName) !== -1);
            if (relatedUniques.length === 0)
                return;
            this.connection.logger.logSchemaBuild(`dropping related unique constraints of "${tablePath}"."${columnName}": ${relatedUniques.map(unique => unique.name).join(", ")}`);
            yield this.queryRunner.dropUniqueConstraints(table, relatedUniques);
        });
    }
    /**
     * Creates new columns from the given column metadatas.
     */
    metadataColumnsToTableColumnOptions(columns) {
        return columns.map(columnMetadata => TableUtils_1.TableUtils.createTableColumnOptions(columnMetadata, this.connection.driver));
    }
    /**
     * Creates typeorm service table for storing user defined Views.
     */
    createTypeormMetadataTable() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const options = this.connection.driver.options;
            const typeormMetadataTable = this.connection.driver.buildTableName("typeorm_metadata", options.schema, options.database);
            yield this.queryRunner.createTable(new Table_1.Table({
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
            }), true);
        });
    }
}
exports.RdbmsSchemaBuilder = RdbmsSchemaBuilder;
function foreignKeysMatch(tableForeignKey, metadataForeignKey) {
    return (tableForeignKey.name === metadataForeignKey.name)
        && (tableForeignKey.referencedTableName === metadataForeignKey.referencedTablePath);
}
//# sourceMappingURL=RdbmsSchemaBuilder.js.map