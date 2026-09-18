import "reflect-metadata"
import { expect } from "chai"
import { EntitySchema } from "../../../../../../src"
import type { DataSource, QueryRunner } from "../../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../../../utils/test-utils"

const example = new EntitySchema({
    name: "VarcharWidening",
    tableName: "varchar_widening",
    columns: {
        id: { type: Number, primary: true },
        value: { type: String, length: 50, nullable: true },
    },
    indices: [{ name: "idx_varchar_widening_value", columns: ["value"] }],
})
const values = [
    "sentinel-order-A",
    "O'Brien-β",
    "trailing spaces   ",
    "",
    "漢字🙂",
    null,
]
const rows = values.map((value, i) => ({ id: i + 1, value }))

// Regression for #3357. Use the real Postgres driver, generated SQL and stored data.
describe("schema builder > postgres varchar widening", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            entities: [example],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(async () => {
        for (const dataSource of dataSources) {
            dataSource
                .getMetadata("VarcharWidening")
                .findColumnWithPropertyName("value")!.length = "50"
            await dataSource.synchronize(true)
            await dataSource.getRepository("VarcharWidening").insert(rows)
        }
    })
    after(() => closeTestingConnections(dataSources))

    const withRunner = (
        run: (dataSource: DataSource, runner: QueryRunner) => Promise<void>,
    ) =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const runner = dataSource.createQueryRunner()
                try {
                    await run(dataSource, runner)
                } finally {
                    await runner.release()
                }
            }),
        )
    const stored = (dataSource: DataSource, name = "value") =>
        dataSource.query(
            `SELECT id, "${name}" AS value FROM varchar_widening ORDER BY id`,
        )
    const resize = async (runner: QueryRunner, length: string) => {
        const table = (await runner.getTable("varchar_widening"))!
        const old = table.findColumnByName("value")!
        const next = old.clone()
        next.length = length
        await runner.changeColumn(table, old, next)
    }

    it("should generate an in-place migration and preserve every value when widening", () =>
        withRunner(async (dataSource) => {
            dataSource
                .getMetadata("VarcharWidening")
                .findColumnWithPropertyName("value")!.length = "51"
            const migration = await dataSource.driver
                .createSchemaBuilder()
                .log()
            expect(migration.upQueries.map((q) => q.query)).to.include(
                'ALTER TABLE "varchar_widening" ALTER COLUMN "value" TYPE character varying(51)',
            )
            expect(
                migration.upQueries.some((q) => /DROP COLUMN/.test(q.query)),
            ).to.equal(false)
            await dataSource.synchronize()
            expect(await stored(dataSource)).to.deep.equal(rows)
            expect(
                (await dataSource.driver.createSchemaBuilder().log()).upQueries,
            ).to.have.length(0)
        }))

    it("should retain indexes, nulls, Unicode and spaces through changeColumn and down SQL", () =>
        withRunner(async (dataSource, runner) => {
            const before = await dataSource.query(
                "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'varchar_widening' ORDER BY indexname",
            )
            await resize(runner, "100")
            expect(await stored(dataSource)).to.deep.equal(rows)
            expect(
                (await runner.getTable("varchar_widening"))!.findColumnByName(
                    "value",
                )!.length,
            ).to.equal("100")
            const after = await dataSource.query(
                "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'varchar_widening' ORDER BY indexname",
            )
            expect(after).to.deep.equal(before)
            expect(
                runner.getMemorySql().downQueries.map((q) => q.query),
            ).to.deep.equal([
                'ALTER TABLE "varchar_widening" ALTER COLUMN "value" TYPE character varying(50)',
            ])
            await runner.executeMemoryDownSql()
            expect(await stored(dataSource)).to.deep.equal(rows)
            expect(
                (await runner.getTable("varchar_widening"))!.findColumnByName(
                    "value",
                )!.length,
            ).to.equal("50")
        }))

    it("should widen to unbounded varchar and keep the cached length current", () =>
        withRunner(async (dataSource, runner) => {
            await resize(runner, "")
            expect(await stored(dataSource)).to.deep.equal(rows)
            expect(
                (await runner.getTable("varchar_widening"))!.findColumnByName(
                    "value",
                )!.length,
            ).to.equal("")
            await dataSource.query(
                "INSERT INTO varchar_widening VALUES (99, $1)",
                ["x".repeat(300)],
            )
            expect(
                (
                    await dataSource.query(
                        "SELECT char_length(value) AS n FROM varchar_widening WHERE id=99",
                    )
                )[0].n,
            ).to.equal(300)
        }))

    it("should use the updated cached length for successive in-place changes", () =>
        withRunner(async (dataSource, runner) => {
            const table = (await runner.getTable("varchar_widening"))!
            const first = table.findColumnByName("value")!.clone()
            first.length = "51"
            await runner.changeColumn("varchar_widening", "value", first)
            runner.clearSqlMemory()
            const second = first.clone()
            second.length = "75"
            // Do not reload the table: the second operation must use the cache.
            await runner.changeColumn("varchar_widening", "value", second)
            expect(runner.getMemorySql().downQueries[0].query).to.contain(
                "character varying(51)",
            )
            expect(await stored(dataSource)).to.deep.equal(rows)
            await runner.executeMemoryDownSql()
            expect(
                (await runner.getTable("varchar_widening"))!.findColumnByName(
                    "value",
                )!.length,
            ).to.equal("51")
        }))

    it("should apply rename, nullability, default and comment changes alongside widening", () =>
        withRunner(async (dataSource, runner) => {
            await dataSource.query(
                "DELETE FROM varchar_widening WHERE value IS NULL",
            )
            const table = (await runner.getTable("varchar_widening"))!
            const old = table.findColumnByName("value")!
            const next = old.clone()
            next.name = "renamed"
            next.length = "100"
            next.isNullable = false
            next.default = "'fallback'"
            next.comment = "Preserve O'Brien's reference"
            await runner.changeColumn(table, old, next)
            expect(await stored(dataSource, "renamed")).to.deep.equal(
                rows.filter((r) => r.value !== null),
            )
            const changed = (await runner.getTable(
                "varchar_widening",
            ))!.findColumnByName("renamed")!
            expect(changed.length).to.equal("100")
            expect(changed.isNullable).to.equal(false)
            expect(changed.default).to.contain("fallback")
            expect(changed.comment).to.equal(next.comment)
            await runner.executeMemoryDownSql()
            expect(await stored(dataSource)).to.deep.equal(
                rows.filter((r) => r.value !== null),
            )
            const reverted = (await runner.getTable(
                "varchar_widening",
            ))!.findColumnByName("value")!
            expect(reverted.length).to.equal("50")
            expect(reverted.isNullable).to.equal(true)
            expect(reverted.default).to.equal(undefined)
        }))

    it("should preserve a unique constraint and its referencing foreign key", () =>
        withRunner(async (dataSource, runner) => {
            await dataSource.query(
                "ALTER TABLE varchar_widening ADD CONSTRAINT unique_value UNIQUE (value)",
            )
            await dataSource.query(
                "CREATE TABLE widening_child (value varchar(50) REFERENCES varchar_widening(value))",
            )
            await dataSource.query("INSERT INTO widening_child VALUES ($1)", [
                values[0],
            ])
            await resize(runner, "100")
            expect(await stored(dataSource)).to.deep.equal(rows)
            expect(
                await dataSource.query("SELECT value FROM widening_child"),
            ).to.deep.equal([{ value: values[0] }])
            await expect(
                dataSource.query(
                    "INSERT INTO varchar_widening VALUES (99, $1)",
                    [values[0]],
                ),
            ).to.be.rejected
            await expect(
                dataSource.query("INSERT INTO widening_child VALUES ($1)", [
                    "absent",
                ]),
            ).to.be.rejected
        }))

    it("should preserve a varchar primary key, check constraint and explicit collation", () =>
        withRunner(async (dataSource, runner) => {
            await dataSource.query(
                'CREATE TABLE widening_primary (value varchar(10) COLLATE "C" PRIMARY KEY CHECK (length(value) > 0))',
            )
            await dataSource.query("INSERT INTO widening_primary VALUES ($1)", [
                "key   ",
            ])
            const table = (await runner.getTable("widening_primary"))!
            const old = table.findColumnByName("value")!
            const next = old.clone()
            next.length = "20"
            await runner.changeColumn(table, old, next)
            expect(
                await dataSource.query("SELECT value FROM widening_primary"),
            ).to.deep.equal([{ value: "key   " }])
            const current = (await runner.getTable(
                "widening_primary",
            ))!.findColumnByName("value")!
            expect(current.length).to.equal("20")
            expect(current.isPrimary).to.equal(true)
            const collation = await dataSource.query(
                "SELECT c.collname FROM pg_attribute a JOIN pg_collation c ON c.oid=a.attcollation WHERE a.attrelid='widening_primary'::regclass AND a.attname='value'",
            )
            expect(collation).to.deep.equal([{ collname: "C" }])
            await runner.executeMemoryDownSql()
            expect(
                await dataSource.query("SELECT value FROM widening_primary"),
            ).to.deep.equal([{ value: "key   " }])
            const restored = await dataSource.query(
                "SELECT c.collname, a.atttypmod FROM pg_attribute a JOIN pg_collation c ON c.oid=a.attcollation WHERE a.attrelid='widening_primary'::regclass AND a.attname='value'",
            )
            expect(restored).to.deep.equal([{ collname: "C", atttypmod: 14 }])
            await expect(
                dataSource.query("INSERT INTO widening_primary VALUES ('')"),
            ).to.be.rejected
        }))

    it("should preserve varchar array elements when widening the element length", () =>
        withRunner(async (dataSource, runner) => {
            await dataSource.query(
                "CREATE TABLE widening_array (value varchar(10)[])",
            )
            const original = ["a  ", "漢字🙂", null, ""]
            await dataSource.query("INSERT INTO widening_array VALUES ($1)", [
                original,
            ])
            const table = (await runner.getTable("widening_array"))!
            const old = table.findColumnByName("value")!
            const next = old.clone()
            next.length = "20"
            await runner.changeColumn(table, old, next)
            expect(
                await dataSource.query("SELECT value FROM widening_array"),
            ).to.deep.equal([{ value: original }])
            expect(
                runner
                    .getMemorySql()
                    .upQueries.map((q) => q.query)
                    .join(";"),
            ).not.to.contain("DROP COLUMN")
            await runner.executeMemoryDownSql()
            expect(
                await dataSource.query("SELECT value FROM widening_array"),
            ).to.deep.equal([{ value: original }])
        }))

    it("should not erase longer new values when the generated down SQL rejects them", () =>
        withRunner(async (dataSource, runner) => {
            await resize(runner, "100")
            await dataSource.query(
                "INSERT INTO varchar_widening VALUES (99, $1)",
                ["x".repeat(51)],
            )
            await expect(runner.executeMemoryDownSql()).to.be.rejected
            expect(
                (
                    await dataSource.query(
                        "SELECT value FROM varchar_widening WHERE id=99",
                    )
                )[0].value,
            ).to.equal("x".repeat(51))
            expect(
                (await runner.getTable("varchar_widening"))!.findColumnByName(
                    "value",
                )!.length,
            ).to.equal("100")
        }))

    it("should retain PostgreSQL's documented trailing-space semantics in generated down SQL", () =>
        withRunner(async (dataSource, runner) => {
            await resize(runner, "100")
            await dataSource.query(
                "INSERT INTO varchar_widening VALUES (99, $1)",
                ["x".repeat(49) + "   "],
            )
            await runner.executeMemoryDownSql()
            // A down migration narrows. PostgreSQL can trim excess spaces without error.
            // This regression documents that native behavior; it is NOT lossless rollback.
            expect(
                (
                    await dataSource.query(
                        "SELECT value FROM varchar_widening WHERE id=99",
                    )
                )[0].value,
            ).to.equal("x".repeat(49) + " ")
        }))

    it("should leave fixed-width character resizing on its existing path", () =>
        withRunner(async (dataSource, runner) => {
            await dataSource.query(
                "CREATE TABLE widening_fixed (value character(10))",
            )
            const table = (await runner.getTable("widening_fixed"))!
            const old = table.findColumnByName("value")!
            const next = old.clone()
            // Bare character has length 1, unlike unbounded varchar.
            next.length = ""
            runner.enableSqlMemory()
            await runner.changeColumn(table, old, next)
            expect(
                runner
                    .getMemorySql()
                    .upQueries.some((q) => /DROP COLUMN/.test(q.query)),
            ).to.equal(true)
            runner.disableSqlMemory()
        }))

    it("should escape a quoted collation name when preserving it", () =>
        withRunner(async (dataSource, runner) => {
            await dataSource.query(
                'CREATE COLLATION "widening""quoted" FROM "C"',
            )
            try {
                await dataSource.query(
                    'CREATE TABLE widening_quoted (value varchar(10) COLLATE "widening""quoted")',
                )
                await dataSource.query(
                    "INSERT INTO widening_quoted VALUES ($1)",
                    ["keep   "],
                )
                const table = (await runner.getTable("widening_quoted"))!
                const old = table.findColumnByName("value")!
                const next = old.clone()
                next.length = "20"
                await runner.changeColumn(table, old, next)
                expect(
                    await dataSource.query("SELECT value FROM widening_quoted"),
                ).to.deep.equal([{ value: "keep   " }])
                const collation = await dataSource.query(
                    "SELECT c.collname FROM pg_attribute a JOIN pg_collation c ON c.oid=a.attcollation WHERE a.attrelid='widening_quoted'::regclass AND a.attname='value'",
                )
                expect(collation).to.deep.equal([
                    { collname: 'widening"quoted' },
                ])
            } finally {
                await dataSource.query("DROP TABLE IF EXISTS widening_quoted")
                await dataSource.query('DROP COLLATION "widening""quoted"')
            }
        }))

    for (const scenario of [
        { name: "narrowing", changes: { length: "10" } },
        {
            name: "changed collation",
            changes: { length: "100", collation: "C" },
        },
        { name: "changed type", changes: { length: "100", type: "character" } },
        {
            name: "changed array shape",
            changes: { length: "100", isArray: true },
        },
    ]) {
        it(`should leave ${scenario.name} on its existing SQL-generation path`, () =>
            withRunner(async (_dataSource, runner) => {
                const table = (await runner.getTable("varchar_widening"))!
                const old = table.findColumnByName("value")!
                const next = old.clone()
                Object.assign(next, scenario.changes)
                runner.enableSqlMemory()
                await runner.changeColumn(table, old, next)
                expect(
                    runner
                        .getMemorySql()
                        .upQueries.some((q) => /DROP COLUMN/.test(q.query)),
                ).to.equal(true)
                runner.disableSqlMemory()
            }))
    }
})
