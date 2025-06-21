import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Table } from "../../../src/schema-builder/table/Table"
import { TableUnique } from "../../../src/schema-builder/table/TableUnique"

describe("query runner > create unique constraints", () => {
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

    it("should correctly create multiple unique constraints in parallel", () =>
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
                    }),
                    true,
                )

                // Create unique constraints in parallel
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

                await queryRunner.createUniqueConstraints(
                    "test_table",
                    uniqueConstraints,
                )

                // Verify unique constraints were created
                const table = await queryRunner.getTable("test_table")
                table!.uniques.length.should.be.equal(3)
                table!.uniques.find(
                    (uq: TableUnique) => uq.name === "UQ_test_table_username",
                )!.should.not.be.undefined
                table!.uniques.find(
                    (uq: TableUnique) => uq.name === "UQ_test_table_email",
                )!.should.not.be.undefined
                table!.uniques.find(
                    (uq: TableUnique) => uq.name === "UQ_test_table_phone",
                )!.should.not.be.undefined

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

                // Create empty unique constraints array
                await queryRunner.createUniqueConstraints("test_table", [])

                // Verify no unique constraints were created
                const table = await queryRunner.getTable("test_table")
                table!.uniques.length.should.be.equal(0)

                await queryRunner.release()
            }),
        ))
})
