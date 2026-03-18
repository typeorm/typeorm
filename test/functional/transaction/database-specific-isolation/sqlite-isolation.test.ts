import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import { expect } from "chai"

describe("transaction > transaction with sqlite dataSource partial isolation support", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["better-sqlite3"], // todo: for some reasons mariadb tests are not passing here
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should execute all operations in a single transaction with READ UNCOMMITTED isolation level", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                let postId: number | undefined = undefined,
                    categoryId: number | undefined = undefined

                await dataSource.manager.transaction(
                    "READ UNCOMMITTED",
                    async (entityManager) => {
                        const post = new Post()
                        post.title = "Post #1"
                        await entityManager.save(post)

                        const category = new Category()
                        category.name = "Category #1"
                        await entityManager.save(category)

                        postId = post.id
                        categoryId = category.id
                    },
                )

                const post = await dataSource.manager.findOne(Post, {
                    where: { title: "Post #1" },
                })
                expect(post).not.to.be.null
                post!.should.be.eql({
                    id: postId,
                    title: "Post #1",
                })

                const category = await dataSource.manager.findOne(Category, {
                    where: { name: "Category #1" },
                })
                expect(category).not.to.be.null
                category!.should.be.eql({
                    id: categoryId,
                    name: "Category #1",
                })
            }),
        ))

    it("should execute all operations in a single transaction with SERIALIZABLE isolation level", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                let postId: number | undefined = undefined,
                    categoryId: number | undefined = undefined

                await dataSource.manager.transaction(
                    "SERIALIZABLE",
                    async (entityManager) => {
                        const post = new Post()
                        post.title = "Post #1"
                        await entityManager.save(post)

                        const category = new Category()
                        category.name = "Category #1"
                        await entityManager.save(category)

                        postId = post.id
                        categoryId = category.id
                    },
                )

                const post = await dataSource.manager.findOne(Post, {
                    where: { title: "Post #1" },
                })
                expect(post).not.to.be.null
                post!.should.be.eql({
                    id: postId,
                    title: "Post #1",
                })

                const category = await dataSource.manager.findOne(Category, {
                    where: { name: "Category #1" },
                })
                expect(category).not.to.be.null
                category!.should.be.eql({
                    id: categoryId,
                    name: "Category #1",
                })
            }),
        ))
})
