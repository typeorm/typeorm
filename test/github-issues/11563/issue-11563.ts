import "reflect-metadata"
import { expect } from "chai"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/index"
import { TableColumn } from "../../../src/schema-builder/table/TableColumn"
import { TableIndex } from "../../../src/schema-builder/table/TableIndex"
import { TableForeignKey } from "../../../src/schema-builder/table/TableForeignKey"
import { TableUnique } from "../../../src/schema-builder/table/TableUnique"
import { Table } from "../../../src/schema-builder/table/Table"
import { TestEntity } from "./entity/TestEntity"

describe("github issues > #11563 QueryRunner array modification during iteration bug", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [TestEntity],
                enabledDrivers: [
                    "postgres",
                    "mysql",
                    "mariadb",
                    "mssql",
                    "oracle",
                    "cockroachdb",
                    "spanner",
                    "sap",
                    "aurora-mysql",
                ],
                schemaCreate: true,
                dropSchema: true,
            })),
    )

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should drop all columns without skipping any when iterating over array", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                await queryRunner.connect()

                try {
                    // Create test table with multiple columns
                    const table = await queryRunner.getTable("test_entity")
                    if (!table) {
                        throw new Error("Test table not found")
                    }

                    // Add additional test columns to have enough for the bug to manifest
                    await queryRunner.addColumns("test_entity", [
                        new TableColumn({
                            name: "test_col_1",
                            type: "varchar",
                            length: "100",
                            isNullable: true,
                        }),
                        new TableColumn({
                            name: "test_col_2",
                            type: "varchar",
                            length: "100",
                            isNullable: true,
                        }),
                        new TableColumn({
                            name: "test_col_3",
                            type: "varchar",
                            length: "100",
                            isNullable: true,
                        }),
                        new TableColumn({
                            name: "test_col_4",
                            type: "varchar",
                            length: "100",
                            isNullable: true,
                        }),
                    ])

                    // Get updated table with new columns
                    const updatedTable = await queryRunner.getTable(
                        "test_entity",
                    )
                    if (!updatedTable) {
                        throw new Error("Updated test table not found")
                    }

                    // Find only the test columns we added (exclude id and name which are in the entity)
                    const testColumns = updatedTable.columns.filter((col) =>
                        col.name.startsWith("test_col_"),
                    )

                    expect(testColumns).to.have.length(
                        4,
                        `Should have 4 test columns before dropping, found: ${testColumns
                            .map((c) => c.name)
                            .join(", ")}`,
                    )

                    // This is the bug scenario: dropping multiple columns by iterating over the array
                    // The bug would cause some columns to be skipped due to array modification during iteration
                    await queryRunner.dropColumns("test_entity", testColumns)

                    // Verify all test columns were actually dropped
                    const finalTable = await queryRunner.getTable("test_entity")
                    if (!finalTable) {
                        throw new Error("Final test table not found")
                    }

                    const remainingTestColumns = finalTable.columns.filter(
                        (col) => col.name.startsWith("test_col_"),
                    )

                    expect(remainingTestColumns).to.have.length(
                        0,
                        `All test columns should be dropped, but found remaining: ${remainingTestColumns
                            .map((c) => c.name)
                            .join(", ")}`,
                    )

                    // Verify the original entity columns still exist
                    const idColumn = finalTable.columns.find(
                        (col) => col.name === "id",
                    )
                    const nameColumn = finalTable.columns.find(
                        (col) => col.name === "name",
                    )

                    expect(idColumn).to.not.equal(
                        undefined,
                        "ID column should still exist",
                    )
                    expect(nameColumn).to.not.equal(
                        undefined,
                        "Name column should still exist",
                    )
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("should drop all indices without skipping any when iterating over array", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                await queryRunner.connect()

                try {
                    // Add columns for indices first
                    await queryRunner.addColumns("test_entity", [
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
                    ])

                    // Add multiple test indices on different columns to avoid Oracle conflicts
                    await queryRunner.createIndices("test_entity", [
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
                    const table = await queryRunner.getTable("test_entity")
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
                    await queryRunner.dropIndices("test_entity", testIndices)

                    // Verify all test indices were dropped
                    const finalTable = await queryRunner.getTable("test_entity")
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
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("should drop all foreign keys without skipping any when iterating over array", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Skip databases that don't support foreign keys
                if (dataSource.driver.options.type === "spanner") {
                    return
                }

                const queryRunner = dataSource.createQueryRunner()
                await queryRunner.connect()

                try {
                    // Create a referenced table first
                    await queryRunner.createTable(
                        new Table({
                            name: "referenced_table",
                            columns: [
                                new TableColumn({
                                    name: "id",
                                    type: "int",
                                    isPrimary: true,
                                    isGenerated: true,
                                    generationStrategy: "increment",
                                }),
                                new TableColumn({
                                    name: "name",
                                    type: "varchar",
                                    length: "100",
                                }),
                            ],
                        }),
                        true,
                    )

                    // Add foreign key columns to test_entity
                    await queryRunner.addColumns("test_entity", [
                        new TableColumn({
                            name: "ref_id_1",
                            type: "int",
                            isNullable: true,
                        }),
                        new TableColumn({
                            name: "ref_id_2",
                            type: "int",
                            isNullable: true,
                        }),
                        new TableColumn({
                            name: "ref_id_3",
                            type: "int",
                            isNullable: true,
                        }),
                        new TableColumn({
                            name: "ref_id_4",
                            type: "int",
                            isNullable: true,
                        }),
                    ])

                    // Add multiple foreign keys
                    await queryRunner.createForeignKeys("test_entity", [
                        new TableForeignKey({
                            name: "test_fk_1",
                            columnNames: ["ref_id_1"],
                            referencedTableName: "referenced_table",
                            referencedColumnNames: ["id"],
                        }),
                        new TableForeignKey({
                            name: "test_fk_2",
                            columnNames: ["ref_id_2"],
                            referencedTableName: "referenced_table",
                            referencedColumnNames: ["id"],
                        }),
                        new TableForeignKey({
                            name: "test_fk_3",
                            columnNames: ["ref_id_3"],
                            referencedTableName: "referenced_table",
                            referencedColumnNames: ["id"],
                        }),
                        new TableForeignKey({
                            name: "test_fk_4",
                            columnNames: ["ref_id_4"],
                            referencedTableName: "referenced_table",
                            referencedColumnNames: ["id"],
                        }),
                    ])

                    // Get the table with foreign keys
                    const table = await queryRunner.getTable("test_entity")
                    if (!table) {
                        throw new Error("Test table not found")
                    }

                    // Find only our test foreign keys
                    const testForeignKeys = table.foreignKeys.filter((fk) =>
                        fk.name?.startsWith("test_fk_"),
                    )

                    expect(testForeignKeys).to.have.length(
                        4,
                        `Should have 4 test foreign keys before dropping, found: ${testForeignKeys
                            .map((fk) => fk.name)
                            .join(", ")}`,
                    )

                    // Drop all test foreign keys - this should not skip any due to array modification
                    await queryRunner.dropForeignKeys(
                        "test_entity",
                        testForeignKeys,
                    )

                    // Verify all test foreign keys were dropped
                    const finalTable = await queryRunner.getTable("test_entity")
                    if (!finalTable) {
                        throw new Error("Final test table not found")
                    }

                    const remainingTestForeignKeys =
                        finalTable.foreignKeys.filter((fk) =>
                            fk.name?.startsWith("test_fk_"),
                        )

                    expect(remainingTestForeignKeys).to.have.length(
                        0,
                        `All test foreign keys should be dropped, but found remaining: ${remainingTestForeignKeys
                            .map((fk) => fk.name)
                            .join(", ")}`,
                    )

                    // Clean up referenced table
                    await queryRunner.dropTable("referenced_table")
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("should drop all unique constraints without skipping any when iterating over array", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Skip databases that don't support unique constraints or handle them differently
                if (
                    [
                        "spanner",
                        "sap",
                        "mysql",
                        "mariadb",
                        "aurora-mysql",
                    ].includes(dataSource.driver.options.type as string)
                ) {
                    return
                }

                const queryRunner = dataSource.createQueryRunner()
                await queryRunner.connect()

                try {
                    // Add columns for unique constraints
                    await queryRunner.addColumns("test_entity", [
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
                    ])

                    // Add multiple unique constraints
                    await queryRunner.createUniqueConstraints("test_entity", [
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
                    ])

                    // Get the table with unique constraints
                    const table = await queryRunner.getTable("test_entity")
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
                        "test_entity",
                        testUniqueConstraints,
                    )

                    // Verify all test unique constraints were dropped
                    const finalTable = await queryRunner.getTable("test_entity")
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
                } finally {
                    await queryRunner.release()
                }
            }),
        ))
})
