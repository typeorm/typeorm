import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Table } from "../../../src/schema-builder/table/Table"
import { TableIndex } from "../../../src/schema-builder/table/TableIndex"

describe("query runner > drop indices", () => {
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

    it("should correctly drop multiple indices in parallel", () =>
        Promise.all(
            connections.map(async (connection) => {
                let stringType = "varchar"
                if (connection.driver.options.type === "spanner") {
                    stringType = "string"
                }

                const queryRunner = connection.createQueryRunner()

                // Create table with indices
                await queryRunner.createTable(
                    new Table({
                        name: "test_table",
                        columns: [
                            {
                                name: "id",
                                type: "int",
                                isPrimary: true,
                            },
                            {
                                name: "name",
                                type: stringType,
                            },
                            {
                                name: "email",
                                type: stringType,
                            },
                            {
                                name: "age",
                                type: "int",
                            },
                        ],
                        indices: [
                            {
                                name: "IDX_test_table_name",
                                columnNames: ["name"],
                            },
                            {
                                name: "IDX_test_table_email",
                                columnNames: ["email"],
                            },
                            {
                                name: "IDX_test_table_age",
                                columnNames: ["age"],
                            },
                        ],
                    }),
                    true,
                )

                // Verify indices were created
                let table = await queryRunner.getTable("test_table")
                table!.indices.length.should.be.equal(3)

                // Drop indices in parallel
                const indices = [
                    new TableIndex({
                        name: "IDX_test_table_name",
                        columnNames: ["name"],
                    }),
                    new TableIndex({
                        name: "IDX_test_table_email",
                        columnNames: ["email"],
                    }),
                    new TableIndex({
                        name: "IDX_test_table_age",
                        columnNames: ["age"],
                    }),
                ]

                await queryRunner.dropIndices("test_table", indices)

                // Verify indices were dropped
                table = await queryRunner.getTable("test_table")
                table!.indices.length.should.be.equal(0)

                await queryRunner.release()
            }),
        ))

    it("should handle empty indices array", () =>
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

                // Drop empty indices array
                await queryRunner.dropIndices("test_table", [])

                // Verify table still exists
                const table = await queryRunner.getTable("test_table")
                table!.should.not.be.undefined

                await queryRunner.release()
            }),
        ))
})
