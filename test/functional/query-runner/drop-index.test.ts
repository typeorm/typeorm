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
import { DataSource, Table, TableColumn, TableIndex } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DriverUtils } from "../../../src/driver/DriverUtils"

describe("query runner > drop index", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should correctly drop index and revert drop", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                let table = await queryRunner.getTable("student")
                // CockroachDB also stores indices for relation columns
                if (connection.driver.options.type === "cockroachdb") {
                    table!.indices.length.should.be.equal(3)
                } else {
                    table!.indices.length.should.be.equal(1)
                }

                await queryRunner.dropIndex(table!, table!.indices[0])

                table = await queryRunner.getTable("student")
                // CockroachDB also stores indices for relation columns
                if (connection.driver.options.type === "cockroachdb") {
                    table!.indices.length.should.be.equal(2)
                } else {
                    table!.indices.length.should.be.equal(0)
                }

                await queryRunner.executeMemoryDownSql()

                table = await queryRunner.getTable("student")
                // CockroachDB also stores indices for relation columns
                if (connection.driver.options.type === "cockroachdb") {
                    table!.indices.length.should.be.equal(3)
                } else {
                    table!.indices.length.should.be.equal(1)
                }

                await queryRunner.release()
            }),
        ))

    it("should drop all indices without skipping any when iterating over array", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                await queryRunner.connect()

                try {
                    // Create a test table for this specific test
                    await queryRunner.createTable(
                        new Table({
                            name: "test_index_table",
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
                                    name: "idx_col_1",
                                    type: "varchar",
                                    length: "100",
                                    isNullable: true,
                                }),
                                new TableColumn({
                                    name: "idx_col_2",
                                    type: "varchar",
                                    length: "100",
                                    isNullable: true,
                                }),
                                new TableColumn({
                                    name: "idx_col_3",
                                    type: "varchar",
                                    length: "100",
                                    isNullable: true,
                                }),
                                new TableColumn({
                                    name: "idx_col_4",
                                    type: "varchar",
                                    length: "100",
                                    isNullable: true,
                                }),
                            ],
                        }),
                        true,
                    )

                    // Add multiple test indices on different columns to avoid Oracle conflicts
                    await queryRunner.createIndices("test_index_table", [
                        new TableIndex({
                            name: "test_idx_1",
                            columnNames: ["idx_col_1"],
                        }),
                        new TableIndex({
                            name: "test_idx_2",
                            columnNames: ["idx_col_2"],
                        }),
                        new TableIndex({
                            name: "test_idx_3",
                            columnNames: ["idx_col_3"],
                        }),
                        new TableIndex({
                            name: "test_idx_4",
                            columnNames: ["idx_col_4"],
                        }),
                    ])

                    // Get the table with indices
                    const table = await queryRunner.getTable("test_index_table")
                    if (!table) {
                        throw new Error("Test table not found")
                    }

                    // Find only our test indices
                    const testIndices = table.indices.filter((idx) =>
                        idx.name?.startsWith("test_idx_"),
                    )

                    expect(testIndices).to.have.length(
                        4,
                        `Should have 4 test indices before dropping, found: ${testIndices
                            .map((i) => i.name)
                            .join(", ")}`,
                    )

                    // Drop all test indices - this should not skip any due to array modification
                    await queryRunner.dropIndices(
                        "test_index_table",
                        testIndices,
                    )

                    // Verify all test indices were dropped
                    const finalTable = await queryRunner.getTable(
                        "test_index_table",
                    )
                    if (!finalTable) {
                        throw new Error("Final test table not found")
                    }

                    const remainingTestIndices = finalTable.indices.filter(
                        (idx) => idx.name?.startsWith("test_idx_"),
                    )

                    expect(remainingTestIndices).to.have.length(
                        0,
                        `All test indices should be dropped, but found remaining: ${remainingTestIndices
                            .map((i) => i.name)
                            .join(", ")}`,
                    )

                    // Clean up the test table
                    await queryRunner.dropTable("test_index_table")
                } finally {
                    await queryRunner.release()
                }
            }),
        ))
})
