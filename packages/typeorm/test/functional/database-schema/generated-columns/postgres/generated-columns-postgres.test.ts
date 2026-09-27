import "reflect-metadata"
import type { DataSource } from "../../../../../src"
import { TableColumn } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { expect } from "chai"

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
    after(() => closeTestingConnections(dataSources))

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
                const queryRunner = dataSource.createQueryRunner()
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

                await queryRunner.release()
            }),
        ))

    it("should add generated column and revert add", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

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
                const queryRunner = dataSource.createQueryRunner()

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

                await queryRunner.release()
            }),
        ))

    it("should change generated column and revert change", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

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

                await queryRunner.release()
            }),
        ))

    it("should remove data from 'typeorm_metadata' when table dropped", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                const generatedColumns = table!.columns.filter(
                    (it) => it.generatedType,
                )

                await queryRunner.dropTable(table!)

                // check if generated column records removed from typeorm_metadata table
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

                await queryRunner.release()
            }),
        ))
})
