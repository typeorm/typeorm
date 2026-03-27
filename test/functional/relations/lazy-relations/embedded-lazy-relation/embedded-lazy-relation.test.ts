import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { Profile } from "./entity/Profile"
import { Author } from "./entity/Author"
import sinon from "sinon"
import { NestedPost } from "./entity/NestedPost"
import { PostAuthor } from "./entity/PostAuthor"

describe("lazy relations in embedded entity", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not reload relations when calling create() with an entity instance having embedded lazy relation", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const profile = new Profile()
                profile.about = "I am John Doe profile"
                await dataSource.manager.save(profile)

                const post = new Post()
                post.title = "Post with embedded author"
                post.author = new Author()
                post.author.name = "John Doe"
                post.author.profile = Promise.resolve(profile)
                await dataSource.manager.save(post)

                const loadedPost = await dataSource.manager.findOne(Post, {
                    where: { title: "Post with embedded author" },
                })

                const lazyLoadedProfile = await loadedPost!.author.profile
                lazyLoadedProfile.about.should.be.equal("I am John Doe profile")

                const loadedPostForCreate = await dataSource.manager.findOne(
                    Post,
                    {
                        where: { title: "Post with embedded author" },
                    },
                )

                let queryCounter = 0
                const stubbedLogQuery = sinon
                    .stub(dataSource.logger, "logQuery")
                    .callsFake(() => queryCounter++)

                try {
                    const createdPost = dataSource.manager.create(
                        Post,
                        loadedPostForCreate!,
                    )

                    // Wait for macrotask boundary to ensure no lazy relation queries were fired
                    await new Promise<void>((resolve) => setImmediate(resolve))
                    queryCounter.should.be.equal(0)

                    createdPost.author.name.should.be.equal("John Doe")

                    const createdProfile = await createdPost.author.profile
                    queryCounter.should.be.greaterThanOrEqual(0)
                    createdProfile.about.should.be.equal(
                        "I am John Doe profile",
                    )
                } finally {
                    stubbedLogQuery.restore()
                }
            }),
        ))

    it("should not reload relations when calling create() with nested embedded lazy relation", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const profile = new Profile()
                profile.about = "I am nested John Doe profile"
                await dataSource.manager.save(profile)

                const post = new NestedPost()
                post.title = "Post with nested embedded author"
                post.postAuthor = new PostAuthor()
                post.postAuthor.author = new Author()
                post.postAuthor.author.name = "Nested John Doe"
                post.postAuthor.author.profile = Promise.resolve(profile)
                await dataSource.manager.save(post)

                const loadedPost = await dataSource.manager.findOne(
                    NestedPost,
                    {
                        where: { title: "Post with nested embedded author" },
                    },
                )

                const lazyLoadedProfile =
                    await loadedPost!.postAuthor.author.profile
                lazyLoadedProfile.about.should.be.equal(
                    "I am nested John Doe profile",
                )

                const loadedPostForCreate = await dataSource.manager.findOne(
                    NestedPost,
                    {
                        where: { title: "Post with nested embedded author" },
                    },
                )

                let queryCounter = 0
                const stubbedLogQuery = sinon
                    .stub(dataSource.logger, "logQuery")
                    .callsFake(() => queryCounter++)

                try {
                    const createdPost = dataSource.manager.create(
                        NestedPost,
                        loadedPostForCreate!,
                    )

                    await new Promise<void>((resolve) => setImmediate(resolve))
                    queryCounter.should.be.equal(0)
                    createdPost.postAuthor.author.name.should.be.equal(
                        "Nested John Doe",
                    )

                    const createdProfile =
                        await createdPost.postAuthor.author.profile
                    queryCounter.should.be.greaterThanOrEqual(0)
                    createdProfile.about.should.be.equal(
                        "I am nested John Doe profile",
                    )
                } finally {
                    stubbedLogQuery.restore()
                }
            }),
        ))
})
