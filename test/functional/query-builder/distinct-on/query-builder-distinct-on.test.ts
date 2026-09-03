import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Category } from "./entity/Category"
import { User } from "./entity/User"
import { Post } from "./entity/Post"

describe("query builder > distinct on", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    async function prepareData(dataSource: DataSource) {
        const users = [
            {
                name: "Dion",
            },
            {
                name: "Zelda",
            },
            {
                name: "Sarah",
            },
            {
                name: "Pablo",
            },
        ]
        await dataSource
            .createQueryBuilder()
            .insert()
            .into(User)
            .values(users)
            .execute()

        const categories = [
            {
                title: "Category One",
                author: "Dion",
            },
            {
                title: "Category Two",
                author: "Dion",
            },
            {
                title: "Category Three",
                author: "Zelda",
            },
            {
                title: "Category Four",
                author: "Zelda",
            },
            {
                title: "Category Five",
                author: "Dion",
            },
        ]
        await dataSource
            .createQueryBuilder()
            .insert()
            .into(Category)
            .values(categories)
            .execute()

        const posts = [
            {
                title: "Post One",
                author: "Dion",
                moderator: "Dion",
            },
            {
                title: "Post Two",
                author: "Sarah",
                moderator: "Dion",
            },
            {
                title: "Post Three",
                author: "Zelda",
                moderator: "Dion",
            },
            {
                title: "Post Four",
                author: "Sarah",
                moderator: "Dion",
            },
            {
                title: "Post Five",
                author: "Pablo",
                moderator: "Sarah",
            },
        ]
        await dataSource
            .createQueryBuilder()
            .insert()
            .into(Post)
            .values(posts)
            .execute()
    }

    it("should perform distinct on category authors", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource)

                const result = await dataSource.manager
                    .createQueryBuilder(Category, "category")
                    .distinctOn(["category.author"])
                    .getMany()

                expect(result.map(({ author }) => author)).to.have.members([
                    "Dion",
                    "Zelda",
                ])
            }),
        ))

    it("should perform distinct on post authors and moderators combination", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource)

                const result = await dataSource.manager
                    .createQueryBuilder(Post, "post")
                    .distinctOn(["post.author", "post.moderator"])
                    .getMany()

                expect(
                    result.map(({ moderator }) => moderator),
                ).to.have.members(["Dion", "Sarah", "Dion", "Dion"])

                expect(result.map(({ author }) => author)).to.have.members([
                    "Dion",
                    "Pablo",
                    "Sarah",
                    "Zelda",
                ])
            }),
        ))

    it("should perform distinct on post and category authors", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource)

                const result = await dataSource.manager
                    .createQueryBuilder(Post, "post")
                    .leftJoinAndSelect(
                        Category,
                        "category",
                        "category.author = post.author",
                    )
                    .distinctOn(["post.author", "category.author"])
                    .getMany()

                expect(result.map(({ author }) => author)).to.have.members([
                    "Dion",
                    "Pablo",
                    "Sarah",
                    "Zelda",
                ])
            }),
        ))

    it("should escape unsafe values passed to distinctOn (issue #12805)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const sql = dataSource.manager
                    .createQueryBuilder(Post, "post")
                    .distinctOn([
                        "post.author), (SELECT 1 WHERE 1=1)--",
                    ])
                    .getSql()

                expect(sql).to.contain(
                    'SELECT DISTINCT ON ("post.author), (SELECT 1 WHERE 1=1)--")',
                )
            }),
        ))

    it("should correctly handle relation property paths and dotted aliases in distinctOn", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const sql1 = dataSource.manager
                    .createQueryBuilder(Post, "post")
                    .leftJoin("post.category", "post.category")
                    .distinctOn(["post.category.id"])
                    .getSql()

                expect(sql1).to.contain('DISTINCT ON ("post"."categoryId")')

                const sql2 = dataSource.manager
                    .createQueryBuilder(Post, "tenant.user")
                    .distinctOn(["tenant.user.id"])
                    .getSql()

                expect(sql2).to.contain('DISTINCT ON ("tenant.user"."id")')

                const sql3 = dataSource.manager
                    .createQueryBuilder()
                    .select()
                    .from("raw_table", "raw")
                    .distinctOn(["raw.column"])
                    .getSql()

                expect(sql3).to.contain('DISTINCT ON ("raw"."column")')
            }),
        ))
})

