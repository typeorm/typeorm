import { expect } from "chai"
import { PostgresQueryRunner } from "../../../../src/driver/postgres/PostgresQueryRunner"
import { PostgresDriver } from "../../../../src/driver/postgres/PostgresDriver"
import { Table } from "../../../../src/schema-builder/table/Table"
import { DataSource } from "../../../../src/data-source/DataSource"
import { TableColumn } from "../../../../src/schema-builder/table/TableColumn"
import { Query } from "../../../../src/driver/Query"

describe("PostgresQueryRunner Unit Test", () => {
    let mockDriver: PostgresDriver
    let queryRunner: PostgresQueryRunner
    let queries: string[] = []

    beforeEach(() => {
        queries = []

        // Minimal Mock of DataSource
        const mockDataSource = {
            options: { type: "postgres" },
            logger: {
                logQuery: () => {},
                logQueryError: () => {},
                logQuerySlow: () => {},
                log: () => {},
            },
            entityMetadatas: [],
        } as unknown as DataSource

        // Minimal Mock of PostgresDriver
        // We need to implement methods used by PostgresQueryRunner.changeColumn
        mockDriver = {
            connection: mockDataSource,
            options: { type: "postgres" },
            escapePath: (target: any) => {
                const name = target.name || target
                return `"${name}"`
            },
            createFullType: (col: TableColumn) => {
                let type = col.type
                if (col.precision !== undefined && col.precision !== null) {
                    if (col.scale !== undefined && col.scale !== null) {
                        type += `(${col.precision},${col.scale})`
                    } else {
                        type += `(${col.precision})`
                    }
                } else if (col.length) {
                    type += `(${col.length})`
                }
                return type
            },
            parseTableName: (target: any) => {
                return { tableName: target.name || target, schema: undefined }
            },
            buildDriverOptions: () => ({}),
            // Mock empty capabilities
            spatialTypes: [],
            withLengthColumnTypes: ["varchar"],
            withPrecisionColumnTypes: [],
            withScaleColumnTypes: [],
            mappedDataTypes: {},
            supportedIndexTypes: [],

            // Needed constructor call of PostgresQueryRunner accesses driver.connection
        } as unknown as PostgresDriver

        // Instantiate
        queryRunner = new PostgresQueryRunner(mockDriver, "master")

        // Mock executeQueries to capture SQL
        // @ts-expect-error - mocking internal method
        queryRunner.executeQueries = async (up: Query[], _down: Query[]) => {
            // We just capture the up queries strings
            queries.push(...up.map((q) => q.query))
            return Promise.resolve()
        }

        // Mock getCachedTable/replaceCachedTable as they might be called
        // @ts-expect-error - mocking internal method
        queryRunner.getCachedTable = async () => {
            // Return a dummy table if asked, but we pass table object directly usually
            return new Table({ name: "dummy" })
        }
        // @ts-expect-error - mocking internal method
        queryRunner.replaceCachedTable = (_table: Table, _cloned: Table) => {}

        // Since we don't have a real connection, we must ensure connect() is mocked if called
        // But executeQueries mocking bypasses connect() usually if implemented well
        // Wait, changeColumn logic does NOT call connect() directly, it constructs queries and calls executeQueries.
    })

    it("should generate ALTER COLUMN SQL without USING clause when length changes", async () => {
        const table = new Table({
            name: "post",
            columns: [
                {
                    name: "title",
                    type: "varchar",
                    length: "100",
                },
            ],
        })

        const oldColumn = table.findColumnByName("title")!
        const newColumn = oldColumn.clone()
        newColumn.length = "200"

        await queryRunner.changeColumn(table, oldColumn, newColumn)

        const expectedSql =
            'ALTER TABLE "post" ALTER COLUMN "title" TYPE varchar(200)'

        const matched = queries.find((q) => q === expectedSql)
        if (!matched)
            console.log(
                "FAILED MATCH. Queries:",
                JSON.stringify(queries, null, 2),
            )
        expect(matched).to.exist
    })

    it("should generate ALTER COLUMN SQL with USING clause when type changes", async () => {
        const table = new Table({
            name: "post",
            columns: [
                {
                    name: "count",
                    type: "integer",
                },
            ],
        })

        const oldColumn = table.findColumnByName("count")!
        const newColumn = oldColumn.clone()
        newColumn.type = "bigint"

        await queryRunner.changeColumn(table, oldColumn, newColumn)

        const expectedSql =
            'ALTER TABLE "post" ALTER COLUMN "count" TYPE bigint USING "count"::bigint'

        const matched = queries.find((q) => q === expectedSql)
        if (!matched)
            console.log(
                "FAILED MATCH. Queries:",
                JSON.stringify(queries, null, 2),
            )
        expect(matched).to.exist
    })

    it("should use ALTER COLUMN for integer to bigint type change", async () => {
        const table = new Table({
            name: "transaction",
            columns: [
                {
                    name: "amount",
                    type: "integer",
                },
            ],
        })

        const oldColumn = table.findColumnByName("amount")!
        const newColumn = oldColumn.clone()
        newColumn.type = "bigint"

        await queryRunner.changeColumn(table, oldColumn, newColumn)

        const matched = queries.find(
            (q) =>
                q.includes("ALTER TABLE") &&
                q.includes('"amount"') &&
                q.includes("TYPE bigint") &&
                q.includes('USING "amount"::bigint'),
        )

        if (!matched) {
            console.log(
                "FAILED MATCH. Queries:",
                JSON.stringify(queries, null, 2),
            )
        }
        expect(matched).to.exist
    })

    it("should use ALTER COLUMN for varchar length increase", async () => {
        const table = new Table({
            name: "post",
            columns: [
                {
                    name: "title",
                    type: "varchar",
                    length: "100",
                },
            ],
        })

        const oldColumn = table.findColumnByName("title")!
        const newColumn = oldColumn.clone()
        newColumn.length = "500"

        await queryRunner.changeColumn(table, oldColumn, newColumn)

        const matched = queries.find(
            (q) =>
                q.includes("ALTER TABLE") &&
                q.includes('"title"') &&
                q.includes("TYPE varchar") &&
                q.includes("varchar(500)") &&
                !q.includes("DROP COLUMN"),
        )

        if (!matched) {
            console.log(
                "FAILED MATCH. Queries:",
                JSON.stringify(queries, null, 2),
            )
        }
        expect(matched).to.exist
    })

    it("should use ALTER COLUMN for text to varchar conversion", async () => {
        const table = new Table({
            name: "document",
            columns: [
                {
                    name: "content",
                    type: "text",
                },
            ],
        })

        const oldColumn = table.findColumnByName("content")!
        const newColumn = oldColumn.clone()
        newColumn.type = "varchar"
        newColumn.length = "1000"

        await queryRunner.changeColumn(table, oldColumn, newColumn)

        const matched = queries.find(
            (q) =>
                q.includes("ALTER TABLE") &&
                q.includes('"content"') &&
                q.includes("TYPE varchar") &&
                q.includes("USING"),
        )

        if (!matched) {
            console.log(
                "FAILED MATCH. Queries:",
                JSON.stringify(queries, null, 2),
            )
        }
        expect(matched).to.exist
    })
})
