import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Table } from "../../../src/schema-builder/table/Table"
import { TableUnique } from "../../../src/schema-builder/table/TableUnique"

describe("query runner > drop unique constraints", () => {
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

    it("should correctly drop multiple unique constraints in parallel", () =>
        Promise.all(
            connections.map(async (connection) => {
                let stringType = "varchar"
                if (connection.driver.options.type === "spanner") {
                    stringType = "string"
                }

                const queryRunner = connection.createQueryRunner()

                // Create table with unique constraints
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
                                name: "username",
                                type: stringType,
                            },
                            {
                                name: "email",
                                type: stringType,
                            },
                            {
                                name: "phone",
                                type: stringType,
                            },
                        ],
                        uniques: [
                            {
                                name: "UQ_test_table_username",
                                columnNames: ["username"],
                            },
                            {
                                name: "UQ_test_table_email",
                                columnNames: ["email"],
                            },
                            {
                                name: "UQ_test_table_phone",
                                columnNames: ["phone"],
                            },
                        ],
                    }),
                    true,
                )

                // Verify unique constraints were created
                let table = await queryRunner.getTable("test_table")
                table!.uniques.length.should.be.equal(3)

                // Drop unique constraints in parallel
                const uniqueConstraints = [
                    new TableUnique({
                        name: "UQ_test_table_username",
                        columnNames: ["username"],
                    }),
                    new TableUnique({
                        name: "UQ_test_table_email",
                        columnNames: ["email"],
                    }),
                    new TableUnique({
                        name: "UQ_test_table_phone",
                        columnNames: ["phone"],
                    }),
                ]

                await queryRunner.dropUniqueConstraints(
                    "test_table",
                    uniqueConstraints,
                )

                // Verify unique constraints were dropped
                table = await queryRunner.getTable("test_table")
                table!.uniques.length.should.be.equal(0)

                await queryRunner.release()
            }),
        ))

    it("should handle empty unique constraints array", () =>
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

                // Drop empty unique constraints array
                await queryRunner.dropUniqueConstraints("test_table", [])

                // Verify table still exists
                const table = await queryRunner.getTable("test_table")
                table!.should.not.be.undefined

                await queryRunner.release()
            }),
        ))
})
