import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    createTypeormMetadataTable,
} from "../../utils/test-utils"
import { TableColumn } from "../../../src"
import { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import { PostgresQueryRunner } from "../../../src/driver/postgres/PostgresQueryRunner"
import { DriverUtils } from "../../../src/driver/DriverUtils"
import { Table } from "../../../src/schema-builder/table/Table"

describe("query runner > change column > Postgres SQL memory", () => {
    it("should alter Postgres varchar length without recreating the column", async () => {
        const queryRunner = createPostgresQueryRunner()
        const table = new Table({
            name: "post",
            columns: [
                new TableColumn({
                    name: "title",
                    type: "character varying",
                    length: "50",
                }),
            ],
        })
        const newColumn = new TableColumn({
            name: "title",
            type: "character varying",
            length: "51",
        })

        queryRunner.enableSqlMemory()

        await queryRunner.changeColumn(table, table.columns[0], newColumn)

        const sqlInMemory = queryRunner.getMemorySql()
        const upQueries = sqlInMemory.upQueries.map(({ query }) => query)
        const downQueries = sqlInMemory.downQueries.map(({ query }) => query)

        expect(upQueries).to.deep.equal([
            'ALTER TABLE "post" ALTER COLUMN "title" TYPE character varying(51)',
        ])
        expect(downQueries).to.deep.equal([
            'ALTER TABLE "post" ALTER COLUMN "title" TYPE character varying(50)',
        ])
        expect(upQueries.join("\n")).not.to.include("DROP COLUMN")
        expect(upQueries.join("\n")).not.to.include("ADD")
    })

    it("should preserve Postgres varchar length when changing collation", async () => {
        const queryRunner = createPostgresQueryRunner()
        const table = new Table({
            name: "post",
            columns: [
                new TableColumn({
                    name: "title",
                    type: "character varying",
                    length: "50",
                    collation: "en_US",
                }),
            ],
        })
        const newColumn = new TableColumn({
            name: "title",
            type: "character varying",
            length: "51",
            collation: "fr_FR",
        })

        queryRunner.enableSqlMemory()

        await queryRunner.changeColumn(table, table.columns[0], newColumn)

        const sqlInMemory = queryRunner.getMemorySql()
        const upQueries = sqlInMemory.upQueries.map(({ query }) => query)
        const downQueries = sqlInMemory.downQueries.map(({ query }) => query)

        expect(upQueries).to.deep.equal([
            'ALTER TABLE "post" ALTER COLUMN "title" TYPE character varying(51)',
            'ALTER TABLE "post" ALTER COLUMN "title" TYPE character varying(51) COLLATE "fr_FR"',
        ])
        expect(downQueries).to.deep.equal([
            'ALTER TABLE "post" ALTER COLUMN "title" TYPE character varying(50)',
            'ALTER TABLE "post" ALTER COLUMN "title" TYPE character varying(50) COLLATE "en_US"',
        ])
    })
})

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

function createPostgresQueryRunner(): PostgresQueryRunner {
    const driver = Object.create(PostgresDriver.prototype) as PostgresDriver
    const dataSource = { driver }

    Object.assign(driver, {
        database: "typeorm_test",
        dataSource,
        schema: "public",
        searchSchema: "public",
        spatialTypes: ["geometry", "geography"],
    })

    return new PostgresQueryRunner(driver, "master")
}
