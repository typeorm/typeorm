import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { EntitySchema } from "../../../../src/entity-schema/EntitySchema"
import type { SpannerPostgresQueryRunner } from "../../../../src/driver/spanner-postgres/SpannerPostgresQueryRunner"
import { DataTypeNotSupportedError } from "../../../../src/error/DataTypeNotSupportedError"
import { TypeORMError } from "../../../../src/error/TypeORMError"
import { Table } from "../../../../src/schema-builder/table/Table"
import { TableColumn } from "../../../../src/schema-builder/table/TableColumn"
import { TableForeignKey } from "../../../../src/schema-builder/table/TableForeignKey"
import { TableIndex } from "../../../../src/schema-builder/table/TableIndex"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { spyOnSchemaUpdates } from "./spanner-postgres-test-utils"

const accountColumns = {
    id: { type: "varchar", length: 36, primary: true, generated: "uuid" },
    name: { type: "varchar", length: 100 },
    email: { type: "varchar", length: 200, nullable: true },
    note: { type: "varchar", length: 50, default: "it's" },
    counter: { type: "int", default: 0 },
    active: { type: Boolean, default: true },
    big: { type: "bigint", nullable: true },
    amount: { type: "numeric", nullable: true },
    meta: { type: "jsonb", default: { a: 1 } },
    day: { type: "date", nullable: true },
    bin: { type: Buffer, nullable: true },
    tags: { type: "varchar", length: 20, array: true, nullable: true },
    createdAt: { type: "timestamptz", createDate: true },
    updatedAt: { type: "timestamptz", updateDate: true },
} as const

const accountOptions = {
    name: "Account",
    tableName: "pgs_account",
    columns: accountColumns,
    indices: [
        { name: "IDX_pgs_account_name", columns: ["name"], unique: true },
        { name: "IDX_pgs_account_email_name", columns: ["email", "name"] },
    ],
    uniques: [{ name: "UQ_pgs_account_note_big", columns: ["note", "big"] }],
}

const Account = new EntitySchema<any>({
    ...accountOptions,
    columns: { ...accountColumns } as any,
})

const Parent = new EntitySchema<any>({
    name: "Parent",
    tableName: "pgs_parent",
    columns: {
        id: { type: "uuid", primary: true, generated: "uuid" },
        name: { type: "varchar", length: 20 },
    },
    relations: {
        kids: {
            type: "one-to-many",
            target: "Kid",
            inverseSide: "parent",
            cascade: true,
        },
    },
})

const Kid = new EntitySchema<any>({
    name: "Kid",
    tableName: "pgs_kid",
    columns: {
        id: { type: "uuid", primary: true, generated: "uuid" },
        name: { type: "varchar", length: 20 },
    },
    relations: {
        parent: {
            type: "many-to-one",
            target: "Parent",
            joinColumn: { name: "parentId" },
            inverseSide: "kids",
            onDelete: "CASCADE",
        },
    },
})

const Post = new EntitySchema<any>({
    name: "Post",
    tableName: "pgs_post",
    columns: {
        id: { type: "uuid", primary: true, generated: "uuid" },
        title: { type: "varchar", length: 50 },
    },
    relations: {
        tags: {
            type: "many-to-many",
            target: "Tag",
            joinTable: { name: "pgs_post_tags" },
            inverseSide: "posts",
        },
    },
})

const Tag = new EntitySchema<any>({
    name: "Tag",
    tableName: "pgs_tag",
    columns: {
        id: { type: "uuid", primary: true, generated: "uuid" },
        label: { type: "varchar", length: 20 },
    },
    relations: {
        posts: { type: "many-to-many", target: "Post", inverseSide: "tags" },
    },
})

const entities = [Account, Parent, Kid, Post, Tag]

const schemaDiff = async (dataSource: DataSource) =>
    (await dataSource.driver.createSchemaBuilder().log()).upQueries.map(
        (query) => query.query,
    )

