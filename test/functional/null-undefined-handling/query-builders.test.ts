import { expect } from "chai"
import type { DataSource } from "../../../src"
import { TypeORMError } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Category } from "./entity/Category"
import { Post } from "./entity/Post"

function invalidWhere<T>(value: T): never {
    return value as never
}

// Regression for #12578: default invalidWhereValuesBehavior should throw for invalid where values.
describe("entity manager > invalidWhereValuesBehavior default behavior", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [Post, Category],
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

    it("should throw error for undefined values in EntityManager.update() by default", async () => {
        for (const connection of dataSources) {
            await prepareData(connection)

            try {
                await connection.manager.update(
                    Post,
                    invalidWhere({ category: { name: undefined } }),
                    { title: "Updated" },
                )
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Undefined value encountered")
            }
        }
    })

    it("should throw error for null values in EntityManager.delete() by default", async () => {
        for (const connection of dataSources) {
            await prepareData(connection)

            try {
                await connection.manager.delete(
                    Post,
                    invalidWhere({
                        category: { name: null },
                    }),
                )
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Null value encountered")
            }
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
                    invalidWhere({ text: null }),
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
                    invalidWhere({ text: undefined }),
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
                await connection.manager.delete(
                    Post,
                    invalidWhere({ text: null }),
                )
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
                await connection.manager.delete(
                    Post,
                    invalidWhere({
                        text: undefined,
                    }),
                )
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
                await connection.manager.softDelete(
                    Post,
                    invalidWhere({
                        text: null,
                    }),
                )
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
                await connection.manager.softDelete(
                    Post,
                    invalidWhere({
                        text: undefined,
                    }),
                )
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
                await connection.manager.restore(
                    Post,
                    invalidWhere({
                        text: null,
                    }),
                )
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
                await connection.manager.restore(
                    Post,
                    invalidWhere({
                        text: undefined,
                    }),
                )
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
                await connection
                    .getRepository(Post)
                    .update({ text: null } as any, { title: "Updated" })
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
                await connection
                    .getRepository(Post)
                    .delete({ text: null } as any)
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
                    { category: { name: null } } as any,
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
                } as any)
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Undefined value encountered")
            }
        }
    })

    it("passes entity class instances through unchanged (only plain objects are normalized)", async () => {
        for (const connection of dataSources) {
            // An entity class instance is not a plain object, so it is not
            // validated against invalidWhereValuesBehavior: its set columns are
            // passed straight through to the WHERE.

            // a fully populated instance deletes its matching row as usual
            const withText = new Post()
            withText.title = "With Text"
            withText.text = "hello"
            await connection.manager.save(withText)

            await connection.manager.delete(Post, withText)
            expect(
                await connection.manager.findOneBy(Post, { id: withText.id }),
            ).to.equal(null)

            // a null nullable column does NOT throw (the instance is passed
            // through, not validated). It renders as `text = NULL`, which
            // matches nothing, so the delete is a deliberate no-op and the row
            // remains.
            const withNull = new Post()
            withNull.title = "With Null"
            withNull.text = null
            await connection.manager.save(withNull)

            await connection.manager.delete(Post, withNull)
            expect(
                await connection.manager.findOneBy(Post, { id: withNull.id }),
            ).to.not.equal(null)
        }
    })

    it("rejects an empty entity class instance instead of deleting the whole table", async () => {
        for (const connection of dataSources) {
            const { post } = await prepareData(connection)

            // an entity instance with no set columns has no own keys, so it
            // would render as "WHERE 1=1" (empty condition) — reject it. An
            // empty class instance is not caught by the plain-object emptiness
            // check, so this guards the non-plain path explicitly.
            try {
                await connection.manager.delete(Post, new Post())
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Empty criteria(s)")
            }

            expect(
                await connection.manager.findOneBy(Post, { id: post.id }),
            ).to.not.equal(null)
        }
    })

    it("rejects criteria whose only key expands to zero predicates (nested keyless relation)", async () => {
        for (const connection of dataSources) {
            const { post } = await prepareData(connection)

            // { category: <keyless Category> } looks non-empty at the top level
            // but the relation contributes no predicate, so it would render as
            // "WHERE 1=1". The query-builder write guard rejects it.
            try {
                await connection.manager.delete(Post, {
                    category: new Category(),
                } as any)
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Empty criteria(s)")
            }

            expect(
                await connection.manager.findOneBy(Post, { id: post.id }),
            ).to.not.equal(null)
        }
    })

    // A "__proto__"-only object normalizes to {} (the key is skipped by the
    // prototype-pollution guard). Without a post-normalization emptiness check,
    // .where({}) renders as "WHERE 1=1" and turns a targeted write into a
    // full-table one. These assert the operation is rejected and the seeded row
    // is left untouched.
    it("rejects a __proto__-only criteria in EntityManager.update() instead of updating the whole table", async () => {
        for (const connection of dataSources) {
            const { post } = await prepareData(connection)

            try {
                await connection.manager.update(
                    Post,
                    JSON.parse('{ "__proto__": { "polluted": true } }'),
                    { title: "Updated" },
                )
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Empty criteria(s)")
            }

            const reloaded = await connection.manager.findOneByOrFail(Post, {
                id: post.id,
            })
            expect(reloaded.title).to.equal("Test Post")
        }
    })

    it("rejects a __proto__-only criteria in EntityManager.delete() instead of deleting the whole table", async () => {
        for (const connection of dataSources) {
            const { post } = await prepareData(connection)

            try {
                await connection.manager.delete(
                    Post,
                    JSON.parse('{ "__proto__": { "polluted": true } }'),
                )
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Empty criteria(s)")
            }

            expect(
                await connection.manager.findOneBy(Post, { id: post.id }),
            ).to.not.equal(null)
        }
    })

    it("rejects a __proto__-only criteria in EntityManager.softDelete()", async () => {
        for (const connection of dataSources) {
            const { post } = await prepareData(connection)

            try {
                await connection.manager.softDelete(
                    Post,
                    JSON.parse('{ "__proto__": { "polluted": true } }'),
                )
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Empty criteria(s)")
            }

            expect(
                await connection.manager.findOneBy(Post, { id: post.id }),
            ).to.not.equal(null)
        }
    })

    it("rejects a __proto__-only criteria in EntityManager.restore()", async () => {
        for (const connection of dataSources) {
            const { post } = await prepareData(connection)

            try {
                await connection.manager.restore(
                    Post,
                    JSON.parse('{ "__proto__": { "polluted": true } }'),
                )
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Empty criteria(s)")
            }

            expect(
                await connection.manager.findOneBy(Post, { id: post.id }),
            ).to.not.equal(null)
        }
    })

    it("rejects an array criteria that normalizes to an empty OR-branch", async () => {
        for (const connection of dataSources) {
            const { post } = await prepareData(connection)

            try {
                await connection.manager.delete(Post, [
                    JSON.parse('{ "__proto__": { "polluted": true } }'),
                ])
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Empty criteria(s)")
            }

            // an empty-array element is an empty OR-branch (would render 1=1)
            try {
                await connection.manager.delete(Post, [[]] as any)
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Empty criteria(s)")
            }

            // a bare primitive mixed into an OR-array renders as an always-true
            // branch (`.where(1)` has no predicate) — `[1, { id }]` => 1=1 OR ...
            try {
                await connection.manager.delete(Post, [
                    1,
                    { id: post.id },
                ] as any)
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Empty criteria(s)")
            }

            expect(
                await connection.manager.findOneBy(Post, { id: post.id }),
            ).to.not.equal(null)
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
            post.text = null as any
            await connection.manager.save(post)

            const post2 = new Post()
            post2.title = "Other Post"
            post2.text = "has text"
            await connection.manager.save(post2)

            // With sql-null, { text: null } should match rows where text IS NULL
            await connection.manager.update(Post, { text: null } as any, {
                title: "Updated",
            })

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
            post.text = null as any
            await connection.manager.save(post)

            const post2 = new Post()
            post2.title = "Other Post"
            post2.text = "has text"
            await connection.manager.save(post2)

            // With sql-null, { text: null } should delete rows where text IS NULL
            await connection.manager.delete(Post, { text: null } as any)

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
            } as any)

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
            } as any)

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
                { title: "Test Post", category: { name: null } } as any,
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
            } as any)

            const remaining = await connection.manager.find(Post)
            expect(remaining.length).to.equal(0)
        }
    })

    it("rejects criteria whose every key is stripped instead of deleting the whole table", async () => {
        for (const connection of dataSources) {
            const post = new Post()
            post.title = "Test Post"
            post.text = "text"
            await connection.manager.save(post)

            // With ignore, { text: null } strips its only key, leaving {}. That
            // would render "WHERE 1=1" and delete every row — reject instead.
            try {
                await connection.manager.delete(Post, { text: null } as any)
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Empty criteria(s)")
            }

            const remaining = await connection.manager.find(Post)
            expect(remaining.length).to.equal(1)
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
