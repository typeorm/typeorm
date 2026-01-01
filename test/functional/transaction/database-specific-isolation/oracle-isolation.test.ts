import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import { expect } from "chai"

describe("transaction > oracle isolation level support", () => {
    describe("transaction > transaction with no default isolation level", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["oracle"],
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

                    const category = await connection.manager.findOne(
                        Category,
                        {
                            where: { name: "Category #1" },
                        },
                    )
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

                    const category = await connection.manager.findOne(
                        Category,
                        {
                            where: { name: "Category #1" },
                        },
                    )
                    expect(category).not.to.be.null
                    category!.should.be.eql({
                        id: categoryId,
                        name: "Category #1",
                    })
                }),
            ))
    })

    describe("transaction > default oracle isolation level READ COMMITTED", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["oracle"],
                    driverSpecific: {
                        isolationLevel: "READ COMMITTED",
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should use READ COMMITTED as default isolation level", () =>
            Promise.all(
                connections.map(async (connection) => {
                    let postId: number | undefined = undefined

                    await connection.manager.transaction(
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            postId = post.id
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
                }),
            ))

        it("should override default isolation level with SERIALIZABLE", () =>
            Promise.all(
                connections.map(async (connection) => {
                    let postId: number | undefined = undefined

                    // Initial insert is required to prevent ORA-08177 errors in Oracle 21c when using a serializable connection
                    // immediately after DDL statements. This ensures proper synchronization and helps avoid conflicts.
                    await connection.manager
                        .getRepository(Post)
                        .save({ title: "Post #0" })

                    await connection.manager.transaction(
                        "SERIALIZABLE",
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            postId = post.id
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
                }),
            ))
    })

    describe("transaction > default oracle isolation level SERIALIZABLE", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["oracle"],
                    driverSpecific: {
                        isolationLevel: "SERIALIZABLE",
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        // Disabled the below test due to ORA-08177 errors occurring intermittently in Oracle 21c
        // These errors arise when using a serializable as default transaction isolation level
        // immediately after DDL statements.
        // TODO: Re-enable this test once a proper solution is implemented to address the root cause.

        // it("should use SERIALIZABLE as default isolation level", () =>
        //     Promise.all(
        //         connections.map(async (connection) => {
        //             let postId: number | undefined = undefined

        //             // Initial insert is required to prevent ORA-08177 errors in Oracle 21c when using a serializable connection
        //             // immediately after DDL statements. This ensures proper synchronization and helps avoid conflicts.
        //             await connection.manager
        //                 .getRepository(Post)
        //                 .save({ title: "Post #0" })

        //             await connection.manager.transaction(
        //                 async (entityManager) => {
        //                     const post = new Post()
        //                     post.title = "Post #1"
        //                     await entityManager.save(post)

        //                     postId = post.id
        //                 },
        //             )

        //             const post = await connection.manager.findOne(Post, {
        //                 where: { title: "Post #1" },
        //             })
        //             expect(post).not.to.be.null
        //             post!.should.be.eql({
        //                 id: postId,
        //                 title: "Post #1",
        //             })
        //         }),
        //     ))

        it("should override default isolation level with READ COMMITTED", () =>
            Promise.all(
                connections.map(async (connection) => {
                    let postId: number | undefined = undefined

                    await connection.manager.transaction(
                        "READ COMMITTED",
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            postId = post.id
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
                }),
            ))
    })
})
