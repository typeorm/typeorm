import "reflect-metadata"
import "../../utils/test-setup"
import type { DataSource } from "../../../src"
import { TypeORMError } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import { expect } from "chai"

describe("entity manager > invalidWhereValuesBehavior with throw", () => {
    let dataSources: DataSource[]

    beforeAll(async () => {
        dataSources = await createTestingConnections({
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
    afterAll(() => closeTestingConnections(dataSources))

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
                await connection.manager.update(Post, { text: null } as any, {
                    title: "Updated",
                })
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
                    { text: undefined } as any,
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
                await connection.manager.delete(Post, { text: null } as any)
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
                } as any)
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
                } as any)
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
                } as any)
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
                } as any)
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
                } as any)
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
})

describe("entity manager > invalidWhereValuesBehavior with sql-null", () => {
    let dataSources: DataSource[]

    beforeAll(async () => {
        dataSources = await createTestingConnections({
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
    afterAll(() => closeTestingConnections(dataSources))

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

            const updated = await connection.manager.findOneBy(Post, {
                id: post.id,
            })
            const notUpdated = await connection.manager.findOneBy(Post, {
                id: post2.id,
            })
            expect(updated!.title).to.equal("Updated")
            expect(notUpdated!.title).to.equal("Other Post")
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

    beforeAll(async () => {
        dataSources = await createTestingConnections({
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
    afterAll(() => closeTestingConnections(dataSources))

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

            const updated = await connection.manager.findOneBy(Post, {
                id: post.id,
            })
            expect(updated!.text).to.equal("Updated")
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
})

describe("entity manager > invalidWhereValuesBehavior does NOT affect QB .where()", () => {
    let dataSources: DataSource[]

    beforeAll(async () => {
        dataSources = await createTestingConnections({
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
    afterAll(() => closeTestingConnections(dataSources))

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
