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

describe("transaction > sqlite isolation support", () => {
    describe("transaction with no default isolation level", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["sqlite", "better-sqlite3", "sqljs"],
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should execute all operations in a single transaction with READ UNCOMMITTED isolation level", () =>
            Promise.all(
                connections.map(async (connection) => {
                    let postId: number | undefined = undefined,
                        categoryId: number | undefined = undefined

                    await connection.transaction(
                        "READ UNCOMMITTED",
                        async (entityManager) => {
                            await entityManager
                                .query(`PRAGMA read_uncommitted`)
                                .then((result) =>
                                    expect(
                                        result[0].read_uncommitted,
                                    ).to.be.equal(1),
                                )

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

                    await connection.transaction(
                        "SERIALIZABLE",
                        async (entityManager) => {
                            await entityManager
                                .query(`PRAGMA read_uncommitted`)
                                .then((result) =>
                                    expect(
                                        result[0].read_uncommitted,
                                    ).to.be.equal(0),
                                )

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

    describe("transaction with default isolation level READ UNCOMMITTED for SQLite", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["sqlite", "better-sqlite3", "sqljs"],
                    driverSpecific: {
                        isolationLevel: "READ UNCOMMITTED",
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should use READ UNCOMMITTED as default isolation level", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(`PRAGMA read_uncommitted`)
                        .then((result) =>
                            expect(result[0].read_uncommitted).to.be.equal(1),
                        )

                    let postId: number | undefined = undefined

                    await connection.transaction(async (entityManager) => {
                        await entityManager
                            .query(`PRAGMA read_uncommitted`)
                            .then((result) =>
                                expect(result[0].read_uncommitted).to.be.equal(
                                    1,
                                ),
                            )
                        const post = new Post()
                        post.title = "Post #1"
                        await entityManager.save(post)
                        postId = post.id
                    })
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

        it("should override default isolation level to SERIALIZABLE", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(`PRAGMA read_uncommitted`)
                        .then((result) =>
                            expect(result[0].read_uncommitted).to.be.equal(1),
                        )

                    let postId: number | undefined = undefined

                    await connection.transaction(
                        "SERIALIZABLE",
                        async (entityManager) => {
                            await entityManager
                                .query(`PRAGMA read_uncommitted`)
                                .then((result) =>
                                    expect(
                                        result[0].read_uncommitted,
                                    ).to.be.equal(0),
                                )

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

    describe("transaction with default isolation level SERIALIZABLE for SQLite", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["sqlite", "better-sqlite3", "sqljs"],
                    driverSpecific: {
                        isolationLevel: "SERIALIZABLE",
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should use SERIALIZABLE as default isolation level", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(`PRAGMA read_uncommitted`)
                        .then((result) =>
                            expect(result[0].read_uncommitted).to.be.equal(0),
                        )

                    let postId: number | undefined = undefined

                    await connection.transaction(async (entityManager) => {
                        await entityManager
                            .query(`PRAGMA read_uncommitted`)
                            .then((result) =>
                                expect(result[0].read_uncommitted).to.be.equal(
                                    0,
                                ),
                            )
                        const post = new Post()
                        post.title = "Post #1"
                        await entityManager.save(post)
                        postId = post.id
                    })
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

        it("should override default isolation level to READ UNCOMMITTED", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(`PRAGMA read_uncommitted`)
                        .then((result) =>
                            expect(result[0].read_uncommitted).to.be.equal(0),
                        )
                    let postId: number | undefined = undefined

                    await connection.transaction(
                        "READ UNCOMMITTED",
                        async (entityManager) => {
                            await entityManager
                                .query(`PRAGMA read_uncommitted`)
                                .then((result) =>
                                    expect(
                                        result[0].read_uncommitted,
                                    ).to.be.equal(1),
                                )

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
