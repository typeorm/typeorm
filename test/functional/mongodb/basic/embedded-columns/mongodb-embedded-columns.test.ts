import "reflect-metadata"
import { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Post } from "./entity/Post"
import { Counters } from "./entity/Counters"
import { Information } from "./entity/Information"
import { ExtraInformation } from "./entity/ExtraInformation"
import { EditHistory } from "./entity/EditHistory"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"

describe("mongodb > embedded columns", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Post, Counters, Information],
                enabledDrivers: ["mongodb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should insert / update / remove entity with embedded correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                // save few posts
                const post = new Post()
                post.title = "Post"
                post.text = "Everything about post"
                post.counters = new Counters()
                post.counters.likes = 5
                post.counters.comments = 1
                post.counters.favorites = 10
                post.counters.information = new Information()
                post.counters.information.description = "Hello post"
                await postRepository.save(post)

                const loadedPost = await postRepository.findOneBy({
                    title: "Post",
                })

                expect(loadedPost).to.be.not.empty
                expect(loadedPost!.counters).to.be.not.empty
                expect(loadedPost!.counters.information).to.be.not.empty
                loadedPost!.should.be.instanceOf(Post)
                loadedPost!.title.should.be.equal("Post")
                loadedPost!.text.should.be.equal("Everything about post")
                loadedPost!.counters.should.be.instanceOf(Counters)
                loadedPost!.counters.likes.should.be.equal(5)
                loadedPost!.counters.comments.should.be.equal(1)
                loadedPost!.counters.favorites.should.be.equal(10)
                loadedPost!.counters.information.should.be.instanceOf(
                    Information,
                )
                loadedPost!.counters.information.description.should.be.equal(
                    "Hello post",
                )

                post.title = "Updated post"
                post.counters.comments = 2
                post.counters.information.description = "Hello updated post"
                await postRepository.save(post)

                const loadedUpdatedPost = await postRepository.findOneBy({
                    title: "Updated post",
                })

                expect(loadedUpdatedPost).to.be.not.empty
                expect(loadedUpdatedPost!.counters).to.be.not.empty
                expect(loadedUpdatedPost!.counters.information).to.be.not.empty
                loadedUpdatedPost!.should.be.instanceOf(Post)
                loadedUpdatedPost!.title.should.be.equal("Updated post")
                loadedUpdatedPost!.text.should.be.equal("Everything about post")
                loadedUpdatedPost!.counters.should.be.instanceOf(Counters)
                loadedUpdatedPost!.counters.likes.should.be.equal(5)
                loadedUpdatedPost!.counters.comments.should.be.equal(2)
                loadedUpdatedPost!.counters.favorites.should.be.equal(10)
                loadedUpdatedPost!.counters.information.should.be.instanceOf(
                    Information,
                )
                loadedUpdatedPost!.counters.information.description.should.be.equal(
                    "Hello updated post",
                )

                await postRepository.remove(post)

                const removedPost = await postRepository.findOneBy({
                    title: "Post",
                })
                const removedUpdatedPost = await postRepository.findOneBy({
                    title: "Updated post",
                })
                expect(removedPost).to.be.null
                expect(removedUpdatedPost).to.be.null
            }),
        ))

    it("should store results in correct camelCase format", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getMongoRepository(Post)

                // save few posts
                const post = new Post()
                post.title = "Post"
                post.text = "Everything about post"
                post.counters = new Counters()
                post.counters.likes = 5
                post.counters.comments = 1
                post.counters.favorites = 10
                post.counters.information = new Information()
                post.counters.information.description = "Hello post"
                await postRepository.save(post)

                const cursor = postRepository.createCursor()
                const loadedPost = await cursor.next()

                loadedPost.title.should.be.eql("Post")
                loadedPost.text.should.be.eql("Everything about post")
                loadedPost.counters.likes.should.be.eql(5)
                loadedPost.counters.comments.should.be.eql(1)
                loadedPost.counters.favorites.should.be.eql(10)
                loadedPost.counters.information.description.should.be.eql(
                    "Hello post",
                )
            }),
        ))

    it("should transform results to correct boolean value", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getMongoRepository(Post)

                // save few posts
                const post = new Post()
                post.title = "Post #1"
                post.text = "Everything about post"
                post.counters = new Counters()
                post.counters.likes = 5
                post.counters.comments = 0
                post.counters.favorites = 1
                post.counters.information = new Information()
                post.counters.information.description = "Hello post"
                post.counters.information.editable = false
                post.counters.information.visible = true
                await postRepository.save(post)

                const loadedPosts = await postRepository.find()

                loadedPosts[0]!.counters.comments.should.be.equal(0)
                loadedPosts[0]!.counters.favorites.should.be.equal(1)
                loadedPosts[0]!.counters.information.visible.should.be.equal(
                    true,
                )
                loadedPosts[0]!.counters.information.editable.should.be.equal(
                    false,
                )
            }),
        ))

    it("should transform entity with nested embedded columns correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getMongoRepository(Post)

                // save few posts
                const post = new Post()
                post.title = "Post #1"
                post.text = "Everything about post"
                post.counters = new Counters()
                post.counters.likes = 5
                post.counters.comments = 0
                post.counters.favorites = 1
                post.counters.information = new Information()
                post.counters.information.description = "Hello post"
                post.counters.extraInformation = new ExtraInformation()
                post.counters.extraInformation.lastEdit = new EditHistory()
                post.counters.extraInformation.lastEdit.title = "Old Post Title"
                post.counters.extraInformation.lastEdit.text =
                    "Not everything about post"
                await postRepository.save(post)

                const [loadedPost] = await postRepository.find()

                loadedPost.counters.comments.should.be.equal(0)
                loadedPost.counters.favorites.should.be.equal(1)
                loadedPost.counters.extraInformation.lastEdit.title.should.be.eql(
                    "Old Post Title",
                )
                loadedPost.counters.extraInformation.lastEdit.text.should.be.eql(
                    "Not everything about post",
                )
            }),
        ))
})
