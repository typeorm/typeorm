import "reflect-metadata"
import "../../utils/test-setup"
import { DataSource, TypeORMError } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"

describe("query builder > invalidWhereValuesBehavior", () => {
    let connections: DataSource[]

    before(async () => {
        connections = await createTestingConnections({
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
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

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

    it("should throw error for null values in UpdateQueryBuilder", async () => {
        for (const connection of connections) {
            await prepareData(connection)

            try {
                await connection
                    .createQueryBuilder()
                    .update(Post)
                    .set({ title: "Updated" })
                    .where({ text: null })
                    .execute()
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Null value encountered")
            }
        }
    })

    it("should throw error for undefined values in UpdateQueryBuilder", async () => {
        for (const connection of connections) {
            await prepareData(connection)

            try {
                await connection
                    .createQueryBuilder()
                    .update(Post)
                    .set({ title: "Updated" })
                    .where({ text: undefined })
                    .execute()
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Undefined value encountered")
            }
        }
    })

    it("should throw error for null values in DeleteQueryBuilder", async () => {
        for (const connection of connections) {
            await prepareData(connection)

            try {
                await connection
                    .createQueryBuilder()
                    .delete()
                    .from(Post)
                    .where({ text: null })
                    .execute()
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Null value encountered")
            }
        }
    })

    it("should throw error for undefined values in DeleteQueryBuilder", async () => {
        for (const connection of connections) {
            await prepareData(connection)

            try {
                await connection
                    .createQueryBuilder()
                    .delete()
                    .from(Post)
                    .where({ text: undefined })
                    .execute()
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Undefined value encountered")
            }
        }
    })

    it("should throw error for null values in SoftDeleteQueryBuilder", async () => {
        for (const connection of connections) {
            await prepareData(connection)

            try {
                await connection
                    .createQueryBuilder()
                    .softDelete()
                    .from(Post)
                    .where({ text: null })
                    .execute()
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Null value encountered")
            }
        }
    })

    it("should throw error for undefined values in SoftDeleteQueryBuilder", async () => {
        for (const connection of connections) {
            await prepareData(connection)

            try {
                await connection
                    .createQueryBuilder()
                    .softDelete()
                    .from(Post)
                    .where({ text: undefined })
                    .execute()
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Undefined value encountered")
            }
        }
    })
})

describe("query builder > invalidWhereValuesBehavior sql-null", () => {
    let connections: DataSource[]

    before(async () => {
        connections = await createTestingConnections({
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
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    async function prepareData(connection: DataSource) {
        const category = new Category()
        category.name = "Test Category"
        await connection.manager.save(category)

        const post1 = new Post()
        post1.title = "Post 1"
        post1.text = "Some text"
        post1.category = category
        await connection.manager.save(post1)

        const post2 = new Post()
        post2.title = "Post 2"
        post2.text = null
        post2.category = category
        await connection.manager.save(post2)

        return { category, post1, post2 }
    }

    it("should handle null as SQL NULL in UpdateQueryBuilder", async () => {
        for (const connection of connections) {
            const { post2 } = await prepareData(connection)

            const result = await connection
                .createQueryBuilder()
                .update(Post)
                .set({ title: "Updated Null Post" })
                .where({ text: null })
                .execute()

            expect(result.affected).to.equal(1)

            const updatedPost = await connection.manager.findOne(Post, {
                where: { id: post2.id },
            })
            expect(updatedPost?.title).to.equal("Updated Null Post")
        }
    })

    it("should handle null as SQL NULL in DeleteQueryBuilder", async () => {
        for (const connection of connections) {
            const { post1 } = await prepareData(connection)

            const result = await connection
                .createQueryBuilder()
                .delete()
                .from(Post)
                .where({ text: null })
                .execute()

            expect(result.affected).to.equal(1)

            const remainingPosts = await connection.manager.find(Post)
            expect(remainingPosts).to.have.lengthOf(1)
            expect(remainingPosts[0].id).to.equal(post1.id)
        }
    })
})

describe("repository methods > invalidWhereValuesBehavior", () => {
    let connections: DataSource[]

    before(async () => {
        connections = await createTestingConnections({
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
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

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

    it("should throw error for null values in Repository.update()", async () => {
        for (const connection of connections) {
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

    it("should throw error for null values in EntityManager.update()", async () => {
        for (const connection of connections) {
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

    it("should throw error for null values in EntityManager.delete()", async () => {
        for (const connection of connections) {
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

    it("should throw error for null values in Repository.delete()", async () => {
        for (const connection of connections) {
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

    it("should throw error for null values in EntityManager.softDelete()", async () => {
        for (const connection of connections) {
            await prepareData(connection)

            try {
                await connection.manager.softDelete(Post, { text: null } as any)
                expect.fail("Expected error")
            } catch (error) {
                expect(error).to.be.instanceOf(TypeORMError)
                expect(error.message).to.include("Null value encountered")
            }
        }
    })
})
