import { expect } from "chai"
import type { DataSource } from "../../../src"
import { EntitySchema } from "../../../src/entity-schema/EntitySchema"
import type { EntitySchemaColumnOptions } from "../../../src/entity-schema/EntitySchemaColumnOptions"
import { TypeORMError } from "../../../src/error/TypeORMError"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Category } from "./entity/Category"
import { Post } from "./entity/Post"

const specialColumnColumns: Record<string, EntitySchemaColumnOptions> =
    Object.create(null)
specialColumnColumns["id"] = {
    type: Number,
    primary: true,
}
specialColumnColumns["constructor"] = {
    type: String,
}
specialColumnColumns["prototype"] = {
    type: String,
}
specialColumnColumns["value"] = {
    type: String,
}

const SpecialColumnSchema = new EntitySchema({
    name: "SpecialColumn",
    columns: specialColumnColumns,
})

describe("entity manager > invalidWhereValuesBehavior with default behavior", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [Post, Category, SpecialColumnSchema],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    async function prepareData(connection: DataSource) {
        const category = new Category()
        category.name = "Test Category"
        await connection.manager.save(category)

        const post = new Post()
        post.title = "Test Post"
        post.text = "Some text"
        post.category = category
        await connection.manager.save(post)

        return { category, post }
    }

    function createDangerousOnlyCriteria(): Record<string, unknown> {
        return JSON.parse(`{
            "__proto__": { "polluted": true }
        }`)
    }

    function createMixedDangerousCriteria(
        post: Post,
    ): Record<string, unknown>[] {
        return [{ id: post.id }, createDangerousOnlyCriteria()]
    }

    async function expectEmptyCriteriaError(
        methodName: string,
        run: () => Promise<unknown>,
    ) {
        try {
            await run()
            expect.fail("Expected error")
        } catch (error) {
            expect(error).to.be.instanceOf(TypeORMError)
            expect(error.message).to.include(
                `Empty criteria(s) are not allowed for the ${methodName} method.`,
            )
        }
    }

    it("should throw error for null values in EntityManager.update() by default", async () => {
        for (const connection of dataSources) {
            await prepareData(connection)

            // Regression test for #12578: omitted options should still
            // use the documented default invalidWhereValuesBehavior.
            try {
                await connection.manager.update(
                    Post,
                    { text: null },
                    {
                        title: "Updated",
                    },
                )
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Null value encountered")
            }
        }
    })

    it("should throw error for undefined values in EntityManager.delete() by default", async () => {
        for (const connection of dataSources) {
            await prepareData(connection)

            try {
                await connection.manager.delete(Post, {
                    text: undefined,
                })
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Undefined value encountered")
            }
        }
    })

    it("should reject criteria that normalize to empty by default", async () => {
        for (const connection of dataSources) {
            const { post } = await prepareData(connection)

            await expectEmptyCriteriaError("update", () =>
                connection.manager.update(Post, createDangerousOnlyCriteria(), {
                    title: "Updated",
                }),
            )
            await expectEmptyCriteriaError("delete", () =>
                connection.manager.delete(Post, createDangerousOnlyCriteria()),
            )
            await expectEmptyCriteriaError("softDelete", () =>
                connection.manager.softDelete(
                    Post,
                    createDangerousOnlyCriteria(),
                ),
            )
            await expectEmptyCriteriaError("restore", () =>
                connection.manager.restore(Post, createDangerousOnlyCriteria()),
            )

            const reloaded = await connection.manager.findOneByOrFail(Post, {
                id: post.id,
            })
            expect(reloaded.title).to.equal("Test Post")
        }
    })

    it("should reject OR criteria with an empty normalized branch by default", async () => {
        for (const connection of dataSources) {
            const { post } = await prepareData(connection)

            await expectEmptyCriteriaError("update", () =>
                connection.manager.update(
                    Post,
                    createMixedDangerousCriteria(post),
                    {
                        title: "Updated",
                    },
                ),
            )
            await expectEmptyCriteriaError("delete", () =>
                connection.manager.delete(
                    Post,
                    createMixedDangerousCriteria(post),
                ),
            )
            await expectEmptyCriteriaError("softDelete", () =>
                connection.manager.softDelete(
                    Post,
                    createMixedDangerousCriteria(post),
                ),
            )
            await expectEmptyCriteriaError("restore", () =>
                connection.manager.restore(
                    Post,
                    createMixedDangerousCriteria(post),
                ),
            )

            const reloaded = await connection.manager.findOneByOrFail(Post, {
                id: post.id,
            })
            expect(reloaded.title).to.equal("Test Post")
        }
    })

    it("should preserve constructor and prototype as valid criteria property names", async () => {
        for (const connection of dataSources) {
            const repository = connection.getRepository("SpecialColumn")

            await repository.insert({
                id: 1,
                constructor: "ctor-match",
                prototype: "proto-one",
                value: "first",
            })
            await repository.insert({
                id: 2,
                constructor: "ctor-other",
                prototype: "proto-two",
                value: "second",
            })

            await connection.manager.update(
                "SpecialColumn",
                { constructor: "ctor-match" },
                { value: "updated-by-constructor" },
            )
            await connection.manager.update(
                "SpecialColumn",
                { prototype: "proto-one" },
                { value: "updated-by-prototype" },
            )

            const updated = await repository.findOneByOrFail({ id: 1 })
            expect(updated.value).to.equal("updated-by-prototype")

            await connection.manager.delete("SpecialColumn", {
                constructor: "ctor-other",
            })

            const remaining = await repository.find()
            expect(remaining.map((row) => row.value)).to.deep.equal([
                "updated-by-prototype",
            ])
        }
    })
})

