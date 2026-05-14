import "reflect-metadata"
import { expect } from "chai"
import { PostgresQueryRunner } from "../../../src/driver/postgres/PostgresQueryRunner"
import { Table } from "../../../src/schema-builder/table/Table"
import { TableColumn } from "../../../src/schema-builder/table/TableColumn"

describe("PostgresQueryRunner changeColumn", () => {
    function createQueryRunner() {
        const driver: any = {
            database: "test",
            searchSchema: "public",
            options: { type: "postgres" },
            parseTableName(target: Table | string) {
                if (typeof target === "string") {
                    return { schema: undefined, tableName: target }
                }

                return { schema: target.schema, tableName: target.name }
            },
            createFullType(column: TableColumn) {
                return column.length
                    ? `${column.type}(${column.length})`
                    : column.type
            },
            buildTableName(
                tableName: string,
                schema?: string,
                database?: string,
            ) {
                return [database, schema, tableName].filter(Boolean).join(".")
            },
        }

        driver.dataSource = {
            driver,
            namingStrategy: {
                primaryKeyName: () => "PK_test",
                uniqueConstraintName: () => "UQ_test",
                indexName: () => "IDX_test",
                foreignKeyName: () => "FK_test",
            },
        }

        const queryRunner = new PostgresQueryRunner(driver, "master")
        queryRunner.enableSqlMemory()

        return queryRunner
    }

    it("changes varchar length without dropping and re-adding the column", async () => {
        const queryRunner = createQueryRunner()
        const oldColumn = new TableColumn({
            name: "example",
            type: "character varying",
            length: "50",
            isNullable: true,
        })
        const newColumn = oldColumn.clone()
        newColumn.length = "51"
        const table = new Table({
            name: "bug",
            columns: [oldColumn],
        })

        await queryRunner.changeColumn(table, oldColumn, newColumn)

        const upQueries = queryRunner
            .getMemorySql()
            .upQueries.map((query) => query.query)

        expect(upQueries).to.deep.equal([
            'ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(51)',
        ])
    })
})
