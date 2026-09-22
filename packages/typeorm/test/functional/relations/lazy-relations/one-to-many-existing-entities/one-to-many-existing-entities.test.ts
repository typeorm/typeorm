import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { LazyPost } from "./entity/LazyPost"
import { LazyUser } from "./entity/LazyUser"
import { Post } from "./entity/Post"
import { User } from "./entity/User"

// https://github.com/typeorm/typeorm/issues/12895
describe("relations > lazy relations > saving a one-to-many relation with existing entities (#12895)", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [User, Post, LazyUser, LazyPost],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should update the foreign key of an existing post when the user is saved with the post in its non-lazy relation", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                // create a post without a user
                const post = new Post()
                post.id = "post-id"
                post.name = "Post"
                const savedPost = await manager.save(post)

                // create a user
                const user = new User()
                user.id = "user-id"
                user.name = "John"
                await manager.save(user)

                // add the existing post to the user
                const fetchedUser = await manager.findOneOrFail(User, {
                    where: { id: user.id },
                })
                fetchedUser.posts = [savedPost]
                await manager.save(fetchedUser)

                // the post must now reference the user
                const updatedPost = await manager.findOneOrFail(Post, {
                    where: { id: post.id },
                })
                expect(updatedPost.userId).to.equal(user.id)
            }),
        ))

    it("should update the foreign key of an existing post when the user is saved with the post in its lazy relation", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                // create a post without a user
                const post = new LazyPost()
                post.id = "post-id"
                post.name = "Lazy Post"
                const savedPost = await manager.save(post)

                // create a user
                const user = new LazyUser()
                user.id = "user-id"
                user.name = "Lazy John"
                await manager.save(user)

                // add the existing post to the user
                const fetchedUser = await manager.findOneOrFail(LazyUser, {
                    where: { id: user.id },
                })
                fetchedUser.posts = Promise.resolve([savedPost])
                await manager.save(fetchedUser)

                // the post must now reference the user
                const updatedPost = await manager.findOneOrFail(LazyPost, {
                    where: { id: post.id },
                })
                expect(updatedPost.userId).to.equal(user.id)
            }),
        ))

    it("should read the foreign key column of an entity without triggering the lazy relation load", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                const user = new LazyUser()
                user.id = "user-id"
                user.name = "Lazy John"
                await manager.save(user)

                const post = new LazyPost()
                post.id = "post-id"
                post.name = "Lazy Post"
                post.userId = user.id
                await manager.save(post)

                // a loaded entity has the lazy accessor and no loaded relation data
                const loadedPost = await manager.findOneOrFail(LazyPost, {
                    where: { id: post.id },
                })
                const metadata = dataSource.getMetadata(LazyPost)
                const userIdColumn =
                    metadata.findColumnWithPropertyName("userId")!

                // reading the column value must use the plain foreign key value
                expect(userIdColumn.getEntityValue(loadedPost)).to.equal(
                    user.id,
                )

                // and must not have started loading the relation
                expect(loadedPost).to.not.have.property("__promise_user__")
                expect(loadedPost).to.not.have.property("__user__")

                // a plain value set stores the relation under its property name
                expect(
                    userIdColumn.getEntityValue({ user: { id: user.id } }),
                ).to.equal(user.id)
            }),
        ))
})
