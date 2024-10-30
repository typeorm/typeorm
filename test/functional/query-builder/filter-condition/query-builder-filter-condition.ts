import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { expect } from "chai"
import { User } from "./entity/User"
import { Post } from "./entity/Post"
import { Comment } from "./entity/Comment"
import { CommentLike } from "./entity/CommentLike"

describe("query builder > filter condition", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should apply column filter condition with find", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)

                const user1 = new User()
                const user2 = new User()
                user1.isDeactivated = true
                user2.isDeactivated = false

                await userRepository.save([user1, user2])

                const users = await userRepository.find()
                expect(users.length).to.equal(1)
            }),
        ))

    it("should apply column filter condition with findOne", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)

                const user = new User()
                user.isDeactivated = true

                await userRepository.save(user)

                const foundUser = await userRepository.findOne({
                    where: { id: user.id },
                })
                expect(foundUser).to.not.exist
            }),
        ))

    it("should not apply column filter condition when `applyFilterCondition` is false with find", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)

                const user1 = new User()
                const user2 = new User()
                user1.isDeactivated = true
                user2.isDeactivated = false

                await userRepository.save([user1, user2])

                const users = await userRepository.find({
                    applyFilterConditions: false,
                })
                expect(users.length).to.equal(2)
            }),
        ))

    it("should not apply column filter condition when `applyFilterCondition` is false with findOne", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)

                const user = new User()
                user.isDeactivated = true

                await userRepository.save(user)

                const foundUser = await userRepository.findOne({
                    where: { id: user.id },
                    applyFilterConditions: false,
                })
                expect(foundUser).to.exist
            }),
        ))

    it("should apply column filter to relations", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)

                const user = new User()
                user.isDeactivated = false

                const friend1 = new User()
                const friend2 = new User()
                friend1.isDeactivated = false
                friend2.isDeactivated = true

                await userRepository.save([user, friend1, friend2])

                user.friends = [friend1, friend2]
                await userRepository.save(user)

                const userWithFriends = await userRepository.findOne({
                    where: { id: user.id },
                    relations: { friends: true },
                })

                expect(userWithFriends?.friends.length).to.equal(1)
                expect(userWithFriends?.friends[0].id).to.equal(friend1.id)
            }),
        ))

    it("filterConditionCascade should work properly", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)
                const postRepository = dataSource.getRepository(Post)

                const user1 = new User()
                const user2 = new User()
                user1.isDeactivated = false
                user2.isDeactivated = false

                await userRepository.save([user1, user2])

                const post1 = new Post()
                post1.title = "test"
                post1.author = user1
                const post2 = new Post()
                post2.title = "test"
                post2.author = user2

                await postRepository.save([post1, post2])

                const posts = await postRepository.find({
                    withDeleted: true
                })
                expect(posts.length).to.equal(2)

                user1.isDeactivated = true
                await userRepository.save(user1)

                const posts2 = await postRepository.find({
                    withDeleted: true
                })
                expect(posts2.length).to.equal(1)
            }),
        ))

    it("filterConditionsCascade should be ignored when `applyFilterConditions` is false", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)
                const postRepository = dataSource.getRepository(Post)

                const user = new User()
                user.isDeactivated = false

                await userRepository.save(user)

                const post = new Post()
                post.title = "test"
                post.author = user

                await postRepository.save(post)

                const posts = await postRepository.find()
                expect(posts.length).to.equal(1)

                user.isDeactivated = true
                await userRepository.save(user)

                const posts2 = await postRepository.find({
                    applyFilterConditions: false,
                })
                expect(posts2.length).to.equal(1)
            }),
        ))

    it("filterConditionsCascade should work properly when `relations` is specified", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)
                const postRepository = dataSource.getRepository(Post)

                const user = new User()
                user.isDeactivated = false

                await userRepository.save(user)

                const post = new Post()
                post.title = "test"
                post.author = user

                await postRepository.save(post)

                const posts = await postRepository.find({
                    relations: {
                        author: true,
                    },
                })
                expect(posts.length).to.equal(1)

                user.isDeactivated = true
                await userRepository.save(user)

                const posts2 = await postRepository.find({
                    relations: {
                        author: true,
                    },
                })
                expect(posts2.length).to.equal(0)
            }),
        ))

    it("filterConditionsCascade should work properly when `relationLoadStrategy` is `query`", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)
                const postRepository = dataSource.getRepository(Post)

                const user = new User()
                user.isDeactivated = false

                await userRepository.save(user)

                const post = new Post()
                post.title = "test"
                post.author = user

                await postRepository.save(post)

                const posts = await postRepository.find({
                    relationLoadStrategy: "query",
                })
                expect(posts.length).to.equal(1)

                user.isDeactivated = true
                await userRepository.save(user)

                const posts2 = await postRepository.find({
                    relationLoadStrategy: "query",
                })
                expect(posts2.length).to.equal(0)
            }),
        ))

    it("filterConditionsCascade should work properly with deeply nested relations", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)
                const postRepository = dataSource.getRepository(Post)
                const commentRepository = dataSource.getRepository(Comment)
                const commentLikeRepository =
                    dataSource.getRepository(CommentLike)

                const user1 = new User()
                user1.isDeactivated = false
                const user2 = new User()
                user2.isDeactivated = false

                await userRepository.save([user1, user2])

                const post1 = new Post()
                post1.title = "test"
                post1.author = user1
                const post2 = new Post()
                post2.title = "test"
                post2.author = user2

                await postRepository.save([post1, post2])

                const comment1 = new Comment()
                comment1.content = "test"
                comment1.post = post1
                const comment2 = new Comment()
                comment2.content = "test"
                comment2.post = post2

                await commentRepository.save([comment1, comment2])

                const commentLike1 = new CommentLike()
                commentLike1.comment = comment1
                const commentLike2 = new CommentLike()
                commentLike2.comment = comment2

                await commentLikeRepository.save([commentLike1, commentLike2])

                const commentLikes = await commentLikeRepository
                    .createQueryBuilder("comment_like")
                    .getCount()
                expect(commentLikes).to.equal(2)

                user1.isDeactivated = true
                await userRepository.save(user1)

                const commentLikes2 = await commentLikeRepository
                    .createQueryBuilder("comment_like")
                    .getCount()
                expect(commentLikes2).to.equal(1)
            }),
        ))

    it("filterConditionsCascade should work properly with query builder find options", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)

                const user1 = new User()
                user1.isDeactivated = false
                const user2 = new User()
                user2.isDeactivated = false

                await userRepository.save([user1, user2])

                const users = await userRepository
                    .createQueryBuilder("user")
                    .setFindOptions({
                        relations: {
                            friends: true,
                        },
                        order: {
                            id: "ASC",
                        },
                    })
                    .getMany()
                expect(users.length).to.equal(2)

                user1.isDeactivated = true
                await userRepository.save(user1)

                const users2 = await userRepository
                    .createQueryBuilder("user")
                    .setFindOptions({
                        relations: {
                            friends: true,
                        },
                        order: {
                            id: "ASC",
                        },
                    })
                    .getMany()
                expect(users2.length).to.equal(1)
            }),
        ))

    it("filterConditionsCascade should be ignored when `applyFilterConditions` is false using query builder", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)
                const postRepository = dataSource.getRepository(Post)

                const user1 = new User()
                user1.isDeactivated = false
                const user2 = new User()
                user2.isDeactivated = false

                await userRepository.save([user1, user2])

                const post1 = new Post()
                post1.title = "test"
                post1.author = user1
                const post2 = new Post()
                post2.title = "test"
                post2.author = user2

                await postRepository.save([post1, post2])

                const posts = await postRepository
                    .createQueryBuilder("post")
                    .setFindOptions({
                        applyFilterConditions: false,
                    })
                    .leftJoinAndSelect("post.author", "author")
                    .getMany()

                expect(posts.length).to.equal(2)
                expect(posts[0].author).to.exist
                expect(posts[1].author).to.exist
                user1.isDeactivated = true
                await userRepository.save(user1)

                const posts2 = await postRepository
                    .createQueryBuilder("post")
                    .setFindOptions({
                        applyFilterConditions: false,
                    })
                    .leftJoinAndSelect("post.author", "author")
                    .getMany()
                expect(posts2.length).to.equal(2)
                expect(posts2[0].author).to.exist
                expect(posts2[1].author).to.exist
            }),
        ))

    it("filterConditionsCascade should not be affected by the exclusion of soft-deleted relations", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)
                const postRepository = dataSource.getRepository(Post)

                const user = new User()
                user.isDeactivated = false

                await userRepository.save(user)

                const post = new Post()
                post.title = "test"
                post.author = user

                await postRepository.save(post)

                const posts = await postRepository.find({
                    relations: {
                        author: true,
                    },
                })
                expect(posts.length).to.equal(1)
                expect(posts[0].author).to.exist

                await userRepository.softRemove(user)

                const posts2 = await postRepository.find({
                    relations: {
                        author: true,
                    },
                })
                expect(posts2.length).to.equal(1)
                expect(posts2[0].author).to.not.exist
            }),
        ))
})
