import { expect } from "chai"
import "reflect-metadata"

import { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Category } from "./entity/Category"
import { Post } from "./entity/Post"
import { DriverUtils } from "../../../../src/driver/DriverUtils"

describe("query builder > insert > on conflict", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Category, Post],
            enabledDrivers: [
                "cockroachdb",
                "postgres",
                "sqlite",
                "better-sqlite3",
            ], // since on conflict statement is only supported in postgres and sqlite >= 3.24.0
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should perform insertion correctly using onConflict", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post1 = new Post()
                post1.id = "post#1"
                post1.title = "About post"
                post1.date = new Date("06 Aug 2020 00:12:00 GMT")

                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post1)
                    .execute()

                const post2 = new Post()
                post2.id = "post#1"
                post2.title = "Again post"
                post2.date = new Date("06 Aug 2020 00:12:00 GMT")

                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post2)
                    .onConflict(`("id") DO NOTHING`)
                    .execute()

                await dataSource.manager
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

                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post2)
                    .onConflict(`("id") DO UPDATE SET "title" = :title`)
                    .setParameter("title", post2.title)
                    .execute()

                await dataSource.manager
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

    it("should support alias in insert using onConflict", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (!DriverUtils.isPostgresFamily(dataSource.driver)) {
                    return
                }

                const post1 = new Post()
                post1.id = "post#1"
                post1.title = "About post"
                post1.date = new Date("06 Aug 2020 00:12:01 GMT")

                const post2 = new Post()
                post2.id = "post#2"
                post2.title = "Again post"
                post2.date = new Date("06 Aug 2020 00:12:02 GMT")

                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values([post1, post2])
                    .orIgnore()
                    .execute()

                await dataSource.manager
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

                await dataSource
                    .createQueryBuilder(Post, "p")
                    .insert()
                    .values([post1, post2])
                    .onConflict(
                        `("id") DO UPDATE SET "title" = excluded.title, "date" = excluded.date WHERE p.title != excluded.title`,
                    )
                    .setParameter("title", post2.title)
                    .execute()

                await dataSource.manager
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
            dataSources.map(async (dataSource) => {
                const post1 = new Post()
                post1.id = "post#1"
                post1.title = "About post"
                post1.date = new Date("06 Aug 2020 00:12:00 GMT")

                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post1)
                    .execute()

                const post2 = new Post()
                post2.id = "post#1"
                post2.title = "Again post"
                post2.date = new Date("06 Aug 2020 00:12:00 GMT")

                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post2)
                    .orIgnore("date")
                    .execute()

                await dataSource.manager
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
            }),
        ))

    it("should perform insertion correctly using orUpdate", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post1 = new Post()
                post1.id = "post#1"
                post1.title = "About post"
                post1.date = new Date("06 Aug 2020 00:12:00 GMT")

                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post1)
                    .execute()

                const post2 = new Post()
                post2.id = "post#1"
                post2.title = "Again post"
                post2.date = new Date("06 Aug 2020 00:12:00 GMT")

                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post2)
                    .orUpdate(["title"], ["date"])
                    .setParameter("title", post2.title)
                    .execute()

                await dataSource.manager
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

    it("should perform insertion on partial index using orUpdate", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (!DriverUtils.isPostgresFamily(dataSource.driver)) {
                    return
                }

                const post1 = new Post()
                post1.id = "post#1"
                post1.title = "About post"
                post1.date = new Date("06 Aug 2020 00:12:00 GMT")

                const sql = dataSource.manager
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post1)
                    .orUpdate(["title"], ["date"], {
                        indexPredicate: "date > 2020-01-01",
                    })
                    .setParameter("title", post1.title)
                    .disableEscaping()
                    .getSql()

                expect(sql).to.equal(
                    `INSERT INTO post(id, title, date) ` +
                        `VALUES ($1, $2, $3) ON CONFLICT ( date ) ` +
                        `WHERE ( date > 2020-01-01 ) DO UPDATE SET title = EXCLUDED.title`,
                )
            }),
        ))

    it("should perform insertion correctly using orUpdate with condition", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (!DriverUtils.isPostgresFamily(dataSource.driver)) {
                    return
                }
                const post1 = new Post()
                post1.id = "post#1"
                post1.title = "About post"
                post1.date = new Date("06 Aug 2020 00:12:00 GMT")

                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post1)
                    .execute()

                const post2 = new Post()
                post2.id = "post#2"
                post2.title = "Next post"
                post2.date = new Date("06 Aug 2020 00:13:00 GMT")

                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post2)
                    .execute()

                const post3 = new Post()
                post3.id = "post#3"
                post3.title = "Again post"
                post3.date = new Date("06 Aug 2020 00:12:00 GMT")

                const builder = dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post3)
                    .orUpdate(["title"], ["date"], {
                        overwriteCondition: {
                            where: { title: post1.title },
                        },
                    })

                const sql = builder.getSql()

                expect(sql).to.equal(
                    `INSERT INTO "post"("id", "title", "date") ` +
                        `VALUES ($1, $2, $3) ON CONFLICT ( "date" ) ` +
                        `DO UPDATE SET "title" = EXCLUDED."title" WHERE "post"."title" = $4`,
                )

                await builder.execute()

                await dataSource.manager
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
    it("should perform insertion using partial index and skipping update on no change", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (dataSource.driver.options.type !== "postgres") {
                    return
                }

                const post1 = new Post()
                post1.id = "post#1"
                post1.title = "About post"
                post1.date = new Date("06 Aug 2020 00:12:00 GMT")

                const sql = dataSource.manager
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post1)
                    .orUpdate(["title"], ["date"], {
                        skipUpdateIfNoValuesChanged: true,
                        indexPredicate: "date > 2020-01-01",
                    })
                    .setParameter("title", post1.title)
                    .disableEscaping()
                    .getSql()

                expect(sql).to.equal(
                    `INSERT INTO post(id, title, date) ` +
                        `VALUES ($1, $2, $3) ON CONFLICT ( date ) ` +
                        `WHERE ( date > 2020-01-01 ) DO UPDATE SET title = EXCLUDED.title ` +
                        `WHERE post.title IS DISTINCT FROM EXCLUDED.title`,
                )
            }),
        ))

    it("should support alias in insert using orUpdate", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (!DriverUtils.isPostgresFamily(dataSource.driver)) {
                    return
                }

                const categoryRepo = dataSource.getRepository(Category)

                const initialCategories = ["Documents", "Applications"].map(
                    (name, id) => ({ id, name }),
                )
                await categoryRepo.save(initialCategories)

                const mockCategories = ["Video", "Photo", "Audio"].map(
                    (name, index) => ({ id: index + 1, name }),
                )
                const query = categoryRepo
                    .createQueryBuilder()
                    .insert()
                    .values(mockCategories)
                    .orUpdate(["name"], ["id"], {
                        skipUpdateIfNoValuesChanged: true,
                    })

                expect(query.getSql()).to.equal(
                    `INSERT INTO "category" AS "Category"("id", "name") ` +
                        `VALUES ($1, $2), ($3, $4), ($5, $6) ` +
                        `ON CONFLICT ( "id" ) DO UPDATE ` +
                        `SET "name" = EXCLUDED."name" ` +
                        `WHERE "Category"."name" IS DISTINCT FROM EXCLUDED."name"`,
                )
                expect(await query.execute()).not.to.throw

                const categories = await categoryRepo.find({
                    order: { id: "ASC" },
                })
                expect(categories).to.deep.equal([
                    { id: 0, name: "Documents" },
                    { id: 1, name: "Video" },
                    { id: 2, name: "Photo" },
                    { id: 3, name: "Audio" },
                ])
            }),
        ))

    it("should throw error if using indexPredicate and an unsupported driver", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (
                    !dataSource.driver.supportedUpsertTypes.includes(
                        "on-duplicate-key-update",
                    )
                ) {
                    return
                }

                const post1 = new Post()
                post1.id = "post#1"
                post1.title = "About post"
                post1.date = new Date("06 Aug 2020 00:12:00 GMT")

                const sql = dataSource.manager
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post1)
                    .orUpdate(["title"], ["date"], {
                        indexPredicate: "date > 2020-01-01",
                    })
                    .setParameter("title", post1.title)
                    .disableEscaping()
                    .getSql()

                expect(sql).to.throw(Error)
            }),
        ))
})
