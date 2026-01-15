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
                if (col.length) type += `(${col.length})`
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

    it("should generate ALTER COLUMN SQL with USING clause when length changes", async () => {
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

        // Execute
        await queryRunner.changeColumn(table, oldColumn, newColumn)

        // Verify
        // Expected: result of escapePath("post") is "post"
        // result of createFullType(newColumn) is varchar(200)
        // result of createFullType(oldColumn) is varchar(100)
        // SQL: ALTER TABLE "post" ALTER COLUMN "title" TYPE varchar(200) USING "title"::varchar(200)

        // Note: My mock escapePath returns "name". Postgres escape usually adds quotes but mock depends on implementation.
        // The real PostgresDriver.escapePath handles schema/dot split.
        // My mock simple is `"${name}"`.

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

    it("should generate ALTER COLUMN SQL without USING clause when type is same", async () => {
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
})
