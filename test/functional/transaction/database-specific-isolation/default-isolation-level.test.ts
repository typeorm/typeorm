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
import sinon from "sinon"

describe("transaction > default isolation level from connection options", () => {
    describe("with REPEATABLE READ as default", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["mysql", "postgres", "sap"],
                    driverSpecific: {
                        isolationLevel: "REPEATABLE READ",
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should use REPEATABLE READ when no explicit isolation level provided", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()
                    const querySpy = sinon.spy(queryRunner, "query")

                    try {
                        await queryRunner.startTransaction()

                        // Verify REPEATABLE READ was set
                        const isolationQuery = querySpy
                            .getCalls()
                            .find((call) => {
                                return (
                                    call.args[0] ===
                                        "SET TRANSACTION ISOLATION LEVEL REPEATABLE READ" ||
                                    // MySQL sets it before START TRANSACTION
                                    (call.args[0]?.includes(
                                        "SET TRANSACTION ISOLATION LEVEL",
                                    ) &&
                                        call.args[0]?.includes("REPEATABLE"))
                                )
                            })

                        expect(isolationQuery).to.not.be.undefined

                        const post = new Post()
                        post.title = "Test Post"
                        await queryRunner.manager.save(post)

                        await queryRunner.commitTransaction()

                        const savedPost = await connection.manager.findOne(
                            Post,
                            { where: { title: "Test Post" } },
                        )
                        expect(savedPost).to.not.be.null
                    } finally {
                        querySpy.restore()
                        await queryRunner.release()
                    }
                }),
            ))

        it("should allow explicit isolation level to override default", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()
                    const querySpy = sinon.spy(queryRunner, "query")

                    try {
                        // Explicitly use READ COMMITTED (different from default REPEATABLE READ)
                        await queryRunner.startTransaction("READ COMMITTED")

                        // Verify READ COMMITTED was set instead of REPEATABLE READ
                        const isolationQuery = querySpy
                            .getCalls()
                            .find((call) => {
                                return (
                                    call.args[0] ===
                                    "SET TRANSACTION ISOLATION LEVEL READ COMMITTED"
                                )
                            })

                        expect(isolationQuery).to.not.be.undefined

                        const post = new Post()
                        post.title = "Override Test"
                        await queryRunner.manager.save(post)

                        await queryRunner.commitTransaction()

                        const savedPost = await connection.manager.findOne(
                            Post,
                            { where: { title: "Override Test" } },
                        )
                        expect(savedPost).to.not.be.null
                    } finally {
                        querySpy.restore()
                        await queryRunner.release()
                    }
                }),
            ))
    })

    describe("with SERIALIZABLE as default", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["mysql", "postgres", "sap"],
                    driverSpecific: {
                        isolationLevel: "SERIALIZABLE",
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should use SERIALIZABLE by default", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()
                    const querySpy = sinon.spy(queryRunner, "query")

                    try {
                        await queryRunner.startTransaction()

                        // Verify SERIALIZABLE was set
                        const isolationQuery = querySpy
                            .getCalls()
                            .find((call) => {
                                return (
                                    call.args[0] ===
                                        "SET TRANSACTION ISOLATION LEVEL SERIALIZABLE" ||
                                    (call.args[0]?.includes(
                                        "SET TRANSACTION ISOLATION LEVEL",
                                    ) &&
                                        call.args[0]?.includes("SERIALIZABLE"))
                                )
                            })

                        expect(isolationQuery).to.not.be.undefined

                        await queryRunner.commitTransaction()
                    } finally {
                        querySpy.restore()
                        await queryRunner.release()
                    }
                }),
            ))

        it("should work with manager.transaction using default isolation", () =>
            Promise.all(
                connections.map(async (connection) => {
                    let postId: number | undefined = undefined

                    await connection.manager.transaction(
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Manager Transaction Test"
                            await entityManager.save(post)
                            postId = post.id
                        },
                    )

                    const post = await connection.manager.findOne(Post, {
                        where: { id: postId },
                    })
                    expect(post).to.not.be.null
                    expect(post!.title).to.equal("Manager Transaction Test")
                }),
            ))
    })

    describe("without default isolation level", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["mysql", "postgres", "sap"],
                    // No isolationLevel specified
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should work without setting isolation level when not configured", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()
                    const querySpy = sinon.spy(queryRunner, "query")

                    try {
                        await queryRunner.startTransaction()

                        // Verify no isolation level was explicitly set
                        const isolationQuery = querySpy
                            .getCalls()
                            .find((call) => {
                                return call.args[0]?.includes(
                                    "SET TRANSACTION ISOLATION LEVEL",
                                )
                            })

                        // Should be undefined since no default was configured
                        expect(isolationQuery).to.be.undefined

                        const post = new Post()
                        post.title = "No Default Test"
                        await queryRunner.manager.save(post)

                        await queryRunner.commitTransaction()

                        const savedPost = await connection.manager.findOne(
                            Post,
                            { where: { title: "No Default Test" } },
                        )
                        expect(savedPost).to.not.be.null
                    } finally {
                        querySpy.restore()
                        await queryRunner.release()
                    }
                }),
            ))

        it("should work with explicit isolation level when no default configured", () =>
            Promise.all(
                connections.map(async (connection) => {
                    let postId: number | undefined = undefined

                    await connection.manager.transaction(
                        "SERIALIZABLE",
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Explicit Isolation"
                            await entityManager.save(post)
                            postId = post.id
                        },
                    )

                    const post = await connection.manager.findOne(Post, {
                        where: { id: postId },
                    })
                    expect(post).to.not.be.null
                    expect(post!.title).to.equal("Explicit Isolation")
                }),
            ))
    })

    describe("with nested transactions and default isolation", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["mysql", "postgres", "sap"],
                    driverSpecific: {
                        isolationLevel: "READ COMMITTED",
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should use default isolation for outer transaction only", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()
                    const querySpy = sinon.spy(queryRunner, "query")

                    try {
                        // Outer transaction should use default
                        await queryRunner.startTransaction()

                        const isolationCalls = querySpy
                            .getCalls()
                            .filter((call) => {
                                return (
                                    call.args[0]?.includes(
                                        "SET TRANSACTION ISOLATION LEVEL",
                                    ) &&
                                    call.args[0]?.includes("READ COMMITTED")
                                )
                            })

                        // Should have one isolation level call for outer transaction
                        expect(isolationCalls.length).to.be.at.least(1)

                        const post = new Post()
                        post.title = "Outer"
                        await queryRunner.manager.save(post)

                        // Inner transaction (savepoint) should not set isolation level
                        const callCountBefore = isolationCalls.length
                        await queryRunner.startTransaction()

                        const category = new Category()
                        category.name = "Inner"
                        await queryRunner.manager.save(category)

                        // Check that no additional isolation level was set
                        const newIsolationCalls = querySpy
                            .getCalls()
                            .filter((call) => {
                                return (
                                    call.args[0]?.includes(
                                        "SET TRANSACTION ISOLATION LEVEL",
                                    ) &&
                                    call.args[0]?.includes("READ COMMITTED")
                                )
                            })
                        expect(newIsolationCalls.length).to.equal(
                            callCountBefore,
                        )

                        await queryRunner.commitTransaction() // commit inner
                        await queryRunner.commitTransaction() // commit outer

                        const savedPost = await connection.manager.findOne(
                            Post,
                            { where: { title: "Outer" } },
                        )
                        const savedCategory = await connection.manager.findOne(
                            Category,
                            {
                                where: { name: "Inner" },
                            },
                        )

                        expect(savedPost).to.not.be.null
                        expect(savedCategory).to.not.be.null
                    } finally {
                        querySpy.restore()
                        await queryRunner.release()
                    }
                }),
            ))
    })

    describe("MSSQL specific - using options.isolation", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["mssql"],
                    driverSpecific: {
                        mssql: {
                            options: {
                                isolation: "SERIALIZABLE",
                            },
                        },
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should use SERIALIZABLE from options.isolation by default", () =>
            Promise.all(
                connections.map(async (connection) => {
                    let postId: number | undefined = undefined

                    await connection.manager.transaction(
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "MSSQL Default Isolation Test"
                            await entityManager.save(post)
                            postId = post.id
                        },
                    )

                    const post = await connection.manager.findOne(Post, {
                        where: { id: postId },
                    })
                    expect(post).to.not.be.null
                    expect(post!.title).to.equal("MSSQL Default Isolation Test")
                }),
            ))

        it("should allow explicit isolation level to override options.isolation", () =>
            Promise.all(
                connections.map(async (connection) => {
                    let postId: number | undefined = undefined

                    // Override with READ COMMITTED
                    await connection.manager.transaction(
                        "READ COMMITTED",
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "MSSQL Override Test"
                            await entityManager.save(post)
                            postId = post.id
                        },
                    )

                    const post = await connection.manager.findOne(Post, {
                        where: { id: postId },
                    })
                    expect(post).to.not.be.null
                    expect(post!.title).to.equal("MSSQL Override Test")
                }),
            ))

        it("should support SNAPSHOT isolation level", () =>
            Promise.all(
                connections.map(async (connection) => {
                    let postId: number | undefined = undefined

                    // SNAPSHOT is specific to SQL Server
                    await connection.manager.transaction(
                        "SNAPSHOT" as any,
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "MSSQL Snapshot Test"
                            await entityManager.save(post)
                            postId = post.id
                        },
                    )

                    const post = await connection.manager.findOne(Post, {
                        where: { id: postId },
                    })
                    expect(post).to.not.be.null
                    expect(post!.title).to.equal("MSSQL Snapshot Test")
                }),
            ))
    })

    describe("Oracle specific - limited isolation levels", () => {
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

        it("should use SERIALIZABLE as default for Oracle", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()
                    const querySpy = sinon.spy(queryRunner, "query")

                    try {
                        await queryRunner.startTransaction()

                        // Oracle should set SERIALIZABLE
                        const isolationQuery = querySpy
                            .getCalls()
                            .find((call) => {
                                return (
                                    call.args[0] ===
                                    "SET TRANSACTION ISOLATION LEVEL SERIALIZABLE"
                                )
                            })

                        expect(isolationQuery).to.not.be.undefined

                        const post = new Post()
                        post.title = "Oracle Default Test"
                        await queryRunner.manager.save(post)

                        await queryRunner.commitTransaction()

                        const savedPost = await connection.manager.findOne(
                            Post,
                            { where: { title: "Oracle Default Test" } },
                        )
                        expect(savedPost).to.not.be.null
                    } finally {
                        querySpy.restore()
                        await queryRunner.release()
                    }
                }),
            ))

        it("should allow override with READ COMMITTED", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()
                    const querySpy = sinon.spy(queryRunner, "query")

                    try {
                        // Override default SERIALIZABLE with READ COMMITTED
                        await queryRunner.startTransaction("READ COMMITTED")

                        // Verify READ COMMITTED was set
                        const isolationQuery = querySpy
                            .getCalls()
                            .find((call) => {
                                return (
                                    call.args[0] ===
                                    "SET TRANSACTION ISOLATION LEVEL READ COMMITTED"
                                )
                            })

                        expect(isolationQuery).to.not.be.undefined

                        const post = new Post()
                        post.title = "Oracle Override Test"
                        await queryRunner.manager.save(post)

                        await queryRunner.commitTransaction()

                        const savedPost = await connection.manager.findOne(
                            Post,
                            { where: { title: "Oracle Override Test" } },
                        )
                        expect(savedPost).to.not.be.null
                    } finally {
                        querySpy.restore()
                        await queryRunner.release()
                    }
                }),
            ))

        it("should work with manager.transaction using default", () =>
            Promise.all(
                connections.map(async (connection) => {
                    let postId: number | undefined = undefined

                    await connection.manager.transaction(
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Oracle Manager Transaction"
                            await entityManager.save(post)
                            postId = post.id
                        },
                    )

                    const post = await connection.manager.findOne(Post, {
                        where: { id: postId },
                    })
                    expect(post).to.not.be.null
                    expect(post!.title).to.equal("Oracle Manager Transaction")
                }),
            ))
    })

    describe("Oracle with READ COMMITTED default", () => {
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

        it("should use READ COMMITTED as default", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()
                    const querySpy = sinon.spy(queryRunner, "query")

                    try {
                        await queryRunner.startTransaction()

                        // Verify READ COMMITTED was set
                        const isolationQuery = querySpy
                            .getCalls()
                            .find((call) => {
                                return (
                                    call.args[0] ===
                                    "SET TRANSACTION ISOLATION LEVEL READ COMMITTED"
                                )
                            })

                        expect(isolationQuery).to.not.be.undefined

                        await queryRunner.commitTransaction()
                    } finally {
                        querySpy.restore()
                        await queryRunner.release()
                    }
                }),
            ))

        it("should work without explicit isolation level parameter", () =>
            Promise.all(
                connections.map(async (connection) => {
                    // Oracle previously required explicit isolation level parameter
                    // Now it should work with just the default from connection options
                    const queryRunner = connection.createQueryRunner()

                    try {
                        await queryRunner.startTransaction()

                        const post = new Post()
                        post.title = "Oracle No Explicit Level"
                        await queryRunner.manager.save(post)

                        await queryRunner.commitTransaction()

                        const savedPost = await connection.manager.findOne(
                            Post,
                            { where: { title: "Oracle No Explicit Level" } },
                        )
                        expect(savedPost).to.not.be.null
                    } finally {
                        await queryRunner.release()
                    }
                }),
            ))
    })
})
