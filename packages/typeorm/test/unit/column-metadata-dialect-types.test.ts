import { expect } from "chai"
import { DataSource } from "../../src/data-source/DataSource"
import type { SapDriver } from "../../src/driver/sap/SapDriver"
import { ColumnMetadata } from "../../src/metadata/ColumnMetadata"
import { EntityMetadata } from "../../src/metadata/EntityMetadata"
import { TableColumn } from "../../src/schema-builder/table/TableColumn"
import { TableUtils } from "../../src/schema-builder/util/TableUtils"

describe("ColumnMetadata > SAP dialect types", () => {
    // Supplying a client avoids loading the native SAP dependency. These tests
    // use the real driver without initializing a database connection.
    const dataSource = new DataSource({ type: "sap", driver: {} })
    const driver = dataSource.driver as SapDriver

    function createColumn(override: string): ColumnMetadata {
        const entityMetadata = new EntityMetadata({
            dataSource,
            args: { target: "SapTimestamp", type: "regular" },
        })
        const column = new ColumnMetadata({
            entityMetadata,
            args: {
                target: "SapTimestamp",
                propertyName: "createdAt",
                mode: "regular",
                options: {
                    type: Date,
                    dialectTypes: { sap: override },
                },
            },
        })
        column.databaseName = "createdAt"
        entityMetadata.columns = [column]
        return column
    }

    it("should render a plain timestamp override without type parameters", () => {
        const column = createColumn("timestamp")
        const physical = column.resolveDriverColumn(driver)
        const tableColumn = new TableColumn(
            TableUtils.createTableColumnOptions(column, driver),
        )

        expect(physical.type).to.equal("timestamp")
        expect(physical.precision).to.equal(undefined)
        expect(physical.scale).to.equal(undefined)
        expect(driver.createFullType(tableColumn)).to.equal("timestamp")
        expect(column.type).to.equal(Date)
    })

    // SAP HANA's column type grammar has TIMESTAMP without parameters;
    // CURRENT_TIMESTAMP(precision) is a function, not a column type.
    for (const override of ["timestamp(3)", "timestamp(3,2)"]) {
        it(`should reject unsupported SAP ${override} parameters`, () => {
            const column = createColumn(override)

            expect(() => column.resolveDriverColumn(driver)).to.throw(
                'has unsupported dialectTypes parameters for "sap"',
            )
            expect(column.type).to.equal(Date)
        })
    }
})
