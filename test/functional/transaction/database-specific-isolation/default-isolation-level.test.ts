import { expect } from "chai"
import { DataSource } from "../../../../src"
import {
    createTestingConnections,
    reloadTestingDatabases,
    closeTestingConnections,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"

describe("transaction > transaction with default isolation level", () => {
    describe("transaction with default isolation level READ COMMITTED", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["postgres", "mysql", "sap", "cockroachdb"],
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
        it("should override default isolation level to SERIALIZABLE", () =>
            Promise.all(
                connections.map(async (connection) => {
                    let postId: number | undefined = undefined

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

    describe("transaction with default isolation level SERIALIZABLE", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["postgres", "mysql", "sap", "cockroachdb"],
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

        it("should override default isolation level to READ COMMITTED", () =>
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

    describe("transaction with default isolation level REPEATABLE READ", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["postgres", "mysql", "sap", "cockroachdb"],
                    driverSpecific: {
                        isolationLevel: "REPEATABLE READ",
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should use REPEATABLE READ as default isolation level", () =>
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

        it("should override default isolation level to READ COMMITTED", () =>
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
