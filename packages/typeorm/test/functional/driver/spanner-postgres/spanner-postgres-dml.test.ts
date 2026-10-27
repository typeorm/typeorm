import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import type { SpannerPostgresDriver } from "../../../../src/driver/spanner-postgres/SpannerPostgresDriver"
import { EventSubscriber } from "../../../../src/decorator/listeners/EventSubscriber"
import type { EntitySubscriberInterface } from "../../../../src/subscriber/EntitySubscriberInterface"
import type { InsertEvent } from "../../../../src/subscriber/event/InsertEvent"
import type { Logger } from "../../../../src/logger/Logger"
import { EntitySchema } from "../../../../src/entity-schema/EntitySchema"
import { In } from "../../../../src/find-options/operator/In"
import { IsNull } from "../../../../src/find-options/operator/IsNull"
import { QueryFailedError } from "../../../../src/error/QueryFailedError"
import { TypeORMError } from "../../../../src/error/TypeORMError"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"

const Types = new EntitySchema<any>({
    name: "Types",
    tableName: "pgd_types",
    columns: {
        id: { type: "varchar", length: 36, primary: true, generated: "uuid" },
        big: { type: "bigint", nullable: true },
        int: { type: "int", nullable: true },
        str: { type: "varchar", length: 100, nullable: true },
        flag: { type: Boolean, nullable: true },
        at: { type: "timestamptz", nullable: true },
        json: { type: "jsonb", nullable: true },
        dec: { type: "numeric", nullable: true },
        day: { type: "date", nullable: true },
        bin: { type: "bytea", nullable: true },
        tags: { type: "varchar", array: true, nullable: true },
        createdAt: { type: "timestamptz", createDate: true },
    },
})

const Pair = new EntitySchema<any>({
    name: "Pair",
    tableName: "pgd_pair",
    columns: {
        a: { type: "varchar", length: 20, primary: true },
        b: { type: "bigint", primary: true },
        label: { type: "varchar", length: 50, nullable: true },
        qty: { type: Number, nullable: true },
    },
})

const Bulk = new EntitySchema<any>({
    name: "Bulk",
    tableName: "pgd_bulk",
    columns: {
        id: { type: "varchar", length: 36, primary: true, generated: "uuid" },
        seq: { type: Number },
        title: { type: "varchar", length: 100 },
        c1: { type: "varchar", length: 20, nullable: true },
        c2: { type: "varchar", length: 20, nullable: true },
        c3: { type: Number, nullable: true },
        c4: { type: Boolean, nullable: true },
        createdAt: { type: "timestamptz", createDate: true },
    },
})

const Stamped = new EntitySchema<any>({
    name: "Stamped",
    tableName: "pgd_stamped",
    columns: {
        id: { type: "varchar", length: 36, primary: true, generated: "uuid" },
        n: { type: Number },
        stamp: { type: "varchar", length: 20, nullable: true },
    },
})

/**
 * Adds a value to the rows of a "Stamped" insert, so they have more
 * parameters than they had when the insert was built.
 */
@EventSubscriber()
class StampSubscriber implements EntitySubscriberInterface {
    beforeInsert(event: InsertEvent<any>) {
        if (event.metadata.name === "Stamped") event.entity.stamp = "stamped"
    }
}

