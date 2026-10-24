import "reflect-metadata"
import { expect } from "chai"
import { EntitySchema } from "../../../../../../src"
import type {
    DataSource,
    QueryRunner,
    TableColumn,
} from "../../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../../../utils/test-utils"

const entity = new EntitySchema({
    name: "VarcharCollation",
    tableName: "varchar_collation",
    columns: {
        id: { type: Number, primary: true },
        value: { type: String, length: 50, nullable: true },
    },
    indices: [{ name: "idx_varchar_collation_value", columns: ["value"] }],
})
const rows = ["sentinel", "O'Brien-β", "keep   ", "漢字🙂", null].map(
    (value, i) => ({ id: i + 1, value }),
)
const stored = (runner: QueryRunner, name = "value") =>
    runner.query(
        `SELECT id, "${name}" AS value FROM public.varchar_collation ORDER BY id`,
    )
const metadata = async (runner: QueryRunner) =>
    (
        await runner.query(
            `SELECT a.attnum, format_type(a.atttypid,a.atttypmod) AS type, n.nspname AS schema, c.collname AS collation FROM pg_attribute a JOIN pg_collation c ON c.oid=a.attcollation JOIN pg_namespace n ON n.oid=c.collnamespace WHERE a.attrelid='public.varchar_collation'::regclass AND a.attname='value' AND NOT a.attisdropped`,
        )
    )[0]
const dependencies = (runner: QueryRunner) =>
    runner.query(
        `SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='varchar_collation' ORDER BY indexname`,
    )
const assertNoDrop = (runner: QueryRunner) =>
    expect(
        runner
            .getMemorySql()
            .upQueries.some((q) => /DROP COLUMN/.test(q.query)),
    ).to.equal(false)

