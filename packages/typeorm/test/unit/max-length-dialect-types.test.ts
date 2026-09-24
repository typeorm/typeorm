import "reflect-metadata"
import { rejects } from "node:assert"
import { expect } from "chai"
import { DataSource } from "../../src/data-source/DataSource"
import { EntitySchema } from "../../src/entity-schema/EntitySchema"
import type { ColumnType } from "../../src/driver/types/ColumnTypes"
import { TableColumn } from "../../src/schema-builder/table/TableColumn"
import { TableUtils } from "../../src/schema-builder/util/TableUtils"

class MetadataOnlyDataSource extends DataSource {
    prepareMetadata(): Promise<void> {
        return this.buildMetadatas()
    }
}

describe("ColumnMetadata > MAX length dialect types", () => {
    type DriverType = "spanner" | "mssql" | "postgres"

    function createDataSource(
        type: DriverType,
        override: string,
        length: string | number = 16,
        logicalType: ColumnType = "varchar",
    ) {
        const entity = new EntitySchema({
            name: "MaxLengthValue",
            columns: {
                id: { type: Number, primary: true },
                payload: {
                    type: logicalType,
                    length,
                    precision: 12,
                    scale: 4,
                    dialectTypes: { [type]: override },
                },
            },
        })
        if (type === "spanner") {
            return new MetadataOnlyDataSource({
                type,
                projectId: "test-project",
                instanceId: "test-instance",
                databaseId: "test-database",
                // Spanner constructs a client during driver creation. This stub
                // leaves metadata validation and DDL on the real driver.
                driver: { Spanner: class {} },
                entities: [entity],
            })
        }
        return new MetadataOnlyDataSource({
            type,
            driver: {},
            entities: [entity],
        })
    }
    for (const [type, override, physicalType] of [
        ["spanner", "string(max)", "string"],
        ["spanner", "bytes(MAX)", "bytes"],
        ["spanner", " string( mAx ) ", "string"],
        ["mssql", "varchar(max)", "varchar"],
        ["mssql", "nvarchar(MAX)", "nvarchar"],
        ["mssql", "varbinary(mAx)", "varbinary"],
    ] as const) {
        it(`accepts ${type} ${override} without changing logical metadata`, async () => {
            const dataSource = createDataSource(type, override)
            await dataSource.prepareMetadata()
            const column = dataSource
                .getMetadata("MaxLengthValue")
                .findColumnWithPropertyName("payload")!
            const physical = column.resolveDriverColumn(dataSource.driver)
            expect(physical.type).to.equal(physicalType)
            expect(physical.length).to.equal("max")
            expect(physical.precision).to.equal(undefined)
            expect(physical.scale).to.equal(undefined)
            const tableColumn = new TableColumn(
                TableUtils.createTableColumnOptions(column, dataSource.driver),
            )
            expect(dataSource.driver.createFullType(tableColumn)).to.equal(
                `${physicalType}(max)`,
            )
            expect(column.type).to.equal("varchar")
            expect(column.length).to.equal("16")
            expect(column.precision).to.equal(12)
            expect(column.scale).to.equal(4)
            expect(column.dialectTypes?.[type]).to.equal(override)
            expect(dataSource.isInitialized).to.equal(false)
        })
    }
    for (const [override, length, fullType] of [
        ["char", "", "char"],
        ["varchar", "MAX", "varchar(MAX)"],
    ] as const) {
        it(`inherits MAX length only when ${override} supports it`, async () => {
            const dataSource = createDataSource(
                "mssql",
                override,
                "MAX",
                "nvarchar",
            )
            await dataSource.prepareMetadata()
            const column = dataSource
                .getMetadata("MaxLengthValue")
                .findColumnWithPropertyName("payload")!
            expect(
                column.resolveDriverColumn(dataSource.driver).length,
            ).to.equal(length)
            const tableColumn = new TableColumn(
                TableUtils.createTableColumnOptions(column, dataSource.driver),
            )
            expect(dataSource.driver.createFullType(tableColumn)).to.equal(
                fullType,
            )
            if (override === "char")
                expect(dataSource.driver.dataTypeDefaults.char.length).to.equal(
                    1,
                )
            expect(column.type).to.equal("nvarchar")
            expect(column.length).to.equal("MAX")
        })
    }

    for (const [type, override] of [
        ["spanner", "int64(max)"],
        ["spanner", "numeric(max)"],
        ["spanner", "string(max,2)"],
        ["spanner", "string(2,max)"],
        ["spanner", "bytes(max,max)"],
        ["mssql", "char(max)"],
        ["mssql", "nchar(max)"],
        ["mssql", "binary(max)"],
        ["mssql", "vector(max)"],
        ["mssql", "decimal(max)"],
        ["mssql", "decimal(10,max)"],
        ["mssql", "varchar(max,1)"],
        ["postgres", "varchar(max)"],
    ] as const) {
        it(`rejects ${type} ${override} during metadata validation`, async () => {
            await rejects(
                createDataSource(type, override).prepareMetadata(),
                /has (invalid|unsupported) dialectTypes parameters/,
            )
        })
    }
})
