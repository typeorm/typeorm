import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"

describe("query-builder > order-by > with added select", () => {
    describe("with arithmetic expression", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                // Spanner generates primary keys on commit, so a batched
                // save of posts-with-many-to-many-categories queues the
                // junction rows with an unset post id and collides on
                // `(postId=1, categoryId=1)`. The test exercises orderBy
                // on an arithmetic addSelect — not many-to-many persistence
                // — so skip Spanner rather than restructure around the
                // driver's identity semantics.
                disabledDrivers: ["spanner"],
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("should order by an arithmetic addSelect alias under pagination", () =>
            Promise.all(
                dataSources.map(async (connection) => {
                    const categories = [new Category(), new Category()]
                    await connection.manager.save(categories)

                    const posts: Post[] = []
                    for (let i = 0; i < 10; i++) {
                        const post = new Post()
                        post.name = `timber`
                        post.count = i * -1
                        post.categories = categories
                        posts.push(post)
                    }
                    await connection.manager.save(posts)

                    const loadedPosts = await connection.manager
                        .createQueryBuilder(Post, "post")
                        .addSelect("post.count * 2", "doublecount")
                        .leftJoinAndSelect("post.categories", "categories")
                        .orderBy("doublecount")
                        .take(5)
                        .getMany()

                    // posts[i].count === -i, doublecount ASC maps back to
                    // original insertion order 9..5. Compare by the ids
                    // save() wrote onto the originals.
                    loadedPosts.length.should.be.equal(5)
                    loadedPosts[0].id.should.be.equal(posts[9].id)
                    loadedPosts[1].id.should.be.equal(posts[8].id)
                    loadedPosts[2].id.should.be.equal(posts[7].id)
                    loadedPosts[3].id.should.be.equal(posts[6].id)
                    loadedPosts[4].id.should.be.equal(posts[5].id)
                }),
            ))
    })

    // Postgres-specific full-text ranking — ts_rank_cd / to_tsvector /
    // to_tsquery aren't portable across drivers.
    describe("with postgres full-text rank", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres"],
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("should order by ts_rank_cd addSelect alias under pagination", () =>
            Promise.all(
                dataSources.map(async (connection) => {
                    const categories = [new Category(), new Category()]
                    await connection.manager.save(categories)

                    const posts: Post[] = []
                    for (let i = 0; i < 10; i++) {
                        const post = new Post()
                        if (i > 5 && i < 8) {
                            post.name = `timber`
                        } else {
                            post.name = `Tim${i}ber`
                        }
                        post.count = 2
                        post.categories = categories
                        posts.push(post)
                    }
                    await connection.manager.save(posts)

                    const loadedPosts = await connection.manager
                        .createQueryBuilder(Post, "post")
                        .addSelect(
                            "ts_rank_cd(to_tsvector(post.name), to_tsquery(:query))",
                            "rank",
                        )
                        .leftJoinAndSelect("post.categories", "categories")
                        .orderBy("rank", "DESC")
                        .take(5)
                        .setParameter("query", "timber")
                        .getMany()

                    // posts[6] and posts[7] are the two "timber" rows and
                    // rank highest under the `timber` tsquery.
                    loadedPosts.length.should.be.equal(5)
                    loadedPosts[0].id.should.be.equal(posts[6].id)
                    loadedPosts[0].name.should.be.equal("timber")
                    loadedPosts[1].id.should.be.equal(posts[7].id)
                    loadedPosts[1].name.should.be.equal("timber")
                }),
            ))
    })
})
