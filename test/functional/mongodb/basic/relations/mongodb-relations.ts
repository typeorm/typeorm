import "reflect-metadata"
import { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Post } from "./entity/Post"
import { User } from "./entity/User"
import { expect } from "chai"
import { MongoRepository } from "../../../../../src"

describe("mongodb > relations", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Post, User],
                enabledDrivers: ["mongodb"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should populate {User} from 'author' property", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postMongoRepository = connection.getMongoRepository(Post)
                const userMongoRepository = connection.getMongoRepository(User)

                // create a user & some posts
                await seedData(userMongoRepository, postMongoRepository)

                // find the post & populate "author"
                const foundPosts = await postMongoRepository.find({
                    relations: { author: true },
                })

                // console.dir(foundPosts, { depth: null })

                expect(foundPosts.length).to.be.greaterThan(0)
                expect((foundPosts[0].author as User).name).not.undefined
                expect((foundPosts[0].author as User).name).contain("Admin")
            }),
        ))

    it("should apply 'skip,take' query", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postMongoRepository = connection.getMongoRepository(Post)
                const userMongoRepository = connection.getMongoRepository(User)

                // create a user & some posts
                await seedData(userMongoRepository, postMongoRepository)

                // find the post & populate "author"
                const foundPosts = await postMongoRepository.find({
                    relations: { author: true },
                    skip: 5,
                    take: 5,
                })

                // since we have 7 posts, skip 5 & take 5 will return only 2
                expect(foundPosts.length).to.be.equal(2)

                // field "author" should be populated
                expect((foundPosts[0].author as User).name).not.undefined
            }),
        ))

    it("should return a single 'Post' when find by _id (and populate 'author' as well)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postMongoRepository = connection.getMongoRepository(Post)
                const userMongoRepository = connection.getMongoRepository(User)

                // create a user & some posts
                const { posts } = await seedData(
                    userMongoRepository,
                    postMongoRepository,
                )

                // take a "postId" to query post by id
                const postId = posts[0]._id

                // find the post & populate "author"
                const foundPost = await postMongoRepository.findOne({
                    where: { _id: postId },
                    relations: { author: true },
                })

                expect(foundPost).not.to.be.undefined
                expect((foundPost?.author as User).name).not.undefined
            }),
        ))

    it("should return a single 'Post' when find by _id, and select only 'title' field", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postMongoRepository = connection.getMongoRepository(Post)
                const userMongoRepository = connection.getMongoRepository(User)

                // create a user & some posts
                const { posts } = await seedData(
                    userMongoRepository,
                    postMongoRepository,
                )

                // take a "postId" to query post by id
                const postId = posts[0]._id

                // find the post & populate "author"
                const foundPost = await postMongoRepository.findOne({
                    where: { _id: postId },
                    select: { title: true },
                })

                expect(foundPost).not.to.be.undefined
                expect(foundPost?.author).to.be.undefined
                expect(foundPost?.title).not.to.be.undefined

                console.log(foundPost)
            }),
        ))

    it("should persist _id when querying the same {Post}", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getMongoRepository(Post)

                // create some posts
                const post1 = new Post()
                post1.title = "First Post"
                await postRepository.save(post1)

                const post2 = new Post()
                post2.title = "Second Post"
                await postRepository.save(post2)
                console.log("post2._id", post2._id)

                // const loadedPost1 = await postRepository.findOneBy({
                //     _id: post1._id,
                // })

                // expect(loadedPost1!._id.toString()).to.be.eql(
                //     post1._id.toString(),
                // )
                // expect(loadedPost1!.title).to.be.equal("First Post")

                const loadPosts = await postRepository.find()
                console.log("loadPosts", loadPosts)

                const loadedPost2 = await postRepository.findOneBy({
                    // title: "Second Post",
                    _id: post2._id,
                })

                console.log(
                    `loadedPost2?.id [${loadedPost2?._id.toString()}] vs post2.id [${post2._id.toString()}]`,
                )

                expect(loadedPost2!._id.toString()).to.be.equal(
                    post2._id.toString(),
                )
                expect(loadedPost2!.title).to.be.equal("Second Post")
            }),
        ))
})

async function seedData(
    userRepository: MongoRepository<User>,
    postRepository: MongoRepository<Post>,
) {
    // create a user
    const user = new User()
    user.name = "Admin"
    await userRepository.save(user)

    // create some posts
    const posts: Post[] = []
    for (let i: number = 0; i < 7; i++) {
        const post = await postRepository.save({
            title: "Post #" + (i + 1),
            author: user._id,
        })
        posts.push(post)
    }
    return { user, posts }
}