describe("entity manager > invalidWhereValuesBehavior with throw", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [Post, Category],
            schemaCreate: true,
            dropSchema: true,
            driverSpecific: {
                invalidWhereValuesBehavior: {
                    null: "throw",
                    undefined: "throw",
                },
            },
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    async function prepareData(connection: DataSource) {
        const category = new Category()
        category.name = "Test Category"
        await connection.manager.save(category)

        const post = new Post()
        post.title = "Test Post"
        post.text = "Some text"
        post.category = category
        await connection.manager.save(post)

        return { category, post }
    }

    it("should throw error for null values in EntityManager.update()", async () => {
        for (const connection of dataSources) {
            await prepareData(connection)

            try {
                await connection.manager.update(
                    Post,
                    {
                        text: null,
                    },
                    {
                        title: "Updated",
                    },
                )
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Null value encountered")
            }
        }
    })

    it("should throw error for undefined values in EntityManager.update()", async () => {
        for (const connection of dataSources) {
            await prepareData(connection)

            try {
                await connection.manager.update(
                    Post,
                    { text: undefined },
                    { title: "Updated" },
                )
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Undefined value encountered")
            }
        }
    })

    it("should throw error for null values in EntityManager.delete()", async () => {
        for (const connection of dataSources) {
            await prepareData(connection)

            try {
                await connection.manager.delete(Post, {
                    text: null,
                })
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Null value encountered")
            }
        }
    })

    it("should throw error for undefined values in EntityManager.delete()", async () => {
        for (const connection of dataSources) {
            await prepareData(connection)

            try {
                await connection.manager.delete(Post, {
                    text: undefined,
                })
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Undefined value encountered")
            }
        }
    })

    it("should throw error for null values in EntityManager.softDelete()", async () => {
        for (const connection of dataSources) {
            await prepareData(connection)

            try {
                await connection.manager.softDelete(Post, {
                    text: null,
                })
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Null value encountered")
            }
        }
    })

    it("should throw error for undefined values in EntityManager.softDelete()", async () => {
        for (const connection of dataSources) {
            await prepareData(connection)

            try {
                await connection.manager.softDelete(Post, {
                    text: undefined,
                })
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Undefined value encountered")
            }
        }
    })

    it("should throw error for null values in EntityManager.restore()", async () => {
        for (const connection of dataSources) {
            await prepareData(connection)

            try {
                await connection.manager.restore(Post, {
                    text: null,
                })
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Null value encountered")
            }
        }
    })

    it("should throw error for undefined values in EntityManager.restore()", async () => {
        for (const connection of dataSources) {
            await prepareData(connection)

            try {
                await connection.manager.restore(Post, {
                    text: undefined,
                })
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Undefined value encountered")
            }
        }
    })

    it("should throw error for null values in Repository.update()", async () => {
        for (const connection of dataSources) {
            await prepareData(connection)

            try {
                await connection.getRepository(Post).update(
                    // @ts-expect-error - null should be marked as unsafe by default
                    {
                        text: null,
                    },
                    { title: "Updated" },
                )
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Null value encountered")
            }
        }
    })

    it("should throw error for null values in Repository.delete()", async () => {
        for (const connection of dataSources) {
            await prepareData(connection)

            try {
                await connection.getRepository(Post).delete(
                    // @ts-expect-error - null should be marked as unsafe by default
                    {
                        text: null,
                    },
                )
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Null value encountered")
            }
        }
    })

    it("should throw error for nested null values in EntityManager.update()", async () => {
        for (const connection of dataSources) {
            await prepareData(connection)

            try {
                await connection.manager.update(
                    Post,
                    {
                        category: {
                            name: null,
                        },
                    },
                    { title: "Updated" },
                )
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Null value encountered")
            }
        }
    })

    it("should throw error for nested undefined values in EntityManager.delete()", async () => {
        for (const connection of dataSources) {
            await prepareData(connection)

            try {
                await connection.manager.delete(Post, {
                    category: { name: undefined },
                })
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Undefined value encountered")
            }
        }
    })
})

