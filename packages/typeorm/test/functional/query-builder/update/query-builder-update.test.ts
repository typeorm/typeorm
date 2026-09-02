import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { User } from "./entity/User"
import { LimitOnUpdateNotSupportedError } from "../../../../src/error/LimitOnUpdateNotSupportedError"
import { Photo } from "./entity/Photo"
import { AliasedPost } from "./entity/AliasedPost"
import { Student } from "./entity/Student"
import { UpdateValuesMissingError } from "../../../../src/error/UpdateValuesMissingError"
import { EntityPropertyNotFoundError } from "../../../../src/error/EntityPropertyNotFoundError"
import { DriverUtils } from "../../../../src/driver/DriverUtils"

describe("query builder > update", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should perform updation correctly", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = new User()
                user.name = "Alex Messer"

                await dataSource.manager.save(user)

                await dataSource
                    .createQueryBuilder()
                    .update(User)
                    .set({ name: "Dima Zotov" })
                    .where("name = :name", { name: "Alex Messer" })
                    .execute()

                const loadedUser1 = await dataSource
                    .getRepository(User)
                    .findOneBy({ name: "Dima Zotov" })
                expect(loadedUser1).to.exist
                loadedUser1!.name.should.be.equal("Dima Zotov")

                await dataSource
                    .getRepository(User)
                    .createQueryBuilder("myUser")
                    .update()
                    .set({ name: "Muhammad Mirzoev" })
                    .where("name = :name", { name: "Dima Zotov" })
                    .execute()

                const loadedUser2 = await dataSource
                    .getRepository(User)
                    .findOneBy({ name: "Muhammad Mirzoev" })
                expect(loadedUser2).to.exist
                loadedUser2!.name.should.be.equal("Muhammad Mirzoev")
            }),
        ))

    it("should be able to use sql functions", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = new User()
                user.name = "Alex Messer"

                await dataSource.manager.save(user)

                await dataSource
                    .createQueryBuilder()
                    .update(User)
                    .set({
                        name: () =>
                            dataSource.driver.options.type === "mssql"
                                ? "SUBSTRING('Dima Zotov', 1, 4)"
                                : "SUBSTR('Dima Zotov', 1, 4)",
                    })
                    .where("name = :name", {
                        name: "Alex Messer",
                    })
                    .execute()

                const loadedUser1 = await dataSource
                    .getRepository(User)
                    .findOneBy({ name: "Dima" })
                expect(loadedUser1).to.exist
                loadedUser1!.name.should.be.equal("Dima")
            }),
        ))

    it("should update and escape properly", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = new User()
                user.name = "Dima"
                user.likesCount = 1

                await dataSource.manager.save(user)

                const qb = dataSource.createQueryBuilder()
                await qb
                    .update(User)
                    .set({ likesCount: () => qb.escape(`likesCount`) + " + 1" })
                    // .set({ likesCount: 2 })
                    .where("likesCount = 1")
                    .execute()

                const loadedUser1 = await dataSource
                    .getRepository(User)
                    .findOneBy({ likesCount: 2 })
                expect(loadedUser1).to.exist
                loadedUser1!.name.should.be.equal("Dima")
            }),
        ))

    it("should update properties inside embeds as well", () =>
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

                // update photo now
                await dataSource
                    .getRepository(Photo)
                    .createQueryBuilder("photo")
                    .update()
                    .set({
                        counters: {
                            likes: 3,
                        },
                    })
                    .where({
                        counters: {
                            likes: 2,
                        },
                    })
                    .execute()

                const loadedPhoto1 = await dataSource
                    .getRepository(Photo)
                    .findOneBy({ url: "1.jpg" })
                expect(loadedPhoto1).to.exist
                loadedPhoto1!.should.be.eql({
                    id: 1,
                    url: "1.jpg",
                    counters: {
                        likes: 3,
                        favorites: 1,
                        comments: 1,
                    },
                })

                const loadedPhoto2 = await dataSource
                    .getRepository(Photo)
                    .findOneBy({ url: "2.jpg" })
                expect(loadedPhoto2).to.exist
                loadedPhoto2!.should.be.eql({
                    id: 2,
                    url: "2.jpg",
                    counters: {
                        likes: 0,
                        favorites: 1,
                        comments: 1,
                    },
                })
            }),
        ))

    it("should perform update with limit correctly", () =>
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
                const nameToFind = "Dima Zotov"

                if (DriverUtils.isMySQLFamily(dataSource.driver)) {
                    await dataSource
                        .createQueryBuilder()
                        .update(User)
                        .set({ name: nameToFind })
                        .limit(limitNum)
                        .execute()

                    const loadedUsers = await dataSource
                        .getRepository(User)
                        .findBy({ name: nameToFind })
                    expect(loadedUsers).to.exist
                    loadedUsers!.length.should.be.equal(limitNum)
                } else {
                    await dataSource
                        .createQueryBuilder()
                        .update(User)
                        .set({ name: nameToFind })
                        .limit(limitNum)
                        .execute()
                        .should.be.rejectedWith(LimitOnUpdateNotSupportedError)
                }
            }),
        ))

    it("should not add an alias on unsupported dialects", () => {
        for (const dataSource of dataSources) {
            if (DriverUtils.isPostgresFamily(dataSource.driver)) continue

            const sqlWithoutAlias = dataSource
                .createQueryBuilder()
                .update(User)
                .set({ name: "Dima Zotov" })
                .where("name = :name", { name: "Alex Messer" })
                .getSql()

            expect(sqlWithoutAlias).to.not.contain(" AS ")

            const sqlWithAlias = dataSource
                .getRepository(User)
                .createQueryBuilder("u")
                .update()
                .set({ name: "Dima Zotov" })
                .where("u.name = :name", { name: "Alex Messer" })
                .getSql()

            expect(sqlWithAlias).to.not.contain(" AS ")

            const sqlFromRepository = dataSource
                .getRepository(User)
                .createQueryBuilder()
                .update()
                .set({ name: "Dima Zotov" })
                .where("name = :name", { name: "Alex Messer" })
                .getSql()

            expect(sqlFromRepository).to.not.contain(" AS ")
        }
    })

    it("should not add an alias when none was given explicitly", () => {
        for (const dataSource of dataSources) {
            if (!DriverUtils.isPostgresFamily(dataSource.driver)) continue

            const sqlFromEntity = dataSource
                .createQueryBuilder()
                .update(User)
                .set({ name: "Dima Zotov" })
                .where("name = :name", { name: "Alex Messer" })
                .getSql()

            expect(sqlFromEntity).to.not.contain(" AS ")

            const tableName = dataSource.getMetadata(User).tablePath
            const sqlFromTableName = dataSource
                .createQueryBuilder()
                .update(tableName)
                .set({ name: "Dima Zotov" })
                .where("name = :name", { name: "Alex Messer" })
                .getSql()

            expect(sqlFromTableName).to.not.contain(" AS ")

            const sqlFromRepository = dataSource
                .getRepository(User)
                .createQueryBuilder()
                .update()
                .set({ name: "Dima Zotov" })
                .where("name = :name", { name: "Alex Messer" })
                .getSql()

            expect(sqlFromRepository).to.not.contain(" AS ")
        }
    })

    it("should add an explicit alias on postgres family", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (!DriverUtils.isPostgresFamily(dataSource.driver)) return

                const user1 = new User()
                user1.name = "Alex Messer"
                const user2 = new User()
                user2.name = "Dima Zotov"
                await dataSource.manager.save([user1, user2])

                const queryBuilder = dataSource
                    .getRepository(User)
                    .createQueryBuilder("u")
                    .update()
                    .set({ name: "Muhammad Mirzoev" })
                    .where("u.name = :name", { name: "Alex Messer" })

                expect(queryBuilder.getSql()).to.contain('AS "u"')

                await queryBuilder.execute()

                const loadedUser1 = await dataSource
                    .getRepository(User)
                    .findOneBy({ name: "Muhammad Mirzoev" })
                expect(loadedUser1).to.exist

                const loadedUser2 = await dataSource
                    .getRepository(User)
                    .findOneBy({ name: "Dima Zotov" })
                expect(loadedUser2).to.exist

                const queryBuilderFromEntity = dataSource
                    .createQueryBuilder(User, "u")
                    .update()
                    .set({ name: "Brad Porter" })
                    .where("u.name = :name", { name: "Dima Zotov" })

                expect(queryBuilderFromEntity.getSql()).to.contain('AS "u"')

                await queryBuilderFromEntity.execute()

                const loadedUser3 = await dataSource
                    .getRepository(User)
                    .findOneBy({ name: "Brad Porter" })
                expect(loadedUser3).to.exist
            }),
        ))

    it("should translate an alias-qualified where condition to its database column name on postgres family", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (!DriverUtils.isPostgresFamily(dataSource.driver)) return

                const user1 = new User()
                user1.name = "Alex Messer"
                user1.team = 1
                await dataSource.manager.save(user1)

                const queryBuilder = dataSource
                    .getRepository(User)
                    .createQueryBuilder("tc")
                    .update()
                    .set({ team: 2 })
                    .where("tc.team = :team", { team: 1 })

                expect(queryBuilder.getSql()).to.not.contain("tc.team")

                await queryBuilder.execute()

                const loadedUser = await dataSource
                    .getRepository(User)
                    .findOneBy({ name: "Alex Messer" })
                expect(loadedUser!.team).to.equal(2)
            }),
        ))

    it("should qualify the discriminator column with an explicit alias on postgres family", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (!DriverUtils.isPostgresFamily(dataSource.driver)) return

                const student = new Student()
                student.name = "Alex Messer"
                student.faculty = "Economics"
                await dataSource.manager.save(student)

                const queryBuilder = dataSource
                    .getRepository(Student)
                    .createQueryBuilder("s")
                    .update()
                    .set({ faculty: "Physics" })
                    .where("name = :name", { name: "Alex Messer" })

                expect(queryBuilder.getSql()).to.contain('"s"."type"')

                await queryBuilder.execute()

                const loadedStudent = await dataSource
                    .getRepository(Student)
                    .findOneBy({ name: "Alex Messer" })
                expect(loadedStudent!.faculty).to.equal("Physics")
            }),
        ))

    it("should not add an alias when the entity's table name differs from its target name and no alias was given explicitly", () => {
        for (const dataSource of dataSources) {
            if (!DriverUtils.isPostgresFamily(dataSource.driver)) continue

            const sqlFromEntity = dataSource
                .createQueryBuilder()
                .update(AliasedPost)
                .set({ title: "Updated" })
                .where("title = :title", { title: "Hello" })
                .getSql()

            expect(sqlFromEntity).to.not.contain(" AS ")

            const sqlFromRepository = dataSource
                .getRepository(AliasedPost)
                .createQueryBuilder()
                .update()
                .set({ title: "Updated" })
                .where("title = :title", { title: "Hello" })
                .getSql()

            expect(sqlFromRepository).to.not.contain(" AS ")
        }
    })

    it("should add an explicit alias when the entity's table name differs from its target name on postgres family", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (!DriverUtils.isPostgresFamily(dataSource.driver)) return

                const post1 = new AliasedPost()
                post1.title = "Hello"
                const post2 = new AliasedPost()
                post2.title = "World"
                await dataSource.manager.save([post1, post2])

                const queryBuilder = dataSource
                    .getRepository(AliasedPost)
                    .createQueryBuilder("p")
                    .update()
                    .set({ title: "Updated Hello" })
                    .where("p.title = :title", { title: "Hello" })

                expect(queryBuilder.getSql()).to.contain('AS "p"')

                await queryBuilder.execute()

                const loadedPost1 = await dataSource
                    .getRepository(AliasedPost)
                    .findOneBy({ title: "Updated Hello" })
                expect(loadedPost1).to.exist

                const loadedPost2 = await dataSource
                    .getRepository(AliasedPost)
                    .findOneBy({ title: "World" })
                expect(loadedPost2).to.exist

                const queryBuilderFromEntity = dataSource
                    .createQueryBuilder(AliasedPost, "p")
                    .update()
                    .set({ title: "Updated World" })
                    .where("p.title = :title", { title: "World" })

                expect(queryBuilderFromEntity.getSql()).to.contain('AS "p"')

                await queryBuilderFromEntity.execute()

                const loadedPost3 = await dataSource
                    .getRepository(AliasedPost)
                    .findOneBy({ title: "Updated World" })
                expect(loadedPost3).to.exist
            }),
        ))

    it("should throw error when update value is missing", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = new User()
                user.name = "Alex Messer"

                await dataSource.manager.save(user)

                let error: Error | undefined
                try {
                    await dataSource
                        .createQueryBuilder()
                        .update(User)
                        .where("name = :name", { name: "Alex Messer" })
                        .execute()
                } catch (err) {
                    error = err
                }
                expect(error).to.be.an.instanceof(UpdateValuesMissingError)
            }),
        ))

    it("should throw error when update value is missing 2", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = new User()
                user.name = "Alex Messer"

                await dataSource.manager.save(user)

                let error: Error | undefined
                try {
                    await dataSource
                        .createQueryBuilder(User, "user")
                        .update()
                        .where("name = :name", { name: "Alex Messer" })
                        .execute()
                } catch (err) {
                    error = err
                }
                expect(error).to.be.an.instanceof(UpdateValuesMissingError)
            }),
        ))

    it("should throw error when update property in set method is unknown", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = new User()
                user.name = "Alex Messer"

                await dataSource.manager.save(user)

                let error: Error | undefined
                try {
                    await dataSource
                        .createQueryBuilder()
                        .update(User)
                        .set({ unknownProp: true } as any)
                        .where("name = :name", { name: "Alex Messer" })
                        .execute()
                } catch (err) {
                    error = err
                }
                expect(error).to.be.an.instanceof(EntityPropertyNotFoundError)
            }),
        ))

    it("should throw error when unknown property in where criteria", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = new User()
                user.name = "Alex Messer"

                await dataSource.manager.save(user)

                let error: Error | undefined
                try {
                    await dataSource
                        .createQueryBuilder()
                        .update(User)
                        .set({ name: "John Doe" } as any)
                        .where({ unknownProp: "Alex Messer" })
                        .execute()
                } catch (err) {
                    error = err
                }
                expect(error).to.be.an.instanceof(EntityPropertyNotFoundError)
            }),
        ))
})
