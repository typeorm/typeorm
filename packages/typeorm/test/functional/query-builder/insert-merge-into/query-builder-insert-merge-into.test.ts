import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { expect } from "chai"
import { MoreThan } from "../../../../src"
import { Sample } from "./entity/IdentitySample"

describe("query builder > insert > merge into", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["oracle", "mssql", "sap"], // since on merge into statement is only supported in oracle, mssql and sap hana
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    describe("SQL Server identity upsert (#12962)", () => {
        let sqlServerDataSources: DataSource[]

        before(() => {
            sqlServerDataSources = dataSources.filter(
                (dataSource) => dataSource.options.type === "mssql",
            )
        })

        it("updates a loaded entity using a different conflict column", () =>
            Promise.all(
                sqlServerDataSources.map(async (dataSource) => {
                    const repository = dataSource.getRepository(Sample)
                    await repository.insert({ code: "k1", value: 1 })
                    const sample = await repository.findOneByOrFail({
                        code: "k1",
                    })
                    sample.value = 2
                    await repository.upsert(sample, ["code"])
                    expect(
                        await repository.findOneByOrFail({ code: "k1" }),
                    ).to.deep.equal(sample)
                }),
            ))

        it("preserves the matched row identity when another id is supplied", () =>
            Promise.all(
                sqlServerDataSources.map(async (dataSource) => {
                    const repository = dataSource.getRepository(Sample)
                    const sample = await repository.save({
                        code: "k1",
                        value: 1,
                    })
                    await repository.upsert({ id: 100, code: "k1", value: 2 }, [
                        "code",
                    ])
                    expect(
                        await repository.findOneByOrFail({ code: "k1" }),
                    ).to.deep.equal({ id: sample.id, code: "k1", value: 2 })
                }),
            ))

        it("splits supplied and generated identities in a mixed batch", () =>
            Promise.all(
                sqlServerDataSources.map(async (dataSource) => {
                    const repository = dataSource.getRepository(Sample)
                    const existing = await repository.save({
                        code: "k1",
                        value: 1,
                    })
                    await repository.upsert(
                        [
                            { id: existing.id, code: "k1", value: 2 },
                            { id: 100, code: "k2", value: 3 },
                            { code: "k3", value: 3 },
                            { id: 102, code: "k4", value: 4 },
                        ],
                        ["code"],
                    )
                    expect(
                        await repository.find({ order: { code: "ASC" } }),
                    ).to.deep.equal([
                        { id: existing.id, code: "k1", value: 2 },
                        { id: 100, code: "k2", value: 3 },
                        { id: 101, code: "k3", value: 3 },
                        { id: 102, code: "k4", value: 4 },
                    ])
                }),
            ))

        it("supports the identity as the conflict path", () =>
            Promise.all(
                sqlServerDataSources.map(async (dataSource) => {
                    const repository = dataSource.getRepository(Sample)
                    await repository.upsert({ id: 100, code: "k1", value: 1 }, [
                        "id",
                    ])
                    await repository.upsert({ id: 100, code: "k1", value: 2 }, [
                        "id",
                    ])
                    expect(
                        await repository.findOneByOrFail({ id: 100 }),
                    ).to.deep.equal({ id: 100, code: "k1", value: 2 })
                }),
            ))

        it("does not update when only the supplied identity differs", () =>
            Promise.all(
                sqlServerDataSources.map(async (dataSource) => {
                    const repository = dataSource.getRepository(Sample)
                    const sample = await repository.save({
                        code: "k1",
                        value: 1,
                    })
                    const result = await repository.upsert(
                        { id: 100, code: "k1", value: 1 },
                        {
                            conflictPaths: ["code"],
                            skipUpdateIfNoValuesChanged: true,
                        },
                    )
                    expect(result.raw).to.have.length(0)
                    expect(
                        await repository.findOneByOrFail({ code: "k1" }),
                    ).to.deep.equal(sample)
                }),
            ))

        it("omits identity-only updates", () =>
            Promise.all(
                sqlServerDataSources.map(async (dataSource) => {
                    const repository = dataSource.getRepository(Sample)
                    const sample = await repository.save({
                        code: "k1",
                        value: 1,
                    })
                    await repository.upsert({ id: 100, code: "k1" }, ["code"])
                    expect(
                        await repository.findOneByOrFail({ code: "k1" }),
                    ).to.deep.equal(sample)
                }),
            ))

        it("generates identities when IDs are omitted", () =>
            Promise.all(
                sqlServerDataSources.map(async (dataSource) => {
                    const repository = dataSource.getRepository(Sample)
                    await repository.upsert({ code: "k1", value: 1 }, ["code"])
                    const sample = await repository.findOneByOrFail({
                        code: "k1",
                    })
                    await repository.upsert({ code: "k1", value: 2 }, ["code"])
                    expect(
                        await repository.findOneByOrFail({ code: "k1" }),
                    ).to.deep.equal({ id: sample.id, code: "k1", value: 2 })
                }),
            ))

        it("clears IDENTITY_INSERT after a failed upsert", () =>
            Promise.all(
                sqlServerDataSources.map(async (dataSource) => {
                    const repository = dataSource.getRepository(Sample)
                    await repository.save({ code: "k1", value: 1 })
                    await dataSource.query(
                        `CREATE TRIGGER fail_identity_upsert ON sample AFTER INSERT AS BEGIN THROW 50001, 'forced identity upsert failure', 1; END`,
                    )
                    try {
                        await repository.upsert(
                            { id: 100, code: "k2", value: 2 },
                            ["code"],
                        ).should.be.rejected
                    } finally {
                        await dataSource.query(
                            "DROP TRIGGER fail_identity_upsert",
                        )
                    }
                    await repository.insert({ code: "k2", value: 3 })
                    expect(
                        (await repository.findOneByOrFail({ code: "k2" })).id,
                    ).to.be.greaterThan(1)
                }),
            ))
    })

    it("should perform insertion correctly using orIgnore", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post1 = new Post()
                post1.id = "post#1"
                post1.title = "About post"
                post1.published = false
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
                post2.published = false
                post2.date = new Date("06 Aug 2020 00:12:00 GMT")

                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post2)
                    .orIgnore("date")
                    .execute()

                await dataSource.manager
                    .findOneBy(Post, {
                        id: "post#1",
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
            dataSources.map(async (dataSource) => {
                const post1 = new Post()
                post1.id = "post#1"
                post1.title = "About post"
                post1.published = true
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
                post2.published = false
                post2.date = new Date("06 Aug 2020 00:12:00 GMT")

                await dataSource
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

                await dataSource.manager
                    .findOneBy(Post, {
                        id: "post#1",
                    })
                    .should.eventually.be.eql({
                        id: "post#1",
                        title: "About post",
                        published: true,
                        date: new Date("06 Aug 2020 00:12:00 GMT"),
                    })

                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post2)
                    .orUpdate(["title"], ["date"])
                    .setParameter("title", post2.title)
                    .execute()

                await dataSource.manager
                    .findOneBy(Post, {
                        id: "post#1",
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
            dataSources.map(async (dataSource) => {
                const post1 = new Post()
                post1.id = "post#1"
                post1.title = "About post"
                post1.published = false
                post1.date = new Date("06 Aug 2020 00:12:00 GMT")

                const sql = dataSource.manager
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
                if (dataSource.options.type === "mssql") {
                    expect(sql).to.equal(
                        `MERGE INTO post post USING (VALUES (@0, @1, @2, @3)) mergeIntoSource (id, title, published, date) ON (post.date = mergeIntoSource.date) ` +
                            `WHEN MATCHED AND post.date > @4 AND post.title != mergeIntoSource.title THEN UPDATE SET post.title = mergeIntoSource.title ` +
                            `WHEN NOT MATCHED THEN INSERT(id, title, published, date) VALUES (mergeIntoSource.id, mergeIntoSource.title, mergeIntoSource.published, mergeIntoSource.date);`,
                    )
                } else if (dataSource.options.type === "sap") {
                    expect(sql).to.equal(
                        `MERGE INTO post post USING (SELECT ? AS id, ? AS title, ? AS published, ? AS date FROM SYS.DUMMY) mergeIntoSource ON (post.date = mergeIntoSource.date) ` +
                            `WHEN MATCHED AND post.date > ? AND post.title != mergeIntoSource.title THEN UPDATE SET post.title = mergeIntoSource.title ` +
                            `WHEN NOT MATCHED THEN INSERT(id, title, published, date) VALUES (mergeIntoSource.id, mergeIntoSource.title, mergeIntoSource.published, mergeIntoSource.date)`,
                    )
                } else if (dataSource.options.type === "oracle") {
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
            dataSources.map(async (dataSource) => {
                if (
                    !dataSource.driver.supportedUpsertTypes.includes(
                        "on-duplicate-key-update",
                    )
                )
                    return
                const post1 = new Post()
                post1.id = "post#1"
                post1.title = "About post"
                post1.date = new Date("06 Aug 2020 00:12:00 GMT")

                const builder = dataSource.manager
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
