import "reflect-metadata"
import { DataSource, TableColumn } from "../../../../../src"
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
                const queryRunner = dataSource.createQueryRunner()
                let table = await queryRunner.getTable("post")
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

                await queryRunner.release()
            }),
        ))

    it("should add generated column and revert add", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

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

                await queryRunner.release()
            }),
        ))

    it("should drop generated column and revert drop", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

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

                await queryRunner.release()
            }),
        ))

    it("should change generated column and revert change", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

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
