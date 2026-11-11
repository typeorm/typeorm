// Regression tests for #12994 / #5226
import "reflect-metadata"
import { expect } from "chai"
import sinon from "sinon"
import type { DataSource } from "../../../../src/data-source/DataSource"
import type { ObjectLiteral } from "../../../../src/common/ObjectLiteral"
import type { ColumnMetadata } from "../../../../src/metadata/ColumnMetadata"
import type { EntityMetadata } from "../../../../src/metadata/EntityMetadata"
import type { QueryRunner } from "../../../../src/query-runner/QueryRunner"
import { QueryResult } from "../../../../src/query-runner/QueryResult"
import { InsertResult } from "../../../../src/query-builder/result/InsertResult"
import { ReturningResultsEntityUpdator } from "../../../../src/query-builder/ReturningResultsEntityUpdator"
import { QueryExpressionMap } from "../../../../src/query-builder/QueryExpressionMap"
import { Alias } from "../../../../src/query-builder/Alias"
import { PostgresDriver } from "../../../../src/driver/postgres/PostgresDriver"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Tag } from "./entity/Tag"
import { BracketTag } from "./entity/BracketTag"
import { CompositeTenantItem } from "./entity/CompositeTenantItem"
import { EventLog } from "./entity/EventLog"

class TestableReturningResultsEntityUpdator extends ReturningResultsEntityUpdator {
    public checkEntityMatchRaw(
        entity: ObjectLiteral,
        rawItem: ObjectLiteral,
    ): boolean {
        return this.doesEntityMatchRaw(entity, rawItem)
    }

    public computeMatchingSignature(
        entityOrRaw: ObjectLiteral,
        columns: ColumnMetadata[],
        isRaw: boolean,
    ): string | undefined {
        return this.getEntityMatchingSignature(entityOrRaw, columns, isRaw)
    }
}

function buildGeneratedMapFromRaw(
    meta: EntityMetadata,
    raw: ObjectLiteral | undefined,
): ObjectLiteral | undefined {
    if (!raw) return undefined
    const map: ObjectLiteral = {}
    for (const key of Object.keys(raw)) {
        const col = meta.findColumnWithDatabaseName(key)
        if (col) {
            map[col.propertyName] = raw[key]
        }
    }
    return map
}

