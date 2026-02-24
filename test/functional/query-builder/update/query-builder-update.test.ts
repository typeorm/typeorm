import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { User } from "./entity/User"
import { LimitOnUpdateNotSupportedError } from "../../../../src/error/LimitOnUpdateNotSupportedError"
import { Photo } from "./entity/Photo"
import { UpdateValuesMissingError } from "../../../../src/error/UpdateValuesMissingError"
import { EntityPropertyNotFoundError } from "../../../../src/error/EntityPropertyNotFoundError"
import { DriverUtils } from "../../../../src/driver/DriverUtils"
import { PostWithOnUpdate } from "./entity/PostWithOnUpdate"
import { In } from "../../../../src"
import { setTimeout } from "timers/promises"

const onUpdateExpressionByDriver: Record<string, string | undefined> = {
    postgres: "clock_timestamp()",
    cockroachdb: "clock_timestamp()",
    mysql: "CURRENT_TIMESTAMP(6)",
    mariadb: "CURRENT_TIMESTAMP(6)",
    "aurora-mysql": "CURRENT_TIMESTAMP(6)",
    sqlite: "datetime('now')",
    "better-sqlite3": "datetime('now')",
    cordova: "datetime('now')",
    capacitor: "datetime('now')",
    "react-native": "datetime('now')",
    mssql: "getdate()",
    sap: "CURRENT_TIMESTAMP",
    oracle: "CURRENT_TIMESTAMP",
}

function getOnUpdateExpression(connection: DataSource) {
    return (
        onUpdateExpressionByDriver[connection.driver.options.type] ||
        connection.driver.mappedDataTypes.updateDateDefault
    )
}

