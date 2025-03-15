import "reflect-metadata"
import "../../../utils/test-setup"
import { DataSource, Repository } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"
import { TypeORMError } from "../../../../src"
import { expect } from "chai"

describe("find options > null and undefined handling", () => {
    let connections: DataSource[]

    describe("with default behavior", () => {
        before(async () => {
            connections = await createTestingConnections({
                entities: [Post],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["sqlite"],
            })
        })
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        async function prepareData(connection: DataSource) {
            const post1 = new Post()
            post1.title = "Post #1"
            post1.text = "About post #1"
            await connection.manager.save(post1)

            const post2 = new Post()
            post2.title = "Post #2"
            post2.text = null
            await connection.manager.save(post2)
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
                    postsWithRepo.length.should.be.equal(2)
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
                    postsWithRepo.length.should.be.equal(2)
                }),
            ))
    })

    describe("with treatJsNullAsSqlNull enabled", () => {
        before(async () => {
            connections = await createTestingConnections({
                entities: [Post],
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

        it("should transform JS null to SQL NULL when treatJsNullAsSqlNull is enabled", () =>
            Promise.all(
                connections.map(async (connection) => {
                    // Create test data
                    const post1 = new Post()
                    post1.title = "Post #1"
                    post1.text = null
                    await connection.manager.save(post1)

                    const post2 = new Post()
                    post2.title = "Post #2"
                    post2.text = "Some text"
                    await connection.manager.save(post2)

                    // Test QueryBuilder
                    const posts1 = await connection
                        .createQueryBuilder(Post, "post")
                        .where({
                            text: null,
                        })
                        .getMany()

                    expect(posts1.length).to.equal(1)
                    expect(posts1[0].title).to.equal("Post #1")

                    // Test Repository
                    const posts2 = await connection.getRepository(Post).find({
                        where: {
                            text: null,
                        },
                    })

                    expect(posts2.length).to.equal(1)
                    expect(posts2[0].title).to.equal("Post #1")
                }),
            ))
    })

    describe("with throwOnUndefinedInFind enabled", () => {
        before(async () => {
            connections = await createTestingConnections({
                entities: [Post],
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

        it("should not throw when a property is not provided", () =>
            Promise.all(
                connections.map(async (connection) => {
                    // Create test data
                    const post1 = new Post()
                    post1.title = "Post #1"
                    post1.text = "Some text"
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
                entities: [Post],
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

        it("should handle both null and undefined correctly", () =>
            Promise.all(
                connections.map(async (connection) => {
                    // Create test data
                    const post1 = new Post()
                    post1.title = "Post #1"
                    post1.text = null
                    await connection.manager.save(post1)

                    const post2 = new Post()
                    post2.title = "Post #2"
                    post2.text = "Some text"
                    await connection.manager.save(post2)

                    // Test null handling
                    const posts = await connection.getRepository(Post).find({
                        where: {
                            text: null,
                        },
                    })

                    expect(posts.length).to.equal(1)
                    expect(posts[0].title).to.equal("Post #1")

                    // Test undefined handling
                    await expect(
                        connection.getRepository(Post).find({
                            where: {
                                text: undefined,
                            },
                        }),
                    ).to.be.rejectedWith(
                        "Undefined value encountered in property 'text' of the find operation. Set 'throwOnUndefinedInFind' to false in connection options to skip properties with undefined values.",
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
