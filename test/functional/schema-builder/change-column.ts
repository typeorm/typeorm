import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"
import { PostVersion } from "./entity/PostVersion"
import { DriverUtils } from "../../../src/driver/DriverUtils"

describe("schema builder > change column", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("uses ALTER COLUMN when increasing varchar length", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const repo = connection.getRepository("post")

                const metadata = connection.getMetadata("post")
                const nameColumnMetadata =
                    metadata.findColumnWithPropertyName("name")!
                const originalLength = nameColumnMetadata.length ?? ""

                // --- SQL recorder around synchronize() ---
                const recorded: string[] = []
                const origCreateQR = (connection as any).createQueryRunner.bind(
                    connection,
                )
                const installRecorder = () => {
                    ;(connection as any).createQueryRunner = (
                        ...args: any[]
                    ) => {
                        const qr = origCreateQR(...args)
                        const origQuery = qr.query.bind(qr)
                        qr.query = async (sql: any, params?: any[]) => {
                            if (typeof sql === "string") recorded.push(sql)
                            return origQuery(sql, params)
                        }
                        return qr
                    }
                }
                const removeRecorder = () => {
                    ;(connection as any).createQueryRunner = origCreateQR
                }

                let insertedRowId: any | undefined

                try {
                    // 1) Ensure start at varchar(50)
                    nameColumnMetadata.length = "50"
                    nameColumnMetadata.build(connection)
                    await connection.synchronize()

                    const preTable = await queryRunner.getTable("post")
                    const preCol = preTable!.findColumnByName("name")!
                    if (preCol.length) expect(preCol.length).to.equal("50")

                    // 2) Widen to 80 and capture the SQL used by synchronize()
                    nameColumnMetadata.length = "80"
                    nameColumnMetadata.build(connection)

                    installRecorder()
                    let widenErr: any
                    try {
                        await connection.synchronize()
                    } catch (e) {
                        widenErr = e
                    } finally {
                        removeRecorder()
                    }
                    expect(widenErr).to.be.undefined

                    // Confirm column length changed
                    const postTable = await queryRunner.getTable("post")
                    const postCol = postTable!.findColumnByName("name")!
                    if (postCol.length) expect(postCol.length).to.equal("80")

                    // 2b) Assert ALTER (driver-scoped)
                    const driver = connection.driver.options.type
                    const sqlBlob = recorded.join("\n")

                    if (driver === "postgres" || driver === "cockroachdb") {
                        // expect ALTER ... ALTER COLUMN "name" ... TYPE/SET DATA TYPE ...
                        expect(sqlBlob).to.match(
                            /ALTER TABLE .* ALTER COLUMN "name" (SET DATA TYPE|TYPE) .*80/i,
                        )
                        // ensure no drop/add of "name"
                        expect(sqlBlob).to.not.match(/ADD COLUMN\s+"name"/i)
                        expect(sqlBlob).to.not.match(/DROP COLUMN\s+"name"/i)
                    } else if (driver === "mysql" || driver === "mariadb") {
                        // MODIFY or CHANGE for MySQL family
                        const usedModify =
                            /ALTER TABLE .* (MODIFY|CHANGE) COLUMN `?name`? .*80/i.test(
                                sqlBlob,
                            )
                        expect(
                            usedModify,
                            `Expected MODIFY/CHANGE COLUMN for 'name'.\n${sqlBlob}`,
                        ).to.equal(true)
                        expect(sqlBlob).to.not.match(/ADD COLUMN\s+`?name`?/i)
                        expect(sqlBlob).to.not.match(/DROP COLUMN\s+`?name`?/i)
                    } else if (driver === "mssql") {
                        expect(sqlBlob).to.match(
                            /ALTER TABLE .* ALTER COLUMN \[name\] .*80/i,
                        )
                        expect(sqlBlob).to.not.match(/ADD COLUMN\s+\[name\]/i)
                        expect(sqlBlob).to.not.match(/DROP COLUMN\s+\[name\]/i)
                    } else if (
                        driver === "sqlite" ||
                        driver === "better-sqlite3"
                    ) {
                        // SQLite: no strict assertion here (TypeORM recreates the table). Keep functional test only.
                    }

                    // 3) Insert a 51-char value (should succeed)
                    const fiftyOne = "x".repeat(51)
                    const needsExtras =
                        connection.driver.options.type === "cockroachdb"
                    const payload = needsExtras
                        ? {
                              id: 1, // if your PK is generated you can drop this
                              name: fiftyOne,
                              version: `v_${Date.now()}`,
                              tag: "t",
                              likesCount: 1,
                          }
                        : { name: fiftyOne }

                    let insertErr: any, row: any
                    try {
                        row = await repo.save(payload)
                        insertedRowId = (row as any)?.id
                    } catch (e) {
                        insertErr = e
                    }
                    expect(insertErr).to.be.undefined

                    // 4) Round-trip length check
                    const rt = await repo.findOneByOrFail({
                        id: (row as any).id,
                    })
                    expect(rt.name.length).to.equal(51)
                } finally {
                    // Revert data
                    try {
                        if (insertedRowId !== undefined)
                            await repo.delete(insertedRowId)
                    } catch {}
                    // Revert schema (restore original length)
                    try {
                        const nameColumnMetadata = connection
                            .getMetadata("post")
                            .findColumnWithPropertyName("name")!
                        nameColumnMetadata.length = originalLength
                        nameColumnMetadata.build(connection)
                        await connection.synchronize()
                    } catch {}
                    await queryRunner.release()
                }
            }),
        ))
    it("uses ALTER COLUMN when reducing varchar length", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const repo = connection.getRepository("post")

                const metadata = connection.getMetadata("post")
                const nameColumnMetadata =
                    metadata.findColumnWithPropertyName("name")!
                const originalLength = nameColumnMetadata.length ?? ""

                // --- SQL recorder around synchronize() ---
                const recorded: string[] = []
                const origCreateQR = (connection as any).createQueryRunner.bind(
                    connection,
                )
                const installRecorder = () => {
                    ;(connection as any).createQueryRunner = (
                        ...args: any[]
                    ) => {
                        const qr = origCreateQR(...args)
                        const origQuery = qr.query.bind(qr)
                        qr.query = async (sql: any, params?: any[]) => {
                            if (typeof sql === "string") recorded.push(sql)
                            return origQuery(sql, params)
                        }
                        return qr
                    }
                }
                const removeRecorder = () => {
                    ;(connection as any).createQueryRunner = origCreateQR
                }

                let insertedRowId: any | undefined

                try {
                    // 1) Ensure start at varchar(50)
                    nameColumnMetadata.length = "50"
                    nameColumnMetadata.build(connection)
                    await connection.synchronize()

                    const preTable = await queryRunner.getTable("post")
                    const preCol = preTable!.findColumnByName("name")!
                    if (preCol.length) expect(preCol.length).to.equal("50")

                    // 2) Widen to 40 and capture the SQL used by synchronize()
                    nameColumnMetadata.length = "40"
                    nameColumnMetadata.build(connection)

                    installRecorder()
                    let widenErr: any
                    try {
                        await connection.synchronize()
                    } catch (e) {
                        widenErr = e
                    } finally {
                        removeRecorder()
                    }
                    expect(widenErr).to.be.undefined

                    // Confirm column length changed
                    const postTable = await queryRunner.getTable("post")
                    const postCol = postTable!.findColumnByName("name")!
                    if (postCol.length) expect(postCol.length).to.equal("40")

                    // 2b) Assert ALTER (driver-scoped)
                    const driver = connection.driver.options.type
                    const sqlBlob = recorded.join("\n")

                    if (driver === "postgres" || driver === "cockroachdb") {
                        // expect ALTER ... ALTER COLUMN "name" ... TYPE/SET DATA TYPE ...
                        expect(sqlBlob).to.match(
                            /ALTER TABLE .* ALTER COLUMN "name" (SET DATA TYPE|TYPE) .*40/i,
                        )
                        // ensure no drop/add of "name"
                        expect(sqlBlob).to.not.match(/ADD COLUMN\s+"name"/i)
                        expect(sqlBlob).to.not.match(/DROP COLUMN\s+"name"/i)
                    } else if (driver === "mysql" || driver === "mariadb") {
                        // MODIFY or CHANGE for MySQL family
                        const usedModify =
                            /ALTER TABLE .* (MODIFY|CHANGE) COLUMN `?name`? .*40/i.test(
                                sqlBlob,
                            )
                        expect(
                            usedModify,
                            `Expected MODIFY/CHANGE COLUMN for 'name'.\n${sqlBlob}`,
                        ).to.equal(true)
                        expect(sqlBlob).to.not.match(/ADD COLUMN\s+`?name`?/i)
                        expect(sqlBlob).to.not.match(/DROP COLUMN\s+`?name`?/i)
                    } else if (driver === "mssql") {
                        expect(sqlBlob).to.match(
                            /ALTER TABLE .* ALTER COLUMN \[name\] .*40/i,
                        )
                        expect(sqlBlob).to.not.match(/ADD COLUMN\s+\[name\]/i)
                        expect(sqlBlob).to.not.match(/DROP COLUMN\s+\[name\]/i)
                    } else if (
                        driver === "sqlite" ||
                        driver === "better-sqlite3"
                    ) {
                        // SQLite: no strict assertion here (TypeORM recreates the table). Keep functional test only.
                    }

                    // 3) Insert a 40-char value (should succeed)
                    const fiftyOne = "x".repeat(40)
                    const needsExtras =
                        connection.driver.options.type === "cockroachdb"
                    const payload = needsExtras
                        ? {
                              id: 1, // if your PK is generated you can drop this
                              name: fiftyOne,
                              version: `v_${Date.now()}`,
                              tag: "t",
                              likesCount: 1,
                          }
                        : { name: fiftyOne }

                    let insertErr: any, row: any
                    try {
                        row = await repo.save(payload)
                        insertedRowId = (row as any)?.id
                    } catch (e) {
                        insertErr = e
                    }
                    expect(insertErr).to.be.undefined

                    // 4) Round-trip length check
                    const rt = await repo.findOneByOrFail({
                        id: (row as any).id,
                    })
                    expect(rt.name.length).to.equal(40)
                } finally {
                    // Revert data
                    try {
                        if (insertedRowId !== undefined)
                            await repo.delete(insertedRowId)
                    } catch {}
                    // Revert schema (restore original length)
                    try {
                        const nameColumnMetadata = connection
                            .getMetadata("post")
                            .findColumnWithPropertyName("name")!
                        nameColumnMetadata.length = originalLength
                        nameColumnMetadata.build(connection)
                        await connection.synchronize()
                    } catch {}
                    await queryRunner.release()
                }
            }),
        ))

    it("should correctly change column name", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postMetadata = connection.getMetadata(Post)
                const nameColumn =
                    postMetadata.findColumnWithPropertyName("name")!
                nameColumn.propertyName = "title"
                nameColumn.build(connection)

                await connection.synchronize()

                const queryRunner = connection.createQueryRunner()
                const postTable = await queryRunner.getTable("post")
                await queryRunner.release()

                expect(postTable!.findColumnByName("name")).to.be.undefined
                postTable!.findColumnByName("title")!.should.be.exist

                // revert changes
                nameColumn.propertyName = "name"
                nameColumn.build(connection)
            }),
        ))

    it("should correctly change column length", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postMetadata = connection.getMetadata(Post)
                const nameColumn =
                    postMetadata.findColumnWithPropertyName("name")!
                const textColumn =
                    postMetadata.findColumnWithPropertyName("text")!
                nameColumn.length = "500"
                textColumn.length = "300"

                await connection.synchronize()

                const queryRunner = connection.createQueryRunner()
                const postTable = await queryRunner.getTable("post")
                await queryRunner.release()

                postTable!
                    .findColumnByName("name")!
                    .length.should.be.equal("500")
                postTable!
                    .findColumnByName("text")!
                    .length.should.be.equal("300")

                if (
                    DriverUtils.isMySQLFamily(connection.driver) ||
                    connection.driver.options.type === "aurora-mysql" ||
                    connection.driver.options.type === "sap" ||
                    connection.driver.options.type === "spanner"
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
            connections.map(async (connection) => {
                const postMetadata = connection.getMetadata(Post)
                const versionColumn =
                    postMetadata.findColumnWithPropertyName("version")!
                versionColumn.type =
                    connection.driver.options.type === "spanner"
                        ? "int64"
                        : "int"

                // in test we must manually change referenced column too, but in real sync, it changes automatically
                const postVersionMetadata = connection.getMetadata(PostVersion)
                const postVersionColumn =
                    postVersionMetadata.findColumnWithPropertyName("post")!
                postVersionColumn.type =
                    connection.driver.options.type === "spanner"
                        ? "int64"
                        : "int"

                await connection.synchronize()

                const queryRunner = connection.createQueryRunner()
                const postVersionTable = await queryRunner.getTable(
                    "post_version",
                )
                await queryRunner.release()

                postVersionTable!.foreignKeys.length.should.be.equal(1)

                // revert changes
                if (connection.driver.options.type === "spanner") {
                    versionColumn.type = "string"
                    postVersionColumn.type = "string"
                } else if (connection.driver.options.type === "sap") {
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
            connections.map(async (connection) => {
                // Spanner does not support DEFAULT
                if (connection.driver.options.type === "spanner") return

                const postMetadata = connection.getMetadata(Post)
                const nameColumn =
                    postMetadata.findColumnWithPropertyName("name")!

                nameColumn.default = "My awesome post"
                nameColumn.build(connection)

                await connection.synchronize(false)

                const queryRunner = connection.createQueryRunner()
                const postTable = await queryRunner.getTable("post")
                await queryRunner.release()

                postTable!
                    .findColumnByName("name")!
                    .default.should.be.equal("'My awesome post'")
            }),
        ))

    it("should correctly make column primary and generated", () =>
        Promise.all(
            connections.map(async (connection) => {
                // CockroachDB does not allow changing PK
                if (
                    connection.driver.options.type === "cockroachdb" ||
                    connection.driver.options.type === "spanner"
                )
                    return

                const postMetadata = connection.getMetadata(Post)
                const idColumn = postMetadata.findColumnWithPropertyName("id")!
                const versionColumn =
                    postMetadata.findColumnWithPropertyName("version")!
                idColumn.isGenerated = true
                idColumn.generationStrategy = "increment"

                // SQLite does not support AUTOINCREMENT with composite primary keys
                // Oracle does not support both unique and primary attributes on such column
                if (
                    !DriverUtils.isSQLiteFamily(connection.driver) &&
                    !(connection.driver.options.type === "oracle")
                )
                    versionColumn.isPrimary = true

                await connection.synchronize()

                const queryRunner = connection.createQueryRunner()
                const postTable = await queryRunner.getTable("post")
                await queryRunner.release()

                postTable!.findColumnByName("id")!.isGenerated.should.be.true
                postTable!
                    .findColumnByName("id")!
                    .generationStrategy!.should.be.equal("increment")

                // SQLite does not support AUTOINCREMENT with composite primary keys
                if (
                    !DriverUtils.isSQLiteFamily(connection.driver) &&
                    !(connection.driver.options.type === "oracle")
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
            connections.map(async (connection) => {
                const teacherMetadata = connection.getMetadata("teacher")
                const idColumn =
                    teacherMetadata.findColumnWithPropertyName("id")!
                idColumn.isGenerated = false
                idColumn.generationStrategy = undefined

                await connection.synchronize()

                const queryRunner = connection.createQueryRunner()
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
            connections.map(async (connection) => {
                // CockroachDB and Spanner does not allow changing PK
                if (
                    connection.driver.options.type === "cockroachdb" ||
                    connection.driver.options.type === "spanner"
                )
                    return

                const queryRunner = connection.createQueryRunner()

                if (connection.driver.options.type === "postgres")
                    await queryRunner.query(
                        `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
                    )

                const postMetadata = connection.getMetadata(Post)
                const idColumn = postMetadata.findColumnWithPropertyName("id")!
                idColumn.isGenerated = true
                idColumn.generationStrategy = "uuid"

                // depending on driver, we must change column and referenced column types
                if (connection.driver.options.type === "postgres") {
                    idColumn.type = "uuid"
                } else if (connection.driver.options.type === "mssql") {
                    idColumn.type = "uniqueidentifier"
                } else if (connection.driver.options.type === "sap") {
                    idColumn.type = "nvarchar"
                } else {
                    idColumn.type = "varchar"
                }

                await connection.synchronize()

                const postTable = await queryRunner.getTable("post")
                await queryRunner.release()

                if (
                    connection.driver.options.type === "postgres" ||
                    connection.driver.options.type === "mssql"
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
            connections.map(async (connection) => {
                // CockroachDB and Spanner does not allow changing PK
                if (
                    connection.driver.options.type === "cockroachdb" ||
                    connection.driver.options.type === "spanner"
                )
                    return

                const teacherMetadata = connection.getMetadata("teacher")
                const studentMetadata = connection.getMetadata("student")
                const idColumn =
                    teacherMetadata.findColumnWithPropertyName("id")!
                const teacherColumn =
                    studentMetadata.findColumnWithPropertyName("teacher")!
                idColumn.generationStrategy = "uuid"

                // depending on driver, we must change column and referenced column types
                if (connection.driver.options.type === "postgres") {
                    idColumn.type = "uuid"
                    teacherColumn.type = "uuid"
                } else if (connection.driver.options.type === "mssql") {
                    idColumn.type = "uniqueidentifier"
                    teacherColumn.type = "uniqueidentifier"
                } else if (connection.driver.options.type === "sap") {
                    idColumn.type = "nvarchar"
                    teacherColumn.type = "nvarchar"
                } else {
                    idColumn.type = "varchar"
                    teacherColumn.type = "varchar"
                }

                await connection.synchronize()

                const queryRunner = connection.createQueryRunner()
                const teacherTable = await queryRunner.getTable("teacher")
                await queryRunner.release()

                if (
                    connection.driver.options.type === "postgres" ||
                    connection.driver.options.type === "mssql"
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
            connections.map(async (connection) => {
                // Skip the contents of this test if not one of the drivers that support comments
                if (
                    !(
                        connection.driver.options.type === "cockroachdb" ||
                        connection.driver.options.type === "postgres" ||
                        connection.driver.options.type === "sap" ||
                        DriverUtils.isMySQLFamily(connection.driver)
                    )
                ) {
                    return
                }

                const postMetadata = connection.getMetadata("post")
                const teacherMetadata = connection.getMetadata("teacher")
                const idColumn =
                    teacherMetadata.findColumnWithPropertyName("id")!
                const tagColumn =
                    postMetadata.findColumnWithPropertyName("tag")!

                tagColumn.comment = ""
                tagColumn.isNullable = true // check changing the comment in combination with another option
                idColumn.comment = "The Teacher's Key"

                await connection.synchronize()

                const queryRunnerA = connection.createQueryRunner()
                const postTableA = await queryRunnerA.getTable("post")
                const persistedTagColumnA = postTableA!.findColumnByName("tag")!
                const teacherTableA = await queryRunnerA.getTable("teacher")
                await queryRunnerA.release()

                expect(persistedTagColumnA.comment).to.be.equal(
                    undefined,
                    connection.name,
                )
                expect(persistedTagColumnA.isNullable).to.be.equal(
                    true,
                    connection.name,
                )
                expect(
                    teacherTableA!.findColumnByName("id")!.comment,
                ).to.be.equal("The Teacher's Key", connection.name)

                // revert changes
                tagColumn.comment = "Tag"
                tagColumn.isNullable = false
                idColumn.comment = ""

                await connection.synchronize()

                const queryRunnerB = connection.createQueryRunner()
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
            connections.map(async (connection) => {
                await connection.getRepository(Post).insert({
                    id: 1234,
                    version: "5",
                    text: "a",
                    tag: "b",
                    likesCount: 45,
                })

                const post = await connection
                    .getRepository(Post)
                    .findOneByOrFail({ id: 1234 })

                await connection.getRepository(PostVersion).insert({
                    id: 1,
                    post,
                    details: "Example",
                })

                const postMetadata = connection.getMetadata(Post)
                const nameColumn =
                    postMetadata.findColumnWithPropertyName("name")!
                nameColumn.length = "500"

                await connection.synchronize()

                const queryRunner = connection.createQueryRunner()
                const postVersionTable = await queryRunner.getTable(
                    "post_version",
                )
                await queryRunner.release()

                postVersionTable!.foreignKeys.length.should.be.equal(1)

                // revert changes
                nameColumn.length = "255"
            }),
        ))
})
