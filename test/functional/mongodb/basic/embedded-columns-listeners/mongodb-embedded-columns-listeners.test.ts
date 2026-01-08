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
import { expect } from "chai"
import { Tags } from "./entity/Tags"

describe("mongodb > embedded columns listeners", () => {
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

    it("should work listeners in entity embeddeds correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                // save posts with embeddeds
                const post = new Post()
                post.title = "Post"
                post.text = "Everything about post"
                post.counters = new Counters()
                post.counters.information = new Information()
                await postRepository.save(post)

                const loadedPost = await postRepository.findOneBy({
                    title: "Post",
                })

                expect(loadedPost).to.be.not.empty
                expect(loadedPost!.counters).to.be.not.empty
                expect(loadedPost!.counters!.information).to.be.not.empty
                loadedPost!.should.be.instanceOf(Post)
                loadedPost!.title.should.be.equal("Post")
                loadedPost!.text.should.be.equal("Everything about post")

                post.title = "Updated post"
                await postRepository.save(post)

                const loadedUpdatedPost = await postRepository.findOneBy({
                    title: "Updated post",
                })

                expect(loadedUpdatedPost).to.be.not.empty
                expect(loadedUpdatedPost!.counters).to.be.not.empty
                expect(loadedUpdatedPost!.counters!.likes).to.be.eq(100)
                expect(
                    loadedUpdatedPost!.counters!.information!.comments,
                ).to.be.eq(1)
                expect(loadedUpdatedPost!.counters!.information!.description).to
                    .be.not.empty
                loadedUpdatedPost!.should.be.instanceOf(Post)
                loadedUpdatedPost!.title.should.be.equal("Updated post")
                loadedUpdatedPost!.text.should.be.equal("Everything about post")

                await postRepository.remove(post)
            }),
        ))

    it("should not work listeners in entity embeddeds if property is optional", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getMongoRepository(Post)

                // save posts without embeddeds
                const post = new Post()
                post.title = "Post"
                post.text = "Everything about post"
                await postRepository.save(post)

                const cursor = postRepository.createCursor()
                const loadedPost = await cursor.next()

                loadedPost.title.should.be.eql("Post")
                loadedPost.text.should.be.eql("Everything about post")
            }),
        ))

    it("should work listeners in entity array embeddeds correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getMongoRepository(Post)

                // save posts without embeddeds
                const post = new Post()
                post.title = "Post"
                post.text = "Everything about post"
                const tag1 = new Tags()
                tag1.name = "Tag #1"
                const tag2 = new Tags()
                tag2.name = "Tag #2"
                post.tags = [tag1, tag2]
                await postRepository.save(post)

                const cursor = postRepository.createCursor()
                const loadedPost = await cursor.next()

                loadedPost.title.should.be.eql("Post")
                loadedPost.text.should.be.eql("Everything about post")
                expect(loadedPost!.tags).to.be.not.empty
                loadedPost!.tags![0].used.should.be.equal(100)
                loadedPost!.tags![1].name.should.be.equal("Tag #2")
            }),
        ))
})
