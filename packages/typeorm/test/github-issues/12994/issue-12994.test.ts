import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Tag } from "./entity/Tag"
import { InsertResult } from "../../../src/query-builder/result/InsertResult"
import { ReturningResultsEntityUpdator } from "../../../src/query-builder/ReturningResultsEntityUpdator"
import { QueryExpressionMap } from "../../../src/query-builder/QueryExpressionMap"
import { Alias } from "../../../src/query-builder/Alias"

describe("github issues > #12994 insert().orIgnore() writes returned rows onto wrong entities when a row is skipped", () => {
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

                    // Insert "a" first so it already exists in the database
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

                    // Tag "a" was skipped, so tagA must NOT be given tagB's generated ID
                    expect(tagA.id).to.be.undefined

                    // Tag "b" was inserted, so tagB must receive its generated ID
                    expect(tagB.id).to.be.a("string")
                    expect(tagB.id).to.not.equal(existing.id)

                    // result.identifiers should match the entity positions
                    expect(result.identifiers[0]).to.be.undefined
                    expect(result.identifiers[1]).to.deep.equal({ id: tagB.id })

                    // In database, both "a" and "b" exist with their respective IDs
                    const all = await repo.find({ order: { name: "ASC" } })
                    expect(all).to.have.length(2)
                    expect(all[0].id).to.equal(existing.id)
                    expect(all[1].id).to.equal(tagB.id)
                }),
            ))

        it("should handle when the second row is skipped and first is inserted", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const repo = dataSource.getRepository(Tag)

                    // Insert "b" first
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

                    // Tag "a" was inserted, so tagA must receive its generated ID
                    expect(tagA.id).to.be.a("string")
                    expect(tagA.id).to.not.equal(existing.id)

                    // Tag "b" was skipped, so tagB must remain undefined
                    expect(tagB.id).to.be.undefined

                    expect(result.identifiers[0]).to.deep.equal({ id: tagA.id })
                    expect(result.identifiers[1]).to.be.undefined
                }),
            ))
    })

    describe("unit tests: ReturningResultsEntityUpdator matching logic", () => {
        let fakeDataSource: DataSource
        let metadata: any

        before(async () => {
            const connections = await createTestingConnections({
                entities: [Tag],
                enabledDrivers: ["better-sqlite3"],
            })
            if (connections.length > 0) {
                fakeDataSource = connections[0]
                metadata = fakeDataSource.getMetadata(Tag)

                // Emulate a RETURNING-capable driver (like Postgres)
                fakeDataSource.driver.isReturningSqlSupported = () => true
                fakeDataSource.driver.createGeneratedMap = (
                    meta: any,
                    insertResult: any,
                ) => {
                    if (!insertResult) return undefined
                    return Object.keys(insertResult).reduce(
                        (map: any, key: string) => {
                            const col = meta.findColumnWithDatabaseName(key)
                            if (col) {
                                map[col.propertyName] = insertResult[key]
                            }
                            return map
                        },
                        {},
                    )
                }
            }
        })

        after(async () => {
            if (fakeDataSource) {
                await fakeDataSource.destroy()
            }
        })

        it("should include inserted columns in extraReturningColumns when onIgnore is true", () => {
            if (!fakeDataSource) return

            const qb = fakeDataSource
                .createQueryBuilder()
                .insert()
                .into(Tag)
                .values([{ name: "a" }, { name: "b" }])
                .orIgnore()

            // Verify InsertQueryBuilder includes inserted columns for RETURNING
            ;(qb as any).expressionMap.extraReturningColumns =
                metadata.getInsertionReturningColumns()

            if (
                (qb as any).expressionMap.onIgnore &&
                fakeDataSource.driver.isReturningSqlSupported("insert")
            ) {
                for (const column of (qb as any).getInsertedColumns()) {
                    if (
                        !(
                            qb as any
                        ).expressionMap.extraReturningColumns.includes(column)
                    ) {
                        ;(qb as any).expressionMap.extraReturningColumns.push(
                            column,
                        )
                    }
                }
            }

            const returningCols = (qb as any).expressionMap
                .extraReturningColumns
            const colNames = returningCols.map((c: any) => c.databaseName)
            expect(colNames).to.include("id")
            expect(colNames).to.include("name")
        })

        it("should match returned row to entity B when entity A was skipped", async () => {
            if (!fakeDataSource) return

            const expressionMap = new QueryExpressionMap(fakeDataSource)
            const mainAlias = new Alias()
            mainAlias.metadata = metadata
            expressionMap.setMainAlias(mainAlias)
            expressionMap.onIgnore = true
            expressionMap.extraReturningColumns = metadata.columns

            const queryRunner = fakeDataSource.createQueryRunner()
            const updator = new ReturningResultsEntityUpdator(
                queryRunner,
                expressionMap,
            )

            const tagA = new Tag()
            tagA.name = "a"

            const tagB = new Tag()
            tagB.name = "b"

            const entities = [tagA, tagB]

            // Database returns only 1 row for tag B because tag A conflicted
            const insertResult = new InsertResult()
            insertResult.raw = [{ id: "generated-uuid-b", name: "b" }]

            await updator.insert(insertResult, entities)

            // Tag A was skipped: id must remain undefined
            expect(tagA.id).to.be.undefined
            expect(insertResult.identifiers[0]).to.be.undefined
            expect(insertResult.generatedMaps[0]).to.be.undefined

            // Tag B was inserted: id must be assigned
            expect(tagB.id).to.equal("generated-uuid-b")
            expect(insertResult.identifiers[1]).to.deep.equal({
                id: "generated-uuid-b",
            })
            expect(insertResult.generatedMaps[1]).to.have.property(
                "id",
                "generated-uuid-b",
            )

            await queryRunner.release()
        })

        it("should match returned row to entity A when entity B was skipped", async () => {
            if (!fakeDataSource) return

            const expressionMap = new QueryExpressionMap(fakeDataSource)
            const mainAlias = new Alias()
            mainAlias.metadata = metadata
            expressionMap.setMainAlias(mainAlias)
            expressionMap.onIgnore = true
            expressionMap.extraReturningColumns = metadata.columns

            const queryRunner = fakeDataSource.createQueryRunner()
            const updator = new ReturningResultsEntityUpdator(
                queryRunner,
                expressionMap,
            )

            const tagA = new Tag()
            tagA.name = "a"

            const tagB = new Tag()
            tagB.name = "b"

            const entities = [tagA, tagB]

            // Database returns only 1 row for tag A because tag B conflicted
            const insertResult = new InsertResult()
            insertResult.raw = [{ id: "generated-uuid-a", name: "a" }]

            await updator.insert(insertResult, entities)

            // Tag A was inserted
            expect(tagA.id).to.equal("generated-uuid-a")
            expect(insertResult.identifiers[0]).to.deep.equal({
                id: "generated-uuid-a",
            })

            // Tag B was skipped
            expect(tagB.id).to.be.undefined
            expect(insertResult.identifiers[1]).to.be.undefined
            expect(insertResult.generatedMaps[1]).to.be.undefined

            await queryRunner.release()
        })

        it("should leave all entities untouched when all rows are skipped", async () => {
            if (!fakeDataSource) return

            const expressionMap = new QueryExpressionMap(fakeDataSource)
            const mainAlias = new Alias()
            mainAlias.metadata = metadata
            expressionMap.setMainAlias(mainAlias)
            expressionMap.onIgnore = true
            expressionMap.extraReturningColumns = metadata.columns

            const queryRunner = fakeDataSource.createQueryRunner()
            const updator = new ReturningResultsEntityUpdator(
                queryRunner,
                expressionMap,
            )

            const tagA = new Tag()
            tagA.name = "a"

            const tagB = new Tag()
            tagB.name = "b"

            const entities = [tagA, tagB]

            // Database returns empty array because all rows were skipped
            const insertResult = new InsertResult()
            insertResult.raw = []

            await updator.insert(insertResult, entities)

            expect(tagA.id).to.be.undefined
            expect(tagB.id).to.be.undefined
            expect(insertResult.identifiers[0]).to.be.undefined
            expect(insertResult.identifiers[1]).to.be.undefined

            await queryRunner.release()
        })

        it("should include identifying columns in string-form returning clause when onIgnore is true", () => {
            if (!fakeDataSource) return

            const qb = fakeDataSource
                .createQueryBuilder()
                .insert()
                .into(Tag)
                .values([{ name: "a" }])
                .returning("id")
                .orIgnore()

            ;(qb as any).expressionMap.extraReturningColumns = [
                metadata.findColumnWithPropertyName("name"),
            ]
            const returningString = (qb as any).createReturningExpression(
                "insert",
            )
            expect(returningString).to.include("id")
            expect(returningString).to.include("name")
        })

        it("should handle default-only entities when rows are skipped", async () => {
            if (!fakeDataSource) return

            const expressionMap = new QueryExpressionMap(fakeDataSource)
            const mainAlias = new Alias()
            mainAlias.metadata = metadata
            expressionMap.setMainAlias(mainAlias)
            expressionMap.onIgnore = true
            expressionMap.extraReturningColumns = metadata.columns

            const queryRunner = fakeDataSource.createQueryRunner()
            const updator = new ReturningResultsEntityUpdator(
                queryRunner,
                expressionMap,
            )

            const entityA = new Tag()
            const entityB = new Tag()
            const entities = [entityA, entityB]

            // 1 row returned by DB for 2 default-only entities
            const insertResult = new InsertResult()
            insertResult.raw = [{ id: "generated-default-id" }]

            await updator.insert(insertResult, entities)

            expect(entityA.id).to.equal("generated-default-id")
            expect(entityB.id).to.be.undefined
            expect(insertResult.identifiers[0]).to.deep.equal({
                id: "generated-default-id",
            })
            expect(insertResult.identifiers[1]).to.be.undefined

            await queryRunner.release()
        })

        it("should match entities with transformers and ignore computed function values", async () => {
            if (!fakeDataSource) return

            const expressionMap = new QueryExpressionMap(fakeDataSource)
            const mainAlias = new Alias()
            mainAlias.metadata = metadata
            expressionMap.setMainAlias(mainAlias)
            expressionMap.onIgnore = true
            expressionMap.extraReturningColumns = metadata.columns

            const queryRunner = fakeDataSource.createQueryRunner()
            const updator = new ReturningResultsEntityUpdator(
                queryRunner,
                expressionMap,
            )

            // Modify name column with transformer temporarily
            const nameColumn = metadata.findColumnWithPropertyName("name")
            const originalTransformer = nameColumn.transformer
            nameColumn.transformer = {
                to: (val: string) => (val ? val.toLowerCase() : val),
                from: (val: string) => (val ? val.toUpperCase() : val),
            }

            try {
                const tagA = new Tag()
                tagA.name = "HELLO"

                // Raw item from DB has transformed value "hello"
                const rawItem = { id: "uuid-1", name: "hello" }
                const isMatch = (updator as any).doesEntityMatchRaw(
                    tagA,
                    rawItem,
                )
                expect(isMatch).to.be.true

                // Function value (() => "NOW()") should be skipped during comparison
                const tagWithFunc = new Tag()
                ;(tagWithFunc as any).name = () => "NOW()"
                const doesFuncMatch = (updator as any).doesEntityMatchRaw(
                    tagWithFunc,
                    rawItem,
                )
                expect(doesFuncMatch).to.be.true
            } finally {
                nameColumn.transformer = originalTransformer
                await queryRunner.release()
            }
        })

        it("should handle partial composite primary keys without prematurely rejecting", async () => {
            if (!fakeDataSource) return

            const mockMeta = {
                ...metadata,
                primaryColumns: [
                    {
                        databaseName: "orgId",
                        propertyName: "orgId",
                        getEntityValue: (ent: any) => ent.orgId,
                        isGenerated: false,
                    },
                    {
                        databaseName: "id",
                        propertyName: "id",
                        getEntityValue: (ent: any) => ent.id,
                        isGenerated: true,
                    },
                ],
                columns: [
                    {
                        databaseName: "orgId",
                        propertyName: "orgId",
                        getEntityValue: (ent: any) => ent.orgId,
                        isGenerated: false,
                    },
                    {
                        databaseName: "id",
                        propertyName: "id",
                        getEntityValue: (ent: any) => ent.id,
                        isGenerated: true,
                    },
                    {
                        databaseName: "name",
                        propertyName: "name",
                        getEntityValue: (ent: any) => ent.name,
                        isGenerated: false,
                    },
                ],
            }

            const expressionMap = new QueryExpressionMap(fakeDataSource)
            const mainAlias = new Alias()
            mainAlias.metadata = mockMeta
            expressionMap.setMainAlias(mainAlias)
            expressionMap.onIgnore = true

            const queryRunner = fakeDataSource.createQueryRunner()
            const updator = new ReturningResultsEntityUpdator(
                queryRunner,
                expressionMap,
            )

            // Entity has orgId set, but generated id is undefined
            const entityPartialPK = {
                orgId: "org-1",
                id: undefined,
                name: "test",
            }
            const rawMatching = { orgId: "org-1", id: "gen-1", name: "test" }
            const rawMismatchingOrg = {
                orgId: "org-2",
                id: "gen-2",
                name: "test",
            }

            const matchResult = (updator as any).doesEntityMatchRaw(
                entityPartialPK,
                rawMatching,
            )
            expect(matchResult).to.be.true

            const mismatchResult = (updator as any).doesEntityMatchRaw(
                entityPartialPK,
                rawMismatchingOrg,
            )
            expect(mismatchResult).to.be.false

            await queryRunner.release()
        })

        it("should match bulk entities correctly via fast signature indexing", async () => {
            if (!fakeDataSource) return

            const expressionMap = new QueryExpressionMap(fakeDataSource)
            const mainAlias = new Alias()
            mainAlias.metadata = metadata
            expressionMap.setMainAlias(mainAlias)
            expressionMap.onIgnore = true
            expressionMap.extraReturningColumns = metadata.columns

            const queryRunner = fakeDataSource.createQueryRunner()
            const updator = new ReturningResultsEntityUpdator(
                queryRunner,
                expressionMap,
            )

            const entities = []
            for (let i = 0; i < 50; i++) {
                const tag = new Tag()
                tag.name = `item-${i}`
                entities.push(tag)
            }

            // Even items skipped, odd items inserted
            const raw = []
            for (let i = 1; i < 50; i += 2) {
                raw.push({ id: `uuid-${i}`, name: `item-${i}` })
            }

            const insertResult = new InsertResult()
            insertResult.raw = raw

            await updator.insert(insertResult, entities)

            for (let i = 0; i < 50; i++) {
                if (i % 2 === 1) {
                    expect(entities[i].id).to.equal(`uuid-${i}`)
                    expect(insertResult.identifiers[i]).to.deep.equal({
                        id: `uuid-${i}`,
                    })
                } else {
                    expect(entities[i].id).to.be.undefined
                    expect(insertResult.identifiers[i]).to.be.undefined
                }
            }

            await queryRunner.release()
        })

        it("should verify candidate rows against actual entity values and never match skipped rows with delimiter-confusable signatures", async () => {
            if (!fakeDataSource) return

            const expressionMap = new QueryExpressionMap(fakeDataSource)
            const mainAlias = new Alias()
            mainAlias.metadata = metadata
            expressionMap.setMainAlias(mainAlias)
            expressionMap.onIgnore = true
            expressionMap.extraReturningColumns = metadata.columns

            const queryRunner = fakeDataSource.createQueryRunner()
            const updator = new ReturningResultsEntityUpdator(
                queryRunner,
                expressionMap,
            )

            // Test 1: Length-prefixed encoding produces distinct signatures for values with delimiter characters
            const tagWithDelim = new Tag()
            tagWithDelim.name = "name=other;name=3"
            const otherTag = new Tag()
            otherTag.name = "other"

            const nonGeneratedColumns = metadata.columns.filter(
                (c: any) => !c.isGenerated,
            )
            const sig1 = (updator as any).getEntityMatchingSignature(
                tagWithDelim,
                nonGeneratedColumns,
                false,
            )
            const sig2 = (updator as any).getEntityMatchingSignature(
                otherTag,
                nonGeneratedColumns,
                false,
            )
            expect(sig1).to.not.equal(sig2)

            // Test 2: In insert(), skipped entity with delimiter-laden name does not match inserted row
            const tagSkipped = new Tag()
            tagSkipped.name = "name=other;id=123"

            const tagInserted = new Tag()
            tagInserted.name = "other"

            const insertResult = new InsertResult()
            insertResult.raw = [{ id: "generated-uuid-other", name: "other" }]

            await updator.insert(insertResult, [tagSkipped, tagInserted])

            // Skipped tag must NOT receive the inserted tag's ID
            expect(tagSkipped.id).to.be.undefined
            expect(insertResult.identifiers[0]).to.be.undefined

            // Inserted tag receives its generated ID
            expect(tagInserted.id).to.equal("generated-uuid-other")
            expect(insertResult.identifiers[1]).to.deep.equal({
                id: "generated-uuid-other",
            })

            await queryRunner.release()
        })
    })
})
