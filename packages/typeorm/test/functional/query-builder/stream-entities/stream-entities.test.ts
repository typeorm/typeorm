import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { expect } from "chai"
import { Post } from "./entity/Post"
import { Comment } from "./entity/Comment"
import { Bookmark } from "./entity/Bookmark"
import { Audited } from "./entity/Audited"
import { Note } from "./entity/Note"

// see https://github.com/typeorm/typeorm/issues/12714
describe("query builder > stream entities", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post, Comment, Bookmark, Audited, Note],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    // These cover the validation performed before any streaming begins, so they
    // run on drivers that do not implement QueryRunner.stream (sqlite).
    // Hydration across chunk boundaries needs a streaming driver and is covered
    // separately.

    it("throws when the query is not ordered by the root primary key", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const qb = dataSource
                    .createQueryBuilder(Post, "post")
                    .leftJoinAndSelect("post.comments", "comment")
                    .orderBy("post.title", "ASC")

                expect(() => qb.streamEntities()).to.throw(
                    /ordered by the root primary key/,
                )
            }),
        ))

    it("throws when ordering starts with a non primary key column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const qb = dataSource
                    .createQueryBuilder(Post, "post")
                    .orderBy("post.title", "ASC")
                    .addOrderBy("post.id", "ASC")

                expect(() => qb.streamEntities()).to.throw(
                    /ordered by the root primary key/,
                )
            }),
        ))

    it("accepts a query ordered by the root primary key", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const qb = dataSource
                    .createQueryBuilder(Post, "post")
                    .leftJoinAndSelect("post.comments", "comment")
                    .orderBy("post.id", "ASC")

                expect(() => qb.streamEntities()).to.not.throw()
            }),
        ))

    it('throws when the "query" relation load strategy is used', () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const qb = dataSource
                    .createQueryBuilder(Post, "post")
                    .setFindOptions({ relationLoadStrategy: "query" })
                    .orderBy("post.id", "ASC")

                expect(() => qb.streamEntities()).to.throw(
                    /does not support the "query" relation load strategy/,
                )
            }),
        ))

    it('throws when the data source defaults to the "query" strategy', () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const qb = dataSource
                    .createQueryBuilder(Post, "post")
                    .orderBy("post.id", "ASC")
                qb.expressionMap.relationLoadStrategy = "query"

                expect(() => qb.streamEntities()).to.throw(
                    /does not support the "query" relation load strategy/,
                )
            }),
        ))

    it("throws when relation ids are loaded", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const qb = dataSource
                    .createQueryBuilder(Post, "post")
                    .loadRelationIdAndMap("post.commentIds", "post.comments")
                    .orderBy("post.id", "ASC")

                expect(() => qb.streamEntities()).to.throw(
                    /does not support relation id loading/,
                )
            }),
        ))

    it('throws when "take" is combined with a join', () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const qb = dataSource
                    .createQueryBuilder(Post, "post")
                    .leftJoinAndSelect("post.comments", "comment")
                    .orderBy("post.id", "ASC")
                    .take(2)

                expect(() => qb.streamEntities()).to.throw(
                    /together with joins/,
                )
            }),
        ))

    it('allows "take" when there is no join to inflate the row count', () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const qb = dataSource
                    .createQueryBuilder(Post, "post")
                    .orderBy("post.id", "ASC")
                    .take(2)

                expect(() => qb.streamEntities()).to.not.throw()
            }),
        ))

    it("throws on an optimistic lock", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const qb = dataSource
                    .createQueryBuilder(Post, "post")
                    .orderBy("post.id", "ASC")
                    .setLock("optimistic", 1)

                expect(() => qb.streamEntities()).to.throw()
            }),
        ))

    it("throws on a pessimistic lock outside a transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const qb = dataSource
                    .createQueryBuilder(Post, "post")
                    .orderBy("post.id", "ASC")
                    .setLock("pessimistic_write")

                expect(() => qb.streamEntities()).to.throw()
            }),
        ))

    it("throws on a fractional or non finite chunk size", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const build = () =>
                    dataSource
                        .createQueryBuilder(Post, "post")
                        .orderBy("post.id", "ASC")

                for (const chunkSize of [1.5, NaN, Infinity]) {
                    expect(() =>
                        build().streamEntities({ chunkSize }),
                    ).to.throw(/positive integer/)
                }
            }),
        ))

    it("throws when the entity carries a @RelationId decorator", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const qb = dataSource
                    .createQueryBuilder(Bookmark, "bookmark")
                    .orderBy("bookmark.id", "ASC")

                expect(() => qb.streamEntities()).to.throw(
                    /does not support relation id loading/,
                )
            }),
        ))

    it("throws when the entity has an afterLoad listener", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const qb = dataSource
                    .createQueryBuilder(Audited, "audited")
                    .orderBy("audited.id", "ASC")

                expect(() => qb.streamEntities()).to.throw(
                    /cannot run "afterLoad" listeners/,
                )
            }),
        ))

    it("allows an afterLoad entity once listeners are disabled", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const qb = dataSource
                    .createQueryBuilder(Audited, "audited")
                    .orderBy("audited.id", "ASC")
                    .callListeners(false)

                expect(() => qb.streamEntities()).to.not.throw()
            }),
        ))

    it("throws when a joined entity has an afterLoad listener", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // the root entity has no listener; the joined one does, and the
                // load event is broadcast for joined entities too
                const qb = dataSource
                    .createQueryBuilder(Note, "note")
                    .leftJoinAndSelect("note.audited", "audited")
                    .orderBy("note.id", "ASC")

                expect(() => qb.streamEntities()).to.throw(
                    /cannot run "afterLoad" listeners/,
                )
            }),
        ))

    it("is not blocked by a subscriber listening to another entity", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const subscriber = {
                    listenTo: () => Comment,
                    afterLoad: () => {},
                }
                dataSource.subscribers.push(subscriber)
                try {
                    const qb = dataSource
                        .createQueryBuilder(Post, "post")
                        .orderBy("post.id", "ASC")

                    expect(() => qb.streamEntities()).to.not.throw()
                } finally {
                    dataSource.subscribers.splice(
                        dataSource.subscribers.indexOf(subscriber),
                        1,
                    )
                }
            }),
        ))

    it("is blocked by a subscriber that listens to the streamed entity", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const subscriber = {
                    listenTo: () => Post,
                    afterLoad: () => {},
                }
                dataSource.subscribers.push(subscriber)
                try {
                    const qb = dataSource
                        .createQueryBuilder(Post, "post")
                        .orderBy("post.id", "ASC")

                    expect(() => qb.streamEntities()).to.throw(
                        /cannot run "afterLoad" listeners/,
                    )
                } finally {
                    dataSource.subscribers.splice(
                        dataSource.subscribers.indexOf(subscriber),
                        1,
                    )
                }
            }),
        ))

    it("allows a pessimistic lock when the stream starts its own transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const qb = dataSource
                    .createQueryBuilder(Post, "post")
                    .orderBy("post.id", "ASC")
                    .useTransaction(true)
                    .setLock("pessimistic_write")

                expect(() => qb.streamEntities()).to.not.throw()
            }),
        ))

    it("revalidates when the builder is mutated after the call", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const qb = dataSource
                    .createQueryBuilder(Post, "post")
                    .orderBy("post.id", "ASC")

                // valid at the call, invalid by the time iteration starts
                const iterator = qb.streamEntities()
                qb.orderBy("post.title", "ASC")

                let caught: unknown
                try {
                    for await (const _ of iterator) break
                } catch (error) {
                    caught = error
                }

                expect(caught)
                    .to.be.instanceOf(Error)
                    .and.have.property("message")
                    .that.matches(/ordered by the root primary key/)
            }),
        ))

    it("throws when selecting something without entity metadata", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // a table name that maps to no entity, so the alias carries no
                // metadata — "post" would resolve to the Post entity
                const qb = dataSource
                    .createQueryBuilder()
                    .select("t.id")
                    .from("unmapped_table", "t")

                expect(() => qb.streamEntities()).to.throw(
                    /can only be used when selecting from an entity/,
                )
            }),
        ))

    it("throws on a non positive chunk size", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const qb = dataSource
                    .createQueryBuilder(Post, "post")
                    .orderBy("post.id", "ASC")

                expect(() => qb.streamEntities({ chunkSize: 0 })).to.throw(
                    /"chunkSize" must be a positive integer/,
                )
            }),
        ))

    // Validation must happen when the method is called, not when the resulting
    // iterator is first pulled from, which is what a bare async generator does.
    it("validates eagerly rather than on first iteration", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const qb = dataSource
                    .createQueryBuilder(Post, "post")
                    .orderBy("post.title", "ASC")

                let threwSynchronously = false
                try {
                    qb.streamEntities()
                } catch {
                    threwSynchronously = true
                }
                expect(threwSynchronously).to.be.true
            }),
        ))
})

