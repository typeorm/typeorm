import { expect } from "chai"
import type { DataSource } from "../../../src"
import { DriverUtils } from "../../../src/driver/DriverUtils"
import { Table, TableColumn, TableUnique } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("query runner > drop unique constraint", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: [
                "mssql",
                "postgres",
                "better-sqlite3",
                "oracle",
                "cockroachdb",
            ], // mysql and sap does not supports unique constraints
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should correctly drop unique constraint and revert drop", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

                let table = await queryRunner.getTable("post")
                table!.uniques.length.should.be.equal(2)

                // find composite unique constraint to delete
                const unique = table!.uniques.find(
                    (u) => u.columnNames.length === 2,
                )
                await queryRunner.dropUniqueConstraint(table!, unique!)

                table = await queryRunner.getTable("post")
                table!.uniques.length.should.be.equal(1)

                await queryRunner.executeMemoryDownSql()

                table = await queryRunner.getTable("post")
                table!.uniques.length.should.be.equal(2)

                await queryRunner.release()
            }),
        ))

    it("should drop all unique constraints without skipping any when iterating over array", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

                try {
                    // Create a test table for unique constraints
                    await queryRunner.createTable(
                        new Table({
                            name: "test_unique_table",
                            columns: [
                                new TableColumn({
                                    name: "id",
                                    type: DriverUtils.isSQLiteFamily(
                                        dataSource.driver,
                                    )
                                        ? "integer"
                                        : "int",
                                    isPrimary: true,
                                    isGenerated: true,
                                    generationStrategy: "increment",
                                }),
                                new TableColumn({
                                    name: "unique_col_1",
                                    type: "varchar",
                                    length: "100",
                                    isNullable: true,
                                }),
                                new TableColumn({
                                    name: "unique_col_2",
                                    type: "varchar",
                                    length: "100",
                                    isNullable: true,
                                }),
                                new TableColumn({
                                    name: "unique_col_3",
                                    type: "varchar",
                                    length: "100",
                                    isNullable: true,
                                }),
                                new TableColumn({
                                    name: "unique_col_4",
                                    type: "varchar",
                                    length: "100",
                                    isNullable: true,
                                }),
                            ],
                        }),
                        true,
                    )

                    // Add multiple unique constraints
                    await queryRunner.createUniqueConstraints(
                        "test_unique_table",
                        [
                            new TableUnique({
                                name: "test_uq_1",
                                columnNames: ["unique_col_1"],
                            }),
                            new TableUnique({
                                name: "test_uq_2",
                                columnNames: ["unique_col_2"],
                            }),
                            new TableUnique({
                                name: "test_uq_3",
                                columnNames: ["unique_col_3"],
                            }),
                            new TableUnique({
                                name: "test_uq_4",
                                columnNames: ["unique_col_4"],
                            }),
                        ],
                    )

                    // Get the table with unique constraints
                    const table =
                        await queryRunner.getTable("test_unique_table")
                    if (!table) {
                        throw new Error("Test table not found")
                    }

                    // Find only our test unique constraints
                    const testUniqueConstraints = table.uniques.filter((uq) =>
                        uq.name?.startsWith("test_uq_"),
                    )

                    expect(testUniqueConstraints).to.have.length(
                        4,
                        `Should have 4 test unique constraints before dropping, found: ${testUniqueConstraints
                            .map((uq) => uq.name)
                            .join(", ")}`,
                    )

                    // Drop all test unique constraints - this should not skip any due to array modification
                    await queryRunner.dropUniqueConstraints(
                        "test_unique_table",
                        testUniqueConstraints,
                    )

                    // Verify all test unique constraints were dropped
                    const finalTable =
                        await queryRunner.getTable("test_unique_table")
                    if (!finalTable) {
                        throw new Error("Final test table not found")
                    }

                    const remainingTestUniqueConstraints =
                        finalTable.uniques.filter((uq) =>
                            uq.name?.startsWith("test_uq_"),
                        )

                    expect(remainingTestUniqueConstraints).to.have.length(
                        0,
                        `All test unique constraints should be dropped, but found remaining: ${remainingTestUniqueConstraints
                            .map((uq) => uq.name)
                            .join(", ")}`,
                    )

                    // Clean up the test table
                    await queryRunner.dropTable("test_unique_table")
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("should not throw when dropping non-existent unique constraint with ifExists", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                await queryRunner.dropUniqueConstraint(
                    "post",
                    "non_existent_unique",
                    true,
                )
                await queryRunner.release()
            }),
        ))

    it("should handle dropping unique constraint without a name (with getTable round-trip)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    await queryRunner.createTable(
                        new Table({
                            name: "test_drop_unnamed_unique",
                            columns: [
                                new TableColumn({
                                    name: "id",
                                    type: DriverUtils.isSQLiteFamily(
                                        dataSource.driver,
                                    )
                                        ? "integer"
                                        : "int",
                                    isPrimary: true,
                                    isGenerated: true,
                                    generationStrategy: "increment",
                                }),
                                new TableColumn({
                                    name: "unique_col_1",
                                    type: "varchar",
                                    length: "100",
                                    isNullable: true,
                                }),
                            ],
                        }),
                        true,
                    )

                    await queryRunner.createUniqueConstraint(
                        "test_drop_unnamed_unique",
                        new TableUnique({
                            columnNames: ["unique_col_1"],
                        }),
                    )

                    const table = await queryRunner.getTable(
                        "test_drop_unnamed_unique",
                    )

                    const testUniqueConstraints = table!.uniques
                    expect(testUniqueConstraints).to.have.length(1)

                    await queryRunner.dropUniqueConstraint(
                        "test_drop_unnamed_unique",
                        new TableUnique({
                            columnNames: ["unique_col_1"],
                        }),
                    )

                    const finalTable = await queryRunner.getTable(
                        "test_drop_unnamed_unique",
                    )

                    const remainingTestUniqueConstraints = finalTable!.uniques

                    expect(remainingTestUniqueConstraints).to.have.length(0)
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("should drop an unnamed unique constraint using the in-memory cache without getTable round-trip", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    await queryRunner.createTable(
                        new Table({
                            name: "test_cached_unnamed_unique",
                            columns: [
                                new TableColumn({
                                    name: "id",
                                    type: "integer",
                                    isPrimary: true,
                                    isGenerated: true,
                                    generationStrategy: "increment",
                                }),
                                new TableColumn({
                                    name: "unique_col",
                                    type: "varchar",
                                    length: "100",
                                    isNullable: true,
                                }),
                            ],
                        }),
                        true,
                    )

                    const unnamed = new TableUnique({
                        columnNames: ["unique_col"],
                    })
                    await queryRunner.createUniqueConstraint(
                        "test_cached_unnamed_unique",
                        unnamed,
                    )

                    expect(unnamed.name).to.be.a("string")

                    await queryRunner.dropUniqueConstraint(
                        "test_cached_unnamed_unique",
                        unnamed,
                    )

                    const finalTable = await queryRunner.getTable(
                        "test_cached_unnamed_unique",
                    )

                    expect(finalTable!.uniques).to.have.length(0)
                } finally {
                    await queryRunner.release()
                }
            }),
        ))
})
