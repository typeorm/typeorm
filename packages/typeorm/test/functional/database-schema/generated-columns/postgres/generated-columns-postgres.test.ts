import "reflect-metadata"
import { DataSource } from "../../../../../src"
import { TableColumn } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
    setupSingleTestingConnection,
} from "../../../../utils/test-utils"
import { VersionUtils } from "../../../../../src/util/VersionUtils"
import { Robot } from "./entity/Robot"
import {
    addAndRevert,
    changeAndRevert,
    changeType,
    checkGeneratedColumn,
    dropAndRevert,
} from "./helper"
import { Post } from "./entity/Post"

describe("database schema > generated columns > postgres", () => {
    describe("VIRTUAL", () => {
        let dataSources: DataSource[] = []
        before(async function () {
            const options = setupSingleTestingConnection("postgres", {
                entities: [Robot],
                schemaCreate: true,
                dropSchema: true,
            })

            if (!options) return

            dataSources = [new DataSource(options)]
            try {
                await dataSources[0].initialize()
            } catch (err) {
                const version = dataSources[0].driver.version
                const isVirtualColumnsSupported = VersionUtils.isGreaterOrEqual(
                    version,
                    "18.0",
                )
                if (!isVirtualColumnsSupported) {
                    this.skip()
                } else {
                    throw err
                }
            }
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
                    const table = await queryRunner.getTable("robot")

                    checkGeneratedColumn(
                        table!,
                        "storedFullName",
                        `"name" || '-' || "model"`,
                        "STORED",
                    )
                    checkGeneratedColumn(
                        table!,
                        "virtualFullName",
                        `"name" || '---' || "model"`,
                        "VIRTUAL",
                    )
                }),
            ))

        it("should add generated column and revert add", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await using queryRunner = dataSource.createQueryRunner()

                    const table = await queryRunner.getTable("robot")

                    await addAndRevert(
                        queryRunner,
                        table,
                        "robot",
                        new TableColumn({
                            name: "addedVirtualFullName",
                            type: "varchar",
                            asExpression: `"name" || ' ' || "model"`,
                            generatedType: "VIRTUAL",
                        }),
                    )
                }),
            ))

        it("should drop generated column and revert drop", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await using queryRunner = dataSource.createQueryRunner()

                    const table = await queryRunner.getTable("robot")

                    await dropAndRevert(
                        queryRunner,
                        table,
                        "robot",
                        "storedFullName",
                        "STORED",
                        `"name" || '-' || "model"`,
                    )
                }),
            ))

        it("should change generated column expression and revert change", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await using queryRunner = dataSource.createQueryRunner()

                    const table = await queryRunner.getTable("robot")

                    const version = dataSource.driver.version
                    const isBelowVersion17 =
                        VersionUtils.isGreaterOrEqual(version, "17") === false

                    await changeAndRevert(
                        table,
                        "robot",
                        queryRunner,
                        "virtualFullName",
                        `"name"`,
                        isBelowVersion17,
                    )
                }),
            ))

        it("should change generated column type and revert change", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await using queryRunner = dataSource.createQueryRunner()

                    const table = await queryRunner.getTable("robot")

                    await changeType(
                        table,
                        "robot",
                        queryRunner,
                        "virtualFullName",
                        "STORED",
                    )
                    await changeType(
                        table,
                        "robot",
                        queryRunner,
                        "virtualFullName",
                        undefined,
                    )
                }),
            ))
        it("should remove data from 'typeorm_metadata' when table dropped", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await using queryRunner = dataSource.createQueryRunner()
                    const table = await queryRunner.getTable("robot")
                    const generatedColumns = table!.columns.filter(
                        (it) => it.generatedType,
                    )

                    await queryRunner.dropTable(table!)

                    // check if generated column records removed from typeorm_metadata table
                    let metadataRecords = await queryRunner.query(
                        `SELECT * FROM "typeorm_metadata" WHERE "table" = 'robot'`,
                    )
                    metadataRecords.length.should.be.equal(0)

                    // revert changes
                    await queryRunner.executeMemoryDownSql()

                    metadataRecords = await queryRunner.query(
                        `SELECT * FROM "typeorm_metadata" WHERE "table" = 'robot'`,
                    )
                    metadataRecords.length.should.be.equal(
                        generatedColumns.length,
                    )
                }),
            ))
    })

    describe("STORED", () => {
        let dataSources: DataSource[]
        before(async function () {
            dataSources = await createTestingConnections({
                entities: [Post],
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
                    await using queryRunner = dataSource.createQueryRunner()
                    const table = await queryRunner.getTable("post")

                    checkGeneratedColumn(
                        table!,
                        "storedFullName",
                        `"firstName" || "lastName"`,
                        "STORED",
                    )
                    checkGeneratedColumn(
                        table!,
                        "storedNameHash",
                        `md5(coalesce("firstName",'0'))`,
                        "STORED",
                    )
                }),
            ))

        it("should add generated column and revert add", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await using queryRunner = dataSource.createQueryRunner()

                    const table = await queryRunner.getTable("post")

                    await addAndRevert(
                        queryRunner,
                        table,
                        "post",
                        new TableColumn({
                            name: "addedStoredFullName",
                            type: "varchar",
                            asExpression: `"firstName" || "lastName"`,
                            generatedType: "STORED",
                        }),
                    )
                }),
            ))

        it("should drop generated column and revert drop", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await using queryRunner = dataSource.createQueryRunner()

                    const table = await queryRunner.getTable("post")

                    await dropAndRevert(
                        queryRunner,
                        table,
                        "post",
                        "storedFullName",
                        "STORED",
                        `"firstName" || "lastName"`,
                    )
                }),
            ))

        it("should change generated column expression and revert change", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await using queryRunner = dataSource.createQueryRunner()

                    const table = await queryRunner.getTable("post")

                    const version = dataSource.driver.version
                    const isBelowVersion17 =
                        VersionUtils.isGreaterOrEqual(version, "17") === false

                    await changeAndRevert(
                        table,
                        "post",
                        queryRunner,
                        "storedFullName",
                        `"firstName" || ' ' || "lastName"`,
                        isBelowVersion17,
                    )
                }),
            ))

        it("should change generated column type and revert change", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await using queryRunner = dataSource.createQueryRunner()

                    const table = await queryRunner.getTable("post")

                    await changeType(
                        table,
                        "post",
                        queryRunner,
                        "storedFullName",
                        "VIRTUAL",
                    )
                    await changeType(
                        table,
                        "post",
                        queryRunner,
                        "storedFullName",
                        undefined,
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
                    metadataRecords.length.should.be.equal(
                        generatedColumns.length,
                    )
                }),
            ))
    })
})