describe("query builder > insert > on ignore returning correlation", () => {
    describe("integration tests (drivers supporting RETURNING)", () => {
        let dataSources: DataSource[]

        before(async () => {
            dataSources = await createTestingConnections({
                entities: [Tag],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["postgres", "cockroachdb"],
            })
        })

        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("should match returned rows to inserted entities and leave skipped entities unchanged", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const repo = dataSource.getRepository(Tag)

                    const existing = await repo.save(repo.create({ name: "a" }))

                    const tagA = repo.create({ name: "a" })
                    const tagB = repo.create({ name: "b" })
                    const tags = [tagA, tagB]

                    const result = await repo
                        .createQueryBuilder()
                        .insert()
                        .values(tags)
                        .orIgnore()
                        .execute()

                    expect(tagA.id).to.be.undefined
                    expect(tagB.id).to.be.a("string")
                    expect(tagB.id).to.not.equal(existing.id)

                    expect(result.identifiers[0]).to.be.undefined
                    expect(result.identifiers[1]).to.deep.equal({ id: tagB.id })

                    const persistedA = await repo.findOneBy({ name: "a" })
                    const persistedB = await repo.findOneBy({ name: "b" })
                    expect(persistedA?.id).to.equal(existing.id)
                    expect(persistedB?.id).to.equal(tagB.id)
                }),
            ))

        it("should handle when the second row is skipped and first is inserted", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const repo = dataSource.getRepository(Tag)

                    const existing = await repo.save(repo.create({ name: "b" }))

                    const tagA = repo.create({ name: "a" })
                    const tagB = repo.create({ name: "b" })
                    const tags = [tagA, tagB]

                    const result = await repo
                        .createQueryBuilder()
                        .insert()
                        .values(tags)
                        .orIgnore()
                        .execute()

                    expect(tagA.id).to.be.a("string")
                    expect(tagB.id).to.be.undefined

                    expect(result.identifiers[0]).to.deep.equal({ id: tagA.id })
                    expect(result.identifiers[1]).to.be.undefined

                    const persistedA = await repo.findOneBy({ name: "a" })
                    const persistedB = await repo.findOneBy({ name: "b" })
                    expect(persistedA?.id).to.equal(tagA.id)
                    expect(persistedB?.id).to.equal(existing.id)
                }),
            ))
    })

    describe("SQL generation and entity correlation logic", () => {
        let dataSource: DataSource

        before(async () => {
            const connections = await createTestingConnections({
                entities: [Tag, BracketTag, CompositeTenantItem, EventLog],
                enabledDrivers: ["better-sqlite3"],
            })
            expect(connections).to.have.lengthOf(1)
            dataSource = connections[0]
        })

        const driverCleanupCallbacks: Array<() => void> = []

        afterEach(() => {
            while (driverCleanupCallbacks.length > 0) {
                driverCleanupCallbacks.pop()?.()
            }
            sinon.restore()
        })

        after(async () => {
            if (dataSource) {
                await dataSource.destroy()
            }
        })

        function setupEmulatedReturningQueryRunner(
            rawRows: ObjectLiteral[],
            driverType: "postgres" | "oracle" | "mssql" = "postgres",
        ): {
            queryRunner: QueryRunner
            queryStub: sinon.SinonStub
        } {
            sinon.stub(dataSource.driver, "options").value({
                ...dataSource.driver.options,
                type: driverType,
            })
            sinon
                .stub(dataSource.driver, "isReturningSqlSupported")
                .returns(true)
            sinon
                .stub(dataSource.driver, "isUUIDGenerationSupported")
                .returns(true)
            sinon
                .stub(dataSource.driver, "createGeneratedMap")
                .callsFake((meta: EntityMetadata, raw: ObjectLiteral) =>
                    buildGeneratedMapFromRaw(meta, raw),
                )

            if (driverType === "mssql") {
                Object.defineProperty(
                    dataSource.driver,
                    "buildTableVariableDeclaration",
                    {
                        value: () => "DECLARE @OutputTable TABLE (id INT)",
                        configurable: true,
                    },
                )
                Object.defineProperty(dataSource.driver, "parametrizeValue", {
                    value: (_column: ColumnMetadata, value: unknown) => value,
                    configurable: true,
                })
                driverCleanupCallbacks.push(() => {
                    Reflect.deleteProperty(
                        dataSource.driver,
                        "buildTableVariableDeclaration",
                    )
                    Reflect.deleteProperty(
                        dataSource.driver,
                        "parametrizeValue",
                    )
                })
            }

            const queryRunner = dataSource.createQueryRunner()
            const queryResult = new QueryResult()
            queryResult.raw = rawRows
            const queryStub = sinon
                .stub(queryRunner, "query")
                .resolves(queryResult)

            return { queryRunner, queryStub }
        }

        function createUpdatorFor<Entity extends ObjectLiteral>(
            entityClass: new () => Entity,
            options?: { onIgnore?: boolean; allColumnsExtra?: boolean },
        ): {
            queryRunner: QueryRunner
            updator: TestableReturningResultsEntityUpdator
            metadata: EntityMetadata
        } {
            const meta = dataSource.getMetadata(entityClass)
            const expressionMap = new QueryExpressionMap(dataSource)
            const mainAlias = new Alias()
            mainAlias.metadata = meta
            expressionMap.setMainAlias(mainAlias)
            expressionMap.onIgnore = options?.onIgnore ?? true
            if (options?.allColumnsExtra) {
                expressionMap.extraReturningColumns = meta.columns
            }

            const queryRunner = dataSource.createQueryRunner()
            const updator = new TestableReturningResultsEntityUpdator(
                queryRunner,
                expressionMap,
            )
            return { queryRunner, updator, metadata: meta }
        }

        it("should include identifying columns in SQL RETURNING when orIgnore is combined with string returning", async () => {
            const { queryRunner, queryStub } =
                setupEmulatedReturningQueryRunner([{ id: "uuid-b", name: "b" }])
            try {
                const tagA = new Tag()
                tagA.name = "a"
                const tagB = new Tag()
                tagB.name = "b"

                const result = await dataSource
                    .createQueryBuilder(queryRunner)
                    .insert()
                    .into(Tag)
                    .values([tagA, tagB])
                    .orIgnore()
                    .returning("id")
                    .execute()

                const executedSql = queryStub.firstCall.args[0] as string
                expect(executedSql).to.include("RETURNING id,")
                expect(executedSql).to.include('"name"')

                expect(tagA.id).to.be.undefined
                expect(result.identifiers[0]).to.be.undefined
                expect(tagB.id).to.equal("uuid-b")
                expect(result.identifiers[1]).to.deep.equal({ id: "uuid-b" })
            } finally {
                await queryRunner.release()
            }
        })

        it("should append unaliased identifying column when aliased in string returning clause", async () => {
            const { queryRunner, queryStub } =
                setupEmulatedReturningQueryRunner([
                    { id: "uuid-b", alias: "b", name: "b" },
                ])
            try {
                const tagA = new Tag()
                tagA.name = "a"
                const tagB = new Tag()
                tagB.name = "b"

                const result = await dataSource
                    .createQueryBuilder(queryRunner)
                    .insert()
                    .into(Tag)
                    .values([tagA, tagB])
                    .orIgnore()
                    .returning("id, name AS alias")
                    .execute()

                const executedSql = queryStub.firstCall.args[0] as string
                expect(executedSql).to.include(
                    'RETURNING id, name AS alias, "name"',
                )

                expect(tagA.id).to.be.undefined
                expect(result.identifiers[0]).to.be.undefined
                expect(tagB.id).to.equal("uuid-b")
                expect(result.identifiers[1]).to.deep.equal({ id: "uuid-b" })
            } finally {
                await queryRunner.release()
            }
        })

        it("should not treat an entity with defined comparable columns as default-only if returning fields are missing", async () => {
            sinon
                .stub(dataSource.driver, "isReturningSqlSupported")
                .returns(true)
            const { queryRunner, updator } = createUpdatorFor(Tag, {
                allColumnsExtra: true,
            })
            try {
                const tagSkipped = new Tag()
                tagSkipped.name = "a"

                // Simulate raw result where only alias is present without raw column "name"
                const isMatch = updator.checkEntityMatchRaw(tagSkipped, {
                    id: "uuid-inserted",
                    alias: "b",
                })
                expect(isMatch).to.be.false
            } finally {
                await queryRunner.release()
            }
        })

        it("should handle column names with regex metacharacters like '[' in custom returning clauses", async () => {
            const { queryRunner, queryStub } =
                setupEmulatedReturningQueryRunner([
                    { id: "uuid-bracket-1", "code[": "val-1" },
                ])
            try {
                const item1 = new BracketTag()
                item1.codeBracket = "val-0"
                const item2 = new BracketTag()
                item2.codeBracket = "val-1"

                const result = await dataSource
                    .createQueryBuilder(queryRunner)
                    .insert()
                    .into(BracketTag)
                    .values([item1, item2])
                    .orIgnore()
                    .returning("id")
                    .execute()

                const executedSql = queryStub.firstCall.args[0] as string
                expect(executedSql).to.include('"code["')
                expect(item1.id).to.be.undefined
                expect(item2.id).to.equal("uuid-bracket-1")
                expect(result.identifiers[1]).to.deep.equal({
                    id: "uuid-bracket-1",
                })

                // Verify when already specified unaliased in quoted form, it is not duplicated
                queryStub.resetHistory()
                await dataSource
                    .createQueryBuilder(queryRunner)
                    .insert()
                    .into(BracketTag)
                    .values([item1])
                    .orIgnore()
                    .returning('"code["')
                    .execute()
                const secondSql = queryStub.firstCall.args[0] as string
                const returningClause = secondSql.split("RETURNING ")[1] ?? ""
                expect(returningClause).to.equal('"code[", "id"')
                expect(returningClause.match(/"code\["/g)).to.have.lengthOf(1)
            } finally {
                await queryRunner.release()
            }
        })

        it("should not append columns onto custom Oracle RETURNING INTO fragments", async () => {
            const { queryRunner, queryStub } =
                setupEmulatedReturningQueryRunner([], "oracle")
            try {
                const tag = new Tag()
                tag.name = "oracle-tag"

                await dataSource
                    .createQueryBuilder(queryRunner)
                    .insert()
                    .into(Tag)
                    .values([tag])
                    .orIgnore()
                    .returning("id INTO :out")
                    .execute()

                const executedSql = queryStub.firstCall.args[0] as string
                expect(executedSql).to.include("RETURNING id INTO :out")
                expect(executedSql).to.not.include('id INTO :out, "name"')
            } finally {
                await queryRunner.release()
            }
        })

        it("should insert MSSQL OUTPUT identifying columns before INTO @OutputTable clause", async () => {
            const { queryRunner, queryStub } =
                setupEmulatedReturningQueryRunner(
                    [{ id: "uuid-mssql", name: "mssql-tag" }],
                    "mssql",
                )
            try {
                const tag = new Tag()
                tag.name = "mssql-tag"

                await dataSource
                    .createQueryBuilder(queryRunner)
                    .insert()
                    .into(Tag)
                    .values([tag])
                    .orIgnore()
                    .returning("INSERTED.id INTO @OutputTable")
                    .execute()

                const executedSql = queryStub.firstCall.args[0] as string
                expect(executedSql).to.include(
                    'OUTPUT INSERTED.id, INSERTED."name" INTO @OutputTable',
                )
            } finally {
                await queryRunner.release()
            }
        })

        it("should expand MSSQL OUTPUT INTO while ignoring INTO inside comments and literals", async () => {
            const { queryRunner, queryStub } =
                setupEmulatedReturningQueryRunner(
                    [{ id: "uuid-mssql-comment", name: "mssql-tag" }],
                    "mssql",
                )
            try {
                const tag = new Tag()
                tag.name = "mssql-tag"

                await dataSource
                    .createQueryBuilder(queryRunner)
                    .insert()
                    .into(Tag)
                    .values([tag])
                    .orIgnore()
                    .returning(
                        "INSERTED.id /* INTO note */, 'text INTO x' AS note INTO @OutputTable",
                    )
                    .execute()

                const executedSql = queryStub.firstCall.args[0] as string
                expect(executedSql).to.include(
                    "OUTPUT INSERTED.id /* INTO note */, 'text INTO x' AS note, INSERTED.\"name\" INTO @OutputTable",
                )
            } finally {
                await queryRunner.release()
            }
        })

        it("should expand MSSQL OUTPUT INTO explicit target column list when appending identifying columns", async () => {
            const { queryRunner, queryStub } =
                setupEmulatedReturningQueryRunner(
                    [{ id: "uuid-mssql-cols", name: "mssql-tag" }],
                    "mssql",
                )
            try {
                const tag = new Tag()
                tag.name = "mssql-tag"

                await dataSource
                    .createQueryBuilder(queryRunner)
                    .insert()
                    .into(Tag)
                    .values([tag])
                    .orIgnore()
                    .returning("INSERTED.id INTO @OutputTable (id)")
                    .execute()

                const executedSql = queryStub.firstCall.args[0] as string
                expect(executedSql).to.include(
                    'OUTPUT INSERTED.id, INSERTED."name" INTO @OutputTable (id, "name")',
                )
            } finally {
                await queryRunner.release()
            }
        })

        it("should match returned row to entity A when entity B is skipped, and leave all undefined if all skipped", async () => {
            sinon
                .stub(dataSource.driver, "isReturningSqlSupported")
                .returns(true)
            sinon
                .stub(dataSource.driver, "createGeneratedMap")
                .callsFake((meta: EntityMetadata, raw: ObjectLiteral) =>
                    buildGeneratedMapFromRaw(meta, raw),
                )

            const { queryRunner, updator } = createUpdatorFor(Tag, {
                allColumnsExtra: true,
            })
            try {
                const tagA = new Tag()
                tagA.name = "a"
                const tagB = new Tag()
                tagB.name = "b"

                const insertResultA = new InsertResult()
                insertResultA.raw = [{ id: "generated-uuid-a", name: "a" }]
                await updator.insert(insertResultA, [tagA, tagB])

                expect(tagA.id).to.equal("generated-uuid-a")
                expect(insertResultA.identifiers[0]).to.deep.equal({
                    id: "generated-uuid-a",
                })
                expect(tagB.id).to.be.undefined
                expect(insertResultA.identifiers[1]).to.be.undefined
                expect(insertResultA.generatedMaps[1]).to.be.undefined

                // All skipped
                const tagC = new Tag()
                tagC.name = "c"
                const tagD = new Tag()
                tagD.name = "d"
                const insertResultNone = new InsertResult()
                insertResultNone.raw = []
                await updator.insert(insertResultNone, [tagC, tagD])

                expect(tagC.id).to.be.undefined
                expect(tagD.id).to.be.undefined
                expect(insertResultNone.identifiers[0]).to.be.undefined
                expect(insertResultNone.identifiers[1]).to.be.undefined
            } finally {
                await queryRunner.release()
            }
        })

        it("should match default-only entities when other rows are skipped", async () => {
            sinon
                .stub(dataSource.driver, "isReturningSqlSupported")
                .returns(true)
            sinon
                .stub(dataSource.driver, "createGeneratedMap")
                .callsFake((meta: EntityMetadata, raw: ObjectLiteral) =>
                    buildGeneratedMapFromRaw(meta, raw),
                )

            const { queryRunner, updator } = createUpdatorFor(Tag, {
                allColumnsExtra: true,
            })
            try {
                const defaultEntityA: ObjectLiteral = {}
                const defaultEntityB: ObjectLiteral = {}
                const insertResult = new InsertResult()
                insertResult.raw = [
                    { id: "generated-uuid-default", name: null },
                ]

                await updator.insert(insertResult, [
                    defaultEntityA,
                    defaultEntityB,
                ])

                expect(defaultEntityA.id).to.equal("generated-uuid-default")
                expect(insertResult.identifiers[0]).to.deep.equal({
                    id: "generated-uuid-default",
                })
                expect(defaultEntityB.id).to.be.undefined
                expect(insertResult.identifiers[1]).to.be.undefined
            } finally {
                await queryRunner.release()
            }
        })

        it("should match entities with transformers and fall back cleanly for SQL-expression primary keys", async () => {
            sinon
                .stub(dataSource.driver, "isReturningSqlSupported")
                .returns(true)
            sinon
                .stub(dataSource.driver, "createGeneratedMap")
                .callsFake((meta: EntityMetadata, raw: ObjectLiteral) =>
                    buildGeneratedMapFromRaw(meta, raw),
                )

            const { queryRunner, updator } = createUpdatorFor(
                CompositeTenantItem,
                {
                    allColumnsExtra: true,
                },
            )
            try {
                // SQL-expression PK + distinct unique emails: entity 1 is skipped on email, entity 2 is inserted
                const sqlPkExpr = () => "gen_random_uuid()"
                const skippedItem: ObjectLiteral = {
                    orgId: () => "'org-expr'",
                    id: sqlPkExpr,
                    email: "Skipped@Example.COM",
                }
                const insertedItem: ObjectLiteral = {
                    orgId: () => "'org-expr'",
                    id: sqlPkExpr,
                    email: "Inserted@Example.COM",
                }

                const insertResult = new InsertResult()
                insertResult.raw = [
                    {
                        orgId: "org-expr",
                        id: "uuid-inserted-2",
                        email: "inserted@example.com",
                    },
                ]

                await updator.insert(insertResult, [skippedItem, insertedItem])

                // Skipped item must keep its SQL function PK and NOT consume entity 2's generated UUID
                expect(skippedItem.id).to.equal(sqlPkExpr)
                expect(insertResult.identifiers[0]).to.be.undefined

                // Inserted item matches via lowercase transformer on email and gets generated ID
                expect(insertedItem.id).to.equal("uuid-inserted-2")
                expect(insertResult.identifiers[1]).to.deep.equal({
                    orgId: "org-expr",
                    id: "uuid-inserted-2",
                })

                // Partial composite PK check: orgId defined, generated id unset
                const partialPkItem = new CompositeTenantItem()
                partialPkItem.orgId = "org-1"
                partialPkItem.email = "user@test.com"
                expect(
                    updator.checkEntityMatchRaw(partialPkItem, {
                        orgId: "org-1",
                        id: "uuid-seq-1",
                        email: "user@test.com",
                    }),
                ).to.be.true
                expect(
                    updator.checkEntityMatchRaw(partialPkItem, {
                        orgId: "org-2",
                        id: "uuid-seq-1",
                        email: "user@test.com",
                    }),
                ).to.be.false
            } finally {
                await queryRunner.release()
            }
        })

        it("should match bulk entities via O(1) signature indexing and reject skipped delimiter-confusable values", async () => {
            sinon
                .stub(dataSource.driver, "isReturningSqlSupported")
                .returns(true)
            sinon
                .stub(dataSource.driver, "createGeneratedMap")
                .callsFake((meta: EntityMetadata, raw: ObjectLiteral) =>
                    buildGeneratedMapFromRaw(meta, raw),
                )

            const { queryRunner, updator, metadata } = createUpdatorFor(Tag, {
                allColumnsExtra: true,
            })
            try {
                // Bulk matching: 50 entities (even skipped, odd inserted)
                const bulkEntities: Tag[] = []
                const bulkRaw: ObjectLiteral[] = []
                for (let i = 0; i < 50; i++) {
                    const tag = new Tag()
                    tag.name = `item-${i}`
                    bulkEntities.push(tag)
                    if (i % 2 === 1) {
                        bulkRaw.push({ id: `uuid-${i}`, name: `item-${i}` })
                    }
                }
                const bulkResult = new InsertResult()
                bulkResult.raw = bulkRaw
                await updator.insert(bulkResult, bulkEntities)

                for (let i = 0; i < 50; i++) {
                    if (i % 2 === 1) {
                        expect(bulkEntities[i].id).to.equal(`uuid-${i}`)
                        expect(bulkResult.identifiers[i]).to.deep.equal({
                            id: `uuid-${i}`,
                        })
                    } else {
                        expect(bulkEntities[i].id).to.be.undefined
                        expect(bulkResult.identifiers[i]).to.be.undefined
                    }
                }

                // Length-prefixed signatures distinguish delimiter-confusable column values
                const nonGeneratedColumns = metadata.columns.filter(
                    (col) => !col.isGenerated,
                )
                const tagDelim = new Tag()
                tagDelim.name = "name=other;name=3"
                const tagOther = new Tag()
                tagOther.name = "other"

                const sig1 = updator.computeMatchingSignature(
                    tagDelim,
                    nonGeneratedColumns,
                    false,
                )
                const sig2 = updator.computeMatchingSignature(
                    tagOther,
                    nonGeneratedColumns,
                    false,
                )
                expect(sig1).to.not.equal(sig2)

                const tagSkippedDelim = new Tag()
                tagSkippedDelim.name = "name=other;id=123"
                const tagInsertedOther = new Tag()
                tagInsertedOther.name = "other"

                const collisionResult = new InsertResult()
                collisionResult.raw = [
                    { id: "generated-uuid-other", name: "other" },
                ]
                await updator.insert(collisionResult, [
                    tagSkippedDelim,
                    tagInsertedOther,
                ])

                expect(tagSkippedDelim.id).to.be.undefined
                expect(collisionResult.identifiers[0]).to.be.undefined
                expect(tagInsertedOther.id).to.equal("generated-uuid-other")
                expect(collisionResult.identifiers[1]).to.deep.equal({
                    id: "generated-uuid-other",
                })
            } finally {
                await queryRunner.release()
            }
        })

        it("should treat explicit null values as comparable and reject skipped null rows when non-null row is inserted", async () => {
            const nullRow = new EventLog()
            nullRow.category = "shared"
            nullRow.code = null
            const activeRow = new EventLog()
            activeRow.category = "shared"
            activeRow.code = "active"

            const { queryRunner, queryStub } =
                setupEmulatedReturningQueryRunner(
                    [
                        {
                            id: "uuid-active-event",
                            category: "shared",
                            code: "active",
                        },
                    ],
                    "postgres",
                )
            try {
                const result = await dataSource
                    .createQueryBuilder(queryRunner)
                    .insert()
                    .into(EventLog)
                    .values([nullRow, activeRow])
                    .orIgnore()
                    .execute()

                expect(queryStub.calledOnce).to.be.true
                expect(nullRow.id).to.be.undefined
                expect(result.identifiers[0]).to.be.undefined
                expect(activeRow.id).to.equal("uuid-active-event")
                expect(result.identifiers[1]).to.deep.equal({
                    id: "uuid-active-event",
                })

                // Signature must distinguish null from literal string "null"
                const updator = createUpdatorFor(EventLog, {
                    allColumnsExtra: true,
                })
                try {
                    const nonGenCols = updator.metadata.columns.filter(
                        (col) =>
                            !col.isGenerated &&
                            col.propertyName !== "occurredAt",
                    )
                    const nullEntity = { category: "c", code: null }
                    const stringNullEntity = { category: "c", code: "null" }
                    expect(
                        updator.updator.computeMatchingSignature(
                            nullEntity,
                            nonGenCols,
                            false,
                        ),
                    ).to.not.equal(
                        updator.updator.computeMatchingSignature(
                            stringNullEntity,
                            nonGenCols,
                            false,
                        ),
                    )
                } finally {
                    await updator.queryRunner.release()
                }
            } finally {
                await queryRunner.release()
            }
        })

        it("should correlate timestamp string inputs with Date returning values via PostgresDriver normalization", async () => {
            const { queryRunner } = setupEmulatedReturningQueryRunner(
                [
                    {
                        id: "uuid-ts-inserted",
                        category: "audit",
                        code: null,
                        occurredAt: new Date("2026-11-11T12:30:00.500Z"),
                    },
                ],
                "postgres",
            )
            sinon
                .stub(dataSource.driver, "preparePersistentValue")
                .callsFake(PostgresDriver.prototype.preparePersistentValue)
            sinon
                .stub(dataSource.driver, "prepareHydratedValue")
                .callsFake(PostgresDriver.prototype.prepareHydratedValue)
            try {
                const skippedTs = new EventLog()
                skippedTs.category = "audit"
                skippedTs.code = null
                skippedTs.occurredAt = "2026-11-11T10:00:00Z"

                const insertedTs = new EventLog()
                insertedTs.category = "audit"
                insertedTs.code = null
                insertedTs.occurredAt = "2026-11-11T12:30:00.500Z"

                const result = await dataSource
                    .createQueryBuilder(queryRunner)
                    .insert()
                    .into(EventLog)
                    .values([skippedTs, insertedTs])
                    .orIgnore()
                    .execute()

                expect(skippedTs.id).to.be.undefined
                expect(result.identifiers[0]).to.be.undefined
                expect(insertedTs.id).to.equal("uuid-ts-inserted")
                expect(result.identifiers[1]).to.deep.equal({
                    id: "uuid-ts-inserted",
                })
            } finally {
                await queryRunner.release()
            }
        })
    })
})
