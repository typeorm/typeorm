import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    createTypeormMetadataTable,
} from "../../utils/test-utils"
import { Table, TableColumn } from "../../../src"
import type { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import { DriverUtils } from "../../../src/driver/DriverUtils"

describe("query runner > change column", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should correctly change column and revert change", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // CockroachDB and Spanner does not allow changing primary columns and renaming constraints
                if (
                    dataSource.driver.options.type === "cockroachdb" ||
                    dataSource.driver.options.type === "spanner"
                )
                    return

                const queryRunner = dataSource.createQueryRunner()
                let table = await queryRunner.getTable("post")

                const nameColumn = table!.findColumnByName("name")!

                nameColumn!.isUnique.should.be.false
                nameColumn!.default!.should.exist

                const changedNameColumn = nameColumn.clone()
                changedNameColumn.default = undefined
                changedNameColumn.isUnique = true
                changedNameColumn.isNullable = true
                changedNameColumn.length = "500"
                await queryRunner.changeColumn(
                    table!,
                    nameColumn,
                    changedNameColumn,
                )

                table = await queryRunner.getTable("post")
                expect(table!.findColumnByName("name")!.default).to.be.undefined
                table!.findColumnByName("name")!.isUnique.should.be.true
                table!.findColumnByName("name")!.isNullable.should.be.true

                // SQLite does not impose any length restrictions
                if (!DriverUtils.isSQLiteFamily(dataSource.driver)) {
                    table!
                        .findColumnByName("name")!
                        .length!.should.be.equal("500")
                }

                const textColumn = table!.findColumnByName("text")!
                const changedTextColumn = textColumn.clone()
                changedTextColumn.name = "description"
                changedTextColumn.isPrimary = true
                changedTextColumn.default = "'default text'"
                await queryRunner.changeColumn(
                    table!,
                    textColumn,
                    changedTextColumn,
                )

                // column name was changed to 'description'
                table = await queryRunner.getTable("post")
                table!.findColumnByName("description")!.isPrimary.should.be.true
                table!.findColumnByName("description")!.default!.should.exist

                const idColumn = table!.findColumnByName("id")!
                const changedIdColumn = idColumn.clone()
                changedIdColumn!.isPrimary = false
                await queryRunner.changeColumn(
                    table!,
                    idColumn,
                    changedIdColumn,
                )

                table = await queryRunner.getTable("post")
                table!.findColumnByName("id")!.isPrimary.should.be.false

                await queryRunner.executeMemoryDownSql()

                table = await queryRunner.getTable("post")
                table!.findColumnByName("id")!.isPrimary.should.be.true
                table!.findColumnByName("name")!.default!.should.exist
                table!.findColumnByName("name")!.isUnique.should.be.false
                table!.findColumnByName("name")!.isNullable.should.be.false
                table!.findColumnByName("text")!.isPrimary.should.be.false
                expect(table!.findColumnByName("text")!.default).to.be.undefined

                await queryRunner.release()
            }),
        ))

    it("should correctly change column 'isGenerated' property and revert change", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // CockroachDB and Spanner does not allow changing generated columns in existent tables
                if (
                    dataSource.driver.options.type === "cockroachdb" ||
                    dataSource.driver.options.type === "spanner"
                )
                    return

                const queryRunner = dataSource.createQueryRunner()
                let table = await queryRunner.getTable("post")
                let idColumn = table!.findColumnByName("id")!
                let changedIdColumn = idColumn.clone()

                changedIdColumn.isGenerated = true
                changedIdColumn.generationStrategy = "increment"
                await queryRunner.changeColumn(
                    table!,
                    idColumn,
                    changedIdColumn,
                )

                table = await queryRunner.getTable("post")
                table!.findColumnByName("id")!.isGenerated.should.be.true
                table!
                    .findColumnByName("id")!
                    .generationStrategy!.should.be.equal("increment")

                await queryRunner.executeMemoryDownSql()
                queryRunner.clearSqlMemory()

                table = await queryRunner.getTable("post")
                table!.findColumnByName("id")!.isGenerated.should.be.false
                expect(table!.findColumnByName("id")!.generationStrategy).to.be
                    .undefined

                table = await queryRunner.getTable("post")
                idColumn = table!.findColumnByName("id")!
                changedIdColumn = idColumn.clone()
                changedIdColumn.isPrimary = false
                await queryRunner.changeColumn(
                    table!,
                    idColumn,
                    changedIdColumn,
                )

                // check case when both primary and generated properties set to true
                table = await queryRunner.getTable("post")
                idColumn = table!.findColumnByName("id")!
                changedIdColumn = idColumn.clone()
                changedIdColumn.isPrimary = true
                changedIdColumn.isGenerated = true
                changedIdColumn.generationStrategy = "increment"
                await queryRunner.changeColumn(
                    table!,
                    idColumn,
                    changedIdColumn,
                )

                table = await queryRunner.getTable("post")
                table!.findColumnByName("id")!.isGenerated.should.be.true
                table!
                    .findColumnByName("id")!
                    .generationStrategy!.should.be.equal("increment")

                await queryRunner.executeMemoryDownSql()
                queryRunner.clearSqlMemory()

                table = await queryRunner.getTable("post")
                table!.findColumnByName("id")!.isGenerated.should.be.false
                expect(table!.findColumnByName("id")!.generationStrategy).to.be
                    .undefined

                await queryRunner.release()
            }),
        ))

    it("should correctly change generated as expression", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const isPostgres = dataSource.driver.options.type === "postgres"
                const isSpanner = dataSource.driver.options.type === "spanner"
                const shouldRun =
                    (isPostgres &&
                        (dataSource.driver as PostgresDriver)
                            .isGeneratedColumnsSupported) ||
                    isSpanner
                if (!shouldRun) return

                const queryRunner = dataSource.createQueryRunner()

                await createTypeormMetadataTable(dataSource.driver, queryRunner)

                // Database is running < postgres 12
                if (
                    !(dataSource.driver as PostgresDriver)
                        .isGeneratedColumnsSupported
                )
                    return

                let generatedColumn = new TableColumn({
                    name: "generated",
                    type: isSpanner ? "string" : "varchar",
                    generatedType: "STORED",
                    asExpression: "text || tag",
                })

                let table = await queryRunner.getTable("post")

                await queryRunner.addColumn(table!, generatedColumn)

                table = await queryRunner.getTable("post")

                generatedColumn = table!.findColumnByName("generated")!
                generatedColumn!.generatedType!.should.be.equals("STORED")
                generatedColumn!.asExpression!.should.be.equals("text || tag")

                let changedGeneratedColumn = generatedColumn.clone()
                changedGeneratedColumn.asExpression = "text || tag || name"

                await queryRunner.changeColumn(
                    table!,
                    generatedColumn,
                    changedGeneratedColumn,
                )

                table = await queryRunner.getTable("post")
                generatedColumn = table!.findColumnByName("generated")!
                generatedColumn!.generatedType!.should.be.equals("STORED")
                generatedColumn!.asExpression!.should.be.equals(
                    "text || tag || name",
                )

                changedGeneratedColumn = generatedColumn.clone()
                delete changedGeneratedColumn.generatedType
                await queryRunner.changeColumn(
                    table!,
                    generatedColumn,
                    changedGeneratedColumn,
                )

                table = await queryRunner.getTable("post")
                generatedColumn = table!.findColumnByName("generated")!
                generatedColumn!.should.not.haveOwnProperty("generatedType")
                generatedColumn!.should.not.haveOwnProperty("asExpression")

                changedGeneratedColumn = generatedColumn.clone()
                changedGeneratedColumn.asExpression = "text || tag || name"
                changedGeneratedColumn.generatedType = "STORED"
                await queryRunner.changeColumn(
                    table!,
                    generatedColumn,
                    changedGeneratedColumn,
                )

                table = await queryRunner.getTable("post")
                generatedColumn = table!.findColumnByName("generated")!
                generatedColumn!.generatedType!.should.be.equals("STORED")
                generatedColumn!.asExpression!.should.be.equals(
                    "text || tag || name",
                )
            }),
        ))

    it("should preserve data when changing column type or length (issue #3357)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Spanner does not support column type changes in place
                if (dataSource.driver.options.type === "spanner") return
                // MSSQL and SAP cannot ADD a NOT NULL column to a non-empty table;
                // their ALTER support is tracked separately.
                if (
                    dataSource.driver.options.type === "mssql" ||
                    dataSource.driver.options.type === "sap"
                )
                    return

                const queryRunner = dataSource.createQueryRunner()

                // Create a fresh test table with a varchar column
                await queryRunner.createTable(
                    new Table({
                        name: "issue_3357",
                        columns: [
                            new TableColumn({
                                name: "id",
                                type: "int",
                                isPrimary: true,
                            }),
                            new TableColumn({
                                name: "description",
                                type: "varchar",
                                length: "50",
                                isNullable: false,
                            }),
                        ],
                    }),
                    true,
                )

                // Insert a row to verify data is preserved after type change.
                // Use unquoted identifiers so the query works across all drivers.
                await queryRunner.query(
                    `INSERT INTO issue_3357 (id, description) VALUES (1, 'hello')`,
                )

                let table = await queryRunner.getTable("issue_3357")
                const originalColumn = table!.findColumnByName("description")!

                // Change the column length: varchar(50) → varchar(100)
                const widenedColumn = originalColumn.clone()
                widenedColumn.length = "100"
                await queryRunner.changeColumn(
                    table!,
                    originalColumn,
                    widenedColumn,
                )

                // Schema should reflect the new length
                table = await queryRunner.getTable("issue_3357")
                if (!DriverUtils.isSQLiteFamily(dataSource.driver)) {
                    table!
                        .findColumnByName("description")!
                        .length!.should.be.equal("100")
                }

                // Data must be preserved — the ALTER must not have dropped the column
                const rows = await queryRunner.query(
                    `SELECT * FROM issue_3357 WHERE id = 1`,
                )
                rows.length.should.be.equal(1)
                // Oracle returns column names in uppercase; normalise for comparison.
                const descVal =
                    rows[0]["description"] ?? rows[0]["DESCRIPTION"]
                descVal.should.be.equal("hello")

                await queryRunner.dropTable("issue_3357")
                await queryRunner.release()
            }),
        ))

    it("should preserve data when renaming a column and changing its type simultaneously (issue #3357)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Only MySQL-family supports atomic rename+type in one CHANGE statement;
                // other drivers handle them as sequential safe operations.
                // Spanner cannot rename columns without recreation.
                if (dataSource.driver.options.type === "spanner") return
                // MSSQL and SAP cannot ADD a NOT NULL column to a non-empty table;
                // their ALTER support is tracked separately.
                if (
                    dataSource.driver.options.type === "mssql" ||
                    dataSource.driver.options.type === "sap"
                )
                    return

                const queryRunner = dataSource.createQueryRunner()

                await queryRunner.createTable(
                    new Table({
                        name: "issue_3357_rename",
                        columns: [
                            new TableColumn({
                                name: "id",
                                type: "int",
                                isPrimary: true,
                            }),
                            new TableColumn({
                                name: "old_col",
                                type: "varchar",
                                length: "50",
                                isNullable: false,
                            }),
                        ],
                    }),
                    true,
                )

                // Use unquoted identifiers so the query works across all drivers.
                await queryRunner.query(
                    `INSERT INTO issue_3357_rename (id, old_col) VALUES (1, 'world')`,
                )

                let table = await queryRunner.getTable("issue_3357_rename")
                const originalColumn = table!.findColumnByName("old_col")!

                // Rename AND widen in one operation
                const renamedColumn = originalColumn.clone()
                renamedColumn.name = "new_col"
                renamedColumn.length = "200"
                await queryRunner.changeColumn(
                    table!,
                    originalColumn,
                    renamedColumn,
                )

                table = await queryRunner.getTable("issue_3357_rename")
                expect(table!.findColumnByName("old_col")).to.be.undefined
                expect(table!.findColumnByName("new_col")).to.not.be.undefined
                if (!DriverUtils.isSQLiteFamily(dataSource.driver)) {
                    table!
                        .findColumnByName("new_col")!
                        .length!.should.be.equal("200")
                }

                // Data must be preserved
                const rows = await queryRunner.query(
                    `SELECT * FROM issue_3357_rename WHERE id = 1`,
                )
                rows.length.should.be.equal(1)
                // Oracle returns column names in uppercase; normalise for comparison.
                const newColVal =
                    rows[0]["new_col"] ?? rows[0]["NEW_COL"]
                newColVal.should.be.equal("world")

                await queryRunner.dropTable("issue_3357_rename")
                await queryRunner.release()
            }),
        ))
})
