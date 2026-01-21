import { expect } from "chai"
import { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Category } from "./entity/Category"
import { Post } from "./entity/Post"

describe("transaction > postgres/cockroachdb isolation level support", () => {
    describe("transaction with default isolation level READ COMMITTED", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["postgres", "cockroachdb"],
                    driverSpecific: {
                        isolationLevel: "READ COMMITTED",
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should execute all operations in a single transaction with READ COMMITTED isolation level", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(`SHOW default_transaction_isolation`)
                        .then((result) =>
                            expect(
                                result[0].default_transaction_isolation,
                            ).to.be.equal("read committed"),
                        )

                    let postId: number | undefined = undefined,
                        categoryId: number | undefined = undefined

                    await connection.manager.transaction(
                        async (entityManager) => {
                            await entityManager
                                .query(`SHOW transaction_isolation`)
                                .then((result) =>
                                    expect(
                                        result[0].transaction_isolation,
                                    ).to.be.equal("read committed"),
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
        it("should override default isolation level with SERIALIZABLE isolation level", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(`SHOW default_transaction_isolation`)
                        .then((result) =>
                            expect(
                                result[0].default_transaction_isolation,
                            ).to.be.equal("read committed"),
                        )

                    let postId: number | undefined = undefined,
                        categoryId: number | undefined = undefined

                    await connection.manager.transaction(
                        "SERIALIZABLE",
                        async (entityManager) => {
                            await entityManager
                                .query(`SHOW transaction_isolation`)
                                .then((result) =>
                                    expect(
                                        result[0].transaction_isolation,
                                    ).to.be.equal("serializable"),
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
        it("should override default isolation level with REPEATABLE READ isolation level", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(`SHOW default_transaction_isolation`)
                        .then((result) =>
                            expect(
                                result[0].default_transaction_isolation,
                            ).to.be.equal("read committed"),
                        )

                    let postId: number | undefined = undefined,
                        categoryId: number | undefined = undefined

                    await connection.manager.transaction(
                        "REPEATABLE READ",
                        async (entityManager) => {
                            await entityManager
                                .query(`SHOW transaction_isolation`)
                                .then((result) =>
                                    expect(
                                        result[0].transaction_isolation,
                                    ).to.be.oneOf([
                                        "repeatable read",
                                        "serializable", // CockroachDB maps REPEATABLE READ to SERIALIZABLE
                                        // Need cluster setting sql.txn.repeatable_read_isolation.enabled=true, to enable REPEATABLE READ
                                    ]),
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
        it("should override default isolation level with READ UNCOMMITTED isolation level", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(`SHOW default_transaction_isolation`)
                        .then((result) =>
                            expect(
                                result[0].default_transaction_isolation,
                            ).to.be.equal("read committed"),
                        )

                    let postId: number | undefined = undefined,
                        categoryId: number | undefined = undefined

                    await connection.manager.transaction(
                        "READ UNCOMMITTED",
                        async (entityManager) => {
                            await entityManager
                                .query(`SHOW transaction_isolation`)
                                .then((result) =>
                                    expect(
                                        result[0].transaction_isolation,
                                    ).to.be.oneOf([
                                        "read uncommitted",
                                        "read committed", // CockroachDB maps READ UNCOMMITTED to READ COMMITTED
                                    ]),
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

    describe("transaction with default isolation level SERIALIZABLE", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["postgres", "cockroachdb"],
                    driverSpecific: {
                        isolationLevel: "SERIALIZABLE",
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should execute all operations in a single transaction with SERIALIZABLE isolation level", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(`SHOW default_transaction_isolation`)
                        .then((result) =>
                            expect(
                                result[0].default_transaction_isolation,
                            ).to.be.equal("serializable"),
                        )

                    let postId: number | undefined = undefined,
                        categoryId: number | undefined = undefined

                    await connection.manager.transaction(
                        async (entityManager) => {
                            await entityManager
                                .query(`SHOW transaction_isolation`)
                                .then((result) =>
                                    expect(
                                        result[0].transaction_isolation,
                                    ).to.be.equal("serializable"),
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
        it("should override default isolation level with READ COMMITTED isolation level", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(`SHOW default_transaction_isolation`)
                        .then((result) =>
                            expect(
                                result[0].default_transaction_isolation,
                            ).to.be.equal("serializable"),
                        )

                    let postId: number | undefined = undefined,
                        categoryId: number | undefined = undefined

                    await connection.manager.transaction(
                        "READ COMMITTED",
                        async (entityManager) => {
                            await entityManager
                                .query(`SHOW transaction_isolation`)
                                .then((result) =>
                                    expect(
                                        result[0].transaction_isolation,
                                    ).to.be.equal("read committed"),
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
        it("should override default isolation level with REPEATABLE READ isolation level", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(`SHOW default_transaction_isolation`)
                        .then((result) =>
                            expect(
                                result[0].default_transaction_isolation,
                            ).to.be.equal("serializable"),
                        )

                    let postId: number | undefined = undefined,
                        categoryId: number | undefined = undefined

                    await connection.manager.transaction(
                        "REPEATABLE READ",
                        async (entityManager) => {
                            await entityManager
                                .query(`SHOW transaction_isolation`)
                                .then((result) =>
                                    expect(
                                        result[0].transaction_isolation,
                                    ).to.be.oneOf([
                                        "repeatable read",
                                        "serializable", // CockroachDB maps REPEATABLE READ to SERIALIZABLE
                                        // Need cluster setting sql.txn.repeatable_read_isolation.enabled=true, to enable REPEATABLE READ
                                    ]),
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
        it("should override default isolation level with READ UNCOMMITTED isolation level", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(`SHOW default_transaction_isolation`)
                        .then((result) =>
                            expect(
                                result[0].default_transaction_isolation,
                            ).to.be.equal("serializable"),
                        )

                    let postId: number | undefined = undefined,
                        categoryId: number | undefined = undefined

                    await connection.manager.transaction(
                        "READ UNCOMMITTED",
                        async (entityManager) => {
                            await entityManager
                                .query(`SHOW transaction_isolation`)
                                .then((result) =>
                                    expect(
                                        result[0].transaction_isolation,
                                    ).to.be.oneOf([
                                        "read uncommitted",
                                        "read committed", // CockroachDB maps READ UNCOMMITTED to READ COMMITTED
                                    ]),
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
    describe("transaction with default isolation level REPEATABLE READ", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["postgres", "cockroachdb"],
                    driverSpecific: {
                        isolationLevel: "REPEATABLE READ",
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should execute all operations in a single transaction with REPEATABLE READ isolation level", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(`SHOW default_transaction_isolation`)
                        .then((result) =>
                            expect(
                                result[0].default_transaction_isolation,
                            ).to.be.oneOf([
                                "repeatable read",
                                "serializable", // CockroachDB maps REPEATABLE READ to SERIALIZABLE
                                // Need cluster setting sql.txn.repeatable_read_isolation.enabled=true, to enable REPEATABLE READ
                            ]),
                        )

                    let postId: number | undefined = undefined,
                        categoryId: number | undefined = undefined

                    await connection.manager.transaction(
                        async (entityManager) => {
                            await entityManager
                                .query(`SHOW transaction_isolation`)
                                .then((result) =>
                                    expect(
                                        result[0].transaction_isolation,
                                    ).to.be.oneOf([
                                        "repeatable read",
                                        "serializable", // CockroachDB maps REPEATABLE READ to SERIALIZABLE
                                        // Need cluster setting sql.txn.repeatable_read_isolation.enabled=true, to enable REPEATABLE READ
                                    ]),
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
        it("should override default isolation level with SERIALIZABLE isolation level", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(`SHOW default_transaction_isolation`)
                        .then((result) =>
                            expect(
                                result[0].default_transaction_isolation,
                            ).to.be.oneOf([
                                "repeatable read",
                                "serializable", // CockroachDB maps REPEATABLE READ to SERIALIZABLE
                                // Need cluster setting sql.txn.repeatable_read_isolation.enabled=true, to enable REPEATABLE READ
                            ]),
                        )

                    let postId: number | undefined = undefined,
                        categoryId: number | undefined = undefined

                    await connection.manager.transaction(
                        "SERIALIZABLE",
                        async (entityManager) => {
                            await entityManager
                                .query(`SHOW transaction_isolation`)
                                .then((result) =>
                                    expect(
                                        result[0].transaction_isolation,
                                    ).to.be.equal("serializable"),
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
        it("should override default isolation level with READ COMMITTED isolation level", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(`SHOW default_transaction_isolation`)
                        .then((result) =>
                            expect(
                                result[0].default_transaction_isolation,
                            ).to.be.oneOf([
                                "repeatable read",
                                "serializable", // CockroachDB maps REPEATABLE READ to SERIALIZABLE
                                // Need cluster setting sql.txn.repeatable_read_isolation.enabled=true, to enable REPEATABLE READ
                            ]),
                        )

                    let postId: number | undefined = undefined,
                        categoryId: number | undefined = undefined

                    await connection.manager.transaction(
                        "READ COMMITTED",
                        async (entityManager) => {
                            await entityManager
                                .query(`SHOW transaction_isolation`)
                                .then((result) =>
                                    expect(
                                        result[0].transaction_isolation,
                                    ).to.be.equal("read committed"),
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
        it("should override default isolation level with READ UNCOMMITTED isolation level", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(`SHOW default_transaction_isolation`)
                        .then((result) =>
                            expect(
                                result[0].default_transaction_isolation,
                            ).to.be.oneOf([
                                "repeatable read",
                                "serializable", // CockroachDB maps REPEATABLE READ to SERIALIZABLE
                                // Need cluster setting sql.txn.repeatable_read_isolation.enabled=true, to enable REPEATABLE READ
                            ]),
                        )

                    let postId: number | undefined = undefined,
                        categoryId: number | undefined = undefined

                    await connection.manager.transaction(
                        "READ UNCOMMITTED",
                        async (entityManager) => {
                            await entityManager
                                .query(`SHOW transaction_isolation`)
                                .then((result) =>
                                    expect(
                                        result[0].transaction_isolation,
                                    ).to.be.oneOf([
                                        "read uncommitted",
                                        "read committed", // CockroachDB maps READ UNCOMMITTED to READ COMMITTED
                                    ]),
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
    describe("transaction with default isolation level READ UNCOMMITTED", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    enabledDrivers: ["postgres", "cockroachdb"],
                    driverSpecific: {
                        isolationLevel: "READ UNCOMMITTED",
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should execute all operations in a single transaction with READ UNCOMMITTED isolation level", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(`SHOW default_transaction_isolation`)
                        .then((result) =>
                            expect(
                                result[0].default_transaction_isolation,
                            ).to.be.oneOf([
                                "read uncommitted",
                                "read committed", // CockroachDB maps READ UNCOMMITTED to READ COMMITTED
                            ]),
                        )

                    let postId: number | undefined = undefined,
                        categoryId: number | undefined = undefined

                    await connection.manager.transaction(
                        async (entityManager) => {
                            await entityManager
                                .query(`SHOW transaction_isolation`)
                                .then((result) =>
                                    expect(
                                        result[0].transaction_isolation,
                                    ).to.be.oneOf([
                                        "read uncommitted",
                                        "read committed", // CockroachDB maps READ UNCOMMITTED to READ COMMITTED
                                    ]),
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
        it("should override default isolation level with SERIALIZABLE isolation level", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(`SHOW default_transaction_isolation`)
                        .then((result) =>
                            expect(
                                result[0].default_transaction_isolation,
                            ).to.be.oneOf([
                                "read uncommitted",
                                "read committed", // CockroachDB maps READ UNCOMMITTED to READ COMMITTED
                            ]),
                        )

                    let postId: number | undefined = undefined,
                        categoryId: number | undefined = undefined

                    await connection.manager.transaction(
                        "SERIALIZABLE",
                        async (entityManager) => {
                            await entityManager
                                .query(`SHOW transaction_isolation`)
                                .then((result) =>
                                    expect(
                                        result[0].transaction_isolation,
                                    ).to.be.equal("serializable"),
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
        it("should override default isolation level with REPEATABLE READ isolation level", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(`SHOW default_transaction_isolation`)
                        .then((result) =>
                            expect(
                                result[0].default_transaction_isolation,
                            ).to.be.oneOf([
                                "read uncommitted",
                                "read committed", // CockroachDB maps READ UNCOMMITTED to READ COMMITTED
                            ]),
                        )

                    let postId: number | undefined = undefined,
                        categoryId: number | undefined = undefined

                    await connection.manager.transaction(
                        "REPEATABLE READ",
                        async (entityManager) => {
                            await entityManager
                                .query(`SHOW transaction_isolation`)
                                .then((result) =>
                                    expect(
                                        result[0].transaction_isolation,
                                    ).to.be.oneOf([
                                        "repeatable read",
                                        "serializable", // CockroachDB maps REPEATABLE READ to SERIALIZABLE
                                        // Need cluster setting sql.txn.repeatable_read_isolation.enabled=true, to enable REPEATABLE READ
                                    ]),
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
        it("should override default isolation level with READ COMMITTED isolation level", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection
                        .query(`SHOW default_transaction_isolation`)
                        .then((result) =>
                            expect(
                                result[0].default_transaction_isolation,
                            ).to.be.oneOf([
                                "read uncommitted",
                                "read committed", // CockroachDB maps READ UNCOMMITTED to READ COMMITTED
                            ]),
                        )

                    let postId: number | undefined = undefined,
                        categoryId: number | undefined = undefined

                    await connection.manager.transaction(
                        "READ COMMITTED",
                        async (entityManager) => {
                            await entityManager
                                .query(`SHOW transaction_isolation`)
                                .then((result) =>
                                    expect(
                                        result[0].transaction_isolation,
                                    ).to.be.equal("read committed"),
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
})
