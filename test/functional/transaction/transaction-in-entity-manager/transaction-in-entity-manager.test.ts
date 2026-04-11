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

describe("transaction > transaction with entity manager", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql", "better-sqlite3", "postgres"], // todo: for some reasons mariadb tests are not passing here
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should execute all operations in a single transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                let postId: number | undefined = undefined,
                    categoryId: number | undefined = undefined

                await dataSource.manager.transaction(async (entityManager) => {
                    const post = new Post()
                    post.title = "Post #1"
                    await entityManager.save(post)

                    const category = new Category()
                    category.name = "Category #1"
                    await entityManager.save(category)

                    postId = post.id
                    categoryId = category.id
                })

                const post = await dataSource.manager.findOneByOrFail(Post, {
                    title: "Post #1",
                })
                expect(post).not.to.be.null
                post.should.be.eql({
                    id: postId,
                    title: "Post #1",
                })

                const category = await dataSource.manager.findOneOrFail(
                    Category,
                    {
                        where: { name: "Category #1" },
                    },
                )
                expect(category).not.to.be.null
                category.should.be.eql({
                    id: categoryId,
                    name: "Category #1",
                })
            }),
        ))

    it("should not save anything if any of operation in transaction fail", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                let postId: number | undefined = undefined,
                    categoryId: number | undefined = undefined

                try {
                    await dataSource.manager.transaction(
                        async (entityManager) => {
                            const post = new Post()
                            post.title = "Post #1"
                            await entityManager.save(post)

                            const category = new Category()
                            category.name = "Category #1"
                            await entityManager.save(category)

                            postId = post.id
                            categoryId = category.id

                            const loadedPost =
                                await entityManager.findOneByOrFail(Post, {
                                    title: "Post #1",
                                })
                            expect(loadedPost).not.to.be.null
                            loadedPost.should.be.eql({
                                id: postId,
                                title: "Post #1",
                            })

                            const loadedCategory =
                                await entityManager.findOneByOrFail(Category, {
                                    name: "Category #1",
                                })
                            expect(loadedCategory).not.to.be.null
                            loadedCategory.should.be.eql({
                                id: categoryId,
                                name: "Category #1",
                            })

                            // now try to save post without title - it will fail and transaction will be reverted
                            const wrongPost = new Post()
                            await entityManager.save(wrongPost)
                        },
                    )
                } catch {
                    /* skip error */
                }

                const post = await dataSource.manager.findOneBy(Post, {
                    title: "Post #1",
                })
                expect(post).to.be.null

                const category = await dataSource.manager.findOneBy(Category, {
                    name: "Category #1",
                })
                expect(category).to.be.null
            }),
        ))
})
