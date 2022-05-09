import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
    sleep,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { User } from "./entity/User"

describe("github issues > #8958 Caching of raw queries", async () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres"],
                cache: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should cache results properly", async () =>
        Promise.all(
            connections.map(async (connection) => {
                // first prepare data - insert users
                const user1 = new User()
                user1.firstName = "Timber"
                user1.lastName = "Saw"
                user1.isadmin = false
                await connection.manager.save(user1)

                const user2 = new User()
                user2.firstName = "Alex"
                user2.lastName = "Messer"
                user2.isadmin = false
                await connection.manager.save(user2)

                const user3 = new User()
                user3.firstName = "Umed"
                user3.lastName = "Pleerock"
                user3.isadmin = true
                await connection.manager.save(user3)

                // select for the first time with caching enabled
                // const users1 = await connection
                //     .createQueryBuilder(User, "user")
                //     .where("user.isadmin = :isadmin", { isadmin: true })
                //     .cache(true)
                //     .getMany()

                const sql1 = 'SELECT * FROM "user" u WHERE u.isadmin = true'
                const cacheDuration = 1_000

                const users1 = await connection.manager.query(sql1, undefined, {
                    cache: cacheDuration,
                })

                expect(users1.length).to.be.equal(1)

                // insert new entity
                const user4 = new User()
                user4.firstName = "Bakhrom"
                user4.lastName = "Brochik"
                user4.isadmin = true
                await connection.manager.save(user4)

                // without cache it must return really how many there entities are
                const users2 = await connection.manager.query(sql1)
                expect(users2.length).to.be.equal(2)

                // but with cache enabled it must not return newly inserted entity since cache is not expired yet
                const users3 = await connection.manager.query(sql1, undefined, {
                    cache: cacheDuration,
                })
                expect(users3.length).to.be.equal(1)

                // give some time for cache to expire
                await sleep(cacheDuration + 1)

                // now, when our cache has expired we check if we have new user inserted even with cache enabled
                const users4 = await connection.manager.query(sql1, undefined, {
                    cache: cacheDuration,
                })
                expect(users4.length).to.be.equal(2)
            }),
        ))

    it("should cache results with enabled sha identifier", async () =>
        Promise.all(
            connections.map(async (connection) => {
                // first prepare data - insert users
                const user1 = new User()
                user1.firstName = "Timber"
                user1.lastName = "Saw"
                user1.isadmin = false
                await connection.manager.save(user1)

                const user2 = new User()
                user2.firstName = "Alex"
                user2.lastName = "Messer"
                user2.isadmin = false
                await connection.manager.save(user2)

                const user3 = new User()
                user3.firstName = "Umed"
                user3.lastName = "Pleerock"
                user3.isadmin = true
                await connection.manager.save(user3)

                // select for the first time with caching enabled
                // const users1 = await connection
                //     .createQueryBuilder(User, "user")
                //     .where("user.isadmin = :isadmin", { isadmin: true })
                //     .cache(true)
                //     .getMany()

                const sql1 = 'SELECT * FROM "user" u WHERE u.isadmin = true'
                const cacheDuration = 1_000

                const users1 = await connection.manager.query(sql1, undefined, {
                    cache: cacheDuration,
                    cacheSha: true,
                })

                expect(users1.length).to.be.equal(1)

                // insert new entity
                const user4 = new User()
                user4.firstName = "Bakhrom"
                user4.lastName = "Brochik"
                user4.isadmin = true
                await connection.manager.save(user4)

                // without cache it must return really how many there entities are
                const users2 = await connection.manager.query(sql1)
                expect(users2.length).to.be.equal(2)

                // but with cache enabled it must not return newly inserted entity since cache is not expired yet
                const users3 = await connection.manager.query(sql1, undefined, {
                    cache: cacheDuration,
                    cacheSha: true,
                })
                expect(users3.length).to.be.equal(1)

                // give some time for cache to expire
                await sleep(cacheDuration + 1)

                // now, when our cache has expired we check if we have new user inserted even with cache enabled
                const users4 = await connection.manager.query(sql1, undefined, {
                    cache: cacheDuration,
                    cacheSha: true,
                })
                expect(users4.length).to.be.equal(2)
            }),
        ))
})