describe("query builder > update", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should perform updation correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alex Messer"

                await connection.manager.save(user)

                await connection
                    .createQueryBuilder()
                    .update(User)
                    .set({ name: "Dima Zotov" })
                    .where("name = :name", { name: "Alex Messer" })
                    .execute()

                const loadedUser1 = await connection
                    .getRepository(User)
                    .findOneBy({ name: "Dima Zotov" })
                expect(loadedUser1).to.exist
                loadedUser1!.name.should.be.equal("Dima Zotov")

                await connection
                    .getRepository(User)
                    .createQueryBuilder("myUser")
                    .update()
                    .set({ name: "Muhammad Mirzoev" })
                    .where("name = :name", { name: "Dima Zotov" })
                    .execute()

                const loadedUser2 = await connection
                    .getRepository(User)
                    .findOneBy({ name: "Muhammad Mirzoev" })
                expect(loadedUser2).to.exist
                loadedUser2!.name.should.be.equal("Muhammad Mirzoev")
            }),
        ))

    it("should be able to use sql functions", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alex Messer"

                await connection.manager.save(user)

                await connection
                    .createQueryBuilder()
                    .update(User)
                    .set({
                        name: () =>
                            connection.driver.options.type === "mssql"
                                ? "SUBSTRING('Dima Zotov', 1, 4)"
                                : "SUBSTR('Dima Zotov', 1, 4)",
                    })
                    .where("name = :name", {
                        name: "Alex Messer",
                    })
                    .execute()

                const loadedUser1 = await connection
                    .getRepository(User)
                    .findOneBy({ name: "Dima" })
                expect(loadedUser1).to.exist
                loadedUser1!.name.should.be.equal("Dima")
            }),
        ))

    it("should update and escape properly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Dima"
                user.likesCount = 1

                await connection.manager.save(user)

                const qb = connection.createQueryBuilder()
                await qb
                    .update(User)
                    .set({ likesCount: () => qb.escape(`likesCount`) + " + 1" })
                    // .set({ likesCount: 2 })
                    .where("likesCount = 1")
                    .execute()

                const loadedUser1 = await connection
                    .getRepository(User)
                    .findOneBy({ likesCount: 2 })
                expect(loadedUser1).to.exist
                loadedUser1!.name.should.be.equal("Dima")
            }),
        ))

    it("should update properties inside embeds as well", () =>
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

                // update photo now
                await connection
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

                const loadedPhoto1 = await connection
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

                const loadedPhoto2 = await connection
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
            connections.map(async (connection) => {
                const user1 = new User()
                user1.name = "Alex Messer"
                const user2 = new User()
                user2.name = "Muhammad Mirzoev"
                const user3 = new User()
                user3.name = "Brad Porter"

                await connection.manager.save([user1, user2, user3])

                const limitNum = 2
                const nameToFind = "Dima Zotov"

                if (DriverUtils.isMySQLFamily(connection.driver)) {
                    await connection
                        .createQueryBuilder()
                        .update(User)
                        .set({ name: nameToFind })
                        .limit(limitNum)
                        .execute()

                    const loadedUsers = await connection
                        .getRepository(User)
                        .findBy({ name: nameToFind })
                    expect(loadedUsers).to.exist
                    loadedUsers!.length.should.be.equal(limitNum)
                } else {
                    await connection
                        .createQueryBuilder()
                        .update(User)
                        .set({ name: nameToFind })
                        .limit(limitNum)
                        .execute()
                        .should.be.rejectedWith(LimitOnUpdateNotSupportedError)
                }
            }),
        ))

    it("should throw error when update value is missing", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alex Messer"

                await connection.manager.save(user)

                let error: Error | undefined
                try {
                    await connection
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

    it("should respect onUpdate expression for update date columns", () =>
        Promise.all(
            connections.map(async (connection) => {
                const expression = getOnUpdateExpression(connection)
                if (!expression) return

                const metadata = connection
                    .getMetadata(PostWithOnUpdate)
                    .findColumnWithPropertyName("updatedAt")!
                metadata.onUpdate = expression

                const post = new PostWithOnUpdate()
                post.title = "initial"
                post.updatedAt = new Date(Date.now() - 1000)
                await connection.manager.save(post)

                const initialDate = post.updatedAt

                const qb = connection
                    .createQueryBuilder()
                    .update(PostWithOnUpdate)
                    .set({ title: "updated" })
                    .where("id = :id", { id: post.id })

                expect(qb.getQuery()).to.contain(expression)

                await qb.execute()

                const updated = await connection.manager.findOneBy(
                    PostWithOnUpdate,
                    { id: post.id },
                )

                expect(updated).to.exist
                expect(updated!.updatedAt).to.be.instanceof(Date)
                expect(updated!.updatedAt.getTime()).to.be.greaterThan(
                    initialDate.getTime(),
                )
            }),
        ))

    it("postgres should store different update dates in one statement with clock_timestamp()", async () => {
        const connection = connections.find(
            (conn) => conn.driver.options.type === "postgres",
        )
        if (!connection) return

        const metadata = connection
            .getMetadata(PostWithOnUpdate)
            .findColumnWithPropertyName("updatedAt")!
        metadata.onUpdate = "clock_timestamp()"

        const queryRunner = connection.createQueryRunner()
        await queryRunner.startTransaction()
        let post1Id: number | undefined
        let post2Id: number | undefined
        try {
            const post1 = new PostWithOnUpdate()
            post1.title = "first"
            post1.updatedAt = new Date(Date.now() - 2000)

            const post2 = new PostWithOnUpdate()
            post2.title = "second"
            post2.updatedAt = new Date(Date.now() - 2000)

            await queryRunner.manager.save([post1, post2])
            post1Id = post1.id
            post2Id = post2.id

            const qb = queryRunner.manager
                .createQueryBuilder()
                .update(PostWithOnUpdate)
                .set({ title: () => "title || '_updated'" })

            await qb.clone().where("id = :id", { id: post1Id }).execute()
            await setTimeout(10)
            await qb.clone().where("id = :id", { id: post2Id }).execute()

            await queryRunner.commitTransaction()
        } catch (err) {
            await queryRunner.rollbackTransaction()
            throw err
        } finally {
            await queryRunner.release()
        }

        const reloaded = await connection.manager.findBy(PostWithOnUpdate, {
            id: In([post1Id!, post2Id!]),
        })

        expect(reloaded).to.have.length(2)
        const byId = new Map(reloaded.map((p) => [p.id, p]))
        const updated1 = byId.get(post1Id!)!
        const updated2 = byId.get(post2Id!)!

        expect(updated1.updatedAt).to.be.instanceof(Date)
        expect(updated2.updatedAt).to.be.instanceof(Date)
        expect(updated1.updatedAt.getTime()).to.be.below(
            updated2.updatedAt.getTime(),
        )
    })

    it("should throw error when update value is missing 2", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alex Messer"

                await connection.manager.save(user)

                let error: Error | undefined
                try {
                    await connection
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
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alex Messer"

                await connection.manager.save(user)

                let error: Error | undefined
                try {
                    await connection
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
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alex Messer"

                await connection.manager.save(user)

                let error: Error | undefined
                try {
                    await connection
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
