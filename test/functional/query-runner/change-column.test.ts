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
            disabledDrivers: ["spanner"],
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

    it("should alter postgres varchar length without losing column data", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (dataSource.driver.options.type !== "postgres") return

                let queryRunner = dataSource.createQueryRunner()

                await queryRunner.createTable(
                    new Table({
                        name: "change_column_varchar_length_post",
                        columns: [
                            {
                                name: "id",
                                type: "integer",
                                isPrimary: true,
                            },
                            {
                                name: "name",
                                type: "varchar",
                                length: "50",
                            },
                        ],
                    }),
                )
                await queryRunner.query(
                    `INSERT INTO "change_column_varchar_length_post"("id", "name") VALUES (1, 'hello')`,
                )

                let table = await queryRunner.getTable(
                    "change_column_varchar_length_post",
                )
                const oldColumn = table!.findColumnByName("name")!
                const newColumn = oldColumn.clone()
                newColumn.type = "varchar"
                newColumn.length = "51"

                queryRunner.enableSqlMemory()
                await queryRunner.changeColumn(table!, oldColumn, newColumn)

                const upQueries = queryRunner
                    .getMemorySql()
                    .upQueries.map(({ query }) => query)
                expect(upQueries).to.deep.equal([
                    `ALTER TABLE "change_column_varchar_length_post" ALTER COLUMN "name" TYPE varchar(51)`,
                ])
                queryRunner.disableSqlMemory()
                await queryRunner.release()

                queryRunner = dataSource.createQueryRunner()
                table = await queryRunner.getTable(
                    "change_column_varchar_length_post",
                )
                await queryRunner.changeColumn(
                    table!,
                    table!.findColumnByName("name")!,
                    new TableColumn({
                        ...table!.findColumnByName("name")!,
                        type: "varchar",
                        length: "51",
                    }),
                )

                const rows = await queryRunner.query(
                    `SELECT "name" FROM "change_column_varchar_length_post" WHERE "id" = 1`,
                )
                expect(rows).to.deep.equal([{ name: "hello" }])

                table = await queryRunner.getTable(
                    "change_column_varchar_length_post",
                )
                expect(table!.findColumnByName("name")!.length).to.equal("51")

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
})
