import "../../../utils/test-setup"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { User } from "./entity/User"
import { LimitOnUpdateNotSupportedError } from "../../../../src/error/LimitOnUpdateNotSupportedError"
import { Not, IsNull } from "../../../../src"
import { MissingDeleteDateColumnError } from "../../../../src/error/MissingDeleteDateColumnError"
import { UserWithoutDeleteDate } from "./entity/UserWithoutDeleteDate"
import { Photo } from "./entity/Photo"
import { DriverUtils } from "../../../../src/driver/DriverUtils"
import { Document } from "./entity/Document"
import { TypeORMError } from "../../../../src/error/TypeORMError"

describe("query builder > soft-delete", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should perform soft deletion and recovery correctly", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = new User()
                user.name = "Alex Messer"

                await dataSource.manager.save(user)

                await dataSource
                    .createQueryBuilder()
                    .softDelete()
                    .from(User)
                    .where("name = :name", { name: "Alex Messer" })
                    .execute()

                const loadedUser1 = await dataSource
                    .getRepository(User)
                    .findOne({
                        where: {
                            name: "Alex Messer",
                        },
                        withDeleted: true,
                    })
                expect(loadedUser1).to.exist
                expect(loadedUser1!.deletedAt).to.be.instanceof(Date)

                await dataSource
                    .getRepository(User)
                    .createQueryBuilder()
                    .restore()
                    .from(User)
                    .where("name = :name", { name: "Alex Messer" })
                    .execute()

                const loadedUser2 = await dataSource
                    .getRepository(User)
                    .findOneBy({ name: "Alex Messer" })
                expect(loadedUser2).to.exist
                expect(loadedUser2!.deletedAt).to.be.equals(null)
            }),
        ))

    it("should soft-delete and restore properties inside embeds as well", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // save few photos
                await dataSource.manager.save(Photo, {
                    url: "1.jpg",
                    counters: {
                        likes: 2,
                        favorites: 1,
                        comments: 1,
                    },
                })
                await dataSource.manager.save(Photo, {
                    url: "2.jpg",
                    counters: {
                        likes: 0,
                        favorites: 1,
                        comments: 1,
                    },
                })

                // soft-delete photo now
                await dataSource
                    .getRepository(Photo)
                    .createQueryBuilder("photo")
                    .softDelete()
                    .where({
                        counters: {
                            likes: 2,
                        },
                    })
                    .execute()

                const loadedPhoto1 = await dataSource
                    .getRepository(Photo)
                    .findOneBy({ url: "1.jpg" })
                expect(loadedPhoto1).to.be.null

                const loadedPhoto2 = await dataSource
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
                await dataSource
                    .getRepository(Photo)
                    .createQueryBuilder("photo")
                    .restore()
                    .where({
                        counters: {
                            likes: 2,
                        },
                    })
                    .execute()

                const restoredPhoto2 = await dataSource
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
            dataSources.map(async (dataSource) => {
                const user1 = new User()
                user1.name = "Alex Messer"
                const user2 = new User()
                user2.name = "Muhammad Mirzoev"
                const user3 = new User()
                user3.name = "Brad Porter"

                await dataSource.manager.save([user1, user2, user3])

                const limitNum = 2

                if (DriverUtils.isMySQLFamily(dataSource.driver)) {
                    await dataSource
                        .createQueryBuilder()
                        .softDelete()
                        .from(User)
                        .limit(limitNum)
                        .execute()

                    const loadedUsers = await dataSource
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
                    await dataSource
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
            dataSources.map(async (dataSource) => {
                const user1 = new User()
                user1.name = "Alex Messer"
                const user2 = new User()
                user2.name = "Muhammad Mirzoev"
                const user3 = new User()
                user3.name = "Brad Porter"

                await dataSource.manager.save([user1, user2, user3])

                const limitNum = 2

                if (DriverUtils.isMySQLFamily(dataSource.driver)) {
                    await dataSource
                        .createQueryBuilder()
                        .softDelete()
                        .from(User)
                        .execute()

                    await dataSource
                        .createQueryBuilder()
                        .restore()
                        .from(User)
                        .limit(limitNum)
                        .execute()

                    const loadedUsers = await dataSource
                        .getRepository(User)
                        .find()
                    expect(loadedUsers).to.exist
                    loadedUsers!.length.should.be.equal(limitNum)
                } else {
                    await dataSource
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
            dataSources.map(async (dataSource) => {
                const user = new UserWithoutDeleteDate()
                user.name = "Alex Messer"

                await dataSource.manager.save(user)

                let error1: Error | undefined
                try {
                    await dataSource
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
                    await dataSource
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
            dataSources.map(async (dataSource) => {
                const photoRepository = dataSource.getRepository(Photo)
                const userRepository = dataSource.getRepository(User)

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
    it("should not touch already soft-deleted rows when the WHERE is OR-chained", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Document)
                const [deleted, live] = await repository.save([
                    { title: "deleted" },
                    { title: "live" },
                ])
                await repository.softDelete(deleted.id)
                const deletedBefore = await repository.findOneOrFail({
                    where: { id: deleted.id },
                    withDeleted: true,
                })
                // whereEntity() may update the passed entities in place
                const liveVersion = live.version

                const queryBuilder = dataSource
                    .createQueryBuilder()
                    .softDelete()
                    .from(Document)
                    .whereEntity([deleted, live])

                // generating the query must not accumulate conditions
                expect(queryBuilder.getQuery()).to.equal(
                    queryBuilder.getQuery(),
                )

                await queryBuilder.execute()

                const [deletedAfter, liveAfter] = await Promise.all([
                    repository.findOneOrFail({
                        where: { id: deleted.id },
                        withDeleted: true,
                    }),
                    repository.findOneOrFail({
                        where: { id: live.id },
                        withDeleted: true,
                    }),
                ])
                expect(deletedAfter.version).to.equal(deletedBefore.version)
                expect(deletedAfter.deletedAt!.getTime()).to.equal(
                    deletedBefore.deletedAt!.getTime(),
                )
                expect(liveAfter.version).to.equal(liveVersion + 1)
                expect(liveAfter.deletedAt).to.be.instanceof(Date)

                await dataSource
                    .createQueryBuilder()
                    .restore()
                    .from(Document)
                    .where("title = :title", { title: "none" })
                    .orWhere("title = :live", { live: "live" })
                    .execute()

                const [deletedRestored, liveRestored] = await Promise.all([
                    repository.findOneOrFail({
                        where: { id: deleted.id },
                        withDeleted: true,
                    }),
                    repository.findOneOrFail({ where: { id: live.id } }),
                ])
                expect(deletedRestored.deletedAt).to.be.instanceof(Date)
                expect(deletedRestored.version).to.equal(deletedBefore.version)
                expect(liveRestored.deletedAt).to.equal(null)
                expect(liveRestored.version).to.equal(liveVersion + 2)
            }),
        ))

    it("should reject empty criteria for soft-delete and restore like other write operations", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Document)
                const [deleted, live] = await repository.save([
                    { title: "deleted" },
                    { title: "live" },
                ])
                await repository.softDelete(deleted.id)

                for (const build of [
                    () => dataSource.createQueryBuilder().softDelete(),
                    () => dataSource.createQueryBuilder().restore(),
                ]) {
                    await expect(
                        build().from(Document).where({}).execute(),
                    ).to.be.rejectedWith(TypeORMError, /Empty criteria/)
                    await expect(
                        build().from(Document).where([]).execute(),
                    ).to.be.rejectedWith(TypeORMError, /Empty criteria/)
                }

                const rows = await repository.find({
                    withDeleted: true,
                    order: { id: "ASC" },
                })
                expect(rows.map((row) => row.deletedAt instanceof Date)).to.eql(
                    [true, false],
                )
                expect(rows.map((row) => row.version)).to.eql([
                    deleted.version + 1,
                    live.version,
                ])
            }),
        ))
})
