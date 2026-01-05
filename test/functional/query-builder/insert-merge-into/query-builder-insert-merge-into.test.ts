import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { expect } from "chai"
import { MoreThan } from "../../../../src"

describe("query builder > insert > merge into", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["oracle", "mssql", "sap"], // since on merge into statement is only supported in oracle, mssql and sap hana
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should perform insertion correctly using orIgnore", () =>
        Promise.all(
            connections.map(async (connection) => {
                const post1 = new Post()
                post1.id = "post#1"
                post1.title = "About post"
                post1.published = false
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
                post2.published = false
                post2.date = new Date("06 Aug 2020 00:12:00 GMT")

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post2)
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
                        published: false,
                        date: new Date("06 Aug 2020 00:12:00 GMT"),
                    })
            }),
        ))

    it("should perform insertion correctly using orUpdate", () =>
        Promise.all(
            connections.map(async (connection) => {
                const post1 = new Post()
                post1.id = "post#1"
                post1.title = "About post"
                post1.published = true
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
                post2.published = false
                post2.date = new Date("06 Aug 2020 00:12:00 GMT")

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post2)
                    .orUpdate(["title"], ["date"], {
                        overwriteCondition: {
                            where: {
                                published: false,
                            },
                        },
                    })
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
                        title: "About post",
                        published: true,
                        date: new Date("06 Aug 2020 00:12:00 GMT"),
                    })

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
                        published: true,
                        date: new Date("06 Aug 2020 00:12:00 GMT"),
                    })
            }),
        ))

    it("should perform insertion using overwrite condition and skipping update on no change", () =>
        Promise.all(
            connections.map(async (connection) => {
                const post1 = new Post()
                post1.id = "post#1"
                post1.title = "About post"
                post1.published = false
                post1.date = new Date("06 Aug 2020 00:12:00 GMT")

                const sql = connection.manager
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post1)
                    .orUpdate(["title"], ["date"], {
                        skipUpdateIfNoValuesChanged: true,
                        overwriteCondition: {
                            where: { date: MoreThan("2020-01-01") },
                        },
                    })
                    .setParameter("title", post1.title)
                    .disableEscaping()
                    .getSql()
                if (connection.options.type === "mssql") {
                    expect(sql).to.equal(
                        `MERGE INTO post post USING (VALUES (@0, @1, @2, @3)) mergeIntoSource (id, title, published, date) ON (post.date = mergeIntoSource.date) ` +
                            `WHEN MATCHED AND post.date > @4 AND post.title != mergeIntoSource.title THEN UPDATE SET post.title = mergeIntoSource.title ` +
                            `WHEN NOT MATCHED THEN INSERT(id, title, published, date) VALUES (mergeIntoSource.id, mergeIntoSource.title, mergeIntoSource.published, mergeIntoSource.date);`,
                    )
                } else if (connection.options.type === "sap") {
                    expect(sql).to.equal(
                        `MERGE INTO post post USING (SELECT ? AS id, ? AS title, ? AS published, ? AS date FROM SYS.DUMMY) mergeIntoSource ON (post.date = mergeIntoSource.date) ` +
                            `WHEN MATCHED AND post.date > ? AND post.title != mergeIntoSource.title THEN UPDATE SET post.title = mergeIntoSource.title ` +
                            `WHEN NOT MATCHED THEN INSERT(id, title, published, date) VALUES (mergeIntoSource.id, mergeIntoSource.title, mergeIntoSource.published, mergeIntoSource.date)`,
                    )
                } else if (connection.options.type === "oracle") {
                    expect(sql).to.equal(
                        `MERGE INTO post post USING (SELECT :1 AS id, :2 AS title, :3 AS published, :4 AS date FROM DUAL) mergeIntoSource ON (post.date = mergeIntoSource.date) ` +
                            `WHEN MATCHED THEN UPDATE SET post.title = mergeIntoSource.title WHERE post.date > :5 AND post.title != mergeIntoSource.title ` +
                            `WHEN NOT MATCHED THEN INSERT(id, title, published, date) VALUES (mergeIntoSource.id, mergeIntoSource.title, mergeIntoSource.published, mergeIntoSource.date)`,
                    )
                }
            }),
        ))

    it("should throw error if using indexPredicate and an unsupported driver", () =>
        Promise.all(
            connections.map(async (connection) => {
                if (
                    !connection.driver.supportedUpsertTypes.includes(
                        "on-duplicate-key-update",
                    )
                )
                    return
                const post1 = new Post()
                post1.id = "post#1"
                post1.title = "About post"
                post1.date = new Date("06 Aug 2020 00:12:00 GMT")

                const builder = connection.manager
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post1)
                    .orUpdate(["title"], ["date"], {
                        indexPredicate: "date > 2020-01-01",
                    })
                    .setParameter("title", post1.title)
                    .disableEscaping()

                expect(builder.getSql).to.throw(Error)
            }),
        ))
})
