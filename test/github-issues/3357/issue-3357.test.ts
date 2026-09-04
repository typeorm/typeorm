import "reflect-metadata"
import { expect } from "chai"
import sinon from "sinon"
import type { DataSource } from "../../../src"
import { Table } from "../../../src"
import type { Query } from "../../../src/driver/Query"
import { PostgresQueryRunner } from "../../../src/driver/postgres/PostgresQueryRunner"
import { TableColumn } from "../../../src/schema-builder/table/TableColumn"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

// RdbmsSchemaBuilder's schema-diff path calls changeColumns(), which delegates
// each column to changeColumn(). These tests inspect that generated query plan.
describe("github issues > #3357 postgres character length SQL", () => {
    function makeRunner() {
        const driver: any = {
            searchSchema: "public",
            database: "testdb",
            uuidGenerator: "uuid_generate_v4()",
            parseTableName: (target: Table | string) => {
                const name = typeof target === "string" ? target : target.name
                return { schema: "public", tableName: name }
            },
            createFullType: (column: TableColumn) =>
                column.length
                    ? `${column.type}(${column.length})`
                    : column.type,
        }
        const dataSource: any = {
            namingStrategy: {
                primaryKeyName: () => "PK_issue_3357",
            },
            driver,
        }
        driver.dataSource = dataSource
        return new PostgresQueryRunner(driver, "master")
    }

    function characterColumn(
        name: string,
        type: "varchar" | "character varying" | "char" | "character",
        length: string,
        collation?: string,
    ) {
        return new TableColumn({
            name,
            type,
            length,
            collation,
            isNullable: true,
        })
    }

    function capturedQueries(runner: PostgresQueryRunner) {
        const queries: { up: Query[]; down: Query[] } = { up: [], down: [] }
        sinon
            .stub(runner as any, "executeQueries")
            .callsFake(async (up: Query | Query[], down: Query | Query[]) => {
                queries.up = Array.isArray(up) ? up : [up]
                queries.down = Array.isArray(down) ? down : [down]
            })
        sinon.stub(runner as any, "replaceCachedTable")
        return queries
    }

    afterEach(() => sinon.restore())

    it("generates ALTER COLUMN TYPE instead of DROP COLUMN for varchar length growth", async () => {
        const runner = makeRunner()
        const oldColumn = characterColumn("value", "varchar", "50")
        const newColumn = characterColumn("value", "varchar", "51")
        const table = new Table({ name: "issue_3357", columns: [oldColumn] })
        const queries = capturedQueries(runner)
        const dropSpy = sinon.stub(runner, "dropColumn").resolves()
        const addSpy = sinon.stub(runner, "addColumn").resolves()

        await runner.changeColumns(table, [{ oldColumn, newColumn }])

        const sql = queries.up.map((query) => query.query).join("\n")
        expect(dropSpy.called).to.equal(false)
        expect(addSpy.called).to.equal(false)
        expect(sql).to.equal(
            'ALTER TABLE "issue_3357" ALTER COLUMN "value" TYPE varchar(51)',
        )
        expect(sql).not.to.contain("DROP COLUMN")
    })

    for (const type of ["char", "character"] as const) {
        it(`generates ALTER COLUMN TYPE for ${type} length-only changes`, async () => {
            const runner = makeRunner()
            const oldColumn = characterColumn("value", type, "50")
            const newColumn = characterColumn("value", type, "51")
            const table = new Table({
                name: "issue_3357",
                columns: [oldColumn],
            })
            const queries = capturedQueries(runner)
            const dropSpy = sinon.stub(runner, "dropColumn").resolves()

            await runner.changeColumn(table, oldColumn, newColumn)

            expect(dropSpy.called).to.equal(false)
            expect(queries.up.map((query) => query.query)).to.deep.equal([
                `ALTER TABLE "issue_3357" ALTER COLUMN "value" TYPE ${type}(51)`,
            ])
        })
    }

    for (const [oldType, newType] of [
        ["character varying", "varchar"],
        ["varchar", "character varying"],
        ["character", "char"],
        ["char", "character"],
    ] as const) {
        it(`generates ALTER COLUMN TYPE instead of DROP COLUMN for ${oldType} to ${newType} length growth`, async () => {
            const runner = makeRunner()
            const oldColumn = characterColumn("value", oldType, "50")
            const newColumn = characterColumn("value", newType, "51")
            const table = new Table({
                name: "issue_3357",
                columns: [oldColumn],
            })
            const queries = capturedQueries(runner)
            const dropSpy = sinon.stub(runner, "dropColumn").resolves()
            const addSpy = sinon.stub(runner, "addColumn").resolves()

            await runner.changeColumn(table, oldColumn, newColumn)

            expect(dropSpy.called).to.equal(false)
            expect(addSpy.called).to.equal(false)
            expect(queries.up.map((query) => query.query)).to.deep.equal([
                `ALTER TABLE "issue_3357" ALTER COLUMN "value" TYPE ${newType}(51)`,
            ])
        })
    }

    it("retains DROP and ADD for a varchar-to-integer type-family change", async () => {
        const runner = makeRunner()
        const oldColumn = characterColumn("value", "varchar", "50")
        const newColumn = new TableColumn({
            name: "value",
            type: "integer",
            isNullable: true,
        })
        const table = new Table({ name: "issue_3357", columns: [oldColumn] })
        capturedQueries(runner)
        const dropSpy = sinon.stub(runner, "dropColumn").resolves()
        const addSpy = sinon.stub(runner, "addColumn").resolves()

        await runner.changeColumn(table, oldColumn, newColumn)

        expect(dropSpy.calledOnceWith(table, oldColumn)).to.equal(true)
        expect(addSpy.calledOnceWith(table, newColumn)).to.equal(true)
    })

    it("does not emit length-stripping ALTER statements when varchar length and collation change", async () => {
        const runner = makeRunner()
        const oldColumn = characterColumn("value", "character varying", "50")
        const newColumn = characterColumn("value", "varchar", "51", "C")
        const table = new Table({ name: "issue_3357", columns: [oldColumn] })
        const queries = capturedQueries(runner)
        const dropSpy = sinon.stub(runner, "dropColumn").resolves()
        const addSpy = sinon.stub(runner, "addColumn").resolves()

        await runner.changeColumn(table, oldColumn, newColumn)

        const sql = queries.up.map((query) => query.query).join("\n")
        expect(dropSpy.calledOnceWith(table, oldColumn)).to.equal(true)
        expect(addSpy.calledOnceWith(table, newColumn)).to.equal(true)
        expect(sql).not.to.contain("TYPE varchar(51)")
        expect(sql).not.to.contain('TYPE varchar COLLATE "C"')
    })
})

