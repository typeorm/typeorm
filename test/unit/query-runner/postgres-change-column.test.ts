import "reflect-metadata"
import { expect } from "chai"
import type { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import { PostgresQueryRunner } from "../../../src/driver/postgres/PostgresQueryRunner"
import { Table } from "../../../src/schema-builder/table/Table"
import { TableColumn } from "../../../src/schema-builder/table/TableColumn"

describe("PostgresQueryRunner changeColumn", () => {
    type MinimalPostgresDriver = Pick<
        PostgresDriver,
        | "database"
        | "searchSchema"
        | "options"
        | "parseTableName"
        | "createFullType"
        | "buildTableName"
        | "dataSource"
    >

    function createQueryRunner() {
        const driver = {
            database: "test",
            searchSchema: "public",
            options: { type: "postgres" },
            dataSource: undefined as unknown as PostgresDriver["dataSource"],
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
        } satisfies MinimalPostgresDriver

        driver.dataSource = {
            driver,
            namingStrategy: {
                primaryKeyName: () => "PK_test",
                uniqueConstraintName: () => "UQ_test",
                indexName: () => "IDX_test",
                foreignKeyName: () => "FK_test",
            },
        } as unknown as PostgresDriver["dataSource"]

        const queryRunner = new PostgresQueryRunner(
            driver as PostgresDriver,
            "master",
        )
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

    it("preserves varchar length when changing length and collation together", async () => {
        const queryRunner = createQueryRunner()
        const oldColumn = new TableColumn({
            name: "example",
            type: "character varying",
            length: "50",
            collation: "en_US",
            isNullable: true,
        })
        const newColumn = oldColumn.clone()
        newColumn.length = "51"
        newColumn.collation = "C"
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
            'ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(51) COLLATE "C"',
        ])
    })

    it("uses default collation when removing varchar collation", async () => {
        const queryRunner = createQueryRunner()
        const oldColumn = new TableColumn({
            name: "example",
            type: "character varying",
            length: "50",
            collation: "en_US",
            isNullable: true,
        })
        const newColumn = oldColumn.clone()
        newColumn.collation = undefined
        const table = new Table({
            name: "bug",
            columns: [oldColumn],
        })

        await queryRunner.changeColumn(table, oldColumn, newColumn)

        const upQueries = queryRunner
            .getMemorySql()
            .upQueries.map((query) => query.query)

        expect(upQueries).to.deep.equal([
            'ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(50) COLLATE pg_catalog."default"',
        ])
    })
})
