import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Table } from "../../../src/schema-builder/table/Table"
import { TableIndex } from "../../../src/schema-builder/table/TableIndex"

describe("query runner > create indices", () => {
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

    it("should correctly create multiple indices in parallel", () =>
        Promise.all(
            connections.map(async (connection) => {
                let stringType = "varchar"
                if (connection.driver.options.type === "spanner") {
                    stringType = "string"
                }

                const queryRunner = connection.createQueryRunner()

                // Create table
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
                    }),
                    true,
                )

                // Create indices in parallel
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

                await queryRunner.createIndices("test_table", indices)

                // Verify indices were created
                const table = await queryRunner.getTable("test_table")
                table!.indices.length.should.be.equal(3)
                table!.indices.find(
                    (idx: TableIndex) => idx.name === "IDX_test_table_name",
                )!.should.not.be.undefined
                table!.indices.find(
                    (idx: TableIndex) => idx.name === "IDX_test_table_email",
                )!.should.not.be.undefined
                table!.indices.find(
                    (idx: TableIndex) => idx.name === "IDX_test_table_age",
                )!.should.not.be.undefined

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

                // Create empty indices array
                await queryRunner.createIndices("test_table", [])

                // Verify no indices were created
                const table = await queryRunner.getTable("test_table")
                table!.indices.length.should.be.equal(0)

                await queryRunner.release()
            }),
        ))
})
