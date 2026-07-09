import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"

describe("github issues > #12666 take(0) combined with a join returns all rows instead of an empty array", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            disabledDrivers: ["spanner"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(async () => {
        await reloadTestingDatabases(dataSources)
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const categories = await dataSource
                    .getRepository(Category)
                    .save([{ name: "a" }, { name: "b" }, { name: "c" }])

                await dataSource.getRepository(Post).save([
                    {
                        title: "post #1",
                        categories: [categories[0], categories[1]],
                    },
                    {
                        title: "post #2",
                        categories: [categories[1], categories[2]],
                    },
                    {
                        title: "post #3",
                        categories: [categories[0], categories[2]],
                    },
                ])
            }),
        )
    })
    after(() => closeTestingConnections(dataSources))

    it("should return an empty result set for take(0) with a join, like the no-join path already does", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const withJoin = await dataSource
                    .createQueryBuilder(Post, "post")
                    .leftJoinAndSelect("post.categories", "category")
                    .orderBy("post.id")
                    .take(0)
                    .getMany()
                expect(withJoin).to.have.length(0)

                // sanity: the no-join path is already correct and must stay so
                const withoutJoin = await dataSource
                    .createQueryBuilder(Post, "post")
                    .orderBy("post.id")
                    .take(0)
                    .getMany()
                expect(withoutJoin).to.have.length(0)
            }),
        ))

    it("should report zero rows but the full count from getManyAndCount for take(0) with a join", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const [rows, count] = await dataSource
                    .createQueryBuilder(Post, "post")
                    .leftJoinAndSelect("post.categories", "category")
                    .orderBy("post.id")
                    .take(0)
                    .getManyAndCount()

                expect(rows).to.have.length(0)
                expect(count).to.equal(3)
            }),
        ))

    it("should still return all rows for skip(0) with a join, since offset 0 is a no-op", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const rows = await dataSource
                    .createQueryBuilder(Post, "post")
                    .leftJoinAndSelect("post.categories", "category")
                    .orderBy("post.id")
                    .skip(0)
                    .getMany()

                expect(rows).to.have.length(3)
            }),
        ))
})