describe("entity manager > invalidWhereValuesBehavior with sql-null", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [Post, Category],
            schemaCreate: true,
            dropSchema: true,
            driverSpecific: {
                invalidWhereValuesBehavior: {
                    null: "sql-null",
                },
            },
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should transform null to IS NULL in EntityManager.update()", async () => {
        for (const connection of dataSources) {
            const post = new Post()
            post.title = "Test Post"
            post.text = null
            await connection.manager.save(post)

            const post2 = new Post()
            post2.title = "Other Post"
            post2.text = "has text"
            await connection.manager.save(post2)

            // With sql-null, { text: null } should match rows where text IS NULL
            await connection.manager.update(
                Post,
                {
                    text: null,
                },
                {
                    title: "Updated",
                },
            )

            const updated = await connection.manager.findOneByOrFail(Post, {
                id: post.id,
            })
            const notUpdated = await connection.manager.findOneByOrFail(Post, {
                id: post2.id,
            })
            expect(updated.title).to.equal("Updated")
            expect(notUpdated.title).to.equal("Other Post")
        }
    })

    it("should transform null to IS NULL in EntityManager.delete()", async () => {
        for (const connection of dataSources) {
            const post = new Post()
            post.title = "Test Post"
            post.text = null
            await connection.manager.save(post)

            const post2 = new Post()
            post2.title = "Other Post"
            post2.text = "has text"
            await connection.manager.save(post2)

            // With sql-null, { text: null } should delete rows where text IS NULL
            await connection.manager.delete(Post, {
                text: null,
            })

            const remaining = await connection.manager.find(Post)
            expect(remaining.length).to.equal(1)
            expect(remaining[0].title).to.equal("Other Post")
        }
    })
})

