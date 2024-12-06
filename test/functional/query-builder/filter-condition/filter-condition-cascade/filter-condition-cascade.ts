import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { expect } from "chai"
import { User } from "./entity/User"
import { Post } from "./entity/Post"
import { Comment } from "./entity/Comment"
import { CommentLike } from "./entity/CommentLike"
import { DirectConversation } from "./entity/DirectConversation"
import { Team } from "./entity/Team"
import { TeamMember } from "./entity/TeamMember"
import { Category } from "./entity/Category"

describe("query builder > filter condition > filter condition cascade", () => {
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
                    withDeleted: true,
                })
                expect(posts.length).to.equal(2)

                user1.isDeactivated = true
                await userRepository.save(user1)

                const posts2 = await postRepository.find({
                    withDeleted: true,
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

                user1.friends = [user2]
                user2.friends = [user1]

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
                expect(users[0].friends.length).to.equal(1)
                expect(users[1].friends.length).to.equal(1)

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
                expect(users2[0].friends.length).to.equal(0)
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

    it.only("filterConditionsCascade should work properly with left join and select with conditions", () =>
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

                const posts = await postRepository
                    .createQueryBuilder("post")
                    .leftJoinAndSelect(
                        "post.author",
                        "author",
                        "author.name ILIKE :name",
                        {
                            name: "%John%",
                        },
                    )
                    .getMany()
                expect(posts.length).to.equal(1)
                expect(posts[0].author).to.exist

                const posts2 = await postRepository
                    .createQueryBuilder("post")
                    .leftJoinAndSelect(
                        "post.author",
                        "author",
                        "author.name ILIKE :name",
                        {
                            name: "%Jane%",
                        },
                    )
                    .getMany()
                expect(posts2.length).to.equal(1)
                expect(posts2[0].author).to.not.exist

                user.isDeactivated = true
                await userRepository.save(user)

                const posts3 = await postRepository
                    .createQueryBuilder("post")
                    .leftJoinAndSelect(
                        "post.author",
                        "author",
                        "author.name ILIKE :name",
                        {
                            name: "%John%",
                        },
                    )
                    .getMany()
                expect(posts3.length).to.equal(0)
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

    it("filterConditionsCascade should not be affected by the exclusion of deep soft-deleted relations", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)
                const postRepository = dataSource.getRepository(Post)
                const commentRepository = dataSource.getRepository(Comment)

                const user = new User()
                user.isDeactivated = false

                await userRepository.save(user)

                const post = new Post()
                post.title = "test"
                post.author = user

                await postRepository.save(post)

                const comment = new Comment()
                comment.content = "test"
                comment.post = post

                await commentRepository.save(comment)

                const comments = await commentRepository.find({
                    relations: {
                        post: {
                            author: true,
                        },
                    },
                })
                expect(comments.length).to.equal(1)
                expect(comments[0].post.author).to.exist

                await userRepository.softRemove(user)

                const comments2 = await commentRepository.find({
                    relations: {
                        post: {
                            author: true,
                        },
                    },
                })
                expect(comments2.length).to.equal(1)
                expect(comments2[0].post.author).to.not.exist
            }),
        ))

    it("filterConditionsCascade should work with multiple relations", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)
                const directConversationRepository =
                    dataSource.getRepository(DirectConversation)

                const user1 = new User()
                user1.isDeactivated = false
                const user2 = new User()
                user2.isDeactivated = false

                await userRepository.save([user1, user2])

                const directConversation = new DirectConversation()
                directConversation.user1 = user1
                directConversation.user2 = user2

                await directConversationRepository.save(directConversation)

                const directConversations =
                    await directConversationRepository.find({
                        relations: {
                            user1: true,
                            user2: true,
                        },
                    })
                expect(directConversations.length).to.equal(1)
                expect(directConversations[0].user1).to.exist
                expect(directConversations[0].user2).to.exist

                user1.isDeactivated = true
                await userRepository.save(user1)

                const directConversations2 =
                    await directConversationRepository.find({
                        relations: {
                            user1: true,
                            user2: true,
                        },
                    })
                expect(directConversations2.length).to.equal(0)
            }),
        ))

    it("filterConditionsCascade should work with nested relations that are specified in find options", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)
                const teamRepository = dataSource.getRepository(Team)
                const teamMemberRepository =
                    dataSource.getRepository(TeamMember)

                const user1 = new User()
                const user2 = new User()
                user1.isDeactivated = false
                user2.isDeactivated = false
                await userRepository.save([user1, user2])

                const team = new Team()
                team.user = user1
                await teamRepository.save(team)

                const teamMember = new TeamMember()
                teamMember.team = team
                teamMember.user = user2
                await teamMemberRepository.save(teamMember)

                const teamMembers = await teamMemberRepository.find({
                    relations: {
                        team: {
                            user: true,
                        },
                    },
                })
                expect(teamMembers.length).to.equal(1)
                expect(teamMembers[0].team?.user).to.exist

                user1.isDeactivated = true
                await userRepository.save(user1)

                const teamMembers2 = await teamMemberRepository.find({
                    relations: {
                        team: {
                            user: true,
                        },
                    },
                })

                expect(teamMembers2.length).to.equal(0)
            }),
        ))

    it("cascading filter conditions should automatically be applied to one-to-many relations unless `applyFilterConditions` is false", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)
                const teamRepository = dataSource.getRepository(Team)
                const teamMemberRepository =
                    dataSource.getRepository(TeamMember)

                const user1 = new User()
                const user2 = new User()
                user1.isDeactivated = false
                user2.isDeactivated = false
                await userRepository.insert([user1, user2])

                const team = new Team()
                team.user = user1
                await teamRepository.insert(team)

                const teamMember1 = new TeamMember()
                const teamMember2 = new TeamMember()
                teamMember1.team = team
                teamMember1.user = user2
                teamMember2.team = team
                teamMember2.user = user1
                await teamMemberRepository.insert([teamMember1, teamMember2])

                const teamWithoutRelations = await teamRepository.findOne({
                    where: { id: team.id },
                })
                expect(teamWithoutRelations).to.exist

                const teamWithRelations = await teamRepository.findOne({
                    where: { id: team.id },
                    relations: {
                        teamMembers: true,
                    },
                })

                expect(teamWithRelations?.teamMembers?.length).to.equal(2)

                user2.isDeactivated = true
                await userRepository.save(user2)

                const teamWithRelations2 = await teamRepository.findOne({
                    where: { id: team.id },
                    relations: {
                        teamMembers: true,
                    },
                })
                expect(teamWithRelations2?.teamMembers?.length).to.equal(1)

                const teamWithRelations3 = await teamRepository.findOne({
                    where: { id: team.id },
                    applyFilterConditions: false,
                    relations: {
                        teamMembers: true,
                    },
                })

                expect(teamWithRelations3?.teamMembers?.length).to.equal(2)
            }),
        ))

    it("cascading filter conditions should be applied to many-to-many relations unless `applyFilterConditions` is false", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)
                const postRepository = dataSource.getRepository(Post)
                const categoryRepository = dataSource.getRepository(Category)

                const user1 = new User()
                user1.isDeactivated = false
                const user2 = new User()
                user2.isDeactivated = false
                await userRepository.save([user1, user2])

                const category = new Category()
                await categoryRepository.save(category)

                const post1 = new Post()
                post1.title = "test"
                post1.author = user1
                post1.categories = [category]
                const post2 = new Post()
                post2.title = "test"
                post2.author = user2
                post2.categories = [category]
                await postRepository.save([post1, post2])

                const categoryWithPosts =
                    await categoryRepository.findOneOrFail({
                        where: {
                            id: category.id,
                        },
                        relations: {
                            posts: true,
                        },
                    })
                expect(categoryWithPosts.posts.length).to.equal(2)

                user1.isDeactivated = true
                await userRepository.save(user1)

                const categoryWithPosts2 =
                    await categoryRepository.findOneOrFail({
                        where: { id: category.id },
                        relations: { posts: true },
                    })

                expect(categoryWithPosts2.posts.length).to.equal(1)

                const categoryWithPosts3 =
                    await categoryRepository.findOneOrFail({
                        where: { id: category.id },
                        applyFilterConditions: false,
                        relations: { posts: true },
                    })

                expect(categoryWithPosts3.posts.length).to.equal(2)
            }),
        ))

    it("filter conditions on direct properties can be selectively disabled using `applyFilterConditions`", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)

                const user1 = new User()
                user1.isDeactivated = true
                user1.isUnlisted = false
                await userRepository.save(user1)

                const user2 = await userRepository.findOne({
                    where: { id: user1.id },
                })
                expect(user2).not.to.exist

                const user3 = await userRepository.findOne({
                    where: { id: user1.id },
                    applyFilterConditions: {
                        isDeactivated: false,
                    },
                })
                expect(user3).to.exist

                user1.isUnlisted = true
                await userRepository.save(user1)

                const user4 = await userRepository.findOne({
                    where: { id: user1.id },
                    applyFilterConditions: {
                        isDeactivated: false,
                    },
                })
                expect(user4).not.to.exist
            }),
        ))

    it("filter conditions on relation properties can be selectively disabled using `applyFilterConditions`", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)
                const postRepository = dataSource.getRepository(Post)
                const user = new User()
                user.isDeactivated = true
                user.isUnlisted = false
                await userRepository.save(user)

                const post = new Post()
                post.title = "test"
                post.author = user

                await postRepository.save(post)

                const post2 = await postRepository.findOne({
                    where: { id: post.id },
                })
                expect(post2).not.to.exist

                const post3 = await postRepository.findOne({
                    where: { id: post.id },
                    applyFilterConditions: {
                        author: {
                            isDeactivated: false,
                        },
                    },
                })
                expect(post3).to.exist

                user.isUnlisted = true
                await userRepository.save(user)

                const post4 = await postRepository.findOne({
                    where: { id: post.id },
                    applyFilterConditions: {
                        author: {
                            isDeactivated: false,
                        },
                    },
                })
                expect(post4).not.to.exist
            }),
        ))

    it("filter conditions on deeply nested relation properties can be selectively disabled using `applyFilterConditions`", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)
                const postRepository = dataSource.getRepository(Post)
                const commentRepository = dataSource.getRepository(Comment)
                const commentLikeRepository =
                    dataSource.getRepository(CommentLike)

                const user = new User()
                user.isDeactivated = true
                user.isUnlisted = false
                await userRepository.save(user)

                const post = new Post()
                post.title = "test"
                post.author = user

                await postRepository.save(post)

                const comment = new Comment()
                comment.post = post
                comment.content = "test"
                await commentRepository.save(comment)

                const commentLike = new CommentLike()
                commentLike.comment = comment
                await commentLikeRepository.save(commentLike)

                const commentLikes1 = await commentLikeRepository.find()
                expect(commentLikes1.length).to.equal(0)

                const commentLikes2 = await commentLikeRepository.find({
                    applyFilterConditions: {
                        comment: {
                            post: {
                                author: { isDeactivated: false },
                            },
                        },
                    },
                })
                expect(commentLikes2.length).to.equal(1)

                user.isUnlisted = true
                await userRepository.save(user)

                const commentLikes3 = await commentLikeRepository.find({
                    applyFilterConditions: {
                        comment: {
                            post: { author: { isDeactivated: false } },
                        },
                    },
                })
                expect(commentLikes3.length).to.equal(0)
            }),
        ))

    // Come up with test cases to fill in any gaps in the current test coverage
})
