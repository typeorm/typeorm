import "reflect-metadata"
import { expect } from "chai"
import { PostgresQueryRunner } from "../../../src/driver/postgres/PostgresQueryRunner"
import { Table } from "../../../src/schema-builder/table/Table"
import { TableColumn } from "../../../src/schema-builder/table/TableColumn"

describe("github issues > #3357 Postgres varchar length changes", () => {
    it("alters the column type instead of recreating the column", async () => {
        const queryRunner = createPostgresQueryRunner()

        const oldColumn = new TableColumn({
            name: "example",
            type: "character varying",
            length: "50",
        })
        const newColumn = new TableColumn({
            name: "example",
            type: "character varying",
            length: "51",
        })
        const table = new Table({
            name: "bug",
            columns: [oldColumn],
        })

        queryRunner.enableSqlMemory()
        await queryRunner.changeColumn(table, oldColumn, newColumn)

        const sqlInMemory = queryRunner.getMemorySql()
        const upQueries = sqlInMemory.upQueries.map(({ query }) => query)
        const downQueries = sqlInMemory.downQueries.map(({ query }) => query)

        expect(upQueries).to.deep.equal([
            'ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(51)',
        ])
        expect(downQueries).to.deep.equal([
            'ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(50)',
        ])
    })

    it("preserves column length when collation changes with the type", async () => {
        const queryRunner = createPostgresQueryRunner()

        const oldColumn = new TableColumn({
            name: "example",
            type: "character varying",
            length: "50",
        })
        const newColumn = new TableColumn({
            name: "example",
            type: "character varying",
            length: "51",
            collation: "en_US",
        })
        const table = new Table({
            name: "bug",
            columns: [oldColumn],
        })

        queryRunner.enableSqlMemory()
        await queryRunner.changeColumn(table, oldColumn, newColumn)

        const sqlInMemory = queryRunner.getMemorySql()
        const upQueries = sqlInMemory.upQueries.map(({ query }) => query)
        const downQueries = sqlInMemory.downQueries.map(({ query }) => query)

        expect(upQueries).to.deep.equal([
            'ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(51)',
            'ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(51) COLLATE "en_US"',
        ])
        expect(downQueries).to.deep.equal([
            'ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(50)',
            'ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(50) COLLATE pg_catalog."default"',
        ])
    })
})

function createPostgresQueryRunner() {
    const driver: any = {
        searchSchema: "public",
        parseTableName(target: Table | string) {
            if (typeof target === "string") {
                return {
                    tableName: target,
                    schema: undefined,
                    database: undefined,
                }
            }

            return {
                tableName: target.name,
                schema: target.schema,
                database: target.database,
            }
        },
        buildTableName(tableName: string, schema?: string): string {
            return schema ? `${schema}.${tableName}` : tableName
        },
        createFullType(column: TableColumn): string {
            return column.length
                ? `${column.type}(${column.length})`
                : `${column.type}`
        },
    }

    driver.dataSource = {
        driver,
    }

    return new PostgresQueryRunner(driver, "master")
}
