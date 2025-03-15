import "reflect-metadata"
import "../../../utils/test-setup"
import { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"
import { TypeORMError } from "../../../../src"

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

        it("should transform JS null to SQL NULL when treatJsNullAsSqlNull is enabled", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await prepareData(connection)

                    // Test with QueryBuilder
                    const postsWithQb = await connection
                        .createQueryBuilder(Post, "post")
                        .setFindOptions({
                            where: {
                                text: null,
                            } as any,
                        })
                        .getMany()

                    // This should return only post2 since null is transformed to SQL NULL
                    postsWithQb.should.be.eql([
                        { id: 2, title: "Post #2", text: null },
                    ])

                    // Test with Repository
                    const postsWithRepo = await connection
                        .getRepository(Post)
                        .find({
                            where: {
                                text: null,
                            } as any,
                        })

                    // This should return only post2 since null is transformed to SQL NULL
                    postsWithRepo.should.be.eql([
                        { id: 2, title: "Post #2", text: null },
                    ])
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

        it("should throw an error when undefined is encountered and throwOnUndefinedInFind is enabled", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await prepareData(connection)

                    // Test with QueryBuilder
                    try {
                        await connection
                            .createQueryBuilder(Post, "post")
                            .setFindOptions({
                                where: {
                                    title: "Post #1",
                                    text: undefined,
                                },
                            })
                            .getMany()

                        throw new Error("This should not be reached")
                    } catch (error) {
                        error.should.be.instanceOf(TypeORMError)
                        error.message.should.contain(
                            "Undefined value encountered in property 'text'",
                        )
                    }

                    // Test with Repository
                    try {
                        await connection.getRepository(Post).find({
                            where: {
                                text: undefined,
                            },
                        })

                        throw new Error("This should not be reached")
                    } catch (error) {
                        error.should.be.instanceOf(TypeORMError)
                        error.message.should.contain(
                            "Undefined value encountered in property 'text'",
                        )
                    }
                }),
            ))

        it("should not throw an error for properties that are not provided", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await prepareData(connection)

                    // Test with QueryBuilder - only specify title
                    const postsWithQb = await connection
                        .createQueryBuilder(Post, "post")
                        .setFindOptions({
                            where: {
                                title: "Post #1",
                            },
                        })
                        .getMany()

                    // Should return post1 without throwing an error
                    postsWithQb.should.be.eql([
                        { id: 1, title: "Post #1", text: "About post #1" },
                    ])

                    // Test with Repository - only specify title
                    const postsWithRepo = await connection
                        .getRepository(Post)
                        .find({
                            where: {
                                title: "Post #2",
                            },
                        })

                    // Should return post2 without throwing an error
                    postsWithRepo.should.be.eql([
                        { id: 2, title: "Post #2", text: null },
                    ])
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

        it("should transform JS null to SQL NULL and throw for undefined", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await prepareData(connection)

                    // Test with QueryBuilder for null
                    const postsWithQb = await connection
                        .createQueryBuilder(Post, "post")
                        .setFindOptions({
                            where: {
                                text: null,
                            } as any,
                        })
                        .getMany()

                    // This should return only post2 since null is transformed to SQL NULL
                    postsWithQb.should.be.eql([
                        { id: 2, title: "Post #2", text: null },
                    ])

                    // Test with Repository for null
                    const postsWithRepo = await connection
                        .getRepository(Post)
                        .find({
                            where: {
                                text: null,
                            } as any,
                        })

                    // This should return only post2 since null is transformed to SQL NULL
                    postsWithRepo.should.be.eql([
                        { id: 2, title: "Post #2", text: null },
                    ])

                    // Test with QueryBuilder for undefined
                    try {
                        await connection
                            .createQueryBuilder(Post, "post")
                            .setFindOptions({
                                where: {
                                    text: undefined,
                                },
                            })
                            .getMany()

                        throw new Error("This should not be reached")
                    } catch (error) {
                        error.should.be.instanceOf(TypeORMError)
                        error.message.should.contain(
                            "Undefined value encountered in property 'text'",
                        )
                    }
                }),
            ))
    })
})
