import { expect } from "chai"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Category } from "./entity/Category"
import { Post } from "./entity/Post"

describe("github issues > #12234 INSERT/UPDATE omits shared join column when relation is set to plain id", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Category, Post],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should preserve the shared join column on update when a composite-FK relation is set to a scalar plain id", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                // seed categories in both tenants so the FK target exists
                await manager.save(Category, [
                    Object.assign(new Category(), {
                        tenantId: 1,
                        id: 10,
                        name: "T1-Cat",
                    }),
                    Object.assign(new Category(), {
                        tenantId: 2,
                        id: 20,
                        name: "T2-Cat",
                    }),
                ])

                // insert a post via query builder (bypasses relation logic)
                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values({
                        id: 1,
                        tenantId: 1,
                        title: "Hello",
                        mainCategoryId: 10,
                    })
                    .execute()

                // reload, then update tenantId AND set mainCategory to a
                // *scalar* plain id.  The scalar triggers the relation-based
                // short-circuit in computeDiffColumns; without the fix the
                // user-defined tenantId column would be silently dropped
                // from the UPDATE because column.relationMetadata points to
                // mainCategory which has a value.
                const loaded = await manager.findOneByOrFail(Post, {
                    id: 1,
                    tenantId: 1,
                })

                loaded.tenantId = 2
                loaded.mainCategoryId = 20
                loaded.mainCategory = 20 as any // scalar plain id
                await manager.save(Post, loaded)

                // query with the expected tenantId — if the column was
                // omitted from the UPDATE this will throw "not found"
                const updated = await manager.findOneByOrFail(Post, {
                    id: 1,
                    tenantId: 2,
                })
                expect(updated.tenantId).to.equal(2)
                expect(updated.mainCategoryId).to.equal(20)
            }),
        ))

    it("should not omit shared join column on insert when only one composite-FK relation is set", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                await manager.save(
                    Category,
                    Object.assign(new Category(), {
                        tenantId: 1,
                        id: 10,
                        name: "Cat",
                    }),
                )

                const post = Object.assign(new Post(), {
                    id: 2,
                    tenantId: 1,
                    title: "Insert",
                    mainCategory: { tenantId: 1, id: 10 } as Category,
                })
                await manager.save(Post, post)

                const loaded = await manager.findOneByOrFail(Post, {
                    id: 2,
                    tenantId: 1,
                })
                expect(loaded.tenantId).to.equal(1)
                expect(loaded.mainCategoryId).to.equal(10)
            }),
        ))

    it("should persist shared join column when updating via direct column value", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                await manager.save(Category, [
                    Object.assign(new Category(), {
                        tenantId: 1,
                        id: 10,
                        name: "A",
                    }),
                    Object.assign(new Category(), {
                        tenantId: 1,
                        id: 20,
                        name: "B",
                    }),
                ])

                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values({
                        id: 3,
                        tenantId: 1,
                        title: "Direct",
                        mainCategoryId: 10,
                        subCategoryId: 20,
                    })
                    .execute()

                const loaded = await manager.findOneByOrFail(Post, {
                    id: 3,
                    tenantId: 1,
                })
                loaded.mainCategoryId = 20
                await manager.save(Post, loaded)

                const updated = await manager.findOneByOrFail(Post, {
                    id: 3,
                    tenantId: 1,
                })
                expect(updated.tenantId).to.equal(1)
                expect(updated.mainCategoryId).to.equal(20)
            }),
        ))
})
