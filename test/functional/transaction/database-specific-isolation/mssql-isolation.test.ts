import { expect } from "chai"
import { DataSource } from "../../../../src"
import {
    createTestingConnections,
    reloadTestingDatabases,
    closeTestingConnections,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"

describe("transaction > mssql specific isolation levels", () => {
    describe("transaction with no default isolation level", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["mssql"],
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should execute all operations in a single transaction with READ COMMITTED isolation level", () =>
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
        it("should execute all operations in a single transaction with SERIALIZABLE isolation level", () =>
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
        it("should execute all operations in a single transaction with REPEATABLE READ isolation level", () =>
            Promise.all(
                connections.map(async (connection) => {
                    let postId: number | undefined = undefined

                    await connection.manager.transaction(
                        "REPEATABLE READ",
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
        it("should execute all operations in a single transaction with READ UNCOMMITTED isolation level", () =>
            Promise.all(
                connections.map(async (connection) => {
                    let postId: number | undefined = undefined

                    await connection.manager.transaction(
                        "READ UNCOMMITTED",
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

    describe("transaction with READ COMMITTED as default isolation level", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["mssql"],
                    driverSpecific: {
                        options: {
                            isolation: "READ COMMITTED",
                        },
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

    describe("transaction with SERIALIZABLE as default isolation level", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["mssql"],
                    driverSpecific: {
                        options: {
                            isolation: "SERIALIZABLE",
                        },
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
        it("should override default isolation level to READ UNCOMMITTED", () =>
            Promise.all(
                connections.map(async (connection) => {
                    let postId: number | undefined = undefined

                    await connection.manager.transaction(
                        "READ UNCOMMITTED",
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

    describe("transaction with REPEATABLE READ as default isolation level", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["mssql"],
                    driverSpecific: {
                        options: {
                            isolation: "REPEATABLE READ",
                        },
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

    describe("transaction with READ UNCOMMITTED as default isolation level", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["mssql"],
                    driverSpecific: {
                        options: {
                            isolation: "READ UNCOMMITTED",
                        },
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))
        it("should use READ UNCOMMITTED as default isolation level", () =>
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
    describe("transaction with SNAPSHOT as default isolation level", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["mssql"],
                    driverSpecific: {
                        options: {
                            isolation: "SNAPSHOT",
                        },
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))
        it("should use SNAPSHOT as default isolation level", () =>
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
