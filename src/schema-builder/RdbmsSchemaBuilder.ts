import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {TableSchema} from "./schema/TableSchema";
import {ColumnSchema} from "./schema/ColumnSchema";
import {ForeignKeySchema} from "./schema/ForeignKeySchema";
import {IndexSchema} from "./schema/IndexSchema";
import {QueryRunner} from "../query-runner/QueryRunner";
import {PrimaryKeySchema} from "./schema/PrimaryKeySchema";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {PromiseUtils} from "../util/PromiseUtils";
import {Connection} from "../connection/Connection";
import {SchemaBuilder} from "./SchemaBuilder";

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
export class RdbmsSchemaBuilder implements SchemaBuilder {

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Used to execute schema creation queries in a single connection.
     */
    protected queryRunner: QueryRunner;

    /**
     * All synchronized tables in the database.
     */
    protected tableSchemas: TableSchema[];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates complete schemas for the given entity metadatas.
     */
    async build(): Promise<void> {
        this.queryRunner = await this.connection.createQueryRunner("master");
        await this.createNewDatabases();
        await this.queryRunner.startTransaction();
        try {
            this.tableSchemas = await this.loadTableSchemas();
            await this.executeSchemaSyncOperationsInProperOrder();

            // if cache is enabled then perform cache-synchronization as well
            if (this.connection.queryResultCache)
                await this.connection.queryResultCache.synchronize(this.queryRunner);

            await this.queryRunner.commitTransaction();

        } catch (error) {

            try { // we throw original error even if rollback thrown an error
                await this.queryRunner.rollbackTransaction();
            } catch (rollbackError) { }
            throw error;

        } finally {
            await this.queryRunner.release();
        }
    }

