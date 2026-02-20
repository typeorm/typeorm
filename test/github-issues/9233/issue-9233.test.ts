import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import { Table } from "../../../src/schema-builder/table/Table"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

describe("github issues > #9233 enum with the same enumName should be handled correctly", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [],
                schemaCreate: false,
                dropSchema: true,
                enabledDrivers: ["postgres"],
            })),
    )
    after(() => closeTestingConnections(dataSources))

    it("should not drop enum when dropping one of multiple columns using it", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                await queryRunner.connect()

                // 1. Create table with two columns sharing the same ENUM
                const table = new Table({
                    name: "test_table",
                    columns: [
                        {
                            name: "col1",
                            type: "enum",
                            enum: ["A", "B"],
                            enumName: "test_enum",
                        },
                        {
                            name: "col2",
                            type: "enum",
                            enum: ["A", "B"],
                            enumName: "test_enum",
                        },
                    ],
                })
                await queryRunner.createTable(table)

                // Verify ENUM exists
                let result = await queryRunner.query(
                    `SELECT count(*) as "count" FROM "pg_type" WHERE "typname" = 'test_enum'`,
                )
                expect(parseInt(result[0].count)).to.be.equal(
                    1,
                    "Enum should exist after table creation",
                )

                // 2. Drop the first column
                // Note: We perform dropColumn providing the table name or object.
                // It is safer to fetch the table from DB to ensure accurate metadata if needed,
                // but passing the original table object is often supported.
                await queryRunner.dropColumn("test_table", "col1")

                // 3. Verify ENUM still exists (because col2 uses it)
                result = await queryRunner.query(
                    `SELECT count(*) as "count" FROM "pg_type" WHERE "typname" = 'test_enum'`,
                )
                expect(parseInt(result[0].count)).to.be.equal(
                    1,
                    "Enum should still exist after dropping col1",
                )

                // 4. Drop the second column
                await queryRunner.dropColumn("test_table", "col2")

                // 5. Verify ENUM is dropped (if TypeORM handles cleanup, otherwise this assertion depends on `dropColumn` behavior configuration)
                // TypeORM typically drops the ENUM when the last column using it is dropped via sync/migration logic,
                // but direct QueryRunner.dropColumn might differ depending on version.
                // Assuming the fix ensures it IS dropped only when no longer used:
                result = await queryRunner.query(
                    `SELECT count(*) as "count" FROM "pg_type" WHERE "typname" = 'test_enum'`,
                )

                expect(parseInt(result[0].count)).to.be.equal(
                    0,
                    "Enum should be dropped after dropping col2",
                )

                await queryRunner.dropTable("test_table")

                // Cleanup manual ENUM if it wasn't dropped (just in case test fails halfway)
                await queryRunner.query(`DROP TYPE IF EXISTS "test_enum"`)

                await queryRunner.release()
            }),
        ))
})
