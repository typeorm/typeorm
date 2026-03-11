import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"
import { PostVersion } from "./entity/PostVersion"
import { DriverUtils } from "../../../src/driver/DriverUtils"

describe("schema builder > change column", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should correctly change column name", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMetadata = dataSource.getMetadata(Post)
                const nameColumn =
                    postMetadata.findColumnWithPropertyName("name")!
                nameColumn.propertyName = "title"
                nameColumn.build(dataSource)

                await dataSource.synchronize()

                const queryRunner = dataSource.createQueryRunner()
                const postTable = await queryRunner.getTable("post")
                await queryRunner.release()

                expect(postTable!.findColumnByName("name")).to.be.undefined
                postTable!.findColumnByName("title")!.should.be.exist

                // revert changes
                nameColumn.propertyName = "name"
                nameColumn.build(dataSource)
            }),
        ))

    it("should correctly change column length", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMetadata = dataSource.getMetadata(Post)
                const nameColumn =
                    postMetadata.findColumnWithPropertyName("name")!
                const textColumn =
                    postMetadata.findColumnWithPropertyName("text")!
                nameColumn.length = "500"
                textColumn.length = "300"

                await dataSource.synchronize()

                const queryRunner = dataSource.createQueryRunner()
                const postTable = await queryRunner.getTable("post")
                await queryRunner.release()

                postTable!
                    .findColumnByName("name")!
                    .length.should.be.equal("500")
                postTable!
                    .findColumnByName("text")!
                    .length.should.be.equal("300")

                if (
                    DriverUtils.isMySQLFamily(dataSource.driver) ||
                    dataSource.driver.options.type === "aurora-mysql" ||
                    dataSource.driver.options.type === "sap" ||
                    dataSource.driver.options.type === "spanner"
                ) {
                    postTable!.indices.length.should.be.equal(2)
                } else {
                    postTable!.uniques.length.should.be.equal(2)
                }

                // revert changes
                nameColumn.length = "255"
                textColumn.length = "255"
            }),
        ))

    it("should correctly change column type", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMetadata = dataSource.getMetadata(Post)
                const versionColumn =
                    postMetadata.findColumnWithPropertyName("version")!
                versionColumn.type =
                    dataSource.driver.options.type === "spanner"
                        ? "int64"
                        : "int"

                // in test we must manually change referenced column too, but in real sync, it changes automatically
                const postVersionMetadata = dataSource.getMetadata(PostVersion)
                const postVersionColumn =
                    postVersionMetadata.findColumnWithPropertyName("post")!
                postVersionColumn.type =
                    dataSource.driver.options.type === "spanner"
                        ? "int64"
                        : "int"

                await dataSource.synchronize()

                const queryRunner = dataSource.createQueryRunner()
                const postVersionTable =
                    await queryRunner.getTable("post_version")
                await queryRunner.release()

                postVersionTable!.foreignKeys.length.should.be.equal(1)

                // revert changes
                if (dataSource.driver.options.type === "spanner") {
                    versionColumn.type = "string"
                    postVersionColumn.type = "string"
                } else if (dataSource.driver.options.type === "sap") {
                    versionColumn.type = "nvarchar"
                    postVersionColumn.type = "nvarchar"
                } else {
                    versionColumn.type = "varchar"
                    postVersionColumn.type = "varchar"
                }
            }),
        ))

    it("should correctly change column default value", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Spanner does not support DEFAULT
                if (dataSource.driver.options.type === "spanner") return

                const postMetadata = dataSource.getMetadata(Post)
                const nameColumn =
                    postMetadata.findColumnWithPropertyName("name")!

                nameColumn.default = "My awesome post"
                nameColumn.build(dataSource)

                await dataSource.synchronize(false)

                const queryRunner = dataSource.createQueryRunner()
                const postTable = await queryRunner.getTable("post")
                await queryRunner.release()

                postTable!
                    .findColumnByName("name")!
                    .default.should.be.equal("'My awesome post'")
            }),
        ))

    it("should correctly make column primary and generated", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // CockroachDB does not allow changing PK
                if (
                    dataSource.driver.options.type === "cockroachdb" ||
                    dataSource.driver.options.type === "spanner"
                )
                    return

                const postMetadata = dataSource.getMetadata(Post)
                const idColumn = postMetadata.findColumnWithPropertyName("id")!
                const versionColumn =
                    postMetadata.findColumnWithPropertyName("version")!
                idColumn.isGenerated = true
                idColumn.generationStrategy = "increment"

                // SQLite does not support AUTOINCREMENT with composite primary keys
                // Oracle does not support both unique and primary attributes on such column
                if (
                    !DriverUtils.isSQLiteFamily(dataSource.driver) &&
                    !(dataSource.driver.options.type === "oracle")
                )
                    versionColumn.isPrimary = true

                await dataSource.synchronize()

                const queryRunner = dataSource.createQueryRunner()
                const postTable = await queryRunner.getTable("post")
                await queryRunner.release()

                postTable!.findColumnByName("id")!.isGenerated.should.be.true
                postTable!
                    .findColumnByName("id")!
                    .generationStrategy!.should.be.equal("increment")

                // SQLite does not support AUTOINCREMENT with composite primary keys
                if (
                    !DriverUtils.isSQLiteFamily(dataSource.driver) &&
                    !(dataSource.driver.options.type === "oracle")
                )
                    postTable!.findColumnByName("version")!.isPrimary.should.be
                        .true

                // revert changes
                idColumn.isGenerated = false
                idColumn.generationStrategy = undefined
                versionColumn.isPrimary = false
            }),
        ))

    it("should correctly change column `isGenerated` property when column is on foreign key", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const teacherMetadata = dataSource.getMetadata("teacher")
                const idColumn =
                    teacherMetadata.findColumnWithPropertyName("id")!
                idColumn.isGenerated = false
                idColumn.generationStrategy = undefined

                await dataSource.synchronize()

                const queryRunner = dataSource.createQueryRunner()
                const teacherTable = await queryRunner.getTable("teacher")
                await queryRunner.release()

                teacherTable!.findColumnByName("id")!.isGenerated.should.be
                    .false
                expect(teacherTable!.findColumnByName("id")!.generationStrategy)
                    .to.be.undefined

                // revert changes
                idColumn.isGenerated = true
                idColumn.generationStrategy = "increment"
            }),
        ))

    it("should correctly change non-generated column on to uuid-generated column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // CockroachDB and Spanner does not allow changing PK
                if (
                    dataSource.driver.options.type === "cockroachdb" ||
                    dataSource.driver.options.type === "spanner"
                )
                    return

                const queryRunner = dataSource.createQueryRunner()

                if (dataSource.driver.options.type === "postgres")
                    await queryRunner.query(
                        `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
                    )

                const postMetadata = dataSource.getMetadata(Post)
                const idColumn = postMetadata.findColumnWithPropertyName("id")!
                idColumn.isGenerated = true
                idColumn.generationStrategy = "uuid"

                // depending on driver, we must change column and referenced column types
                if (dataSource.driver.options.type === "postgres") {
                    idColumn.type = "uuid"
                } else if (dataSource.driver.options.type === "mssql") {
                    idColumn.type = "uniqueidentifier"
                } else if (dataSource.driver.options.type === "sap") {
                    idColumn.type = "nvarchar"
                } else {
                    idColumn.type = "varchar"
                }

                await dataSource.synchronize()

                const postTable = await queryRunner.getTable("post")
                await queryRunner.release()

                if (
                    dataSource.driver.options.type === "postgres" ||
                    dataSource.driver.options.type === "mssql"
                ) {
                    postTable!.findColumnByName("id")!.isGenerated.should.be
                        .true
                    postTable!
                        .findColumnByName("id")!
                        .generationStrategy!.should.be.equal("uuid")
                } else {
                    // other driver does not natively supports uuid type
                    postTable!.findColumnByName("id")!.isGenerated.should.be
                        .false
                    expect(
                        postTable!.findColumnByName("id")!.generationStrategy,
                    ).to.be.undefined
                }

                // revert changes
                idColumn.isGenerated = false
                idColumn.generationStrategy = undefined
                idColumn.type = "int"
                postMetadata.generatedColumns.splice(
                    postMetadata.generatedColumns.indexOf(idColumn),
                    1,
                )
                postMetadata.hasUUIDGeneratedColumns = false
            }),
        ))

    it("should correctly change generated column generation strategy", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // CockroachDB and Spanner does not allow changing PK
                if (
                    dataSource.driver.options.type === "cockroachdb" ||
                    dataSource.driver.options.type === "spanner"
                )
                    return

                const teacherMetadata = dataSource.getMetadata("teacher")
                const studentMetadata = dataSource.getMetadata("student")
                const idColumn =
                    teacherMetadata.findColumnWithPropertyName("id")!
                const teacherColumn =
                    studentMetadata.findColumnWithPropertyName("teacher")!
                idColumn.generationStrategy = "uuid"

                // depending on driver, we must change column and referenced column types
                if (dataSource.driver.options.type === "postgres") {
                    idColumn.type = "uuid"
                    teacherColumn.type = "uuid"
                } else if (dataSource.driver.options.type === "mssql") {
                    idColumn.type = "uniqueidentifier"
                    teacherColumn.type = "uniqueidentifier"
                } else if (dataSource.driver.options.type === "sap") {
                    idColumn.type = "nvarchar"
                    teacherColumn.type = "nvarchar"
                } else {
                    idColumn.type = "varchar"
                    teacherColumn.type = "varchar"
                }

                await dataSource.synchronize()

                const queryRunner = dataSource.createQueryRunner()
                const teacherTable = await queryRunner.getTable("teacher")
                await queryRunner.release()

                if (
                    dataSource.driver.options.type === "postgres" ||
                    dataSource.driver.options.type === "mssql"
                ) {
                    teacherTable!.findColumnByName("id")!.isGenerated.should.be
                        .true
                    teacherTable!
                        .findColumnByName("id")!
                        .generationStrategy!.should.be.equal("uuid")
                } else {
                    // other driver does not natively supports uuid type
                    teacherTable!.findColumnByName("id")!.isGenerated.should.be
                        .false
                    expect(
                        teacherTable!.findColumnByName("id")!
                            .generationStrategy,
                    ).to.be.undefined
                }

                // revert changes
                idColumn.isGenerated = true
                idColumn.generationStrategy = "increment"
                idColumn.type = "int"
                teacherColumn.type = "int"
            }),
        ))

    it("should correctly change column comment", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Skip the contents of this test if not one of the drivers that support comments
                if (
                    !(
                        dataSource.driver.options.type === "cockroachdb" ||
                        dataSource.driver.options.type === "postgres" ||
                        dataSource.driver.options.type === "sap" ||
                        DriverUtils.isMySQLFamily(dataSource.driver)
                    )
                ) {
                    return
                }

                const postMetadata = dataSource.getMetadata("post")
                const teacherMetadata = dataSource.getMetadata("teacher")
                const idColumn =
                    teacherMetadata.findColumnWithPropertyName("id")!
                const tagColumn =
                    postMetadata.findColumnWithPropertyName("tag")!

                tagColumn.comment = ""
                tagColumn.isNullable = true // check changing the comment in combination with another option
                idColumn.comment = "The Teacher's Key"

                await dataSource.synchronize()

                const queryRunnerA = dataSource.createQueryRunner()
                const postTableA = await queryRunnerA.getTable("post")
                const persistedTagColumnA = postTableA!.findColumnByName("tag")!
                const teacherTableA = await queryRunnerA.getTable("teacher")
                await queryRunnerA.release()

                expect(persistedTagColumnA.comment).to.be.equal(
                    undefined,
                    dataSource.options.type,
                )
                expect(persistedTagColumnA.isNullable).to.be.equal(
                    true,
                    dataSource.options.type,
                )
                expect(
                    teacherTableA!.findColumnByName("id")!.comment,
                ).to.be.equal("The Teacher's Key", dataSource.options.type)

                // revert changes
                tagColumn.comment = "Tag"
                tagColumn.isNullable = false
                idColumn.comment = ""

                await dataSource.synchronize()

                const queryRunnerB = dataSource.createQueryRunner()
                const postTableB = await queryRunnerB.getTable("post")
                const persistedTagColumnB = postTableB!.findColumnByName("tag")!
                const teacherTableB = await queryRunnerB.getTable("teacher")
                await queryRunnerB.release()

                expect(persistedTagColumnB.comment).to.be.equal("Tag")
                expect(persistedTagColumnB.isNullable).to.be.false
                expect(teacherTableB!.findColumnByName("id")!.comment).to.be
                    .undefined
            }),
        ))

    it("should correctly change column type when FK relationships impact it", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.getRepository(Post).insert({
                    id: 1234,
                    version: "5",
                    text: "a",
                    tag: "b",
                    likesCount: 45,
                })

                const post = await dataSource
                    .getRepository(Post)
                    .findOneByOrFail({ id: 1234 })

                await dataSource.getRepository(PostVersion).insert({
                    id: 1,
                    post,
                    details: "Example",
                })

                const postMetadata = dataSource.getMetadata(Post)
                const nameColumn =
                    postMetadata.findColumnWithPropertyName("name")!
                nameColumn.length = "500"

                await dataSource.synchronize()

                const queryRunner = dataSource.createQueryRunner()
                const postVersionTable =
                    await queryRunner.getTable("post_version")
                await queryRunner.release()

                postVersionTable!.foreignKeys.length.should.be.equal(1)

                // revert changes
                nameColumn.length = "255"
            }),
        ))
})
