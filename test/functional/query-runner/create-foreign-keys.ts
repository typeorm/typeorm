import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Table } from "../../../src/schema-builder/table/Table"
import { TableForeignKey } from "../../../src/schema-builder/table/TableForeignKey"
import { DriverUtils } from "../../../src/driver/DriverUtils"

describe("query runner > create foreign keys", () => {
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

    it("should correctly create multiple foreign keys in parallel", () =>
        Promise.all(
            connections.map(async (connection) => {
                let numericType = "int"
                if (DriverUtils.isSQLiteFamily(connection.driver)) {
                    numericType = "integer"
                } else if (connection.driver.options.type === "spanner") {
                    numericType = "int64"
                }

                const queryRunner = connection.createQueryRunner()

                // Create parent tables
                await queryRunner.createTable(
                    new Table({
                        name: "parent1",
                        columns: [
                            {
                                name: "id",
                                type: numericType,
                                isPrimary: true,
                                isGenerated: true,
                                generationStrategy: "increment",
                            },
                        ],
                    }),
                    true,
                )

                await queryRunner.createTable(
                    new Table({
                        name: "parent2",
                        columns: [
                            {
                                name: "id",
                                type: numericType,
                                isPrimary: true,
                                isGenerated: true,
                                generationStrategy: "increment",
                            },
                        ],
                    }),
                    true,
                )

                // Create child table
                await queryRunner.createTable(
                    new Table({
                        name: "child",
                        columns: [
                            {
                                name: "id",
                                type: numericType,
                                isPrimary: true,
                                isGenerated: true,
                                generationStrategy: "increment",
                            },
                            {
                                name: "parent1Id",
                                type: numericType,
                            },
                            {
                                name: "parent2Id",
                                type: numericType,
                            },
                        ],
                    }),
                    true,
                )

                // Create foreign keys in parallel
                const foreignKeys = [
                    new TableForeignKey({
                        name: "FK_child_parent1",
                        columnNames: ["parent1Id"],
                        referencedTableName: "parent1",
                        referencedColumnNames: ["id"],
                    }),
                    new TableForeignKey({
                        name: "FK_child_parent2",
                        columnNames: ["parent2Id"],
                        referencedTableName: "parent2",
                        referencedColumnNames: ["id"],
                    }),
                ]

                await queryRunner.createForeignKeys("child", foreignKeys)

                // Verify foreign keys were created
                const table = await queryRunner.getTable("child")
                table!.foreignKeys.length.should.be.equal(2)
                table!.foreignKeys.find(
                    (fk: TableForeignKey) => fk.name === "FK_child_parent1",
                )!.should.not.be.undefined
                table!.foreignKeys.find(
                    (fk: TableForeignKey) => fk.name === "FK_child_parent2",
                )!.should.not.be.undefined

                await queryRunner.release()
            }),
        ))

    it("should handle empty foreign keys array", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create a simple table
                await queryRunner.createTable(
                    new Table({
                        name: "test_table",
                        columns: [
                            {
                                name: "id",
                                type: "int",
                                isPrimary: true,
                            },
                        ],
                    }),
                    true,
                )

                // Create empty foreign keys array
                await queryRunner.createForeignKeys("test_table", [])

                // Verify no foreign keys were created
                const table = await queryRunner.getTable("test_table")
                table!.foreignKeys.length.should.be.equal(0)

                await queryRunner.release()
            }),
        ))
})
