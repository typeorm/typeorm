import { expect } from "chai"
import { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { User } from "./entity/User"

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
})
