import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { User } from "./entity/User"
import { Photo } from "./entity/Photo"
import { AliasedPost } from "./entity/AliasedPost"
import { Student } from "./entity/Student"
import { EntityPropertyNotFoundError } from "../../../../src/error/EntityPropertyNotFoundError"
import { DriverUtils } from "../../../../src/driver/DriverUtils"

describe("query builder > delete", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should perform deletion correctly", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user1 = new User()
                user1.name = "Alex Messer"
                await dataSource.manager.save(user1)

                await dataSource
                    .createQueryBuilder()
                    .delete()
                    .from(User)
                    .where("name = :name", { name: "Alex Messer" })
                    .execute()

                const loadedUser1 = await dataSource
                    .getRepository(User)
                    .findOneBy({ name: "Dima Zotov" })
                expect(loadedUser1).to.not.exist

                const user2 = new User()
                user2.name = "Alex Messer"
                await dataSource.manager.save(user2)

                await dataSource
                    .getRepository(User)
                    .createQueryBuilder("myUser")
                    .delete()
                    .where("name = :name", { name: "Dima Zotov" })
                    .execute()

                const loadedUser2 = await dataSource
                    .getRepository(User)
                    .findOneBy({ name: "Dima Zotov" })
                expect(loadedUser2).to.not.exist
            }),
        ))

    it("should be able to delete entities by embed criteria", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // save few photos
                await dataSource.manager.save(Photo, { url: "1.jpg" })
                await dataSource.manager.save(Photo, {
                    url: "2.jpg",
                    counters: {
                        likes: 2,
                        favorites: 1,
                        comments: 1,
                    },
                })
                await dataSource.manager.save(Photo, { url: "3.jpg" })

                // make sure photo with likes = 2 exist
                const loadedPhoto1 = await dataSource
                    .getRepository(Photo)
                    .findOneBy({ counters: { likes: 2 } })
                expect(loadedPhoto1).to.exist
                loadedPhoto1!.should.be.eql({
                    id: 2,
                    url: "2.jpg",
                    counters: {
                        likes: 2,
                        favorites: 1,
                        comments: 1,
                    },
                })

                // delete photo now
                await dataSource
                    .getRepository(Photo)
                    .createQueryBuilder("photo")
                    .delete()
                    .where({
                        counters: {
                            likes: 2,
                        },
                    })
                    .execute()

                const loadedPhoto2 = await dataSource
                    .getRepository(Photo)
                    .findOneBy({ url: "1.jpg" })
                expect(loadedPhoto2).to.exist

                const loadedPhoto3 = await dataSource
                    .getRepository(Photo)
                    .findOneBy({ url: "2.jpg" })
                expect(loadedPhoto3).not.to.exist

                const loadedPhoto4 = await dataSource
                    .getRepository(Photo)
                    .findOneBy({ url: "3.jpg" })
                expect(loadedPhoto4).to.exist
            }),
        ))

    it("should return correct delete result", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // save some users
                const user1 = new User()
                user1.name = "John Doe"
                const user2 = new User()
                user2.name = "Jane Doe"
                await dataSource.manager.save([user1, user2])

                const result = await dataSource
                    .createQueryBuilder()
                    .delete()
                    .from(User, "user")
                    .where("name IS NOT NULL")
                    .execute()

                expect(result.affected).to.equal(2)
            }),
        ))

    it("should not add an alias on unsupported dialects", () => {
        for (const dataSource of dataSources) {
            if (DriverUtils.isPostgresFamily(dataSource.driver)) continue

            const sqlWithoutAlias = dataSource
                .createQueryBuilder()
                .delete()
                .from(User)
                .where("name = :name", { name: "Alex Messer" })
                .getSql()

            expect(sqlWithoutAlias).to.not.contain(" AS ")

            const sqlWithAlias = dataSource
                .createQueryBuilder()
                .delete()
                .from(User, "u")
                .where("name = :name", { name: "Alex Messer" })
                .getSql()

            expect(sqlWithAlias).to.not.contain(" AS ")

            const sqlFromRepository = dataSource
                .getRepository(User)
                .createQueryBuilder()
                .delete()
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
                .delete()
                .from(User)
                .where("name = :name", { name: "Alex Messer" })
                .getSql()

            expect(sqlFromEntity).to.not.contain(" AS ")

            const tableName = dataSource.getMetadata(User).tablePath
            const sqlFromTableName = dataSource
                .createQueryBuilder()
                .delete()
                .from(tableName)
                .where("name = :name", { name: "Alex Messer" })
                .getSql()

            expect(sqlFromTableName).to.not.contain(" AS ")

            const sqlFromRepository = dataSource
                .getRepository(User)
                .createQueryBuilder()
                .delete()
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
                    .createQueryBuilder()
                    .delete()
                    .from(User, "u")
                    .where("u.name = :name", { name: "Alex Messer" })

                expect(queryBuilder.getSql()).to.contain('"user" "u"')

                await queryBuilder.execute()

                const loadedUser1 = await dataSource
                    .getRepository(User)
                    .findOneBy({ name: "Alex Messer" })
                expect(loadedUser1).to.not.exist

                const loadedUser2 = await dataSource
                    .getRepository(User)
                    .findOneBy({ name: "Dima Zotov" })
                expect(loadedUser2).to.exist

                const queryBuilderFromRepository = dataSource
                    .getRepository(User)
                    .createQueryBuilder("u")
                    .delete()
                    .where("u.name = :name", { name: "Dima Zotov" })

                expect(queryBuilderFromRepository.getSql()).to.contain(
                    '"user" "u"',
                )

                await queryBuilderFromRepository.execute()

                const loadedUser3 = await dataSource
                    .getRepository(User)
                    .findOneBy({ name: "Dima Zotov" })
                expect(loadedUser3).to.not.exist

                const user3 = new User()
                user3.name = "Brad Porter"
                await dataSource.manager.save(user3)

                const queryBuilderFromEntityAlias = dataSource
                    .createQueryBuilder(User, "u")
                    .delete()
                    .where("u.name = :name", { name: "Brad Porter" })

                expect(queryBuilderFromEntityAlias.getSql()).to.contain(
                    '"user" "u"',
                )

                await queryBuilderFromEntityAlias.execute()

                const loadedUser4 = await dataSource
                    .getRepository(User)
                    .findOneBy({ name: "Brad Porter" })
                expect(loadedUser4).to.not.exist
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
                    .delete()
                    .where("tc.team = :team", { team: 1 })

                expect(queryBuilder.getSql()).to.not.contain("tc.team")

                await queryBuilder.execute()

                const loadedUser = await dataSource
                    .getRepository(User)
                    .findOneBy({ name: "Alex Messer" })
                expect(loadedUser).to.not.exist
            }),
        ))

    it("should still translate an unqualified where condition to its database column name when an explicit alias is set on postgres family", () =>
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
                    .delete()
                    .where("team = :team", { team: 1 })

                expect(queryBuilder.getSql()).to.not.contain(" team ")

                await queryBuilder.execute()

                const loadedUser = await dataSource
                    .getRepository(User)
                    .findOneBy({ name: "Alex Messer" })
                expect(loadedUser).to.not.exist
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
                    .delete()
                    .where("name = :name", { name: "Alex Messer" })

                expect(queryBuilder.getSql()).to.contain('"s"."type"')

                await queryBuilder.execute()

                const loadedStudent = await dataSource
                    .getRepository(Student)
                    .findOneBy({ name: "Alex Messer" })
                expect(loadedStudent).to.not.exist
            }),
        ))

    it("should not add an alias when the entity's table name differs from its target name and no alias was given explicitly", () => {
        for (const dataSource of dataSources) {
            if (!DriverUtils.isPostgresFamily(dataSource.driver)) continue

            const sqlFromEntity = dataSource
                .createQueryBuilder()
                .delete()
                .from(AliasedPost)
                .where("title = :title", { title: "Hello" })
                .getSql()

            expect(sqlFromEntity).to.not.contain(" AS ")

            const sqlFromRepository = dataSource
                .getRepository(AliasedPost)
                .createQueryBuilder()
                .delete()
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
                    .createQueryBuilder()
                    .delete()
                    .from(AliasedPost, "p")
                    .where("p.title = :title", { title: "Hello" })

                expect(queryBuilder.getSql()).to.contain('"post_table" "p"')

                await queryBuilder.execute()

                const loadedPost1 = await dataSource
                    .getRepository(AliasedPost)
                    .findOneBy({ title: "Hello" })
                expect(loadedPost1).to.not.exist

                const loadedPost2 = await dataSource
                    .getRepository(AliasedPost)
                    .findOneBy({ title: "World" })
                expect(loadedPost2).to.exist

                const queryBuilderFromRepository = dataSource
                    .getRepository(AliasedPost)
                    .createQueryBuilder("p")
                    .delete()
                    .where("p.title = :title", { title: "World" })

                expect(queryBuilderFromRepository.getSql()).to.contain(
                    '"post_table" "p"',
                )

                await queryBuilderFromRepository.execute()

                const loadedPost3 = await dataSource
                    .getRepository(AliasedPost)
                    .findOneBy({ title: "World" })
                expect(loadedPost3).to.not.exist
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
                        .delete()
                        .from(User)
                        .where({ unknownProp: "Alex Messer" })
                        .execute()
                } catch (err) {
                    error = err
                }
                expect(error).to.be.an.instanceof(EntityPropertyNotFoundError)
            }),
        ))
})