describe("github issues > #3357 postgres character length live", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
        })
    })

    after(() => closeTestingConnections(dataSources))

    async function createValueTable(
        dataSource: DataSource,
        type: "varchar" | "character varying" | "char" | "character",
        length: string,
        isNullable = false,
    ) {
        const queryRunner = dataSource.createQueryRunner()
        await queryRunner.query('DROP TABLE IF EXISTS "issue_3357_value"')
        await queryRunner.query(
            `CREATE TABLE "issue_3357_value" ("value" ${type}(${length}) ${isNullable ? "NULL" : "NOT NULL"})`,
        )
        return queryRunner
    }

    it("preserves rows when varchar length grows", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = await createValueTable(
                    dataSource,
                    "varchar",
                    "50",
                )
                try {
                    await queryRunner.query(
                        'INSERT INTO "issue_3357_value" ("value") VALUES ($1)',
                        ["data survives a varchar length increase"],
                    )
                    const table = await queryRunner.getTable("issue_3357_value")
                    const oldColumn = table!.findColumnByName("value")!
                    const newColumn = oldColumn.clone()
                    newColumn.length = "51"

                    await queryRunner.changeColumn(table!, oldColumn, newColumn)

                    expect(
                        await queryRunner.query(
                            'SELECT "value" FROM "issue_3357_value"',
                        ),
                    ).to.deep.equal([
                        { value: "data survives a varchar length increase" },
                    ])
                } finally {
                    await queryRunner.query(
                        'DROP TABLE IF EXISTS "issue_3357_value"',
                    )
                    await queryRunner.release()
                }
            }),
        )
    })

    it("rejects varchar length decreases with oversized rows without dropping the column", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = await createValueTable(
                    dataSource,
                    "varchar",
                    "51",
                )
                try {
                    const oversizedValue = "x".repeat(51)
                    await queryRunner.query(
                        'INSERT INTO "issue_3357_value" ("value") VALUES ($1)',
                        [oversizedValue],
                    )
                    const table = await queryRunner.getTable("issue_3357_value")
                    const oldColumn = table!.findColumnByName("value")!
                    const newColumn = oldColumn.clone()
                    newColumn.length = "50"
                    let error: unknown

                    try {
                        await queryRunner.changeColumn(
                            table!,
                            oldColumn,
                            newColumn,
                        )
                    } catch (caught) {
                        error = caught
                    }

                    expect(error).to.exist
                    const changedTable =
                        await queryRunner.getTable("issue_3357_value")
                    expect(
                        changedTable!.findColumnByName("value")!.length,
                    ).to.equal("51")
                    expect(
                        await queryRunner.query(
                            'SELECT "value" FROM "issue_3357_value"',
                        ),
                    ).to.deep.equal([{ value: oversizedValue }])
                } finally {
                    await queryRunner.query(
                        'DROP TABLE IF EXISTS "issue_3357_value"',
                    )
                    await queryRunner.release()
                }
            }),
        )
    })

    for (const type of ["char", "character"] as const) {
        it(`preserves rows when ${type} length grows`, async () => {
            await Promise.all(
                dataSources.map(async (dataSource) => {
                    const queryRunner = await createValueTable(
                        dataSource,
                        type,
                        "50",
                    )
                    try {
                        await queryRunner.query(
                            'INSERT INTO "issue_3357_value" ("value") VALUES ($1)',
                            ["character data"],
                        )
                        const table =
                            await queryRunner.getTable("issue_3357_value")
                        const oldColumn = table!.findColumnByName("value")!
                        const newColumn = oldColumn.clone()
                        newColumn.length = "51"

                        await queryRunner.changeColumn(
                            table!,
                            oldColumn,
                            newColumn,
                        )

                        expect(
                            await queryRunner.query(
                                'SELECT RTRIM("value") AS "value" FROM "issue_3357_value"',
                            ),
                        ).to.deep.equal([{ value: "character data" }])
                    } finally {
                        await queryRunner.query(
                            'DROP TABLE IF EXISTS "issue_3357_value"',
                        )
                        await queryRunner.release()
                    }
                }),
            )
        })
    }

    for (const [oldType, newType, introspectedType] of [
        ["character varying", "varchar", "character varying"],
        ["varchar", "character varying", "character varying"],
        ["character", "char", "character"],
        ["char", "character", "character"],
    ] as const) {
        it(`preserves rows for introspected ${oldType} to ${newType} length growth`, async () => {
            await Promise.all(
                dataSources.map(async (dataSource) => {
                    const queryRunner = await createValueTable(
                        dataSource,
                        oldType,
                        "50",
                    )
                    try {
                        const value = `data survives ${oldType} to ${newType}`
                        await queryRunner.query(
                            'INSERT INTO "issue_3357_value" ("value") VALUES ($1)',
                            [value],
                        )
                        const table =
                            await queryRunner.getTable("issue_3357_value")
                        const oldColumn = table!.findColumnByName("value")!
                        expect(oldColumn.type).to.equal(introspectedType)
                        oldColumn.type = oldType
                        const newColumn = oldColumn.clone()
                        newColumn.type = newType
                        newColumn.length = "51"

                        await queryRunner.changeColumn(
                            table!,
                            oldColumn,
                            newColumn,
                        )

                        expect(
                            await queryRunner.query(
                                'SELECT RTRIM("value") AS "value" FROM "issue_3357_value"',
                            ),
                        ).to.deep.equal([{ value }])
                    } finally {
                        await queryRunner.query(
                            'DROP TABLE IF EXISTS "issue_3357_value"',
                        )
                        await queryRunner.release()
                    }
                }),
            )
        })
    }

    it("retains the requested varchar length when it changes with collation", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = await createValueTable(
                    dataSource,
                    "character varying",
                    "50",
                    true,
                )
                try {
                    await queryRunner.query(
                        'INSERT INTO "issue_3357_value" ("value") VALUES ($1)',
                        ["mixed length and collation change"],
                    )
                    const table = await queryRunner.getTable("issue_3357_value")
                    const oldColumn = table!.findColumnByName("value")!
                    const newColumn = oldColumn.clone()
                    newColumn.type = "varchar"
                    newColumn.length = "51"
                    newColumn.collation = "C"

                    await queryRunner.changeColumn(table!, oldColumn, newColumn)

                    const changedTable =
                        await queryRunner.getTable("issue_3357_value")
                    const changedColumn =
                        changedTable!.findColumnByName("value")!
                    expect(changedColumn.length).to.equal("51")
                    expect(changedColumn.collation).to.equal("C")
                } finally {
                    await queryRunner.query(
                        'DROP TABLE IF EXISTS "issue_3357_value"',
                    )
                    await queryRunner.release()
                }
            }),
        )
    })

    it("alters the old name before renaming and supports the reverse change", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = await createValueTable(
                    dataSource,
                    "varchar",
                    "50",
                )
                try {
                    await queryRunner.query(
                        'INSERT INTO "issue_3357_value" ("value") VALUES ($1)',
                        ["rename data"],
                    )
                    let table = await queryRunner.getTable("issue_3357_value")
                    let oldColumn = table!.findColumnByName("value")!
                    let newColumn = oldColumn.clone()
                    newColumn.name = "renamed_value"
                    newColumn.length = "51"

                    await queryRunner.changeColumn(table!, oldColumn, newColumn)

                    table = await queryRunner.getTable("issue_3357_value")
                    oldColumn = table!.findColumnByName("renamed_value")!
                    newColumn = oldColumn.clone()
                    newColumn.name = "value"
                    newColumn.length = "50"

                    await queryRunner.changeColumn(table!, oldColumn, newColumn)

                    const changedTable =
                        await queryRunner.getTable("issue_3357_value")
                    expect(
                        changedTable!.findColumnByName("value")!.length,
                    ).to.equal("50")
                    expect(
                        await queryRunner.query(
                            'SELECT "value" FROM "issue_3357_value"',
                        ),
                    ).to.deep.equal([{ value: "rename data" }])
                } finally {
                    await queryRunner.query(
                        'DROP TABLE IF EXISTS "issue_3357_value"',
                    )
                    await queryRunner.release()
                }
            }),
        )
    })
})
