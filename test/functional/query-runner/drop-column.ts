import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { DataSource, Table } from "../../../src"
import { DriverUtils } from "../../../src/driver/DriverUtils"

describe("query runner > drop column", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/common/*{.js,.ts}", __dirname + "/entity/:driver:/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(connections))

    describe("when columns are instances of TableColumn", () => {
        it("should correctly drop column and revert drop", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()

                    let table = await queryRunner.getTable("post")
                    const idColumn = table!.findColumnByName("id")!
                    const nameColumn = table!.findColumnByName("name")!
                    const versionColumn = table!.findColumnByName("version")!
                    idColumn!.should.be.exist
                    nameColumn!.should.be.exist
                    versionColumn!.should.be.exist

                    // better-sqlite3 seems not able to create a check constraint on a non-existing column
                    if (connection.name === "better-sqlite3") {
                        await queryRunner.dropCheckConstraints(
                            table!,
                            table!.checks,
                        )
                    }

                    // In Sqlite 'dropColumns' method is more optimal than 'dropColumn', because it recreate table just once,
                    // without all removed columns. In other drivers it's no difference between these methods, because 'dropColumns'
                    // calls 'dropColumn' method for each removed column.
                    // CockroachDB and Spanner does not support changing pk.
                    if (
                        connection.driver.options.type === "cockroachdb" ||
                        connection.driver.options.type === "spanner"
                    ) {
                        await queryRunner.dropColumns(table!, [
                            nameColumn,
                            versionColumn,
                        ])
                    } else {
                        await queryRunner.dropColumns(table!, [
                            idColumn,
                            nameColumn,
                            versionColumn,
                        ])
                    }

                    table = await queryRunner.getTable("post")
                    expect(table!.findColumnByName("name")).to.be.undefined
                    expect(table!.findColumnByName("version")).to.be.undefined
                    if (
                        !(
                            connection.driver.options.type === "cockroachdb" ||
                            connection.driver.options.type === "spanner"
                        )
                    )
                        expect(table!.findColumnByName("id")).to.be.undefined

                    await queryRunner.executeMemoryDownSql()

                    table = await queryRunner.getTable("post")
                    table!.findColumnByName("id")!.should.be.exist
                    table!.findColumnByName("name")!.should.be.exist
                    table!.findColumnByName("version")!.should.be.exist

                    await queryRunner.release()
                }),
            ))
    })

    describe("when columns are strings", () => {
        it("should correctly drop column and revert drop", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()

                    let table = await queryRunner.getTable("post")
                    const idColumn = table!.findColumnByName("id")!
                    const nameColumn = table!.findColumnByName("name")!
                    const versionColumn = table!.findColumnByName("version")!
                    idColumn!.should.be.exist
                    nameColumn!.should.be.exist
                    versionColumn!.should.be.exist

                    // better-sqlite3 seems not able to create a check constraint on a non-existing column
                    if (connection.name === "better-sqlite3") {
                        await queryRunner.dropCheckConstraints(
                            table!,
                            table!.checks,
                        )
                    }

                    // In Sqlite 'dropColumns' method is more optimal than 'dropColumn', because it recreate table just once,
                    // without all removed columns. In other drivers it's no difference between these methods, because 'dropColumns'
                    // calls 'dropColumn' method for each removed column.
                    // CockroachDB does not support changing pk.
                    if (
                        connection.driver.options.type === "cockroachdb" ||
                        connection.driver.options.type === "spanner"
                    ) {
                        await queryRunner.dropColumns(table!, [
                            "name",
                            "version",
                        ])
                    } else {
                        await queryRunner.dropColumns(table!, [
                            "id",
                            "name",
                            "version",
                        ])
                    }

                    table = await queryRunner.getTable("post")
                    expect(table!.findColumnByName("name")).to.be.undefined
                    expect(table!.findColumnByName("version")).to.be.undefined
                    if (
                        !(
                            connection.driver.options.type === "cockroachdb" ||
                            connection.driver.options.type === "spanner"
                        )
                    )
                        expect(table!.findColumnByName("id")).to.be.undefined

                    await queryRunner.executeMemoryDownSql()

                    table = await queryRunner.getTable("post")
                    table!.findColumnByName("id")!.should.be.exist
                    table!.findColumnByName("name")!.should.be.exist
                    table!.findColumnByName("version")!.should.be.exist

                    await queryRunner.release()
                }),
            ))
    })

    describe("array modification during iteration", () => {
        it("should drop all columns without skipping any when iterating over array", () =>
            Promise.all(
                connections.map(async (connection) => {
                    // Skip drivers that don't support dropping multiple columns
                    if (
                        connection.driver.options.type === "mongodb" ||
                        connection.driver.options.type === "better-sqlite3" ||
                        connection.driver.options.type === "capacitor" ||
                        connection.driver.options.type === "cordova" ||
                        connection.driver.options.type === "react-native" ||
                        connection.driver.options.type === "nativescript" ||
                        connection.driver.options.type === "expo" ||
                        connection.driver.options.type === "sqljs"
                    ) {
                        return
                    }

                    const queryRunner = connection.createQueryRunner()

                    // Create test table with multiple columns
                    const table = new Table({
                        name: "test_drop_columns_array",
                        columns: [
                            {
                                name: "id",
                                type: DriverUtils.isSQLiteFamily(
                                    connection.driver,
                                )
                                    ? "integer"
                                    : "int",
                                isPrimary: true,
                                isGenerated:
                                    connection.driver.options.type !==
                                    "spanner",
                                generationStrategy:
                                    connection.driver.options.type !== "spanner"
                                        ? "increment"
                                        : undefined,
                            },
                            {
                                name: "col1",
                                type: "varchar",
                                length: "255",
                            },
                            {
                                name: "col2",
                                type: "varchar",
                                length: "255",
                            },
                            {
                                name: "col3",
                                type: "varchar",
                                length: "255",
                            },
                            {
                                name: "col4",
                                type: "varchar",
                                length: "255",
                            },
                        ],
                    })

                    await queryRunner.createTable(table)

                    // Get the table to ensure it was created correctly
                    const createdTable = await queryRunner.getTable(
                        "test_drop_columns_array",
                    )
                    expect(createdTable!.columns).to.have.length(5) // id + 4 test columns

                    // Drop multiple columns at once - this tests the array modification bug fix
                    const columnsToRemove = ["col1", "col2", "col3", "col4"]
                    await queryRunner.dropColumns(
                        createdTable!,
                        columnsToRemove,
                    )

                    // Verify all columns were dropped (only 'id' should remain)
                    const updatedTable = await queryRunner.getTable(
                        "test_drop_columns_array",
                    )
                    expect(updatedTable!.columns).to.have.length(1)
                    expect(updatedTable!.columns[0].name).to.equal("id")

                    // Clean up
                    await queryRunner.dropTable("test_drop_columns_array")
                    await queryRunner.release()
                }),
            ))
    })
})
