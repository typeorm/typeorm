import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    createTypeormMetadataTable,
} from "../../utils/test-utils"
import { TableColumn } from "../../../src"
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

    it("should use ALTER (not DROP+ADD) for length change and preserve row data", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // SQLite does not enforce length; any change recreates the table by design
                if (DriverUtils.isSQLiteFamily(dataSource.driver)) return
                // CockroachDB and Spanner do not allow changing primary key columns
                if (
                    dataSource.driver.options.type === "cockroachdb" ||
                    dataSource.driver.options.type === "spanner"
                )
                    return

                const queryRunner = dataSource.createQueryRunner()

                await queryRunner.query(
                    DriverUtils.isMySQLFamily(dataSource.driver)
                        ? "INSERT INTO `post` (`id`, `version`, `name`, `text`, `tag`) VALUES (900, 1, 'length_test', 'body', 'atag')"
                        : `INSERT INTO "post" ("id", "version", "name", "text", "tag") VALUES (900, 1, 'length_test', 'body', 'atag')`,
                )

                const table = await queryRunner.getTable("post")
                const nameColumn = table!.findColumnByName("name")!
                const changedColumn = nameColumn.clone()
                changedColumn.length = "500"

                queryRunner.enableSqlMemory()
                await queryRunner.changeColumn(
                    table!,
                    nameColumn,
                    changedColumn,
                )

                // Verify no DROP COLUMN was generated for the name column
                const memorySql = queryRunner.getMemorySql()
                const hasDropColumn = memorySql.upQueries.some(
                    (q) =>
                        q.query.includes("DROP COLUMN") &&
                        q.query.toLowerCase().includes("name"),
                )
                expect(hasDropColumn).to.be.false

                // Verify existing row data is intact
                const rows: { name: string }[] = await queryRunner.query(
                    DriverUtils.isMySQLFamily(dataSource.driver)
                        ? "SELECT `name` FROM `post` WHERE `id` = 900"
                        : `SELECT "name" FROM "post" WHERE "id" = 900`,
                )
                expect(rows).to.have.length(1)
                expect(rows[0].name).to.equal("length_test")

                await queryRunner.query(
                    DriverUtils.isMySQLFamily(dataSource.driver)
                        ? "DELETE FROM `post` WHERE `id` = 900"
                        : `DELETE FROM "post" WHERE "id" = 900`,
                )

                await queryRunner.executeMemoryDownSql()
                await queryRunner.release()
            }),
        ))

    it("should use ALTER (not DROP+ADD) for type change and preserve row data", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // SQLite recreates the table on any column change by design
                if (DriverUtils.isSQLiteFamily(dataSource.driver)) return
                // CockroachDB and Spanner do not allow changing primary key columns
                if (
                    dataSource.driver.options.type === "cockroachdb" ||
                    dataSource.driver.options.type === "spanner"
                )
                    return

                const queryRunner = dataSource.createQueryRunner()

                await queryRunner.query(
                    DriverUtils.isMySQLFamily(dataSource.driver)
                        ? "INSERT INTO `post` (`id`, `version`, `name`, `text`, `tag`) VALUES (901, 1, 'type_test', 'body', 'atag')"
                        : `INSERT INTO "post" ("id", "version", "name", "text", "tag") VALUES (901, 1, 'type_test', 'body', 'atag')`,
                )

                const table = await queryRunner.getTable("post")
                const textColumn = table!.findColumnByName("text")!
                const changedColumn = textColumn.clone()
                changedColumn.type = "text"
                changedColumn.length = ""

                queryRunner.enableSqlMemory()
                await queryRunner.changeColumn(
                    table!,
                    textColumn,
                    changedColumn,
                )

                const memorySql = queryRunner.getMemorySql()
                const hasDropColumn = memorySql.upQueries.some(
                    (q) =>
                        q.query.includes("DROP COLUMN") &&
                        q.query.toLowerCase().includes("text"),
                )
                expect(hasDropColumn).to.be.false

                const rows: { text: string }[] = await queryRunner.query(
                    DriverUtils.isMySQLFamily(dataSource.driver)
                        ? "SELECT `text` FROM `post` WHERE `id` = 901"
                        : `SELECT "text" FROM "post" WHERE "id" = 901`,
                )
                expect(rows).to.have.length(1)
                expect(rows[0].text).to.equal("body")

                await queryRunner.query(
                    DriverUtils.isMySQLFamily(dataSource.driver)
                        ? "DELETE FROM `post` WHERE `id` = 901"
                        : `DELETE FROM "post" WHERE "id" = 901`,
                )

                await queryRunner.executeMemoryDownSql()
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
