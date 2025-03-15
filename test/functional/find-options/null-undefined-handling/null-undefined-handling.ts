import "reflect-metadata"
import "../../../utils/test-setup"
import { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import { expect } from "chai"

describe("find options > null and undefined handling", () => {
    let connections: DataSource[]

    describe("with default behavior", () => {
        before(async () => {
            connections = await createTestingConnections({
                entities: [Post, Category],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["sqlite"],
            })
        })
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        async function prepareData(connection: DataSource) {
            const category1 = new Category()
            category1.name = "Category #1"
            await connection.manager.save(category1)

            const category2 = new Category()
            category2.name = "Category #2"
            await connection.manager.save(category2)

            const post1 = new Post()
            post1.title = "Post #1"
            post1.text = "About post #1"
            post1.category = category1
            await connection.manager.save(post1)

            const post2 = new Post()
            post2.title = "Post #2"
            post2.text = null
            post2.category = category2
            await connection.manager.save(post2)

            const post3 = new Post()
            post3.title = "Post #3"
            post3.text = "About post #3"
            post3.category = null
            await connection.manager.save(post3)
        }

        it("should skip null properties by default", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await prepareData(connection)

                    // Test with QueryBuilder
                    const postsWithQb = await connection
                        .createQueryBuilder(Post, "post")
                        .setFindOptions({
                            where: {
                                title: "Post #1",
                                text: null,
                            } as any,
                        })
                        .getMany()

                    // This should return post1 since null properties are skipped by default
                    postsWithQb.should.be.eql([
                        { id: 1, title: "Post #1", text: "About post #1" },
                    ])

                    // Test with Repository
                    const postsWithRepo = await connection
                        .getRepository(Post)
                        .find({
                            where: {
                                text: null,
                            } as any,
                        })

                    // This should return all posts since null properties are skipped by default
                    postsWithRepo.length.should.be.equal(3)
                }),
            ))

        it("should skip undefined properties by default", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await prepareData(connection)

                    // Test with QueryBuilder
                    const postsWithQb = await connection
                        .createQueryBuilder(Post, "post")
                        .setFindOptions({
                            where: {
                                title: "Post #1",
                                text: undefined,
                            },
                        })
                        .getMany()

                    // This should return post1 since undefined properties are skipped by default
                    postsWithQb.should.be.eql([
                        { id: 1, title: "Post #1", text: "About post #1" },
                    ])

                    // Test with Repository
                    const postsWithRepo = await connection
                        .getRepository(Post)
                        .find({
                            where: {
                                text: undefined,
                            },
                        })

                    // This should return all posts since undefined properties are skipped by default
                    postsWithRepo.length.should.be.equal(3)
                }),
            ))

        it("should skip null relation properties by default", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await prepareData(connection)

                    // Test with QueryBuilder
                    const postsWithQb = await connection
                        .createQueryBuilder(Post, "post")
                        .setFindOptions({
                            where: {
                                category: null,
                            } as any,
                        })
                        .getMany()

                    // This should return all posts since null properties are skipped by default
                    postsWithQb.length.should.be.equal(3)

                    // Test with Repository
                    const postsWithRepo = await connection
                        .getRepository(Post)
                        .find({
                            where: {
                                category: null,
                            } as any,
                        })

                    // This should return all posts since null properties are skipped by default
                    postsWithRepo.length.should.be.equal(3)
                }),
            ))

        it("should skip undefined relation properties by default", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await prepareData(connection)

                    // Test with QueryBuilder
                    const postsWithQb = await connection
                        .createQueryBuilder(Post, "post")
                        .setFindOptions({
                            where: {
                                category: undefined,
                            },
                        })
                        .getMany()

                    // This should return all posts since undefined properties are skipped by default
                    postsWithQb.length.should.be.equal(3)

                    // Test with Repository
                    const postsWithRepo = await connection
                        .getRepository(Post)
                        .find({
                            where: {
                                category: undefined,
                            },
                        })

                    // This should return all posts since undefined properties are skipped by default
                    postsWithRepo.length.should.be.equal(3)
                }),
            ))
    })

    describe("with treatJsNullAsSqlNull enabled", () => {
        before(async () => {
            connections = await createTestingConnections({
                entities: [Post, Category],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["sqlite"],
                driverSpecific: {
                    treatJsNullAsSqlNull: true,
                },
            })
        })

        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        async function prepareData(connection: DataSource) {
            const category1 = new Category()
            category1.name = "Category #1"
            await connection.manager.save(category1)

            const post1 = new Post()
            post1.title = "Post #1"
            post1.text = null
            post1.category = null
            await connection.manager.save(post1)

            const post2 = new Post()
            post2.title = "Post #2"
            post2.text = "Some text"
            post2.category = category1
            await connection.manager.save(post2)
        }

        it("should transform JS null to SQL NULL when treatJsNullAsSqlNull is enabled", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await prepareData(connection)

                    // Test QueryBuilder with null text
                    const posts1 = await connection
                        .createQueryBuilder(Post, "post")
                        .where({
                            text: null,
                        })
                        .getMany()

                    expect(posts1.length).to.equal(1)
                    expect(posts1[0].title).to.equal("Post #1")

                    // Test Repository with null text
                    const posts2 = await connection.getRepository(Post).find({
                        where: {
                            text: null,
                        } as any,
                    })

                    expect(posts2.length).to.equal(1)
                    expect(posts2[0].title).to.equal("Post #1")
                }),
            ))

        it("should transform JS null to SQL NULL for relations when treatJsNullAsSqlNull is enabled", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await prepareData(connection)

                    // Test QueryBuilder with null relation
                    const posts1 = await connection
                        .createQueryBuilder(Post, "post")
                        .where({
                            category: null,
                        })
                        .getMany()

                    expect(posts1.length).to.equal(1)
                    expect(posts1[0].title).to.equal("Post #1")

                    // Test Repository with null relation
                    const posts2 = await connection.getRepository(Post).find({
                        where: {
                            category: null,
                        } as any,
                    })

                    expect(posts2.length).to.equal(1)
                    expect(posts2[0].title).to.equal("Post #1")
                }),
            ))
    })

    describe("with throwOnUndefinedInFind enabled", () => {
        before(async () => {
            connections = await createTestingConnections({
                entities: [Post, Category],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["sqlite"],
                driverSpecific: {
                    throwOnUndefinedInFind: true,
                },
            })
        })

        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should throw an error when undefined is encountered and throwOnUndefinedInFind is enabled", () =>
            Promise.all(
                connections.map(async (connection) => {
                    // Test QueryBuilder
                    await expect(
                        connection
                            .createQueryBuilder(Post, "post")
                            .where({
                                text: undefined,
                            })
                            .getMany(),
                    ).to.be.rejectedWith(
                        "Undefined value encountered in property 'text' of the find operation. Set 'throwOnUndefinedInFind' to false in connection options to skip properties with undefined values.",
                    )

                    // Test Repository
                    await expect(
                        connection.getRepository(Post).find({
                            where: {
                                text: undefined,
                            },
                        }),
                    ).to.be.rejectedWith(
                        "Undefined value encountered in property 'text' of the find operation. Set 'throwOnUndefinedInFind' to false in connection options to skip properties with undefined values.",
                    )
                }),
            ))

        it("should throw an error when undefined is encountered in relations and throwOnUndefinedInFind is enabled", () =>
            Promise.all(
                connections.map(async (connection) => {
                    // Test QueryBuilder
                    await expect(
                        connection
                            .createQueryBuilder(Post, "post")
                            .where({
                                category: undefined,
                            })
                            .getMany(),
                    ).to.be.rejectedWith(
                        "Undefined value encountered in property 'category' of the find operation. Set 'throwOnUndefinedInFind' to false in connection options to skip properties with undefined values.",
                    )

                    // Test Repository
                    await expect(
                        connection.getRepository(Post).find({
                            where: {
                                category: undefined,
                            },
                        }),
                    ).to.be.rejectedWith(
                        "Undefined value encountered in property 'category' of the find operation. Set 'throwOnUndefinedInFind' to false in connection options to skip properties with undefined values.",
                    )
                }),
            ))

        it("should not throw when a property is not provided", () =>
            Promise.all(
                connections.map(async (connection) => {
                    // Create test data
                    const category = new Category()
                    category.name = "Category #1"
                    await connection.manager.save(category)

                    const post1 = new Post()
                    post1.title = "Post #1"
                    post1.text = "Some text"
                    post1.category = category
                    await connection.manager.save(post1)

                    // Test QueryBuilder
                    const posts1 = await connection
                        .createQueryBuilder(Post, "post")
                        .where({
                            title: "Post #1",
                        })
                        .getMany()

                    expect(posts1.length).to.equal(1)
                    expect(posts1[0].title).to.equal("Post #1")

                    // Test Repository
                    const posts2 = await connection.getRepository(Post).find({
                        where: {
                            title: "Post #1",
                        },
                    })

                    expect(posts2.length).to.equal(1)
                    expect(posts2[0].title).to.equal("Post #1")
                }),
            ))
    })

    describe("with both options enabled", () => {
        before(async () => {
            connections = await createTestingConnections({
                entities: [Post, Category],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["sqlite"],
                driverSpecific: {
                    treatJsNullAsSqlNull: true,
                    throwOnUndefinedInFind: true,
                },
            })
        })

        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        async function prepareData(connection: DataSource) {
            const category1 = new Category()
            category1.name = "Category #1"
            await connection.manager.save(category1)

            const post1 = new Post()
            post1.title = "Post #1"
            post1.text = null
            post1.category = null
            await connection.manager.save(post1)

            const post2 = new Post()
            post2.title = "Post #2"
            post2.text = "Some text"
            post2.category = category1
            await connection.manager.save(post2)
        }

        it("should handle both null and undefined correctly", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await prepareData(connection)

                    // Test null handling for text
                    const posts = await connection.getRepository(Post).find({
                        where: {
                            text: null,
                        } as any,
                    })

                    expect(posts.length).to.equal(1)
                    expect(posts[0].title).to.equal("Post #1")

                    // Test null handling for relations
                    const postsWithNullCategory = await connection
                        .getRepository(Post)
                        .find({
                            where: {
                                category: null,
                            } as any,
                        })

                    expect(postsWithNullCategory.length).to.equal(1)
                    expect(postsWithNullCategory[0].title).to.equal("Post #1")

                    // Test undefined handling for text
                    await expect(
                        connection.getRepository(Post).find({
                            where: {
                                text: undefined,
                            },
                        }),
                    ).to.be.rejectedWith(
                        "Undefined value encountered in property 'text' of the find operation. Set 'throwOnUndefinedInFind' to false in connection options to skip properties with undefined values.",
                    )

                    // Test undefined handling for relations
                    await expect(
                        connection.getRepository(Post).find({
                            where: {
                                category: undefined,
                            },
                        }),
                    ).to.be.rejectedWith(
                        "Undefined value encountered in property 'category' of the find operation. Set 'throwOnUndefinedInFind' to false in connection options to skip properties with undefined values.",
                    )

                    // Test omitted property
                    const posts2 = await connection.getRepository(Post).find({
                        where: {
                            title: "Post #2",
                        },
                    })

                    expect(posts2.length).to.equal(1)
                    expect(posts2[0].title).to.equal("Post #2")
                }),
            ))
    })
})
