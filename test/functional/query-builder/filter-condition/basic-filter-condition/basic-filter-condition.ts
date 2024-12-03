import { expect } from "chai"
import { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { User } from "./entity/User"
import { Post } from "./entity/Post"
import { Project } from "./entity/Project"

describe("query builder > filter condition > basic filter condition", () => {
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

    it("should apply column filter to relations without affecting main entity", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userRepository = dataSource.getRepository(User)
                const postRepository = dataSource.getRepository(Post)
                const projectRepository = dataSource.getRepository(Project)

                const user = new User()
                user.isDeactivated = false
                await userRepository.save(user)

                const post = new Post()
                post.isHidden = true
                post.author = user
                await postRepository.save(post)

                const project = new Project()
                project.posts = [post]
                await projectRepository.save(project)

                const { posts } = await projectRepository.findOneOrFail({
                    where: { id: project.id },
                    relations: { posts: true },
                })
                expect(posts.length).to.equal(0)
            }),
        ))
})
