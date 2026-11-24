import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Category } from "./entity/Category"
import { Post } from "./entity/Post"

describe("query builder > property name replacement", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post, Category],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should replace the property names of a query which is built again", () => {
        for (const dataSource of dataSources) {
            const build = () =>
                dataSource.manager
                    .createQueryBuilder(Post, "post")
                    .where("post.title = :title", { title: "a" })
                    .getQuery()

            const first = build()
            const second = build()

            expect(first).to.contain(
                `${dataSource.driver.escape("post")}.${dataSource.driver.escape("post_title")} =`,
            )
            expect(second).to.equal(first)
        }
    })

    it("should replace the property names of an alias by the entity of the alias", () => {
        for (const dataSource of dataSources) {
            const build = (entity: typeof Post | typeof Category) =>
                dataSource.manager
                    .createQueryBuilder(entity, "item")
                    .where("item.title = :title", { title: "a" })
                    .getQuery()

            const item = dataSource.driver.escape("item")
            expect(build(Post)).to.contain(
                `${item}.${dataSource.driver.escape("post_title")} =`,
            )
            expect(build(Category)).to.contain(
                `${item}.${dataSource.driver.escape("category_title")} =`,
            )
            expect(build(Post)).to.contain(
                `${item}.${dataSource.driver.escape("post_title")} =`,
            )
        }
    })

    it("should replace the property names of a query after many other queries", () => {
        for (const dataSource of dataSources) {
            const build = (parameter: string) =>
                dataSource.manager
                    .createQueryBuilder(Post, "post")
                    .where(`post.title = :${parameter}`, {
                        [parameter]: "a",
                    })
                    .getQuery()

            const first = build("title")
            for (let i = 0; i < 1000; i++) {
                build(`title${i}`)
            }

            expect(build("title")).to.equal(first)
        }
    })

    it("should replace the property names of a long query", () => {
        for (const dataSource of dataSources) {
            const titles = Array.from({ length: 1000 }, (_, i) => `title${i}`)
            const query = dataSource.manager
                .createQueryBuilder(Post, "post")
                .where(
                    titles
                        .map((title) => `post.title = :${title}`)
                        .join(" OR "),
                )
                .getQuery()

            expect(query.length).to.be.greaterThan(20_000)
            expect(query).not.to.contain("post.title")
            expect(query).to.contain(
                `${dataSource.driver.escape("post")}.${dataSource.driver.escape("post_title")} = :title999`,
            )
        }
    })

    it("should run a query which is built again", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager.save(Post, { title: "a" })
                await dataSource.manager.save(Post, { title: "b" })

                const find = (title: string) =>
                    dataSource.manager
                        .createQueryBuilder(Post, "post")
                        .where("post.title = :title", { title })
                        .getMany()

                expect((await find("a")).map((post) => post.title)).to.eql([
                    "a",
                ])
                expect((await find("b")).map((post) => post.title)).to.eql([
                    "b",
                ])
            }),
        ))
})
