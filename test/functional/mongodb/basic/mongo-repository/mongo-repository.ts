import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Post, PostWithDeleted } from "./entity/Post"
import { MongoRepository } from "../../../../../src/repository/MongoRepository"

describe("mongodb > MongoRepository", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Post, PostWithDeleted],
                enabledDrivers: ["mongodb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("connection should return mongo repository when requested", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getMongoRepository(Post)
                expect(postRepository).to.be.instanceOf(MongoRepository)
            }),
        ))

    it("entity manager should return mongo repository when requested", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository =
                    connection.manager.getMongoRepository(Post)
                expect(postRepository).to.be.instanceOf(MongoRepository)
            }),
        ))

    it("should be able to use entity cursor which will return instances of entity classes", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getMongoRepository(Post)

                // save few posts
                const firstPost = new Post()
                firstPost.title = "Post #1"
                firstPost.text = "Everything about post #1"
                await postRepository.save(firstPost)

                const secondPost = new Post()
                secondPost.title = "Post #2"
                secondPost.text = "Everything about post #2"
                await postRepository.save(secondPost)

                const cursor = postRepository.createEntityCursor({
                    title: "Post #1",
                })

                const loadedPosts = await cursor.toArray()
                expect(loadedPosts).to.have.length(1)
                expect(loadedPosts[0]).to.be.instanceOf(Post)
                expect(loadedPosts[0].id).to.eql(firstPost.id)
                expect(loadedPosts[0].title).to.eql("Post #1")
                expect(loadedPosts[0].text).to.eql("Everything about post #1")
            }),
        ))

    it("should be able to use entity cursor which will return instances of entity classes", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getMongoRepository(Post)

                // save few posts
                const firstPost = new Post()
                firstPost.title = "Post #1"
                firstPost.text = "Everything about post #1"
                await postRepository.save(firstPost)

                const secondPost = new Post()
                secondPost.title = "Post #2"
                secondPost.text = "Everything about post #2"
                await postRepository.save(secondPost)

                const loadedPosts = await postRepository.find({
                    where: {
                        $or: [
                            {
                                title: "Post #1",
                            },
                            {
                                text: "Everything about post #1",
                            },
                        ],
                    },
                })

                expect(loadedPosts).to.have.length(1)
                expect(loadedPosts[0]).to.be.instanceOf(Post)
                expect(loadedPosts[0].id).to.eql(firstPost.id)
                expect(loadedPosts[0].title).to.eql("Post #1")
                expect(loadedPosts[0].text).to.eql("Everything about post #1")
            }),
        ))

    it("should be able to use findByIds with both objectId and strings", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getMongoRepository(Post)

                // save few posts
                const firstPost = new Post()
                firstPost.title = "Post #1"
                firstPost.text = "Everything about post #1"
                await postRepository.save(firstPost)

                const secondPost = new Post()
                secondPost.title = "Post #2"
                secondPost.text = "Everything about post #2"
                await postRepository.save(secondPost)

                expect(
                    await postRepository.findByIds([firstPost.id]),
                ).to.have.length(1)
                expect(
                    await postRepository.findByIds([
                        firstPost.id.toHexString(),
                    ]),
                ).to.have.length(1)
                expect(
                    await postRepository.findByIds([{ id: firstPost.id }]),
                ).to.have.length(1)
                expect(
                    await postRepository.findByIds([undefined]),
                ).to.have.length(0)
            }),
        ))

    // todo: cover other methods as well
    it("should be able to save and update mongo entities", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getMongoRepository(Post)

                // save few posts
                const firstPost = new Post()
                firstPost.title = "Post #1"
                firstPost.text = "Everything about post #1"
                await postRepository.save(firstPost)

                const secondPost = new Post()
                secondPost.title = "Post #2"
                secondPost.text = "Everything about post #2"
                await postRepository.save(secondPost)

                // save few posts
                firstPost.text = "Everything and more about post #1"
                await postRepository.save(firstPost)

                const loadedPosts = await postRepository.find()

                expect(loadedPosts).to.have.length(2)
                expect(loadedPosts[0].text).to.eql(
                    "Everything and more about post #1",
                )
                expect(loadedPosts[1].text).to.eql("Everything about post #2")
            }),
        ))

    it("should ignore non-column properties", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Github issue #5321
                const postRepository = connection.getMongoRepository(Post)

                await postRepository.save({
                    title: "Hello",
                    text: "World",
                    unreal: "Not a Column",
                })

                const loadedPosts = await postRepository.find()

                expect(loadedPosts).to.have.length(1)
                expect(loadedPosts[0]).to.not.have.property("unreal")
            }),
        ))

    // Github issue #9250
    describe("with DeletedDataColumn", () => {
        it("with $or query", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const postRepository =
                        connection.getMongoRepository(PostWithDeleted)
                    await seedPosts(postRepository)
                    const loadedPosts = await postRepository.find({
                        where: {
                            $or: [{ deletedAt: { $ne: null } }],
                        },
                    })
                    expect(loadedPosts).to.have.length(3)
                }),
            ))

        it("filter delete data", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const postRepository =
                        connection.getMongoRepository(PostWithDeleted)
                    await seedPosts(postRepository)

                    const loadedPosts = await postRepository.find()
                    const filteredPost = loadedPosts.find(
                        (post) => post.title === "deleted",
                    )

                    expect(filteredPost).to.be.undefined
                    expect(loadedPosts).to.have.length(2)
                }),
            ))

        describe("findOne filtered data properly", () => {
            it("findOne()", () =>
                Promise.all(
                    connections.map(async (connection) => {
                        const postRepository =
                            connection.getMongoRepository(PostWithDeleted)
                        await seedPosts(postRepository)

                        const loadedPost = await postRepository.findOne({
                            where: { title: "notDeleted" },
                        })
                        const loadedPostWithDeleted =
                            await postRepository.findOne({
                                where: { title: "deleted" },
                                withDeleted: true,
                            })

                        expect(loadedPost?.title).to.eql("notDeleted")
                        expect(loadedPostWithDeleted?.title).to.eql("deleted")
                    }),
                ))

            it("findOneBy()", () =>
                Promise.all(
                    connections.map(async (connection) => {
                        const postRepository =
                            connection.getMongoRepository(PostWithDeleted)
                        await seedPosts(postRepository)

                        const loadedPost = await postRepository.findOneBy({
                            where: { title: "notDeleted" },
                        })
                        const loadedPostWithDeleted =
                            await postRepository.findOne({
                                where: { title: "deleted" },
                                withDeleted: true,
                            })

                        expect(loadedPost?.title).to.eql("notDeleted")
                        expect(loadedPostWithDeleted?.title).to.eql("deleted")
                    }),
                ))
        })
    })
})

async function seedPosts(postRepository: MongoRepository<PostWithDeleted>) {
    await postRepository.save({
        title: "withoutDeleted",
        text: "withoutDeleted",
    })
    await postRepository.save({
        title: "notDeleted",
        text: "notDeleted",
        deletedAt: null,
    })
    await postRepository.save({
        title: "deleted",
        text: "deleted",
        deletedAt: new Date(),
    })
}
