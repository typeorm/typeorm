import { expect } from "chai"
import "../../utils/test-setup"
import { DataSource } from "../../../src/data-source/DataSource"
import { PlatformTools } from "../../../src/platform/PlatformTools"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"
import { PostV2 } from "./entity/PostV2"

describe("github issues > #6552 MongoRepository delete by ObjectId deletes the wrong entity", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["mongodb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    // before the fix this would delete incorrectly post1 instead of post2
    it("should delete the correct entity when id column is called _id", () =>
        Promise.all(
            connections.map(async function (connection) {
                // setup: create 2 posts
                const post1 = new Post()
                post1.title = "Post 1"
                await connection.manager.save(post1)

                const post2 = new Post()
                post2.title = "Post 2"
                await connection.manager.save(post2)

                const objectIdInstance = PlatformTools.load("mongodb").ObjectId

                // double check that post2._id is actually an ObjectId
                expect(post2._id).to.be.not.null
                expect(post2._id).to.be.not.undefined
                expect(post2._id).to.be.instanceof(objectIdInstance)

                // delete Post 2 by ObjectId directly
                await connection.manager.delete(Post, post2._id)
                // This used to wrongly perform deleteOne({}) - deleting the first Post in the collection

                // Post 1 should remain in the DB
                const count1 = await connection.manager.countBy(Post, {
                    _id: post1._id,
                })
                expect(count1).to.be.equal(1, "Post 1 should still exist")

                // Post 2 should be deleted
                const count2 = await connection.manager.countBy(Post, {
                    _id: post2._id,
                })
                expect(count2).to.be.equal(0, "Post 2 should be deleted")
            }),
        ))

    // before the fix this wouldn't delete anything
    it("should delete the correct entity when id column is not called _id", () =>
        Promise.all(
            connections.map(async function (connection) {
                const postV2Repository = connection.getMongoRepository(PostV2)

                // setup: create 2 posts
                const post1 = new PostV2()
                post1.title = "Post 1"
                await postV2Repository.save(post1)

                const post2 = new PostV2()
                post2.title = "Post 2"
                await postV2Repository.save(post2)

                const objectIdInstance = PlatformTools.load("mongodb").ObjectId

                // double check that post2.postId is actually an ObjectId
                expect(post2.postId).to.be.not.null
                expect(post2.postId).to.be.not.undefined
                expect(post2.postId).to.be.instanceof(objectIdInstance)

                // delete Post 2 by ObjectId directly
                await postV2Repository.delete(post2.postId)
                // This used to wrongly perform deleteOne({_id: Buffer}) - not deleting anything because Buffer is not an ObjectId

                // Post 1 should remain in the DB
                const count1 = await postV2Repository.countBy({
                    _id: post1.postId,
                })
                expect(count1).to.be.equal(1, "Post 1 should still exist")

                // Post 2 should be deleted
                const count2 = await postV2Repository.countBy({
                    _id: post2.postId,
                })
                expect(count2).to.be.equal(0, "Post 2 should be deleted")
            }),
        ))

    // before the fix this passed (added here to make sure we don't cause any regressions)
    it("should delete the correct entity when deleting by _id query", () =>
        Promise.all(
            connections.map(async function (connection) {
                // setup: create 2 posts
                const post1 = new Post()
                post1.title = "Post 1"
                await connection.manager.save(post1)

                const post2 = new Post()
                post2.title = "Post 2"
                await connection.manager.save(post2)

                const objectIdInstance = PlatformTools.load("mongodb").ObjectId

                // double check that post2._id is actually an ObjectId
                expect(post2._id).to.be.not.null
                expect(post2._id).to.be.not.undefined
                expect(post2._id).to.be.instanceof(objectIdInstance)

                // delete Post 2 by ObjectId directly
                await connection.manager.delete(Post, { _id: post2._id })

                // Post 1 should remain in the DB
                const count1 = await connection.manager.countBy(Post, {
                    _id: post1._id,
                })
                expect(count1).to.be.equal(1, "Post 1 should still exist")

                // Post 2 should be deleted
                const count2 = await connection.manager.countBy(Post, {
                    _id: post2._id,
                })
                expect(count2).to.be.equal(0, "Post 2 should be deleted")
            }),
        ))
})
