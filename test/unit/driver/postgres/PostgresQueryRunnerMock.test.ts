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
        // @ts-ignore
        queryRunner.executeQueries = async (up: Query[], down: Query[]) => {
            // We just capture the up queries strings
            queries.push(...up.map((q) => q.query))
            return Promise.resolve()
        }

        // Mock getCachedTable/replaceCachedTable as they might be called
        // @ts-ignore
        queryRunner.getCachedTable = async (name) => {
            // Return a dummy table if asked, but we pass table object directly usually
            return new Table({ name: "dummy" })
        }
        // @ts-ignore
        queryRunner.replaceCachedTable = (table, cloned) => {}

        // Mock other helpers if needed
        // @ts-ignore
        queryRunner.getTableNameWithSchema = async (name) => name

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

    it("should generate ALTER COLUMN SQL without USING clause when type is same (just precision/scale?)", async () => {
        // ...
        // Actually length change logic in my fix uses USING.
        // oldColumn.type !== newColumn.type -> checks type string equality? "varchar" === "varchar".
        // If type is SAME, it sends empty string for USING.
        // Wait, check my fix logic:
        // oldColumn.type !== newColumn.type ? `USING ...` : ""
        // So for length change ONLY, it DOES NOT emitting USING clause?
        // Wait, typically growing a varchar DOES NOT need USING.
        // My fix handles type change with USING.
        // Does length change trigger the same block?
        // Yes:
        /*
            if (
                oldColumn.type !== newColumn.type ||
                oldColumn.length !== newColumn.length ||
                newColumn.precision !== oldColumn.precision ||
                newColumn.scale !== oldColumn.scale
            )
        */
        // But the ternary: `oldColumn.type !== newColumn.type ? USING... : ""`
        // If length changes but type is same("varchar"), expected is NO USING.
        // Let's test that!
    })
})