    /**
     * Returns sql queries to be executed by schema builder.
     */
    async log(): Promise<(string|{ up: string, down: string })[]> {
        this.queryRunner = await this.connection.createQueryRunner("master");
        try {
            await this.createNewDatabases();
            this.tableSchemas = await this.loadTableSchemas();
            this.queryRunner.enableSqlMemory();
            await this.executeSchemaSyncOperationsInProperOrder();

            // if cache is enabled then perform cache-synchronization as well
            if (this.connection.queryResultCache) // todo: check this functionality
                await this.connection.queryResultCache.synchronize(this.queryRunner);

            return this.queryRunner.getMemorySql();

        } finally {
            // its important to disable this mode despite the fact we are release query builder
            // because there exist drivers which reuse same query runner. Also its important to disable
            // sql memory after call of getMemorySql() method because last one flushes sql memory.
            this.queryRunner.disableSqlMemory();
            await this.queryRunner.release();
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Loads all table schemas from the database.
     */
    protected loadTableSchemas(): Promise<TableSchema[]> {
        const tablePaths = this.entityToSyncMetadatas.map(metadata => metadata.tablePath);
        return this.queryRunner.getTables(tablePaths);
    }

    /**
     * Returns only entities that should be synced in the database.
     */
    protected get entityToSyncMetadatas(): EntityMetadata[] {
        return this.connection.entityMetadatas.filter(metadata => !metadata.skipSync && metadata.tableType !== "single-table-child");
    }

    /**
     * Creates new databases if they are not exists.
     */
    protected async createNewDatabases(): Promise<void> {
        const databases = this.connection.entityMetadatas
            .filter(metadata => !!metadata.database)
            .map(metadata => metadata.database);
        await Promise.all(databases.map(database => this.queryRunner.createDatabase(database!)));
    }

    /**
     * Executes schema sync operations in a proper order.
     * Order of operations matter here.
     */
    protected async executeSchemaSyncOperationsInProperOrder(): Promise<void> {
        const schemaPaths: string[] = [];
        this.connection.entityMetadatas
            .filter(entityMetadata => !!entityMetadata.schemaPath)
            .forEach(entityMetadata => {
                const existSchemaPath = schemaPaths.find(path => path === entityMetadata.schemaPath);
                if (!existSchemaPath)
                    schemaPaths.push(entityMetadata.schemaPath!);
            });
        await this.queryRunner.createSchema(schemaPaths);

        await this.dropOldForeignKeys();
        // await this.dropOldPrimaryKeys(); // todo: need to drop primary column because column updates are not possible
        await this.createNewTables();
        await this.dropRemovedColumns();
        await this.addNewColumns();
        await this.updateExistColumns();
        await this.updatePrimaryKeys();
        await this.createIndices(); // we need to create indices before foreign keys because foreign keys rely on unique indices
        await this.createForeignKeys();
    }

    /**
     * Drops all (old) foreign keys that exist in the table schemas, but do not exist in the entity metadata.
     */
    protected async dropOldForeignKeys(): Promise<void> {
        await PromiseUtils.runInSequence(this.entityToSyncMetadatas, async metadata => {

            const tableSchema = this.tableSchemas.find(table => table.name === metadata.tableName);
            if (!tableSchema)
                return;

            // find foreign keys that exist in the schemas but does not exist in the entity metadata
            const foreignKeySchemasToDrop = tableSchema.foreignKeys.filter(foreignKeySchema => {
                return !metadata.foreignKeys.find(metadataForeignKey => metadataForeignKey.name === foreignKeySchema.name);
            });
            if (foreignKeySchemasToDrop.length === 0)
                return;

            this.connection.logger.logSchemaBuild(`dropping old foreign keys of ${tableSchema.name}: ${foreignKeySchemasToDrop.map(dbForeignKey => dbForeignKey.name).join(", ")}`);

            // remove foreign keys from the table schema
            tableSchema.removeForeignKeys(foreignKeySchemasToDrop);

            // drop foreign keys from the database
            await this.queryRunner.dropForeignKeys(tableSchema, foreignKeySchemasToDrop);
        });
    }

    /**
     * Creates tables that do not exist in the database yet.
     * New tables are created without foreign and primary keys.
     * Primary key only can be created in conclusion with auto generated column.
     */
    protected async createNewTables(): Promise<void> {
        await PromiseUtils.runInSequence(this.entityToSyncMetadatas, async metadata => {
            // check if table does not exist yet
            const existTableSchema = this.tableSchemas.find(table => {
                if (table.name !== metadata.tableName)
                    return false;

                if (metadata.schema && table.schema !== metadata.schema)
                    return false;

                if (metadata.database && table.database !== metadata.database)
                    return false;

                return true;
            });
            if (existTableSchema)
                return;

            this.connection.logger.logSchemaBuild(`creating a new table: ${metadata.tableName}`);

            // create a new table schema and sync it in the database
            const tableSchema = new TableSchema(metadata.tableName, this.metadataColumnsToColumnSchemas(metadata.columns), true, metadata.engine, metadata.database, metadata.schema);
            this.tableSchemas.push(tableSchema);
            await this.queryRunner.createTable(tableSchema);
        });
    }

    /**
     * Drops all columns that exist in the table, but does not exist in the metadata (left old).
     * We drop their keys too, since it should be safe.
     */
    protected dropRemovedColumns() {
        return PromiseUtils.runInSequence(this.entityToSyncMetadatas, async metadata => {
            const tableSchema = this.tableSchemas.find(table => table.name === metadata.tableName);
            if (!tableSchema) return;

            // find columns that exist in the database but does not exist in the metadata
            const droppedColumnSchemas = tableSchema.columns.filter(columnSchema => {
                return !metadata.columns.find(columnMetadata => columnMetadata.databaseName === columnSchema.name);
            });
            if (droppedColumnSchemas.length === 0)
                return;

            // drop all foreign keys that has column to be removed in its columns
            await Promise.all(droppedColumnSchemas.map(droppedColumnSchema => {
                return this.dropColumnReferencedForeignKeys(metadata.tableName, droppedColumnSchema.name);
            }));

            // drop all indices that point to this column
            await Promise.all(droppedColumnSchemas.map(droppedColumnSchema => {
                return this.dropColumnReferencedIndices(metadata.tableName, droppedColumnSchema.name);
            }));

            this.connection.logger.logSchemaBuild(`columns dropped in ${tableSchema.name}: ` + droppedColumnSchemas.map(column => column.name).join(", "));

            // remove columns from the table schema and primary keys of it if its used in the primary keys
            tableSchema.removeColumns(droppedColumnSchemas);
            tableSchema.removePrimaryKeysOfColumns(droppedColumnSchemas);

            // drop columns from the database
            await this.queryRunner.dropColumns(tableSchema, droppedColumnSchemas);
        });
    }

    /**
     * Adds columns from metadata which does not exist in the table.
     * Columns are created without keys.
     */
    protected addNewColumns() {
        return PromiseUtils.runInSequence(this.entityToSyncMetadatas, async metadata => {
            const tableSchema = this.tableSchemas.find(table => table.name === metadata.tableName);
            if (!tableSchema)
                return;

            // find which columns are new
            const newColumnMetadatas = metadata.columns.filter(columnMetadata => {
                return !tableSchema.columns.find(columnSchema => columnSchema.name === columnMetadata.databaseName);
            });
            if (newColumnMetadatas.length === 0)
                return;

            this.connection.logger.logSchemaBuild(`new columns added: ` + newColumnMetadatas.map(column => column.databaseName).join(", "));

            // create columns in the database
            const newColumnSchemas = this.metadataColumnsToColumnSchemas(newColumnMetadatas);
            await this.queryRunner.addColumns(tableSchema, newColumnSchemas);
            tableSchema.addColumns(newColumnSchemas);
        });
    }

    /**
     * Update all exist columns which metadata has changed.
     * Still don't create keys. Also we don't touch foreign keys of the changed columns.
     */
    protected updateExistColumns() {
        return PromiseUtils.runInSequence(this.entityToSyncMetadatas, async metadata => {
            const tableSchema = this.tableSchemas.find(table => table.name === metadata.tableName);
            if (!tableSchema)
                return;

            const updatedColumnSchemas = tableSchema.findChangedColumns(this.connection.driver, metadata.columns);
            if (updatedColumnSchemas.length === 0)
                return;

            this.connection.logger.logSchemaBuild(`columns changed in ${tableSchema.name}. updating: ` + updatedColumnSchemas.map(column => column.name).join(", "));

            // drop all foreign keys that point to this column
            const dropRelatedForeignKeysPromises = updatedColumnSchemas
                .filter(changedColumnSchema => !!metadata.columns.find(columnMetadata => columnMetadata.databaseName === changedColumnSchema.name))
                .map(changedColumnSchema => this.dropColumnReferencedForeignKeys(metadata.tableName, changedColumnSchema.name));

            // wait until all related foreign keys are dropped
            await Promise.all(dropRelatedForeignKeysPromises);

            // drop all indices that point to this column
            const dropRelatedIndicesPromises = updatedColumnSchemas
                .filter(changedColumnSchema => !!metadata.columns.find(columnMetadata => columnMetadata.databaseName === changedColumnSchema.name))
                .map(changedColumnSchema => this.dropColumnReferencedIndices(metadata.tableName, changedColumnSchema.name));

            // wait until all related indices are dropped
            await Promise.all(dropRelatedIndicesPromises);

            // generate a map of new/old columns
            const newAndOldColumnSchemas = updatedColumnSchemas.map(changedColumnSchema => {
                const columnMetadata = metadata.columns.find(column => column.databaseName === changedColumnSchema.name);
                const newColumnSchema = ColumnSchema.create(columnMetadata!, 
                    this.connection.driver.normalizeType(columnMetadata!), 
                    this.connection.driver.normalizeDefault(columnMetadata!),
                    this.connection.driver.getColumnLength(columnMetadata!));
                tableSchema.replaceColumn(changedColumnSchema, newColumnSchema);

                return {
                    newColumn: newColumnSchema,
                    oldColumn: changedColumnSchema
                };
            });

            return this.queryRunner.changeColumns(tableSchema, newAndOldColumnSchemas);
        });
    }

    /**
     * Creates primary keys which does not exist in the table yet.
     */
    protected updatePrimaryKeys() {
        return PromiseUtils.runInSequence(this.entityToSyncMetadatas, async metadata => {
            const tableSchema = this.tableSchemas.find(table => table.name === metadata.tableName && !table.justCreated);
            if (!tableSchema)
                return;

            const metadataPrimaryColumns = metadata.columns.filter(column => column.isPrimary && !column.isGenerated);
            const addedKeys = metadataPrimaryColumns
                .filter(primaryKey => {
                    return !tableSchema.primaryKeysWithoutGenerated.find(dbPrimaryKey => dbPrimaryKey.columnName === primaryKey.databaseName);
                })
                .map(primaryKey => new PrimaryKeySchema("", primaryKey.databaseName));

            const droppedKeys = tableSchema.primaryKeysWithoutGenerated.filter(primaryKeySchema => {
                return !metadataPrimaryColumns.find(primaryKeyMetadata => primaryKeyMetadata.databaseName === primaryKeySchema.columnName);
            });

            if (addedKeys.length === 0 && droppedKeys.length === 0)
                return;

            this.connection.logger.logSchemaBuild(`primary keys of ${tableSchema.name} has changed: dropped - ${droppedKeys.map(key => key.columnName).join(", ") || "nothing"}; added - ${addedKeys.map(key => key.columnName).join(", ") || "nothing"}`);
            tableSchema.addPrimaryKeys(addedKeys);
            tableSchema.removePrimaryKeys(droppedKeys);
            await this.queryRunner.updatePrimaryKeys(tableSchema);
        });
    }

    /**
     * Creates foreign keys which does not exist in the table yet.
     */
    protected createForeignKeys() {
        return PromiseUtils.runInSequence(this.entityToSyncMetadatas, async metadata => {
            const tableSchema = this.tableSchemas.find(table => table.name === metadata.tableName);
            if (!tableSchema)
                return;

            const newKeys = metadata.foreignKeys.filter(foreignKey => {
                return !tableSchema.foreignKeys.find(dbForeignKey => dbForeignKey.name === foreignKey.name);
            });
            if (newKeys.length === 0)
                return;

            const dbForeignKeys = newKeys.map(foreignKeyMetadata => ForeignKeySchema.create(foreignKeyMetadata));
            this.connection.logger.logSchemaBuild(`creating a foreign keys: ${newKeys.map(key => key.name).join(", ")}`);
            await this.queryRunner.createForeignKeys(tableSchema, dbForeignKeys);
            tableSchema.addForeignKeys(dbForeignKeys);
        });
    }

    /**
     * Creates indices which are missing in db yet, and drops indices which exist in the db,
     * but does not exist in the metadata anymore.
     */
    protected createIndices() {
        // return Promise.all(this.connection.entityMetadatas.map(metadata => this.createIndices(metadata.table, metadata.indices)));
        return PromiseUtils.runInSequence(this.entityToSyncMetadatas, async metadata => {
            const tableSchema = this.tableSchemas.find(table => table.name === metadata.tableName);
            if (!tableSchema)
                return;

            // drop all indices that exist in the table, but does not exist in the given composite indices
            const dropQueries = tableSchema.indices
                .filter(indexSchema => {
                    const metadataIndex = metadata.indices.find(indexMetadata => indexMetadata.name === indexSchema.name);
                    if (!metadataIndex)
                        return true;
                    if (metadataIndex.isUnique !== indexSchema.isUnique)
                        return true;
                    if (metadataIndex.columns.length !== indexSchema.columnNames.length)
                        return true;
                    if (metadataIndex.columns.findIndex((col, i) => col.databaseName !== indexSchema.columnNames[i]) !== -1)
                        return true;
                    
                    return false;
                })
                .map(async indexSchema => {
                    this.connection.logger.logSchemaBuild(`dropping an index: ${indexSchema.name}`);
                    tableSchema.removeIndex(indexSchema);
                    await this.queryRunner.dropIndex(metadata.tablePath, indexSchema.name);
                });

            await Promise.all(dropQueries);

            // then create table indices for all composite indices we have
            const addQueries = metadata.indices
                .filter(indexMetadata => !tableSchema.indices.find(indexSchema => indexSchema.name === indexMetadata.name))
                .map(async indexMetadata => {
                    const indexSchema = IndexSchema.create(indexMetadata);
                    tableSchema.indices.push(indexSchema);
                    this.connection.logger.logSchemaBuild(`adding new index: ${indexSchema.name}`);
                    await this.queryRunner.createIndex(indexSchema.tableName, indexSchema);
                });

            await Promise.all(addQueries);
        });
    }

    /**
     * Drops all indices where given column of the given table is being used.
     */
    protected async dropColumnReferencedIndices(tableName: string, columnName: string): Promise<void> {

        const tableSchema = this.tableSchemas.find(table => table.name === tableName);
        if (!tableSchema)
            return;

        // find depend indices to drop them
        const dependIndicesInTable = tableSchema.indices.filter(indexSchema => {
            return indexSchema.tableName === tableName && !!indexSchema.columnNames.find(columnDatabaseName => columnDatabaseName === columnName);
        });
        if (dependIndicesInTable.length === 0)
            return;

        this.connection.logger.logSchemaBuild(`dropping related indices of ${tableName}#${columnName}: ${dependIndicesInTable.map(index => index.name).join(", ")}`);

        const dropPromises = dependIndicesInTable.map(index => {
            tableSchema.removeIndex(index);
            return this.queryRunner.dropIndex(tableSchema, index.name);
        });

        await Promise.all(dropPromises);
    }

    /**
     * Drops all foreign keys where given column of the given table is being used.
     */
    protected async dropColumnReferencedForeignKeys(tableName: string, columnName: string): Promise<void> {

        const allForeignKeyMetadatas = this.connection.entityMetadatas.reduce(
            (all, metadata) => all.concat(metadata.foreignKeys),
            [] as ForeignKeyMetadata[]
        );

        const tableSchema = this.tableSchemas.find(table => table.name === tableName);
        if (!tableSchema)
            return;

        // find depend foreign keys to drop them
        const dependForeignKeys = allForeignKeyMetadatas.filter(foreignKey => {
            if (foreignKey.tableName === tableName) {
                return !!foreignKey.columns.find(fkColumn => {
                    return fkColumn.databaseName === columnName;
                });
            } else if (foreignKey.referencedTableName === tableName) {
                return !!foreignKey.referencedColumns.find(fkColumn => {
                    return fkColumn.databaseName === columnName;
                });
            }
            return false;
        });
        if (!dependForeignKeys.length)
            return;

        const dependForeignKeyInTable = dependForeignKeys.filter(fk => {
            return !!tableSchema.foreignKeys.find(dbForeignKey => dbForeignKey.name === fk.name);
        });
        if (dependForeignKeyInTable.length === 0)
            return;

        this.connection.logger.logSchemaBuild(`dropping related foreign keys of ${tableName}#${columnName}: ${dependForeignKeyInTable.map(foreignKey => foreignKey.name).join(", ")}`);
        const foreignKeySchemas = dependForeignKeyInTable.map(foreignKeyMetadata => ForeignKeySchema.create(foreignKeyMetadata));
        tableSchema.removeForeignKeys(foreignKeySchemas);
        await this.queryRunner.dropForeignKeys(tableSchema, foreignKeySchemas);
    }

    /**
     * Creates new column schemas from the given column metadatas.
     */
    protected metadataColumnsToColumnSchemas(columns: ColumnMetadata[]): ColumnSchema[] {
        return columns.map(columnMetadata => {
            return ColumnSchema.create(
                columnMetadata,
                this.connection.driver.normalizeType(columnMetadata),
                this.connection.driver.normalizeDefault(columnMetadata),
                this.connection.driver.getColumnLength(columnMetadata)
            );
        });
    }

}