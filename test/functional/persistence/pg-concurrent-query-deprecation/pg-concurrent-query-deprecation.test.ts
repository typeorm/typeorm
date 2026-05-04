import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { Tag } from "./entity/Tag"

describe("persistence > pg concurrent query deprecation (#12238)", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post, Tag],
            schemaCreate: true,
            dropSchema: true,
            // spanner cannot insert two ManyToMany junction rows that share a
            // generated primary key inside the same mutation batch.
            disabledDrivers: ["spanner"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should keep relationLoadStrategy: 'query' working with ManyToMany on every supported driver except spanner", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const tag1 = new Tag()
                tag1.name = "ts"
                const tag2 = new Tag()
                tag2.name = "orm"
                const post = new Post()
                post.title = "Hello"
                post.tags = [tag1, tag2]

                await dataSource.manager.save(post)

                const found = await dataSource.manager.find(Post, {
                    relations: { tags: true },
                    relationLoadStrategy: "query",
                    order: { id: "ASC" },
                })

                expect(found).to.have.length(1)
                expect(found[0].title).to.equal("Hello")
                expect(found[0].tags.map((t) => t.name).sort()).to.deep.equal([
                    "orm",
                    "ts",
                ])
            }),
        ))

    it("should not emit pg 'client.query already executing' warning during relationLoadStrategy: 'query' on postgres or cockroachdb", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const driverType = dataSource.options.type
                if (driverType !== "postgres" && driverType !== "cockroachdb")
                    return

                const captured: string[] = []
                const handler = (warning: Error) => {
                    captured.push(`${warning.name}: ${warning.message}`)
                }
                process.on("warning", handler)
                try {
                    // Build a small set of related entities so several relation-load paths fire.
                    const posts: Post[] = []
                    for (let i = 0; i < 3; i++) {
                        const tag = new Tag()
                        tag.name = `tag-${i}`
                        const post = new Post()
                        post.title = `post-${i}`
                        post.tags = [tag]
                        posts.push(post)
                    }
                    await dataSource.manager.save(posts)

                    await dataSource.manager.save(posts, { chunk: 1 })

                    await dataSource.manager.find(Post, {
                        relations: { tags: true },
                        relationLoadStrategy: "query",
                    })

                    // Save again to exercise SubjectDatabaseEntityLoader / SubjectExecutor update path.
                    posts.forEach((p, i) => {
                        p.title = `post-${i}-updated`
                    })
                    await dataSource.manager.save(posts)
                    await dataSource.manager.softRemove(posts)
                    await dataSource.manager.recover(posts)
                } finally {
                    process.off("warning", handler)
                }

                const offending = captured.filter((m) =>
                    m.includes(
                        "Calling client.query() when the client is already executing a query",
                    ),
                )
                expect(offending).to.deep.equal(
                    [],
                    `pg deprecation warning leaked: ${offending.join(" | ")}`,
                )
            }),
        ))
})
