import "../../../utils/test-setup"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { User } from "./entity/User"
import { LimitOnUpdateNotSupportedError } from "../../../../src/error/LimitOnUpdateNotSupportedError"
import { Not, IsNull } from "../../../../src"
import { MissingDeleteDateColumnError } from "../../../../src/error/MissingDeleteDateColumnError"
import { UserWithoutDeleteDate } from "./entity/UserWithoutDeleteDate"
import { Photo } from "./entity/Photo"
import { DriverUtils } from "../../../../src/driver/DriverUtils"
import { scheduler } from "node:timers/promises"

describe("query builder > soft-delete", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should perform soft deletion and recovery correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alex Messer"

                await connection.manager.save(user)

                await connection
                    .createQueryBuilder()
                    .softDelete()
                    .from(User)
                    .where("name = :name", { name: "Alex Messer" })
                    .execute()

                const loadedUser1 = await connection
                    .getRepository(User)
                    .findOne({
                        where: {
                            name: "Alex Messer",
                        },
                        withDeleted: true,
                    })
                expect(loadedUser1).to.exist
                expect(loadedUser1!.deletedAt).to.be.instanceof(Date)

                await connection
                    .getRepository(User)
                    .createQueryBuilder()
                    .restore()
                    .from(User)
                    .where("name = :name", { name: "Alex Messer" })
                    .execute()

                const loadedUser2 = await connection
                    .getRepository(User)
                    .findOneBy({ name: "Alex Messer" })
                expect(loadedUser2).to.exist
                expect(loadedUser2!.deletedAt).to.be.equals(null)
            }),
        ))

    it("should soft-delete and restore properties inside embeds as well", () =>
        Promise.all(
            connections.map(async (connection) => {
                // save few photos
                await connection.manager.save(Photo, {
                    url: "1.jpg",
                    counters: {
                        likes: 2,
                        favorites: 1,
                        comments: 1,
                    },
                })
                await connection.manager.save(Photo, {
                    url: "2.jpg",
                    counters: {
                        likes: 0,
                        favorites: 1,
                        comments: 1,
                    },
                })

                // soft-delete photo now
                await connection
                    .getRepository(Photo)
                    .createQueryBuilder("photo")
                    .softDelete()
                    .where({
                        counters: {
                            likes: 2,
                        },
                    })
                    .execute()

                const loadedPhoto1 = await connection
                    .getRepository(Photo)
                    .findOneBy({ url: "1.jpg" })
                expect(loadedPhoto1).to.be.null

                const loadedPhoto2 = await connection
                    .getRepository(Photo)
                    .findOneBy({ url: "2.jpg" })
                loadedPhoto2!.should.be.eql({
                    id: 2,
                    url: "2.jpg",
                    deletedAt: null,
                    counters: {
                        likes: 0,
                        favorites: 1,
                        comments: 1,
                        deletedAt: null,
                    },
                })

                // restore photo now
                await connection
                    .getRepository(Photo)
                    .createQueryBuilder("photo")
                    .restore()
                    .where({
                        counters: {
                            likes: 2,
                        },
                    })
                    .execute()

                const restoredPhoto2 = await connection
                    .getRepository(Photo)
                    .findOneBy({ url: "1.jpg" })
                restoredPhoto2!.should.be.eql({
                    id: 1,
                    url: "1.jpg",
                    deletedAt: null,
                    counters: {
                        likes: 2,
                        favorites: 1,
                        comments: 1,
                        deletedAt: null,
                    },
                })
            }),
        ))

    it("should perform soft delete with limit correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user1 = new User()
                user1.name = "Alex Messer"
                const user2 = new User()
                user2.name = "Muhammad Mirzoev"
                const user3 = new User()
                user3.name = "Brad Porter"

                await connection.manager.save([user1, user2, user3])

                const limitNum = 2

                if (DriverUtils.isMySQLFamily(connection.driver)) {
                    await connection
                        .createQueryBuilder()
                        .softDelete()
                        .from(User)
                        .limit(limitNum)
                        .execute()

                    const loadedUsers = await connection
                        .getRepository(User)
                        .find({
                            where: {
                                deletedAt: Not(IsNull()),
                            },
                            withDeleted: true,
                        })
                    expect(loadedUsers).to.exist
                    loadedUsers!.length.should.be.equal(limitNum)
                } else {
                    await connection
                        .createQueryBuilder()
                        .softDelete()
                        .from(User)
                        .limit(limitNum)
                        .execute()
                        .should.be.rejectedWith(LimitOnUpdateNotSupportedError)
                }
            }),
        ))

    it("should perform restory with limit correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user1 = new User()
                user1.name = "Alex Messer"
                const user2 = new User()
                user2.name = "Muhammad Mirzoev"
                const user3 = new User()
                user3.name = "Brad Porter"

                await connection.manager.save([user1, user2, user3])

                const limitNum = 2

                if (DriverUtils.isMySQLFamily(connection.driver)) {
                    await connection
                        .createQueryBuilder()
                        .softDelete()
                        .from(User)
                        .execute()

                    await connection
                        .createQueryBuilder()
                        .restore()
                        .from(User)
                        .limit(limitNum)
                        .execute()

                    const loadedUsers = await connection
                        .getRepository(User)
                        .find()
                    expect(loadedUsers).to.exist
                    loadedUsers!.length.should.be.equal(limitNum)
                } else {
                    await connection
                        .createQueryBuilder()
                        .restore()
                        .from(User)
                        .limit(limitNum)
                        .execute()
                        .should.be.rejectedWith(LimitOnUpdateNotSupportedError)
                }
            }),
        ))

    it("should throw error when delete date column is missing", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new UserWithoutDeleteDate()
                user.name = "Alex Messer"

                await connection.manager.save(user)

                let error1: Error | undefined
                try {
                    await connection
                        .createQueryBuilder()
                        .softDelete()
                        .from(UserWithoutDeleteDate)
                        .where("name = :name", { name: "Alex Messer" })
                        .execute()
                } catch (err) {
                    error1 = err
                }
                expect(error1).to.be.an.instanceof(MissingDeleteDateColumnError)

                let error2: Error | undefined
                try {
                    await connection
                        .createQueryBuilder()
                        .restore()
                        .from(UserWithoutDeleteDate)
                        .where("name = :name", { name: "Alex Messer" })
                        .execute()
                } catch (err) {
                    error2 = err
                }
                expect(error2).to.be.an.instanceof(MissingDeleteDateColumnError)
            }),
        ))

    it("should find with soft deleted relations", () =>
        Promise.all(
            connections.map(async (connection) => {
                const photoRepository = connection.getRepository(Photo)
                const userRepository = connection.getRepository(User)

                const photo1 = new Photo()
                photo1.url = "image-1.jpg"

                const photo2 = new Photo()
                photo2.url = "image-2.jpg"

                const user1 = new User()
                user1.name = "user-1"
                user1.picture = photo1

                const user2 = new User()
                user2.name = "user-2"
                user2.picture = photo2

                await photoRepository.save(photo1)
                await photoRepository.save(photo2)
                await userRepository.save(user1)
                await userRepository.save(user2)

                const users = await userRepository.find({
                    relations: { picture: true },
                })

                expect(users[0].picture.deletedAt).to.equal(null)
                expect(users[1].picture.deletedAt).to.equal(null)

                await photoRepository.softDelete({
                    id: photo1.id,
                })

                const usersWithSoftDelete = await userRepository.find({
                    withDeleted: true,
                    relations: { picture: true },
                })

                expect(usersWithSoftDelete[0].picture.deletedAt).to.not.equal(
                    null,
                )
                expect(usersWithSoftDelete[1].picture.deletedAt).to.equal(null)
            }),
        ))

    it("should only soft delete rows that are not soft deleted previously", () =>
        Promise.all(
            connections.map(async (connection) => {
                const manager = connection.manager

                // create test users
                const batch1UsersData = [
                    { name: "Hassan", company: "test1" },
                    { name: "Nav", company: "test1" },
                ]
                const batch1Users = batch1UsersData.map(({ name, company }) => {
                    const user = new User()
                    user.name = name
                    user.company = company
                    return user
                })
                await manager.save(batch1Users)

                // soft delete users with company test1
                const del1 = await manager.softDelete(User, {
                    company: "test1",
                })
                expect(del1.affected).to.be.eql(2)

                // create more users with the same company test1
                const batch2UsersData = [
                    { name: "Omer", company: "test1" },
                    { name: "Daniyal", company: "test1" },
                    { name: "Salman", company: "test1" },
                    { name: "Shahzaib", company: "test1" },
                ]
                const batch2Users = batch2UsersData.map(({ name, company }) => {
                    const user = new User()
                    user.name = name
                    user.company = company
                    return user
                })
                await manager.save(batch2Users)

                // soft delete users again with company test1
                const del2 = await manager.softDelete(User, {
                    company: "test1",
                })
                // now affected rows should be equal to 4 and not 6, since 2 were already soft deleted before
                expect(del2.affected).to.be.eql(batch2Users.length)
            }),
        ))

    it("should correctly handle OR conditions in softDelete and not update already deleted rows", () =>
        Promise.all(
            connections.map(async (connection) => {
                const manager = connection.manager

                // create test users
                const batch1UsersData = [
                    { name: "User 10", company: "comp1" },
                    { name: "User 11", company: "comp1" },
                ]
                const batch1Users = batch1UsersData.map((data) => {
                    const user = new User()
                    user.name = data.name
                    user.company = data.company
                    return user
                })
                await manager.save(batch1Users)

                const ids1 = batch1Users.map((u) => u.id)

                // soft delete users with ID 10 OR 11
                const del1 = await manager.softDelete(
                    User,
                    ids1.map((id) => ({ id })),
                )
                expect(del1.affected).to.be.eql(2)

                // create more users
                const batch2UsersData = [
                    { name: "User 12", company: "comp1" },
                    { name: "User 13", company: "comp1" },
                ]
                const batch2Users = batch2UsersData.map((data) => {
                    const user = new User()
                    user.name = data.name
                    user.company = data.company
                    return user
                })
                await manager.save(batch2Users)

                const ids2 = batch2Users.map((u) => u.id)

                // soft delete users again with ID 10 OR 11 OR 12 OR 13
                const del2 = await manager.softDelete(
                    User,
                    [...ids1, ...ids2].map((id) => ({ id })),
                )

                // now affected rows should be equal to 2 (batch2) and not 4, since 2 were already soft deleted before
                expect(del2.affected).to.be.eql(batch2Users.length)

                const softDeletedUsers = await manager.find(User, {
                    where: [...ids1, ...ids2].map((id) => ({ id })),
                    withDeleted: true,
                })
                expect(softDeletedUsers.length).to.be.eql(4)
                softDeletedUsers.forEach((user) => {
                    expect(user.deletedAt).to.be.instanceOf(Date)
                })
            }),
        ))

    it("should only restore rows that are soft deleted previously", () =>
        Promise.all(
            connections.map(async (connection) => {
                const manager = connection.manager

                // create test users
                const user1 = new User()
                user1.name = "User 1"
                user1.company = "comp1"

                const user2 = new User()
                user2.name = "User 2"
                user2.company = "comp1"

                await manager.save([user1, user2])

                // soft delete user 1
                await manager.softDelete(User, { id: user1.id })

                // user1 is now deleted, user2 is NOT.
                // Both have company "comp1".

                // Get current state of user 2
                const user2Before = await manager.findOneBy(User, {
                    id: user2.id,
                })
                expect(user2Before).to.exist
                const updatedAtBefore = user2Before!.updatedAt
                const versionBefore = user2Before!.version

                // wait a bit to ensure CURRENT_TIMESTAMP will be different if updated
                await scheduler.wait(1000)

                // restore users with company comp1
                const restoreResult = await manager.restore(User, {
                    company: "comp1",
                })

                // only user1 should be restored
                expect(restoreResult.affected).to.be.eql(1)

                const user1After = await manager.findOneBy(User, {
                    id: user1.id,
                })
                expect(user1After!.deletedAt).to.be.null

                const user2After = await manager.findOneBy(User, {
                    id: user2.id,
                })
                expect(user2After!.deletedAt).to.be.null
                // updateDate and version should NOT have changed for user 2
                expect(user2After!.updatedAt).to.be.eql(updatedAtBefore)
                expect(user2After!.version).to.be.eql(versionBefore)
            }),
        ))
})
