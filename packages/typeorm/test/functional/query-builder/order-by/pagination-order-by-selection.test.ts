import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { Comment } from "./entity/Comment"

// tests fix for issue https://github.com/typeorm/typeorm/issues/7502
describe("query builder > order-by > pagination with a column that is not selected", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    const seed = async (dataSource: DataSource) => {
        const posts = await dataSource.manager.save(
            [1, 2].map((myOrder) => {
                const post = new Post()
                post.myOrder = myOrder
                return post
            }),
        )

        await dataSource.manager.save(
            posts.map((post, index) => {
                const comment = new Comment()
                comment.text = `comment ${index + 1}`
                comment.post = post
                return comment
            }),
        )
    }

    it("should order by a relation column that is joined only for ordering", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seed(dataSource)

                const comments = await dataSource.getRepository(Comment).find({
                    order: { post: { myOrder: "DESC" } },
                    take: 10,
                })

                expect(comments.map((comment) => comment.text)).to.eql([
                    "comment 2",
                    "comment 1",
                ])
            }),
        ))

    it("should order by a column left out of a partial selection", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seed(dataSource)

                const comments = await dataSource.getRepository(Comment).find({
                    select: { id: true },
                    relations: { post: true },
                    order: { text: "DESC" },
                    take: 10,
                })

                expect(comments.map((comment) => comment.id)).to.eql([2, 1])
            }),
        ))

    it("should order by a column of a join that is not selected", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seed(dataSource)

                const comments = await dataSource
                    .createQueryBuilder(Comment, "comment")
                    .leftJoin("comment.post", "post")
                    .orderBy("post.myOrder", "DESC")
                    .take(10)
                    .getMany()

                expect(comments.map((comment) => comment.text)).to.eql([
                    "comment 2",
                    "comment 1",
                ])
            }),
        ))

    it("should order by a relation column when relations are loaded with separate queries", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seed(dataSource)

                const comment = await dataSource
                    .getRepository(Comment)
                    .findOneOrFail({
                        where: { text: "comment 1" },
                        relations: { post: true },
                        order: { post: { myOrder: "DESC" } },
                        relationLoadStrategy: "query",
                    })

                expect(comment.post.myOrder).to.equal(1)
            }),
        ))
})
