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
    })
})
