import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("query builder > insertion > on conflict", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: [
                    "postgres",
                    "sqlite",
                    "better-sqlite3",
                    "oracle",
                    "mssql",
                ], // since on conflict statement is only supported in postgres and sqlite >= 3.24.0
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should perform insertion correctly using onConflict", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Unfortunately, ON CONFLICT is dialect-specific, skip it for time being
                if (['mssql', 'oracle'].includes(connection.driver.options.type)) {
                    return
                }

                const post1 = new Post()
                post1.id = "post#1"
                post1.title = "About post"
                post1.date = new Date("06 Aug 2020 00:12:00 GMT")

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post1)
                    .execute()

                const post2 = new Post()
                post2.id = "post#1"
                post2.title = "Again post"
                post2.date = new Date("06 Aug 2020 00:12:00 GMT")

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post2)
                    .onConflict(`("id") DO NOTHING`)
                    .execute()

                await connection.manager
                    .findOne(Post, {
                        where: {
                            id: "post#1",
                        },
                    })
                    .should.eventually.be.eql({
                        id: "post#1",
                        title: "About post",
                        date: new Date("06 Aug 2020 00:12:00 GMT"),
                    })

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post2)
                    .onConflict(`("id") DO UPDATE SET "title" = :title`)
                    .setParameter("title", post2.title)
                    .execute()

                await connection.manager
                    .findOne(Post, {
                        where: {
                            id: "post#1",
                        },
                    })
                    .should.eventually.be.eql({
                        id: "post#1",
                        title: "Again post",
                        date: new Date("06 Aug 2020 00:12:00 GMT"),
                    })
            }),
        ))

    it("should support alias in insert", () =>
        Promise.all(
            connections.map(async (connection) => {
                if (connection.driver.options.type !== "postgres") return

                const post1 = new Post()
                post1.id = "post#1"
                post1.title = "About post"
                post1.date = new Date("06 Aug 2020 00:12:01 GMT")

                const post2 = new Post()
                post2.id = "post#2"
                post2.title = "Again post"
                post2.date = new Date("06 Aug 2020 00:12:02 GMT")

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values([post1, post2])
                    .orIgnore()
                    .execute()

                await connection.manager
                    .find(Post, {
                        order: {
                            id: "ASC",
                        },
                    })
                    .should.eventually.be.eql([
                        {
                            id: "post#1",
                            title: "About post",
                            date: new Date("06 Aug 2020 00:12:01 GMT"),
                        },
                        {
                            id: "post#2",
                            title: "Again post",
                            date: new Date("06 Aug 2020 00:12:02 GMT"),
                        },
                    ])

                post1.date = new Date("07 Aug 2020 00:12:03 GMT")

                post2.title = "Edited post"
                post2.date = new Date("07 Aug 2020 00:12:04 GMT")

                await connection
                    .createQueryBuilder(Post, "p")
                    .insert()
                    .values([post1, post2])
                    .onConflict(
                        `("id") DO UPDATE SET "title" = excluded.title, "date" = excluded.date WHERE p.title != excluded.title`,
                    )
                    .setParameter("title", post2.title)
                    .execute()

                await connection.manager
                    .find(Post, {
                        order: {
                            id: "ASC",
                        },
                    })
                    .should.eventually.be.eql([
                        {
                            id: "post#1",
                            title: "About post",
                            date: new Date("06 Aug 2020 00:12:01 GMT"),
                        },
                        {
                            id: "post#2",
                            title: "Edited post",
                            date: new Date("07 Aug 2020 00:12:04 GMT"),
                        },
                    ])
            }),
        ))

    it("should perform insertion correctly using orIgnore", () =>
        Promise.all(
            connections.map(async (connection) => {
                const post1 = new Post()
                post1.id = "post#1"
                post1.title = "About post"
                post1.date = new Date("06 Aug 2020 00:12:00 GMT")

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post1)
                    .execute()

                const post2 = new Post()
                post2.id = "post#2"
                post2.title = "Preorder post"
                post2.date = new Date("07 Aug 2020 00:12:00 GMT")

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post1)
                    .execute()

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post2)
                    .execute()

                const post3 = new Post()
                post3.id = "post#1"
                post3.title = "Again post"
                post3.date = new Date("06 Aug 2020 00:12:00 GMT")

                const post4 = new Post()
                post4.id = "post#2"
                post4.title = "Another post"
                post4.date = new Date("07 Aug 2020 00:12:00 GMT")

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values([post3, post4])
                    .orIgnore("date")
                    .execute()

                await connection.manager
                    .findOne(Post, {
                        where: {
                            id: "post#1",
                        },
                    })
                    .should.eventually.be.eql({
                        id: "post#1",
                        title: "About post",
                        date: new Date("06 Aug 2020 00:12:00 GMT"),
                    })
                await connection.manager
                    .findOne(Post, {
                        where: {
                            id: "post#2",
                        },
                    })
                    .should.eventually.be.eql({
                        id: "post#2",
                        title: "Another post",
                        date: new Date("07 Aug 2020 00:12:00 GMT"),
                    })
            }),
        ))

    it("should perform insertion correctly using orUpdate", () =>
        Promise.all(
            connections.map(async (connection) => {
                const post1 = new Post()
                post1.id = "post#1"
                post1.title = "About post"
                post1.date = new Date("06 Aug 2020 00:12:00 GMT")

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post1)
                    .execute()

                const post2 = new Post()
                post2.id = "post#1"
                post2.title = "Again post"
                post2.date = new Date("06 Aug 2020 00:12:00 GMT")

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post2)
                    .orUpdate(["title"], ["date"])
                    .setParameter("title", post2.title)
                    .execute()

                await connection.manager
                    .findOne(Post, {
                        where: {
                            id: "post#1",
                        },
                    })
                    .should.eventually.be.eql({
                        id: "post#1",
                        title: "Again post",
                        date: new Date("06 Aug 2020 00:12:00 GMT"),
                    })
            }),
        ))
})
