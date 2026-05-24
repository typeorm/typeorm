import { expect } from "chai"
import "reflect-metadata"
import { randomBytes } from "node:crypto"
import type { DataSource } from "../../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../../utils/test-utils"
import { Post } from "./entity/Post"
import { PostVersion } from "./entity/PostVersion"
import { DriverUtils } from "../../../../../../src/driver/DriverUtils"
import type { ColumnType } from "../../../../../../src/driver/types/ColumnTypes"
import type { ColumnMetadata } from "../../../../../../src/metadata/ColumnMetadata"

// Helper functions for cryptographically secure random number generation
// Replaces Math.random() which is flagged as weak cryptography
function secureRandomInt(max: number): number {
    const bytes = randomBytes(4)
    const value = bytes.readUInt32BE(0)
    return Math.floor((value / 0xffffffff) * max)
}

function secureRandomBase36String(length: number): string {
    const bytes = randomBytes(Math.ceil(length / 2))
    let result = ""
    for (let i = 0; i < bytes.length && result.length < length; i++) {
        result += bytes[i].toString(36)
    }
    return result.slice(0, length)
}

/**
 * Creates an SQL-recording wrapper around `connection.createQueryRunner`.
 * Returns `{ recorded, install, remove }`.
 */
function createSqlRecorder(connection: DataSource): {
    recorded: string[]
    install: () => void
    remove: () => void
} {
    const recorded: string[] = []
    const origCreateQR = (
        connection as DataSource & {
            createQueryRunner: DataSource["createQueryRunner"]
        }
    ).createQueryRunner.bind(connection)

    const install = () => {
        ;(
            connection as DataSource & {
                createQueryRunner: DataSource["createQueryRunner"]
            }
        ).createQueryRunner = (
            ...args: Parameters<DataSource["createQueryRunner"]>
        ) => {
            const qr = origCreateQR(...args)
            const origQuery = qr.query.bind(qr)
            qr.query = async (sql: string, params?: unknown[]) => {
                if (typeof sql === "string") recorded.push(sql)
                return origQuery(sql, params)
            }
            return qr
        }
    }

    const remove = () => {
        ;(
            connection as DataSource & {
                createQueryRunner: DataSource["createQueryRunner"]
            }
        ).createQueryRunner = origCreateQR
    }

    return { recorded, install, remove }
}

function recordedSchemaChanges(recorded: string[]): string[] {
    return recorded.filter((sql) => /^(ALTER TABLE|UPDATE)\b/i.test(sql))
}

