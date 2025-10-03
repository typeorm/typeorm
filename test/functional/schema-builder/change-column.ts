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
                if (
                    connection.driver.options.type == "better-sqlite3" ||
                    connection.driver.options.type == "sqljs" ||
                    connection.driver.options.type == "sqlite"
                )
                    return
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
                    } else if (
                        driver === "mysql" ||
                        driver === "mariadb" ||
                        driver === "aurora-mysql"
                    ) {
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
                        // widen to 80
                        expect(sqlBlob).to.match(
                            /ALTER TABLE[\s\S]*?ALTER COLUMN\s+(?:\[name\]|"name")\s+[\s\S]*?80/i,
                        )
                        expect(sqlBlob).to.not.match(
                            /ADD\s+COLUMN\s+(?:\[name\]|"name")/i,
                        )
                        expect(sqlBlob).to.not.match(
                            /DROP\s+COLUMN\s+(?:\[name\]|"name")/i,
                        )
                    } else if (driver === "oracle") {
                        // Oracle uses MODIFY COLUMN or ALTER COLUMN
                        // Oracle uses MODIFY with optional parens around the column def
                        expect(sqlBlob).to.match(
                            /ALTER TABLE .* (MODIFY|ALTER COLUMN)\s*\(?\s*"name"\s+.*80/i,
                            `Expected MODIFY/ALTER COLUMN for 'name' in Oracle.\n${sqlBlob}`,
                        )

                        expect(sqlBlob).to.not.match(/ADD COLUMN\s+"name"/i)
                        expect(sqlBlob).to.not.match(/DROP COLUMN\s+"name"/i)
                    } else if (driver === "spanner") {
                        // Spanner uses ALTER COLUMN with type specification
                        expect(sqlBlob).to.match(
                            /ALTER TABLE .* ALTER COLUMN `?name`? STRING\(80\)/i,
                            `Expected ALTER COLUMN STRING(80) for 'name' in Spanner.\n${sqlBlob}`,
                        )
                        expect(sqlBlob).to.not.match(/ADD COLUMN\s+`?name`?/i)
                        expect(sqlBlob).to.not.match(/DROP COLUMN\s+`?name`?/i)
                    }

                    // 3) Insert a 51-char value (should succeed)
                    const fiftyOne = "x".repeat(51)
                    // Build a payload that satisfies NOT NULL columns that lack defaults/generation
                    const meta = repo.metadata
                    const requiredNoDefault = meta.columns.filter(
                        (c) => !c.isNullable && !c.default && !c.isGenerated,
                    )

                    // Start with the test's target value
                    const payload: any = { name: fiftyOne }

                    for (const c of requiredNoDefault) {
                        switch (c.propertyName) {
                            case "id": {
                                // Prefer a small int by default (works everywhere).
                                // Only switch to a big integer when the column is clearly bigint-like.
                                const t = String(c.type ?? "").toLowerCase()

                                const isBigInt =
                                    /\bbigint\b|^int8$|^bigserial$/.test(t) ||
                                    // TypeORM sometimes sets type as a function/constructor; stringify may be '[Function:Number]'.
                                    // If metadata has width info suggestive of bigint, treat as bigint (rare in this test schema).
                                    (typeof (c as any).width === "number" &&
                                        (c as any).width >= 20)

                                if (isBigInt) {
                                    // still keep it in JS safe integer range
                                    payload.id ??= Math.min(
                                        Number.MAX_SAFE_INTEGER,
                                        // a “big” but safe number
                                        9_000_000_000_000 +
                                            Math.floor(
                                                Math.random() * 1_000_000,
                                            ),
                                    )
                                } else {
                                    // safe 32-bit signed int to avoid MySQL overflow
                                    payload.id ??=
                                        Math.floor(Math.random() * 1_000_000) +
                                        1 /* 1..1,000,000 */
                                }
                                break
                            }
                            case "version":
                                payload.version ??= `v_${Date.now()}_${
                                    connection.name
                                }_${Math.random().toString(36).slice(2)}`
                                break
                            case "tag":
                                payload.tag ??= `t_${Math.random()
                                    .toString(36)
                                    .slice(2, 6)}`
                                break
                            case "likesCount":
                                payload.likesCount ??= 1
                                break
                            default: {
                                // generic fallback
                                const t = String(c.type ?? "").toLowerCase()
                                const isNumeric =
                                    /(int|numeric|float|double|decimal|real)/.test(
                                        t,
                                    )
                                payload[c.propertyName] ??= isNumeric ? 0 : ""
                                break
                            }
                        }
                    }

                    let insertErr: any, row: any
                    try {
                        row = await repo.save(payload)
                        insertedRowId = (row as any)?.id
                    } catch (e) {
                        insertErr = e
                        console.log(insertErr)
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
                if (
                    connection.driver.options.type == "better-sqlite3" ||
                    connection.driver.options.type == "sqljs" ||
                    connection.driver.options.type == "sqlite"
                )
                    return
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

                    // 2) Reduce to 40 and capture the SQL used by synchronize()
                    nameColumnMetadata.length = "40"
                    nameColumnMetadata.build(connection)

                    // 🔧 Cockroach v24.3+: shrinking requires experimental flag (session-scoped)
                    if (connection.driver.options.type === "cockroachdb") {
                        await connection.query(
                            "SET enable_experimental_alter_column_type_general = true",
                        )
                    }

                    installRecorder()
                    let widenErr: any
                    try {
                        await connection.synchronize()
                    } catch (e) {
                        widenErr = e
                        console.log(widenErr)
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
                    } else if (
                        driver === "mysql" ||
                        driver === "mariadb" ||
                        driver === "aurora-mysql"
                    ) {
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
                        // shrink to 40
                        expect(sqlBlob).to.match(
                            /ALTER TABLE[\s\S]*?ALTER COLUMN\s+(?:\[name\]|"name")\s+[\s\S]*?40/i,
                        )
                        expect(sqlBlob).to.not.match(
                            /ADD\s+COLUMN\s+(?:\[name\]|"name")/i,
                        )
                        expect(sqlBlob).to.not.match(
                            /DROP\s+COLUMN\s+(?:\[name\]|"name")/i,
                        )
                    } else if (driver === "oracle") {
                        // Oracle uses MODIFY COLUMN or ALTER COLUMN
                        // Oracle uses MODIFY; some versions include parens around the column def
                        expect(sqlBlob).to.match(
                            /ALTER TABLE .* (MODIFY|ALTER COLUMN)\s*\(?\s*"name"\s+.*40/i,
                            `Expected MODIFY/ALTER COLUMN for 'name' in Oracle.\n${sqlBlob}`,
                        )

                        expect(sqlBlob).to.not.match(/ADD COLUMN\s+"name"/i)
                        expect(sqlBlob).to.not.match(/DROP COLUMN\s+"name"/i)
                    } else if (driver === "spanner") {
                        // Spanner uses ALTER COLUMN with type specification
                        expect(sqlBlob).to.match(
                            /ALTER TABLE .* ALTER COLUMN `?name`? STRING\(40\)/i,
                            `Expected ALTER COLUMN STRING(40) for 'name' in Spanner.\n${sqlBlob}`,
                        )
                        expect(sqlBlob).to.not.match(/ADD COLUMN\s+`?name`?/i)
                        expect(sqlBlob).to.not.match(/DROP COLUMN\s+`?name`?/i)
                    }
                    // 3) Insert a 40-char value (should succeed)
                    const forty = "x".repeat(40)
                    // Build a payload that satisfies NOT NULL columns that lack defaults/generation
                    const meta = repo.metadata
                    const requiredNoDefault = meta.columns.filter(
                        (c) => !c.isNullable && !c.default && !c.isGenerated,
                    )

                    // Start with the test's target value
                    const payload: any = { name: forty }

                    for (const c of requiredNoDefault) {
                        switch (c.propertyName) {
                            case "id": {
                                // Prefer a small int by default (works everywhere).
                                // Only switch to a big integer when the column is clearly bigint-like.
                                const t = String(c.type ?? "").toLowerCase()

                                const isBigInt =
                                    /\bbigint\b|^int8$|^bigserial$/.test(t) ||
                                    // TypeORM sometimes sets type as a function/constructor; stringify may be '[Function:Number]'.
                                    // If metadata has width info suggestive of bigint, treat as bigint (rare in this test schema).
                                    (typeof (c as any).width === "number" &&
                                        (c as any).width >= 20)

                                if (isBigInt) {
                                    // still keep it in JS safe integer range
                                    payload.id ??= Math.min(
                                        Number.MAX_SAFE_INTEGER,
                                        // a “big” but safe number
                                        9_000_000_000_000 +
                                            Math.floor(
                                                Math.random() * 1_000_000,
                                            ),
                                    )
                                } else {
                                    // safe 32-bit signed int to avoid MySQL overflow
                                    payload.id ??=
                                        Math.floor(Math.random() * 1_000_000) +
                                        1 /* 1..1,000,000 */
                                }
                                break
                            }
                            case "version":
                                payload.version ??= `v_${Date.now()}_${
                                    connection.name
                                }_${Math.random().toString(36).slice(2)}`
                                break
                            case "tag":
                                payload.tag ??= `t_${Math.random()
                                    .toString(36)
                                    .slice(2, 6)}`
                                break
                            case "likesCount":
                                payload.likesCount ??= 1
                                break
                            default: {
                                // generic fallback
                                const t = String(c.type ?? "").toLowerCase()
                                const isNumeric =
                                    /(int|numeric|float|double|decimal|real)/.test(
                                        t,
                                    )
                                payload[c.propertyName] ??= isNumeric ? 0 : ""
                                break
                            }
                        }
                    }

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
