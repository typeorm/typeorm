import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Author } from "./entity/Author"
import { Post } from "./entity/Post"

describe("relations > load-strategy > withDeleted", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    const setup = async (dataSource: DataSource) => {
        const author = await dataSource
            .getRepository(Author)
            .save({ name: "alice" })
        const [, removed] = await dataSource.getRepository(Post).save([
            { title: "kept", author },
            { title: "removed", author },
        ])
        await dataSource.getRepository(Post).softRemove(removed)
    }

    for (const strategy of ["join", "query"] as const) {
        describe(strategy, () => {
            it("loads soft-deleted entities of a one-to-many relation", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await setup(dataSource)
                        const find = async (withDeleted: boolean) => {
                            const [author] = await dataSource
                                .getRepository(Author)
                                .find({
                                    relations: { posts: true },
                                    relationLoadStrategy: strategy,
                                    order: { posts: { id: "ASC" } },
                                    withDeleted,
                                })
                            return author
                        }

                        const all = await find(true)
                        const kept = await find(false)

                        expect(all.posts.map((post) => post.title)).to.eql([
                            "kept",
                            "removed",
                        ])
                        expect(kept.posts.map((post) => post.title)).to.eql([
                            "kept",
                        ])
                    }),
                ))

            it("loads the many-to-one relation of soft-deleted entities", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        await setup(dataSource)

                        const removed = await dataSource
                            .getRepository(Post)
                            .findOneOrFail({
                                where: { title: "removed" },
                                relations: { author: true },
                                relationLoadStrategy: strategy,
                                withDeleted: true,
                            })

                        expect(removed.author.name).to.equal("alice")
                    }),
                ))
        })
    }
})
