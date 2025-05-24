import { Table } from "./table/Table"
import { TableColumn } from "./table/TableColumn"
import { TableForeignKey } from "./table/TableForeignKey"
import { TableIndex } from "./table/TableIndex"
import { QueryRunner } from "../query-runner/QueryRunner"
import { ColumnMetadata } from "../metadata/ColumnMetadata"
import { EntityMetadata } from "../metadata/EntityMetadata"
import { DataSource } from "../data-source/DataSource"
import { SchemaBuilder } from "./SchemaBuilder"
import { SqlInMemory } from "../driver/SqlInMemory"
import { TableUtils } from "./util/TableUtils"
import { TableColumnOptions } from "./options/TableColumnOptions"
import { TableUnique } from "./table/TableUnique"
import { TableCheck } from "./table/TableCheck"
import { TableExclusion } from "./table/TableExclusion"
import { View } from "./view/View"
import { ViewUtils } from "./util/ViewUtils"
import { DriverUtils } from "../driver/DriverUtils"
import { PostgresQueryRunner } from "../driver/postgres/PostgresQueryRunner"

export class RdbmsSchemaBuilder implements SchemaBuilder {
    readonly "@instanceof" = Symbol.for("RdbmsSchemaBuilder")
    protected queryRunner: QueryRunner
    private currentDatabase?: string
    private currentSchema?: string

    constructor(protected connection: DataSource) {}

    async build(): Promise<void> { /* unchanged */ }
    async createMetadataTableIfNecessary(queryRunner: QueryRunner): Promise<void> { /* unchanged */ }
    async log(): Promise<SqlInMemory> { /* unchanged */ }

    protected get entityToSyncMetadatas(): EntityMetadata[] { /* unchanged */ }
    protected get viewEntityToSyncMetadatas(): EntityMetadata[] { /* unchanged */ }
    protected hasGeneratedColumns(): boolean { /* unchanged */ }
    protected async executeSchemaSyncOperationsInProperOrder(): Promise<void> { /* unchanged */ }
    private getTablePath(target: any): string { /* unchanged */ }
    protected async dropOldForeignKeys(): Promise<void> { /* unchanged */ }
    protected async renameTables(): Promise<void> { /* unchanged */ }
    protected async renameColumns(): Promise<void> { /* unchanged */ }
    protected async dropOldIndices(): Promise<void> { /* unchanged */ }
    protected async dropOldChecks(): Promise<void> { /* unchanged */ }
    protected async dropCompositeUniqueConstraints(): Promise<void> { /* unchanged */ }
    protected async dropOldExclusions(): Promise<void> { /* unchanged */ }
    protected async changeTableComment(): Promise<void> { /* unchanged */ }
    protected async createNewTables(): Promise<void> { /* unchanged */ }
    protected async createViews(): Promise<void> { /* unchanged */ }
    protected async dropOldViews(): Promise<void> { /* unchanged */ }
    protected async dropRemovedColumns(): Promise<void> { /* unchanged */ }
    protected async addNewColumns(): Promise<void> { /* unchanged */ }
    protected async updatePrimaryKeys(): Promise<void> { /* unchanged */ }

    /**
     * Updated to use ALTER TABLE for metadata-only changes instead of DROP+ADD
     */
    protected async updateExistColumns(): Promise<void> {
        for (const metadata of this.entityToSyncMetadatas) {
            const table = this.queryRunner.loadedTables.find(
                table => this.getTablePath(table) === this.getTablePath(metadata)
            )
            if (!table) continue

            const changedColumns = this.connection.driver.findChangedColumns(
                table.columns,
                metadata.columns
            )
            if (changedColumns.length === 0) continue

            const newAndOld = changedColumns.map(changed => {
                const oldTableColumn = table.columns.find(col => col.name === changed.databaseName)!
                const newTableColumn = new TableColumn(
                    TableUtils.createTableColumnOptions(changed, this.connection.driver)
                )
                return { oldColumn: oldTableColumn, newColumn: newTableColumn }
            })

            for (const { oldColumn, newColumn } of newAndOld) {
                const onlyMetadataChanged =
                    oldColumn.type === newColumn.type &&
                    oldColumn.isNullable === newColumn.isNullable &&
                    oldColumn.isUnique === newColumn.isUnique
                if (onlyMetadataChanged) {
                    const tableName = this.getTablePath(metadata)
                    const columnName = oldColumn.name
                    const definition = this.connection.driver
                        .createFullType(newColumn)
                    this.connection.logger.logSchemaBuild(
                        `altering column ${columnName} in ${tableName}`
                    )
                    await this.queryRunner.query(
                        `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE ${definition}`
                    )
                } else {
                    // fallback to drop+add
                    this.connection.logger.logSchemaBuild(
                        `recreating column ${oldColumn.name} in ${table.name}`
                    )
                    await this.queryRunner.changeColumns(table, [ { oldColumn, newColumn } ])
                }
            }
        }
    }

    protected async createNewIndices(): Promise<void> { /* unchanged */ }
    protected async createNewViewIndices(): Promise<void> { /* unchanged */ }
    protected async createNewChecks(): Promise<void> { /* unchanged */ }
    protected async createCompositeUniqueConstraints(): Promise<void> { /* unchanged */ }
    protected async createNewExclusions(): Promise<void> { /* unchanged */ }
    protected async createForeignKeys(): Promise<void> { /* unchanged */ }
    protected async dropColumnReferencedForeignKeys(tablePath: string, columnName: string): Promise<void> { /* unchanged */ }
    protected async dropColumnCompositeIndices(tablePath: string, columnName: string): Promise<void> { /* unchanged */ }
    protected async dropColumnCompositeUniques(tablePath: string, columnName: string): Promise<void> { /* unchanged */ }
    protected metadataColumnsToTableColumnOptions(columns: ColumnMetadata[]): TableColumnOptions[] { /* unchanged */ }
    protected async createTypeormMetadataTable(queryRunner: QueryRunner) { /* unchanged */ }
}
