import { expect } from "chai"
import { DataSource } from "../../../../src"
import {
    createTestingConnections,
    reloadTestingDatabases,
    closeTestingConnections,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"

describe("transaction > mssql isolation level support", () => {
    describe("transaction with READ COMMITTED as default isolation level", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["mssql"],
                    driverSpecific: {
                        options: {
                            isolationLevel: "READ COMMITTED",
                        },
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))
        it("should use READ COMMITTED isolation level in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(2) // READ COMMITTED
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(async (entityManager) => {
                        const post = new Post()
                        post.title = "Post #1"
                        await entityManager.save(post)

                        await entityManager
                            .query(
                                `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                            )
                            .then((result) => {
                                expect(
                                    result[0]["transaction_isolation_level"],
                                ).to.equal(2) // READ COMMITTED
                            })

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
        it("should override default isolation level with SERIALIZABLE in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(2) // READ COMMITTED
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(
                        "SERIALIZABLE",
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            await entityManager
                                .query(
                                    `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                                )
                                .then((result) => {
                                    expect(
                                        result[0][
                                            "transaction_isolation_level"
                                        ],
                                    ).to.equal(4) // SERIALIZABLE
                                })

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
        it("should override default isolation level with READ UNCOMMITTED in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(2) // READ COMMITTED
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(
                        "READ UNCOMMITTED",
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            await entityManager
                                .query(
                                    `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                                )
                                .then((result) => {
                                    expect(
                                        result[0][
                                            "transaction_isolation_level"
                                        ],
                                    ).to.equal(1) // READ UNCOMMITTED
                                })

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

        it("should override default isolation level with REPEATABLE READ in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(2) // READ COMMITTED
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(
                        "REPEATABLE READ",
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            await entityManager
                                .query(
                                    `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                                )
                                .then((result) => {
                                    expect(
                                        result[0][
                                            "transaction_isolation_level"
                                        ],
                                    ).to.equal(3) // REPEATABLE READ
                                })

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

        it("should override default isolation level with SNAPSHOT in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(2) // READ COMMITTED
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(
                        "SNAPSHOT",
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            await entityManager
                                .query(
                                    `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                                )
                                .then((result) => {
                                    expect(
                                        result[0][
                                            "transaction_isolation_level"
                                        ],
                                    ).to.equal(5) // SNAPSHOT
                                })

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
                            isolationLevel: "SERIALIZABLE",
                        },
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))
        it("should use SERIALIZABLE isolation level in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(4) // SERIALIZABLE
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(async (entityManager) => {
                        const post = new Post()
                        post.title = "Post #1"
                        await entityManager.save(post)

                        await entityManager
                            .query(
                                `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                            )
                            .then((result) => {
                                expect(
                                    result[0]["transaction_isolation_level"],
                                ).to.equal(4) // SERIALIZABLE
                            })

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
        it("should override default isolation level with READ COMMITTED in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(4) // SERIALIZABLE
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(
                        "READ COMMITTED",
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            await entityManager
                                .query(
                                    `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                                )
                                .then((result) => {
                                    expect(
                                        result[0][
                                            "transaction_isolation_level"
                                        ],
                                    ).to.equal(2) // READ COMMITTED
                                })

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
        it("should override default isolation level with READ UNCOMMITTED in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(4) // SERIALIZABLE
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(
                        "READ UNCOMMITTED",
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            await entityManager
                                .query(
                                    `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                                )
                                .then((result) => {
                                    expect(
                                        result[0][
                                            "transaction_isolation_level"
                                        ],
                                    ).to.equal(1) // READ UNCOMMITTED
                                })

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

        it("should override default isolation level with REPEATABLE READ in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(4) // SERIALIZABLE
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(
                        "REPEATABLE READ",
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            await entityManager
                                .query(
                                    `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                                )
                                .then((result) => {
                                    expect(
                                        result[0][
                                            "transaction_isolation_level"
                                        ],
                                    ).to.equal(3) // REPEATABLE READ
                                })

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

        it("should override default isolation level with SNAPSHOT in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(4) // SERIALIZABLE
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(
                        "SNAPSHOT",
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            await entityManager
                                .query(
                                    `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                                )
                                .then((result) => {
                                    expect(
                                        result[0][
                                            "transaction_isolation_level"
                                        ],
                                    ).to.equal(5) // SNAPSHOT
                                })

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
                            isolationLevel: "READ UNCOMMITTED",
                        },
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))
        it("should use READ COMMITTED isolation level in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(1) // READ UNCOMMITTED
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(async (entityManager) => {
                        const post = new Post()
                        post.title = "Post #1"
                        await entityManager.save(post)

                        await entityManager
                            .query(
                                `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                            )
                            .then((result) => {
                                expect(
                                    result[0]["transaction_isolation_level"],
                                ).to.equal(1) // READ UNCOMMITTED
                            })

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
        it("should override default isolation level with SERIALIZABLE in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(1) // READ UNCOMMITTED
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(
                        "SERIALIZABLE",
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            await entityManager
                                .query(
                                    `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                                )
                                .then((result) => {
                                    expect(
                                        result[0][
                                            "transaction_isolation_level"
                                        ],
                                    ).to.equal(4) // SERIALIZABLE
                                })

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
        it("should override default isolation level with READ COMMITTED in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(1) // READ UNCOMMITTED
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(
                        "READ COMMITTED",
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            await entityManager
                                .query(
                                    `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                                )
                                .then((result) => {
                                    expect(
                                        result[0][
                                            "transaction_isolation_level"
                                        ],
                                    ).to.equal(2) // READ COMMITTED
                                })

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

        it("should override default isolation level with REPEATABLE READ in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(1) // READ UNCOMMITTED
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(
                        "REPEATABLE READ",
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            await entityManager
                                .query(
                                    `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                                )
                                .then((result) => {
                                    expect(
                                        result[0][
                                            "transaction_isolation_level"
                                        ],
                                    ).to.equal(3) // REPEATABLE READ
                                })

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

        it("should override default isolation level with SNAPSHOT in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(1) // READ UNCOMMITTED
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(
                        "SNAPSHOT",
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            await entityManager
                                .query(
                                    `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                                )
                                .then((result) => {
                                    expect(
                                        result[0][
                                            "transaction_isolation_level"
                                        ],
                                    ).to.equal(5) // SNAPSHOT
                                })

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
                            isolationLevel: "REPEATABLE READ",
                        },
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))
        it("should use REPEATABLE READ isolation level in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(3) // REPEATABLE READ
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(async (entityManager) => {
                        const post = new Post()
                        post.title = "Post #1"
                        await entityManager.save(post)

                        await entityManager
                            .query(
                                `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                            )
                            .then((result) => {
                                expect(
                                    result[0]["transaction_isolation_level"],
                                ).to.equal(3) // REPEATABLE READ
                            })

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
        it("should override default isolation level with SERIALIZABLE in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(3) // REPEATABLE READ
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(
                        "SERIALIZABLE",
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            await entityManager
                                .query(
                                    `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                                )
                                .then((result) => {
                                    expect(
                                        result[0][
                                            "transaction_isolation_level"
                                        ],
                                    ).to.equal(4) // SERIALIZABLE
                                })

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
        it("should override default isolation level with READ UNCOMMITTED in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(3) // REPEATABLE READ
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(
                        "READ UNCOMMITTED",
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            await entityManager
                                .query(
                                    `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                                )
                                .then((result) => {
                                    expect(
                                        result[0][
                                            "transaction_isolation_level"
                                        ],
                                    ).to.equal(1) // READ UNCOMMITTED
                                })

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

        it("should override default isolation level with READ COMMITTED in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(3) // REPEATABLE READ
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(
                        "READ COMMITTED",
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            await entityManager
                                .query(
                                    `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                                )
                                .then((result) => {
                                    expect(
                                        result[0][
                                            "transaction_isolation_level"
                                        ],
                                    ).to.equal(2) // READ COMMITTED
                                })

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

        it("should override default isolation level with SNAPSHOT in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(3) // REPEATABLE READ
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(
                        "SNAPSHOT",
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            await entityManager
                                .query(
                                    `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                                )
                                .then((result) => {
                                    expect(
                                        result[0][
                                            "transaction_isolation_level"
                                        ],
                                    ).to.equal(5) // SNAPSHOT
                                })

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
                            isolationLevel: "SNAPSHOT",
                        },
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))
        it("should use SNAPSHOT isolation level in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(5) // SNAPSHOT
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(async (entityManager) => {
                        const post = new Post()
                        post.title = "Post #1"
                        await entityManager.save(post)

                        await entityManager
                            .query(
                                `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                            )
                            .then((result) => {
                                expect(
                                    result[0]["transaction_isolation_level"],
                                ).to.equal(5) // SNAPSHOT
                            })

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
        it("should override default isolation level with SERIALIZABLE in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(5) // SNAPSHOT
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(
                        "SERIALIZABLE",
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            await entityManager
                                .query(
                                    `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                                )
                                .then((result) => {
                                    expect(
                                        result[0][
                                            "transaction_isolation_level"
                                        ],
                                    ).to.equal(4) // SERIALIZABLE
                                })

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
        it("should override default isolation level with READ UNCOMMITTED in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(5) // SNAPSHOT
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(
                        "READ UNCOMMITTED",
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            await entityManager
                                .query(
                                    `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                                )
                                .then((result) => {
                                    expect(
                                        result[0][
                                            "transaction_isolation_level"
                                        ],
                                    ).to.equal(1) // READ UNCOMMITTED
                                })

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

        it("should override default isolation level with REPEATABLE READ in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(5) // SNAPSHOT
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(
                        "REPEATABLE READ",
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            await entityManager
                                .query(
                                    `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                                )
                                .then((result) => {
                                    expect(
                                        result[0][
                                            "transaction_isolation_level"
                                        ],
                                    ).to.equal(3) // REPEATABLE READ
                                })

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

        it("should override default isolation level with READ COMMITTED in next transaction", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(
                            `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                        )
                        .then((result) => {
                            expect(
                                result[0]["transaction_isolation_level"],
                            ).to.equal(5) // SNAPSHOT
                        })
                    let postId: number | undefined = undefined

                    await connection.transaction(
                        "READ COMMITTED",
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            await entityManager
                                .query(
                                    `SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID`,
                                )
                                .then((result) => {
                                    expect(
                                        result[0][
                                            "transaction_isolation_level"
                                        ],
                                    ).to.equal(2) // READ COMMITTED
                                })

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
