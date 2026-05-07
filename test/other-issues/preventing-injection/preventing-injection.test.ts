import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import { Post } from "./entity/Post"
import { expect } from "chai"
import { EntityPropertyNotFoundError } from "../../../src/error/EntityPropertyNotFoundError"

describe("other issues > preventing-injection", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should not allow selection of non-exist columns via FindOptions", () =>
        Promise.all(
            connections.map(async function (connection) {
                const post = new Post()
                post.title = "hello"
                await connection.manager.save(post)

                const postWithOnlyIdSelected = await connection.manager.find(
                    Post,
                    {
                        select: { id: true },
                    },
                )
                postWithOnlyIdSelected.should.be.eql([{ id: 1 }])

                await connection.manager.find(Post, {
                    select: "(WHERE LIMIT 1)" as any,
                }).should.be.rejected
            }),
        ))

    it("should throw error for non-exist columns in where expression via FindOptions", () =>
        Promise.all(
            connections.map(async function (connection) {
                const post = new Post()
                post.title = "hello"
                await connection.manager.save(post)

                const postWithOnlyIdSelected = await connection.manager.find(
                    Post,
                    {
                        where: {
                            title: "hello",
                        },
                    },
                )
                postWithOnlyIdSelected.should.be.eql([
                    { id: 1, title: "hello" },
                ])

                let error: Error | undefined
                try {
                    await connection.manager.find(Post, {
                        where: {
                            id: 2,
                            ["(WHERE LIMIT 1)"]: "hello",
                        } as any,
                    })
                } catch (err) {
                    error = err
                }
                expect(error).to.be.an.instanceof(EntityPropertyNotFoundError)
            }),
        ))

    it("should not allow selection of non-exist columns via FindOptions", () =>
        Promise.all(
            connections.map(async function (connection) {
                const post = new Post()
                post.title = "hello"
                await connection.manager.save(post)

                const loadedPosts = await connection.manager.find(Post, {
                    order: {
                        title: "DESC",
                    },
                })
                loadedPosts.should.be.eql([{ id: 1, title: "hello" }])

                await connection.manager.find(Post, {
                    order: {
                        ["(WHERE LIMIT 1)" as any]: "DESC",
                    },
                }).should.be.rejected
            }),
        ))

    it("should not allow non-numeric values in skip and take via FindOptions", () =>
        Promise.all(
            connections.map(async function (connection) {
                await connection.manager.find(Post, {
                    take: "(WHERE XXX)" as any,
                }).should.be.rejected

                await connection.manager.find(Post, {
                    skip: "(WHERE LIMIT 1)" as any,
                    take: "(WHERE XXX)" as any,
                }).should.be.rejected
            }),
        ))

    it("should not allow non-numeric values in skip and take in QueryBuilder", () => {
        connections.forEach((connection) => {
            expect(() => {
                connection.manager
                    .createQueryBuilder(Post, "post")
                    .take("(WHERE XXX)" as any)
            }).to.throw(Error)

            expect(() => {
                connection.manager
                    .createQueryBuilder(Post, "post")
                    .skip("(WHERE LIMIT 1)" as any)
            }).to.throw(Error)
        })
    })

    it("should not allow non-allowed values in order by in QueryBuilder", () => {
        connections.forEach((connection) => {
            expect(() => {
                connection.manager
                    .createQueryBuilder(Post, "post")
                    .orderBy("post.id", "MIX" as any)
            }).to.throw(Error)

            expect(() => {
                connection.manager
                    .createQueryBuilder(Post, "post")
                    .orderBy("post.id", "DESC", "SOMETHING LAST" as any)
            }).to.throw(Error)
        })
    })

    it("should not allow non-allowed values in order by on UpdateQueryBuilder", () => {
        connections.forEach((connection) => {
            expect(() => {
                connection
                    .createQueryBuilder()
                    .update(Post)
                    .set({ title: "test" })
                    // @ts-expect-error intentionally invalid order direction
                    .orderBy("id", "ASC, (SELECT SLEEP(2))")
            }).to.throw(/Invalid order direction/)

            expect(() => {
                connection
                    .createQueryBuilder()
                    .update(Post)
                    .set({ title: "test" })
                    .orderBy("id")
                    // @ts-expect-error intentionally invalid order direction
                    .addOrderBy("title", "DESC; DROP TABLE post")
            }).to.throw(/Invalid order direction/)

            expect(() => {
                connection
                    .createQueryBuilder()
                    .update(Post)
                    .set({ title: "test" })
                    .orderBy(
                        "id",
                        "ASC",
                        // @ts-expect-error intentionally invalid nulls
                        "NULLS FIRST; DROP TABLE post",
                    )
            }).to.throw(/Invalid nulls option/)

            expect(() => {
                connection
                    .createQueryBuilder()
                    .update(Post)
                    .set({ title: "test" })
                    .orderBy({ id: "ASC; DROP TABLE post" } as any)
            }).to.throw(/Invalid order direction/)

            expect(() => {
                connection
                    .createQueryBuilder()
                    .update(Post)
                    .set({ title: "test" })
                    .orderBy({
                        id: {
                            order: "ASC; DROP TABLE post",
                            nulls: "NULLS FIRST",
                        },
                    } as any)
            }).to.throw(/Invalid order direction/)

            expect(() => {
                connection
                    .createQueryBuilder()
                    .update(Post)
                    .set({ title: "test" })
                    .orderBy({
                        id: {
                            order: "ASC",
                            nulls: "NULLS FIRST; DROP TABLE post",
                        },
                    } as any)
            }).to.throw(/Invalid nulls option/)

            expect(() => {
                connection
                    .createQueryBuilder()
                    .update(Post)
                    .set({ title: "test" })
                    .orderBy("id", "ASC")
            }).to.not.throw()

            expect(() => {
                connection
                    .createQueryBuilder()
                    .update(Post)
                    .set({ title: "test" })
                    .orderBy("id", "DESC")
            }).to.not.throw()
        })
    })

    it("should not allow non-allowed values in order by on SoftDeleteQueryBuilder", () => {
        connections.forEach((connection) => {
            expect(() => {
                connection
                    .createQueryBuilder()
                    .softDelete()
                    .from(Post)
                    // @ts-expect-error intentionally invalid order direction
                    .orderBy("id", "ASC, (SELECT SLEEP(2))")
            }).to.throw(/Invalid order direction/)

            expect(() => {
                connection
                    .createQueryBuilder()
                    .softDelete()
                    .from(Post)
                    .orderBy("id")
                    // @ts-expect-error intentionally invalid order direction
                    .addOrderBy("title", "DESC; DROP TABLE post")
            }).to.throw(/Invalid order direction/)

            expect(() => {
                connection.createQueryBuilder().softDelete().from(Post).orderBy(
                    "id",
                    "ASC",
                    // @ts-expect-error intentionally invalid nulls
                    "NULLS FIRST; DROP TABLE post",
                )
            }).to.throw(/Invalid nulls option/)

            expect(() => {
                connection
                    .createQueryBuilder()
                    .softDelete()
                    .from(Post)
                    .orderBy({ id: "ASC; DROP TABLE post" } as any)
            }).to.throw(/Invalid order direction/)

            expect(() => {
                connection
                    .createQueryBuilder()
                    .softDelete()
                    .from(Post)
                    .orderBy({
                        id: {
                            order: "ASC; DROP TABLE post",
                            nulls: "NULLS FIRST",
                        },
                    } as any)
            }).to.throw(/Invalid order direction/)

            expect(() => {
                connection
                    .createQueryBuilder()
                    .softDelete()
                    .from(Post)
                    .orderBy({
                        id: {
                            order: "ASC",
                            nulls: "NULLS FIRST; DROP TABLE post",
                        },
                    } as any)
            }).to.throw(/Invalid nulls option/)
        })
    })
})
