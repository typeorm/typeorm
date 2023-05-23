import "reflect-metadata"
import { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Post } from "./entity/Post"
import { PostWithUnderscoreId } from "./entity/PostWithUnderscoreId"
import { expect } from "chai"

describe("mongodb > object id columns", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Post, PostWithUnderscoreId],
                enabledDrivers: ["mongodb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should persist ObjectIdColumn property as _id to DB", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postMongoRepository = connection.getMongoRepository(Post)

                // save a post
                const post = new Post()
                post.title = "Post"
                await postMongoRepository.save(post)

                // little hack to get raw data from mongodb
                const aggArr = await postMongoRepository.aggregate([]).toArray()

                expect((aggArr[0] as any)._id).to.be.not.undefined
                expect(aggArr[0].nonIdNameOfObjectId).to.be.undefined
            }),
        ))

    it("should map _id to ObjectIdColumn property and remove BD _id property", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postMongoRepository = connection.getMongoRepository(Post)

                // save a post
                const post = new Post()
                post.title = "Post"
                await postMongoRepository.save(post)

                expect(post.nonIdNameOfObjectId).to.be.not.undefined
                expect((post as any)._id).to.be.undefined
            }),
        ))

    it("should save and load properly if objectId property has name _id", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postMongoRepository =
                    connection.getMongoRepository(PostWithUnderscoreId)

                // save a post
                const post = new PostWithUnderscoreId()
                post.title = "Post"
                await postMongoRepository.save(post)

                expect(post._id).to.be.not.undefined

                const loadedPost = await postMongoRepository.findOneBy({
                    _id: post._id,
                })
                expect(loadedPost!._id).to.be.not.undefined
            }),
        ))

    it("should not persist entity ObjectIdColumn property in DB on update by save", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postMongoRepository = connection.getMongoRepository(Post)

                // save a post
                const post = new Post()
                post.title = "Post"
                await postMongoRepository.save(post)

                post.title = "Muhaha changed title"

                await postMongoRepository.save(post)

                expect(post.nonIdNameOfObjectId).to.be.not.undefined
                expect((post as any)._id).to.be.undefined

                // little hack to get raw data from mongodb
                const aggArr = await postMongoRepository.aggregate([]).toArray()

                expect((aggArr[0] as any)._id).to.be.not.undefined
                expect(aggArr[0].nonIdNameOfObjectId).to.be.undefined
            }),
        ))
})
