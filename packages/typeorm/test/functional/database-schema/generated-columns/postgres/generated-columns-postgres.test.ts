import "reflect-metadata"
import type { DataSource } from "../../../../../src"
import { TableColumn } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { expect } from "chai"
import { MetadataTableType } from "../../../../../src/driver/types/MetadataTableType"

describe("database schema > generated columns > postgres", () => {
    let dataSources: DataSource[]
    before(async function () {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
            schemaCreate: false,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                await using queryRunner = dataSource.createQueryRunner()
                await queryRunner.dropTable("test_schema.human", true)
            }),
        )
        await closeTestingConnections(dataSources)
    })

    it("should not generate queries when no model changes", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                sqlInMemory.upQueries.length.should.be.equal(0)
                sqlInMemory.downQueries.length.should.be.equal(0)
            }),
        ))

    it("should create table with generated columns", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await using queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")

                const checkGeneratedColumn = (
                    columnName: string,
                    asExpression: string,
                    generatedType: "STORED" | "VIRTUAL",
                ) => {
                    const column = table!.findColumnByName(columnName)!
                    column.should.be.exist
                    column!.generatedType!.should.be.equal(generatedType)
                    column!.asExpression!.should.be.equal(asExpression)
                }

                checkGeneratedColumn(
                    "storedFullName",
                    `"firstName" || "lastName"`,
                    "STORED",
                )
                checkGeneratedColumn(
                    "storedNameHash",
                    `md5(coalesce("firstName",'0'))`,
                    "STORED",
                )
                checkGeneratedColumn(
                    "virtualFullName",
                    `"firstName" || ' ' || "lastName"`,
                    "VIRTUAL",
                )
                checkGeneratedColumn(
                    "virtualNameHash",
                    `md5(coalesce("firstName",'0'))`,
                    "VIRTUAL",
                )

                const humanTable =
                    (await queryRunner.getTable("test_schema.human"))!
                const nameCol = humanTable.findColumnByName("name")!
                nameCol.generatedType!.should.be.equal("STORED")
                nameCol.asExpression!.should.be.equal(
                    `"firstName" || ' ' || "lastName"`,
                )

                const metadataRecords = await queryRunner.query(
                    `SELECT * FROM "typeorm_metadata" WHERE "table" = 'human' AND "schema" = 'test_schema'`,
                )
                metadataRecords.length.should.be.equal(1)
                metadataRecords[0].should.be.eql({
                    database: dataSource.options.database,
                    schema: humanTable.schema,
                    name: "name",
                    table: "human",
                    type: MetadataTableType.GENERATED_COLUMN,
                    value: `"firstName" || ' ' || "lastName"`,
                })
            }),
        ))

    it("should add generated column and revert add", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await using queryRunner = dataSource.createQueryRunner()

                let table = await queryRunner.getTable("post")

                const addAndRevert = async (TableColumn: TableColumn) => {
                    await queryRunner.addColumn(table!, TableColumn)

                    table = await queryRunner.getTable("post")

                    const addedColumn = table!.findColumnByName(
                        TableColumn.name,
                    )!
                    addedColumn.should.be.exist
                    addedColumn!.generatedType!.should.be.equal(
                        TableColumn.generatedType,
                    )
                    addedColumn!.asExpression!.should.be.equal(
                        TableColumn.asExpression,
                    )

                    // revert changes
                    await queryRunner.executeMemoryDownSql()

                    table = await queryRunner.getTable("post")
                    expect(table!.findColumnByName(TableColumn.name)).to.be
                        .undefined

                    // check if generated column records removed from typeorm_metadata table
                    const metadataRecords = await queryRunner.query(
                        `SELECT * FROM "typeorm_metadata" WHERE "table" = 'post' AND "name" = '${TableColumn.name}'`,
                    )
                    metadataRecords.length.should.be.equal(0)
                }

                await addAndRevert(
                    new TableColumn({
                        name: "addedStoredFullName",
                        type: "varchar",
                        asExpression: `"firstName" || "lastName"`,
                        generatedType: "STORED",
                    }),
                )
                await addAndRevert(
                    new TableColumn({
                        name: "addedVirtualFullName",
                        type: "varchar",
                        asExpression: `"firstName" || ' ' || "lastName"`,
                        generatedType: "VIRTUAL",
                    }),
                )

                await queryRunner.release()
            }),
        ))

    it("should drop generated column and revert drop", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await using queryRunner = dataSource.createQueryRunner()

                let table = await queryRunner.getTable("post")

                const dropAndRevert = async (
                    columnName: string,
                    generatedType: "STORED" | "VIRTUAL",
                    originalExpression: string,
                ) => {
                    await queryRunner.dropColumn(table!, columnName)

                    table = await queryRunner.getTable("post")
                    expect(table!.findColumnByName(columnName)).to.be.undefined

                    // check if generated column records removed from typeorm_metadata table
                    const metadataRecords = await queryRunner.query(
                        `SELECT * FROM "typeorm_metadata" WHERE "table" = 'post' AND "name" = '${columnName}'`,
                    )
                    metadataRecords.length.should.be.equal(0)

                    // revert changes
                    await queryRunner.executeMemoryDownSql()

                    table = await queryRunner.getTable("post")

                    const revertedColumn = table!.findColumnByName(columnName)!
                    revertedColumn.should.be.exist
                    revertedColumn!.generatedType!.should.be.equal(
                        generatedType,
                    )
                    revertedColumn!.asExpression!.should.be.equal(
                        originalExpression,
                    )
                }

                await dropAndRevert(
                    "storedFullName",
                    "STORED",
                    `"firstName" || "lastName"`,
                )
                await dropAndRevert(
                    "virtualFullName",
                    "VIRTUAL",
                    `"firstName" || ' ' || "lastName"`,
                )
            }),
        ))

    it("should change generated column and revert change", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await using queryRunner = dataSource.createQueryRunner()

                let table = await queryRunner.getTable("post")

                const changeAndRevert = async (
                    columnName: string,
                    newAsExpression: string,
                ) => {
                    const column = table!.findColumnByName(columnName)!
                    const changedColumn = column.clone()
                    changedColumn.asExpression = newAsExpression

                    await queryRunner.changeColumn(
                        table!,
                        column,
                        changedColumn,
                    )

                    table = await queryRunner.getTable("post")

                    const changedColumnFromDb =
                        table!.findColumnByName(columnName)!
                    changedColumnFromDb.should.be.exist
                    changedColumnFromDb!.asExpression!.should.be.equal(
                        newAsExpression,
                    )

                    // revert changes
                    await queryRunner.executeMemoryDownSql()

                    table = await queryRunner.getTable("post")

                    const revertedColumn = table!.findColumnByName(columnName)!
                    revertedColumn.should.be.exist
                    revertedColumn!.asExpression!.should.be.equal(
                        column.asExpression,
                    )
                }

                await changeAndRevert(
                    "storedFullName",
                    `"firstName" || ' ' || "lastName"`,
                )
                await changeAndRevert(
                    "virtualFullName",
                    `"firstName" || "lastName"`,
                )
            }),
        ))

    it("should rename generated column metadata row and revert rename", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await using queryRunner = dataSource.createQueryRunner()
                let table = await queryRunner.getTable("post")

                const name = table!.findColumnByName("name")!
                const changedName = name.clone()
                changedName.name = "nameChanged"

                await queryRunner.renameColumn(table!, name, changedName)

                table = await queryRunner.getTable("post")
                expect(table!.findColumnByName("name")).to.be.undefined
                const renamedColumn = table!.findColumnByName("nameChanged")!
                renamedColumn.should.be.exist
                renamedColumn.generatedType!.should.be.equal("STORED")
                renamedColumn.asExpression!.should.be.equal(
                    `"firstName" || "lastName"`,
                )

                let metadataRecords = await queryRunner.query(
                    `SELECT * FROM "typeorm_metadata" WHERE "table" = 'post' AND "name" = 'name'`,
                )
                metadataRecords.length.should.be.equal(0)

                metadataRecords = await queryRunner.query(
                    `SELECT * FROM "typeorm_metadata" WHERE "table" = 'post' AND "name" = 'nameChanged'`,
                )
                metadataRecords.length.should.be.equal(1)

                // revert changes
                await queryRunner.executeMemoryDownSql()

                table = await queryRunner.getTable("post")
                expect(table!.findColumnByName("nameChanged")).to.be.undefined
                const nameColumn = table!.findColumnByName("name")!
                nameColumn.should.be.exist
                nameColumn.generatedType!.should.be.equal("STORED")
                nameColumn.asExpression!.should.be.equal(
                    `"firstName" || "lastName"`,
                )
            }),
        ))

    it("should rename table with generated columns and revert rename", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await using queryRunner = dataSource.createQueryRunner()
                let table = await queryRunner.getTable("post")

                await queryRunner.renameTable(table!, "postRenamed")

                table = await queryRunner.getTable("postRenamed")
                expect(table).to.be.exist

                const storedFullName =
                    table!.findColumnByName("storedFullName")!
                storedFullName.should.be.exist
                storedFullName!.generatedType!.should.be.equal("STORED")
                storedFullName!.asExpression!.should.be.equal(
                    `' ' || COALESCE("firstName", '') || ' ' || COALESCE("lastName", '')`,
                )

                let metadataRecords = await queryRunner.query(
                    `SELECT * FROM "typeorm_metadata" WHERE "table" = 'post'`,
                )
                metadataRecords.length.should.be.equal(0)

                metadataRecords = await queryRunner.query(
                    `SELECT * FROM "typeorm_metadata" WHERE "table" = 'postRenamed'`,
                )
                metadataRecords.length.should.be.equal(3)

                // revert changes
                await queryRunner.executeMemoryDownSql()

                table = await queryRunner.getTable("post")
                expect(table).to.be.exist

                const storedFullNameAfterRevert =
                    table!.findColumnByName("storedFullName")!
                storedFullNameAfterRevert.should.be.exist
                storedFullNameAfterRevert.generatedType!.should.be.equal(
                    "STORED",
                )
                storedFullNameAfterRevert.asExpression!.should.be.equal(
                    `' ' || COALESCE("firstName", '') || ' ' || COALESCE("lastName", '')`,
                )
            }),
        ))

    it("should remove data from 'typeorm_metadata' when table dropped", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await using queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                const generatedColumns = table!.columns.filter(
                    (it) => it.generatedType,
                )

                await queryRunner.dropTable(table!)

                let metadataRecords = await queryRunner.query(
                    `SELECT * FROM "typeorm_metadata" WHERE "table" = 'post'`,
                )
                metadataRecords.length.should.be.equal(0)

                // revert changes
                await queryRunner.executeMemoryDownSql()

                metadataRecords = await queryRunner.query(
                    `SELECT * FROM "typeorm_metadata" WHERE "table" = 'post'`,
                )
                metadataRecords.length.should.be.equal(generatedColumns.length)
            }),
        ))
})
