import "reflect-metadata"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"
import { DataSource, Table, TableColumn, TableUnique } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DriverUtils } from "../../../src/driver/DriverUtils"

describe("query runner > drop unique constraint", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: [
                "mssql",
                "postgres",
                "sqlite",
                "better-sqlite3",
                "oracle",
                "cockroachdb",
            ], // mysql and sap does not supports unique constraints
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should correctly drop unique constraint and revert drop", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

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
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                await queryRunner.connect()

                try {
                    // Create a test table for unique constraints
                    await queryRunner.createTable(
                        new Table({
                            name: "test_unique_table",
                            columns: [
                                new TableColumn({
                                    name: "id",
                                    type: DriverUtils.isSQLiteFamily(
                                        connection.driver,
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
})
