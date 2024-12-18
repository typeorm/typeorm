import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { User } from "./entity/User"

describe("github issues > #6936 Removing cache using cacheIds appended with a wildcard will not work", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
            cache: {
                type: "ioredis",
                options: {
                    host: "localhost",
                    port: 6379,
                },
            },
        })
    })
    beforeEach(async () => {
        await reloadTestingDatabases(connections)
        await Promise.all(
            connections.map((connection) => {
                if (
                    connection.driver.options.type === "sap" ||
                    connection.driver.options.type === "oracle"
                )
                    return
                const repo = connection.getRepository(User)

                const usersToInsert = [...Array(10)].map((e) => {
                    const user = new User()
                    user.name = "Adam Dennis"
                    return user
                })

                return repo.save(usersToInsert)
            }),
        )
    })
    after(() => closeTestingConnections(connections))

    it("cache should be removed when removing various keys by using a wildcard (e.g. `cache:*` would remove all data/keys under `cache:`) ", () =>
        Promise.all(
            connections.map(async (connection, index) => {
                if (
                    connection.driver.options.type === "sap" ||
                    connection.driver.options.type === "oracle"
                )
                    return
                const repo = connection.getRepository(User)

                const getManyAndCount = () =>
                    repo
                        .createQueryBuilder()
                        .cache(`cache:${index}:users:1`, 60000)
                        .getManyAndCount()

                const findAndCount = () =>
                    repo.findAndCount({
                        cache: {
                            id: `cache:${index}:users:2`,
                            milliseconds: 60000,
                        },
                    })

                const [users, count] = await getManyAndCount()
                expect(users.length).equal(10)
                expect(count).equal(10)

                const [users2, count2] = await findAndCount()
                expect(users2.length).equal(10)
                expect(count2).equal(10)

                await repo.save({ name: "Jeremy Clarkson" })
                const cache = repo.manager.connection.queryResultCache
                if (cache) {
                    const cacheIds = [`cache:${index}:*`]
                    await cache.remove(cacheIds)
                }

                // After caching, both queries should be cached correctly. Save above should not affect results
                const [_users, _count] = await getManyAndCount()
                expect(_users.length).equal(11)
                expect(_count).equal(11)

                const [_users2, _count2] = await findAndCount()
                expect(_users2.length).equal(11)
                expect(_count2).equal(11)
            }),
        ))
})
