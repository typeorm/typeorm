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

describe("database schema > generated columns > cockroachdb", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["cockroachdb"],
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
                const virtualFullName =
                    table!.findColumnByName("virtualFullName")!
                const storedFullName =
                    table!.findColumnByName("storedFullName")!
                const name = table!.findColumnByName("name")!
                const nameHash = table!.findColumnByName("nameHash")!

                virtualFullName.asExpression!.should.be.equal(
                    `concat("firstName",' ',"lastName")`,
                )
                virtualFullName.generatedType!.should.be.equal("VIRTUAL")
                storedFullName.asExpression!.should.be.equal(
                    `CONCAT("firstName",' ',"lastName")`,
                )
                storedFullName.generatedType!.should.be.equal("STORED")

                name.generatedType!.should.be.equal("STORED")
                name.asExpression!.should.be.equal(`"firstName" || "lastName"`)

                nameHash.generatedType!.should.be.equal("VIRTUAL")
                nameHash.asExpression!.should.be.equal(
                    `md5(coalesce("firstName",'0'))`,
                )
                nameHash.length!.should.be.equal("255")

                const humanTable =
                    (await queryRunner.getTable("test_schema.human"))!
                const nameCol = humanTable.findColumnByName("name")!
                nameCol.asExpression!.should.be.equal(
                    `"firstName" || ' ' || "lastName"`,
                )
                nameCol.generatedType!.should.be.equal("STORED")

                const metadataRecords = await queryRunner.query(
                    `SELECT * FROM "typeorm_metadata" WHERE "table" = 'human' AND "schema" = 'test_schema'`,
                )
                metadataRecords.length.should.be.equal(1)
                metadataRecords[0].should.be.eql({
                    database: null,
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

                let storedColumn = new TableColumn({
                    name: "storedColumn",
                    type: "varchar",
                    length: "200",
                    generatedType: "STORED",
                    asExpression: `"firstName" || "lastName"`,
                })

                let virtualColumn = new TableColumn({
                    name: "virtualColumn",
                    type: "varchar",
                    length: "200",
                    generatedType: "VIRTUAL",
                    asExpression: `"firstName" || "lastName"`,
                })

                await queryRunner.addColumn(table!, storedColumn)
                await queryRunner.addColumn(table!, virtualColumn)

                table = await queryRunner.getTable("post")

                storedColumn = table!.findColumnByName("storedColumn")!
                storedColumn.should.be.exist
                storedColumn!.generatedType!.should.be.equal("STORED")
                storedColumn!.asExpression!.should.be.equal(
                    `"firstName" || "lastName"`,
                )

                virtualColumn = table!.findColumnByName("virtualColumn")!
                virtualColumn.should.be.exist
                virtualColumn!.generatedType!.should.be.equal("VIRTUAL")
                virtualColumn!.asExpression!.should.be.equal(
                    `"firstName" || "lastName"`,
                )

                // revert changes
                await queryRunner.executeMemoryDownSql()

                table = await queryRunner.getTable("post")
                expect(table!.findColumnByName("storedColumn")).to.be.undefined
                expect(table!.findColumnByName("virtualColumn")).to.be.undefined

                // check if generated column records removed from typeorm_metadata table
                const metadataRecords = await queryRunner.query(
                    `SELECT * FROM "typeorm_metadata" WHERE "table" = 'post' AND "name" IN ('storedColumn', 'virtualColumn')`,
                )
                metadataRecords.length.should.be.equal(0)
            }),
        ))

    it("should drop generated column and revert drop", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await using queryRunner = dataSource.createQueryRunner()

                let table = await queryRunner.getTable("post")
                await queryRunner.dropColumn(table!, "storedFullName")
                await queryRunner.dropColumn(table!, "virtualFullName")

                table = await queryRunner.getTable("post")
                expect(table!.findColumnByName("storedFullName")).to.be
                    .undefined
                expect(table!.findColumnByName("virtualFullName")).to.be
                    .undefined

                // check if generated column records removed from typeorm_metadata table
                const metadataRecords = await queryRunner.query(
                    `SELECT * FROM "typeorm_metadata" WHERE "table" = 'post' AND "name" IN ('storedFullName', 'virtualFullName')`,
                )
                metadataRecords.length.should.be.equal(0)

                // revert changes
                await queryRunner.executeMemoryDownSql()

                table = await queryRunner.getTable("post")

                const storedFullName =
                    table!.findColumnByName("storedFullName")!
                storedFullName.should.be.exist
                storedFullName!.generatedType!.should.be.equal("STORED")
                storedFullName!.asExpression!.should.be.equal(
                    `CONCAT("firstName",' ',"lastName")`,
                )

                const virtualFullName =
                    table!.findColumnByName("virtualFullName")!
                virtualFullName.should.be.exist
                virtualFullName!.generatedType!.should.be.equal("VIRTUAL")
                virtualFullName!.asExpression!.should.be.equal(
                    `concat("firstName",' ',"lastName")`,
                )
            }),
        ))

    it("should change generated column and revert change", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await using queryRunner = dataSource.createQueryRunner()

                let table = await queryRunner.getTable("post")

                let storedFullName = table!.findColumnByName("storedFullName")!
                const changedStoredFullName = storedFullName.clone()
                changedStoredFullName.asExpression = `concat('Mr. ',"firstName",' ',"lastName")`

                let name = table!.findColumnByName("name")!
                const changedName = name.clone()
                changedName.generatedType = undefined
                changedName.asExpression = undefined

                await queryRunner.changeColumns(table!, [
                    {
                        oldColumn: storedFullName,
                        newColumn: changedStoredFullName,
                    },
                    { oldColumn: name, newColumn: changedName },
                ])

                table = await queryRunner.getTable("post")

                storedFullName = table!.findColumnByName("storedFullName")!
                storedFullName!.asExpression!.should.be.equal(
                    `concat('Mr. ',"firstName",' ',"lastName")`,
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

                storedFullName = table!.findColumnByName("storedFullName")!
                storedFullName!.asExpression!.should.be.equal(
                    `CONCAT("firstName",' ',"lastName")`,
                )

                name = table!.findColumnByName("name")!
                name.generatedType!.should.be.equal("STORED")
                name.asExpression!.should.be.equal(`"firstName" || "lastName"`)
            }),
        ))

    it("should rename generated column and revert rename", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await using queryRunner = dataSource.createQueryRunner()
                let table = await queryRunner.getTable("post")

                const name = table!.findColumnByName("name")!
                const changedName = name.clone()
                changedName.name = "nameChanged"

                await queryRunner.renameColumn(table!, name, "nameChanged")

                table = await queryRunner.getTable("post")
                expect(table!.findColumnByName("name")).to.be.undefined
                const renamedColumn = table!.findColumnByName("nameChanged")!
                renamedColumn.generatedType!.should.be.equal("STORED")
                renamedColumn.asExpression!.should.be.equal(
                    `"firstName" || "lastName"`,
                )

                // check if generated column records removed from typeorm_metadata table
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

                const storedFullName =
                    table!.findColumnByName("storedFullName")!
                storedFullName!.generatedType!.should.be.equal("STORED")
                storedFullName!.asExpression!.should.be.equal(
                    `CONCAT("firstName",' ',"lastName")`,
                )

                // check if generated column records removed from typeorm_metadata table
                let metadataRecords = await queryRunner.query(
                    `SELECT * FROM "typeorm_metadata" WHERE "table" = 'post'`,
                )
                metadataRecords.length.should.be.equal(0)

                metadataRecords = await queryRunner.query(
                    `SELECT * FROM "typeorm_metadata" WHERE "table" = 'postRenamed'`,
                )
                metadataRecords.length.should.be.equal(4)

                // revert changes
                await queryRunner.executeMemoryDownSql()

                table = await queryRunner.getTable("post")

                const storedFullNameAfterRevert =
                    table!.findColumnByName("storedFullName")!
                storedFullNameAfterRevert.should.be.exist
                storedFullNameAfterRevert!.generatedType!.should.be.equal(
                    "STORED",
                )
                storedFullNameAfterRevert!.asExpression!.should.be.equal(
                    `CONCAT("firstName",' ',"lastName")`,
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
