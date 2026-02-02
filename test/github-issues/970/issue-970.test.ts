import "reflect-metadata"
import { Post } from "./entity/Post"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("github issues > #970 Mongo Bad Sort Specification", () => {
    let connections: DataSource[]
    beforeAll(
        async () =>
            (connections = await createTestingConnections({
                entities: [Post],
                enabledDrivers: ["mongodb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    it("should order properly without errors", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getMongoRepository(Post)

                // save few posts
                const firstPost = new Post()
                firstPost.title = "Post"
                firstPost.text = "Everything about post #1"
                await postRepository.save(firstPost)

                const secondPost = new Post()
                secondPost.title = "Post"
                secondPost.text = "Everything about post #2"
                await postRepository.save(secondPost)

                const loadedPosts1 = await postRepository.find({
                    where: { title: "Post" },
                    order: { text: 1 },
                })
                loadedPosts1[0]!.should.be.instanceOf(Post)
                loadedPosts1[0]!.id.should.be.eql(firstPost.id)
                loadedPosts1[0]!.title.should.be.equal("Post")
                loadedPosts1[0]!.text.should.be.equal(
                    "Everything about post #1",
                )

                const loadedPosts2 = await postRepository.find({
                    where: { title: "Post" },
                    order: { text: "ASC" },
                })
                loadedPosts2[0]!.should.be.instanceOf(Post)
                loadedPosts2[0]!.id.should.be.eql(firstPost.id)
                loadedPosts2[0]!.title.should.be.equal("Post")
                loadedPosts2[0]!.text.should.be.equal(
                    "Everything about post #1",
                )

                const loadedPosts3 = await postRepository.find({
                    where: { title: "Post" },
                    order: { text: -1 },
                })
                loadedPosts3[0]!.should.be.instanceOf(Post)
                loadedPosts3[0]!.id.should.be.eql(secondPost.id)
                loadedPosts3[0]!.title.should.be.equal("Post")
                loadedPosts3[0]!.text.should.be.equal(
                    "Everything about post #2",
                )

                const loadedPosts4 = await postRepository.find({
                    where: { title: "Post" },
                    order: { text: "DESC" },
                })
                loadedPosts4[0]!.should.be.instanceOf(Post)
                loadedPosts4[0]!.id.should.be.eql(secondPost.id)
                loadedPosts4[0]!.title.should.be.equal("Post")
                loadedPosts4[0]!.text.should.be.equal(
                    "Everything about post #2",
                )
            }),
        ))
})