describe("entity manager > invalidWhereValuesBehavior with ignore", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [Post, Category],
            schemaCreate: true,
            dropSchema: true,
            driverSpecific: {
                invalidWhereValuesBehavior: {
                    null: "ignore",
                    undefined: "ignore",
                },
            },
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should strip null criteria in EntityManager.delete() with ignore", async () => {
        for (const connection of dataSources) {
            const post = new Post()
            post.title = "Test Post"
            post.text = "text"
            await connection.manager.save(post)

            // With ignore, { title: "Test Post", text: null } should strip text
            // and delete by title only
            await connection.manager.delete(Post, {
                title: "Test Post",
                text: null,
            })

            const remaining = await connection.manager.find(Post)
            expect(remaining.length).to.equal(0)
        }
    })

    it("should strip undefined criteria in EntityManager.delete() with ignore", async () => {
        for (const connection of dataSources) {
            const post = new Post()
            post.title = "Test Post"
            post.text = "text"
            await connection.manager.save(post)

            // With ignore, { title: "Test Post", text: undefined } should strip text
            // and delete by title only
            await connection.manager.delete(Post, {
                title: "Test Post",
                text: undefined,
            })

            const remaining = await connection.manager.find(Post)
            expect(remaining.length).to.equal(0)
        }
    })

    it("should strip nested null criteria in EntityManager.update() with ignore", async () => {
        for (const connection of dataSources) {
            const category = new Category()
            category.name = "Test Category"
            await connection.manager.save(category)

            const post = new Post()
            post.title = "Test Post"
            post.text = "text"
            post.category = category
            await connection.manager.save(post)

            // With ignore, nested null should be stripped, leaving only title
            await connection.manager.update(
                Post,
                {
                    title: "Test Post",
                    category: {
                        name: null,
                    },
                },
                { text: "Updated" },
            )

            const updated = await connection.manager.findOneByOrFail(Post, {
                id: post.id,
            })
            expect(updated.text).to.equal("Updated")
        }
    })

    it("should strip nested undefined criteria in EntityManager.delete() with ignore", async () => {
        for (const connection of dataSources) {
            const category = new Category()
            category.name = "Test Category"
            await connection.manager.save(category)

            const post = new Post()
            post.title = "Test Post"
            post.text = "text"
            post.category = category
            await connection.manager.save(post)

            // With ignore, nested undefined should be stripped, leaving only title
            await connection.manager.delete(Post, {
                title: "Test Post",
                category: { name: undefined },
            })

            const remaining = await connection.manager.find(Post)
            expect(remaining.length).to.equal(0)
        }
    })
})

describe("entity manager > invalidWhereValuesBehavior does NOT affect QB .where()", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [Post, Category],
            schemaCreate: true,
            dropSchema: true,
            driverSpecific: {
                invalidWhereValuesBehavior: {
                    null: "throw",
                    undefined: "throw",
                },
            },
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should NOT throw when QB .where() is used with null", async () => {
        for (const connection of dataSources) {
            const category = new Category()
            category.name = "Test"
            await connection.manager.save(category)

            const post = new Post()
            post.title = "Test"
            post.text = "text"
            post.category = category
            await connection.manager.save(post)

            // QB .where() should pass null through without throwing
            const posts = await connection
                .createQueryBuilder(Post, "post")
                .where({ title: "Test" })
                .getMany()

            expect(posts.length).to.equal(1)
        }
    })

    it("should NOT throw when QB .where() is used with undefined", async () => {
        for (const connection of dataSources) {
            const category = new Category()
            category.name = "Test"
            await connection.manager.save(category)

            const post = new Post()
            post.title = "Test"
            post.text = "text"
            post.category = category
            await connection.manager.save(post)

            // QB .where() with undefined should NOT throw even when invalidWhereValuesBehavior is set to "throw".
            // It passes undefined through as-is (pre-feature behavior), which means
            // it creates WHERE text = NULL (always false). This is expected — QB is low-level.
            const posts = await connection
                .createQueryBuilder(Post, "post")
                .where({
                    title: "Test",
                    text: undefined,
                })
                .getMany()

            expect(posts.length).to.equal(0)
        }
    })
})
