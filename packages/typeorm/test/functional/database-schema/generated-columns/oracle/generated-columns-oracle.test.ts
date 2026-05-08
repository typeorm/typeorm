import "reflect-metadata"
import type { DataSource } from "../../../../../src"
import { TableColumn } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { expect } from "chai"

describe("database schema > generated columns > oracle", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["oracle"],
            schemaCreate: true,
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
                await using queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                const virtualFullName =
                    table!.findColumnByName("virtualFullName")!
                const name = table!.findColumnByName("name")!
                const nameHash = table!.findColumnByName("nameHash")!

                virtualFullName.asExpression!.should.be.equal(
                    `CONCAT("firstName", "lastName")`,
                )
                virtualFullName.generatedType!.should.be.equal("VIRTUAL")

                name.asExpression!.should.be.equal(
                    `"firstName" || ' ' || "lastName"`,
                )
                name.generatedType!.should.be.equal("VIRTUAL")

                nameHash.asExpression!.should.be.equal(
                    `standard_hash(coalesce("firstName",'MD5'))`,
                )
                nameHash.generatedType!.should.be.equal("VIRTUAL")
                nameHash.length!.should.be.equal("255")
            }),
        ))

    it("should add generated column and revert add", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await using queryRunner = dataSource.createQueryRunner()

                let table = await queryRunner.getTable("post")

                let virtualColumn = new TableColumn({
                    name: "virtualColumn",
                    type: "varchar",
                    length: "600",
                    generatedType: "VIRTUAL",
                    asExpression: `"firstName" || '_' || "lastName"`,
                })

                await queryRunner.addColumn(table!, virtualColumn)

                table = await queryRunner.getTable("post")

                virtualColumn = table!.findColumnByName("virtualColumn")!
                virtualColumn.should.be.exist
                virtualColumn!.generatedType!.should.be.equal("VIRTUAL")
                virtualColumn!.asExpression!.should.be.equal(
                    `"firstName" || '_' || "lastName"`,
                )

                // revert changes
                await queryRunner.executeMemoryDownSql()

                table = await queryRunner.getTable("post")
                expect(table!.findColumnByName("virtualColumn")).to.be.undefined

                // check if generated column records removed from typeorm_metadata table
                const metadataRecords = await queryRunner.query(
                    `SELECT * FROM "typeorm_metadata" WHERE "table" = 'post' AND "name" = 'virtualColumn'`,
                )
                metadataRecords.length.should.be.equal(0)
            }),
        ))

    it("should drop generated column and revert drop", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await using queryRunner = dataSource.createQueryRunner()

                let table = await queryRunner.getTable("post")
                await queryRunner.dropColumn(table!, "virtualFullName")

                table = await queryRunner.getTable("post")
                expect(table!.findColumnByName("virtualFullName")).to.be
                    .undefined

                // check if generated column records removed from typeorm_metadata table
                const metadataRecords = await queryRunner.query(
                    `SELECT * FROM "typeorm_metadata" WHERE "table" = 'post' AND "name" = 'virtualFullName'`,
                )
                metadataRecords.length.should.be.equal(0)

                // revert changes
                await queryRunner.executeMemoryDownSql()

                table = await queryRunner.getTable("post")

                const virtualFullName =
                    table!.findColumnByName("virtualFullName")!
                virtualFullName.should.be.exist
                virtualFullName!.generatedType!.should.be.equal("VIRTUAL")
                virtualFullName!.asExpression!.should.be.equal(
                    `CONCAT("firstName", "lastName")`,
                )
            }),
        ))

    it("should change generated column and revert change", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await using queryRunner = dataSource.createQueryRunner()

                let table = await queryRunner.getTable("post")

                let virtualFullName =
                    table!.findColumnByName("virtualFullName")!
                const changedStoredFullName = virtualFullName.clone()
                changedStoredFullName.asExpression = `'Mr.' || "firstName" || ' ' || "lastName"`

                let name = table!.findColumnByName("name")!
                const changedName = name.clone()
                changedName.generatedType = undefined
                changedName.asExpression = undefined

                await queryRunner.changeColumns(table!, [
                    {
                        oldColumn: virtualFullName,
                        newColumn: changedStoredFullName,
                    },
                    { oldColumn: name, newColumn: changedName },
                ])

                table = await queryRunner.getTable("post")

                virtualFullName = table!.findColumnByName("virtualFullName")!
                virtualFullName!.asExpression!.should.be.equal(
                    `'Mr.' || "firstName" || ' ' || "lastName"`,
                )

                name = table!.findColumnByName("name")!
                expect(name!.generatedType).to.be.undefined
                expect(name!.asExpression).to.be.undefined

                // check if generated column records removed from typeorm_metadata table
                const metadataRecords = await queryRunner.query(
                    `SELECT * FROM "typeorm_metadata" WHERE "table" = 'post' AND "name" = 'name'`,
                )
                metadataRecords.length.should.be.equal(0)

                // revert changes
                await queryRunner.executeMemoryDownSql()

                table = await queryRunner.getTable("post")

                virtualFullName = table!.findColumnByName("virtualFullName")!
                virtualFullName!.asExpression!.should.be.equal(
                    `CONCAT("firstName", "lastName")`,
                )

                name = table!.findColumnByName("name")!
                name.generatedType!.should.be.equal("VIRTUAL")
                name.asExpression!.should.be.equal(
                    `"firstName" || ' ' || "lastName"`,
                )
            }),
        ))

    it("should rename generated column and revert rename", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await using queryRunner = dataSource.createQueryRunner()

                let table = await queryRunner.getTable("post")

                await queryRunner.renameColumn(
                    table!,
                    "virtualFullName",
                    "renamedVirtualFullName",
                )

                table = (await queryRunner.getTable("post"))!

                expect(table.findColumnByName("virtualFullName")).to.be
                    .undefined

                const renamedVirtualColumn = table.findColumnByName(
                    "renamedVirtualFullName",
                )!
                renamedVirtualColumn.generatedType!.should.be.equal("VIRTUAL")
                renamedVirtualColumn.asExpression!.should.be.equal(
                    `CONCAT("firstName", "lastName")`,
                )

                // check if generated column records removed from typeorm_metadata table
                let metadataRecords = await queryRunner.query(
                    `SELECT * FROM "typeorm_metadata" WHERE "table" = 'post' AND "name" = 'virtualFullName'`,
                )
                metadataRecords.length.should.be.equal(0)

                metadataRecords = await queryRunner.query(
                    `SELECT * FROM "typeorm_metadata" WHERE "table" = 'post' AND "name" = 'renamedVirtualFullName'`,
                )
                metadataRecords.length.should.be.equal(1)

                // revert changes
                await queryRunner.executeMemoryDownSql()

                table = (await queryRunner.getTable("post"))!

                const virtualFullName =
                    table.findColumnByName("virtualFullName")!
                virtualFullName!.generatedType!.should.be.equal("VIRTUAL")
                virtualFullName!.asExpression!.should.be.equal(
                    `CONCAT("firstName", "lastName")`,
                )

                expect(table.findColumnByName("renamedVirtualFullName")).to.be
                    .undefined
            }),
        ))

    it("should rename table with generated columns and revert rename", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await using queryRunner = dataSource.createQueryRunner()

                let table = await queryRunner.getTable("post")

                await queryRunner.renameTable(table!, "renamedPost")

                table = await queryRunner.getTable("renamedPost")

                const virtualFullName =
                    table!.findColumnByName("virtualFullName")!
                virtualFullName.generatedType!.should.be.equal("VIRTUAL")
                virtualFullName.asExpression!.should.be.equal(
                    `CONCAT("firstName", "lastName")`,
                )

                // check if generated column records removed from typeorm_metadata table
                let metadataRecords = await queryRunner.query(
                    `SELECT * FROM "typeorm_metadata" WHERE "table" = 'post'`,
                )
                metadataRecords.length.should.be.equal(0)

                metadataRecords = await queryRunner.query(
                    `SELECT * FROM "typeorm_metadata" WHERE "table" = 'renamedPost'`,
                )
                metadataRecords.length.should.be.equal(3)

                // revert changes
                await queryRunner.executeMemoryDownSql()

                table = (await queryRunner.getTable("post"))!

                const virtualFullName2 =
                    table.findColumnByName("virtualFullName")!
                virtualFullName2.generatedType!.should.be.equal("VIRTUAL")
                virtualFullName2.asExpression!.should.be.equal(
                    `CONCAT("firstName", "lastName")`,
                )

                expect(table.findColumnByName("renamedVirtualFullName")).to.be
                    .undefined
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
            }),
        ))
})