// The chunked hydration path needs a driver that implements
// QueryRunner.stream. AbstractSqliteQueryRunner throws "Stream is not
// supported by sqlite driver", so these are limited to streaming drivers and
// will silently no-op when none are enabled in ormconfig.json.
describe("query builder > stream entities > hydration", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post, Comment, Bookmark, Audited, Note],
            enabledDrivers: ["postgres", "mysql", "mariadb"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    const POSTS = 5
    const COMMENTS_PER_POST = 3

    async function seed(dataSource: DataSource) {
        for (let p = 1; p <= POSTS; p++) {
            const post = await dataSource
                .getRepository(Post)
                .save({ title: `post ${p}` })
            for (let c = 1; c <= COMMENTS_PER_POST; c++) {
                await dataSource
                    .getRepository(Comment)
                    .save({ text: `post ${p} comment ${c}`, post })
            }
        }
    }

    it("hydrates entities with to-many relations across chunk boundaries", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seed(dataSource)

                const streamed: Post[] = []
                const iterator = dataSource
                    .createQueryBuilder(Post, "post")
                    .leftJoinAndSelect("post.comments", "comment")
                    .orderBy("post.id", "ASC")
                    // deliberately smaller than the row count so chunks close
                    // mid-result and every boundary is exercised
                    .streamEntities({ chunkSize: 2 })

                for await (const post of iterator) streamed.push(post)

                expect(streamed).to.have.length(POSTS)

                // each root appears exactly once, not once per joined row
                const ids = streamed.map((post) => post.id)
                expect(new Set(ids).size).to.equal(POSTS)

                // and every collection is whole, not split across chunks
                for (const post of streamed) {
                    expect(post.comments).to.have.length(COMMENTS_PER_POST)
                    expect(post.title).to.be.a("string")
                }
            }),
        ))

    it("releases the query runner when the consumer stops iterating early", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seed(dataSource)

                // more iterations than the connection pool holds, so a runner
                // leaked on early exit would exhaust it
                for (let attempt = 0; attempt < 12; attempt++) {
                    const iterator = dataSource
                        .createQueryBuilder(Post, "post")
                        .leftJoinAndSelect("post.comments", "comment")
                        .orderBy("post.id", "ASC")
                        .streamEntities({ chunkSize: 1 })

                    for await (const post of iterator) {
                        expect(post.id).to.be.a("number")
                        break
                    }
                }

                // the pool still has capacity for ordinary work
                expect(await dataSource.getRepository(Post).count()).to.equal(
                    POSTS,
                )
            }),
        ))

    it("matches what getMany returns for the same query", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seed(dataSource)

                const build = () =>
                    dataSource
                        .createQueryBuilder(Post, "post")
                        .leftJoinAndSelect("post.comments", "comment")
                        .orderBy("post.id", "ASC")

                const expected = await build().getMany()

                const streamed: Post[] = []
                for await (const post of build().streamEntities({
                    chunkSize: 2,
                }))
                    streamed.push(post)

                const shape = (posts: Post[]) =>
                    posts.map((post) => ({
                        id: post.id,
                        title: post.title,
                        comments: post.comments
                            .map((comment) => comment.id)
                            .sort((a, b) => a - b),
                    }))

                expect(shape(streamed)).to.eql(shape(expected))
            }),
        ))

    it("yields nothing for an empty table", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const streamed: Post[] = []
                for await (const post of dataSource
                    .createQueryBuilder(Post, "post")
                    .leftJoinAndSelect("post.comments", "comment")
                    .orderBy("post.id", "ASC")
                    .streamEntities())
                    streamed.push(post)

                expect(streamed).to.have.length(0)
            }),
        ))
})
