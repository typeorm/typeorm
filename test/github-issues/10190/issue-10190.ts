import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { User } from "./entity/User"
import { Post } from "./entity/Post"
import { LazyPost } from "./entity/LazyPost"
import { LazyUser } from "./entity/LazyUser"

describe.only("github issues > #10190 Cannot save a one-to-many relation", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should update the user id of a post when the the user is saved with a list of posts that already exist in the database", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const entityManager = dataSource.manager

                // Create a post without a user
                const post = new Post()
                post.id = "post-id"
                post.name = "Post"
                const savedPost = await entityManager.save(post)

                // Create a user
                const user = new User()
                user.id = "user-id"
                user.name = "John"
                await entityManager.save(user)

                // Add the post to the user
                const fetchedUser = await entityManager.findOneOrFail(User, {
                    where: { id: user.id },
                })
                fetchedUser.posts = [savedPost]
                await entityManager.save(fetchedUser)

                // Check that the post has the user id
                const updatedPost = await entityManager.findOneOrFail(Post, {
                    where: { name: "Post" },
                })
                expect(updatedPost.userId).to.equal(user.id)
            }),
        ))

    it("should update the user id of a post when the the user is saved with a list of posts that already exist in the database (with lazy relations)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const entityManager = dataSource.manager

                // Create a post without a user
                const post = new LazyPost()
                post.id = "post-id"
                post.name = "Lazy Post"
                const savedPost = await entityManager.save(post)

                // Create a user
                const user = new LazyUser()
                user.id = "user-id"
                user.name = "Lazy John"
                await entityManager.save(user)

                // Add the post to the user
                const fetchedUser = await entityManager.findOneOrFail(
                    LazyUser,
                    {
                        where: { id: user.id },
                    },
                )
                fetchedUser.posts = Promise.resolve([savedPost])
                await entityManager.save(fetchedUser)

                // Check that the post has the user id
                const updatedPost = await entityManager.findOneOrFail(
                    LazyPost,
                    {
                        where: { name: "Lazy Post" },
                    },
                )
                expect(updatedPost.userId).to.equal(user.id)
            }),
        ))
})