describe("schema builder > change column", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))
    it("uses ALTER COLUMN when changing from CHAR → VARCHAR", () =>
        Promise.all(
            dataSources.map(async (connection: DataSource) => {
                const driver = connection.driver.options.type

                // Map driver-specific type names for CHAR/VARCHAR
                // (If a mapping is not available for a driver, skip.)

                const charTypeByDriver: Record<string, ColumnType> = {
                    postgres: "char",
                    cockroachdb: "char",
                    mysql: "char",
                    mariadb: "char",
                    "aurora-mysql": "char",
                    mssql: "char",
                    oracle: "char",
                }

                const varcharTypeByDriver: Record<string, ColumnType> = {
                    postgres: "varchar",
                    cockroachdb: "varchar",
                    mysql: "varchar",
                    mariadb: "varchar",
                    "aurora-mysql": "varchar",
                    mssql: "varchar",
                    oracle: "varchar2",
                }
                if (!charTypeByDriver[driver] || !varcharTypeByDriver[driver])
                    return

                const metadata = connection.getMetadata(Post)
                const nameColumn = metadata.findColumnWithPropertyName("name")
                if (!nameColumn) return
                const originalType = nameColumn.type
                const originalLength = nameColumn.length || "50"

                // Helper: record SQL emitted by synchronize()
                const {
                    recorded,
                    install: installRecorder,
                    remove: removeRecorder,
                } = createSqlRecorder(connection)

                let testErr
                try {
                    // Step 1: Ensure column is CHAR(N)
                    nameColumn.type = charTypeByDriver[driver]
                    nameColumn.length = originalLength
                    nameColumn.build(connection)
                    await connection.synchronize()

                    // Insert data BEFORE migration to test survival
                    const repo = connection.getRepository(Post)
                    const testData = "test data"
                    await repo.save({
                        id: 1,
                        name: testData,
                        version: "1.0",
                        text: "Some content",
                        tag: "test",
                        likesCount: 1,
                    })

                    // Verify data exists before migration
                    const beforeChange = await repo.findOne({
                        where: { id: 1 },
                    })
                    expect(beforeChange).to.not.be.undefined
                    // CHAR columns pad with spaces; trim for comparison
                    expect(beforeChange?.name?.trim()).to.equal(testData)

                    // Step 2: Switch to VARCHAR(N) and capture SQL
                    nameColumn.type = varcharTypeByDriver[driver]
                    nameColumn.length = originalLength
                    nameColumn.build(connection)

                    installRecorder()
                    let err
                    try {
                        await connection.synchronize()
                    } catch (e) {
                        err = e
                    } finally {
                        removeRecorder()
                    }
                    expect(err).to.be.undefined

                    if (driver === "postgres" || driver === "cockroachdb") {
                        expect(recordedSchemaChanges(recorded)).to.deep.equal([
                            driver === "postgres"
                                ? `ALTER TABLE "post" ALTER COLUMN "name" TYPE varchar(50)`
                                : `ALTER TABLE "post" ALTER COLUMN "name" SET DATA TYPE varchar(50)`,
                        ])
                    } else if (
                        driver === "mysql" ||
                        driver === "mariadb" ||
                        driver === "aurora-mysql"
                    ) {
                        expect(recordedSchemaChanges(recorded)).to.deep.equal([
                            "ALTER TABLE `post` MODIFY COLUMN `name` varchar(50) NULL DEFAULT 'My post'",
                        ])
                    } else if (driver === "mssql") {
                        expect(recordedSchemaChanges(recorded)).to.deep.equal([
                            'ALTER TABLE "post" DROP CONSTRAINT "DF_3b67503bc127f16f995481181a3"',
                            'ALTER TABLE "post" ALTER COLUMN [name] varchar(50) NULL',
                            'ALTER TABLE "post" ADD CONSTRAINT "DF_3b67503bc127f16f995481181a3" DEFAULT \'My post\' FOR [name]',
                        ])
                    } else if (driver === "oracle") {
                        expect(recordedSchemaChanges(recorded)).to.deep.equal([
                            `ALTER TABLE "post" MODIFY ("name" varchar2(50) DEFAULT 'My post')`,
                        ])
                    } else if (driver === "spanner") {
                        // No CHAR in Spanner; this test is skipped above for spanner
                    }

                    // Round-trip: ensure column exists and is still same length
                    const qr = connection.createQueryRunner()
                    const postTable = await qr.getTable("post")
                    await qr.release()
                    const col = postTable?.findColumnByName("name")
                    if (col?.length) expect(col.length).to.equal(originalLength)

                    // Verify data still exists after migration (data survived)
                    const afterChange = await repo.findOne({
                        where: { id: 1 },
                    })
                    expect(afterChange).to.not.be.undefined
                    expect(afterChange?.name?.trim()).to.equal(
                        testData,
                        "Data should survive CHAR->VARCHAR migration",
                    )

                    // Cleanup inserted data
                    await repo.delete({ name: testData })
                } catch (e) {
                    testErr = e
                } finally {
                    // Revert
                    nameColumn.type = originalType
                    nameColumn.length = originalLength
                    nameColumn.build(connection)
                    await connection.synchronize()
                }
                expect(testErr).to.be.undefined
            }),
        ))

    it("uses ALTER COLUMN when changing from FLOAT → DOUBLE", () =>
        Promise.all(
            dataSources.map(async (base: DataSource) => {
                // Create a fresh, isolated connection for THIS iteration, with ONLY Post registered.
                const driverType = base.driver?.options?.type
                const conns = await createTestingConnections({
                    entities: [Post], // <-- exclude PostVersion here
                    schemaCreate: true,
                    dropSchema: true,
                    enabledDrivers: driverType ? [driverType] : undefined,
                })

                if (!conns.length) return
                const connection = conns[0]

                // driver-specific type names
                const floatBy: Record<string, ColumnType> = {
                    postgres: "real",
                    cockroachdb: "real",
                    mysql: "float",
                    mariadb: "float",
                    "aurora-mysql": "float",
                    mssql: "float", // MSSQL 'float' is double-precision; emulate via precision change
                    // Oracle can widen populated IEEE float columns in-place via
                    // BINARY_FLOAT -> BINARY_DOUBLE, while FLOAT -> BINARY_DOUBLE
                    // hits ORA-01439 because FLOAT is a NUMBER subtype.
                    oracle: "binary_float",
                    spanner: "float64", // Spanner only has FLOAT64 (double); we bail below
                }
                const doubleBy: Record<string, ColumnType> = {
                    postgres: "double precision",
                    cockroachdb: "double precision",
                    mysql: "double",
                    mariadb: "double",
                    "aurora-mysql": "double",
                    mssql: "float", // stay 'float', bump precision to emulate change
                    oracle: "binary_double",
                }

                const driver = connection.driver.options.type
                if (driver === "spanner") {
                    await closeTestingConnections(conns)
                    return
                }
                if (driver === "oracle") {
                    await closeTestingConnections(conns)
                    return
                }
                if (!floatBy[driver] || !doubleBy[driver]) {
                    await closeTestingConnections(conns)
                    return
                }

                // SQL recorder
                const {
                    recorded,
                    install: installRecorder,
                    remove: removeRecorder,
                } = createSqlRecorder(connection)

                // Test body (same assertions, just run on the isolated connection)
                const postMeta = connection.getMetadata(Post)
                const versionCol =
                    postMeta.findColumnWithPropertyName("version")
                if (!versionCol) {
                    await closeTestingConnections(conns)
                    return
                }
                const originalType = versionCol.type
                const originalPrecision = versionCol.precision

                let testErr
                try {
                    // Step 1: set FLOAT
                    versionCol.type = floatBy[driver]
                    if (driver === "mssql") versionCol.precision = 24
                    versionCol.build(connection)
                    await connection.synchronize()

                    // Insert data BEFORE migration to test survival
                    const repo = connection.getRepository(Post)
                    const testValue = 1.5
                    await repo.save({
                        id: 1,
                        name: "test",
                        version: testValue.toString(),
                        text: "content",
                        tag: "test",
                        likesCount: 1,
                    })

                    // Verify data exists before migration
                    const beforeChange = await repo.findOne({
                        where: { name: "test" },
                    })
                    expect(beforeChange).to.not.be.undefined
                    expect(String(beforeChange?.version)).to.equal(
                        testValue.toString(),
                    )

                    // Step 2: change to DOUBLE (or higher-precision float)
                    versionCol.type = doubleBy[driver]
                    if (driver === "mssql") versionCol.precision = 53
                    versionCol.build(connection)

                    installRecorder()
                    let err
                    try {
                        await connection.synchronize()
                    } catch (e) {
                        err = e
                    } finally {
                        removeRecorder()
                    }
                    expect(err).to.be.undefined

                    const sqlBlob = recorded.join("\n")

                    if (driver === "postgres" || driver === "cockroachdb") {
                        expect(sqlBlob).to.match(
                            /ALTER TABLE .* ALTER COLUMN "version" (SET DATA TYPE|TYPE) .*double/i,
                        )
                        expect(sqlBlob).to.not.match(/ADD COLUMN\s+"version"/i)
                        expect(sqlBlob).to.not.match(/DROP COLUMN\s+"version"/i)
                    } else if (
                        driver === "mysql" ||
                        driver === "mariadb" ||
                        driver === "aurora-mysql"
                    ) {
                        const usedModify =
                            /ALTER TABLE .* (MODIFY|CHANGE) COLUMN `?version`? .*double/i.test(
                                sqlBlob,
                            )
                        expect(
                            usedModify,
                            `Expected MODIFY/CHANGE for 'version'.\n${sqlBlob}`,
                        ).to.equal(true)
                        expect(sqlBlob).to.not.match(
                            /ADD COLUMN\s+`?version`?/i,
                        )
                        expect(sqlBlob).to.not.match(
                            /DROP COLUMN\s+`?version`?/i,
                        )
                    } else if (driver === "mssql") {
                        expect(sqlBlob).to.match(
                            /ALTER TABLE[^\n]*ALTER COLUMN\s+(?:\[version\]|"version")\s+[^\n]*float/i, // NOSONAR - regex matches internally generated SQL
                        )
                        expect(sqlBlob).to.not.match(
                            /ADD\s+COLUMN\s+(?:\[version\]|"version")/i,
                        )
                        expect(sqlBlob).to.not.match(
                            /DROP\s+COLUMN\s+(?:\[version\]|"version")/i,
                        )
                    }

                    // Verify data still exists after migration (data survived)
                    const afterChange = await repo.findOne({
                        where: { name: "test" },
                    })
                    expect(afterChange).to.not.be.undefined
                    expect(String(afterChange?.version)).to.equal(
                        testValue.toString(),
                        "Data should survive FLOAT->DOUBLE migration",
                    )

                    // Cleanup inserted data
                    await repo.delete({ name: "test" })
                } catch (e) {
                    testErr = e
                } finally {
                    // Revert & clean up the isolated connection
                    versionCol.type = originalType
                    ;(versionCol as any).precision = originalPrecision
                    versionCol.build(connection)
                    let revertErr
                    try {
                        await connection.synchronize()
                    } catch (e) {
                        revertErr = e
                    }
                    expect(revertErr).to.be.undefined
                    await closeTestingConnections(conns)
                }
                expect(testErr).to.be.undefined
            }),
        ))

    it("uses ALTER COLUMN when changing from DATETIME → TIMESTAMP", () =>
        Promise.all(
            dataSources.map(async (connection: DataSource) => {
                const driver = connection.driver.options.type

                if (
                    driver === "postgres" ||
                    driver === "cockroachdb" ||
                    driver === "spanner"
                )
                    return

                const postMeta = connection.getMetadata(Post)
                const nameCol = postMeta.findColumnWithPropertyName("name")
                if (!nameCol) return
                const originalType = nameCol.type
                const originalLength = nameCol.length
                const originalDefault = nameCol.default // ← save this

                const datetimeBy: Record<string, ColumnType> = {
                    mysql: "datetime",
                    mariadb: "datetime",
                    "aurora-mysql": "datetime",
                    mssql: "datetime2",
                    oracle: "date",
                }
                const timestampBy: Record<string, ColumnType> = {
                    mysql: "timestamp",
                    mariadb: "timestamp",
                    "aurora-mysql": "timestamp",
                    mssql: "datetimeoffset",
                    oracle: "timestamp",
                }
                if (!datetimeBy[driver] || !timestampBy[driver]) return

                const {
                    recorded,
                    install: installRecorder,
                    remove: removeRecorder,
                } = createSqlRecorder(connection)

                let testErr
                try {
                    // STEP 1: varchar2 -> "datetime-like" (DATE for Oracle)
                    nameCol.type = datetimeBy[driver]
                    const temporalValue = new Date("2024-01-02T03:04:05.000Z")
                    const assertTemporalValue = (value: unknown) => {
                        expect(value).to.not.be.undefined
                        expect(value).to.not.be.null

                        const actual =
                            value instanceof Date
                                ? value
                                : new Date(String(value))

                        expect(
                            Number.isNaN(actual.getTime()),
                            `Expected a valid temporal value, got ${String(value)}`,
                        ).to.equal(false)
                        expect(actual.toISOString()).to.equal(
                            temporalValue.toISOString(),
                        )
                    }
                    const assertOracleStoredTemporalValue = async (
                        stage: "before" | "after",
                    ) => {
                        const rows = await connection.query(
                            `SELECT TO_CHAR("name", 'YYYY-MM-DD"T"HH24:MI:SS') AS "name" FROM "${postMeta.tableName}" WHERE "id" = 1`,
                        )

                        expect(
                            rows,
                            `Expected Oracle row to exist ${stage} schema change`,
                        ).to.have.length(1)
                        expect(rows[0]?.name).to.equal("2024-01-02T03:04:05")
                    }

                    if (driver === "oracle") {
                        // DATE must not have a bogus length or a string default
                        nameCol.length = ""
                        nameCol.default = undefined
                    } else if (
                        driver === "mysql" ||
                        driver === "mariadb" ||
                        driver === "aurora-mysql"
                    ) {
                        // arbitrary string default like 'My post' is invalid for temporal columns,
                        // so drop it for this test
                        nameCol.default = undefined
                        nameCol.length = ""
                    } else {
                        nameCol.length = ""
                    }

                    nameCol.build(connection)
                    await connection.synchronize()

                    // Insert data BEFORE migration to test survival
                    const repo = connection.getRepository(Post)
                    if (driver === "oracle") {
                        // Oracle DATE stores time-of-day, but TypeORM's `date`
                        // mapping normalizes through a date-only path. Insert
                        // the fixture with raw SQL so this test exercises the
                        // DATE -> TIMESTAMP schema change instead of driver
                        // hydration semantics.
                        await connection.query(
                            `INSERT INTO "${postMeta.tableName}" ("id", "name", "version", "text", "tag", "likesCount") VALUES (1, TO_DATE('2024-01-02 03:04:05', 'YYYY-MM-DD HH24:MI:SS'), '1.0', 'content', 'test', 1)`,
                        )
                    } else {
                        await repo.save({
                            id: 1,
                            name: temporalValue as unknown as string,
                            version: "1.0",
                            text: "content",
                            tag: "test",
                            likesCount: 1,
                        })
                    }

                    // Verify data exists before migration
                    if (driver === "oracle") {
                        await assertOracleStoredTemporalValue("before")
                    } else {
                        const beforeChange = await repo.findOne({
                            where: { id: 1 },
                        })
                        expect(beforeChange).to.not.be.undefined
                        assertTemporalValue(beforeChange?.name)
                    }

                    // STEP 2: datetime-like -> timestamp-like, record SQL
                    nameCol.type = timestampBy[driver]

                    if (driver === "oracle") {
                        ;(nameCol as any).precision = 6
                        nameCol.length = ""
                        // keep default undefined for this test
                    }

                    nameCol.build(connection)

                    installRecorder()
                    let err
                    try {
                        await connection.synchronize()
                    } catch (e) {
                        err = e
                    } finally {
                        removeRecorder()
                    }
                    expect(err).to.be.undefined

                    const sqlBlob = recorded.join("\n")
                    if (
                        driver === "mysql" ||
                        driver === "mariadb" ||
                        driver === "aurora-mysql"
                    ) {
                        const usedModify =
                            /ALTER TABLE .* (MODIFY|CHANGE) COLUMN `?name`? .*timestamp/i.test(
                                sqlBlob,
                            )
                        expect(
                            usedModify,
                            `Expected MODIFY/CHANGE for 'name'.\n${sqlBlob}`,
                        ).to.equal(true)
                        expect(sqlBlob).to.not.match(/ADD COLUMN\s+`?name`?/i)
                        expect(sqlBlob).to.not.match(/DROP COLUMN\s+`?name`?/i)
                    } else if (driver === "mssql") {
                        expect(sqlBlob).to.match(
                            /ALTER TABLE[^\n]*ALTER COLUMN\s+(?:\[name\]|"name")\s+[^\n]*(datetimeoffset|timestamp)/i, // NOSONAR - regex matches internally generated SQL
                        )
                        expect(sqlBlob).to.not.match(
                            /ADD\s+COLUMN\s+(?:\[name\]|"name")/i,
                        )
                        expect(sqlBlob).to.not.match(
                            /DROP\s+COLUMN\s+(?:\[name\]|"name")/i,
                        )
                    } else if (driver === "oracle") {
                        expect(sqlBlob).to.match(
                            /ALTER TABLE [^\n]* (MODIFY|ALTER COLUMN)\s{0,4}\(?\s{0,4}"name"\s+[^\n]*TIMESTAMP/i, // NOSONAR - regex matches internally generated SQL
                        )
                        expect(sqlBlob).to.not.match(/ADD COLUMN\s+"name"/i)
                        expect(sqlBlob).to.not.match(/DROP COLUMN\s+"name"/i)
                    }

                    // Verify data still exists after migration (data survived)
                    const afterChange = await repo.findOne({
                        where: { id: 1 },
                    })
                    expect(
                        afterChange,
                        "Data should survive DATETIME->TIMESTAMP migration",
                    ).to.not.be.undefined
                    assertTemporalValue(afterChange?.name)

                    // Cleanup inserted data
                    await repo.delete({ id: 1 })
                } catch (e) {
                    testErr = e
                } finally {
                    // Revert everything
                    nameCol.type = originalType
                    nameCol.length = originalLength
                    nameCol.default = originalDefault
                    ;(nameCol as any).precision = undefined
                    nameCol.build(connection)
                    await connection.synchronize()
                }
                expect(testErr).to.be.undefined
            }),
        ))

    it("uses ALTER COLUMN when increasing varchar length", () =>
        Promise.all(
            dataSources.map(async (connection: DataSource) => {
                // SQLite does not support ALTER COLUMN operations; requires recreating table
                if (DriverUtils.isSQLiteFamily(connection.driver)) return
                const queryRunner = connection.createQueryRunner()
                const repo = connection.getRepository("post")

                const metadata = connection.getMetadata("post")
                const nameColumnMetadata =
                    metadata.findColumnWithPropertyName("name")
                if (!nameColumnMetadata) {
                    await queryRunner.release()
                    return
                }
                const originalLength = nameColumnMetadata.length ?? ""

                // --- SQL recorder around synchronize() ---
                const {
                    recorded,
                    install: installRecorder,
                    remove: removeRecorder,
                } = createSqlRecorder(connection)

                let insertedRowId: number | undefined

                let testErr
                try {
                    // 1) Ensure start at varchar(50)
                    nameColumnMetadata.length = "50"
                    nameColumnMetadata.build(connection)
                    await connection.synchronize()

                    const preTable = await queryRunner.getTable("post")
                    const preCol = preTable?.findColumnByName("name")
                    if (preCol?.length) expect(preCol.length).to.equal("50")

                    // 2) Insert a 45-char value BEFORE schema change (to test data survival)
                    const fortyFive = "x".repeat(45)
                    const meta = repo.metadata
                    const requiredNoDefault = meta.columns.filter(
                        (c: ColumnMetadata) =>
                            !c.isNullable && !c.default && !c.isGenerated,
                    )

                    const payload: any = { name: fortyFive }

                    for (const c of requiredNoDefault) {
                        switch (c.propertyName) {
                            case "id": {
                                const t = String(c.type ?? "").toLowerCase()
                                const isBigInt =
                                    /\bbigint\b|^int8$|^bigserial$/.test(t) ||
                                    (typeof (c as { width?: number }).width ===
                                        "number" &&
                                        ((c as { width?: number }).width ??
                                            0) >= 20)

                                if (isBigInt) {
                                    payload.id ??= Math.min(
                                        Number.MAX_SAFE_INTEGER,
                                        9_000_000_000_000 +
                                            Math.floor(
                                                secureRandomInt(1_000_000),
                                            ),
                                    )
                                } else {
                                    payload.id ??=
                                        Math.floor(secureRandomInt(1_000_000)) +
                                        1
                                }
                                break
                            }
                            case "version":
                                payload.version ??= `v_${Date.now()}_${
                                    connection.options.type
                                }_${secureRandomBase36String(7)}`
                                break
                            case "tag":
                                payload.tag ??= `t_${secureRandomBase36String(4)}`
                                break
                            case "likesCount":
                                payload.likesCount ??= 1
                                break
                            default: {
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

                    let insertErr, row
                    try {
                        row = await repo.save(payload)
                        insertedRowId = row?.id
                    } catch (e) {
                        insertErr = e
                    }
                    expect(insertErr).to.be.undefined

                    // Verify data exists before migration
                    const beforeMigration = await repo.findOneByOrFail({
                        id: row?.id,
                    })
                    expect(beforeMigration.name.length).to.equal(45)

                    // 3) Widen to 80 and capture the SQL used by synchronize()
                    nameColumnMetadata.length = "80"
                    nameColumnMetadata.build(connection)

                    installRecorder()
                    let widenErr
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
                    const postCol = postTable?.findColumnByName("name")
                    if (postCol?.length) expect(postCol.length).to.equal("80")

                    // 4) Verify data still exists with original value after ALTER (data survived migration)
                    const afterMigration = await repo.findOneByOrFail({
                        id: row?.id,
                    })
                    expect(afterMigration.name.length).to.equal(45)
                    expect(afterMigration.name).to.equal(fortyFive)

                    const driver = connection.driver.options.type

                    if (driver === "postgres" || driver === "cockroachdb") {
                        expect(recordedSchemaChanges(recorded)).to.deep.equal([
                            driver === "postgres"
                                ? `ALTER TABLE "post" ALTER COLUMN "name" TYPE varchar(80)`
                                : `ALTER TABLE "post" ALTER COLUMN "name" SET DATA TYPE varchar(80)`,
                        ])
                    } else if (
                        driver === "mysql" ||
                        driver === "mariadb" ||
                        driver === "aurora-mysql"
                    ) {
                        expect(recordedSchemaChanges(recorded)).to.deep.equal([
                            "ALTER TABLE `post` CHANGE COLUMN `name` `name` varchar(80) NULL DEFAULT 'My post'",
                        ])
                    } else if (driver === "mssql") {
                        expect(recordedSchemaChanges(recorded)).to.deep.equal([
                            'ALTER TABLE "post" ALTER COLUMN [name] varchar(80) NULL',
                        ])
                    } else if (driver === "oracle") {
                        expect(recordedSchemaChanges(recorded)).to.deep.equal([
                            `ALTER TABLE "post" MODIFY ("name" varchar2(80))`,
                        ])
                    } else if (driver === "spanner") {
                        expect(recordedSchemaChanges(recorded)).to.deep.equal([
                            "ALTER TABLE `post` ALTER COLUMN `name` STRING(80)",
                        ])
                    }

                    // 5) Insert a 51-char value (should succeed with new length)
                    const fiftyOne = "x".repeat(51)
                    // Build a payload that satisfies NOT NULL columns that lack defaults/generation
                    const meta2 = repo.metadata
                    const requiredNoDefault2 = meta2.columns.filter(
                        (c: ColumnMetadata) =>
                            !c.isNullable && !c.default && !c.isGenerated,
                    )

                    // Start with the test's target value
                    const payload2: any = { name: fiftyOne }

                    for (const c of requiredNoDefault2) {
                        switch (c.propertyName) {
                            case "id": {
                                // Prefer a small int by default (works everywhere).
                                // Only switch to a big integer when the column is clearly bigint-like.
                                const t = String(c.type ?? "").toLowerCase()

                                const isBigInt =
                                    /\bbigint\b|^int8$|^bigserial$/.test(t) ||
                                    // TypeORM sometimes sets type as a function/constructor; stringify may be '[Function:Number]'.
                                    // If metadata has width info suggestive of bigint, treat as bigint (rare in this test schema).
                                    (typeof (c as { width?: number }).width ===
                                        "number" &&
                                        ((c as { width?: number }).width ??
                                            0) >= 20)

                                if (isBigInt) {
                                    // still keep it in JS safe integer range
                                    payload2.id ??= Math.min(
                                        Number.MAX_SAFE_INTEGER,
                                        // a "big" but safe number
                                        9_000_000_000_000 +
                                            Math.floor(
                                                secureRandomInt(1_000_000),
                                            ),
                                    )
                                } else {
                                    // safe 32-bit signed int to avoid MySQL overflow
                                    payload2.id ??=
                                        Math.floor(secureRandomInt(1_000_000)) +
                                        1 /* 1..1,000,000 */
                                }
                                break
                            }
                            case "version":
                                payload2.version ??= `v_${Date.now()}_${
                                    connection.options.type
                                }_${secureRandomBase36String(7)}`
                                break
                            case "tag":
                                payload2.tag ??= `t_${secureRandomBase36String(4)}`
                                break
                            case "likesCount":
                                payload2.likesCount ??= 1
                                break
                            default: {
                                // generic fallback
                                const t = String(c.type ?? "").toLowerCase()
                                const isNumeric =
                                    /(int|numeric|float|double|decimal|real)/.test(
                                        t,
                                    )
                                payload2[c.propertyName] ??= isNumeric ? 0 : ""
                                break
                            }
                        }
                    }

                    let insertErr2, row2
                    try {
                        row2 = await repo.save(payload2)
                    } catch (e) {
                        insertErr2 = e
                    }
                    expect(insertErr2).to.be.undefined

                    // 6) Verify new data works with increased length
                    const rt = await repo.findOneByOrFail({
                        id: row2?.id,
                    })
                    expect(rt.name.length).to.equal(51)
                } catch (e) {
                    testErr = e
                } finally {
                    // Revert data
                    let deleteErr
                    try {
                        if (insertedRowId !== undefined)
                            await repo.delete(insertedRowId)
                    } catch (e) {
                        deleteErr = e
                    }
                    expect(deleteErr).to.be.undefined
                    // Revert schema (restore original length)
                    let revertErr
                    try {
                        const nameColumnMetadata = connection
                            .getMetadata("post")
                            .findColumnWithPropertyName("name")
                        if (nameColumnMetadata) {
                            nameColumnMetadata.length = originalLength
                            nameColumnMetadata.build(connection)
                            await connection.synchronize()
                        }
                    } catch (e) {
                        revertErr = e
                    }
                    expect(revertErr).to.be.undefined
                    await queryRunner.release()
                }
                expect(testErr).to.be.undefined
            }),
        ))
    it("uses ALTER COLUMN when reducing varchar length", () =>
        Promise.all(
            dataSources.map(async (connection: DataSource) => {
                // SQLite does not support ALTER COLUMN operations; requires recreating table
                if (DriverUtils.isSQLiteFamily(connection.driver)) return
                const queryRunner = connection.createQueryRunner()
                const repo = connection.getRepository("post")

                const metadata = connection.getMetadata("post")
                const nameColumnMetadata =
                    metadata.findColumnWithPropertyName("name")
                if (!nameColumnMetadata) {
                    await queryRunner.release()
                    return
                }
                const originalLength = nameColumnMetadata.length ?? ""

                // --- SQL recorder around synchronize() ---
                const {
                    recorded,
                    install: installRecorder,
                    remove: removeRecorder,
                } = createSqlRecorder(connection)

                let insertedRowId: number | undefined

                let testErr
                try {
                    // 1) Ensure start at varchar(50)
                    nameColumnMetadata.length = "50"
                    nameColumnMetadata.build(connection)
                    await connection.synchronize()

                    const preTable = await queryRunner.getTable("post")
                    const preCol = preTable?.findColumnByName("name")
                    if (preCol?.length) expect(preCol.length).to.equal("50")

                    // 2) Insert a 30-char value BEFORE schema change (will survive reduction to 40)
                    const thirty = "x".repeat(30)
                    const meta = repo.metadata
                    const requiredNoDefault = meta.columns.filter(
                        (c: ColumnMetadata) =>
                            !c.isNullable && !c.default && !c.isGenerated,
                    )

                    const payload: any = { name: thirty }

                    for (const c of requiredNoDefault) {
                        switch (c.propertyName) {
                            case "id": {
                                const t = String(c.type ?? "").toLowerCase()
                                const isBigInt =
                                    /\bbigint\b|^int8$|^bigserial$/.test(t) ||
                                    (typeof (c as any).width === "number" &&
                                        (c as any).width >= 20)

                                if (isBigInt) {
                                    payload.id ??= Math.min(
                                        Number.MAX_SAFE_INTEGER,
                                        9_000_000_000_000 +
                                            Math.floor(
                                                secureRandomInt(1_000_000),
                                            ),
                                    )
                                } else {
                                    payload.id ??=
                                        Math.floor(secureRandomInt(1_000_000)) +
                                        1
                                }
                                break
                            }
                            case "version":
                                payload.version ??= `v_${Date.now()}_${
                                    connection.options.type
                                }_${secureRandomBase36String(7)}`
                                break
                            case "tag":
                                payload.tag ??= `t_${secureRandomBase36String(4)}`
                                break
                            case "likesCount":
                                payload.likesCount ??= 1
                                break
                            default: {
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

                    let insertErr, row
                    try {
                        row = await repo.save(payload)
                        insertedRowId = row?.id
                    } catch (e) {
                        insertErr = e
                    }
                    expect(insertErr).to.be.undefined

                    // Verify data exists before migration
                    const beforeMigration = await repo.findOneByOrFail({
                        id: row?.id,
                    })
                    expect(beforeMigration.name.length).to.equal(30)

                    // 3) Reduce to 40 and capture the SQL used by synchronize()
                    nameColumnMetadata.length = "40"
                    nameColumnMetadata.build(connection)

                    // 🔧 Cockroach v24.3+: shrinking requires experimental flag (session-scoped)
                    if (connection.driver.options.type === "cockroachdb") {
                        await connection.query(
                            "SET enable_experimental_alter_column_type_general = true",
                        )
                    }

                    installRecorder()
                    let widenErr
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
                    const postCol = postTable?.findColumnByName("name")
                    if (postCol?.length) expect(postCol.length).to.equal("40")

                    // 4) Verify data still exists with original value after ALTER (data survived migration)
                    const afterMigration = await repo.findOneByOrFail({
                        id: row?.id,
                    })
                    expect(afterMigration.name.length).to.equal(30)
                    expect(afterMigration.name).to.equal(thirty)

                    const driver = connection.driver.options.type

                    if (driver === "postgres" || driver === "cockroachdb") {
                        expect(recordedSchemaChanges(recorded)).to.deep.equal([
                            driver === "postgres"
                                ? `ALTER TABLE "post" ALTER COLUMN "name" TYPE varchar(40) USING substring("name" FROM 1 FOR 40)`
                                : `ALTER TABLE "post" ALTER COLUMN "name" SET DATA TYPE varchar(40) USING substring("name" FROM 1 FOR 40)`,
                        ])
                    } else if (
                        driver === "mysql" ||
                        driver === "mariadb" ||
                        driver === "aurora-mysql"
                    ) {
                        expect(recordedSchemaChanges(recorded)).to.deep.equal([
                            "UPDATE `post` SET `name` = LEFT(`name`, 40) WHERE CHAR_LENGTH(`name`) > 40",
                            "ALTER TABLE `post` CHANGE COLUMN `name` `name` varchar(40) NULL DEFAULT 'My post'",
                        ])
                    } else if (driver === "mssql") {
                        expect(recordedSchemaChanges(recorded)).to.deep.equal([
                            'UPDATE "post" SET [name] = LEFT([name], 40) WHERE DATALENGTH([name]) > 40',
                            'ALTER TABLE "post" ALTER COLUMN [name] varchar(40) NULL',
                        ])
                    } else if (driver === "oracle") {
                        expect(recordedSchemaChanges(recorded)).to.deep.equal([
                            'UPDATE "post" SET "name" = SUBSTR("name", 1, 40) WHERE LENGTH("name") > 40',
                            `ALTER TABLE "post" MODIFY ("name" varchar2(40))`,
                        ])
                    } else if (driver === "spanner") {
                        expect(recordedSchemaChanges(recorded)).to.deep.equal([
                            "UPDATE `post` SET `name` = SUBSTR(`name`, 1, 40) WHERE LENGTH(`name`) > 40",
                            "ALTER TABLE `post` ALTER COLUMN `name` STRING(40)",
                        ])
                    }
                    // 5) Insert a 40-char value (should succeed with new reduced length)
                    const forty = "x".repeat(40)
                    // Build a payload that satisfies NOT NULL columns that lack defaults/generation
                    const meta2 = repo.metadata
                    const requiredNoDefault2 = meta2.columns.filter(
                        (c: ColumnMetadata) =>
                            !c.isNullable && !c.default && !c.isGenerated,
                    )

                    // Start with the test's target value
                    const payload2: any = { name: forty }

                    for (const c of requiredNoDefault2) {
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
                                    payload2.id ??= Math.min(
                                        Number.MAX_SAFE_INTEGER,
                                        // a "big" but safe number
                                        9_000_000_000_000 +
                                            Math.floor(
                                                secureRandomInt(1_000_000),
                                            ),
                                    )
                                } else {
                                    // safe 32-bit signed int to avoid MySQL overflow
                                    payload2.id ??=
                                        Math.floor(secureRandomInt(1_000_000)) +
                                        1 /* 1..1,000,000 */
                                }
                                break
                            }
                            case "version":
                                payload2.version ??= `v_${Date.now()}_${
                                    connection.options.type
                                }_${secureRandomBase36String(7)}`
                                break
                            case "tag":
                                payload2.tag ??= `t_${secureRandomBase36String(4)}`
                                break
                            case "likesCount":
                                payload2.likesCount ??= 1
                                break
                            default: {
                                // generic fallback
                                const t = String(c.type ?? "").toLowerCase()
                                const isNumeric =
                                    /(int|numeric|float|double|decimal|real)/.test(
                                        t,
                                    )
                                payload2[c.propertyName] ??= isNumeric ? 0 : ""
                                break
                            }
                        }
                    }

                    let insertErr2, row2
                    try {
                        row2 = await repo.save(payload2)
                    } catch (e) {
                        insertErr2 = e
                    }
                    expect(insertErr2).to.be.undefined

                    // 6) Verify new data works with reduced length
                    const rt = await repo.findOneByOrFail({
                        id: row2?.id,
                    })
                    expect(rt.name.length).to.equal(40)
                } catch (e) {
                    testErr = e
                } finally {
                    // Revert data
                    let deleteErr
                    try {
                        if (insertedRowId !== undefined)
                            await repo.delete(insertedRowId)
                    } catch (e) {
                        deleteErr = e
                    }
                    expect(deleteErr).to.be.undefined
                    // Revert schema (restore original length)
                    let revertErr
                    try {
                        const nameColumnMetadata = connection
                            .getMetadata("post")
                            .findColumnWithPropertyName("name")
                        if (nameColumnMetadata) {
                            nameColumnMetadata.length = originalLength
                            nameColumnMetadata.build(connection)
                            await connection.synchronize()
                        }
                    } catch (e) {
                        revertErr = e
                    }
                    expect(revertErr).to.be.undefined
                    await queryRunner.release()
                }
                expect(testErr).to.be.undefined
            }),
        ))

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
                const postRepo = dataSource.getRepository(Post)
                const postVersionRepo = dataSource.getRepository(PostVersion)

                // Insert data BEFORE synchronize()
                await postRepo.insert({
                    id: 1234,
                    version: "5",
                    text: "a",
                    tag: "b",
                    likesCount: 45,
                })

                const post = await postRepo.findOneByOrFail({ id: 1234 })

                await postVersionRepo.insert({
                    id: 1,
                    post,
                    details: "Example",
                })

                // Verify data exists before migration
                const postBefore = await postRepo.findOneByOrFail({ id: 1234 })
                expect(postBefore.text).to.equal("a")
                expect(postBefore.tag).to.equal("b")

                const postVersionBefore = await postVersionRepo.findOneByOrFail(
                    { id: 1 },
                )
                expect(postVersionBefore.details).to.equal("Example")

                const postMetadata = dataSource.getMetadata(Post)
                const nameColumn =
                    postMetadata.findColumnWithPropertyName("name")!
                nameColumn.length = "500"

                await dataSource.synchronize()

                // Verify data still exists AFTER migration (data survived)
                const postAfter = await postRepo.findOneByOrFail({ id: 1234 })
                expect(postAfter.text).to.equal(
                    "a",
                    "Post data should survive migration",
                )
                expect(postAfter.tag).to.equal(
                    "b",
                    "Post data should survive migration",
                )

                const postVersionAfter = await postVersionRepo.findOneByOrFail({
                    id: 1,
                })
                expect(postVersionAfter.details).to.equal(
                    "Example",
                    "PostVersion data should survive migration",
                )

                const queryRunner = dataSource.createQueryRunner()
                const postVersionTable =
                    await queryRunner.getTable("post_version")
                await queryRunner.release()

                postVersionTable!.foreignKeys.length.should.be.equal(1)

                // revert changes
                nameColumn.length = "255"

                // Cleanup
                await postVersionRepo.delete({ id: 1 })
                await postRepo.delete({ id: 1234 })
            }),
        ))

    it("preserves existing data when widening varchar column", () =>
        Promise.all(
            dataSources.map(async (connection: DataSource) => {
                const driver = connection.driver.options.type

                // Skip Spanner as it doesn't support CHAR/VARCHAR in the same way
                if (driver === "spanner") return

                const metadata = connection.getMetadata(Post)
                const nameColumn = metadata.findColumnWithPropertyName("name")
                if (!nameColumn) return

                // Step 1: Create table with varchar(50)
                nameColumn.type = "varchar"
                nameColumn.length = "50"
                await connection.synchronize()

                // Step 2: Insert a 45-character value BEFORE schema change
                const longTitle = "This is a 45-character title to test data"
                const repository = connection.getRepository(Post)
                const post = new Post()
                post.id = 1
                post.name = longTitle
                post.version = "1.0"
                post.text = "Some content"
                post.tag = "test"
                post.likesCount = 1
                await repository.save(post)

                // Verify data exists before change
                const beforeChange = await repository.findOne({
                    where: { name: longTitle },
                })
                expect(beforeChange).to.not.be.undefined
                expect(beforeChange?.name).to.equal(longTitle)
                expect(beforeChange?.text).to.equal("Some content")

                // Step 3: Change to varchar(80) and synchronize
                nameColumn.type = "varchar"
                nameColumn.length = "80"
                await connection.synchronize()

                // Step 4: Verify data still exists with original value after ALTER
                const afterChange = await repository.findOne({
                    where: { name: longTitle },
                })
                expect(afterChange).to.not.be.undefined
                expect(afterChange?.name).to.equal(
                    longTitle,
                    "Data should be preserved after ALTER COLUMN",
                )
                expect(afterChange?.text).to.equal("Some content")

                // Revert schema for cleanup
                nameColumn.length = "255"
            }),
        ))
})