describe("driver > spanner-postgres > schema", () => {
    describe("synchronize", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                enabledDrivers: ["spanner-postgres"],
                entities,
                schemaCreate: false,
                dropSchema: true,
            })
        })
        after(() => closeTestingConnections(dataSources))

        const forEachDataSource = (
            fn: (dataSource: DataSource) => Promise<any>,
        ) => Promise.all(dataSources.map(fn))

        it("should create the whole schema with a single schema update", () =>
            forEachDataSource(async (dataSource) => {
                const spy = spyOnSchemaUpdates(dataSource)
                try {
                    await dataSource.synchronize()

                    expect(spy.calls).to.equal(1)
                    // tables, indexes, foreign keys and the junction table
                    const [statements] = spy.statements
                    expect(
                        statements.filter((s) => s.startsWith("CREATE TABLE")),
                    ).to.have.length(6)
                    expect(statements.some((s) => /^CREATE .*INDEX/.test(s))).to
                        .be.true
                    expect(statements.some((s) => /FOREIGN KEY/.test(s))).to.be
                        .true
                } finally {
                    spy.restore()
                }
            }))

        it("should do nothing on a second synchronize", () =>
            forEachDataSource(async (dataSource) => {
                await dataSource.synchronize()

                const spy = spyOnSchemaUpdates(dataSource)
                try {
                    await dataSource.synchronize()
                    expect(spy.calls).to.equal(0)
                } finally {
                    spy.restore()
                }

                const log = await dataSource.driver.createSchemaBuilder().log()
                expect(log.upQueries).to.have.length(0)
                expect(log.downQueries).to.have.length(0)
            }))

        it("should load the schema it created", () =>
            forEachDataSource(async (dataSource) => {
                await dataSource.synchronize()
                const queryRunner = dataSource.createQueryRunner()
                try {
                    const table = (await queryRunner.getTable("pgs_account"))!
                    const column = (name: string) =>
                        table.findColumnByName(name)!

                    expect(column("id").isPrimary).to.be.true
                    expect(column("name").length).to.equal("100")
                    expect(column("email").isNullable).to.be.true
                    expect(column("note").isNullable).to.be.false
                    expect(column("big").type).to.equal("bigint")
                    expect(column("meta").type).to.equal("jsonb")
                    expect(column("tags").isArray).to.be.true
                    expect(table.indices.map((i) => i.name).sort()).to.include(
                        "IDX_pgs_account_name",
                    )

                    const kid = (await queryRunner.getTable("pgs_kid"))!
                    expect(
                        kid.foreignKeys.map((fk) => [
                            fk.columnNames,
                            fk.referencedTableName,
                            fk.onDelete,
                        ]),
                    ).to.deep.equal([[["parentId"], "pgs_parent", "CASCADE"]])

                    const junction =
                        (await queryRunner.getTable("pgs_post_tags"))!
                    expect(
                        junction.columns.filter((c) => c.isPrimary),
                    ).to.have.length(2)
                } finally {
                    await queryRunner.release()
                }
            }))

        it("should converge to a changed entity, in a single schema update", async () => {
            const changed = new EntitySchema<any>({
                ...accountOptions,
                columns: {
                    ...accountColumns,
                    // longer
                    name: { type: "varchar", length: 150 },
                    // new default
                    note: {
                        type: "varchar",
                        length: 50,
                        default: "changed",
                    },
                    // now required
                    email: {
                        type: "varchar",
                        length: 200,
                        nullable: false,
                        default: "none",
                    },
                    // new columns
                    extra: { type: "varchar", length: 10, nullable: true },
                    level: { type: "int", default: 7 },
                    // nullable now
                    active: { type: Boolean, default: true, nullable: true },
                } as any,
                // one index dropped, one added
                indices: [
                    {
                        name: "IDX_pgs_account_name",
                        columns: ["name"],
                        unique: true,
                    },
                    { name: "IDX_pgs_account_extra", columns: ["extra"] },
                ],
            })
            const changedSources = await createTestingConnections({
                enabledDrivers: ["spanner-postgres"],
                entities: [changed, Parent, Kid, Post, Tag],
                schemaCreate: false,
                dropSchema: false,
            })
            try {
                await Promise.all(
                    changedSources.map(async (dataSource, index) => {
                        await dataSources[index].synchronize(true)

                        expect(await schemaDiff(dataSource)).to.not.be.empty

                        const spy = spyOnSchemaUpdates(dataSource)
                        try {
                            await dataSource.synchronize()
                            expect(spy.calls).to.equal(1)
                        } finally {
                            spy.restore()
                        }
                        expect(await schemaDiff(dataSource)).to.deep.equal([])

                        // and back to the original entity
                        expect(await schemaDiff(dataSources[index])).to.not.be
                            .empty
                        await dataSources[index].synchronize()
                        expect(
                            await schemaDiff(dataSources[index]),
                        ).to.deep.equal([])
                    }),
                )
            } finally {
                await closeTestingConnections(changedSources)
            }
        })

        it("should apply defaults and constraints of the created schema", () =>
            forEachDataSource(async (dataSource) => {
                await dataSource.synchronize(true)
                const accounts = dataSource.getRepository("Account")
                const saved = await accounts.save(
                    accounts.create({ name: "n1" }),
                )
                const row = await accounts.findOneByOrFail({ id: saved.id })

                expect([
                    row.note,
                    row.counter,
                    row.active,
                    row.meta,
                ]).to.deep.equal(["it's", 0, true, { a: 1 }])
                await expect(
                    accounts.save(accounts.create({ name: "n1" })),
                ).to.be.rejectedWith(/already exists|unique|duplicate/i)

                // ON DELETE CASCADE
                const parents = dataSource.getRepository("Parent")
                const parent = await parents.save(
                    parents.create({
                        name: "p",
                        kids: [{ name: "k1" }, { name: "k2" }],
                    }),
                )
                expect(await dataSource.getRepository("Kid").count()).to.equal(
                    2,
                )
                await parents.delete({ id: parent.id })
                expect(await dataSource.getRepository("Kid").count()).to.equal(
                    0,
                )
            }))
    })

    describe("query runner", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                enabledDrivers: ["spanner-postgres"],
                entities: [Account],
                schemaCreate: true,
                dropSchema: true,
            })
        })
        // drops the tables the test created, and creates the entities again
        afterEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        const forEachDataSource = (
            fn: (dataSource: DataSource) => Promise<any>,
        ) => Promise.all(dataSources.map(fn))

        it("should send a migration of tables, indexes and foreign keys as one schema update", () =>
            forEachDataSource(async (dataSource) => {
                const spy = spyOnSchemaUpdates(dataSource)
                const queryRunner = dataSource.createQueryRunner()
                try {
                    for (const name of ["a", "b", "c"]) {
                        await queryRunner.createTable(
                            new Table({
                                name: `pgs_batch_${name}`,
                                columns: [
                                    {
                                        name: "id",
                                        type: "varchar",
                                        length: "36",
                                        isPrimary: true,
                                    },
                                    {
                                        name: "ref",
                                        type: "varchar",
                                        length: "36",
                                        isNullable: true,
                                    },
                                    {
                                        name: "v1",
                                        type: "bigint",
                                        isNullable: true,
                                    },
                                    {
                                        name: "v2",
                                        type: "varchar",
                                        length: "20",
                                        isNullable: true,
                                    },
                                ],
                            }),
                        )
                    }
                    for (const table of ["a", "b", "c"]) {
                        await queryRunner.createIndex(
                            `pgs_batch_${table}`,
                            new TableIndex({
                                name: `IDX_pgs_batch_${table}_v1`,
                                columnNames: ["v1"],
                            }),
                        )
                        await queryRunner.createIndex(
                            `pgs_batch_${table}`,
                            new TableIndex({
                                name: `IDX_pgs_batch_${table}_v2`,
                                columnNames: ["v2"],
                                isUnique: true,
                            }),
                        )
                    }
                    for (const [table, referenced] of [
                        ["b", "a"],
                        ["c", "b"],
                        ["a", "c"],
                    ]) {
                        await queryRunner.createForeignKey(
                            `pgs_batch_${table}`,
                            new TableForeignKey({
                                name: `FK_pgs_batch_${table}`,
                                columnNames: ["ref"],
                                referencedTableName: `pgs_batch_${referenced}`,
                                referencedColumnNames: ["id"],
                                onDelete: "CASCADE",
                            }),
                        )
                    }

                    // nothing was sent yet
                    expect(spy.calls).to.equal(0)
                    await queryRunner.release()

                    expect(spy.calls).to.equal(1)
                    // 3 tables + 6 indexes + 3 foreign keys
                    expect(spy.statements[0]).to.have.length(12)

                    const verifier = dataSource.createQueryRunner()
                    const tables = await verifier.getTables([
                        "pgs_batch_a",
                        "pgs_batch_b",
                        "pgs_batch_c",
                    ])
                    expect(tables).to.have.length(3)
                    expect(
                        tables.reduce((n, t) => n + t.indices.length, 0),
                    ).to.equal(6)
                    expect(
                        tables.reduce((n, t) => n + t.foreignKeys.length, 0),
                    ).to.equal(3)
                    await verifier.release()
                } finally {
                    spy.restore()
                }
            }))

        it("should queue raw DDL and send it before the next statement that is not DDL", () =>
            forEachDataSource(async (dataSource) => {
                const spy = spyOnSchemaUpdates(dataSource)
                const queryRunner: any = dataSource.createQueryRunner()
                try {
                    await queryRunner.query(
                        `CREATE TABLE "rw_a" ("id" bigint NOT NULL, "v" varchar(10), PRIMARY KEY ("id"))`,
                    )
                    await queryRunner.query(
                        `/* comment */ CREATE INDEX "rw_a_v" ON "rw_a" ("v")`,
                    )
                    expect(spy.calls).to.equal(0)
                    expect(queryRunner.pendingDdl).to.have.length(2)

                    // the table exists for this SELECT: the DDL went first
                    expect(
                        await queryRunner.query(
                            `SELECT COUNT(*) AS n FROM "rw_a"`,
                        ),
                    ).to.deep.equal([{ n: 0 }])
                    expect(spy.calls).to.equal(1)
                    expect(spy.statements[0]).to.have.length(2)

                    // DML does not wait for later DDL, and DDL after DML waits again
                    await queryRunner.query(
                        `INSERT INTO "rw_a" ("id", "v") VALUES (1, 'x')`,
                    )
                    await queryRunner.query(
                        `ALTER TABLE "rw_a" ADD COLUMN "w" bigint`,
                    )
                    await queryRunner.query(`DROP INDEX "rw_a_v"`)
                    expect(queryRunner.pendingDdl).to.have.length(2)
                    expect(spy.calls).to.equal(1)

                    await (queryRunner as SpannerPostgresQueryRunner).flushDdl()
                    expect(spy.calls).to.equal(2)
                    expect(await queryRunner.hasColumn("rw_a", "w")).to.be.true
                } finally {
                    spy.restore()
                    await queryRunner.release()
                }
            }))

        it("should discard the DDL queued in a transaction that rolls back, and send it on commit", () =>
            forEachDataSource(async (dataSource) => {
                const queryRunner: any = dataSource.createQueryRunner()
                try {
                    await queryRunner.startTransaction()
                    await queryRunner.query(
                        `CREATE TABLE "rw_discard" ("id" bigint NOT NULL, PRIMARY KEY ("id"))`,
                    )
                    await queryRunner.rollbackTransaction()
                    expect(queryRunner.pendingDdl).to.have.length(0)
                    expect(await queryRunner.hasTable("rw_discard")).to.be.false

                    await queryRunner.startTransaction()
                    await queryRunner.query(
                        `CREATE TABLE "rw_kept" ("id" bigint NOT NULL, PRIMARY KEY ("id"))`,
                    )
                    await queryRunner.commitTransaction()
                    expect(await queryRunner.hasTable("rw_kept")).to.be.true
                } finally {
                    await queryRunner.release()
                }
            }))

        it("should send the queued DDL when a transaction starts", () =>
            forEachDataSource(async (dataSource) => {
                const queryRunner: any = dataSource.createQueryRunner()
                try {
                    await queryRunner.query(
                        `CREATE TABLE "rw_before_tx" ("id" bigint NOT NULL, PRIMARY KEY ("id"))`,
                    )
                    await queryRunner.startTransaction()
                    expect(queryRunner.pendingDdl).to.have.length(0)
                    await queryRunner.rollbackTransaction()

                    expect(await queryRunner.hasTable("rw_before_tx")).to.be
                        .true
                } finally {
                    await queryRunner.release()
                }
            }))

        it("should report a failing statement from the call that sends the batch", () =>
            forEachDataSource(async (dataSource) => {
                const queryRunner: any = dataSource.createQueryRunner()
                try {
                    await queryRunner.query(
                        `CREATE TABLE "rw_ok" ("id" bigint NOT NULL, PRIMARY KEY ("id"))`,
                    )
                    // not a Spanner type
                    await queryRunner.query(
                        `CREATE TABLE "rw_bad" ("id" smallint NOT NULL, PRIMARY KEY ("id"))`,
                    )

                    await expect(
                        (queryRunner as SpannerPostgresQueryRunner).flushDdl(),
                    ).to.be.rejectedWith(/smallint|int2/i)
                    expect(queryRunner.pendingDdl).to.have.length(0)
                } finally {
                    await queryRunner.release()
                }
            }))

        it("should find tables and columns inside a transaction, after DML", () =>
            forEachDataSource(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    await queryRunner.startTransaction()
                    await queryRunner.query(
                        `INSERT INTO "pgs_account" ("name") VALUES ('in tx')`,
                    )

                    // Spanner rejects INFORMATION_SCHEMA in a read-write transaction
                    expect(await queryRunner.hasTable("pgs_account")).to.be.true
                    expect(await queryRunner.hasTable("pgs_nope")).to.be.false
                    expect(await queryRunner.hasColumn("pgs_account", "note"))
                        .to.be.true
                    expect(await queryRunner.hasColumn("pgs_account", "nope"))
                        .to.be.false
                    expect(await queryRunner.getTable("pgs_account")).to.not.be
                        .undefined

                    await queryRunner.rollbackTransaction()
                } finally {
                    await queryRunner.release()
                }
            }))

        it("should know the schemas and the database", () =>
            forEachDataSource(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    expect(await queryRunner.hasSchema("public")).to.be.true
                    expect(await queryRunner.hasSchema("pgs_nope")).to.be.false
                    expect(await queryRunner.getCurrentSchema()).to.equal(
                        "public",
                    )
                    expect(await queryRunner.getCurrentDatabase()).to.equal(
                        (dataSource.options as any).databaseId,
                    )
                } finally {
                    await queryRunner.release()
                }
            }))

        it("should add and drop columns, changing their length and nullability", () =>
            forEachDataSource(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    await queryRunner.createTable(
                        new Table({
                            name: "pgs_batch_ddl",
                            columns: [
                                {
                                    name: "id",
                                    type: "bigint",
                                    isPrimary: true,
                                },
                                {
                                    name: "label",
                                    type: "varchar", // an alias of the type changeColumn() is called with
                                    length: "10",
                                    isNullable: true,
                                },
                            ],
                        }),
                    )
                    await queryRunner.addColumn(
                        "pgs_batch_ddl",
                        new TableColumn({
                            name: "extra",
                            type: "bigint",
                            isNullable: false,
                            default: "3",
                        }),
                    )
                    await queryRunner.changeColumn(
                        "pgs_batch_ddl",
                        "label",
                        new TableColumn({
                            name: "label",
                            type: "character varying",
                            length: "40",
                            isNullable: false,
                            default: "'zz'",
                        }),
                    )
                    await (queryRunner as SpannerPostgresQueryRunner).flushDdl()

                    const table = (await queryRunner.getTable("pgs_batch_ddl"))!
                    const label = table.findColumnByName("label")!
                    expect([label.length, label.isNullable]).to.deep.equal([
                        "40",
                        false,
                    ])
                    expect(table.findColumnByName("extra")!.default).to.equal(
                        "3",
                    )

                    await queryRunner.dropColumn("pgs_batch_ddl", "extra")
                    await queryRunner.dropColumn(
                        "pgs_batch_ddl",
                        "not_there",
                        true,
                    )
                    await (queryRunner as SpannerPostgresQueryRunner).flushDdl()
                    expect(
                        await queryRunner.hasColumn("pgs_batch_ddl", "extra"),
                    ).to.be.false
                } finally {
                    await queryRunner.release()
                }
            }))
    })

    describe("what Spanner cannot do", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                enabledDrivers: ["spanner-postgres"],
                entities: [Account],
                schemaCreate: true,
                dropSchema: true,
            })
        })
        after(() => closeTestingConnections(dataSources))

        const forEachDataSource = (
            fn: (dataSource: DataSource) => Promise<any>,
        ) => Promise.all(dataSources.map(fn))

        it("should reject foreign key actions other than NO ACTION and CASCADE", () =>
            forEachDataSource(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    for (const action of [
                        { onDelete: "SET NULL" },
                        { onDelete: "RESTRICT" },
                        { onUpdate: "CASCADE" },
                        { deferrable: "INITIALLY DEFERRED" },
                    ]) {
                        await expect(
                            queryRunner.createForeignKey(
                                "pgs_account",
                                new TableForeignKey({
                                    name: "FK_pgs_bad",
                                    columnNames: ["id"],
                                    referencedTableName: "pgs_account",
                                    referencedColumnNames: ["id"],
                                    ...action,
                                }),
                            ),
                        ).to.be.rejectedWith(
                            TypeORMError,
                            /ON DELETE NO ACTION or CASCADE/,
                        )
                    }
                } finally {
                    await queryRunner.release()
                }
            }))

        it("should reject changes of a column Spanner cannot make", () =>
            forEachDataSource(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    await expect(
                        queryRunner.changeColumn(
                            "pgs_account",
                            "big",
                            new TableColumn({
                                name: "big",
                                type: "character varying",
                                length: "5",
                                isNullable: true,
                            }),
                        ),
                    ).to.be.rejectedWith(TypeORMError, /cannot change the type/)
                    await expect(
                        queryRunner.renameColumn("pgs_account", "big", "other"),
                    ).to.be.rejectedWith(TypeORMError, /cannot rename/)
                    await expect(
                        queryRunner.createPrimaryKey("pgs_account", ["name"]),
                    ).to.be.rejectedWith(
                        TypeORMError,
                        /keys of a Spanner table/,
                    )
                    await expect(
                        queryRunner.dropPrimaryKey("pgs_account"),
                    ).to.be.rejectedWith(
                        TypeORMError,
                        /keys of a Spanner table/,
                    )
                    await expect(
                        queryRunner.createTable(
                            new Table({
                                name: "pgs_nopk",
                                columns: [{ name: "id", type: "bigint" }],
                            }),
                        ),
                    ).to.be.rejectedWith(TypeORMError, /requires a primary key/)
                } finally {
                    await queryRunner.release()
                }
            }))

        it("should reject parameters in a DDL statement", () =>
            forEachDataSource(async (dataSource) => {
                await expect(
                    dataSource.query(`CREATE INDEX x ON t (a)`, [1]),
                ).to.be.rejectedWith(TypeORMError, /does not accept parameters/)
            }))

        it("should reject the column types Spanner does not have with a DataTypeNotSupportedError", async () => {
            for (const type of [
                "enum",
                "simple-enum",
                "smallint",
                "int2",
                "json",
                "timestamp",
                "char",
                "interval",
            ]) {
                const Unsupported = new EntitySchema<any>({
                    name: "Unsupported",
                    tableName: "pgs_unsupported",
                    columns: {
                        id: {
                            type: "varchar",
                            length: 36,
                            primary: true,
                        },
                        value: {
                            type: type as any,
                            enum: ["a", "b"],
                            nullable: true,
                        },
                    },
                })
                let created: DataSource[] = []
                try {
                    created = await createTestingConnections({
                        enabledDrivers: ["spanner-postgres"],
                        entities: [Unsupported],
                    })
                } catch (error) {
                    expect(error, type).to.be.instanceOf(
                        DataTypeNotSupportedError,
                    )
                }
                // nothing was created: it failed, or the driver is not enabled
                expect(created, type).to.have.length(0)
                await closeTestingConnections(created)
            }
        })
    })

    describe("query result cache", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                enabledDrivers: ["spanner-postgres"],
                entities: [Account],
                schemaCreate: true,
                dropSchema: true,
                cache: true,
            })
        })
        after(() => closeTestingConnections(dataSources))

        it("should store the cache in a table with a name Spanner accepts", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const queryRunner = dataSource.createQueryRunner()
                    expect(await queryRunner.hasTable("query_result_cache")).to
                        .be.true
                    await queryRunner.release()

                    const repository = dataSource.getRepository("Account")
                    await repository.save(repository.create({ name: "c" }))
                    const first = await repository.find({ cache: true })
                    const second = await repository.find({ cache: true })
                    expect(first).to.have.length(1)
                    expect(second).to.have.length(1)

                    const cached = await dataSource.query(
                        `SELECT COUNT(*) AS n FROM "query_result_cache"`,
                    )
                    expect(cached[0].n).to.be.greaterThan(0)
                }),
            ))
    })
})
