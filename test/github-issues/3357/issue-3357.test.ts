import { expect } from "chai"
import { PostgresQueryRunner } from "../../../src/driver/postgres/PostgresQueryRunner"
import type { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import type { Query } from "../../../src/driver/Query"
import { DefaultNamingStrategy } from "../../../src/naming-strategy/DefaultNamingStrategy"
import { Table } from "../../../src/schema-builder/table/Table"
import type { TableColumn } from "../../../src/schema-builder/table/TableColumn"

// This regression stays in test/github-issues because it verifies generated SQL
// and QueryRunner table-cache state without requiring a live Postgres database.
describe("github issues > #3357 migration generation drops columns", () => {
    it("uses ALTER COLUMN TYPE when changing postgres varchar length", async () => {
        const driver = createPostgresDriverStub()
        const queryRunner = new TestPostgresQueryRunner(driver, "master")
        const table = new Table({
            name: "bug",
            columns: [
                {
                    name: "example",
                    type: "character varying",
                    length: "50",
                },
            ],
        })
        queryRunner.seedCachedTable(table)
        const oldColumn = table.findColumnByName("example")!
        const newColumn = oldColumn.clone()
        newColumn.length = "51"

        queryRunner.enableSqlMemory()

        await queryRunner.changeColumn(table, oldColumn, newColumn)

        const upQueries = normalizeQueries(queryRunner.getMemorySql().upQueries)
        const downQueries = normalizeQueries(
            queryRunner.getMemorySql().downQueries,
        )

        expect(upQueries).to.deep.equal([
            `ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(51)`,
        ])
        expect(downQueries).to.deep.equal([
            `ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(50)`,
        ])

        const cachedColumn = queryRunner.getCachedColumn("example")
        expect(cachedColumn?.type).to.equal("character varying")
        expect(cachedColumn?.length).to.equal("51")
    })

    it("keeps varchar length when changing postgres varchar length and collation", async () => {
        const driver = createPostgresDriverStub()
        const queryRunner = new TestPostgresQueryRunner(driver, "master")
        const table = new Table({
            name: "bug",
            columns: [
                {
                    name: "example",
                    type: "character varying",
                    length: "50",
                },
            ],
        })
        queryRunner.seedCachedTable(table)
        const oldColumn = table.findColumnByName("example")!
        const newColumn = oldColumn.clone()
        newColumn.length = "51"
        newColumn.collation = "C"

        queryRunner.enableSqlMemory()

        await queryRunner.changeColumn(table, oldColumn, newColumn)

        const upQueries = normalizeQueries(queryRunner.getMemorySql().upQueries)
        const downQueries = normalizeQueries(
            queryRunner.getMemorySql().downQueries,
        )

        expect(upQueries).to.deep.equal([
            `ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(51)`,
            `ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(51) COLLATE "C"`,
        ])
        expect(downQueries).to.deep.equal([
            `ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(50)`,
            `ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(50) COLLATE pg_catalog."default"`,
        ])
    })
})

class TestPostgresQueryRunner extends PostgresQueryRunner {
    seedCachedTable(table: Table): void {
        this.loadedTables = [table]
    }

    getCachedColumn(columnName: string): TableColumn | undefined {
        return this.loadedTables[0]?.findColumnByName(columnName)
    }
}

function createPostgresDriverStub(): PostgresDriver {
    const driver = {
        connectedQueryRunners: [],
        database: undefined,
        options: { type: "postgres" },
        searchSchema: "public",
        uuidGenerator: "uuid_generate_v4()",
        buildTableName: (
            tableName: string,
            schema?: string,
            database?: string,
        ) => [database, schema, tableName].filter(Boolean).join("."),
        createFullType: (column: TableColumn) => {
            let type = column.type

            if (column.length) {
                type += `(${column.length})`
            }

            if (column.isArray) {
                type += " array"
            }

            return type
        },
        parseTableName: (target: Table | string) => {
            const name = typeof target === "string" ? target : target.name
            const parts = name.split(".")

            return {
                database: parts.length === 3 ? parts[0] : undefined,
                schema: parts.length >= 2 ? parts[parts.length - 2] : undefined,
                tableName: parts[parts.length - 1],
            }
        },
    } as unknown as PostgresDriver

    driver.dataSource = {
        driver,
        hasMetadata: () => false,
        namingStrategy: new DefaultNamingStrategy(),
    } as unknown as PostgresDriver["dataSource"]

    return driver
}

function normalizeQueries(queries: Query[]): string[] {
    return queries.map((query) => query.query.replaceAll(/\s+/g, " ").trim())
}
