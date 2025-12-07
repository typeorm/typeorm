import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
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

describe("transaction > transaction with oracle connection partial isolation support", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["oracle"], // todo: for some reasons mariadb tests are not passing here
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should execute all operations in a single transaction with READ COMMITTED isolation level", () =>
        Promise.all(
            connections.map(async (connection) => {
                let postId: number | undefined = undefined,
                    categoryId: number | undefined = undefined

                await connection.manager.transaction(
                    "READ COMMITTED",
                    async (entityManager) => {
                        const post = new Post()
                        post.title = "Post #1"
                        await entityManager.save(post)

                        const category = new Category()
                        category.name = "Category #1"
                        await entityManager.save(category)

                        postId = post.id
                        categoryId = category.id
                    },
                )

                const post = await connection.manager.findOne(Post, {
                    where: { title: "Post #1" },
                })
                expect(post).not.to.be.null
                post!.should.be.eql({
                    id: postId,
                    title: "Post #1",
                })

                const category = await connection.manager.findOne(Category, {
                    where: { name: "Category #1" },
                })
                expect(category).not.to.be.null
                category!.should.be.eql({
                    id: categoryId,
                    name: "Category #1",
                })
            }),
        ))

    it("should execute all operations in a single transaction with SERIALIZABLE isolation level", () =>
        Promise.all(
            connections.map(async (connection) => {
                let postId: number | undefined = undefined,
                    categoryId: number | undefined = undefined

                // Initial inserts are required to prevent ORA-08177 errors in Oracle 21c when using a serializable connection
                // immediately after DDL statements. This ensures proper synchronization and helps avoid conflicts.
                await connection.manager
                    .getRepository(Post)
                    .save({ title: "Post #0" })
                await connection.manager
                    .getRepository(Category)
                    .save({ name: "Category #0" })

                await connection.manager.transaction(
                    "SERIALIZABLE",
                    async (entityManager) => {
                        const post = new Post()
                        post.title = "Post #1"
                        await entityManager.save(post)

                        const category = new Category()
                        category.name = "Category #1"
                        await entityManager.save(category)

                        postId = post.id
                        categoryId = category.id
                    },
                )

                const post = await connection.manager.findOne(Post, {
                    where: { title: "Post #1" },
                })
                expect(post).not.to.be.null
                post!.should.be.eql({
                    id: postId,
                    title: "Post #1",
                })

                const category = await connection.manager.findOne(Category, {
                    where: { name: "Category #1" },
                })
                expect(category).not.to.be.null
                category!.should.be.eql({
                    id: categoryId,
                    name: "Category #1",
                })
            }),
        ))
})
