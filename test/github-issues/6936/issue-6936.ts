import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { User } from "./entity/User"

describe("github issues > #6936 Removing cache using cacheIds appended with a wildcard will not work", async () => {
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
            connections.map((conn) => {
                const repo = conn.getRepository(User)

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

    it("getManyAndCount and findAndCount should count correctly when using cacheId", async () =>
        Promise.all(
            connections.map(async (connection, idx) => {
                const repo = connection.getRepository(User)

                const getManyAndCount = async () =>
                    await repo
                        .createQueryBuilder()
                        .cache(`cache:${idx}:1`, 60000)
                        .getManyAndCount()

                const findAndCount = async () =>
                    await repo.findAndCount({
                        cache: {
                            id: `cache:${idx}:2`,
                            milliseconds: 60000,
                        },
                    })

                const [users, count] = await getManyAndCount()
                console.log(`Count is ${count}`)
                expect(users.length).equal(10)
                expect(count).equal(10)

                const [users2, count2] = await findAndCount()
                expect(users2.length).equal(10)
                expect(count2).equal(10)

                await repo.save({ name: "Jeremy Clarkson" })
                const cache = repo.manager.connection.queryResultCache
                if (cache) {
                    const cacheIds = [`cache:${idx}:*`]
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
