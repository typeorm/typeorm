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
import { DataSource, Table, TableColumn, TableForeignKey } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DriverUtils } from "../../../src/driver/DriverUtils"

describe("query runner > drop foreign key", () => {
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

    it("should correctly drop foreign key and revert drop", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                let table = await queryRunner.getTable("student")
                table!.foreignKeys.length.should.be.equal(2)

                await queryRunner.dropForeignKey(table!, table!.foreignKeys[0])

                table = await queryRunner.getTable("student")
                table!.foreignKeys.length.should.be.equal(1)

                await queryRunner.executeMemoryDownSql()

                table = await queryRunner.getTable("student")
                table!.foreignKeys.length.should.be.equal(2)

                await queryRunner.release()
            }),
        ))

    it("should drop all foreign keys without skipping any when iterating over array", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Skip databases that don't support foreign keys
                if (connection.driver.options.type === "spanner") {
                    return
                }

                const queryRunner = connection.createQueryRunner()
                await queryRunner.connect()

                try {
                    // Create a referenced table first
                    await queryRunner.createTable(
                        new Table({
                            name: "referenced_table",
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
                                    name: "name",
                                    type: "varchar",
                                    length: "100",
                                }),
                            ],
                        }),
                        true,
                    )

                    // Create a test table for foreign keys
                    await queryRunner.createTable(
                        new Table({
                            name: "test_fk_table",
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
                            ],
                        }),
                        true,
                    )

                    // Add multiple foreign keys
                    await queryRunner.createForeignKeys("test_fk_table", [
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
                    const table = await queryRunner.getTable("test_fk_table")
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
                        "test_fk_table",
                        testForeignKeys,
                    )

                    // Verify all test foreign keys were dropped
                    const finalTable =
                        await queryRunner.getTable("test_fk_table")
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

                    // Clean up test tables
                    await queryRunner.dropTable("test_fk_table")
                    await queryRunner.dropTable("referenced_table")
                } finally {
                    await queryRunner.release()
                }
            }),
        ))
})