describe("driver > spanner-postgres > dml", () => {
    let dataSources: DataSource[]
    const statements: { query: string; parameters?: any }[] = []
    const logger: Logger = {
        logQuery: (query, parameters) => {
            statements.push({ query, parameters })
        },
        logQueryError: () => {},
        logQuerySlow: () => {},
        logSchemaBuild: () => {},
        logMigration: () => {},
        log: () => {},
    }

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["spanner-postgres"],
            entities: [Types, Pair, Bulk, Stamped],
            subscribers: [StampSubscriber],
            schemaCreate: true,
            dropSchema: true,
            createLogger: () => logger,
            logging: true,
        })
    })
    beforeEach(async () => {
        await reloadTestingDatabases(dataSources)
        statements.length = 0
    })
    after(() => closeTestingConnections(dataSources))

    const forEachDataSource = (fn: (dataSource: DataSource) => Promise<any>) =>
        Promise.all(dataSources.map(fn))

    describe("save, find, update and delete", () => {
        it("should round trip every column type", () =>
            forEachDataSource(async (dataSource) => {
                const repository = dataSource.getRepository("Types")
                const at = new Date("2024-02-29T23:59:58.123Z")
                const saved = await repository.save(
                    repository.create({
                        big: "5",
                        int: 7,
                        str: "héllo ñ 日本",
                        flag: true,
                        at,
                        json: { a: 1, b: [1, 2, { c: null }] },
                        dec: "12345678901234567890.123456789",
                        day: "2024-02-29",
                        bin: Buffer.from([0, 1, 2, 255]),
                        tags: ["a", "b,c", 'd"e', ""],
                    }),
                )

                // a generated uuid is returned by the INSERT ... RETURNING
                expect(saved.id).to.match(/^[0-9a-f-]{36}$/)
                expect(saved.createdAt).to.be.instanceOf(Date)

                const loaded = await repository.findOneByOrFail({
                    id: saved.id,
                })
                expect(loaded.big).to.equal("5")
                expect(loaded.int).to.equal(7)
                expect(loaded.str).to.equal("héllo ñ 日本")
                expect(loaded.flag).to.equal(true)
                expect(loaded.at.toISOString()).to.equal(at.toISOString())
                expect(loaded.json).to.deep.equal({
                    a: 1,
                    b: [1, 2, { c: null }],
                })
                expect(loaded.dec).to.equal("12345678901234567890.123456789")
                expect(loaded.day).to.equal("2024-02-29")
                expect(Buffer.isBuffer(loaded.bin)).to.equal(true)
                expect([...loaded.bin]).to.deep.equal([0, 1, 2, 255])
                expect(loaded.tags).to.deep.equal(["a", "b,c", 'd"e', ""])
            }))

        it("should save and update bool values, including false", () =>
            forEachDataSource(async (dataSource) => {
                const repository = dataSource.getRepository("Types")
                const saved = await repository.save(
                    repository.create({ flag: true }),
                )
                await repository.update({ id: saved.id }, { flag: false })

                expect(
                    (await repository.findOneByOrFail({ id: saved.id })).flag,
                ).to.equal(false)
                expect(await repository.countBy({ flag: false })).to.equal(1)
                expect(await repository.countBy({ flag: true })).to.equal(0)
            }))

        it("should round trip any jsonb value and update it", () =>
            forEachDataSource(async (dataSource) => {
                const repository = dataSource.getRepository("Types")
                const values = [
                    { a: 1, nested: { list: [1, "two", null], ok: true } },
                    [1, "two", { three: 3 }, null],
                    "just a string",
                    42,
                    0,
                    false,
                    {},
                    [],
                ]
                for (const json of values) {
                    const saved = await repository.save(
                        repository.create({ json }),
                    )
                    const loaded = await repository.findOneByOrFail({
                        id: saved.id,
                    })
                    expect(loaded.json).to.deep.equal(json)
                    await repository.delete({ id: saved.id })
                }

                const saved = await repository.save(
                    repository.create({ json: { v: 1 } }),
                )
                saved.json = { v: 2, list: [1, 2, 3] }
                await repository.save(saved)
                expect(
                    (await repository.findOneByOrFail({ id: saved.id })).json,
                ).to.deep.equal({ v: 2, list: [1, 2, 3] })

                await repository.update({ id: saved.id }, { json: ["x"] })
                expect(
                    (await repository.findOneByOrFail({ id: saved.id })).json,
                ).to.deep.equal(["x"])

                await repository.update({ id: saved.id }, { json: null })
                expect(
                    (await repository.findOneByOrFail({ id: saved.id })).json,
                ).to.equal(null)
            }))

        it("should return jsonb already unwrapped from RETURNING and raw queries", () =>
            forEachDataSource(async (dataSource) => {
                const result = await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into("Types")
                    .values([
                        { str: "m1", json: { n: 1 } },
                        { str: "m2", json: { n: 2 } },
                        { str: "m3" },
                    ])
                    .returning(["str", "json"])
                    .execute()
                const rows: any[] = Array.isArray(result.raw[0])
                    ? result.raw[0]
                    : result.raw
                expect(rows.map((row) => row.json)).to.deep.equal([
                    { n: 1 },
                    { n: 2 },
                    null,
                ])

                expect(
                    await dataSource.query(
                        `SELECT "json" FROM "pgd_types" WHERE "str" = 'm1'`,
                    ),
                ).to.deep.equal([{ json: { n: 1 } }])
            }))

        it("should delete and soft-compare with generated ids", () =>
            forEachDataSource(async (dataSource) => {
                const repository = dataSource.getRepository("Types")
                const [a, b] = await repository.save([
                    repository.create({ str: "a" }),
                    repository.create({ str: "b" }),
                ])
                expect(a.id).to.not.equal(b.id)

                const result = await repository.delete({ id: a.id })
                expect(result.affected).to.equal(1)
                expect(await repository.count()).to.equal(1)
            }))
    })

    describe("bigint", () => {
        it("should read a bigint as a string, even above 2^53", () =>
            forEachDataSource(async (dataSource) => {
                const repository = dataSource.getRepository("Types")
                const values = [
                    "9007199254740993",
                    "-9223372036854775808",
                    "9223372036854775807",
                    "0",
                    "-5",
                ]
                for (const big of values) {
                    const saved = await repository.save(
                        repository.create({ big }),
                    )
                    const loaded = await repository.findOneByOrFail({
                        id: saved.id,
                    })
                    expect(loaded.big).to.equal(big)
                    expect(await repository.countBy({ big })).to.equal(1)
                    await repository.delete({ id: saved.id })
                }
            }))

        it("should write a number or a bigint to a bigint column", () =>
            forEachDataSource(async (dataSource) => {
                const repository = dataSource.getRepository("Types")
                const a = await repository.save(repository.create({ big: 7 }))
                const b = await repository.save(
                    repository.create({ big: BigInt(8) as any }),
                )
                expect(
                    (await repository.findOneByOrFail({ id: a.id })).big,
                ).to.equal("7")
                expect(
                    (await repository.findOneByOrFail({ id: b.id })).big,
                ).to.equal("8")
            }))

        it("should read raw int64 as a number when safe, a string when not", () =>
            forEachDataSource(async (dataSource) => {
                expect(
                    await dataSource.query(
                        `SELECT 5::bigint AS safe, 9007199254740993::bigint AS unsafe`,
                    ),
                ).to.deep.equal([{ safe: 5, unsafe: "9007199254740993" }])
            }))

        it("should use a bigint primary key as a string", () =>
            forEachDataSource(async (dataSource) => {
                const repository = dataSource.getRepository("Pair")
                await repository.save({ a: "x", b: "9007199254740993" })
                const found = await repository.findOneByOrFail({
                    a: "x",
                    b: "9007199254740993",
                })
                expect(found.b).to.equal("9007199254740993")
                expect(
                    await repository.countBy({
                        b: In(["9007199254740993", "1"]),
                    }),
                ).to.equal(1)
            }))
    })

    describe("bigint with parseInt8", () => {
        let parseInt8DataSources: DataSource[]
        before(async () => {
            parseInt8DataSources = await createTestingConnections({
                enabledDrivers: ["spanner-postgres"],
                entities: [Types],
                schemaCreate: true,
                dropSchema: false,
                driverSpecific: { parseInt8: true },
            })
        })
        after(() => closeTestingConnections(parseInt8DataSources))

        it("should read a bigint as a number", () =>
            Promise.all(
                parseInt8DataSources.map(async (dataSource) => {
                    const repository = dataSource.getRepository("Types")
                    const saved = await repository.save(
                        repository.create({ big: "12" }),
                    )
                    const loaded = await repository.findOneByOrFail({
                        id: saved.id,
                    })
                    expect(loaded.big).to.equal(12)
                }),
            ))
    })

    describe("null handling", () => {
        it("should save nulls and filter by them", () =>
            forEachDataSource(async (dataSource) => {
                const repository = dataSource.getRepository("Types")
                await repository.save([
                    repository.create({ str: "a", big: "10" }),
                    repository.create({ str: null, big: null }),
                    repository.create({ str: "c", big: "30" }),
                ])

                expect(await repository.countBy({ str: IsNull() })).to.equal(1)
                expect(
                    await repository.countBy({ str: In(["a", null as any]) }),
                ).to.equal(1)
                expect(await repository.countBy({ str: In([]) })).to.equal(0)

                // as in PostgreSQL, "= NULL" matches no row
                expect(
                    await repository
                        .createQueryBuilder("t")
                        .where("t.str = :v", { v: null })
                        .getCount(),
                ).to.equal(0)
            }))

        it("should save null in every column type", () =>
            forEachDataSource(async (dataSource) => {
                const repository = dataSource.getRepository("Types")
                const saved = await repository.save(repository.create({}))
                const loaded = await repository.findOneByOrFail({
                    id: saved.id,
                })
                const filled = Object.entries(loaded).filter(
                    ([key, value]) =>
                        value !== null && !["id", "createdAt"].includes(key),
                )
                expect(filled).to.deep.equal([])

                await repository.update(
                    { id: saved.id },
                    { flag: false, str: "", dec: "0" },
                )
                await repository.update(
                    { id: saved.id },
                    {
                        flag: null as any,
                        str: null as any,
                        dec: null as any,
                        day: null as any,
                        at: null as any,
                        bin: null as any,
                        tags: null as any,
                        json: null as any,
                    },
                )
                const reloaded = await repository.findOneByOrFail({
                    id: saved.id,
                })
                expect(
                    Object.entries(reloaded).filter(
                        ([key, value]) =>
                            value !== null &&
                            !["id", "createdAt"].includes(key),
                    ),
                ).to.deep.equal([])
            }))

        it("should bind a null or undefined raw parameter as text", () =>
            forEachDataSource(async (dataSource) => {
                expect(
                    await dataSource.query(`SELECT $1::text AS x`, [undefined]),
                ).to.deep.equal([{ x: null }])
                expect(
                    await dataSource.query(
                        `SELECT COUNT(*) AS n FROM "pgd_types" WHERE "big" = $1::bigint`,
                        [null],
                    ),
                ).to.deep.equal([{ n: 0 }])
            }))
    })

    describe("multi-row insert", () => {
        const rows = (count: number, offset = 0) =>
            Array.from({ length: count }, (_, index) => ({
                seq: index + offset,
                title: "t" + index,
                c1: "a" + index,
                c2: index % 3 === 0 ? null : "b",
                c3: index,
                c4: index % 2 === 0,
            }))

        it("should split an insert above the parameter limit, keeping the order of the ids", () =>
            forEachDataSource(async (dataSource) => {
                const repository = dataSource.getRepository("Bulk")
                // 1500 rows * 7 parameters is above the 950 parameters a statement can have
                const saved = await repository.save(
                    rows(1500).map((row) => repository.create(row)),
                    { chunk: 0 },
                )

                const inserts = statements.filter(({ query }) =>
                    query.startsWith("INSERT"),
                )
                expect(inserts.length).to.be.greaterThan(1)
                for (const { parameters } of inserts) {
                    expect(parameters!.length).to.be.at.most(950)
                }

                expect(new Set(saved.map((row) => row.id)).size).to.equal(1500)
                expect(await repository.count()).to.equal(1500)

                // each entity got the id of the row with its own sequence number
                const stored = new Map(
                    (await repository.find()).map((row) => [row.id, row.seq]),
                )
                expect(saved.every((row) => stored.get(row.id) === row.seq)).to
                    .be.true
                expect(saved.every((row) => row.createdAt instanceof Date)).to
                    .be.true
            }))

        it("should map identifiers and generated maps of a query builder insert", () =>
            forEachDataSource(async (dataSource) => {
                const result = await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into("Bulk")
                    .values(rows(400))
                    .execute()

                expect(result.identifiers.length).to.equal(400)
                expect(result.generatedMaps.length).to.equal(400)
                expect(
                    new Set(
                        result.identifiers.map((identifier) => identifier.id),
                    ).size,
                ).to.equal(400)
            }))

        it("should count the values added by the listeners when it splits an insert", () =>
            forEachDataSource(async (dataSource) => {
                // 600 rows * 1 parameter is below the limit, 600 rows * 2 is not
                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into("Stamped")
                    .values(Array.from({ length: 600 }, (_, n) => ({ n })))
                    .execute()

                const repository = dataSource.getRepository("Stamped")
                expect(await repository.count()).to.equal(600)
                expect(await repository.countBy({ stamp: "stamped" })).to.equal(
                    600,
                )
            }))

        it("should roll back the whole insert when a statement fails", () =>
            forEachDataSource(async (dataSource) => {
                const repository = dataSource.getRepository("Bulk")
                await repository.insert({ id: "dup-id", seq: -1, title: "dup" })

                // the duplicate id is in the last of the statements
                const values = rows(1200, 1000).map((row, index) => ({
                    ...row,
                    id: index === 1199 ? "dup-id" : undefined,
                }))
                await expect(
                    dataSource
                        .createQueryBuilder()
                        .insert()
                        .into("Bulk")
                        .values(values)
                        .execute(),
                ).to.be.rejectedWith(QueryFailedError)

                expect(await repository.count()).to.equal(1)
            }))

        it("should split an upsert above the parameter limit", () =>
            forEachDataSource(async (dataSource) => {
                const repository = dataSource.getRepository("Pair")
                await repository.upsert(
                    Array.from({ length: 700 }, (_, index) => ({
                        a: "u" + index,
                        b: String(index),
                        label: "l" + index,
                        qty: index,
                    })),
                    ["a", "b"],
                )
                expect(await repository.count()).to.equal(700)
            }))
    })

    describe("orIgnore and upsert", () => {
        it("should ignore a row that conflicts on the primary key", () =>
            forEachDataSource(async (dataSource) => {
                const repository = dataSource.getRepository("Pair")
                await repository.insert({
                    a: "x",
                    b: "1",
                    label: "first",
                    qty: 1,
                })

                await repository
                    .createQueryBuilder()
                    .insert()
                    .values([
                        { a: "x", b: "1", label: "ignored" },
                        { a: "y", b: "2", label: "new" },
                    ])
                    .orIgnore()
                    .execute()

                const rows = await repository.find({ order: { a: "ASC" } })
                expect(rows.map((r) => r.a + r.b + r.label)).to.deep.equal([
                    "x1first",
                    "y2new",
                ])
                expect(
                    statements.some(({ query }) =>
                        /ON CONFLICT .* DO NOTHING/.test(query),
                    ),
                ).to.be.true
            }))

        it("should upsert, writing only the given columns", () =>
            forEachDataSource(async (dataSource) => {
                const repository = dataSource.getRepository("Pair")
                await repository.insert({
                    a: "x",
                    b: "1",
                    label: "first",
                    qty: 1,
                })

                await repository.upsert(
                    [
                        { a: "x", b: "1", label: "upserted" },
                        { a: "z", b: "3", label: "inserted" },
                    ],
                    ["a", "b"],
                )

                const rows = await repository.find({ order: { a: "ASC" } })
                expect(
                    rows.map((r) => [r.a, r.b, r.label, r.qty]),
                ).to.deep.equal([
                    ["x", "1", "upserted", 1],
                    ["z", "3", "inserted", null],
                ])
            }))

        it("should accept the conflict columns in any order, or derive them from the primary key", () =>
            forEachDataSource(async (dataSource) => {
                const repository = dataSource.getRepository("Pair")
                await repository.insert({ a: "x", b: "1", label: "first" })

                await repository.upsert(
                    { a: "x", b: "1", label: "reordered" },
                    ["b", "a"],
                )
                expect(
                    (await repository.findOneByOrFail({ a: "x", b: "1" }))
                        .label,
                ).to.equal("reordered")

                await repository
                    .createQueryBuilder()
                    .insert()
                    .values({ a: "x", b: "1", label: "derived" })
                    .orUpdate(["label"])
                    .execute()
                expect(
                    (await repository.findOneByOrFail({ a: "x", b: "1" }))
                        .label,
                ).to.equal("derived")
            }))

        it("should reject what Spanner cannot do with a TypeORMError", () =>
            forEachDataSource(async (dataSource) => {
                const repository = dataSource.getRepository("Pair")
                const row = { a: "x", b: "1", label: "n" }

                await expect(
                    repository.upsert(row, ["label"]),
                ).to.be.rejectedWith(TypeORMError, /primary key/)
                await expect(
                    repository
                        .createQueryBuilder()
                        .insert()
                        .values(row)
                        .orUpdate(["label"], "some_constraint")
                        .execute(),
                ).to.be.rejectedWith(TypeORMError, /CONSTRAINT/)
                await expect(
                    repository.upsert(row, {
                        conflictPaths: ["a", "b"],
                        skipUpdateIfNoValuesChanged: true,
                    }),
                ).to.be.rejectedWith(TypeORMError, /WHERE/)
                await expect(
                    repository.upsert(row, {
                        conflictPaths: ["a", "b"],
                        indexPredicate: "qty > 1",
                    }),
                ).to.be.rejectedWith(TypeORMError, /indexPredicate|WHERE/)
                await expect(
                    repository
                        .createQueryBuilder()
                        .insert()
                        .values({ ...row, qty: 5 })
                        .orUpdate(["label"], ["a", "b"])
                        .execute(),
                ).to.be.rejectedWith(TypeORMError, /list every inserted column/)

                // none of them reached the database
                expect(
                    statements.filter(({ query }) =>
                        query.startsWith("INSERT"),
                    ),
                ).to.have.length(0)
            }))
    })

    describe("reads and locks", () => {
        it("should run a read in any letter case, with comments or a WITH clause", () =>
            forEachDataSource(async (dataSource) => {
                expect(await dataSource.query("select 1 as x")).to.deep.equal([
                    { x: 1 },
                ])
                expect(
                    await dataSource.query("/* hint */ -- c\n select 3 as z"),
                ).to.deep.equal([{ z: 3 }])
                expect(
                    await dataSource.query(
                        "with x as (select 2 as y) select y from x",
                    ),
                ).to.deep.equal([{ y: 2 }])
            }))

        it("should classify a statement as read-only only when it only reads", () =>
            forEachDataSource(async (dataSource) => {
                const queryRunner: any = dataSource.createQueryRunner()
                const cases: [string, boolean][] = [
                    ["SELECT 1", true],
                    ["select 1", true],
                    ["  \n\tselect 1", true],
                    ["/* c */ SELECT 1", true],
                    ["-- c\nselect 1", true],
                    ["WITH x AS (SELECT 1) SELECT * FROM x", true],
                    ["(SELECT 1) UNION (SELECT 2)", true],
                    ['SELECT "updatedAt" FROM t', true],
                    ["SELECT 1 FROM t FOR UPDATE", false],
                    ["select 1 from t for update", false],
                    ["SELECT 1 FROM t FOR SHARE", false],
                    ["WITH x AS (SELECT 1) UPDATE t SET a = 1", false],
                    ["WITH x AS (SELECT 1) DELETE FROM t", false],
                    [
                        "WITH x AS (SELECT 1) INSERT INTO t SELECT * FROM x",
                        false,
                    ],
                    ["INSERT INTO t VALUES (1)", false],
                    ["update t set a = 1", false],
                    ["DELETE FROM t WHERE true", false],
                    ["", false],
                    ["-- only a comment", false],
                    ["selection_fn(1)", false],
                ]
                for (const [query, expected] of cases) {
                    expect(
                        queryRunner.isReadOnlyQuery(query),
                        JSON.stringify(query),
                    ).to.equal(expected)
                }
                await queryRunner.release()
            }))

        it("should run a read as a single-use read and a write in a transaction", () =>
            forEachDataSource(async (dataSource) => {
                const database = (dataSource.driver as SpannerPostgresDriver)
                    .instanceDatabase as any
                const run = database.run.bind(database)
                let singleUseReads = 0
                database.run = (...args: any[]) => {
                    singleUseReads++
                    return run(...args)
                }
                try {
                    await dataSource.query("select 1")
                    await dataSource.query(
                        "with a as (select 1) select * from a",
                    )
                    expect(singleUseReads).to.equal(2)

                    await dataSource.getRepository("Pair").insert({
                        a: "w",
                        b: "1",
                    })
                    await dataSource.query(
                        `select * from "pgd_pair" for update`,
                    )
                    expect(singleUseReads).to.equal(2)
                } finally {
                    database.run = run
                }
            }))

        it("should support pessimistic_write as FOR UPDATE inside a transaction", () =>
            forEachDataSource(async (dataSource) => {
                const repository = dataSource.getRepository("Pair")
                await repository.insert({ a: "l", b: "1", label: "locked" })

                await dataSource.transaction(async (manager) => {
                    const found = await manager
                        .getRepository("Pair")
                        .createQueryBuilder("p")
                        .setLock("pessimistic_write")
                        .where("p.a = :a", { a: "l" })
                        .getOneOrFail()
                    expect(found.label).to.equal("locked")
                })

                expect(
                    statements.some(({ query }) =>
                        query.endsWith("FOR UPDATE"),
                    ),
                ).to.be.true
            }))

        it("should reject the lock modes Spanner does not have", () =>
            forEachDataSource(async (dataSource) => {
                await dataSource.transaction(async (manager) => {
                    for (const mode of [
                        { mode: "pessimistic_write", onLocked: "nowait" },
                        { mode: "pessimistic_write", onLocked: "skip_locked" },
                        { mode: "pessimistic_read" },
                    ]) {
                        expect(() =>
                            manager
                                .getRepository("Pair")
                                .createQueryBuilder("p")
                                .setLock(mode.mode as any)
                                .setOnLocked(mode.onLocked as any)
                                .getQuery(),
                        ).to.throw(TypeORMError)
                    }
                })
            }))
    })

    describe("stream", () => {
        const collect = (stream: NodeJS.ReadableStream) =>
            new Promise<any[]>((resolve, reject) => {
                const rows: any[] = []
                stream.on("data", (row) => rows.push(row))
                stream.on("end", () => resolve(rows))
                stream.on("error", reject)
            })

        it("should stream rows with numbered parameters and plain values", () =>
            forEachDataSource(async (dataSource) => {
                const repository = dataSource.getRepository("Types")
                const saved = await repository.save(
                    repository.create({
                        big: "9007199254740993",
                        int: 3,
                        str: "streamed",
                        json: { a: [1, 2] },
                        dec: "1.50",
                        day: "2024-01-02",
                    }),
                )
                await repository.save(repository.create({ str: "other" }))

                const queryRunner = dataSource.createQueryRunner()
                try {
                    let ended = false
                    const stream = await queryRunner.stream(
                        `SELECT "big", "int", "json", "dec", "day" FROM "pgd_types" WHERE "id" = $1 AND "str" = $2`,
                        [saved.id, "streamed"],
                        () => {
                            ended = true
                        },
                    )
                    const rows = await collect(stream)

                    expect(rows).to.deep.equal([
                        {
                            big: "9007199254740993",
                            int: 3,
                            json: { a: [1, 2] },
                            dec: "1.50",
                            day: "2024-01-02",
                        },
                    ])
                    expect(ended).to.equal(true)
                } finally {
                    await queryRunner.release()
                }
            }))

        it("should stream a query builder result", () =>
            forEachDataSource(async (dataSource) => {
                const repository = dataSource.getRepository("Types")
                await repository.save([
                    repository.create({ str: "s1", int: 1 }),
                    repository.create({ str: "s2", int: 2 }),
                    repository.create({ str: "s3", int: 3 }),
                ])

                const stream = await repository
                    .createQueryBuilder("t")
                    .select(["t.str", "t.int"])
                    .where("t.int > :min", { min: 1 })
                    .orderBy("t.int")
                    .stream()
                const rows = await collect(stream)

                expect(rows.map((row) => [row.t_str, row.t_int])).to.deep.equal(
                    [
                        ["s2", 2],
                        ["s3", 3],
                    ],
                )
            }))

        it("should report a failing query to the onError callback", () =>
            forEachDataSource(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    const error = await new Promise<Error>(
                        (resolve, reject) => {
                            queryRunner
                                .stream(
                                    `SELECT * FROM "table_that_does_not_exist"`,
                                    [],
                                    () => reject(new Error("unexpected end")),
                                    resolve,
                                )
                                .catch(reject)
                        },
                    )
                    expect(error.message).to.match(/table_that_does_not_exist/)
                } finally {
                    await queryRunner.release()
                }
            }))
    })
})