// Combined length/collation regression for #3357; SQL is executed on PostgreSQL.
describe("schema builder > postgres varchar collation changes", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            entities: [entity],
            schemaCreate: true,
            dropSchema: true,
        })
        for (const ds of dataSources)
            await ds.getRepository("VarcharCollation").insert(rows)
    })
    after(() => closeTestingConnections(dataSources))
    const withRunner = (
        run: (runner: QueryRunner, ds: DataSource) => Promise<void>,
    ) =>
        Promise.all(
            dataSources.map(async (ds) => {
                const runner = ds.createQueryRunner()
                await runner.startTransaction()
                try {
                    await run(runner, ds)
                } finally {
                    while (runner.isTransactionActive)
                        await runner.rollbackTransaction()
                    await runner.release()
                }
            }),
        )
    const change = async (
        runner: QueryRunner,
        changes: Partial<TableColumn>,
    ) => {
        const table = (await runner.getTable("public.varchar_collation"))!
        const old = table.findColumnByName("value")!
        const next = old.clone()
        Object.assign(next, changes)
        await runner.changeColumn(table, old, next)
        return next
    }
    for (const length of ["100", "25", "", "50"]) {
        it(`should preserve values and reverse a collation change with length ${length || "unbounded"}`, () =>
            withRunner(async (runner) => {
                const before = await metadata(runner)
                const indexes = await dependencies(runner)
                await change(runner, {
                    length,
                    collation: "C",
                    collationSchema: "pg_catalog",
                })
                expect(await stored(runner)).to.deep.equal(rows)
                expect(await metadata(runner)).to.deep.equal({
                    ...before,
                    type: length
                        ? `character varying(${length})`
                        : "character varying",
                    collation: "C",
                })
                expect(await dependencies(runner)).to.deep.equal(indexes)
                assertNoDrop(runner)
                expect(
                    runner
                        .getMemorySql()
                        .upQueries.filter((q) =>
                            /ALTER COLUMN.* TYPE /.test(q.query),
                        ),
                ).to.have.length(1)
                await runner.executeMemoryDownSql()
                expect(await metadata(runner)).to.deep.equal(before)
                expect(await stored(runner)).to.deep.equal(rows)
                expect(await dependencies(runner)).to.deep.equal(indexes)
            }))
    }
    it("should support a varchar alias together with a changed collation", () =>
        withRunner(async (runner) => {
            await change(runner, {
                type: "varchar",
                length: "100",
                collation: "C",
                collationSchema: "pg_catalog",
            })
            expect(await stored(runner)).to.deep.equal(rows)
            expect((await metadata(runner)).type).to.equal(
                "character varying(100)",
            )
            assertNoDrop(runner)
            await runner.executeMemoryDownSql()
            expect((await metadata(runner)).type).to.equal(
                "character varying(50)",
            )
        }))
    it("should remove an explicit collation and keep successive cached resizes at the default", () =>
        withRunner(async (runner) => {
            await runner.query(
                'ALTER TABLE public.varchar_collation ALTER COLUMN value TYPE varchar(50) COLLATE "C"',
            )
            const first = await change(runner, {
                length: "100",
                collation: undefined,
                collationSchema: undefined,
            })
            expect((await metadata(runner)).collation).to.equal("default")
            runner.clearSqlMemory()
            const second = first.clone()
            second.length = "125"
            await runner.changeColumn(
                "public.varchar_collation",
                "value",
                second,
            )
            assertNoDrop(runner)
            expect((await metadata(runner)).collation).to.equal("default")
            await runner.executeMemoryDownSql()
            expect((await metadata(runner)).collation).to.equal("default")
            expect((await metadata(runner)).type).to.equal(
                "character varying(100)",
            )
            expect(await stored(runner)).to.deep.equal(rows)
        }))
    it("should restore the original explicit collation after removing it", () =>
        withRunner(async (runner) => {
            await runner.query(
                'ALTER TABLE public.varchar_collation ALTER COLUMN value TYPE varchar(50) COLLATE "C"',
            )
            const before = await metadata(runner)
            await change(runner, {
                length: "100",
                collation: undefined,
                collationSchema: undefined,
            })
            expect((await metadata(runner)).collation).to.equal("default")
            await runner.executeMemoryDownSql()
            expect(await metadata(runner)).to.deep.equal(before)
            expect(await stored(runner)).to.deep.equal(rows)
        }))
    for (const length of ["50", "100"]) {
        it(`should distinguish same-named collations in quoted schemas at length ${length}`, () =>
            withRunner(async (runner) => {
                await runner.query('CREATE SCHEMA "varchar""old"')
                await runner.query('CREATE SCHEMA "varchar""new"')
                await runner.query(
                    'CREATE COLLATION "varchar""old"."same""rule" FROM pg_catalog."C"',
                )
                await runner.query(
                    'CREATE COLLATION "varchar""new"."same""rule" FROM pg_catalog."POSIX"',
                )
                await runner.query(
                    'ALTER TABLE public.varchar_collation ALTER COLUMN value TYPE varchar(50) COLLATE "varchar""old"."same""rule"',
                )
                const before = await metadata(runner)
                await change(runner, {
                    length,
                    collation: 'same"rule',
                    collationSchema: 'varchar"new',
                })
                expect((await metadata(runner)).schema).to.equal('varchar"new')
                expect((await metadata(runner)).attnum).to.equal(before.attnum)
                expect(await stored(runner)).to.deep.equal(rows)
                assertNoDrop(runner)
                await runner.executeMemoryDownSql()
                expect(await metadata(runner)).to.deep.equal(before)
                expect(await stored(runner)).to.deep.equal(rows)
            }))
    }
    it("should resolve an unqualified target and retain its cached identity after search_path changes", () =>
        withRunner(async (runner) => {
            await runner.query('CREATE SCHEMA "varchar_old"')
            await runner.query('CREATE SCHEMA "varchar_new"')
            await runner.query(
                'CREATE COLLATION varchar_old.before_rule FROM pg_catalog."C"',
            )
            await runner.query(
                'CREATE COLLATION varchar_new.target_rule FROM pg_catalog."POSIX"',
            )
            await runner.query(
                'CREATE COLLATION varchar_old.target_rule FROM pg_catalog."C"',
            )
            await runner.query(
                "ALTER TABLE public.varchar_collation ALTER COLUMN value TYPE varchar(50) COLLATE varchar_old.before_rule",
            )
            await runner.query("SET LOCAL search_path TO varchar_new, public")
            const first = await change(runner, {
                length: "100",
                collation: "target_rule",
                collationSchema: undefined,
            })
            const afterFirst = await metadata(runner)
            expect(afterFirst.schema).to.equal("varchar_new")
            runner.clearSqlMemory()
            await runner.query("SET LOCAL search_path TO varchar_old, public")
            const second = first.clone()
            second.length = "125"
            await runner.changeColumn(
                "public.varchar_collation",
                "value",
                second,
            )
            expect((await metadata(runner)).schema).to.equal("varchar_new")
            assertNoDrop(runner)
            await runner.executeMemoryDownSql()
            expect(await metadata(runner)).to.deep.equal(afterFirst)
            expect(await stored(runner)).to.deep.equal(rows)
        }))
    for (const scenario of [
        {
            name: "overlength values",
            changes: {
                length: "3",
                collation: "C",
                collationSchema: "pg_catalog",
            },
            error: /value too long/,
        },
        {
            name: "unknown collation",
            changes: {
                length: "100",
                collation: "missing_collation_3357",
                collationSchema: undefined,
            },
            error: /does not exist/,
        },
        {
            name: "unknown collation schema",
            changes: {
                length: "100",
                collation: "C",
                collationSchema: "missing_schema_3357",
            },
            error: /does not exist/,
        },
        {
            name: "incompatible nullability",
            changes: {
                length: "100",
                collation: "C",
                collationSchema: "pg_catalog",
                isNullable: false,
            },
            error: /contains null values/,
        },
    ]) {
        it(`should reject ${scenario.name} and leave the transaction's original values and schema intact`, () =>
            withRunner(async (runner) => {
                const before = {
                    rows: await stored(runner),
                    column: await metadata(runner),
                    indexes: await dependencies(runner),
                }
                await runner.startTransaction()
                await expect(
                    change(runner, scenario.changes),
                ).to.be.rejectedWith(scenario.error)
                await runner.rollbackTransaction()
                expect({
                    rows: await stored(runner),
                    column: await metadata(runner),
                    indexes: await dependencies(runner),
                }).to.deep.equal(before)
                assertNoDrop(runner)
            }))
    }
    it("should preserve check, unique, foreign-key and index behavior", () =>
        withRunner(async (runner) => {
            await runner.query(
                "ALTER TABLE public.varchar_collation ADD CONSTRAINT collation_value_unique UNIQUE(value), ADD CONSTRAINT collation_value_check CHECK(value <> 'forbidden')",
            )
            await runner.query(
                "CREATE TABLE public.collation_child (value varchar(50) REFERENCES public.varchar_collation(value))",
            )
            await runner.query(
                "INSERT INTO public.collation_child VALUES ('sentinel')",
            )
            const constraints = () =>
                runner.query(
                    "SELECT conname, contype, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='public.varchar_collation'::regclass ORDER BY conname",
                )
            const beforeConstraints = await constraints()
            const beforeIndexes = await dependencies(runner)
            await change(runner, {
                length: "100",
                collation: "C",
                collationSchema: "pg_catalog",
            })
            expect(await stored(runner)).to.deep.equal(rows)
            expect(await constraints()).to.deep.equal(beforeConstraints)
            expect(await dependencies(runner)).to.deep.equal(beforeIndexes)
            expect(
                await runner.query("SELECT value FROM public.collation_child"),
            ).to.deep.equal([{ value: "sentinel" }])
            for (const [sql, error] of [
                [
                    "INSERT INTO public.varchar_collation VALUES (99, 'sentinel')",
                    /duplicate key/,
                ],
                [
                    "INSERT INTO public.varchar_collation VALUES (99, 'forbidden')",
                    /check constraint/,
                ],
                [
                    "INSERT INTO public.collation_child VALUES ('not-a-parent')",
                    /foreign key constraint/,
                ],
            ] as const) {
                await runner.startTransaction()
                await expect(runner.query(sql)).to.be.rejectedWith(error)
                await runner.rollbackTransaction()
            }
            assertNoDrop(runner)
            await runner.executeMemoryDownSql()
            expect((await metadata(runner)).type).to.equal(
                "character varying(50)",
            )
            expect(await stored(runner)).to.deep.equal(rows)
            expect(await constraints()).to.deep.equal(beforeConstraints)
        }))
    it("should retain array shape, values and bounds when changing the collation", () =>
        withRunner(async (runner) => {
            await runner.query(
                "CREATE TABLE public.collation_arrays (id int PRIMARY KEY, value varchar(50)[])",
            )
            await runner.query(
                "INSERT INTO public.collation_arrays VALUES (1, $1), (2, $2), (3, NULL)",
                [["keep   ", "漢字🙂"], []],
            )
            const before = await runner.query(
                "SELECT * FROM public.collation_arrays ORDER BY id",
            )
            const table = (await runner.getTable("public.collation_arrays"))!
            const old = table.findColumnByName("value")!
            const next = old.clone()
            Object.assign(next, {
                length: "100",
                collation: "C",
                collationSchema: "pg_catalog",
            })
            await runner.changeColumn(table, old, next)
            expect(
                await runner.query(
                    "SELECT * FROM public.collation_arrays ORDER BY id",
                ),
            ).to.deep.equal(before)
            const changed = (await runner.getTable(
                "public.collation_arrays",
            ))!.findColumnByName("value")!
            expect(changed.length).to.equal("100")
            expect(changed.isArray).to.equal(true)
            expect(changed.collation).to.equal("C")
            assertNoDrop(runner)
            await runner.executeMemoryDownSql()
            const reverted = (await runner.getTable(
                "public.collation_arrays",
            ))!.findColumnByName("value")!
            expect(reverted.length).to.equal("50")
            expect(reverted.isArray).to.equal(true)
            expect(
                await runner.query(
                    "SELECT * FROM public.collation_arrays ORDER BY id",
                ),
            ).to.deep.equal(before)
        }))
    it("should generate a single reversible in-place statement in SQL-memory mode", () =>
        withRunner(async (runner) => {
            const before = await metadata(runner)
            runner.enableSqlMemory()
            await change(runner, {
                length: "100",
                collation: "C",
                collationSchema: "pg_catalog",
            })
            expect(await metadata(runner)).to.deep.equal(before)
            assertNoDrop(runner)
            expect(runner.getMemorySql().upQueries).to.have.length(1)
            expect(runner.getMemorySql().downQueries).to.have.length(1)
            await runner.executeMemoryUpSql()
            expect((await metadata(runner)).collation).to.equal("C")
            expect((await metadata(runner)).type).to.equal(
                "character varying(100)",
            )
            expect(await stored(runner)).to.deep.equal(rows)
            await runner.executeMemoryDownSql()
            expect(await metadata(runner)).to.deep.equal(before)
            runner.disableSqlMemory()
        }))
    it("should retain combined properties in the cache and reverse successive resizes", () =>
        withRunner(async (runner) => {
            await runner.query(
                "DELETE FROM public.varchar_collation WHERE value IS NULL",
            )
            const first = await change(runner, {
                name: "renamed",
                length: "100",
                collation: "C",
                collationSchema: "pg_catalog",
                isNullable: false,
                default: "'fallback'",
                comment: "combined properties",
            })
            const second = first.clone()
            second.length = "125"
            await runner.changeColumn(
                "public.varchar_collation",
                "renamed",
                second,
            )
            expect(await stored(runner, "renamed")).to.deep.equal(
                rows.filter((r) => r.value !== null),
            )
            expect(
                runner.getMemorySql().downQueries.map((q) => q.query),
            ).to.include(
                'ALTER TABLE "varchar_collation" ALTER COLUMN "renamed" TYPE character varying(100) COLLATE "pg_catalog"."C"',
            )
            const column = (await runner.getTable(
                "public.varchar_collation",
            ))!.findColumnByName("renamed")!
            expect(column.length).to.equal("125")
            expect(column.collation).to.equal("C")
            expect(column.default).to.contain("fallback")
            expect(column.comment).to.equal("combined properties")
            expect(column.isNullable).to.equal(false)
            assertNoDrop(runner)
            await runner.executeMemoryDownSql()
            expect(await stored(runner)).to.deep.equal(
                rows.filter((r) => r.value !== null),
            )
            const reverted = (await runner.getTable(
                "public.varchar_collation",
            ))!.findColumnByName("value")!
            expect(reverted.length).to.equal("50")
            expect(reverted.collation).to.equal(undefined)
            expect(reverted.default).to.equal(undefined)
            expect(reverted.isNullable).to.equal(true)
        }))
    it("should retain PostgreSQL's trailing-space narrowing semantics rather than promise lossless rollback", () =>
        withRunner(async (runner) => {
            await runner.query("DELETE FROM public.varchar_collation")
            await runner.query(
                "INSERT INTO public.varchar_collation VALUES (1, 'xy      ')",
            )
            await change(runner, {
                length: "3",
                collation: "C",
                collationSchema: "pg_catalog",
            })
            expect(await stored(runner)).to.deep.equal([
                { id: 1, value: "xy " },
            ])
            assertNoDrop(runner)
            await runner.executeMemoryDownSql()
            expect((await metadata(runner)).type).to.equal(
                "character varying(50)",
            )
            expect(await stored(runner)).to.deep.equal([
                { id: 1, value: "xy " },
            ])
        }))
    it("should generate and execute a reversible combined schema-builder migration", () =>
        withRunner(async (runner, ds) => {
            const column = ds
                .getMetadata("VarcharCollation")
                .findColumnWithPropertyName("value")!
            const before = await metadata(runner)
            const oldLength = column.length
            const oldCollation = column.collation
            try {
                column.length = "100"
                column.collation = "C"
                const migration = await ds.driver.createSchemaBuilder().log()
                expect(
                    migration.upQueries.some((q) =>
                        /DROP COLUMN/.test(q.query),
                    ),
                ).to.equal(false)
                expect(
                    migration.upQueries.filter((q) =>
                        /ALTER COLUMN.* TYPE /.test(q.query),
                    ),
                ).to.have.length(1)
                for (const query of migration.upQueries)
                    await runner.query(query.query, query.parameters)
                expect((await metadata(runner)).collation).to.equal("C")
                expect((await metadata(runner)).type).to.equal(
                    "character varying(100)",
                )
                expect(await stored(runner)).to.deep.equal(rows)
                for (const query of [...migration.downQueries].reverse())
                    await runner.query(query.query, query.parameters)
                expect(await metadata(runner)).to.deep.equal(before)
                expect(await stored(runner)).to.deep.equal(rows)
            } finally {
                column.length = oldLength
                column.collation = oldCollation
            }
        }))
})
