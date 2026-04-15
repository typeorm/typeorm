import "reflect-metadata"

import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

import { Post } from "./entity/Post"

describe("github issues > #12308 Race condition with concurrent nested transactions and SAVEPOINTS", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("concurrent nested transactions should not conflict on SAVEPOINT names", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager.transaction(async (outerEm) => {
                    await Promise.all(
                        Array.from({ length: 5 }, (_, i) =>
                            outerEm.transaction(async (innerEm) => {
                                const post = new Post()
                                post.title = `Post ${i}`
                                await innerEm.save(post)
                            }),
                        ),
                    )
                })

                const posts = await dataSource.manager.find(Post)
                posts.length.should.be.equal(5)
            }),
        ))

    it("outer transaction should not crash when a concurrent nested transaction fails", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager.transaction(async (outerEm) => {
                    await Promise.all(
                        Array.from({ length: 5 }, (_, i) =>
                            outerEm
                                .transaction(async (innerEm) => {
                                    const post = new Post()
                                    post.title = `Post ${i}`
                                    await innerEm.save(post)
                                    if (i === 2) {
                                        throw new Error("intentional failure")
                                    }
                                })
                                .catch((err) => {
                                    if (err.message !== "intentional failure") {
                                        throw err
                                    }
                                }),
                        ),
                    )
                })

                const count = await dataSource.manager.count(Post)
                count.should.be.a("number")
            }),
        ))
})
