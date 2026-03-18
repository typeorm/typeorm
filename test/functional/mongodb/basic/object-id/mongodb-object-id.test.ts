import "reflect-metadata"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Post } from "./entity/Post"
import { PostWithUnderscoreId } from "./entity/PostWithUnderscoreId"
import { expect } from "chai"

describe("mongodb > object id columns", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [Post, PostWithUnderscoreId],
            enabledDrivers: ["mongodb"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should persist ObjectIdColumn property as _id to DB", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMongoRepository = dataSource.getMongoRepository(Post)

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
            dataSources.map(async (dataSource) => {
                const postMongoRepository = dataSource.getMongoRepository(Post)

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
            dataSources.map(async (dataSource) => {
                const postMongoRepository =
                    dataSource.getMongoRepository(PostWithUnderscoreId)

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

    it("should find entity by ObjectIdColumn property name using findOneBy", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMongoRepository = dataSource.getMongoRepository(Post)

                const post = new Post()
                post.title = "Post"
                await postMongoRepository.save(post)

                const loadedPost = await postMongoRepository.findOneBy({
                    nonIdNameOfObjectId: post.nonIdNameOfObjectId,
                })
                expect(loadedPost).to.be.not.null
                expect(loadedPost?.title).to.be.equal("Post")
                expect(loadedPost?.nonIdNameOfObjectId.toString()).to.be.equal(
                    post.nonIdNameOfObjectId.toString(),
                )
            }),
        ))

    it("should find entity by ObjectIdColumn property name using find with where", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMongoRepository = dataSource.getMongoRepository(Post)

                const post = new Post()
                post.title = "Post"
                await postMongoRepository.save(post)

                const loadedPosts = await postMongoRepository.find({
                    where: {
                        nonIdNameOfObjectId: post.nonIdNameOfObjectId,
                    },
                })
                expect(loadedPosts).to.have.length(1)
                expect(loadedPosts[0].title).to.be.equal("Post")
            }),
        ))

    it("should find entity by ObjectIdColumn property name using findAndCount", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMongoRepository = dataSource.getMongoRepository(Post)

                const post = new Post()
                post.title = "Post"
                await postMongoRepository.save(post)

                const [posts, count] = await postMongoRepository.findAndCount({
                    where: {
                        nonIdNameOfObjectId: post.nonIdNameOfObjectId,
                    },
                })
                expect(count).to.be.equal(1)
                expect(posts[0].title).to.be.equal("Post")
            }),
        ))

    it("should find entity by ObjectIdColumn using EntityManager.findOneBy", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new Post()
                post.title = "Post"
                await dataSource.manager.save(post)

                const loadedPost = await dataSource.manager.findOneBy(Post, {
                    nonIdNameOfObjectId: post.nonIdNameOfObjectId,
                })
                expect(loadedPost).to.be.not.null
                expect(loadedPost?.title).to.be.equal("Post")
            }),
        ))

    it("should find entity by ObjectIdColumn property name using $in operator", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMongoRepository = dataSource.getMongoRepository(Post)

                const post1 = new Post()
                post1.title = "Post 1"
                await postMongoRepository.save(post1)

                const post2 = new Post()
                post2.title = "Post 2"
                await postMongoRepository.save(post2)

                const loadedPosts = await postMongoRepository.find({
                    where: {
                        nonIdNameOfObjectId: {
                            $in: [
                                post1.nonIdNameOfObjectId,
                                post2.nonIdNameOfObjectId,
                            ],
                        } as any,
                    },
                })
                expect(loadedPosts).to.have.length(2)
            }),
        ))

    it("should find entity by ObjectIdColumn property name using $ne operator", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMongoRepository = dataSource.getMongoRepository(Post)

                const post1 = new Post()
                post1.title = "Post 1"
                await postMongoRepository.save(post1)

                const post2 = new Post()
                post2.title = "Post 2"
                await postMongoRepository.save(post2)

                const loadedPosts = await postMongoRepository.find({
                    where: {
                        nonIdNameOfObjectId: {
                            $ne: post1.nonIdNameOfObjectId,
                        } as any,
                    },
                })
                expect(loadedPosts).to.have.length(1)
                expect(loadedPosts[0].title).to.be.equal("Post 2")
            }),
        ))

    it("should find entity by ObjectIdColumn property name inside $or", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMongoRepository = dataSource.getMongoRepository(Post)

                const post1 = new Post()
                post1.title = "Post 1"
                await postMongoRepository.save(post1)

                const post2 = new Post()
                post2.title = "Post 2"
                await postMongoRepository.save(post2)

                const post3 = new Post()
                post3.title = "Post 3"
                await postMongoRepository.save(post3)

                const loadedPosts = await postMongoRepository.find({
                    where: {
                        $or: [
                            {
                                nonIdNameOfObjectId: post1.nonIdNameOfObjectId,
                            },
                            {
                                nonIdNameOfObjectId: post3.nonIdNameOfObjectId,
                            },
                        ],
                    } as any,
                })
                expect(loadedPosts).to.have.length(2)
                const titles = loadedPosts
                    .map((p) => p.title)
                    .sort((a, b) => a.localeCompare(b))
                expect(titles).to.deep.equal(["Post 1", "Post 3"])
            }),
        ))

    it("should not persist entity ObjectIdColumn property in DB on update by save", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMongoRepository = dataSource.getMongoRepository(Post)

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
