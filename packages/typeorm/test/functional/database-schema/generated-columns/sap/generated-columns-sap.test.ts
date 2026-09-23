import "reflect-metadata"
import type { DataSource } from "../../../../../src"
import { TableColumn } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { expect } from "chai"
import { Post } from "./entity/Post"

describe("database schema > generated columns > sap", () => {
    let dataSources: DataSource[]
    before(async function () {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["sap"],
            schemaCreate: true,
            dropSchema: true,
        })
        if (!dataSources.length) this.skip()
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
                try {
                    const table = await queryRunner.getTable("post")
                    const fullName = table?.findColumnByName("fullName")
                    const name = table?.findColumnByName("name")

                    fullName?.asExpression?.should.be.equal(
                        `"firstName" || ' ' || "lastName"`,
                    )

                    name?.asExpression?.should.be.equal(
                        `"firstName" || "lastName"`,
                    )

                    const repo = dataSource.getRepository(Post)

                    const post = new Post()
                    post.firstName = "Timber"
                    post.title = "About generated columns"
                    post.useTitle = true
                    post.lastName = "Saw"
                    await repo.save(post)

                    const loadedPost = await repo.findOneBy({ id: post.id })
                    loadedPost?.fullName?.should.be.equal("Timber Saw")
                    loadedPost?.name?.should.be.equal("TimberSaw")
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("should add generated column and revert add", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    let table = await queryRunner.getTable("post")

                    let nameWithoutSpace: TableColumn | undefined =
                        new TableColumn({
                            name: "nameWithoutSpace",
                            type: "varchar",
                            length: "200",
                            asExpression: `"firstName" || "lastName"`,
                        })

                    let nameWithSpace: TableColumn | undefined =
                        new TableColumn({
                            name: "nameWithSpace",
                            type: "varchar",
                            length: "200",
                            asExpression: `"firstName" || ' ' || "lastName"`,
                        })

                    let nameHash: TableColumn | undefined = new TableColumn({
                        name: "nameHash",
                        type: "varbinary",
                        length: "32",
                        asExpression: `HASH_MD5(TO_BINARY("firstName"))`,
                    })

                    if (table) {
                        await queryRunner.addColumn(table, nameWithoutSpace)
                        await queryRunner.addColumn(table, nameWithSpace)
                        await queryRunner.addColumn(table, nameHash)
                    }
                    table = await queryRunner.getTable("post")

                    nameWithoutSpace =
                        table?.findColumnByName("nameWithoutSpace")
                    expect(nameWithoutSpace).to.be.exist
                    nameWithoutSpace?.asExpression?.should.be.equal(
                        `"firstName" || "lastName"`,
                    )

                    nameWithSpace = table?.findColumnByName("nameWithSpace")
                    expect(nameWithSpace).to.be.exist
                    nameWithSpace?.asExpression?.should.be.equal(
                        `"firstName" || ' ' || "lastName"`,
                    )

                    nameHash = table?.findColumnByName("nameHash")
                    expect(nameHash).to.be.exist
                    nameHash?.asExpression?.should.be.equal(
                        `HASH_MD5(TO_BINARY("firstName"))`,
                    )

                    // revert changes
                    await queryRunner.executeMemoryDownSql()

                    table = await queryRunner.getTable("post")
                    expect(table?.findColumnByName("nameWithoutSpace")).to.be
                        .undefined
                    expect(table?.findColumnByName("nameWithSpace")).to.be
                        .undefined
                    expect(table?.findColumnByName("nameHash")).to.be.undefined

                    // check if generated column records removed from typeorm_metadata table
                    const metadataRecords = await queryRunner.query(
                        `SELECT * FROM "typeorm_metadata" WHERE "table" = 'post' AND "name" IN ('nameWithoutSpace', 'nameWithSpace', 'nameHash')`,
                    )
                    metadataRecords.length.should.be.equal(0)
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("should drop generated column and revert drop", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    let table = await queryRunner.getTable("post")
                    if (table) {
                        await queryRunner.dropColumn(table, "fullName")
                        await queryRunner.dropColumn(table, "name")
                    }

                    table = await queryRunner.getTable("post")
                    expect(table?.findColumnByName("fullName")).to.be.undefined
                    expect(table?.findColumnByName("name")).to.be.undefined

                    // check if generated column records removed from typeorm_metadata table
                    const metadataRecords = await queryRunner.query(
                        `SELECT * FROM "typeorm_metadata" WHERE "table" = 'post' AND "name" IN ('fullName', 'name')`,
                    )
                    metadataRecords.length.should.be.equal(0)

                    // revert changes
                    await queryRunner.executeMemoryDownSql()

                    table = await queryRunner.getTable("post")
                    const fullName = table?.findColumnByName("fullName")
                    expect(fullName).to.be.exist
                    fullName?.asExpression?.should.be.equal(
                        `"firstName" || ' ' || "lastName"`,
                    )

                    const name = table?.findColumnByName("name")
                    expect(name).to.be.exist
                    name?.asExpression?.should.be.equal(
                        `"firstName" || "lastName"`,
                    )
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("should change generated column and revert change", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    let table = await queryRunner.getTable("post")

                    let fullName = table?.findColumnByName("fullName")
                    const changedFullName = fullName?.clone()
                    if (changedFullName)
                        changedFullName.asExpression = `'Mr. ' || "firstName" || ' ' || "lastName"`

                    let name = table?.findColumnByName("name")
                    const changedName = name?.clone()
                    if (changedName) changedName.asExpression = undefined

                    if (
                        table &&
                        fullName &&
                        changedFullName &&
                        name &&
                        changedName
                    ) {
                        await queryRunner.changeColumns(table, [
                            {
                                oldColumn: fullName,
                                newColumn: changedFullName,
                            },
                            {
                                oldColumn: name,
                                newColumn: changedName,
                            },
                        ])
                    }

                    table = await queryRunner.getTable("post")

                    fullName = table?.findColumnByName("fullName")
                    fullName?.asExpression?.should.be.equal(
                        `'Mr. ' || "firstName" || ' ' || "lastName"`,
                    )

                    name = table?.findColumnByName("name")
                    expect(name?.asExpression).to.be.undefined

                    // check if generated column records removed from typeorm_metadata table
                    const metadataRecords = await queryRunner.query(
                        `SELECT * FROM "typeorm_metadata" WHERE "table" = 'post' AND "name" = 'name'`,
                    )
                    metadataRecords.length.should.be.equal(0)

                    // revert changes
                    await queryRunner.executeMemoryDownSql()

                    table = await queryRunner.getTable("post")

                    fullName = table?.findColumnByName("fullName")
                    fullName?.asExpression?.should.be.equal(
                        `"firstName" || ' ' || "lastName"`,
                    )

                    name = table?.findColumnByName("name")
                    name?.asExpression?.should.be.equal(
                        `"firstName" || "lastName"`,
                    )
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("should rename generated column metadata row and revert rename", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    let table = await queryRunner.getTable("post")
                    if (table)
                        await queryRunner.renameColumn(
                            table,
                            "fullName",
                            "fullNameRenamed",
                        )

                    table = await queryRunner.getTable("post")

                    const oldColumn = table?.findColumnByName("fullName")
                    expect(oldColumn).to.be.undefined

                    const renamedColumn =
                        table?.findColumnByName("fullNameRenamed")
                    expect(renamedColumn).to.exist
                    renamedColumn?.asExpression?.should.be.equal(
                        `"firstName" || ' ' || "lastName"`,
                    )

                    const oldMetadataRecords = await queryRunner.query(
                        `SELECT * FROM "typeorm_metadata" WHERE "table" = 'post' AND "name" = 'fullName'`,
                    )
                    oldMetadataRecords.length.should.be.equal(0)

                    const renamedMetadataRecords = await queryRunner.query(
                        `SELECT * FROM "typeorm_metadata" WHERE "table" = 'post' AND "name" = 'fullNameRenamed'`,
                    )
                    renamedMetadataRecords.length.should.be.equal(1)

                    // revert changes
                    await queryRunner.executeMemoryDownSql()

                    table = await queryRunner.getTable("post")

                    const revertedColumn = table?.findColumnByName("fullName")
                    expect(revertedColumn).to.exist
                    revertedColumn?.asExpression?.should.be.equal(
                        `"firstName" || ' ' || "lastName"`,
                    )
                    expect(table?.findColumnByName("fullNameRenamed")).to.be
                        .undefined

                    const revertedMetadataRecords = await queryRunner.query(
                        `SELECT * FROM "typeorm_metadata" WHERE "table" = 'post' AND "name" = 'fullName'`,
                    )
                    revertedMetadataRecords.length.should.be.equal(1)

                    const revertedRenamedMetadataRecords =
                        await queryRunner.query(
                            `SELECT * FROM "typeorm_metadata" WHERE "table" = 'post' AND "name" = 'fullNameRenamed'`,
                        )
                    revertedRenamedMetadataRecords.length.should.be.equal(0)
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("should rename table with generated columns and revert rename", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    let table = await queryRunner.getTable("post")
                    if (table)
                        await queryRunner.renameTable(table, "postRenamed")

                    table = await queryRunner.getTable("postRenamed")
                    expect(table).to.exist

                    const fullName = table?.findColumnByName("fullName")
                    expect(fullName).to.exist
                    fullName?.asExpression?.should.be.equal(
                        `"firstName" || ' ' || "lastName"`,
                    )

                    const name = table?.findColumnByName("name")
                    expect(name).to.exist
                    name?.asExpression?.should.be.equal(
                        `"firstName" || "lastName"`,
                    )

                    // check if generated column records exist in typeorm_metadata table with new table name
                    const metadataRecords = await queryRunner.query(
                        `SELECT * FROM "typeorm_metadata" WHERE "table" = 'postRenamed' AND "name" IN ('fullName', 'name')`,
                    )
                    metadataRecords.length.should.be.equal(2)

                    // revert changes
                    await queryRunner.executeMemoryDownSql()

                    table = await queryRunner.getTable("post")
                    expect(table).to.exist

                    const revertedFullName = table?.findColumnByName("fullName")
                    expect(revertedFullName).to.exist
                    revertedFullName?.asExpression?.should.be.equal(
                        `"firstName" || ' ' || "lastName"`,
                    )

                    const revertedName = table?.findColumnByName("name")
                    expect(revertedName).to.exist
                    revertedName?.asExpression?.should.be.equal(
                        `"firstName" || "lastName"`,
                    )

                    // check if generated column records exist in typeorm_metadata table with old table name
                    const revertedMetadataRecords = await queryRunner.query(
                        `SELECT * FROM "typeorm_metadata" WHERE "table" = 'post' AND "name" IN ('fullName', 'name')`,
                    )
                    revertedMetadataRecords.length.should.be.equal(2)
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("should remove data from 'typeorm_metadata' when table dropped", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    const table = await queryRunner.getTable("post")
                    const generatedColumns = table?.columns.filter(
                        (it) => it.asExpression,
                    )

                    if (table) await queryRunner.dropTable(table)

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
                    metadataRecords.length.should.be.equal(
                        generatedColumns?.length,
                    )
                } finally {
                    await queryRunner.release()
                }
            }),
        ))
})
